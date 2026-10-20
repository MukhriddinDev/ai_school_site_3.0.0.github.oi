/*
  AI School: videos for each topic, by site language.

  HOW TO ADD YOUR OWN VIDEO
  1. Open your video on YouTube. The address looks like  https://www.youtube.com/watch?v=ABC123xyz00
     The part after "v=" (ABC123xyz00) is the video ID.
  2. Put the ID under the topic and language below, for example:
        "pc-word": { uz: "ABC123xyz00", ru: "...", en: "..." }
  3. Start the video from a given second:  { v: "ABC123xyz00", s: 175 }
  4. Show a whole playlist:                { p: "PLxxxxxxxxxxxxxxxx" }

  If a topic has no video in the visitor's language, the site shows the next one
  (Uzbek -> Russian -> English). {i: 3} starts a playlist from its 4th video. If there is none at all, a "search on YouTube" button
  is shown (the search words are in VIDEO_Q at the bottom).
*/
window.VIDEOS = {
  /* ----- Kompyuter savodxonligi / Computer literacy ----- */
  "pc-hw":    { uz: "NWPz4uEwJAE", ru: "hscJXcQXOS4", en: "HB4I2CgkcCo" },
  "pc-win":   { uz: "E4wH3Fj2TyY", ru: "y8s4nPcMUFw", en: "KhUTR7to3hQ" },
  "pc-files": { uz: "9dgwVBbjrm8", ru: "yEmcPIdQh4k", en: "k-EID5_2D9U" },
  "pc-keys":  { uz: "WxDOwMqvuDo", ru: "qEwiFkbo69A", en: { v: "tuWFNrfjy-c", l: "PLl7bxsSiKuDbZgHkP6LgEfILKv0qEQsjW" } },
  "pc-word":  { uz: "phxtp3FA52U", ru: "_9HH_0tc2pw", en: "5Im87VPQZ_0" },
  "pc-excel": { uz: "BNeuhSjAVEI", ru: "e2AsCl5E4jQ", en: "Ai0MV7twEBE" },
  "pc-ppt":   { uz: "aOwVwDHrdwQ", ru: "LKCKmwwBRsI", en: "KqgyvGxISxk" },
  "pc-net":   { uz: "FhxYUXRzud4", ru: "luVl78s-RxU", en: "Ln36DnnTrX8" },
  "pc-sec":   { uz: "BtNg2wbo--Q", ru: "k94w8MeFON8", en: "HxySrSbSY7o" },

  /* ----- Sun'iy intellekt / Artificial intelligence ----- */
  "ai-what":   { uz: "6EGisxboh-U", ru: "t0NxPKEI-vU", en: "ad79nYk2keg" },
  "ai-setup":  { uz: "fj_GLU344bQ", ru: { v: "34Rp6KVGIEM", l: "PLDyJYA6aTY1lPWXBPk0gw6gR8fEtPDGKa" }, en: "JaEnvMV4Fg8" },
  "ai-vars":   { uz: "fU-3YmGTWyg", ru: "DZvNZ9l9NT4", en: "LKFrQXaoSMQ" },
  "ai-flow":   { uz: "QH5Q_dyj3dI", ru: "ZGrd60FTBTg", en: { v: "89tgwKTo-rE", l: "PLBlnK6fEyqRgLrEXTUZUm5ys5HN0RUrrb" } },
  "ai-struct": { uz: "s2SsA2_64o4", ru: "Rq3UqTYc6mA", en: { v: "f2RATcdPcrE", l: "PLBlnK6fEyqRhJ_qiFbz9KZB1CO1HXBDHb" } },
  "ai-func":   { uz: "Mi0GzaBguEQ", ru: "6IEf15FdFkM", en: "pTB0EiLXUC8" },
  "ai-math":   { uz: { v: "pRQ9v_OKUrU", l: "PL4na6bFwPfAElzOBv5TjvQL9lUYZBAIX-" }, ru: "yFvGGVOzVlQ", en: "YZOAiJmnNvc" },
  "ai-numpy":  { uz: "d3PYHq5Ot0o", ru: "VBKzAfG5D0M", en: "lLRBYKwP8GQ" },
  "ai-pandas": { uz: { v: "4GW9r8ZA0zw", l: "PLT9-bRJMC-46sFMo3wJuW6zdOXcFUpRyp" }, ru: { v: "clDQPyQJ-hc", l: "PLA0M1Bcd0w8xQx-X5a6eSEOYULNSnHN_p" }, en: "VXtjG_GzO7Q" },
  "ai-ml":     { uz: { v: "yvfs6FssaX0", l: "PLFG5Qu5AP7F6FqGD937sxsb0bwt7MkIrH" }, ru: "sNDW8d8eB1U", en: "0B5eIE_1vpU" },
  "ai-dl":     { uz: { v: "YVyjIaM7eX8", l: "PL-agEbLmY0P-gkUhUx6msMCTOoKt6w3Ar" }, ru: "X-v5XyT1XwU", en: { v: "aircAruvnKk", l: "PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi" } },
  "ai-cv":     { uz: "cKl40XLAYzw", ru: { v: "_23gclr91P4", l: "PL0lO_mIqDDFUAQ2RdAgLp6Tj_fREcxk6T" }, en: "P4Z8_qe2Cu0" },
  "ai-nlp":    { uz: "mXDmX2g4g18", ru: "LPZh9BOjkQs", en: { v: "LPZh9BOjkQs", s: 34 } },
  "ai-bot":    { uz: { v: "oRSa8NXWMXQ", l: "PLwsopmzfbOn8x3CJKdQLtqDKhaF8n2r_7" }, ru: { v: "ObwoMskHDoA", l: "PL0lO_mIqDDFUev1gp9yEwmwcy8SicqKbt" }, en: { v: "13hoOflcImU", l: "PLY8YKR6ppROkoxw1STrBcM82-Vt_CQ3g2" } },
  "ai-ethics": { uz: "7Q1ZqC4DptQ", ru: "rZFAg3Afa8I", en: "4CSjodmjB6c" }
};

