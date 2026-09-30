/*
  ============================================================
  GARBAGE OF PARIS — main.js
  ============================================================
  Vanilla JS. Никаких зависимостей. Никаких фреймворков.

  Содержит:
  1. Мобильное меню
  2. Lightbox
  3. Рендер галереи с фильтрами
  4. Рендер архива по годам
  5. Блок latest и счётчики на главной
  6. Back to top
  7. Сплэш-экран (мобильные)
  8. Переключатель языка манифеста
  ============================================================
*/


/* ============================================================
   УТИЛИТЫ
   ============================================================ */

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
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function photoYear(p) {
  return String(p.year || (p.date || '').slice(0, 4));
}

// Все фото, самые свежие первыми (строки ISO сравниваются корректно)
function sortedPhotos() {
  if (typeof photos === 'undefined') return [];
  return [...photos].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

function safeSession(action, key, value) {
  try {
    return action === 'get' ? sessionStorage.getItem(key) : sessionStorage.setItem(key, value);
  } catch (e) {
    return null;
  }
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
    toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', isOpen);
  }

  toggle.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));

  // Закрыть меню при клике на ссылку, по Escape и при переходе на десктоп
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 769px)').addEventListener('change', e => {
    if (e.matches) setOpen(false);
  });
}

// Тень у шапки после начала прокрутки
function initHeaderState() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
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
  lb.setAttribute('aria-label', 'Photograph viewer');
  lb.hidden = true;
  lb.innerHTML = `
    <div class="lb-backdrop"></div>
    <div class="lb-topbar">
      <span class="lb-counter" aria-live="polite"></span>
      <button class="lb-close" type="button" aria-label="Close">Close ✕</button>
    </div>
    <button class="lb-prev" type="button" aria-label="Previous photograph">←</button>
    <button class="lb-next" type="button" aria-label="Next photograph">→</button>
    <figure class="lb-content">
      <div class="lb-img-wrap">
        <img class="lb-img" src="" alt="" />
      </div>
      <figcaption class="lb-meta">
        <p class="lb-title"></p>
        <p class="lb-caption"></p>
        <p class="lb-info"></p>
      </figcaption>
    </figure>
  `;
  document.body.appendChild(lb);

  lb.querySelector('.lb-backdrop').addEventListener('click', closeLightbox);
  lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
  lb.querySelector('.lb-prev').addEventListener('click', () => moveLightbox(-1));
  lb.querySelector('.lb-next').addEventListener('click', () => moveLightbox(1));

  // Клик по пустому месту вокруг фото тоже закрывает
  lb.querySelector('.lb-content').addEventListener('click', e => {
    if (e.target === e.currentTarget || e.target.classList.contains('lb-img-wrap')) closeLightbox();
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
    [formatDate(p.date), p.location, p.category].filter(Boolean).join('  ·  ');
  lb.querySelector('.lb-counter').textContent =
    `${String(lightboxIndex + 1).padStart(2, '0')} / ${String(lightboxPhotos.length).padStart(2, '0')}`;

  // Подгружаем соседние фото заранее
  [-1, 1].forEach(d => {
    const n = lightboxPhotos[(lightboxIndex + d + lightboxPhotos.length) % lightboxPhotos.length];
    if (n) new Image().src = n.image;
  });
}

// Делает набор элементов кликабельными: открывают lightbox по клику, Enter или пробелу
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
}

function buildFilters(sorted, container, state) {
  const filtersWrap = document.getElementById('gallery-filters');
  if (!filtersWrap) return;

  const years = [...new Set(sorted.map(photoYear))].sort((a, b) => b.localeCompare(a));
  // Только категории, в которых есть фото (+ те, что есть в данных, но не в списке)
  const usedCats = new Set(sorted.map(p => p.category));
  const cats = [...CATEGORIES.filter(c => usedCats.has(c)), ...[...usedCats].filter(c => c && !CATEGORIES.includes(c))];

  if (state.year !== 'all' && !years.includes(state.year)) state.year = 'all';
  if (state.cat !== 'all' && !cats.includes(state.cat)) state.cat = 'all';

  const count = (type, value) => sorted.filter(p => (type === 'year' ? photoYear(p) : p.category) === value).length;
  const btn = (type, value, label, n) => `
    <button class="filter-btn${state[type] === value ? ' active' : ''}" type="button"
      data-type="${type}" data-filter="${esc(value)}" aria-pressed="${state[type] === value}">
      ${esc(label)}<span class="filter-count">${n}</span>
    </button>`;

  filtersWrap.innerHTML = `
    <div class="filter-group" role="group" aria-label="Filter by year">
      <span class="filter-label">Year</span>
      ${btn('year', 'all', 'All', sorted.length)}
      ${years.map(y => btn('year', y, y, count('year', y))).join('')}
    </div>
    <div class="filter-group" role="group" aria-label="Filter by category">
      <span class="filter-label">Category</span>
      ${btn('cat', 'all', 'All', sorted.length)}
      ${cats.map(c => btn('cat', c, c, count('cat', c))).join('')}
    </div>
  `;

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

    // Сохраняем фильтр в адресе, чтобы им можно было поделиться
    const url = new URL(location.href);
    ['year', 'category'].forEach(k => url.searchParams.delete(k));
    if (state.year !== 'all') url.searchParams.set('year', state.year);
    if (state.cat !== 'all') url.searchParams.set('category', state.cat);
    history.replaceState(null, '', url);

    applyFilters(sorted, container, state);
  });
}

