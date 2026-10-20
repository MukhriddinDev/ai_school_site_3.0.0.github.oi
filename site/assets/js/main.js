(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LANGS = ['uz', 'ru', 'en'], cur = 'uz';
  var ME = doc.currentScript && doc.currentScript.src, BASE = ME ? ME.replace(/js\/main\.js(\?.*)?$/, '') : 'assets/';

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function dict(l) { return (window.I18N && window.I18N[l]) || null; }
  function T(key) { var d = dict(cur); return (d && d[key]) || ''; }

  /* ---------- theme ---------- */
  function setTheme(t, save) {
    root.setAttribute('data-theme', t);
    if (save) store('theme', t);
    var b = $('#themeBtn');
    if (b) {
      b.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      b.setAttribute('aria-label', T(t === 'dark' ? 'ui_theme_to_light' : 'ui_theme_to_dark'));
    }
    var m = $('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'dark' ? '#050D22' : '#0C1F4D');
  }
  var tb = $('#themeBtn');
  if (tb) tb.addEventListener('click', function () {
    setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
  });

  /* ---------- language ---------- */
  function loadLang(l, cb) {
    if (dict(l)) return cb();
    var s = doc.createElement('script');
    s.src = BASE + 'js/lang/' + l + '.js';
    s.onload = function () { cb(); };
    s.onerror = function () { cb(true); };
    doc.head.appendChild(s);
  }
  function applyLang(l) {
    var d = dict(l);
    if (!d) return;
    cur = l;
    root.lang = l;
    $$('[data-i]').forEach(function (el) { var v = d[el.getAttribute('data-i')]; if (v != null) el.textContent = v; });
    $$('[data-ih]').forEach(function (el) { var v = d[el.getAttribute('data-ih')]; if (v != null) el.innerHTML = v; });
    $$('[data-ia]').forEach(function (el) {
      el.getAttribute('data-ia').split(',').forEach(function (pair) {
        var p = pair.split('|'), v = d[p[1]];
        if (p[0] && v != null) el.setAttribute(p[0], v);
      });
    });
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === l ? 'true' : 'false'); });
    setTheme(root.getAttribute('data-theme') || 'light', false);
    var all = $('[data-all]');
    if (all) all.textContent = T(all.getAttribute('data-open') === '1' ? 'ui_close_all' : 'ui_open_all');
    renderVideos();
    startTyped();
    try { doc.dispatchEvent(new CustomEvent('ais:lang', { detail: l })); } catch (e) {}
  }
  function setLang(l, save) {
    if (LANGS.indexOf(l) < 0) l = 'uz';
    if (save) store('lang', l);
    loadLang(l, function (err) {
      if (!err) applyLang(l);
      root.classList.remove('i18n-wait');
    });
  }
  $$('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); });
  });

  /* ---------- navigation ---------- */
  var nav = $('#nav'), burger = $('#burger');
  function closeMenus(except) {
    $$('.has-sub.open').forEach(function (li) {
      if (li === except) return;
      li.classList.remove('open');
      var b = $('.nav-btn', li); if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  $$('.has-sub > .nav-btn').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var li = b.parentNode, open = !li.classList.contains('open');
      closeMenus(li);
      li.classList.toggle('open', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  doc.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('.has-sub')) closeMenus(); });
  function setBurger(open) {
    if (!nav || !burger) return;
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    doc.body.classList.toggle('nav-open', open);
  }
  if (burger) burger.addEventListener('click', function () { setBurger(!nav.classList.contains('open')); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenus(); setBurger(false); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 1240) setBurger(false); });

  /* ---------- scroll: progress, to-top, reveal ---------- */
  var prog = $('#progress'), topBtn = $('#toTop'), ticking = false;
  function onScroll() {
    var h = root.scrollHeight - root.clientHeight, y = window.pageYOffset || root.scrollTop;
    if (prog) prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    if (topBtn) topBtn.classList.toggle('show', y > 700);
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  if (topBtn) topBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  onScroll();

  var revealEls = $$('.reveal');
  if (!('IntersectionObserver' in window) || reduce) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); ro.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el, i) {
      var dd = parseFloat(el.getAttribute('data-d'));
      el.style.setProperty('--d', (isNaN(dd) ? (i % 4) * 0.08 : dd) + 's');
      ro.observe(el);
    });
  }

  /* ---------- counters ---------- */
  $$('.count').forEach(function (el) {
    var to = parseInt(el.getAttribute('data-to'), 10) || 0;
    if (reduce || !('IntersectionObserver' in window)) { el.textContent = to; return; }
    el.textContent = '0';
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      var t0 = null;
      (function step(t) {
        if (t0 === null) t0 = t;
        var p = Math.min((t - t0) / 1400, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * e);
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    }, { threshold: 0.6 });
    io.observe(el);
  });

  /* ---------- typed words ---------- */
  var typedTimer = null;
  function startTyped() {
    var el = $('.typed');
    if (!el) return;
    clearTimeout(typedTimer);
    var words = (el.getAttribute('data-words') || '').split('|'), w = 0, c = 0, del = false;
    if (reduce) { el.textContent = words[0]; return; }
    (function tick() {
      var word = words[w];
      if (!del) { c++; el.textContent = word.slice(0, c); if (c === word.length) { del = true; typedTimer = setTimeout(tick, 1400); return; } }
      else { c--; el.textContent = word.slice(0, c); if (c === 0) { del = false; w = (w + 1) % words.length; } }
      typedTimer = setTimeout(tick, del ? 45 : 95);
    })();
  }

  /* ---------- network canvas ---------- */
  $$('canvas.net').forEach(function (c) {
    if (!c.getContext) return;
    var ctx = c.getContext('2d'), w = 0, h = 0, pts = [], visible = true, raf = 0;
    var dens = parseFloat(c.getAttribute('data-density')) || 15000;
    function size() {
      var r = c.parentNode.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(80, (w * h) / dens)); pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .32, vy: (Math.random() - .5) * .32, r: 1.4 + Math.random() * 1.8, g: Math.random() < .3 });
      draw();
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      var d = 130, i, j, p, q, dx, dy, dist;
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        for (j = i + 1; j < pts.length; j++) {
          q = pts[j]; dx = p.x - q.x; dy = p.y - q.y; dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < d) { ctx.strokeStyle = 'rgba(60,200,240,' + ((1 - dist / d) * 0.4).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
      }
      for (i = 0; i < pts.length; i++) { p = pts[i]; ctx.fillStyle = p.g ? 'rgba(227,168,52,.9)' : 'rgba(60,200,240,.8)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill(); }
    }
    function step() {
      if (!visible) { raf = 0; return; }
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i]; p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      draw(); raf = requestAnimationFrame(step);
    }
    size();
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(size, 150); });
    if (!reduce) {
      raf = requestAnimationFrame(step);
      if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(step); }).observe(c.parentNode);
    }
  });

  /* ---------- tilt ---------- */
  if (!reduce && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = 'perspective(900px) rotateY(' + (x * 7).toFixed(2) + 'deg) rotateX(' + (-y * 7).toFixed(2) + 'deg)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- videos (language-aware, privacy-first: nothing loads from YouTube until "play") ---------- */
  var NAMES = { uz: 'ui_ln_uz', ru: 'ui_ln_ru', en: 'ui_ln_en' };
  var RE_V = /^[A-Za-z0-9_-]{11}$/, RE_P = /^[A-Za-z0-9_-]{10,64}$/;
  function norm(v) { if (!v) return null; return typeof v === 'string' ? { v: v } : v; }
  function valid(c) { return c && ((c.v && RE_V.test(c.v)) || (!c.v && c.p && RE_P.test(c.p))); }
  function mk(tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function playIcon() {
    var NS = 'http://www.w3.org/2000/svg', s = doc.createElementNS(NS, 'svg'), p = doc.createElementNS(NS, 'polygon');
    s.setAttribute('class', 'ico'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
    p.setAttribute('points', '5 3 19 12 5 21 5 3'); s.appendChild(p); return s;
  }
  function embedUrl(f, used) {
    var u = 'https://www.youtube-nocookie.com/embed/' + (f.v ? f.v + '?' : 'videoseries?list=' + f.p + '&') + 'autoplay=1&rel=0&hl=' + cur;
    if (used !== cur) u += '&cc_load_policy=1&cc_lang_pref=' + cur;
    var st = parseInt(f.s, 10), ix = parseInt(f.i, 10);
    if (st > 0) u += '&start=' + st;
    if (ix > 0) u += '&index=' + ix;
    if (f.v && f.l && RE_P.test(f.l)) u += '&list=' + f.l;
    return u;
  }
  function renderVideos() {
    var V = window.VIDEOS || {}, Q = window.VIDEO_Q || {};
    var chain = cur === 'uz' ? ['uz', 'ru', 'en'] : (cur === 'ru' ? ['ru', 'en'] : ['en']);
    $$('.video').forEach(function (el) {
      var id = el.getAttribute('data-vid'), entry = V[id] || {}, found = null, used = null, i;
      for (i = 0; i < chain.length; i++) { var c = norm(entry[chain[i]]); if (valid(c)) { found = c; used = chain[i]; break; } }
      el.textContent = '';
      if (!found) {
        var q = (Q[id] && (Q[id][cur] || Q[id].en)) || '';
        var box = mk('div', 'vnone'), a = mk('a', 'btn small', T('ui_vsearch'));
        box.appendChild(mk('p', null, T('ui_vnone')));
        a.href = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
        a.target = '_blank'; a.rel = 'noopener noreferrer';
        box.appendChild(a); el.appendChild(box);
        return;
      }
      var topic = el.closest ? el.closest('.topic') : null, h = topic && topic.querySelector('h3'), title = h ? h.textContent : '';
      var fr = mk('div', 'vframe'), btn = mk('button', 'vplay'), cap = mk('div', 'vcap');
      btn.type = 'button';
      btn.setAttribute('aria-label', T('ui_play') + (title ? ': ' + title : ''));
      btn.appendChild(playIcon());
      cap.appendChild(mk('span', 'vbadge', 'YouTube' + (found.p || found.l ? ' · ' + T('ui_playlist') : '')));
      cap.appendChild(mk('strong', null, title));
      fr.appendChild(btn); fr.appendChild(cap); el.appendChild(fr);
      var note = used !== cur ? T('ui_vnote').replace('{a}', T(NAMES[cur])).replace('{b}', T(NAMES[used])) : T('ui_vconsent');
      el.appendChild(mk('p', 'vnote', note));
      btn.addEventListener('click', function () {
        var f = doc.createElement('iframe');
        f.src = embedUrl(found, used); f.title = title || id; f.allowFullscreen = true;
        f.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
        f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        fr.textContent = ''; fr.appendChild(f);
      });
    });
  }

  /* ---------- guides: open all, toc ---------- */
  var allBtn = $('[data-all]');
  if (allBtn) allBtn.addEventListener('click', function () {
    var open = allBtn.getAttribute('data-open') !== '1';
    $$('.stages details').forEach(function (d) { d.open = open; });
    allBtn.setAttribute('data-open', open ? '1' : '0');
    allBtn.textContent = T(open ? 'ui_close_all' : 'ui_open_all');
  });
  function openFromHash() {
    var id = location.hash.slice(1); if (!id) return;
    var t = doc.getElementById(id);
    if (t && t.tagName === 'DETAILS') { t.open = true; setTimeout(function () { t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }, 60); }
  }
  window.addEventListener('hashchange', openFromHash);
  $$('.toc a').forEach(function (a) {
    a.addEventListener('click', function () { var t = doc.getElementById(a.getAttribute('href').slice(1)); if (t) t.open = true; });
  });
  if ('IntersectionObserver' in window && $('.toc')) {
    var links = {};
    $$('.toc a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { $$('.toc a.active').forEach(function (x) { x.classList.remove('active'); }); var a = links[e.target.id]; if (a) a.classList.add('active'); }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    $$('.stages details').forEach(function (d) { so.observe(d); });
  }

  /* ---------- init ---------- */
  var saved = store('lang');
  if (saved !== 'ru' && saved !== 'en') saved = 'uz';
  setTheme(root.getAttribute('data-theme') || 'light', false);
  $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === saved ? 'true' : 'false'); });
  if (saved === 'uz') {
    loadLang('uz', function (err) { if (!err) applyLang('uz'); else { renderVideos(); startTyped(); } root.classList.remove('i18n-wait'); });
  } else {
    setLang(saved, false);
    setTimeout(function () { root.classList.remove('i18n-wait'); }, 2500);
  }
  openFromHash();
})();
