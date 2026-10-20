AI SCHOOL SAYTI (ko'p sahifali)
===============================

SAHIFALAR
  index.html            Bosh sahifa
  teacher.html          Ustoz
  students.html         O'quvchilar
  schedule.html         Jadval va narx
  course-computer.html  Kompyuter savodxonligi kursi (9 mavzu, video)
  course-ai.html        Sun'iy intellekt kursi (15 mavzu, video)
  guide-computer.html   Kompyuter qo'llanmasi (10 bosqich)
  guide-ai.html         Python va AI qo'llanmasi (15 bosqich)
  contact.html          Aloqa va savollar (menyuda: Bog‘lanish)
  enroll.html           Offline darslarga yozilish (forma)
  services.html         Xizmatlarimiz + Dasturchi bilan bog‘lanish (forma)
  privacy.html          Maxfiylik siyosati (3 tilda)
  404.html              Topilmadi sahifasi (GitHub Pages ishlatadi)

FAYLLAR
  assets/css/style.css  Dizayn, ranglar, animatsiyalar
  assets/js/init.js     Rejim va tilni sahifa chizilishidan oldin qo'llaydi
  assets/js/main.js     Menyu, til, kun/tun rejimi, video, animatsiyalar
  assets/js/videos.js   HAR BIR MAVZU UCHUN YOUTUBE VIDEOLAR (o'zingiz tahrirlaysiz)
  assets/js/lang/       Tarjimalar: uz.js, ru.js, en.js
  assets/js/config.js   FORMALAR MANZILI (Cloudflare Worker) — token YOZILMAYDI
  assets/js/catalog.js  KURSLAR RO'YXATI va XIZMAT NARXLARI (o'zingiz tahrirlaysiz)
  assets/js/forms.js    Formalarni tekshirish va yuborish
  assets/images/        Rasmlar

VIDEO QO'SHISH (assets/js/videos.js)
  YouTube manzili: https://www.youtube.com/watch?v=ABC123xyz00
  "v=" dan keyingi qism - video ID. Mavzu va til bo'yicha yozing:
      "pc-word": { uz: "ABC123xyz00", ru: "....", en: "...." }
  Videoni ma'lum soniyadan boshlash:  { v: "ABC123xyz00", s: 175 }
  Butun pleylist:                     { p: "PLxxxxxxxxxxxxxxxx" }
  Tanlangan tilda video bo'lmasa: o'zbekcha -> ruscha -> inglizcha tartibida ko'rsatiladi.

MATN VA TARJIMALARNI O'ZGARTIRISH
  O'zbekcha matn .html fayllarning ichida turadi (tahrirlash oson).
  Ruscha va inglizcha matn assets/js/lang/ru.js va en.js ichida.
  Bitta matnni o'zgartirsangiz, uchala tilda ham o'zgartiring
  (HTML dagi data-i="kXX" qiymati lang fayllaridagi kalit bilan bir xil).

SERVERGA / GITHUB PAGES GA JOYLASH
  Hamma fayl va papkalarni tuzilishini o'zgartirmasdan yuklang.
  YouTube videolar faqat internet manzildan (https://...) ochilganda ishlaydi.
  Faylni kompyuterdan to'g'ridan-to'g'ri ochsangiz, video xato ko'rsatishi mumkin.

XAVFSIZLIK VA QONUNIYLIK
  - Har bir sahifada qat'iy Content-Security-Policy (CSP) bor: kod faqat saytning o'zidan,
    shriftlar Google Fonts'dan, videolar faqat youtube-nocookie.com'dan yuklanadi.
    Yangi tashqi manba qo'shsangiz (boshqa video sayt, xarita va h.k.), uni barcha .html
    fayllarning <head> qismidagi CSP qatoriga ham qo'shish kerak, aks holda brauzer bloklaydi.
  - Sahifalarda inline <script> va style="" yo'q (CSP buni talab qiladi). Shunday saqlang.
  - YouTube videolar faqat foydalanuvchi "play" ni bosganda yuklanadi (oldin YouTube'ga
    hech qanday so'rov ketmaydi). Sayt cookie, reklama va kuzatuv vositalarini ishlatmaydi.
  - Barcha tashqi havolalar rel="noopener noreferrer" bilan.
  - .nojekyll       GitHub Pages fayllarni o'zgartirmasdan berishi uchun (o'chirmang)
  - robots.txt, sitemap.xml   Qidiruv tizimlari uchun
  - .well-known/security.txt  Xavfsizlik bo'yicha aloqa (muddati: 2027-10-15)
    O'z domeningizga o'tsangiz, shu uch fayldagi manzilni yangilang.
  - GitHub'da: Settings -> Pages -> "Enforce HTTPS" yoqilgan bo'lsin; GitHub hisobingizda
    ikki bosqichli tasdiqlashni yoqing; repozitoriyga parol yoki token yuklamang.
  - GitHub Pages server sarlavhalarini (masalan, X-Frame-Options) sozlashga ruxsat bermaydi.
    Bu kerak bo'lsa, Cloudflare kabi xizmat orqali qo'shish mumkin.
  - Maxfiylik siyosati O'zbekiston Respublikasining "Shaxsga doir ma'lumotlar to'g'risida"gi
    Qonunini (O'RQ-547) hisobga olib tayyorlangan. Uni yurist ko'rib chiqishi tavsiya etiladi.
  - O'quvchilar ismlarini joylashtirish uchun ularning (voyaga yetmaganlar uchun ota-onasining)
    roziligini oling.

FORMALAR VA TELEGRAM
  Formalar Telegram'ga Cloudflare Worker orqali yetkaziladi (worker/ papkasi).
  To'liq yo'riqnoma: YORIQNOMA.md
  enroll.html va services.html sahifalarining CSP'sida connect-src https://*.workers.dev va
  Turnstile (challenges.cloudflare.com) ruxsat etilgan. Worker uchun o'z domeningizni
  ishlatsangiz, shu ikki sahifaning CSP qatoriga qo'shing.
