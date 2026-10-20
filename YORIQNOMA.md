# AI School sayti v3 — o'rnatish yo'riqnomasi

Papkalar:

| Papka | Nima | Qayerga |
|---|---|---|
| `site/` | Saytning o'zi (statik) | GitHub repo: `ai_school_site_v2.0.0.github.oi` → `ai-school.uz` |
| `worker/` | Formalar backend'i (Cloudflare Worker) | Cloudflare (bepul tarif yetadi) |
| `bot/lead_status.py` | Telegram'dagi holat tugmalari uchun modul | Mavjud @aischool9_bot (aiogram 3) loyihasiga |

Nega Worker kerak: GitHub Pages faqat statik fayllarni beradi. Bot tokenini HTML/JS ichiga yozsangiz,
uni har kim ko'rib, botingizni boshqarib oladi. Shuning uchun token faqat Worker'ning maxfiy
sozlamasida saqlanadi, sayt esa formani Worker'ga yuboradi.

```
Foydalanuvchi → ai-school.uz (forma) → Cloudflare Worker (tekshiruv, spam himoyasi) → Telegram admin chati
```

---

## 1-qadam. Telegram ma'lumotlarini tayyorlash

1. **Bot tokeni.** @BotFather → `/mybots` → @aischool9_bot → *API Token*.
   Agar mavjud botga tegmaslikni xohlasangiz, @BotFather'da yangi bot yarating (masalan `@aischool_murojaat_bot`) — bu ham ishlaydi.
2. **Admin chat ID.** Botga `/start` yozing, so'ng brauzerda oching:
   `https://api.telegram.org/bot<TOKEN>/getUpdates` → `"chat":{"id":123456789` — shu raqam.
   (Agar aiogram bot hozir ishlab turgan bo'lsa, getUpdates bo'sh qaytishi mumkin; unda @userinfobot ga yozib o'z ID'ingizni bilib oling.)
   Guruhga yuborish uchun botni guruhga qo'shing; guruh ID'si `-100...` bilan boshlanadi.

Token va chat ID'ni hech kimga bermang va hech qaysi faylga yozmang.

## 2-qadam. Worker'ni joylash (Windows, Node.js 18+ kerak)

```bash
cd worker
npm install
npx wrangler login                      # brauzerda Cloudflare hisobiga kirasiz (bepul ro'yxatdan o'tish)
npx wrangler secret put TG_BOT_TOKEN    # tokenni yopishtiring
npx wrangler secret put TG_ADMIN_CHAT_ID
npm test                                # offline testlar (Telegram'ga hech narsa yubormaydi)
npx wrangler deploy
```

`deploy` oxirida manzil chiqadi, masalan `https://ai-school-forms.SIZNING-NOM.workers.dev`.
Tekshirish: brauzerda `.../health` → `{"ok":true,"configured":true}`.

## 3-qadam. Saytni Worker'ga ulash

`site/assets/js/config.js` faylida:

```js
apiUrl: "https://ai-school-forms.SIZNING-NOM.workers.dev/api/lead",
```

So'ng `site/` ichidagi hamma narsani GitHub repoga yuklang (Add file → Upload files, papka tuzilishini saqlab).
Yashirin `.nojekyll` va `.well-known/` papkasini ham yuklang.

**Repodan o'chiring** (eski, keraksiz nusxalar Google'da takroriy sahifa bo'lib ko'rinadi):
- `ai-school-site/` papkasi
- ildizdagi `videos.js` (asl fayl `assets/js/videos.js` da)

## 4-qadam. Holat tugmalari (✅ 📞 ⏳ ❌) — bitta variantni tanlang

Telegram bitta botga yangilanishlarni yo **polling** (aiogram) ga, yo **webhook** ga beradi — ikkalasiga birdan emas.