function applyFilters(sorted, container, state) {
  const filtered = sorted.filter(p =>
    (state.year === 'all' || photoYear(p) === state.year) &&
    (state.cat === 'all' || p.category === state.cat)
  );
  renderGallery(filtered, container);

  const status = document.getElementById('gallery-status');
  if (status) {
    status.textContent = `${filtered.length} ${filtered.length === 1 ? 'photograph' : 'photographs'}`;
  }
}

function renderGallery(items, container) {
  if (items.length === 0) {
    container.innerHTML = '<p class="gallery-empty">No photographs match this filter.</p>';
    return;
  }

  container.innerHTML = items.map((p, i) => `
    <article class="photo-card" role="listitem">
      <button class="photo-card__open" type="button" aria-label="Open photograph: ${esc(p.title)}">
        <span class="photo-card__img-wrap">
          <img src="${esc(p.image)}" alt="${esc(p.alt)}" loading="${i < 6 ? 'eager' : 'lazy'}" decoding="async" />
          <span class="photo-card__zoom" aria-hidden="true">View ↗</span>
        </span>
      </button>
      <div class="photo-card__meta">
        <span class="photo-card__cat">${esc(p.category)}</span>
        <time class="photo-card__date" datetime="${esc(p.date)}">${formatDate(p.date)}</time>
      </div>
      <h3 class="photo-card__title">${esc(p.title)}</h3>
      <p class="photo-card__caption">${esc(p.caption)}</p>
      <p class="photo-card__location">${esc(p.location)}</p>
    </article>
  `).join('');

  bindLightboxTriggers(container, '.photo-card__open', items);
}


/* ============================================================
   4. АРХИВ ПО ГОДАМ
   ============================================================ */

