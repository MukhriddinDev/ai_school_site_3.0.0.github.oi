/* AI School — formalar: tekshiruv, yuborish, xizmat kartochkalari.
   Ma'lumot faqat config.js dagi apiUrl (Cloudflare Worker) ga yuboriladi.
   Bot tokeni hech qachon brauzerga tushmaydi. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var CFG = window.AIS_CONFIG || {};
  var CAT = window.AIS_CATALOG || { courses: [], times: [], services: [] };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Uzbek fallback texts (used only if the language file failed to load) */
  var FB = {
    n_f_choose: '— tanlang —', n_f_other: 'Boshqa', n_price_agreed: 'Kelishilgan holda', n_price_scope: 'Loyiha hajmiga qarab',
    n_e_required: 'Bu maydonni to‘ldiring.', n_e_name: 'Ism va familiyani to‘liq kiriting (kamida 3 ta harf).',
    n_e_phone: 'Telefon raqamini to‘g‘ri kiriting, masalan: +998 90 123 45 67.', n_e_age: 'Yosh 5 dan 99 gacha bo‘lishi kerak.',
    n_e_tg: 'Username 5–32 ta lotin harfi, raqam yoki _ dan iborat bo‘ladi.', n_e_details: 'Loyihani kamida 10 ta belgida tasvirlang.',
    n_e_consent: 'Davom etish uchun roziligingizni belgilang.', n_e_select: 'Ro‘yxatdan tanlang.',
    n_e_fix: 'Formada xatolar bor — belgilangan maydonlarni tekshiring.', n_e_captcha: '“Men robot emasman” tekshiruvini bajaring.',
    n_e_net: 'Internet bilan bog‘lanib bo‘lmadi. Qayta urinib ko‘ring yoki qo‘ng‘iroq qiling: +998 99 351 82 78.',
    n_e_rate: 'Juda ko‘p urinish. Bir daqiqadan so‘ng qayta urinib ko‘ring.',
    n_e_server: 'Murojaat yuborilmadi (server xatosi). Qayta urinib ko‘ring yoki qo‘ng‘iroq qiling: +998 99 351 82 78.',
    n_e_config: 'Onlayn forma hali ulanmagan. Iltimos, qo‘ng‘iroq qiling (+998 99 351 82 78) yoki Telegram’da yozing.',
    n_ok_enroll: 'Arizangiz qabul qilindi! Administrator tez orada siz bilan bog‘lanadi.',
    n_ok_dev: 'Murojaatingiz qabul qilindi. Tez orada siz bilan bog‘lanamiz.', n_ok_id: 'Murojaat raqami:',
    n_ok_again: 'Yana murojaat yuborish', n_f_sending: 'Yuborilmoqda…', n_more_price: 'Batafsil ma’lumot va narx', n_less: 'Yopish'
  };

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function L() { var l = root.lang; return (l === 'ru' || l === 'en') ? l : 'uz'; }
  function T(k) {
    var I = window.I18N || {}, d = I[L()], u = I.uz;
    return (d && d[k]) || (u && u[k]) || FB[k] || '';
  }
  function lab(o) { return o ? (o[L()] || o.uz || '') : ''; }
  function find(list, id) { for (var i = 0; i < (list || []).length; i++) if (list[i].id === id) return list[i]; return null; }
  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var a = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }

  /* ---------- catalog-driven selects & prices ---------- */
  function fillSelects() {
    $$('select[data-src]').forEach(function (sel) {
      var src = sel.getAttribute('data-src'), list = CAT[src] || [], val = sel.value || sel.getAttribute('data-pre') || '';
      sel.textContent = '';
      var ph = doc.createElement('option'); ph.value = ''; ph.textContent = T('n_f_choose'); sel.appendChild(ph);
      list.forEach(function (it) { var o = doc.createElement('option'); o.value = it.id; o.textContent = lab(it); sel.appendChild(o); });
      if (sel.hasAttribute('data-other')) { var ot = doc.createElement('option'); ot.value = 'other'; ot.textContent = T('n_f_other'); sel.appendChild(ot); }
      sel.value = val; if (sel.value !== val) sel.value = '';
      sel.removeAttribute('data-pre');
    });
  }
  function fillPrices() {
    $$('[data-price]').forEach(function (el) {
      var s = find(CAT.services, el.getAttribute('data-price')); if (!s) return;
      var p = s.price; el.textContent = typeof p === 'string' ? T('n_price_' + p) : lab(p);
    });
  }

  /* ---------- validation ---------- */
  function normPhone(v) {
    var raw = String(v || '').trim(), d = raw.replace(/\D/g, '');
    if (!raw.length) return null;
    if (d.length === 9 && raw.charAt(0) !== '+') d = '998' + d;
    if (/^998\d{9}$/.test(d)) return '+998 ' + d.substr(3, 2) + ' ' + d.substr(5, 3) + ' ' + d.substr(8, 2) + ' ' + d.substr(10, 2);
    if (raw.charAt(0) === '+' && d.length >= 10 && d.length <= 15 && d.indexOf('998') !== 0) return '+' + d;
    return null;
  }
  function rule(el) {
    var n = el.name, v = (el.type === 'checkbox') ? el.checked : String(el.value || '').trim();
    if (el.type === 'checkbox') return (el.required && !v) ? 'n_e_consent' : '';
    if (el.required && !v) return el.tagName === 'SELECT' ? 'n_e_select' : 'n_e_required';
    if (!v) return '';
    if (n === 'name') return (v.length < 3 || v.length > 80 || !/\p{L}.*\p{L}.*\p{L}/u.test(v)) ? 'n_e_name' : '';
    if (n === 'phone') return normPhone(v) ? '' : 'n_e_phone';
    if (n === 'age') { var a = Number(v); return (!/^\d{1,2}$/.test(v) || a < 5 || a > 99) ? 'n_e_age' : ''; }
    if (n === 'tg') return /^@?[A-Za-z][A-Za-z0-9_]{4,31}$/.test(v) ? '' : 'n_e_tg';
    if (n === 'details') return v.length < 10 ? 'n_e_details' : '';
    return '';
  }
  function showErr(el, key) {
    var box = el.closest('.field') || el.parentNode, p = $('.ferr', box);
    el.setAttribute('aria-invalid', key ? 'true' : 'false');
    box.classList.toggle('bad', !!key);
    if (p) { p.textContent = key ? T(key) : ''; p.setAttribute('data-k', key || ''); }
  }
  function check(el) { var k = rule(el); showErr(el, k); return !k; }
  function inputs(form) { return $$('input:not([type=hidden]):not([name=website]), select, textarea', form); }

  /* ---------- status line ---------- */
  function status(form, type, key, extra) {
    var st = $('.fstatus', form); if (!st) return;
    st.className = 'fstatus ' + (type || '');
    st.setAttribute('data-k', key || ''); st.setAttribute('data-x', extra || '');
    st.textContent = key ? T(key) + (extra ? ' ' + extra : '') : '';
    if (key) st.focus({ preventScroll: true });
  }

  /* ---------- Turnstile (optional CAPTCHA) ---------- */
  var tsReady = null;
  function loadTurnstile() {
    if (!CFG.turnstileSiteKey) return null;
    if (tsReady) return tsReady;
    tsReady = new Promise(function (res, rej) {
      var s = doc.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true; s.onload = function () { res(window.turnstile); }; s.onerror = rej;
      doc.head.appendChild(s);
    });
    return tsReady;
  }
  function mountCaptcha(form) {
    var box = $('.ts-box', form), p = loadTurnstile();
    if (!box || !p) return;
    p.then(function (ts) {
      form._ts = ts.render(box, { sitekey: CFG.turnstileSiteKey, language: L(), theme: root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', size: 'flexible' });
    }).catch(function () { box.textContent = ''; });
  }

  /* ---------- submit ---------- */
  function payload(form) {
    var f = form.elements, kind = form.getAttribute('data-kind'), g = function (n) { return f[n] ? String(f[n].value || '').trim() : ''; };
    var p = { kind: kind, lang: L(), name: g('name'), phone: normPhone(g('phone')) || g('phone'),
      hp: g('website'), t: Date.now() - (form._t0 || Date.now()), idem: form._idem || (form._idem = uid()) };
    if (form.getAttribute('data-kind') === 'enroll') {
      var c = find(CAT.courses, g('course')), tm = find(CAT.times, g('time'));
      p.courseId = g('course'); p.course = c ? c.uz : g('course');
      p.time = tm ? tm.uz : g('time'); p.age = g('age'); p.comment = g('comment');
    } else {
      var sid = g('service'), s = find(CAT.services, sid);
      p.kind = g('kind') === 'order' ? 'order' : 'dev';
      p.serviceId = sid; p.service = s ? s.uz : (sid === 'other' ? 'Boshqa' : sid);
      p.tg = g('tg').replace(/^@?/, g('tg') ? '@' : ''); p.details = g('details'); p.budget = g('budget'); p.deadline = g('deadline');
    }
    if (form._ts != null && window.turnstile) p.ts = window.turnstile.getResponse(form._ts) || '';
    return p;
  }
  function setBusy(form, on) {
    var b = $('button[type=submit]', form), l = b && $('.bl', b);
    form._busy = on;
    if (!b) return;
    b.disabled = on; b.setAttribute('aria-busy', on ? 'true' : 'false'); b.classList.toggle('busy', on);
    if (l) { if (on) { l._old = l.getAttribute('data-i'); l.textContent = T('n_f_sending'); } else if (l._old) { l.textContent = T(l._old); } }
  }
  function success(form, id) {
    var key = form.getAttribute('data-kind') === 'enroll' ? 'n_ok_enroll' : 'n_ok_dev';
    var box = $('.fdone', form), body = $('.fbody', form);
    form._idem = null;
    if (body) body.hidden = true;
    if (box) {
      box.hidden = false;
      $('.fdone-t', box).setAttribute('data-k', key); $('.fdone-t', box).textContent = T(key);
      $('.fdone-id b', box).textContent = id || '—';
      box.focus({ preventScroll: true });
      box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    }
  }
  function reset(form) {
    form.reset(); form._t0 = Date.now(); form._idem = null;
    var k = form.elements.kind; if (k) { k.value = 'dev'; orderChip(form, null); }
    inputs(form).forEach(function (el) { showErr(el, ''); });
    status(form, '', '');
    $('.fdone', form).hidden = true; $('.fbody', form).hidden = false;
    if (form._ts != null && window.turnstile) window.turnstile.reset(form._ts);
    var first = inputs(form)[0]; if (first) first.focus();
  }
  function submit(form) {
    if (form._busy) return;
    if (form.elements.website && form.elements.website.value) { return; }
    var bad = inputs(form).filter(function (el) { return !check(el); });
    if (bad.length) { status(form, 'err', 'n_e_fix'); bad[0].focus(); return; }
    if (!CFG.apiUrl) { status(form, 'err', 'n_e_config'); return; }
    var data = payload(form);
    if (CFG.turnstileSiteKey && !data.ts) { status(form, 'err', 'n_e_captcha'); return; }
    var phone = form.elements.phone; if (phone && normPhone(phone.value)) phone.value = normPhone(phone.value);
    setBusy(form, true); status(form, 'info', 'n_f_sending');
    var ctl = window.AbortController ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, 20000);
    fetch(CFG.apiUrl, { method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store', referrerPolicy: 'strict-origin-when-cross-origin',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { s: r.status, ok: r.ok, j: j }; }); })
      .then(function (r) {
        clearTimeout(to); setBusy(form, false);
        if (r.ok && r.j && r.j.ok === true) { status(form, '', ''); success(form, r.j.id); return; }
        if (r.s === 429 || (r.j && r.j.error === 'too_fast')) { status(form, 'err', 'n_e_rate'); }
        else if (r.s === 400 && r.j && r.j.field && form.elements[r.j.field]) { var el = form.elements[r.j.field]; showErr(el, rule(el) || 'n_e_required'); status(form, 'err', 'n_e_fix'); el.focus(); }
        else if (r.j && r.j.error === 'captcha') { status(form, 'err', 'n_e_captcha'); }
        else { status(form, 'err', 'n_e_server'); }
        if (form._ts != null && window.turnstile) window.turnstile.reset(form._ts);
      })
      .catch(function () {
        clearTimeout(to); setBusy(form, false); status(form, 'err', 'n_e_net');
        if (form._ts != null && window.turnstile) window.turnstile.reset(form._ts);
      });
  }

  /* ---------- order chip (services page) ---------- */
  function orderChip(form, sid) {
    var chip = $('.order-chip', form); if (!chip) return;
    var s = find(CAT.services, sid);
    chip.hidden = !s;
    if (s) $('.oc-name', chip).textContent = lab(s);
    chip.setAttribute('data-sid', s ? sid : '');
  }

  function init() {
    fillSelects(); fillPrices();
    var qs = window.URLSearchParams ? new URLSearchParams(location.search) : null;

    $$('form.lead-form').forEach(function (form) {
      form._t0 = Date.now();
      form.setAttribute('novalidate', '');
      if (qs) {
        var kc = qs.get('kurs'); if (kc && form.elements.course && find(CAT.courses, kc)) form.elements.course.value = kc;
        var ks = qs.get('xizmat'); if (ks && form.elements.service && find(CAT.services, ks)) form.elements.service.value = ks;
      }
      form.addEventListener('submit', function (e) { e.preventDefault(); submit(form); });
      inputs(form).forEach(function (el) {
        el.addEventListener('blur', function () { if (el.value || el.getAttribute('aria-invalid') === 'true') check(el); });
        el.addEventListener('change', function () { if (el.getAttribute('aria-invalid') === 'true' || el.type === 'checkbox') check(el); });
        el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') check(el); });
      });
      var again = $('[data-again]', form); if (again) again.addEventListener('click', function () { reset(form); });
      var clr = $('.oc-clear', form); if (clr) clr.addEventListener('click', function () { form.elements.kind.value = 'dev'; orderChip(form, null); });
      if (form.elements.service && form.elements.kind) form.elements.service.addEventListener('change', function () {
        if (form.elements.kind.value === 'order') { if (find(CAT.services, form.elements.service.value)) orderChip(form, form.elements.service.value); else { form.elements.kind.value = 'dev'; orderChip(form, null); } }
      });
      mountCaptcha(form);
    });

    /* services: details toggle + order buttons */
    $$('[data-more]').forEach(function (b) {
      var t = doc.getElementById(b.getAttribute('aria-controls'));
      b.addEventListener('click', function () {
        var open = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (t) t.hidden = !open;
        $('.bl', b).textContent = T(open ? 'n_less' : 'n_more_price');
      });
    });
    $$('[data-order]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var form = $('#devForm'); if (!form) return;
        e.preventDefault();
        var sid = a.getAttribute('data-order');
        form.elements.kind.value = 'order'; form.elements.service.value = sid; orderChip(form, sid); check(form.elements.service);
        if ($('.fdone', form).hidden === false) reset(form);
        $('#dev').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        setTimeout(function () { form.elements.name.focus({ preventScroll: true }); }, reduce ? 0 : 450);
        if (history.replaceState) history.replaceState(null, '', '#dev');
      });
    });
  }

  /* re-render dynamic texts when the language changes */
  doc.addEventListener('ais:lang', function () {
    fillSelects(); fillPrices();
    $$('form.lead-form').forEach(function (form) {
      $$('.ferr', form).forEach(function (p) { var k = p.getAttribute('data-k'); if (k) p.textContent = T(k); });
      var st = $('.fstatus', form), k = st && st.getAttribute('data-k'); if (k) st.textContent = T(k) + (st.getAttribute('data-x') ? ' ' + st.getAttribute('data-x') : '');
      var dt = $('.fdone-t', form), dk = dt && dt.getAttribute('data-k'); if (dk) dt.textContent = T(dk);
      orderChip(form, ($('.order-chip', form) || { getAttribute: function () { return null; } }).getAttribute('data-sid'));
      if (form._busy) { var l = $('button[type=submit] .bl', form); if (l) l.textContent = T('n_f_sending'); }
    });
    $$('[data-more]').forEach(function (b) { $('.bl', b).textContent = T(b.getAttribute('aria-expanded') === 'true' ? 'n_less' : 'n_more_price'); });
  });

  init();
})();