**A variant — mavjud aiogram bot ishlab turgan bo'lsa (tavsiya):**
1. `bot/lead_status.py` ni bot loyihangizga ko'chiring.
2. `.env` ga `ADMIN_CHAT_ID=...` qo'shing (Worker'dagi bilan bir xil).
3. Botning asosiy faylida, boshqa routerlardan **oldin**:
   ```python
   from lead_status import router as lead_status_router
   dp.include_router(lead_status_router)
   ```
4. Botni qayta ishga tushiring. Worker faqat xabar yuboradi, tugmalarni aiogram bot qayta ishlaydi.

**B variant — alohida bot (yoki botda boshqa backend yo'q):**
```bash
npx wrangler secret put TG_WEBHOOK_SECRET    # ixtiyoriy uzun tasodifiy so'z, masalan 40 ta harf-raqam
npx wrangler deploy
```
So'ng brauzerda bir marta oching (qiymatlarni o'zingiznikiga almashtiring):
`https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://ai-school-forms.SIZNING-NOM.workers.dev/telegram/webhook&secret_token=<TG_WEBHOOK_SECRET>&allowed_updates=["callback_query","message"]`

Ikkala variantda ham: admin murojaat xabariga **Reply** qilib yozsa, javob shu murojaat tarixiga qo'shiladi.
Tugmalarni faqat ma'lum adminlar bossin desangiz — `ADMIN_USER_IDS` (wrangler.toml yoki .env) ga ularning ID'larini yozing.

## 5-qadam (ixtiyoriy). CAPTCHA — Cloudflare Turnstile

Spam ko'paysa: Cloudflare panel → Turnstile → Add site → domen `ai-school.uz`.
- **Site key** (ochiq) → `config.js` dagi `turnstileSiteKey`
- **Secret key** → `npx wrangler secret put TURNSTILE_SECRET`

Saytning CSP'si Turnstile uchun oldindan tayyorlangan.

## Narx va kurslarni o'zgartirish

`site/assets/js/catalog.js`:
- xizmat narxi: `price: "agreed"` (Kelishilgan holda), `"scope"` (Loyiha hajmiga qarab) yoki
  `price: { uz: "200 000 so'mdan", ru: "от 200 000 сум", en: "from 200,000 UZS" }`
- yangi kurs: `courses` ro'yxatiga qator qo'shing — "Offline darslarga yozilish" formasida avtomatik chiqadi.

## Test qilish (joylagandan keyin)

1. `ai-school.uz/enroll.html` → formani bo'sh yuboring → xatolar ko'rinadi.
2. To'liq to'ldirib yuboring → "Arizangiz qabul qilindi!" + `AS-...` raqam, Telegram'da xabar keladi.
3. `ai-school.uz/services.html` → biror xizmatda "Buyurtma berish" → forma "Xizmat buyurtmasi" bilan to'ldiriladi.
4. Telegram'da tugmalarni bosing → xabardagi "📍 Holat" va "🕓 Tarix" yangilanadi.
5. Xatoliklar: `npx wrangler tail` (loglarda token va shaxsiy ma'lumot yozilmaydi).

## Google uchun

- Google Search Console → `ai-school.uz` (Domain) ni qo'shing → Sitemaps → `https://ai-school.uz/sitemap.xml`.
- GitHub → Settings → Pages: custom domain `ai-school.uz`, **Enforce HTTPS** yoqilgan bo'lsin.
- Birinchi o'rinni hech kim kafolatlay olmaydi; texnik SEO tayyor, qolgani — mazmun, havolalar va vaqt.

## Huquqiy eslatmalar

- Maxfiylik siyosati formalarga moslab yangilandi; "12 oydan ortiq saqlanmaydi" muddatini o'zingiz tasdiqlang yoki o'zgartiring.
- O'zbekiston qonunchiligi (O'RQ-547) fuqarolarning shaxsiy ma'lumotlarini O'zbekistondagi serverlarda saqlashni talab qiladi.
  Worker ma'lumotni saqlamaydi, lekin Telegram chati xorijiy server hisoblanadi — bu masalani yurist bilan ko'rib chiqing.
