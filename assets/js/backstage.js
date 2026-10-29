/*
  ============================================================
  GARBAGE OF PARIS — backstage.js
  ============================================================
  Модерация галереи зрителей (backstage.html):
  - вход владельца (email и пароль из Supabase → Authentication → Users);
  - очередь новых фото: «показать на сайте» или «удалить»;
  - фото на стене: «убрать со стены» или «удалить»;
  - уборка файлов, у которых нет подписи (отправка оборвалась).

  Права проверяет сама база (supabase/visitor-gallery.sql):
  без входа владельца эта страница ничего не может изменить.
  ============================================================
*/

(function () {
  'use strict';

  const BUCKET = 'visitor-photos';
  const TABLE = 'visitor_photos';
  const SIGNED_URL_TTL = 60 * 60;
  const ORPHAN_AGE_MS = 60 * 60 * 1000; // файлы моложе часа не трогаем: их могут отправлять прямо сейчас

  const $ = id => document.getElementById(id);
  const cfg = window.VISITOR_GALLERY || {};
  const client = cfg.url && cfg.key && window.supabase
    ? window.supabase.createClient(cfg.url, cfg.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'gop-backstage' }
      })
    : null;

  let rows = [];
  let urls = {};
  let orphans = [];
  let busy = false;

  function log(message, kind) {
    const li = document.createElement('li');
    li.textContent = message;
    if (kind) li.className = 'is-' + kind;
    $('b-log').appendChild(li);
  }

  function clearLog() { $('b-log').innerHTML = ''; }

  function setCards(visible) {
    ['b-queue-card', 'b-wall-card', 'b-clean-card'].forEach(id => { $(id).hidden = !visible; });
  }


  /* ---------- вход ---------- */

  async function showSession(session) {
    const on = !!session;
    $('b-login').hidden = on;
    $('b-done').hidden = !on;
    $('b-status').textContent = on ? 'выполнен' : 'не выполнен';
    $('b-status').classList.toggle('is-ok', on);
    setCards(false);
    if (!on) return;

    $('b-who').textContent = session.user.email || '';
    const owner = await client.rpc('is_visitor_gallery_owner');
    if (owner.error) {
      log('Не получилось проверить права: ' + owner.error.message + '. Выполнен ли supabase/visitor-gallery.sql?', 'error');
      return;
    }
    if (!owner.data) {
      log('Этот аккаунт не владелец галереи. Владелец — самый первый пользователь в Supabase → Authentication → Users.', 'error');
      return;
    }
    setCards(true);
    await load();
  }

  async function login(e) {
    e.preventDefault();
    clearLog();
    const { data, error } = await client.auth.signInWithPassword({
      email: $('b-email').value.trim(),
      password: $('b-password').value
    });
    if (error) {
      log(/invalid/i.test(error.message) ? 'Неверный email или пароль.' : 'Не получилось войти: ' + error.message, 'error');
      return;
    }
    $('b-password').value = '';
    await showSession(data.session);
  }

  async function logout() {
    await client.auth.signOut();
    clearLog();
    rows = [];
    showSession(null);
  }


  /* ---------- списки ---------- */

  async function load() {
    const res = await client.from(TABLE)
      .select('id, created_at, path, name, location, caption, status')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (res.error) {
      log('Не получилось загрузить список: ' + res.error.message, 'error');
      return;
    }
    rows = res.data || [];

    urls = {};
    if (rows.length) {
      const signed = await client.storage.from(BUCKET).createSignedUrls(rows.map(r => r.path), SIGNED_URL_TTL);
      if (signed.error) log('Не получилось получить ссылки на фото: ' + signed.error.message, 'error');
      (signed.data || []).forEach(s => { if (s.signedUrl) urls[s.path] = s.signedUrl; });
    }
    render();
    findOrphans();
  }

  function itemHTML(r) {
    const date = new Date(r.created_at).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const meta = [date, r.location, r.name && 'фото: ' + r.name].filter(Boolean).join(' · ');
    const url = urls[r.path];
    const pending = r.status === 'pending';
    return `
      <div class="studio-item backstage-item" data-id="${esc(r.id)}">
        ${url
          ? `<a href="${esc(url)}" target="_blank" rel="noopener" title="открыть фото целиком"><img src="${esc(url)}" alt="" loading="lazy" /></a>`
          : '<span class="studio-item__ph"></span>'}
        <div>
          <p class="studio-item__title">${esc(r.caption || 'без подписи')}</p>
          <p class="studio-item__meta">${esc(meta)}</p>
        </div>
        <div class="studio-item__actions">
          ${pending
            ? '<button type="button" data-action="approve">показать на сайте</button>'
            : '<button type="button" data-action="hide">убрать со стены</button>'}
          <button type="button" data-action="delete">удалить</button>
        </div>
      </div>`;
  }

  function render() {
    const queue = rows.filter(r => r.status === 'pending');
    const wall = rows.filter(r => r.status === 'approved');
    $('b-queue-count').textContent = queue.length ? String(queue.length) : '';
    $('b-queue').innerHTML = queue.length
      ? queue.map(itemHTML).join('')
      : '<p class="backstage-empty">новых фото нет</p>';
    $('b-wall').innerHTML = wall.length
      ? wall.map(itemHTML).join('')
      : '<p class="backstage-empty">на стене пока пусто</p>';
  }


  /* ---------- действия ---------- */

  async function act(id, action) {
    const row = rows.find(r => r.id === id);
    if (!row || busy) return;

    if (action === 'delete' && !window.confirm('Удалить это фото насовсем?')) return;

    busy = true;
    clearLog();
    document.querySelectorAll(`[data-id="${id}"] button`).forEach(b => { b.disabled = true; });
    try {
      if (action === 'approve' || action === 'hide') {
        const status = action === 'approve' ? 'approved' : 'pending';
        const res = await client.from(TABLE).update({ status }).eq('id', id).select('id');
        if (res.error) throw res.error;
        if (!res.data || !res.data.length) throw new Error('база не разрешила изменение');
        row.status = status;
        log(action === 'approve' ? 'Фото теперь на стене.' : 'Фото убрано со стены (вернулось в очередь).', 'ok');
      }

      if (action === 'delete') {
        // Сначала подпись, потом файл: если файл не удалится, его подберёт «уборка»
        const res = await client.from(TABLE).delete().eq('id', id).select('id');
        if (res.error) throw res.error;
        if (!res.data || !res.data.length) throw new Error('база не разрешила удаление');
        rows = rows.filter(r => r.id !== id);
        const rm = await client.storage.from(BUCKET).remove([row.path]);
        if (rm.error) log('Подпись удалена, а файл — нет: ' + rm.error.message + '. Его можно убрать в «уборке».', 'error');
        else log('Фото удалено.', 'ok');
      }
    } catch (err) {
      log('Не получилось: ' + (err.message || err), 'error');
    } finally {
      busy = false;
      render();
    }
  }


  /* ---------- уборка ---------- */

  async function findOrphans() {
    const res = await client.storage.from(BUCKET).list('incoming', { limit: 1000 });
    if (res.error) {
      $('b-orphans-text').textContent = 'Не получилось проверить файлы: ' + res.error.message;
      return;
    }
    const known = new Set(rows.map(r => r.path));
    const now = Date.now();
    orphans = (res.data || [])
      .filter(f => f.name && f.id)   // папки без id не считаем
      .filter(f => !known.has('incoming/' + f.name))
      .filter(f => !f.created_at || now - new Date(f.created_at).getTime() > ORPHAN_AGE_MS)
      .map(f => 'incoming/' + f.name);
    $('b-orphans-text').textContent = orphans.length
      ? `Файлов без подписи: ${orphans.length} (отправка оборвалась на полпути). Их никто не видит, но они занимают место.`
      : 'Лишних файлов нет.';
    $('b-orphans').hidden = !orphans.length;
  }

  async function removeOrphans() {
    if (!orphans.length || busy) return;
    busy = true;
    clearLog();
    const rm = await client.storage.from(BUCKET).remove(orphans);
    busy = false;
    if (rm.error) log('Не получилось удалить файлы: ' + rm.error.message, 'error');
    else log(`Удалено файлов: ${orphans.length}.`, 'ok');
    findOrphans();
  }


  /* ---------- запуск ---------- */

  async function init() {
    if (!$('b-login')) return;
    if (!client) {
      $('b-unconfigured').hidden = false;
      return;
    }

    $('b-login').addEventListener('submit', login);
    $('b-logout').addEventListener('click', logout);
    $('b-refresh').addEventListener('click', () => { clearLog(); load(); });
    $('b-orphans').addEventListener('click', removeOrphans);
    ['b-queue', 'b-wall'].forEach(id => $(id).addEventListener('click', e => {
      const b = e.target.closest('button[data-action]');
      const item = b && b.closest('[data-id]');
      if (item) act(item.dataset.id, b.dataset.action);
    }));

    client.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') showSession(null);
    });

    const { data } = await client.auth.getSession();
    await showSession(data.session);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
