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
  5. Блок latest на главной
  6. Back to top
  ============================================================
*/


/* ============================================================
   1. МОБИЛЬНОЕ МЕНЮ
   ============================================================ */

function initMobileMenu() {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-links');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', function () {
    const isOpen = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen);
    toggle.textContent = isOpen ? '×' : '≡';
  });

  // Закрыть меню при клике на ссылку
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', false);
      toggle.textContent = '≡';
    });
  });
}


/* ============================================================
   2. LIGHTBOX
   ============================================================ */

let lightboxPhotos = [];
let lightboxIndex = 0;

function createLightbox() {
  const lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('role', 'dialog');
  lb.innerHTML = `
    <div class="lb-backdrop"></div>
    <div class="lb-content">
      <button class="lb-close" aria-label="Close">×</button>
      <button class="lb-prev" aria-label="Previous">←</button>
      <button class="lb-next" aria-label="Next">→</button>
      <div class="lb-img-wrap">
        <img class="lb-img" src="" alt="" />
      </div>
      <div class="lb-meta">
        <p class="lb-caption"></p>
        <p class="lb-info"></p>
      </div>
    </div>
  `;
  document.body.appendChild(lb);

  lb.querySelector('.lb-backdrop').addEventListener('click', closeLightbox);
  lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
  lb.querySelector('.lb-prev').addEventListener('click', () => moveLightbox(-1));
  lb.querySelector('.lb-next').addEventListener('click', () => moveLightbox(1));

  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') moveLightbox(-1);
    if (e.key === 'ArrowRight') moveLightbox(1);
  });
}

function openLightbox(photos, index) {
  lightboxPhotos = photos;
  lightboxIndex = index;
  renderLightboxSlide();
  document.getElementById('lightbox').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('is-open');
  document.body.style.overflow = '';
}

function moveLightbox(dir) {
  lightboxIndex = (lightboxIndex + dir + lightboxPhotos.length) % lightboxPhotos.length;
  renderLightboxSlide();
}

function renderLightboxSlide() {
  const p = lightboxPhotos[lightboxIndex];
  const lb = document.getElementById('lightbox');
  lb.querySelector('.lb-img').src = p.image;
  lb.querySelector('.lb-img').alt = p.alt;
  lb.querySelector('.lb-caption').textContent = p.caption;
  lb.querySelector('.lb-info').textContent = `${p.date} — ${p.location} — ${p.category}`;
}


/* ============================================================
   3. ГАЛЕРЕЯ
   ============================================================ */

function initGallery() {
  const container = document.getElementById('gallery-grid');
  if (!container) return;

  // Сортировка: самые свежие первыми
  const sorted = [...photos].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Строим кнопки фильтров
  buildFilters(sorted, container);

  // Рендерим все карточки
  renderGallery(sorted, container);
}

function buildFilters(sorted, container) {
  const filtersWrap = document.getElementById('gallery-filters');
  if (!filtersWrap) return;

  // Собираем уникальные годы из данных
  const years = [...new Set(sorted.map(p => p.year))].sort((a, b) => b - a);

  let html = `<button class="filter-btn active" data-filter="all" data-type="year">All years</button>`;
  years.forEach(y => {
    html += `<button class="filter-btn" data-filter="${y}" data-type="year">${y}</button>`;
  });

  html += `<span class="filter-sep">—</span>`;
  html += `<button class="filter-btn active" data-filter="all" data-type="cat">All categories</button>`;
  CATEGORIES.forEach(c => {
    html += `<button class="filter-btn" data-filter="${c}" data-type="cat">${c}</button>`;
  });

  filtersWrap.innerHTML = html;

  // Состояние фильтров
  let activeYear = 'all';
  let activeCat = 'all';

  filtersWrap.addEventListener('click', function (e) {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    const type = btn.dataset.type;
    const filter = btn.dataset.filter;

    if (type === 'year') {
      activeYear = filter;
      filtersWrap.querySelectorAll('[data-type="year"]').forEach(b => b.classList.remove('active'));
    } else {
      activeCat = filter;
      filtersWrap.querySelectorAll('[data-type="cat"]').forEach(b => b.classList.remove('active'));
    }
    btn.classList.add('active');

    // Фильтруем
    const filtered = sorted.filter(p => {
      const yearOk = activeYear === 'all' || p.year === activeYear;
      const catOk = activeCat === 'all' || p.category === activeCat;
      return yearOk && catOk;
    });

    renderGallery(filtered, container);
  });
}

