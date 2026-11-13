/*
  ============================================================
  GARBAGE OF PARIS — main.js
  ============================================================
  Vanilla JS. Никаких зависимостей. Никаких фреймворков.

  Содержит:
  1. Мобильное меню
  2. Lightbox
  3. Галерея с фильтрами
  4. Архив-словарь по годам
  5. Главная: последние находки и «чек»-инвентаризация
  6. Back to top
  7. Сплэш-экран (мобильные)
  8. Смена языка: перерисовка того, что строится из data.js

  Тексты интерфейса на трёх языках — в assets/js/i18n.js.
  ============================================================
*/


/* ============================================================
   УТИЛИТЫ
   ============================================================ */

// Перевод строки интерфейса (см. assets/js/i18n.js).
// Без i18n.js возвращает английский текст по умолчанию.
function tr(key, vars, fallback) {
  if (window.I18N) return I18N.t(key, vars);
  return String(fallback || key).replace(/\{(\w+)\}/g, (m, k) => vars && vars[k] != null ? vars[k] : m);
}

function catLabel(name) {
  return window.I18N ? I18N.category(name) : name;
}

function findsLabel(n) {
  return window.I18N ? I18N.t('finds', { n }) : `${n} ${n === 1 ? 'find' : 'finds'}`;
}

// Экранирование текста перед вставкой в HTML
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(iso) {
  // "2025-05-12" → "12.05.2025"
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-');
  return d && m ? `${d}.${m}.${y}` : String(iso);
}

function photoYear(p) {
  return String(p.year || (p.date || '').slice(0, 4));
}

// Все фото, самые свежие первыми. Каждому присваивается номер находки:
// № 1 — самая старая фотография в архиве.
let photoCache = null;
function sortedPhotos() {
  if (photoCache) return photoCache;
  const list = (typeof photos !== 'undefined' && Array.isArray(photos)) ? photos : [];
  const asc = list
    .filter(p => p && p.image)
    .slice()
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  asc.forEach((p, i) => { p._no = i + 1; });
  photoCache = asc.reverse();
  return photoCache;
}

function photoNo(p) {
  return '№ ' + String(p._no || 0).padStart(3, '0');
}

// Наклон и скотч для полароидов — «случайные», но одинаковые при каждой загрузке
const TILTS = [-2.2, 1.6, -0.8, 2.4, -1.6, 0.9, -2.6, 1.2];
function tiltOf(i) { return TILTS[i % TILTS.length]; }
function tapeOf(i) { return ['left', 'center', 'right'][(i * 7 + 1) % 3]; }

function safeSession(action, key, value) {
  try {
    return action === 'get' ? sessionStorage.getItem(key) : sessionStorage.setItem(key, value);
  } catch (e) {
    return null;
  }
}

function onMediaChange(query, handler) {
  const mq = window.matchMedia(query);
  if (mq.addEventListener) mq.addEventListener('change', handler);
  else if (mq.addListener) mq.addListener(handler); // старый Safari
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}


/* ============================================================
   1. МОБИЛЬНОЕ МЕНЮ
   ============================================================ */

function initMobileMenu() {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-links');
  if (!toggle || !menu) return;

  function setOpen(isOpen) {
    menu.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? tr('menu.close', null, 'Close menu') : tr('menu.open', null, 'Open menu'));
    document.body.classList.toggle('menu-open', isOpen);
  }

  toggle.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
  document.addEventListener('gop:langchange', () => setOpen(menu.classList.contains('is-open')));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  onMediaChange('(min-width: 1025px)', e => { if (e.matches) setOpen(false); });
}


/* ============================================================
   2. LIGHTBOX
   ============================================================ */

let lightboxPhotos = [];
let lightboxIndex = 0;
let lightboxReturnFocus = null;

