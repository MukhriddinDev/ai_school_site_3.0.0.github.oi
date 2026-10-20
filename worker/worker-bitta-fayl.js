// =====================================================================
// AI SCHOOL — formalar -> Telegram (Cloudflare Worker, BITTA FAYL)
// Cloudflare saytida: Workers & Pages -> Create -> Worker -> "Edit code"
// -> shu faylning HAMMASINI nusxalab qo'ying -> Deploy.
// So'ng Settings -> Variables and Secrets -> "Secret" turida qo'shing:
//     TG_BOT_TOKEN      = bot tokeni (@BotFather)
//     TG_ADMIN_CHAT_ID  = sizning Telegram ID raqamingiz
// Token bu faylga YOZILMAYDI.
// =====================================================================
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/format.js
var KIND_LABEL = {
  enroll: "Offline darslarga yozilish",
  order: "Xizmat buyurtmasi",
  dev: "Dasturchi bilan bog\u2018lanish"
};
var STATUSES = {
  "st:acc": "\u2705 Qabul qilindi",
  "st:con": "\u{1F4DE} Bog\u2018lanildi",
  "st:pro": "\u23F3 Jarayonda",
  "st:can": "\u274C Bekor qilindi"
};
var STATUS_MARK = "\u{1F4CD} Holat:";
var HISTORY_MARK = "\u{1F553} Tarix:";
var ID_MARK = "\u{1F194} Murojaat ID:";
var MAX_TEXT = 4e3;
function keyboard() {
  return {
    inline_keyboard: [
      [{ text: STATUSES["st:acc"], callback_data: "st:acc" }, { text: STATUSES["st:con"], callback_data: "st:con" }],
      [{ text: STATUSES["st:pro"], callback_data: "st:pro" }, { text: STATUSES["st:can"], callback_data: "st:can" }]
    ]
  };
}
__name(keyboard, "keyboard");
function tashkentTime(d = /* @__PURE__ */ new Date(), withDate = true) {
  const t = new Date(d.getTime() + 5 * 3600 * 1e3);
  const p = /* @__PURE__ */ __name((n) => String(n).padStart(2, "0"), "p");
  const hm = `${p(t.getUTCHours())}:${p(t.getUTCMinutes())}`;
  return withDate ? `${p(t.getUTCDate())}.${p(t.getUTCMonth() + 1)}.${t.getUTCFullYear()} ${hm}` : `${p(t.getUTCDate())}.${p(t.getUTCMonth() + 1)} ${hm}`;
}
__name(tashkentTime, "tashkentTime");
function leadText(lead, id, now = /* @__PURE__ */ new Date()) {
  const lines = ["\u{1F195} AI SCHOOL \u2014 YANGI MUROJAAT", "", `\u{1F4CC} Murojaat turi: ${KIND_LABEL[lead.kind] || lead.kind}`, ""];
  const add = /* @__PURE__ */ __name((icon, label, v) => {
    if (v) lines.push(`${icon} ${label}: ${v}`);
  }, "add");
  add("\u{1F464}", "Ism", lead.name);
  add("\u{1F4DE}", "Telefon", lead.phone);
  if (lead.kind === "enroll") {
    add("\u{1F4DA}", "Kurs", lead.course);
    add("\u{1F382}", "O\u2018quvchi yoshi", lead.age);
    add("\u23F0", "Qulay vaqt", lead.time);
    add("\u{1F4DD}", "Izoh", lead.comment);
  } else {
    add("\u{1F4AC}", "Telegram", lead.tg);
    add("\u{1F6E0}", "Xizmat", lead.service);
    add("\u{1F4DD}", "Loyiha haqida", lead.details);
    add("\u{1F4B0}", "Budjet", lead.budget);
    add("\u23F3", "Muddat", lead.deadline);
  }
  add("\u{1F310}", "Sayt tili", lead.lang && lead.lang.toUpperCase());
  lines.push(`\u{1F5D3} Sana va vaqt: ${tashkentTime(now)}`);
  lines.push(`${ID_MARK} ${id}`);
  lines.push("", `${STATUS_MARK} \u{1F195} Yangi`);
  return lines.join("\n");
}
__name(leadText, "leadText");
function personName(u) {
  if (!u) return "Admin";
  const n = [u.first_name, u.last_name].filter(Boolean).join(" ") || "Admin";
  return u.username ? `${n} (@${u.username})` : n;
}
__name(personName, "personName");
function withEvent(text, { status, note, who, now = /* @__PURE__ */ new Date() }) {
  const idx = text.lastIndexOf(`

${STATUS_MARK}`);
  const base = idx >= 0 ? text.slice(0, idx) : text;
  const tail = idx >= 0 ? text.slice(idx + 2) : "";
  let current = (tail.split("\n")[0] || "").replace(STATUS_MARK, "").trim() || "\u{1F195} Yangi";
  const hIdx = tail.indexOf(HISTORY_MARK);
  let hist = hIdx >= 0 ? tail.slice(hIdx + HISTORY_MARK.length).split("\n").filter((l) => l.trim()) : [];
  const when = tashkentTime(now, false);
  if (status) {
    current = status;
    hist.push(`\u2022 ${when} \u2014 ${status} \u2014 ${who}`);
  }
  if (note) hist.push(`\u2022 ${when} \u2014 \u{1F4AC} ${who}: ${note.replace(/\s+/g, " ").slice(0, 300)}`);
  const build = /* @__PURE__ */ __name(() => `${base}

${STATUS_MARK} ${current}${hist.length ? `
${HISTORY_MARK}
${hist.join("\n")}` : ""}`, "build");
  let out = build();
  while (out.length > MAX_TEXT && hist.length > 1) {
    hist.shift();
    out = build();
  }
  return out.slice(0, MAX_TEXT);
}
__name(withEvent, "withEvent");

