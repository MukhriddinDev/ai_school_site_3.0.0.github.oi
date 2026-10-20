// Offline tests: node test/test.mjs  (Telegram API is mocked; nothing is sent)
import assert from 'node:assert/strict';
import worker, { validate } from '../src/index.js';
import { withEvent, leadText, STATUSES } from '../src/format.js';

const calls = [];
let tgFail = false;
globalThis.fetch = async (url, init) => {
  calls.push({ url: String(url), body: init && init.body ? JSON.parse(init.body) : null });
  if (tgFail) return new Response(JSON.stringify({ ok: false, description: 'Bad Request: chat not found' }), { status: 400 });
  return new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), { status: 200 });
};
const env = { TG_BOT_TOKEN: '123:SECRET', TG_ADMIN_CHAT_ID: '777', ALLOWED_ORIGINS: 'https://ai-school.uz', TG_WEBHOOK_SECRET: 'whsec' };
const ctx = { waitUntil() {} };
const ORIGIN = 'https://ai-school.uz';
let ipN = 0;
function post(body, { origin = ORIGIN, ip } = {}) {
  return worker.fetch(new Request('https://w.example/api/lead', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, 'CF-Connecting-IP': ip || `10.0.0.${++ipN}` }, body: JSON.stringify(body),
  }), env, ctx);
}
const enroll = { kind: 'enroll', lang: 'uz', name: 'Aliyev Vali', phone: '90 123 45 67', course: 'Kompyuter savodxonligi', time: 'Seshanba, payshanba, shanba — 13:10', age: '14', comment: 'Salom', t: 5000, idem: 'aaaaaaaa-bbbb-cccc-dddd-000000000001' };
const dev = { kind: 'order', lang: 'ru', name: 'Иван Петров', phone: '+998 (99) 351-82-78', tg: 'ivan_dev', service: 'Veb-sayt yaratish', details: 'Kerak: o‘quv markazi uchun sayt', budget: '3 mln', t: 4000, idem: 'aaaaaaaa-bbbb-cccc-dddd-000000000002' };