function createLightbox() {
  if (document.getElementById('lightbox')) return;

  const lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.hidden = true;
  lb.innerHTML = `
    <div class="lb-backdrop"></div>
    <div class="lb-topbar">
      <span class="lb-counter" aria-live="polite"></span>
      <button class="lb-close" type="button"></button>
    </div>
    <button class="lb-prev" type="button"></button>
    <button class="lb-next" type="button"></button>
    <figure class="lb-content">
      <div class="lb-frame">
        <img class="lb-img" alt="" />
        <p class="lb-title"></p>
      </div>
      <figcaption class="lb-meta">
        <p class="lb-caption"></p>
        <p class="lb-info"></p>
      </figcaption>
    </figure>
  `;
  document.body.appendChild(lb);
  labelLightbox();

  lb.querySelector('.lb-backdrop').addEventListener('click', closeLightbox);
  lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
  lb.querySelector('.lb-prev').addEventListener('click', () => moveLightbox(-1));
  lb.querySelector('.lb-next').addEventListener('click', () => moveLightbox(1));
  lb.querySelector('.lb-content').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLightbox();
  });

  const img = lb.querySelector('.lb-img');
  img.addEventListener('load', () => img.classList.remove('is-loading'));
  img.addEventListener('error', () => img.classList.remove('is-loading'));

  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') moveLightbox(-1);
    if (e.key === 'ArrowRight') moveLightbox(1);
    if (e.key === 'Tab') trapFocus(e, lb);
  });

  // Свайпы на телефоне
  let startX = null;
  let startY = null;
  lb.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) moveLightbox(dx < 0 ? 1 : -1);
    startX = null;
  });
}

// Подписи кнопок просмотрщика — на текущем языке
function labelLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.setAttribute('aria-label', tr('lb.aria', null, 'Photograph viewer'));
  [['.lb-close', 'lb.close', 'close ×', 'Close'],
   ['.lb-prev', 'lb.prev', '← prev', 'Previous photograph'],
   ['.lb-next', 'lb.next', 'next →', 'Next photograph']].forEach(([sel, key, text, aria]) => {
    const b = lb.querySelector(sel);
    b.textContent = tr(key, null, text);
    b.setAttribute('aria-label', tr(key + '.aria', null, aria));
  });
  if (!lb.hidden && lightboxPhotos.length) renderLightboxSlide();
}

function trapFocus(e, container) {
  const focusable = [...container.querySelectorAll('button')].filter(b => !b.hidden && b.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function openLightbox(list, index) {
  const lb = document.getElementById('lightbox');
  if (!lb || !list.length) return;
  lightboxPhotos = list;
  lightboxIndex = index;
  lightboxReturnFocus = document.activeElement;

  const single = list.length < 2;
  lb.querySelector('.lb-prev').hidden = single;
  lb.querySelector('.lb-next').hidden = single;

  renderLightboxSlide();
  lb.hidden = false;
  document.body.classList.add('lb-open');
  requestAnimationFrame(() => lb.classList.add('is-open'));
  lb.querySelector('.lb-close').focus();
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb || lb.hidden) return;
  lb.classList.remove('is-open');
  lb.hidden = true;
  lb.querySelector('.lb-img').removeAttribute('src');
  document.body.classList.remove('lb-open');
  if (lightboxReturnFocus && lightboxReturnFocus.focus) lightboxReturnFocus.focus();
}

function moveLightbox(dir) {
  if (lightboxPhotos.length < 2) return;
  lightboxIndex = (lightboxIndex + dir + lightboxPhotos.length) % lightboxPhotos.length;
  renderLightboxSlide();
}

function renderLightboxSlide() {
  const p = lightboxPhotos[lightboxIndex];
  const lb = document.getElementById('lightbox');
  const img = lb.querySelector('.lb-img');

  img.classList.add('is-loading');
  img.src = p.image;
  img.alt = p.alt || p.title || '';
  if (img.complete) img.classList.remove('is-loading');

  lb.querySelector('.lb-title').textContent = p.title || '';
  lb.querySelector('.lb-caption').textContent = p.caption || '';
  lb.querySelector('.lb-info').textContent =
    [photoNo(p), formatDate(p.date), p.location, p.category && catLabel(p.category)].filter(Boolean).join('  ·  ');
  lb.querySelector('.lb-counter').textContent = `${lightboxIndex + 1} / ${lightboxPhotos.length}`;

  // Подгружаем соседние фото заранее
  [-1, 1].forEach(d => {
    const n = lightboxPhotos[(lightboxIndex + d + lightboxPhotos.length) % lightboxPhotos.length];
    if (n) new Image().src = n.image;
  });
}

// Делает элементы кликабельными: открывают lightbox по клику, Enter или пробелу
function bindLightboxTriggers(container, selector, list) {
  container.querySelectorAll(selector).forEach((el, i) => {
    el.addEventListener('click', () => openLightbox(list, i));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(list, i);
      }
    });
  });
}