// src/index.js
var MAX_BODY = 12e3;
var LIMITS = { name: 80, phone: 22, course: 120, time: 120, comment: 1e3, tg: 33, service: 120, details: 2500, budget: 80, deadline: 80 };
function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...extra }
  });
}
__name(json, "json");
function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "https://ai-school.uz,https://www.ai-school.uz").split(",").map((s) => s.trim()).filter(Boolean);
}
__name(allowedOrigins, "allowedOrigins");
function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}
__name(cors, "cors");
function clean(v, max, multiline = false) {
  if (v == null) return "";
  let s = String(v).normalize("NFC");
  s = multiline ? s.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000B-\u001F\u007F​-‏‪-‮⁦-⁩]/g, "") : s.replace(/[\u0000-\u001F\u007F​-‏‪-‮⁦-⁩]/g, " ");
  s = multiline ? s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n") : s.replace(/\s+/g, " ");
  s = s.trim();
  return s.length > max ? null : s;
}
__name(clean, "clean");
function normPhone(v) {
  const raw = String(v || "").trim();
  let d = raw.replace(/\D/g, "");
  if (d.length === 9 && !raw.startsWith("+")) d = "998" + d;
  if (/^998\d{9}$/.test(d)) return `+998 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
  if (raw.startsWith("+") && d.length >= 10 && d.length <= 15 && !d.startsWith("998")) return "+" + d;
  return null;
}
__name(normPhone, "normPhone");
function makeId(now = /* @__PURE__ */ new Date()) {
  const t = new Date(now.getTime() + 5 * 3600 * 1e3);
  const ymd = `${String(t.getUTCFullYear()).slice(2)}${String(t.getUTCMonth() + 1).padStart(2, "0")}${String(t.getUTCDate()).padStart(2, "0")}`;
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const r = crypto.getRandomValues(new Uint8Array(5));
  return `AS-${ymd}-${Array.from(r, (b) => abc[b % abc.length]).join("")}`;
}
__name(makeId, "makeId");
function timingSafeEqual(a, b) {
  const x = new TextEncoder().encode(String(a)), y = new TextEncoder().encode(String(b));
  if (x.length !== y.length) return false;
  let r = 0;
  for (let i = 0; i < x.length; i++) r |= x[i] ^ y[i];
  return r === 0;
}
__name(timingSafeEqual, "timingSafeEqual");
async function tg(env, method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  let data = {};
  try {
    data = await res.json();
  } catch (_) {
  }
  if (!res.ok || !data.ok) {
    console.error(`telegram ${method} failed: ${res.status} ${String(data.description || "").slice(0, 200)}`);
  }
  return data;
}
__name(tg, "tg");
var memHits = /* @__PURE__ */ new Map();
var memIdem = /* @__PURE__ */ new Map();
function memLimit(key, limit = 5, windowMs = 6e4) {
  const now = Date.now();
  const arr = (memHits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  memHits.set(key, arr);
  if (memHits.size > 5e3) memHits.clear();
  return arr.length <= limit;
}
__name(memLimit, "memLimit");
function validate(body) {
  const err = /* @__PURE__ */ __name((field, code = "invalid") => ({ error: code, field }), "err");
  if (!body || typeof body !== "object") return err(null, "bad_json");
  const kind = ["enroll", "dev", "order"].includes(body.kind) ? body.kind : null;
  if (!kind) return err("kind");
  const lead = { kind, lang: ["uz", "ru", "en"].includes(body.lang) ? body.lang : "uz" };
  const name = clean(body.name, LIMITS.name);
  if (!name || name.length < 3 || (name.match(/\p{L}/gu) || []).length < 3) return err("name");
  lead.name = name;
  const phone = normPhone(clean(body.phone, LIMITS.phone));
  if (!phone) return err("phone");
  lead.phone = phone;
  if (kind === "enroll") {
    const course = clean(body.course, LIMITS.course);
    if (!course) return err("course");
    lead.course = course;
    const time = clean(body.time, LIMITS.time);
    if (!time) return err("time");
    lead.time = time;
    const age = clean(body.age, 2);
    if (age === null || age && !/^\d{1,2}$/.test(age) || age && (+age < 5 || +age > 99)) return err("age");
    lead.age = age;
    const comment = clean(body.comment, LIMITS.comment, true);
    if (comment === null) return err("comment");
    lead.comment = comment;
  } else {
    let tgName = clean(body.tg, LIMITS.tg);
    if (tgName === null) return err("tg");
    if (tgName) {
      tgName = tgName.replace(/^@?/, "");
      if (!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(tgName)) return err("tg");
      lead.tg = "@" + tgName;
    }
    const service = clean(body.service, LIMITS.service);
    if (!service) return err("service");
    lead.service = service;
    const details = clean(body.details, LIMITS.details, true);
    if (!details || details.length < 10) return err("details");
    lead.details = details;
    for (const f of ["budget", "deadline"]) {
      const v = clean(body[f], LIMITS[f]);
      if (v === null) return err(f);
      lead[f] = v;
    }
  }
  return { lead };
}
__name(validate, "validate");
async function handleLead(request, env, ctx) {
  const origin = request.headers.get("Origin") || "";
  const okOrigin = allowedOrigins(env).includes(origin);
  if (request.method === "OPTIONS") {
    return okOrigin ? new Response(null, { status: 204, headers: cors(origin) }) : new Response(null, { status: 403 });
  }
  if (request.method !== "POST") return json({ ok: false, error: "method" }, 405, { Allow: "POST, OPTIONS" });
  if (!okOrigin) return json({ ok: false, error: "origin" }, 403);
  const H = cors(origin);
  const reply = /* @__PURE__ */ __name((data, status = 200) => json(data, status, H), "reply");
  if (!env.TG_BOT_TOKEN || !env.TG_ADMIN_CHAT_ID) {
    console.error("config missing: TG_BOT_TOKEN or TG_ADMIN_CHAT_ID");
    return reply({ ok: false, error: "config" }, 500);
  }
  if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) return reply({ ok: false, error: "content_type" }, 415);
  const len = Number(request.headers.get("Content-Length") || 0);
  if (len > MAX_BODY) return reply({ ok: false, error: "too_large" }, 413);
  const raw = await request.text();
  if (raw.length > MAX_BODY) return reply({ ok: false, error: "too_large" }, 413);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  let allowed = true;
  if (env.FORM_LIMITER && typeof env.FORM_LIMITER.limit === "function") {
    try {
      allowed = (await env.FORM_LIMITER.limit({ key: ip })).success;
    } catch (_) {
      allowed = memLimit(ip);
    }
  } else allowed = memLimit(ip);
  if (!allowed) return reply({ ok: false, error: "rate" }, 429);
  let body;
  try {
    body = JSON.parse(raw);
  } catch (_) {
    return reply({ ok: false, error: "bad_json" }, 400);
  }
  if (body.hp) return reply({ ok: true, id: makeId() });
  if (typeof body.t === "number" && body.t >= 0 && body.t < 1500) return reply({ ok: false, error: "too_fast" }, 429);
  if (env.TURNSTILE_SECRET) {
    const token = typeof body.ts === "string" ? body.ts.slice(0, 2048) : "";
    if (!token) return reply({ ok: false, error: "captcha" }, 400);
    const fd = new FormData();
    fd.append("secret", env.TURNSTILE_SECRET);
    fd.append("response", token);
    fd.append("remoteip", ip);
    let ok = false;
    try {
      const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: fd });
      ok = (await r.json()).success === true;
    } catch (e) {
      console.error("turnstile verify failed");
    }
    if (!ok) return reply({ ok: false, error: "captcha" }, 400);
  }
  const v = validate(body);
  if (v.error) return reply({ ok: false, error: v.error, field: v.field }, 400);
  const idem = typeof body.idem === "string" && /^[A-Za-z0-9-]{16,64}$/.test(body.idem) ? body.idem : null;
  if (idem) {
    const prev = env.LEADS_KV ? await env.LEADS_KV.get("idem:" + idem) : memIdem.get(idem);
    if (prev) return reply({ ok: true, id: prev, duplicate: true });
  }
  const id = makeId();
  const sent = await tg(env, "sendMessage", {
    chat_id: env.TG_ADMIN_CHAT_ID,
    text: leadText(v.lead, id),
    reply_markup: keyboard(),
    disable_web_page_preview: true
  });
  if (!sent.ok) return reply({ ok: false, error: "delivery" }, 502);
  if (idem) {
    if (env.LEADS_KV) ctx.waitUntil(env.LEADS_KV.put("idem:" + idem, id, { expirationTtl: 86400 }));
    else {
      memIdem.set(idem, id);
      if (memIdem.size > 2e3) memIdem.clear();
    }
  }
  return reply({ ok: true, id });
}
__name(handleLead, "handleLead");
function isAdmin(env, chatId, userId) {
  if (String(chatId) !== String(env.TG_ADMIN_CHAT_ID)) return false;
  const ids = String(env.ADMIN_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  return ids.length === 0 || ids.includes(String(userId));
}
__name(isAdmin, "isAdmin");
async function handleWebhook(request, env) {
  if (!env.TG_WEBHOOK_SECRET || !timingSafeEqual(request.headers.get("X-Telegram-Bot-Api-Secret-Token") || "", env.TG_WEBHOOK_SECRET)) {
    return new Response("forbidden", { status: 403 });
  }
  let u;
  try {
    u = await request.json();
  } catch (_) {
    return new Response("ok");
  }
  const cb = u.callback_query;
  if (cb && cb.message && STATUSES[cb.data]) {
    if (!isAdmin(env, cb.message.chat.id, cb.from.id)) {
      await tg(env, "answerCallbackQuery", { callback_query_id: cb.id, text: "Ruxsat yo\u2018q", show_alert: false });
      return new Response("ok");
    }
    const text = withEvent(cb.message.text || "", { status: STATUSES[cb.data], who: personName(cb.from) });
    await tg(env, "editMessageText", { chat_id: cb.message.chat.id, message_id: cb.message.message_id, text, reply_markup: keyboard(), disable_web_page_preview: true });
    await tg(env, "answerCallbackQuery", { callback_query_id: cb.id, text: `Holat: ${STATUSES[cb.data]}` });
    return new Response("ok");
  }
  const m = u.message;
  const orig = m && m.reply_to_message;
  if (m && orig && m.text && !m.text.startsWith("/") && orig.from && orig.from.is_bot && (orig.text || "").includes(ID_MARK) && isAdmin(env, m.chat.id, m.from.id)) {
    const text = withEvent(orig.text, { note: m.text, who: personName(m.from) });
    await tg(env, "editMessageText", { chat_id: m.chat.id, message_id: orig.message_id, text, reply_markup: keyboard(), disable_web_page_preview: true });
  }
  return new Response("ok");
}
__name(handleWebhook, "handleWebhook");
var index_default = {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === "/api/lead") return await handleLead(request, env, ctx);
      if (pathname === "/telegram/webhook" && request.method === "POST") return await handleWebhook(request, env);
      if (pathname === "/health") return json({ ok: true, configured: Boolean(env.TG_BOT_TOKEN && env.TG_ADMIN_CHAT_ID) });
      return new Response("Not found", { status: 404 });
    } catch (e) {
      console.error("unhandled error:", e && e.name, String(e && e.message || "").slice(0, 200));
      const origin = request.headers.get("Origin") || "";
      return json({ ok: false, error: "server" }, 500, allowedOrigins(env).includes(origin) ? cors(origin) : {});
    }
  }
};
export {
  index_default as default,
  validate
};