let r, j;
// 1. enroll OK
r = await post(enroll); j = await r.json();
assert.equal(r.status, 200); assert.equal(j.ok, true); assert.match(j.id, /^AS-\d{6}-[A-Z2-9]{5}$/);
assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGIN);
const msg = calls.at(-1); assert.ok(msg.url.endsWith('/sendMessage')); assert.equal(msg.body.chat_id, '777');
assert.ok(msg.body.text.includes('📌 Murojaat turi: Offline darslarga yozilish'));
assert.ok(msg.body.text.includes('📞 Telefon: +998 90 123 45 67'));
assert.ok(msg.body.text.includes(`🆔 Murojaat ID: ${j.id}`));
assert.ok(!msg.body.text.includes('Budjet'), 'no empty fields');
assert.equal(msg.body.reply_markup.inline_keyboard.flat().length, 4);
assert.equal(msg.body.parse_mode, undefined, 'plain text only');
// 2. duplicate submission -> same ID, no second message
const n = calls.length; r = await post(enroll); j = await r.json();
assert.equal(j.duplicate, true); assert.equal(calls.length, n);
// 3. dev / order
r = await post(dev); j = await r.json(); assert.equal(j.ok, true);
assert.ok(calls.at(-1).body.text.includes('📌 Murojaat turi: Xizmat buyurtmasi'));
assert.ok(calls.at(-1).body.text.includes('💬 Telegram: @ivan_dev'));
assert.ok(calls.at(-1).body.text.includes('💰 Budjet: 3 mln'));
// 4. validation errors
for (const [patch, field] of [[{ name: 'A' }, 'name'], [{ phone: '12345' }, 'phone'], [{ course: '' }, 'course'], [{ age: '200' }, 'age'], [{ comment: 'x'.repeat(1001) }, 'comment']]) {
  r = await post({ ...enroll, ...patch, idem: undefined }); j = await r.json();
  assert.equal(r.status, 400); assert.equal(j.field, field, JSON.stringify(patch));
}
r = await post({ ...dev, tg: 'a b', idem: undefined }); assert.equal((await r.json()).field, 'tg');
r = await post({ ...dev, details: 'short', idem: undefined }); assert.equal((await r.json()).field, 'details');
// 5. wrong origin
r = await post(enroll, { origin: 'https://evil.example' }); assert.equal(r.status, 403);
// 6. honeypot -> fake ok, nothing sent
const n2 = calls.length; r = await post({ ...enroll, hp: 'spam', idem: undefined }); assert.equal((await r.json()).ok, true); assert.equal(calls.length, n2);
// 7. too fast
r = await post({ ...enroll, t: 300, idem: undefined }); assert.equal(r.status, 429);
// 8. rate limit (in-memory fallback): 6th request from one IP in a minute
let last;
for (let i = 0; i < 6; i++) last = await post({ ...enroll, idem: undefined }, { ip: '9.9.9.9' });
assert.equal(last.status, 429);
// 9. Telegram failure -> honest error, not success
tgFail = true; r = await post({ ...enroll, idem: 'aaaaaaaa-bbbb-cccc-dddd-000000000009' }); j = await r.json();
assert.equal(r.status, 502); assert.equal(j.ok, false); tgFail = false;
// 10. preflight
r = await worker.fetch(new Request('https://w.example/api/lead', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), env, ctx);
assert.equal(r.status, 204);
// 11. control chars / markup are neutralised
const v = validate({ ...enroll, name: 'Vali‮<b>x</b>\u0000 Aliyev' });
assert.ok(!/[‮\u0000]/.test(v.lead.name));
// 12. status + reply history
const base = leadText({ kind: 'enroll', name: 'Vali', phone: '+998 90 123 45 67', course: 'X', time: 'Y' }, 'AS-1');
let t2 = withEvent(base, { status: STATUSES['st:acc'], who: 'Muxriddin' });
t2 = withEvent(t2, { note: 'Ertaga 13:10 da keling', who: 'Muxriddin' });
t2 = withEvent(t2, { status: STATUSES['st:con'], who: 'Muxriddin' });
assert.ok(t2.includes('📍 Holat: 📞 Bog‘lanildi'));
assert.equal((t2.match(/^• /gm) || []).length, 3);
assert.equal(t2.split('📍 Holat:').length, 2);
// 13. webhook: secret required, status button edits message
r = await worker.fetch(new Request('https://w.example/telegram/webhook', { method: 'POST', body: '{}' }), env, ctx); assert.equal(r.status, 403);
const upd = { callback_query: { id: 'c1', data: 'st:pro', from: { id: 5, first_name: 'Muxriddin' }, message: { message_id: 10, chat: { id: 777 }, text: base } } };
r = await worker.fetch(new Request('https://w.example/telegram/webhook', { method: 'POST', headers: { 'X-Telegram-Bot-Api-Secret-Token': 'whsec' }, body: JSON.stringify(upd) }), env, ctx);
assert.equal(r.status, 200);
const edit = calls.find((c) => c.url.endsWith('/editMessageText') && c.body.message_id === 10);
assert.ok(edit.body.text.includes('📍 Holat: ⏳ Jarayonda'));
// foreign chat cannot change status
const before = calls.length;
upd.callback_query.message.chat.id = 1; upd.callback_query.message.message_id = 11;
await worker.fetch(new Request('https://w.example/telegram/webhook', { method: 'POST', headers: { 'X-Telegram-Bot-Api-Secret-Token': 'whsec' }, body: JSON.stringify(upd) }), env, ctx);
assert.ok(!calls.slice(before).some((c) => c.url.endsWith('/editMessageText')));
// token never appears in responses
assert.ok(!JSON.stringify(j).includes('SECRET'));

console.log('All worker tests passed ✔');
console.log('\nSample Telegram message:\n' + calls.find((c) => c.body && c.body.text && c.body.text.includes('Xizmat buyurtmasi')).body.text);
console.log('\nAfter status changes:\n' + t2.split('\n\n').slice(-1)[0]);