// Разметка полароида (используется на главной и в галерее)
function polaroidHTML(p, i, opts) {
  const o = opts || {};
  return `
    <article class="find" style="--tilt:${tiltOf(i)}deg" ${o.role ? `role="${o.role}"` : ''}>
      <button class="polaroid polaroid--${tapeOf(i)}" type="button" aria-label="${esc(tr('photo.open', { title: p.title }, 'Open photograph: {title}'))}">
        <span class="polaroid__photo">
          <img src="${esc(p.image)}" alt="${esc(p.alt || p.title)}" loading="${o.eager ? 'eager' : 'lazy'}" decoding="async" />
        </span>
        <span class="polaroid__note">${esc(p.title)}</span>
      </button>
      <p class="find__tag">
        <span>${photoNo(p)}</span>
        <time datetime="${esc(p.date)}">${formatDate(p.date)}</time>
        <span class="find__cat">${esc(catLabel(p.category))}</span>
      </p>
      ${o.caption === false ? '' : `<p class="find__caption">${esc(p.caption)}</p>`}
      <p class="find__place">${esc(p.location)}</p>
    </article>`;
}


/* ============================================================
   3. ГАЛЕРЕЯ
   ============================================================ */

function initGallery() {
  const container = document.getElementById('gallery-grid');
  if (!container) return;

  const sorted = sortedPhotos();
  const params = new URLSearchParams(location.search);
  const state = {
    year: params.get('year') || 'all',
    cat: params.get('category') || 'all'
  };

  buildFilters(sorted, container, state);
  applyFilters(sorted, container, state);

  document.addEventListener('gop:langchange', () => {
    renderFilters(sorted, state);
    applyFilters(sorted, container, state);
  });
}

function buildFilters(sorted, container, state) {
  const filtersWrap = document.getElementById('gallery-filters');
  if (!filtersWrap) return;

  renderFilters(sorted, state);

  filtersWrap.addEventListener('click', e => {
    const b = e.target.closest('.filter-btn');
    if (!b) return;
    const type = b.dataset.type;
    state[type] = b.dataset.filter;

    filtersWrap.querySelectorAll(`[data-type="${type}"]`).forEach(x => {
      const on = x === b;
      x.classList.toggle('active', on);
      x.setAttribute('aria-pressed', String(on));
    });

    // Фильтр сохраняется в адресе — ссылкой можно поделиться
    try {
      const url = new URL(location.href);
      ['year', 'category'].forEach(k => url.searchParams.delete(k));
      if (state.year !== 'all') url.searchParams.set('year', state.year);
      if (state.cat !== 'all') url.searchParams.set('category', state.cat);
      history.replaceState(null, '', url);
    } catch (err) { /* file:// и т.п. — не страшно */ }

    applyFilters(sorted, container, state);
  });
}