function initArchive() {
  const container = document.getElementById('archive-container');
  if (!container) return;

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
        <span class="archive-year__count">${byYear[year].length} ${byYear[year].length === 1 ? 'entry' : 'entries'}</span>
      </header>
      <ol class="archive-entries">
        ${byYear[year].map(p => `
          <li class="archive-entry" tabindex="0" role="button" aria-label="Open photograph: ${esc(p.title)}">
            <time class="archive-entry__date" datetime="${esc(p.date)}">${formatDate(p.date)}</time>
            <div class="archive-entry__body">
              <p class="archive-entry__title">${esc(p.title)}</p>
              <p class="archive-entry__caption">${esc(p.caption)}</p>
              <p class="archive-entry__meta">
                <span class="archive-entry__location">${esc(p.location)}</span>
                <span class="archive-entry__cat">${esc(p.category)}</span>
              </p>
            </div>
            <span class="archive-entry__thumb">
              <img src="${esc(p.image)}" alt="" loading="lazy" decoding="async" />
            </span>
          </li>
        `).join('')}
      </ol>
    </section>
  `).join('');

  // Один lightbox на весь архив — листается через все годы
  bindLightboxTriggers(container, '.archive-entry', sorted);
}


/* ============================================================
   5. БЛОК LATEST И СЧЁТЧИКИ НА ГЛАВНОЙ
   ============================================================ */

function initLatest() {
  const container = document.getElementById('latest-grid');
  if (!container) return;

  const latest = sortedPhotos().slice(0, 4); // Показываем 4 последних

  container.innerHTML = latest.map((p, i) => `
    <article class="latest-card" role="button" tabindex="0" aria-label="Open photograph: ${esc(p.title)}">
      <div class="latest-card__img-wrap">
        <img src="${esc(p.image)}" alt="${esc(p.alt)}" loading="lazy" decoding="async" />
        <span class="latest-card__index" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      </div>
      <div class="latest-card__meta">
        <span class="latest-card__cat">${esc(p.category)}</span>
        <time class="latest-card__date" datetime="${esc(p.date)}">${formatDate(p.date)}</time>
      </div>
      <h3 class="latest-card__title">${esc(p.title)}</h3>
      <p class="latest-card__location">${esc(p.location)}</p>
    </article>
  `).join('');

  bindLightboxTriggers(container, '.latest-card', latest);
}

function initStats() {
  const all = sortedPhotos();
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  set('stat-photos', all.length);
  set('stat-places', new Set(all.map(p => p.location)).size);
  set('stat-categories', new Set(all.map(p => p.category)).size);

  const years = all.map(photoYear).filter(Boolean).sort();
  if (years.length) set('stat-latest', years[years.length - 1]);
}


/* ============================================================
   6. BACK TO TOP
   ============================================================ */

function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  const update = () => btn.classList.toggle('visible', window.scrollY > 400);
  update();
  window.addEventListener('scroll', update, { passive: true });

  btn.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
}


/* ============================================================
   7. СПЛЭШ-ЭКРАН (только мобильные)
   ============================================================

   Появляется при первом открытии сайта на мобильном.
   Показывается 1 раз за сессию (sessionStorage).
   Анимация: логотип + заголовок → fade out.
   ============================================================ */

function initSplash() {
  // Только на мобильных и только если пользователь не просил меньше анимаций
  if (window.innerWidth > 768) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Только один раз за сессию
  if (safeSession('get', 'gop-splash-shown')) return;
  safeSession('set', 'gop-splash-shown', '1');

  const splash = document.createElement('div');
  splash.id = 'splash';
  splash.setAttribute('aria-hidden', 'true');
  splash.innerHTML = `
    <div class="splash-inner">
      <div class="splash-logo">
        <svg viewBox="0 0 60 80" width="60" height="80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="8" y="14" width="44" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <rect x="26" y="8" width="8" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <path d="M13 19 L16 72 Q16 74 18 74 L42 74 Q44 74 44 72 L47 19 Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <line x1="24" y1="22" x2="22" y2="71" stroke="currentColor" stroke-width="1" opacity="0.45"/>
          <line x1="36" y1="22" x2="38" y2="71" stroke="currentColor" stroke-width="1" opacity="0.45"/>
          <line x1="14.5" y1="42" x2="45.5" y2="42" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        </svg>
      </div>
      <div class="splash-title">
        <span class="splash-word">Garbage</span>
        <span class="splash-word">of Paris</span>
      </div>
      <div class="splash-sub">Visual sociology</div>
    </div>
  `;

  document.body.appendChild(splash);
  document.body.classList.add('splash-open');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => splash.classList.add('splash-visible'));
  });

  let closed = false;
  function hide() {
    if (closed) return;
    closed = true;
    splash.classList.add('splash-exit');
    setTimeout(() => {
      splash.remove();
      document.body.classList.remove('splash-open');
    }, 700);
  }

  setTimeout(hide, 2200);
  splash.addEventListener('click', hide); // Тап — закрыть досрочно
}


/* ============================================================
   8. ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА МАНИФЕСТА
   ============================================================ */

function initManifestoLang() {
  const toggle = document.querySelector('.manifesto-lang-toggle');
  if (!toggle) return;

  function switchLang(lang) {
    const target = document.getElementById('manifesto-' + lang);
    if (!target) return;
    document.querySelectorAll('.manifesto-lang').forEach(el => {
      el.classList.toggle('active', el === target);
      el.hidden = el !== target;
    });
    toggle.querySelectorAll('button').forEach(b => {
      const on = b.dataset.lang === lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (location.hash !== '#' + lang) history.replaceState(null, '', '#' + lang);
  }

  toggle.addEventListener('click', e => {
    const b = e.target.closest('button[data-lang]');
    if (b) switchLang(b.dataset.lang);
  });

  // manifesto.html#fr открывает сразу французскую версию
  const fromHash = location.hash.replace('#', '');
  switchLang(document.getElementById('manifesto-' + fromHash) ? fromHash : 'en');
}


/* ============================================================
   ИНИЦИАЛИЗАЦИЯ
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  initSplash();
  createLightbox();
  initMobileMenu();
  initHeaderState();
  initGallery();
  initArchive();
  initLatest();
  initStats();
  initBackToTop();
  initManifestoLang();
});
