/* Runs before the page is drawn: applies saved theme and hides text until the saved language is loaded. */
(function () {
  try {
    var d = document.documentElement, t = localStorage.getItem('theme');
    if (t !== 'dark' && t !== 'light') {
      t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    d.setAttribute('data-theme', t);
    var l = localStorage.getItem('lang');
    if (l === 'ru' || l === 'en') d.classList.add('i18n-wait');
  } catch (e) {}
})();
