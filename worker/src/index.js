// AI School — form backend (Cloudflare Worker)
// POST /api/lead          — form submissions from the website -> Telegram admin chat
// POST /telegram/webhook  — OPTIONAL: status buttons + admin replies (only if the bot has no other backend)
// GET  /health            — simple health check (no secrets)
//
// Secrets (wrangler secret put ...): TG_BOT_TOKEN, TG_ADMIN_CHAT_ID, [TURNSTILE_SECRET], [TG_WEBHOOK_SECRET]
// Vars (wrangler.toml): ALLOWED_ORIGINS, [ADMIN_USER_IDS]
import { keyboard, leadText, withEvent, personName, STATUSES, ID_MARK } from './format.js';

const MAX_BODY = 12000;
const LIMITS = { name: 80, phone: 22, course: 120, time: 120, comment: 1000, tg: 33, service: 120, details: 2500, budget: 80, deadline: 80 };

// ---------------------------------------------------------------- helpers
function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra },
  });
}
function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
}
function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
// Strip control characters, normalise whitespace.
function clean(v, max, multiline = false) {
  if (v == null) return '';
  let s = String(v).normalize('NFC');
  s = multiline ? s.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000B-\u001F\u007F​-‏‪-‮⁦-⁩]/g, '')
                : s.replace(/[\u0000-\u001F\u007F​-‏‪-‮⁦-⁩]/g, ' ');
  s = multiline ? s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n') : s.replace(/\s+/g, ' ');
  s = s.trim();
  return s.length > max ? null : s; // null = too long
}
function normPhone(v) {
  const raw = String(v || '').trim();
  let d = raw.replace(/\D/g, '');
  if (d.length === 9 && !raw.startsWith('+')) d = '998' + d;
  if (/^998\d{9}$/.test(d)) return `+998 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
  if (raw.startsWith('+') && d.length >= 10 && d.length <= 15 && !d.startsWith('998')) return '+' + d;
  return null;
}
function makeId(now = new Date()) {
  const t = new Date(now.getTime() + 5 * 3600 * 1000);
  const ymd = `${String(t.getUTCFullYear()).slice(2)}${String(t.getUTCMonth() + 1).padStart(2, '0')}${String(t.getUTCDate()).padStart(2, '0')}`;
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const r = crypto.getRandomValues(new Uint8Array(5));
  return `AS-${ymd}-${Array.from(r, (b) => abc[b % abc.length]).join('')}`;
}
function timingSafeEqual(a, b) {
  const x = new TextEncoder().encode(String(a)), y = new TextEncoder().encode(String(b));
  if (x.length !== y.length) return false;
  let r = 0; for (let i = 0; i < x.length; i++) r |= x[i] ^ y[i];
  return r === 0;
}
async function tg(env, method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  let data = {};
  try { data = await res.json(); } catch (_) { /* ignore */ }
  if (!res.ok || !data.ok) {
    // Never log the token or request body — only method, status and Telegram's description.
    console.error(`telegram ${method} failed: ${res.status} ${String(data.description || '').slice(0, 200)}`);
  }
  return data;
}

// Best-effort per-isolate fallbacks (the real limiter is the FORM_LIMITER binding).
const memHits = new Map();
const memIdem = new Map();
function memLimit(key, limit = 5, windowMs = 60000) {
  const now = Date.now();
  const arr = (memHits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now); memHits.set(key, arr);
  if (memHits.size > 5000) memHits.clear();
  return arr.length <= limit;
}

// ---------------------------------------------------------------- validation
export function validate(body) {
  const err = (field, code = 'invalid') => ({ error: code, field });
  if (!body || typeof body !== 'object') return err(null, 'bad_json');
  const kind = ['enroll', 'dev', 'order'].includes(body.kind) ? body.kind : null;
  if (!kind) return err('kind');
  const lead = { kind, lang: ['uz', 'ru', 'en'].includes(body.lang) ? body.lang : 'uz' };

  const name = clean(body.name, LIMITS.name);
  if (!name || name.length < 3 || (name.match(/\p{L}/gu) || []).length < 3) return err('name');
  lead.name = name;
  const phone = normPhone(clean(body.phone, LIMITS.phone));
  if (!phone) return err('phone');
  lead.phone = phone;

  if (kind === 'enroll') {
    const course = clean(body.course, LIMITS.course);
    if (!course) return err('course');
    lead.course = course;
    const time = clean(body.time, LIMITS.time);
    if (!time) return err('time');
    lead.time = time;
    const age = clean(body.age, 2);
    if (age === null || (age && !/^\d{1,2}$/.test(age)) || (age && (+age < 5 || +age > 99))) return err('age');
    lead.age = age;
    const comment = clean(body.comment, LIMITS.comment, true);
    if (comment === null) return err('comment');
    lead.comment = comment;
  } else {
    let tgName = clean(body.tg, LIMITS.tg);
    if (tgName === null) return err('tg');
    if (tgName) {
      tgName = tgName.replace(/^@?/, '');
      if (!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(tgName)) return err('tg');
      lead.tg = '@' + tgName;
    }
    const service = clean(body.service, LIMITS.service);
    if (!service) return err('service');
    lead.service = service;
    const details = clean(body.details, LIMITS.details, true);
    if (!details || details.length < 10) return err('details');
    lead.details = details;
    for (const f of ['budget', 'deadline']) {
      const v = clean(body[f], LIMITS[f]);
      if (v === null) return err(f);
      lead[f] = v;
    }
  }
  return { lead };
}

// ---------------------------------------------------------------- handlers
async function handleLead(request, env, ctx) {
  const origin = request.headers.get('Origin') || '';
  const okOrigin = allowedOrigins(env).includes(origin);
  if (request.method === 'OPTIONS') {
    return okOrigin ? new Response(null, { status: 204, headers: cors(origin) }) : new Response(null, { status: 403 });
  }
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405, { Allow: 'POST, OPTIONS' });
  if (!okOrigin) return json({ ok: false, error: 'origin' }, 403);
  const H = cors(origin);
  const reply = (data, status = 200) => json(data, status, H);

  if (!env.TG_BOT_TOKEN || !env.TG_ADMIN_CHAT_ID) {
    console.error('config missing: TG_BOT_TOKEN or TG_ADMIN_CHAT_ID');
    return reply({ ok: false, error: 'config' }, 500);
  }
  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) return reply({ ok: false, error: 'content_type' }, 415);
  const len = Number(request.headers.get('Content-Length') || 0);
  if (len > MAX_BODY) return reply({ ok: false, error: 'too_large' }, 413);
  const raw = await request.text();
  if (raw.length > MAX_BODY) return reply({ ok: false, error: 'too_large' }, 413);

  // rate limit per IP (binding first, in-memory fallback)
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  let allowed = true;
  if (env.FORM_LIMITER && typeof env.FORM_LIMITER.limit === 'function') {
    try { allowed = (await env.FORM_LIMITER.limit({ key: ip })).success; } catch (_) { allowed = memLimit(ip); }
  } else allowed = memLimit(ip);
  if (!allowed) return reply({ ok: false, error: 'rate' }, 429);

  let body;
  try { body = JSON.parse(raw); } catch (_) { return reply({ ok: false, error: 'bad_json' }, 400); }

  // honeypot: bots fill the hidden field — accept silently, deliver nothing
  if (body.hp) return reply({ ok: true, id: makeId() });
  // filled in faster than a human could
  if (typeof body.t === 'number' && body.t >= 0 && body.t < 1500) return reply({ ok: false, error: 'too_fast' }, 429);

  // optional CAPTCHA
  if (env.TURNSTILE_SECRET) {
    const token = typeof body.ts === 'string' ? body.ts.slice(0, 2048) : '';
    if (!token) return reply({ ok: false, error: 'captcha' }, 400);
    const fd = new FormData();
    fd.append('secret', env.TURNSTILE_SECRET); fd.append('response', token); fd.append('remoteip', ip);
    let ok = false;
    try { const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: fd }); ok = (await r.json()).success === true; }
    catch (e) { console.error('turnstile verify failed'); }
    if (!ok) return reply({ ok: false, error: 'captcha' }, 400);
  }

  const v = validate(body);
  if (v.error) return reply({ ok: false, error: v.error, field: v.field }, 400);

  // idempotency: the same form submission (retry / double click) gets the same ID and is sent once
  const idem = typeof body.idem === 'string' && /^[A-Za-z0-9-]{16,64}$/.test(body.idem) ? body.idem : null;
  if (idem) {
    const prev = env.LEADS_KV ? await env.LEADS_KV.get('idem:' + idem) : memIdem.get(idem);
    if (prev) return reply({ ok: true, id: prev, duplicate: true });
  }

  const id = makeId();
  const sent = await tg(env, 'sendMessage', {
    chat_id: env.TG_ADMIN_CHAT_ID,
    text: leadText(v.lead, id),
    reply_markup: keyboard(),
    disable_web_page_preview: true,
  });
  if (!sent.ok) return reply({ ok: false, error: 'delivery' }, 502);

  if (idem) {
    if (env.LEADS_KV) ctx.waitUntil(env.LEADS_KV.put('idem:' + idem, id, { expirationTtl: 86400 }));
    else { memIdem.set(idem, id); if (memIdem.size > 2000) memIdem.clear(); }
  }
  return reply({ ok: true, id });
}

function isAdmin(env, chatId, userId) {
  if (String(chatId) !== String(env.TG_ADMIN_CHAT_ID)) return false;
  const ids = String(env.ADMIN_USER_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return ids.length === 0 || ids.includes(String(userId));
}

async function handleWebhook(request, env) {
  if (!env.TG_WEBHOOK_SECRET || !timingSafeEqual(request.headers.get('X-Telegram-Bot-Api-Secret-Token') || '', env.TG_WEBHOOK_SECRET)) {
    return new Response('forbidden', { status: 403 });
  }
  let u;
  try { u = await request.json(); } catch (_) { return new Response('ok'); }

  const cb = u.callback_query;
  if (cb && cb.message && STATUSES[cb.data]) {
    if (!isAdmin(env, cb.message.chat.id, cb.from.id)) {
      await tg(env, 'answerCallbackQuery', { callback_query_id: cb.id, text: 'Ruxsat yo‘q', show_alert: false });
      return new Response('ok');
    }
    const text = withEvent(cb.message.text || '', { status: STATUSES[cb.data], who: personName(cb.from) });
    await tg(env, 'editMessageText', { chat_id: cb.message.chat.id, message_id: cb.message.message_id, text, reply_markup: keyboard(), disable_web_page_preview: true });
    await tg(env, 'answerCallbackQuery', { callback_query_id: cb.id, text: `Holat: ${STATUSES[cb.data]}` });
    return new Response('ok');
  }

  const m = u.message;
  const orig = m && m.reply_to_message;
  if (m && orig && m.text && !m.text.startsWith('/') && orig.from && orig.from.is_bot && (orig.text || '').includes(ID_MARK) && isAdmin(env, m.chat.id, m.from.id)) {
    const text = withEvent(orig.text, { note: m.text, who: personName(m.from) });
    await tg(env, 'editMessageText', { chat_id: m.chat.id, message_id: orig.message_id, text, reply_markup: keyboard(), disable_web_page_preview: true });
  }
  return new Response('ok');
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/api/lead') return await handleLead(request, env, ctx);
      if (pathname === '/telegram/webhook' && request.method === 'POST') return await handleWebhook(request, env);
      if (pathname === '/health') return json({ ok: true, configured: Boolean(env.TG_BOT_TOKEN && env.TG_ADMIN_CHAT_ID) });
      return new Response('Not found', { status: 404 });
    } catch (e) {
      console.error('unhandled error:', e && e.name, String(e && e.message || '').slice(0, 200));
      const origin = request.headers.get('Origin') || '';
      return json({ ok: false, error: 'server' }, 500, allowedOrigins(env).includes(origin) ? cors(origin) : {});
    }
  },
};