function renderGallery(items, container) {
  if (items.length === 0) {
    container.innerHTML = '<p class="gallery-empty">No photographs match this filter.</p>';
    return;
  }

  container.innerHTML = items.map((p, i) => `
    <article class="photo-card" data-index="${i}" role="button" tabindex="0"
      aria-label="Open: ${p.title}">
      <div class="photo-card__img-wrap">
        <img src="${p.image}" alt="${p.alt}" loading="lazy" />
      </div>
      <div class="photo-card__meta">
        <span class="photo-card__cat">${p.category}</span>
        <span class="photo-card__date">${formatDate(p.date)}</span>
      </div>
      <p class="photo-card__location">${p.location}</p>
      <p class="photo-card__caption">${p.caption}</p>
    </article>
  `).join('');

  // Привязываем lightbox к карточкам
  container.querySelectorAll('.photo-card').forEach((card, i) => {
    card.addEventListener('click', () => openLightbox(items, i));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openLightbox(items, i);
    });
  });
}


/* ============================================================
   4. АРХИВ ПО ГОДАМ
   ============================================================ */

function initArchive() {
  const container = document.getElementById('archive-container');
  if (!container) return;

  const sorted = [...photos].sort((a, b) => new Date(b.date) - new Date(a.date));
  const byYear = {};

  sorted.forEach(p => {
    if (!byYear[p.year]) byYear[p.year] = [];
    byYear[p.year].push(p);
  });

  const years = Object.keys(byYear).sort((a, b) => b - a);

  let html = '';
  years.forEach(year => {
    html += `
      <section class="archive-year">
        <h2 class="archive-year__title">${year}</h2>
        <div class="archive-entries">
          ${byYear[year].map(p => `
            <div class="archive-entry">
              <time class="archive-entry__date" datetime="${p.date}">${formatDate(p.date)}</time>
              <div class="archive-entry__body">
                <span class="archive-entry__location">${p.location}</span>
                <span class="archive-entry__cat">[${p.category}]</span>
                <p class="archive-entry__caption">${p.caption}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  });

  container.innerHTML = html;
}


/* ============================================================
   5. БЛОК LATEST НА ГЛАВНОЙ
   ============================================================ */

function initLatest() {
  const container = document.getElementById('latest-grid');
  if (!container) return;

  const sorted = [...photos]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4); // Показываем 4 последних

  container.innerHTML = sorted.map((p, i) => `
    <article class="latest-card">
      <div class="latest-card__img-wrap">
        <img src="${p.image}" alt="${p.alt}" loading="lazy" />
      </div>
      <div class="latest-card__meta">
        <span class="latest-card__cat">${p.category}</span>
        <time class="latest-card__date">${formatDate(p.date)}</time>
      </div>
      <p class="latest-card__location">${p.location}</p>
      <p class="latest-card__caption">${p.caption}</p>
    </article>
  `).join('');
}


/* ============================================================
   6. BACK TO TOP
   ============================================================ */

function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


/* ============================================================
   УТИЛИТЫ
   ============================================================ */

function formatDate(iso) {
  // "2025-05-12" → "12.05.2025"
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}


/* ============================================================
   ИНИЦИАЛИЗАЦИЯ
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  createLightbox();
  initMobileMenu();
  initGallery();
  initArchive();
  initLatest();
  initBackToTop();
});
