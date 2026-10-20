/*
  ============================================================
  GARBAGE OF PARIS — studio.js
  ============================================================
  Страница studio.html: добавить, изменить или удалить фото
  прямо с сайта, без ручного редактирования файлов.

  Как это работает:
  1. Фото уменьшается прямо в браузере (до 1800 px по длинной
     стороне, JPEG). Заодно из файла пропадают EXIF-данные,
     в том числе GPS-координаты.
  2. Через GitHub API в репозиторий одним коммитом кладутся
     фото (assets/img/gallery/…) и обновлённый assets/js/data.js.
  3. GitHub Pages пересобирает сайт — через 1–2 минуты фото
     появляется в галерее, архиве и на главной.

  Ключ GitHub хранится только в localStorage этого браузера.
  ============================================================
*/

(function () {
  'use strict';

  const STORAGE_KEY = 'gop-studio';
  const DATA_PATH = 'assets/js/data.js';
  const GALLERY_DIR = 'assets/img/gallery/';
  const MAX_SIDE = 1800;
  const JPEG_QUALITY = 0.85;
  const DEFAULTS = { owner: 'lilmondler', repo: 'garbageofparis', branch: 'main', token: '' };

  const $ = id => document.getElementById(id);

  /* ---------- состояние ---------- */

  let cfg = loadConfig();
  let remote = null;          // { photos, categories } из GitHub
  let image = null;           // { blob, url, width, height, name }
  let editingKey = null;      // image-путь редактируемой записи
  let busy = false;

  /* ---------- localStorage ---------- */

  function loadConfig() {
    try {
      return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch (e) {
      log('Браузер не дал сохранить настройки (приватный режим?) — ключ придётся вставлять заново.', 'error');
    }
  }

  /* ---------- утилиты ---------- */

  function localData() {
    return {
      photos: (typeof photos !== 'undefined' && Array.isArray(photos)) ? photos : [],
      categories: (typeof CATEGORIES !== 'undefined' && Array.isArray(CATEGORIES)) ? CATEGORIES : []
    };
  }

  function currentData() { return remote || localData(); }

  function slugify(text) {
    return String(text || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }

  function todayISO() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function isISODate(s) {
    return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T00:00:00'));
  }

  function utf8ToBase64Decode(b64) {
    const bin = atob(b64.replace(/\s/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1]);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  }

  function log(message, kind) {
    const li = document.createElement('li');
    li.textContent = message;
    if (kind) li.className = 'is-' + kind;
    $('log').appendChild(li);
    return li;
  }

  function clearLog() { $('log').innerHTML = ''; }

  /* ============================================================
     GITHUB API
     ============================================================ */

  async function gh(path, options) {
    const opts = options || {};
    const res = await fetch('https://api.github.com' + path, {
      method: opts.method || 'GET',
      cache: 'no-store',
      headers: Object.assign({
        'Accept': 'application/vnd.github+json',
        'Authorization': 'Bearer ' + cfg.token,
        'X-GitHub-Api-Version': '2022-11-28'
      }, opts.body ? { 'Content-Type': 'application/json' } : {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (res.status === 404 && opts.allow404) return null;
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json()).message || ''; } catch (e) { /* пусто */ }
      const err = new Error(explainError(res.status, detail));
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  function explainError(status, detail) {
    if (status === 401) return 'GitHub не принял ключ: он неверный или истёк. Создай новый (шаг 1).';
    if (status === 403) return 'У ключа нет прав на запись. Проверь: Permissions → Contents → Read and write, и что выбран репозиторий garbageofparis.';
    if (status === 404) return 'Репозиторий или ветка не найдены. Проверь «настройки репозитория» и что ключ выдан на этот репозиторий.';
    if (status === 409 || status === 422) return 'Пока ты работала, в репозитории что-то поменялось. Попробуй ещё раз. (' + detail + ')';
    return `Ошибка GitHub ${status}${detail ? ': ' + detail : ''}`;
  }

  const repoPath = () => `/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}`;

  async function fetchDataFile(ref) {
    const file = await gh(`${repoPath()}/contents/${DATA_PATH}?ref=${encodeURIComponent(ref)}`);
    return GOPData.parseData(utf8ToBase64Decode(file.content));
  }

  async function fileExists(path, ref) {
    const r = await gh(`${repoPath()}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(ref)}`, { allow404: true });
    return !!r;
  }

  /*
    Один коммит: берём свежий data.js с ветки, применяем к нему
    изменение (mutate), кладём новые файлы, удаляем старые.
    Если кто-то успел закоммитить раньше — пробуем ещё раз.
  */
  async function commit({ message, mutate, addFiles, deletePaths }) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const ref = await gh(`${repoPath()}/git/ref/heads/${encodeURIComponent(cfg.branch)}`);
        const parentSha = ref.object.sha;
        const parent = await gh(`${repoPath()}/git/commits/${parentSha}`);

        const data = await fetchDataFile(parentSha);
        const extraDeletes = mutate(data) || [];
        const text = GOPData.serializeData(data.photos, data.categories);
        GOPData.parseData(text); // проверка: получившийся файл читается

        const tree = [];
        for (const f of (addFiles || [])) {
          log(`загружаю ${f.path}…`);
          const blob = await gh(`${repoPath()}/git/blobs`, { method: 'POST', body: { content: f.base64, encoding: 'base64' } });
          tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
        }
        const dataBlob = await gh(`${repoPath()}/git/blobs`, { method: 'POST', body: { content: text, encoding: 'utf-8' } });
        tree.push({ path: DATA_PATH, mode: '100644', type: 'blob', sha: dataBlob.sha });

        for (const p of [...(deletePaths || []), ...extraDeletes]) {
          if (await fileExists(p, parentSha)) tree.push({ path: p, mode: '100644', type: 'blob', sha: null });
        }

        const newTree = await gh(`${repoPath()}/git/trees`, { method: 'POST', body: { base_tree: parent.tree.sha, tree } });
        const newCommit = await gh(`${repoPath()}/git/commits`, { method: 'POST', body: { message, tree: newTree.sha, parents: [parentSha] } });
        await gh(`${repoPath()}/git/refs/heads/${encodeURIComponent(cfg.branch)}`, { method: 'PATCH', body: { sha: newCommit.sha } });

        remote = data;
        return newCommit;
      } catch (err) {
        if (attempt < 2 && (err.status === 409 || err.status === 422)) {
          log('ветка обновилась, пробую ещё раз…');
          continue;
        }
        throw err;
      }
    }
  }

  /* ============================================================
     ПОДКЛЮЧЕНИЕ
     ============================================================ */

  async function connect() {
    const status = $('connect-status');
    if (!cfg.token) {
      status.textContent = 'не подключено';
      status.classList.remove('is-ok');
      $('connect-form').hidden = false;
      $('connect-done').hidden = true;
      updatePublishState();
      return;
    }
    status.textContent = 'проверяю…';
    try {
      const repo = await gh(repoPath());
      if (repo.permissions && repo.permissions.push === false) {
        throw new Error('Ключ работает, но только на чтение. Нужно Contents → Read and write.');
      }
      status.textContent = 'подключено ✓';
      status.classList.add('is-ok');
      $('repo-label').textContent = `${cfg.owner}/${cfg.repo} · ${cfg.branch}`;
      $('connect-form').hidden = true;
      $('connect-done').hidden = false;
      await loadList();
    } catch (err) {
      status.textContent = 'ошибка';
      status.classList.remove('is-ok');
      $('connect-form').hidden = false;
      $('connect-done').hidden = true;
      clearLog();
      log(err.message, 'error');
    }
    updatePublishState();
  }

  function connected() {
    return !!cfg.token && $('connect-status').classList.contains('is-ok');
  }

  /* ============================================================
     ФОТО: EXIF-ДАТА, УМЕНЬШЕНИЕ
     ============================================================ */

  // Достаёт дату съёмки из EXIF (только JPEG). Возвращает "YYYY-MM-DD" или null.
  function readExifDate(buf) {
    try {
      const v = new DataView(buf);
      if (v.getUint16(0) !== 0xFFD8) return null;
      let off = 2;
      while (off + 4 < v.byteLength) {
        const marker = v.getUint16(off);
        if ((marker & 0xFF00) !== 0xFF00) return null;
        const size = v.getUint16(off + 2);
        if (marker === 0xFFE1 && v.getUint32(off + 4) === 0x45786966) return parseTiffDate(v, off + 10);
        if (marker === 0xFFDA) return null;
        off += 2 + size;
      }
    } catch (e) { /* битый EXIF — не страшно */ }
    return null;
  }

  function parseTiffDate(v, start) {
    const little = v.getUint16(start) === 0x4949;
    const u16 = o => v.getUint16(start + o, little);
    const u32 = o => v.getUint32(start + o, little);
    const ifd = o => {
      const n = u16(o);
      const entries = {};
      for (let i = 0; i < n; i++) {
        const e = o + 2 + i * 12;
        entries[u16(e)] = { type: u16(e + 2), count: u32(e + 4), at: e + 8 };
      }
      return entries;
    };
    const ascii = ent => {
      if (!ent || ent.type !== 2) return null;
      const o = ent.count > 4 ? u32(ent.at) : ent.at;
      let s = '';
      for (let i = 0; i < ent.count; i++) {
        const c = v.getUint8(start + o + i);
        if (!c) break;
        s += String.fromCharCode(c);
      }
      return s;
    };
    const ifd0 = ifd(u32(4));
    let date = null;
    if (ifd0[0x8769]) {
      const exif = ifd(u32(ifd0[0x8769].at));
      date = ascii(exif[0x9003]) || ascii(exif[0x9004]);
    }
    date = date || ascii(ifd0[0x0132]);
    const m = date && date.match(/^(\d{4}):(\d{2}):(\d{2})/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
  }

  // Дата из имени файла: photo_2025-12-30_19-50-29.jpg, IMG_20250511_…, 2025-05-11 …
  function dateFromName(name) {
    const m = String(name).match(/(20\d{2})[-_.]?(0[1-9]|1[0-2])[-_.]?(0[1-9]|[12]\d|3[01])/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
  }

  function loadImageElement(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => resolve({ img, url });
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.src = url;
    });
  }

  async function processFile(file) {
    if (!file) return;
    const info = $('file-info');
    info.textContent = 'обрабатываю фото…';

    let exifDate = null;
    try { exifDate = readExifDate(await file.slice(0, 256 * 1024).arrayBuffer()); } catch (e) { /* ок */ }

    let loaded;
    try {
      loaded = await loadImageElement(file);
    } catch (e) {
      info.textContent = '';
      clearLog();
      log('Браузер не смог открыть этот файл. Если это HEIC с iPhone — выбери фото через «Медиатеку» на самом телефоне (оно станет JPEG) или сохрани его как JPEG.', 'error');
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
    if (!blob) {
      log('Не получилось сжать фото. Попробуй другой файл.', 'error');
      return;
    }

    if (image && image.url) URL.revokeObjectURL(image.url);
    image = { blob, url: URL.createObjectURL(blob), width: w, height: h, name: file.name };

    const kb = Math.round(blob.size / 1024);
    info.textContent = `${w}×${h} px · ${kb} КБ · геоданные удалены`;
    $('drop').classList.add('has-file');
    $('drop-text').querySelector('b').textContent = 'фото выбрано ✓';
    $('drop-text').querySelector('span').textContent = file.name + ' · нажми, чтобы заменить';

    const guess = exifDate || dateFromName(file.name);
    if (guess && (!$('f-date').value || !$('f-date').dataset.touched)) $('f-date').value = guess;

    renderPreview();
    updatePublishState();
  }

  /* ============================================================
     ФОРМА
     ============================================================ */

  function fillChoices() {
    const data = currentData();
    const used = new Set(data.photos.map(p => p.category).filter(Boolean));
    const cats = [...new Set([...data.categories, ...used])];
    const select = $('f-category');
    const prev = select.value;
    select.innerHTML = '<option value="" disabled>— выбери —</option>' +
      cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('') +
      '<option value="__new">+ новая категория…</option>';
    select.value = prev && [...select.options].some(o => o.value === prev) ? prev : '';

    const places = [...new Set(data.photos.map(p => p.location).filter(Boolean))].sort();
    $('locations').innerHTML = places.map(p => `<option value="${esc(p)}"></option>`).join('');
  }

  function formValues() {
    const cat = $('f-category').value === '__new'
      ? $('f-new-category').value.trim().toLowerCase()
      : $('f-category').value;
    return {
      title: $('f-title').value.trim(),
      date: $('f-date').value,
      location: $('f-location').value.trim() || 'Paris',
      category: cat,
      caption: $('f-caption').value.trim(),
      alt: $('f-alt').value.trim()
    };
  }

  function validate() {
    const v = formValues();
    const problems = [];
    const mark = (id, bad) => $(id).classList.toggle('is-invalid', bad);
    mark('f-title', !v.title);
    mark('f-date', !isISODate(v.date));
    mark('f-category', !$('f-category').value);
    mark('f-new-category', $('f-category').value === '__new' && !v.category);
    if (!editingKey && !image) problems.push('выбери фото');
    if (!v.title) problems.push('название');
    if (!isISODate(v.date)) problems.push('дату');
    if (!v.category) problems.push('категорию');
    return problems;
  }

  function updatePublishState() {
    const btn = $('publish-btn');
    const hint = $('publish-hint');
    btn.textContent = editingKey ? 'сохранить изменения' : 'опубликовать на сайте';
    $('form-title').textContent = editingKey ? '2. редактирование' : '2. новая находка';
    $('cancel-edit').hidden = !editingKey;
    if (busy) {
      btn.disabled = true;
      hint.textContent = 'публикую…';
    } else if (!connected()) {
      btn.disabled = true;
      hint.textContent = 'сначала подключи GitHub (шаг 1) — или скачай фото и запись ниже';
    } else {
      btn.disabled = false;
      hint.textContent = editingKey ? '' : 'фото появится на сайте через 1–2 минуты';
    }
  }

  function renderPreview() {
    const v = formValues();
    const data = currentData();
    const p = {
      title: v.title || 'title',
      date: v.date || todayISO(),
      location: v.location,
      category: v.category || 'category',
      caption: v.caption || 'Your caption will be here.',
      alt: v.alt,
      image: image ? image.url : (editingKey || '')
    };
    p._no = editingKey ? (data.photos.findIndex(x => x.image === editingKey) + 1) : data.photos.length + 1;
    $('preview').innerHTML = typeof polaroidHTML === 'function' ? polaroidHTML(p, 1, { eager: true }) : '';
    const img = $('preview').querySelector('img');
    if (img && !p.image) img.remove();
  }

  function resetForm() {
    $('photo-form').reset();
    delete $('f-date').dataset.touched;
    $('f-date').value = todayISO();
    $('new-cat-wrap').hidden = true;
    if (image && image.url) URL.revokeObjectURL(image.url);
    image = null;
    editingKey = null;
    $('file-info').textContent = '';
    $('drop').classList.remove('has-file');
    $('drop-text').querySelector('b').textContent = 'выбрать фото';
    $('drop-text').querySelector('span').textContent = 'или перетащи его сюда · JPG, PNG, WebP · с телефона можно прямо из галереи';
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    fillChoices();
    renderPreview();
    updatePublishState();
  }

  function startEdit(key) {
    const p = currentData().photos.find(x => x.image === key);
    if (!p) return;
    resetForm();
    editingKey = key;
    $('f-title').value = p.title || '';
    $('f-date').value = p.date || '';
    $('f-date').dataset.touched = '1';
    $('f-location').value = p.location || '';
    $('f-category').value = p.category || '';
    $('f-caption').value = p.caption || '';
    $('f-alt').value = p.alt || '';
    $('drop-text').querySelector('b').textContent = 'фото остаётся прежним';
    $('drop-text').querySelector('span').textContent = 'чтобы заменить фото — удали запись и добавь заново';
    renderPreview();
    updatePublishState();
    clearLog();
    $('form-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ============================================================
     ПУБЛИКАЦИЯ
     ============================================================ */

  function uniqueImagePath(date, title, photosList) {
    const taken = new Set(photosList.map(p => p.image));
    const base = `${GALLERY_DIR}${date}_${slugify(title) || 'find'}`;
    let path = base + '.jpg';
    for (let i = 2; taken.has(path); i++) path = `${base}-${i}.jpg`;
    return path;
  }

  async function publish(e) {
    e.preventDefault();
    if (busy) return;
    const problems = validate();
    if (problems.length) {
      clearLog();
      log('Не хватает: ' + problems.join(', ') + '.', 'error');
      return;
    }
    if (!connected()) return;

    const v = formValues();
    busy = true;
    updatePublishState();
    clearLog();

    try {
      let result;
      if (editingKey) {
        const key = editingKey;
        log('сохраняю изменения…');
        result = await commit({
          message: `Edit photo: ${v.title}`,
          mutate: data => {
            const p = data.photos.find(x => x.image === key);
            if (!p) throw new Error('Эта запись уже удалена из data.js. Обнови список.');
            Object.assign(p, v);
            if (v.category && !data.categories.includes(v.category)) data.categories.push(v.category);
          }
        });
      } else {
        log('готовлю фото…');
        const base64 = await blobToBase64(image.blob);
        let path = null;
        result = await commit({
          message: `Add photo: ${v.title}`,
          addFiles: [{ get path() { return path; }, base64 }],
          mutate: data => {
            path = uniqueImagePath(v.date, v.title, data.photos);
            data.photos.push(Object.assign({ image: path }, v, { image: path }));
            if (v.category && !data.categories.includes(v.category)) data.categories.push(v.category);
          }
        });
      }

      const url = `https://github.com/${cfg.owner}/${cfg.repo}/commit/${result.sha}`;
      const done = log('готово! сайт обновится через 1–2 минуты (иногда до 10 — кэш браузера). ', 'ok');
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'коммит на GitHub ↗';
      done.appendChild(a);

      busy = false;
      resetForm();
      renderList();
    } catch (err) {
      log(err.message || String(err), 'error');
    } finally {
      busy = false;
      updatePublishState();
    }
  }

  async function removePhoto(key) {
    const p = currentData().photos.find(x => x.image === key);
    if (!p || busy) return;
    if (!confirm(`Удалить «${p.title}» с сайта? Фото тоже будет удалено из репозитория.`)) return;

    busy = true;
    updatePublishState();
    renderList();
    clearLog();
    log(`удаляю «${p.title}»…`);
    try {
      const result = await commit({
        message: `Remove photo: ${p.title}`,
        mutate: data => {
          const idx = data.photos.findIndex(x => x.image === key);
          if (idx === -1) throw new Error('Эта запись уже удалена. Обнови список.');
          data.photos.splice(idx, 1);
          // файл удаляем, только если он лежит в галерее и больше нигде не используется
          const stillUsed = data.photos.some(x => x.image === key);
          return key.startsWith(GALLERY_DIR) && !stillUsed ? [key] : [];
        }
      });
      log(`удалено. коммит ${result.sha.slice(0, 7)}`, 'ok');
      if (editingKey === key) resetForm();
    } catch (err) {
      log(err.message || String(err), 'error');
    } finally {
      busy = false;
      updatePublishState();
      renderList();
    }
  }

  /* ============================================================
     СПИСОК ФОТО
     ============================================================ */

  async function loadList() {
    $('list-hint').textContent = 'загружаю…';
    try {
      remote = await fetchDataFile(cfg.branch);
      fillChoices();
      renderList();
      renderPreview();
    } catch (err) {
      $('list-hint').textContent = err.message;
    }
  }

  function renderList() {
    const list = $('photo-list');
    if (!remote) {
      list.innerHTML = '';
      return;
    }
    const sorted = remote.photos.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    $('list-hint').textContent = `${sorted.length} фото в data.js на ветке ${cfg.branch}. Только что добавленные картинки могут появиться с задержкой.`;
    list.innerHTML = sorted.map(p => `
      <li class="studio-item">
        <img src="${esc(p.image)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'studio-item__ph'}))" />
        <div>
          <p class="studio-item__title">${esc(p.title)}</p>
          <p class="studio-item__meta">${esc(formatDate(p.date))} · ${esc(p.location)} · ${esc(p.category)}</p>
        </div>
        <div class="studio-item__actions">
          <button type="button" data-action="edit" data-key="${esc(p.image)}" ${busy ? 'disabled' : ''}>изменить</button>
          <button type="button" data-action="delete" data-key="${esc(p.image)}" ${busy ? 'disabled' : ''}>удалить</button>
        </div>
      </li>`).join('');
  }

  /* ============================================================
     РУЧНОЙ РЕЖИМ (без ключа)
     ============================================================ */

  function manualEntry() {
    const v = formValues();
    const path = uniqueImagePath(v.date || todayISO(), v.title, currentData().photos);
    const entry = Object.assign({ title: v.title, image: path }, v);
    const lines = GOPData.FIELDS.map(k => `    ${k}: ${JSON.stringify(entry[k] || '')}`);
    return { path, text: '  {\n' + lines.join(',\n') + '\n  },' };
  }

  function downloadPhoto() {
    if (!image) {
      clearLog();
      log('Сначала выбери фото.', 'error');
      return;
    }
    const { path } = manualEntry();
    const a = document.createElement('a');
    a.href = image.url;
    a.download = path.split('/').pop();
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function copyEntry() {
    const { text } = manualEntry();
    clearLog();
    try {
      await navigator.clipboard.writeText(text);
      log('Запись скопирована — вставь её в массив photos в data.js.', 'ok');
    } catch (e) {
      log('Не удалось скопировать автоматически. Вот запись:', 'error');
      log(text);
    }
  }

  /* ============================================================
     ЗАПУСК
     ============================================================ */

  function init() {
    if (!$('photo-form')) return;

    $('cfg-owner').value = cfg.owner;
    $('cfg-repo').value = cfg.repo;
    $('cfg-branch').value = cfg.branch;
    ['owner', 'repo', 'branch'].forEach(k => {
      $('cfg-' + k).addEventListener('change', e => {
        cfg[k] = e.target.value.trim() || DEFAULTS[k];
        e.target.value = cfg[k];
        saveConfig();
        remote = null;
        connect();
      });
    });

    $('token-form').addEventListener('submit', e => {
      e.preventDefault();
      cfg.token = $('token-input').value.trim();
      $('token-input').value = '';
      saveConfig();
      clearLog();
      connect();
    });

    $('forget-token').addEventListener('click', () => {
      cfg.token = '';
      saveConfig();
      remote = null;
      renderList();
      $('list-hint').textContent = 'подключи GitHub, чтобы видеть и редактировать фото';
      connect();
    });

    // Фото: выбор и перетаскивание
    $('f-file').addEventListener('change', e => processFile(e.target.files[0]));
    const drop = $('drop');
    ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, () => drop.classList.remove('is-over')));
    drop.addEventListener('drop', e => {
      e.preventDefault();
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) processFile(f);
    });

    // Поля
    $('f-date').addEventListener('input', () => { $('f-date').dataset.touched = '1'; });
    $('f-category').addEventListener('change', () => {
      $('new-cat-wrap').hidden = $('f-category').value !== '__new';
      if (!$('new-cat-wrap').hidden) $('f-new-category').focus();
    });
    $('photo-form').addEventListener('input', () => {
      renderPreview();
      document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    });
    $('photo-form').addEventListener('change', renderPreview);
    $('photo-form').addEventListener('submit', publish);
    $('cancel-edit').addEventListener('click', () => { resetForm(); clearLog(); });

    $('download-photo').addEventListener('click', downloadPhoto);
    $('copy-entry').addEventListener('click', copyEntry);

    $('reload-list').addEventListener('click', () => { if (connected()) loadList(); });
    $('photo-list').addEventListener('click', e => {
      const b = e.target.closest('button[data-action]');
      if (!b || b.disabled) return;
      if (b.dataset.action === 'edit') startEdit(b.dataset.key);
      if (b.dataset.action === 'delete') removePhoto(b.dataset.key);
    });

    // Не потерять фото случайным закрытием вкладки
    window.addEventListener('beforeunload', e => {
      if (busy || (image && !editingKey)) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    resetForm();
    connect();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