/* Search words used when a topic has no video yet */
window.VIDEO_Q = {
  "pc-hw":    { uz: "kompyuter qismlari tuzilishi dars", ru: "устройство компьютера для начинающих", en: "computer hardware basics for beginners" },
  "pc-win":   { uz: "Windows 10 11 darslari boshlovchilar uchun", ru: "Windows 10 11 для начинающих урок", en: "Windows 11 tutorial for beginners" },
  "pc-files": { uz: "fayl va papka bilan ishlash kompyuter darsi", ru: "файлы и папки Windows урок для начинающих", en: "files and folders Windows beginners" },
  "pc-keys":  { uz: "klaviaturada tez yozish qaynoq tugmalar", ru: "слепая печать и горячие клавиши Windows", en: "touch typing and keyboard shortcuts Windows" },
  "pc-word":  { uz: "Microsoft Word darslari 0 dan", ru: "Microsoft Word для начинающих урок", en: "Microsoft Word tutorial for beginners" },
  "pc-excel": { uz: "Excel darslari 0 dan formulalar", ru: "Excel для начинающих формулы", en: "Excel tutorial for beginners formulas" },
  "pc-ppt":   { uz: "PowerPoint taqdimot tayyorlash darsi", ru: "PowerPoint презентация для начинающих", en: "PowerPoint tutorial for beginners" },
  "pc-net":   { uz: "internet va elektron pochta Gmail darsi", ru: "интернет и электронная почта Gmail для начинающих", en: "internet browser and Gmail for beginners" },
  "pc-sec":   { uz: "internet xavfsizligi fishing parol", ru: "интернет безопасность фишинг пароли", en: "internet safety phishing passwords for beginners" },
  "ai-what":   { uz: "sun'iy intellekt nima tushuntirish", ru: "что такое искусственный интеллект простыми словами", en: "what is artificial intelligence explained" },
  "ai-setup":  { uz: "Python o'rnatish va birinchi dastur", ru: "установка Python и первая программа", en: "install Python first program" },
  "ai-vars":   { uz: "Python o'zgaruvchilar va ma'lumot turlari", ru: "Python переменные и типы данных", en: "Python variables and data types" },
  "ai-flow":   { uz: "Python if for while darslari", ru: "Python условия и циклы урок", en: "Python if for while loops tutorial" },
  "ai-struct": { uz: "Python list dict tuple darslari", ru: "Python списки словари кортежи", en: "Python lists dictionaries tuples" },
  "ai-func":   { uz: "Python funksiyalar modullar OOP", ru: "Python функции модули ООП", en: "Python functions modules classes" },
  "ai-math":   { uz: "sun'iy intellekt uchun matematika", ru: "математика для машинного обучения", en: "math for machine learning" },
  "ai-numpy":  { uz: "NumPy darslari Python", ru: "NumPy уроки Python", en: "NumPy tutorial Python" },
  "ai-pandas": { uz: "Pandas Matplotlib darslari", ru: "Pandas Matplotlib уроки", en: "Pandas Matplotlib tutorial" },
  "ai-ml":     { uz: "mashinaviy o'qitish scikit-learn", ru: "машинное обучение scikit-learn", en: "machine learning scikit-learn tutorial" },
  "ai-dl":     { uz: "neyron tarmoqlar Keras TensorFlow", ru: "нейронные сети Keras TensorFlow", en: "neural networks Keras TensorFlow tutorial" },
  "ai-cv":     { uz: "OpenCV Python kompyuter ko'rish", ru: "OpenCV Python компьютерное зрение", en: "OpenCV Python computer vision tutorial" },
  "ai-nlp":    { uz: "katta til modellari LLM prompt", ru: "большие языковые модели LLM промпт", en: "large language models LLM prompt engineering" },
  "ai-bot":    { uz: "aiogram 3 Telegram bot yaratish", ru: "aiogram 3 Telegram бот Python", en: "aiogram 3 Telegram bot Python tutorial" },
  "ai-ethics": { uz: "sun'iy intellekt etikasi", ru: "этика искусственного интеллекта", en: "AI ethics explained" }
};
