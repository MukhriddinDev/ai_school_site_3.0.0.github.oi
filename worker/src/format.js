// Telegram message formatting shared by the form handler and the webhook.
// Messages are sent as plain text (no parse_mode), so user input can never inject markup.

export const KIND_LABEL = {
  enroll: 'Offline darslarga yozilish',
  order: 'Xizmat buyurtmasi',
  dev: 'Dasturchi bilan bog‘lanish',
};

export const STATUSES = {
  'st:acc': '✅ Qabul qilindi',
  'st:con': '📞 Bog‘lanildi',
  'st:pro': '⏳ Jarayonda',
  'st:can': '❌ Bekor qilindi',
};

export const STATUS_MARK = '📍 Holat:';
export const HISTORY_MARK = '🕓 Tarix:';
export const ID_MARK = '🆔 Murojaat ID:';
const MAX_TEXT = 4000; // Telegram limit is 4096

export function keyboard() {
  return {
    inline_keyboard: [
      [{ text: STATUSES['st:acc'], callback_data: 'st:acc' }, { text: STATUSES['st:con'], callback_data: 'st:con' }],
      [{ text: STATUSES['st:pro'], callback_data: 'st:pro' }, { text: STATUSES['st:can'], callback_data: 'st:can' }],
    ],
  };
}

// Uzbekistan is UTC+5 all year (no DST).
export function tashkentTime(d = new Date(), withDate = true) {
  const t = new Date(d.getTime() + 5 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  const hm = `${p(t.getUTCHours())}:${p(t.getUTCMinutes())}`;
  return withDate ? `${p(t.getUTCDate())}.${p(t.getUTCMonth() + 1)}.${t.getUTCFullYear()} ${hm}` : `${p(t.getUTCDate())}.${p(t.getUTCMonth() + 1)} ${hm}`;
}

export function leadText(lead, id, now = new Date()) {
  const lines = ['🆕 AI SCHOOL — YANGI MUROJAAT', '', `📌 Murojaat turi: ${KIND_LABEL[lead.kind] || lead.kind}`, ''];
  const add = (icon, label, v) => { if (v) lines.push(`${icon} ${label}: ${v}`); };
  add('👤', 'Ism', lead.name);
  add('📞', 'Telefon', lead.phone);
  if (lead.kind === 'enroll') {
    add('📚', 'Kurs', lead.course);
    add('🎂', 'O‘quvchi yoshi', lead.age);
    add('⏰', 'Qulay vaqt', lead.time);
    add('📝', 'Izoh', lead.comment);
  } else {
    add('💬', 'Telegram', lead.tg);
    add('🛠', 'Xizmat', lead.service);
    add('📝', 'Loyiha haqida', lead.details);
    add('💰', 'Budjet', lead.budget);
    add('⏳', 'Muddat', lead.deadline);
  }
  add('🌐', 'Sayt tili', lead.lang && lead.lang.toUpperCase());
  lines.push(`🗓 Sana va vaqt: ${tashkentTime(now)}`);
  lines.push(`${ID_MARK} ${id}`);
  lines.push('', `${STATUS_MARK} 🆕 Yangi`);
  return lines.join('\n');
}

export function personName(u) {
  if (!u) return 'Admin';
  const n = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Admin';
  return u.username ? `${n} (@${u.username})` : n;
}

// Rebuild the message: base part + current status + history (newest last, trimmed to fit).
export function withEvent(text, { status, note, who, now = new Date() }) {
  const idx = text.lastIndexOf(`\n\n${STATUS_MARK}`);
  const base = idx >= 0 ? text.slice(0, idx) : text;
  const tail = idx >= 0 ? text.slice(idx + 2) : '';
  let current = (tail.split('\n')[0] || '').replace(STATUS_MARK, '').trim() || '🆕 Yangi';
  const hIdx = tail.indexOf(HISTORY_MARK);
  let hist = hIdx >= 0 ? tail.slice(hIdx + HISTORY_MARK.length).split('\n').filter((l) => l.trim()) : [];
  const when = tashkentTime(now, false);
  if (status) { current = status; hist.push(`• ${when} — ${status} — ${who}`); }
  if (note) hist.push(`• ${when} — 💬 ${who}: ${note.replace(/\s+/g, ' ').slice(0, 300)}`);
  const build = () => `${base}\n\n${STATUS_MARK} ${current}${hist.length ? `\n${HISTORY_MARK}\n${hist.join('\n')}` : ''}`;
  let out = build();
  while (out.length > MAX_TEXT && hist.length > 1) { hist.shift(); out = build(); }
  return out.slice(0, MAX_TEXT);
}
