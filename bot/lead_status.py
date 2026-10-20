"""
AI School — saytdan kelgan murojaatlar uchun holat tugmalari (aiogram 3).

Bu fayl MAVJUD @aischool9_bot (aiogram 3, polling) ichiga qo'shiladi.
Sayt formalari Cloudflare Worker orqali admin chatiga xabar yuboradi;
xabar ostidagi "✅ Qabul qilindi / 📞 Bog'lanildi / ⏳ Jarayonda / ❌ Bekor qilindi"
tugmalari bosilganda shu modul xabarni yangilaydi va holat tarixini yozadi.
Admin murojaat xabariga "Reply" qilib yozgan javobi ham tarixga qo'shiladi.

Ulash (bot.py / main.py ichida):
    from lead_status import router as lead_status_router
    dp.include_router(lead_status_router)   # boshqa umumiy handlerlardan OLDIN qo'shing

Muhit o'zgaruvchilari (.env):
    ADMIN_CHAT_ID=123456789          # Worker'dagi TG_ADMIN_CHAT_ID bilan bir xil
    ADMIN_USER_IDS=123456789,987654  # ixtiyoriy: tugmani kim bosa oladi
"""
from __future__ import annotations

import os
import re
from datetime import datetime, timedelta, timezone

from aiogram import F, Router
from aiogram.dispatcher.event.bases import SkipHandler
from aiogram.exceptions import TelegramBadRequest
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message, ReactionTypeEmoji, User

router = Router(name="ai_school_lead_status")

ADMIN_CHAT_ID = os.getenv("ADMIN_CHAT_ID", "").strip()
ADMIN_USER_IDS = {s.strip() for s in os.getenv("ADMIN_USER_IDS", "").split(",") if s.strip()}

STATUSES = {
    "st:acc": "✅ Qabul qilindi",
    "st:con": "📞 Bog‘lanildi",
    "st:pro": "⏳ Jarayonda",
    "st:can": "❌ Bekor qilindi",
}
STATUS_MARK = "📍 Holat:"
HISTORY_MARK = "🕓 Tarix:"
ID_MARK = "🆔 Murojaat ID:"
MAX_TEXT = 4000
TZ = timezone(timedelta(hours=5))  # O'zbekiston, yil bo'yi UTC+5


def keyboard() -> InlineKeyboardMarkup:
    b = lambda k: InlineKeyboardButton(text=STATUSES[k], callback_data=k)  # noqa: E731
    return InlineKeyboardMarkup(inline_keyboard=[[b("st:acc"), b("st:con")], [b("st:pro"), b("st:can")]])


def person(u: User | None) -> str:
    if not u:
        return "Admin"
    name = " ".join(x for x in (u.first_name, u.last_name) if x) or "Admin"
    return f"{name} (@{u.username})" if u.username else name


def with_event(text: str, *, who: str, status: str | None = None, note: str | None = None) -> str:
    """Worker'dagi format.js -> withEvent bilan bir xil mantiq."""
    idx = text.rfind(f"\n\n{STATUS_MARK}")
    base = text[:idx] if idx >= 0 else text
    tail = text[idx + 2:] if idx >= 0 else ""
    current = (tail.split("\n")[0] if tail else "").replace(STATUS_MARK, "").strip() or "🆕 Yangi"
    h = tail.find(HISTORY_MARK)
    hist = [l for l in tail[h + len(HISTORY_MARK):].split("\n") if l.strip()] if h >= 0 else []
    when = datetime.now(TZ).strftime("%d.%m %H:%M")
    if status:
        current = status
        hist.append(f"• {when} — {status} — {who}")
    if note:
        hist.append(f"• {when} — 💬 {who}: {re.sub(r'\s+', ' ', note)[:300]}")

    def build() -> str:
        out = f"{base}\n\n{STATUS_MARK} {current}"
        return out + (f"\n{HISTORY_MARK}\n" + "\n".join(hist) if hist else "")

    out = build()
    while len(out) > MAX_TEXT and len(hist) > 1:
        hist.pop(0)
        out = build()
    return out[:MAX_TEXT]


def is_admin(chat_id: int, user_id: int | None) -> bool:
    if not ADMIN_CHAT_ID or str(chat_id) != ADMIN_CHAT_ID:
        return False
    return not ADMIN_USER_IDS or str(user_id) in ADMIN_USER_IDS


@router.callback_query(F.data.in_(set(STATUSES)))
async def on_status(cb: CallbackQuery) -> None:
    msg = cb.message
    if not isinstance(msg, Message) or not msg.text or ID_MARK not in msg.text:
        await cb.answer()
        return
    if not is_admin(msg.chat.id, cb.from_user.id if cb.from_user else None):
        await cb.answer("Ruxsat yo‘q")
        return
    status = STATUSES[cb.data]
    try:
        await msg.edit_text(with_event(msg.text, who=person(cb.from_user), status=status),
                            reply_markup=keyboard(), disable_web_page_preview=True)
    except TelegramBadRequest as e:  # masalan, "message is not modified"
        if "not modified" not in str(e):
            raise
    await cb.answer(f"Holat: {status}")


@router.message(F.text, ~F.text.startswith("/"), F.reply_to_message.text.contains(ID_MARK),
                F.reply_to_message.from_user.is_bot)
async def on_admin_reply(m: Message) -> None:
    """Admin murojaat xabariga Reply qilib yozsa, javob murojaat tarixiga qo'shiladi."""
    if not is_admin(m.chat.id, m.from_user.id if m.from_user else None):
        raise SkipHandler()  # boshqa handlerlar ishlashda davom etsin
    orig = m.reply_to_message
    try:
        await orig.edit_text(with_event(orig.text, who=person(m.from_user), note=m.text),
                             reply_markup=keyboard(), disable_web_page_preview=True)
    except TelegramBadRequest:
        return
    try:
        await m.react([ReactionTypeEmoji(emoji="👍")])
    except Exception:  # eski aiogram versiyalarida react bo'lmasligi mumkin
        pass
