/*
  ============================================================
  GARBAGE OF PARIS — lang-redirect.js
  ============================================================
  Подключается в <head> страниц, у которых есть копии на других
  языках (fr/…, ru/…), — до отрисовки, чтобы ничего не мелькало.

  - Читатель уже выбрал fr или ru, а открыл английскую страницу →
    перекидываем на его версию.
  - Старые ссылки ?lang=ru и manifesto.html#fr ведут на нужную копию.

  Поисковые роботы выбор не запоминают — для них ничего не меняется.
  ============================================================
*/

(function () {
  'use strict';
  var LANGS = ['en', 'fr', 'ru'];
  try {
    var page = document.documentElement.lang;
    var fromUrl = null;
    try { fromUrl = new URLSearchParams(location.search).get('lang'); } catch (e) { /* старые браузеры */ }
    var hash = location.hash.slice(1);
    var target = null;
    var keepHash = location.hash;

    if (LANGS.indexOf(fromUrl) >= 0) {
      target = fromUrl;
    } else if (LANGS.indexOf(hash) >= 0) {
      target = hash;          // manifesto.html#fr
      keepHash = '';
    } else if (page === 'en') {
      var saved = localStorage.getItem('gop-lang');
      if (saved === 'fr' || saved === 'ru') target = saved;
    }
    if (!target) return;

    localStorage.setItem('gop-lang', target);
    if (target === page) return;

    var link = document.querySelector('link[rel="alternate"][hreflang="' + target + '"]');
    if (!link) return;
    var search = location.search.replace(/([?&])lang=[^&]*(&|$)/, '$1').replace(/[?&]$/, '');
    location.replace(new URL(link.href).pathname + search + keepHash);
  } catch (e) { /* без localStorage — просто остаёмся на этой странице */ }
})();