// Кнопки фильтров. Перерисовываются при смене языка; значения фильтров
// (год, категория из data.js) от языка не зависят.
function renderFilters(sorted, state) {
  const filtersWrap = document.getElementById('gallery-filters');
  if (!filtersWrap) return;

  const categories = (typeof CATEGORIES !== 'undefined' && Array.isArray(CATEGORIES)) ? CATEGORIES : [];
  const years = [...new Set(sorted.map(photoYear))].sort((a, b) => b.localeCompare(a));
  // Только категории, в которых есть фото (+ новые, которых нет в списке)
  const usedCats = new Set(sorted.map(p => p.category).filter(Boolean));
  const cats = [...categories.filter(c => usedCats.has(c)), ...[...usedCats].filter(c => !categories.includes(c))];

  if (state.year !== 'all' && !years.includes(state.year)) state.year = 'all';
  if (state.cat !== 'all' && !cats.includes(state.cat)) state.cat = 'all';

  const count = (type, value) => sorted.filter(p => (type === 'year' ? photoYear(p) : p.category) === value).length;
  const btn = (type, value, label, n) => `
    <button class="filter-btn${state[type] === value ? ' active' : ''}" type="button"
      data-type="${type}" data-filter="${esc(value)}" aria-pressed="${state[type] === value}">
      ${esc(label)}<sup class="filter-count">${n}</sup>
    </button>`;

  filtersWrap.innerHTML = `
    <div class="filter-group" role="group" aria-label="${esc(tr('filter.year.aria', null, 'Filter by year'))}">
      <span class="filter-label">${esc(tr('filter.year', null, 'year:'))}</span>
      ${btn('year', 'all', tr('filter.year.all', null, 'all'), sorted.length)}
      ${years.map(y => btn('year', y, y, count('year', y))).join('')}
    </div>
    <div class="filter-group" role="group" aria-label="${esc(tr('filter.cat.aria', null, 'Filter by category'))}">
      <span class="filter-label">${esc(tr('filter.cat', null, 'what:'))}</span>
      ${btn('cat', 'all', tr('filter.cat.all', null, 'everything'), sorted.length)}
      ${cats.map(c => btn('cat', c, catLabel(c), count('cat', c))).join('')}
    </div>
  `;
}

function applyFilters(sorted, container, state) {
  const filtered = sorted.filter(p =>
    (state.year === 'all' || photoYear(p) === state.year) &&
    (state.cat === 'all' || p.category === state.cat)
  );
  renderGallery(filtered, container);

  const status = document.getElementById('gallery-status');
  if (status) {
    status.textContent = findsLabel(filtered.length);
  }
}

function renderGallery(items, container) {
  if (items.length === 0) {
    container.innerHTML = `<p class="gallery-empty">${esc(tr('gallery.empty', null, 'Nothing here. Even the bins are empty.'))}</p>`;
    return;
  }
  container.innerHTML = items.map((p, i) => polaroidHTML(p, i, { role: 'listitem', eager: i < 6 })).join('');
  bindLightboxTriggers(container, '.polaroid', items);
}


/* ============================================================
   4. АРХИВ-СЛОВАРЬ ПО ГОДАМ
   ============================================================ */

function initArchive() {
  const container = document.getElementById('archive-container');
  if (!container) return;

  renderArchive(container);
  document.addEventListener('gop:langchange', () => renderArchive(container));
}

function renderArchive(container) {
  const sorted = sortedPhotos();
  const byYear = {};
  sorted.forEach(p => {
    const y = photoYear(p);
    (byYear[y] = byYear[y] || []).push(p);
  });

  const years = Object.keys(byYear).sort((a, b) => b.localeCompare(a));

  container.innerHTML = years.map(year => `
    <section class="archive-year" aria-labelledby="archive-${esc(year)}">
      <header class="archive-year__head">
        <h2 class="archive-year__title" id="archive-${esc(year)}">${esc(year)}</h2>
        <span class="archive-year__count">${esc(findsLabel(byYear[year].length))}</span>
      </header>
      <ol class="archive-entries">
        ${byYear[year].map((p, i) => `
          <li class="dict-entry" tabindex="0" role="button" aria-label="${esc(tr('photo.open', { title: p.title }, 'Open photograph: {title}'))}">
            <span class="dict-entry__no">${photoNo(p)}</span>
            <div class="dict-entry__body">
              <p class="dict-entry__head">
                <span class="dict-entry__word">${esc(p.title)}</span>
                <span class="dict-entry__pos">${esc(tr('archive.pos', { cat: catLabel(p.category) }, 'n., {cat}'))}</span>
              </p>
              <p class="dict-entry__def">${esc(p.caption)}</p>
              <p class="dict-entry__meta">${formatDate(p.date)} — ${esc(p.location)}</p>
            </div>
            <span class="dict-entry__thumb" style="--tilt:${tiltOf(i + 3)}deg">
              <img src="${esc(p.image)}" alt="" loading="lazy" decoding="async" />
            </span>
          </li>
        `).join('')}
      </ol>
    </section>
  `).join('');

  // Один lightbox на весь архив — листается через все годы
  bindLightboxTriggers(container, '.dict-entry', sorted);
}


