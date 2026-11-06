/*
  ============================================================
  GARBAGE OF PARIS — visitors.js
  ============================================================
  Галерея зрителей (visitors.html):
  1. Форма: посетитель выбирает фото → оно сжимается прямо
     в браузере (и теряет геоданные) → уходит в Supabase
     в очередь на проверку.
  2. Стена: показывает только одобренные фото.

  Одобряет и удаляет фото владелец на backstage.html.
  Подключение — assets/js/visitors-config.js.
  Тексты на трёх языках — assets/js/i18n.js (ключи vis.*).
  ============================================================
*/

(function () {
  'use strict';

  const BUCKET = 'visitor-photos';
  const TABLE = 'visitor_photos';
  const MAX_SIDE = 1600;          // длинная сторона после сжатия, px
  const JPEG_QUALITY = 0.85;
  const MAX_BYTES = 3 * 1024 * 1024; // столько же разрешено в хранилище
  const SIGNED_URL_TTL = 60 * 60; // ссылки на фото живут час

  const $ = id => document.getElementById(id);
  const T = (key, vars) => (window.I18N ? I18N.t(key, vars) : key);

  const cfg = window.VISITOR_GALLERY || {};
  const client = cfg.url && cfg.key && window.supabase
    ? window.supabase.createClient(cfg.url, cfg.key, {
        // Посетитель всегда анонимный — даже если в этом браузере
        // владелец вошёл на backstage.html
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'gop-visitors' }
      })
    : null;

  let image = null;     // { blob, url, width, height }
  let wall = null;      // одобренные фото: null — ещё не загружены
  let wallError = false;
  let sending = false;
  let message = null;   // { key, kind } — чтобы перевести сообщение при смене языка


  /* ============================================================
     1. ФОРМА
     ============================================================ */

  function loadImageElement(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => resolve({ img, url });
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.src = url;
    });
  }

  // Сжимаем до MAX_SIDE и пересохраняем в JPEG: так из файла
  // пропадают EXIF-данные, в том числе координаты съёмки
  async function processFile(file) {
    if (!file) return;
    const info = $('v-file-info');
    hideMessage();
    info.textContent = T('vis.processing');

    let loaded;
    try {
      loaded = await loadImageElement(file);
    } catch (e) {
      info.textContent = '';
      showMessage('vis.err.decode', 'error');
      return;
    }

    const { img, url } = loaded;
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // прозрачный PNG → белый фон
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob || blob.size > MAX_BYTES) {
      info.textContent = '';
      showMessage('vis.err.decode', 'error');
      return;
    }

    if (image && image.url) URL.revokeObjectURL(image.url);
    image = { blob, url: URL.createObjectURL(blob), width: w, height: h, name: file.name };
    labelDrop();
  }

  // Подпись поля с фото — на текущем языке
  function labelDrop() {
    const drop = $('v-drop');
    if (!drop) return;
    drop.classList.toggle('has-file', !!image);
    $('v-drop-title').textContent = T(image ? 'vis.drop.done' : 'vis.drop');
    $('v-drop-hint').textContent = image ? T('vis.drop.replace', { file: image.name }) : T('vis.drop.hint');
    $('v-file-info').textContent = image
      ? T('vis.file.info', { w: image.width, h: image.height, kb: Math.round(image.blob.size / 1024) })
      : '';
  }

  function showMessage(key, kind) {
    message = { key, kind };
    renderMessage();
  }

  function renderMessage() {
    const el = $('v-message');
    if (!el) return;
    el.hidden = !message;
    if (!message) return;
    el.textContent = T(message.key);
    el.className = 'visitors-message' + (message.kind ? ' is-' + message.kind : '');
  }

  function hideMessage() {
    message = null;
    renderMessage();
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const hex = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function clean(value, max) {
    const s = String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
    return s || null;
  }

  function resetForm() {
    $('v-form').reset();
    if (image && image.url) URL.revokeObjectURL(image.url);
    image = null;
    labelDrop();
  }

  async function send(e) {
    e.preventDefault();
    if (sending || !client) return;
    hideMessage();

    // Бот заполнил невидимое поле — делаем вид, что всё прошло
    if ($('v-website').value) {
      resetForm();
      showMessage('vis.thanks', 'ok');
      return;
    }
    if (!image) { showMessage('vis.err.nophoto', 'error'); return; }
    if (!$('v-consent').checked) { showMessage('vis.err.consent', 'error'); return; }

    sending = true;
    const btn = $('v-send');
    btn.disabled = true;
    showMessage('vis.sending');

    const path = `incoming/${uuid()}.jpg`;
    try {
      const up = await client.storage.from(BUCKET).upload(path, image.blob, {
        contentType: 'image/jpeg', upsert: false, cacheControl: '31536000'
      });
      if (up.error) throw up.error;

      const ins = await client.from(TABLE).insert({
        path,
        name: clean($('v-name').value, 60),
        location: clean($('v-place').value, 80),
        caption: clean($('v-caption').value, 200)
      });
      if (ins.error) throw ins.error;

      resetForm();
      showMessage('vis.thanks', 'ok');
    } catch (err) {
      console.error('visitors: send failed', err);
      // Очередь переполнена — правило в базе отклоняет новые фото
      const full = /row-level security|violates/i.test(String(err && (err.message || err.error)));
      showMessage(full ? 'vis.err.full' : 'vis.err.send', 'error');
    } finally {
      sending = false;
      btn.disabled = false;
    }
  }


  /* ============================================================
     2. СТЕНА ОДОБРЕННЫХ ФОТО
     ============================================================ */

  async function loadWall() {
    try {
      const res = await client.from(TABLE)
        .select('id, created_at, path, name, location, caption')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(300);
      if (res.error) throw res.error;
      const rows = res.data || [];

      let urls = {};
      if (rows.length) {
        const signed = await client.storage.from(BUCKET).createSignedUrls(rows.map(r => r.path), SIGNED_URL_TTL);
        if (signed.error) throw signed.error;
        (signed.data || []).forEach(s => { if (s.signedUrl) urls[s.path] = s.signedUrl; });
      }

      // Номер находки: № 1 — самая первая присланная фотография
      wall = rows.filter(r => urls[r.path]).map((r, i, list) => ({
        image: urls[r.path],
        title: r.caption || '',
        name: r.name || '',
        location: r.location || '',
        date: String(r.created_at || '').slice(0, 10),
        alt: r.caption || '',
        _no: list.length - i
      }));
      wallError = false;
    } catch (err) {
      console.error('visitors: wall failed', err);
      wall = [];
      wallError = true;
    }
    renderWall();
  }

  function cardHTML(p, i) {
    const note = p.title || p.location || '…'; // без подписи на полароиде — место, и ниже оно не повторяется
    return `
      <article class="find" style="--tilt:${tiltOf(i)}deg" role="listitem">
        <button class="polaroid polaroid--${tapeOf(i)}" type="button" aria-label="${esc(T('vis.open'))}">
          <span class="polaroid__photo">
            <img src="${esc(p.image)}" alt="${esc(p.alt || T('vis.alt'))}" loading="${i < 6 ? 'eager' : 'lazy'}" decoding="async" />
          </span>
          <span class="polaroid__note">${esc(note)}</span>
        </button>
        <p class="find__tag">
          <span>${photoNo(p)}</span>
          <time datetime="${esc(p.date)}">${formatDate(p.date)}</time>
        </p>
        ${p.location && p.title ? `<p class="find__place">${esc(p.location)}</p>` : ''}
        ${p.name ? `<p class="find__by">${esc(T('vis.by', { name: p.name }))}</p>` : ''}
      </article>`;
  }

  function renderWall() {
    const grid = $('v-grid');
    const status = $('v-status');
    if (!grid) return;

    if (!client) {
      grid.innerHTML = '';
      status.textContent = '';
      return;
    }
    if (wall === null) {
      status.textContent = T('vis.loading');
      return;
    }
    if (wallError) {
      grid.innerHTML = `<p class="gallery-empty">${esc(T('vis.err.wall'))}</p>`;
      status.textContent = '';
      return;
    }
    status.textContent = wall.length ? T('finds', { n: wall.length }) : '';
    if (!wall.length) {
      grid.innerHTML = `<p class="gallery-empty">${esc(T('vis.empty'))}</p>`;
      return;
    }

    // В просмотрщике под фото — «фото: имя»
    const forLightbox = wall.map(p => Object.assign({}, p, { caption: p.name ? T('vis.by', { name: p.name }) : '' }));
    grid.innerHTML = wall.map(cardHTML).join('');
    bindLightboxTriggers(grid, '.polaroid', forLightbox);
  }


  /* ============================================================
     ЗАПУСК
     ============================================================ */

  function init() {
    if (!$('v-form')) return;

    if (!client) {
      // Supabase ещё не подключён — показываем «скоро»
      $('v-closed').hidden = false;
      $('v-form').hidden = true;
      renderWall();
      return;
    }

    const input = $('v-file');
    input.addEventListener('change', () => processFile(input.files[0]));

    const drop = $('v-drop');
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('is-over')));
    drop.addEventListener('drop', e => {
      e.preventDefault();
      const file = e.dataTransfer && e.dataTransfer.files[0];
      if (file) processFile(file);
    });

    $('v-form').addEventListener('submit', send);

    document.addEventListener('gop:langchange', () => {
      labelDrop();
      renderMessage();
      renderWall();
    });

    labelDrop();
    renderWall();
    loadWall();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
