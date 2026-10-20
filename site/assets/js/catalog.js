/* =====================================================================
   AI SCHOOL — KURSLAR, DARS VAQTLARI VA XIZMAT NARXLARI
   ---------------------------------------------------------------------
   Formalardagi ro'yxatlar shu fayldan avtomatik tuziladi.

   YANGI KURS QO'SHISH: "courses" ro'yxatiga yangi qator qo'shing:
       { id: "web", uz: "Veb-dasturlash", ru: "Веб-разработка", en: "Web development" },

   XIZMAT NARXINI O'ZGARTIRISH: "services" ichida kerakli xizmatning "price"ini o'zgartiring:
       price: "agreed"   -> "Kelishilgan holda"
       price: "scope"    -> "Loyiha hajmiga qarab"
       price: { uz: "200 000 so'mdan", ru: "от 200 000 сум", en: "from 200,000 UZS" }
   ===================================================================== */
window.AIS_CATALOG = {
  courses: [
    { id: "pc", uz: "Kompyuter savodxonligi", ru: "Компьютерная грамотность", en: "Computer literacy" },
    { id: "ai", uz: "Sun’iy intellekt (Python va AI)", ru: "Искусственный интеллект (Python и AI)", en: "Artificial intelligence (Python & AI)" }
  ],

  times: [
    { id: "main", uz: "Seshanba, payshanba, shanba — 13:10", ru: "Вторник, четверг, суббота — 13:10", en: "Tue, Thu, Sat — 13:10" },
    { id: "any", uz: "Istalgan vaqt mos keladi", ru: "Подходит любое время", en: "Any time works" },
    { id: "other", uz: "Boshqa vaqt (izohda yozing)", ru: "Другое время (укажите в комментарии)", en: "Another time (write in the comment)" }
  ],

  services: [
    { id: "office", uz: "MS Office xizmatlari", ru: "Услуги MS Office", en: "MS Office services", price: "agreed" },
    { id: "gov", uz: "Davlat xizmatlari bo‘yicha yordam", ru: "Помощь с госуслугами", en: "Help with government e-services", price: "agreed" },
    { id: "web", uz: "Veb-sayt yaratish", ru: "Создание сайтов", en: "Website development", price: "scope" },
    { id: "agent", uz: "AI agentlar yaratish", ru: "Создание AI-агентов", en: "AI agent development", price: "scope" },
    { id: "auto", uz: "Ish jarayonlarini avtomatlashtirish", ru: "Автоматизация процессов", en: "Workflow automation", price: "scope" },
    { id: "bot", uz: "Telegram botlar yaratish", ru: "Создание Telegram-ботов", en: "Telegram bot development", price: "scope" }
  ]
};
