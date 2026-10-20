/* =====================================================================
   AI SCHOOL — FORMALAR SOZLAMASI (bu faylni administrator tahrirlaydi)
   ---------------------------------------------------------------------
   apiUrl  : Cloudflare Worker manzili (worker/README.md ga qarang).
             Masalan: "https://ai-school-forms.SIZNING-NOMINGIZ.workers.dev/api/lead"
             Bo'sh qolsa, formalar "hali ulanmagan" degan halol xabar ko'rsatadi.
   turnstileSiteKey : Cloudflare Turnstile (CAPTCHA) ning OCHIQ "site key"i.
             Ixtiyoriy. Bo'sh qolsa, CAPTCHA ishlatilmaydi.

   DIQQAT: bu yerga Telegram bot tokeni, chat ID yoki boshqa maxfiy
   kalitni HECH QACHON yozmang — bu fayl hammaga ochiq.
   ===================================================================== */
window.AIS_CONFIG = {
  apiUrl: "",
  turnstileSiteKey: ""
};