/* ============================================================
   5. ГЛАВНАЯ: ПОСЛЕДНИЕ НАХОДКИ И «ЧЕК»
   ============================================================ */

function initLatest() {
  const container = document.getElementById('latest-grid');
  if (!container) return;

  const latest = sortedPhotos().slice(0, 4); // 4 последних
  const render = () => {
    container.innerHTML = latest.map((p, i) => polaroidHTML(p, i + 1, { caption: false, eager: true })).join('');
    bindLightboxTriggers(container, '.polaroid', latest);
  };
  render();
  document.addEventListener('gop:langchange', render);
}

function initStats() {
  const all = sortedPhotos();
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  set('stat-photos', all.length);
  set('stat-places', new Set(all.map(p => p.location).filter(Boolean)).size);
  set('stat-categories', new Set(all.map(p => p.category).filter(Boolean)).size);
  if (all.length) set('stat-latest', formatDate(all[0].date));
}


/* ============================================================
   6. BACK TO TOP
   ============================================================ */

function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  const update = () => btn.classList.toggle('visible', window.scrollY > 500);
  update();
  window.addEventListener('scroll', update, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
}


/* ============================================================
   7. СПЛЭШ-ЭКРАН (только мобильные)
   ============================================================
   Появляется при первом открытии сайта на мобильном,
   один раз за сессию. Тап — закрыть досрочно.
   ============================================================ */

function initSplash() {
  if (window.innerWidth > 768) return;
  if (prefersReducedMotion()) return;
  if (safeSession('get', 'gop-splash-shown')) return;
  safeSession('set', 'gop-splash-shown', '1');

  const splash = document.createElement('div');
  splash.id = 'splash';
  splash.setAttribute('aria-hidden', 'true');
  splash.innerHTML = `
    <div class="splash-inner">
      <p class="splash-kicker">${esc(tr('splash.kicker', null, 'dictionary of the street'))}</p>
      <p class="splash-word">garbage</p>
      <p class="splash-struck">${esc(tr('splash.struck', null, 'waste; refuse'))}</p>
      <p class="splash-note">of Paris</p>
    </div>
  `;

  document.body.appendChild(splash);
  document.body.classList.add('splash-open');
  requestAnimationFrame(() => requestAnimationFrame(() => splash.classList.add('splash-visible')));

  let closed = false;
  function hide() {
    if (closed) return;
    closed = true;
    splash.classList.add('splash-exit');
    setTimeout(() => {
      splash.remove();
      document.body.classList.remove('splash-open');
    }, 600);
  }

  setTimeout(hide, 2400);
  splash.addEventListener('click', hide);
}


/* ============================================================
   8. СМЕНА ЯЗЫКА
   ============================================================
   Сами тексты переключает assets/js/i18n.js. Галерея, архив и
   главная перерисовываются в своих блоках выше (событие gop:langchange).
   Здесь — то, что живёт вне этих блоков.
   ============================================================ */

function initLangChange() {
  document.addEventListener('gop:langchange', labelLightbox);
}


/* ============================================================
   ИНИЦИАЛИЗАЦИЯ
   Каждый блок запускается отдельно: ошибка в одном
   не ломает остальные.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  [
    initSplash, createLightbox, initMobileMenu, initGallery, initArchive,
    initLatest, initStats, initBackToTop, initLangChange
  ].forEach(fn => {
    try { fn(); } catch (err) { console.error(fn.name, err); }
  });
});
