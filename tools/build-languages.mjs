/*
  ============================================================
  GARBAGE OF PARIS — tools/build-languages.mjs
  ============================================================
  Собирает французскую и русскую копии основных страниц:
    gallery.html → fr/gallery.html, ru/gallery.html (и так далее)
  Текст берётся из английской страницы, переводы — из
  assets/js/i18n.js (ключи data-i18n). Так поисковики видят каждую
  версию по своему адресу, уже переведённой.

  Ещё обновляет:
  - в английских страницах — блок <!-- languages --> в <head>
    (адреса версий для поисковиков);
  - sitemap.xml.

  ЗАПУСК (из папки сайта):
    node tools/build-languages.mjs          — собрать
    node tools/build-languages.mjs --check  — проверить, что всё собрано

  На GitHub это делает сам .github/workflows/build-languages.yml
  после каждой правки страниц или переводов.
  Копии fr/ и ru/ вручную не правят — правь английскую страницу
  и переводы в i18n.js.
  ============================================================
*/

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://garbageofparis.fr/';
const PAGES = ['index', 'gallery', 'archive', 'visitors', 'curious', 'manifesto', 'about'];
const LANGS = ['en', 'fr', 'ru'];
const COPIES = ['fr', 'ru'];
const OG_LOCALE = { en: 'en_GB', fr: 'fr_FR', ru: 'ru_RU' };
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

const CHECK = process.argv.includes('--check');
const warnings = [];
const changed = [];


/* ---------- переводы из i18n.js ---------- */

function loadStrings() {
  const code = fs.readFileSync(path.join(ROOT, 'assets/js/i18n.js'), 'utf8');
  const noop = () => {};
  const document = {
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: noop,
    dispatchEvent: noop,
    documentElement: { lang: 'en' },
    readyState: 'complete'
  };
  const sandbox = {
    window: {}, document,
    location: { search: '', hash: '', href: 'https://garbageofparis.fr/' },
    localStorage: { getItem: () => null, setItem: noop },
    history: { replaceState: noop },
    URL, URLSearchParams, Intl, console,
    CustomEvent: class {}
  };
  vm.runInNewContext(code, sandbox, { filename: 'i18n.js' });
  const strings = sandbox.window.I18N && sandbox.window.I18N.strings;
  if (!strings) throw new Error('i18n.js не отдал переводы (window.I18N.strings)');
  return strings;
}


/* ---------- маленький разбор HTML ---------- */

const escAttr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const stripTags = s => String(s).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// Позиция закрывающего тега для элемента, чей открывающий тег кончается в `from`
function findClose(html, from, tag) {
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/g;
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    if (!m[2] || m[2].toLowerCase() !== tag) continue;
    if (m[1]) { if (--depth === 0) return m.index; }
    else if (!m[3]) depth++;
  }
  throw new Error(`нет закрывающего </${tag}>`);
}

function setAttr(tagText, name, value) {
  const re = new RegExp(`\\s${name}="[^"]*"`);
  const attr = ` ${name}="${escAttr(value)}"`;
  if (re.test(tagText)) return tagText.replace(re, attr);
  return tagText.replace(/\s*\/?>$/, m => attr + m);
}

function removeAttr(tagText, name) {
  return tagText.replace(new RegExp(`\\s${name}(="[^"]*")?(?=[\\s/>])`), '');
}

// Пройти по всем открывающим тегам с атрибутом и дать функции их переписать
function mapTags(html, attr, fn) {
  return html.replace(new RegExp(`<([a-zA-Z][\\w-]*)\\b[^>]*\\s${attr}(="[^"]*")?[^>]*>`, 'g'), (tagText, tag) => fn(tagText, tag.toLowerCase()));
}

const attrOf = (tagText, name) => {
  const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tagText);
  return m ? m[1] : null;
};


/* ---------- адреса ---------- */

const pageFile = page => `${page}.html`;
const absUrl = (page, lang) => SITE + (lang === 'en' ? '' : lang + '/') + (page === 'index' ? '' : pageFile(page));
// Ссылка с версии `from` на версию `to` той же страницы
function relLink(page, from, to) {
  if (from === 'en') return to === 'en' ? pageFile(page) : `${to}/${pageFile(page)}`;
  if (to === from) return pageFile(page);
  return to === 'en' ? `../${pageFile(page)}` : `../${to}/${pageFile(page)}`;
}

function languagesBlock(page, lang) {
  const lines = [
    '  <!-- languages: адреса страницы на трёх языках (обновляет tools/build-languages.mjs) -->',
    `  <link rel="canonical" href="${absUrl(page, lang)}" />`,
    ...LANGS.map(l => `  <link rel="alternate" hreflang="${l}" href="${absUrl(page, l)}" />`),
    `  <link rel="alternate" hreflang="x-default" href="${absUrl(page, 'en')}" />`,
    `  <meta property="og:url" content="${absUrl(page, lang)}" />`,
    `  <meta property="og:locale" content="${OG_LOCALE[lang]}" />`,
    ...LANGS.filter(l => l !== lang).map(l => `  <meta property="og:locale:alternate" content="${OG_LOCALE[l]}" />`),
    '  <script src="assets/js/lang-redirect.js"></script>',
    '  <!-- /languages -->'
  ];
  return lines.join('\n');
}

function withLanguagesBlock(html, page, lang) {
  const block = languagesBlock(page, lang);
  const re = /  <!-- languages:[\s\S]*?<!-- \/languages -->/;
  if (re.test(html)) return html.replace(re, block);
  const anchor = /(  <meta name="theme-color"[^>]*>\n)/;
  if (!anchor.test(html)) throw new Error(`${page}.html: нет <meta name="theme-color"> — некуда вставить блок языков`);
  return html.replace(anchor, `$1\n${block}\n`);
}

// Ссылки «en · fr · ru» и подсветка текущего языка
function withLangLinks(html, page, lang) {
  return mapTags(html, 'data-set-lang', (tagText, tag) => {
    const to = attrOf(tagText, 'data-set-lang');
    if (tag !== 'a') return tagText;
    let t = setAttr(tagText, 'href', relLink(page, lang, to));
    const cls = (attrOf(t, 'class') || '').split(/\s+/).filter(c => c && c !== 'active');
    if (to === lang) cls.push('active');
    t = cls.length ? setAttr(t, 'class', cls.join(' ')) : removeAttr(t, 'class');
    t = to === lang ? setAttr(t, 'aria-current', 'true') : removeAttr(t, 'aria-current');
    return t;
  });
}


/* ---------- перевод одной страницы ---------- */

function translate(html, page, lang, dict) {
  // 1. Содержимое элементов с data-i18n (с конца, чтобы позиции не сдвигались)
  const starts = [];
  const re = /<([a-zA-Z][\w-]*)\b[^>]*\sdata-i18n="([^"]+)"[^>]*>/g;
  let m;
  while ((m = re.exec(html))) starts.push({ index: m.index, end: re.lastIndex, tag: m[1].toLowerCase(), key: m[2] });
  for (const s of starts.reverse()) {
    if (VOID.has(s.tag)) continue;
    const value = dict[s.key];
    if (typeof value !== 'string') { warnings.push(`${lang}/${page}.html: нет перевода «${s.key}» — остаётся английский`); continue; }
    const close = findClose(html, s.end, s.tag);
    html = html.slice(0, s.end) + value + html.slice(close);
  }

  // 2. aria-label и description
  html = mapTags(html, 'data-i18n-aria', tagText => {
    const v = dict[attrOf(tagText, 'data-i18n-aria')];
    return typeof v === 'string' ? setAttr(tagText, 'aria-label', v) : tagText;
  });
  html = mapTags(html, 'data-i18n-content', tagText => {
    const v = dict[attrOf(tagText, 'data-i18n-content')];
    return typeof v === 'string' ? setAttr(tagText, 'content', v) : tagText;
  });

  // 3. Превью для соцсетей
  const title = dict[`${page}.title`], desc = dict[`${page}.desc`];
  if (title) html = html.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escAttr(stripTags(title))}" />`);
  if (desc) html = html.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escAttr(stripTags(desc))}" />`);

  // 4. Тексты, написанные целиком на одном языке (манифест)
  html = mapTags(html, 'data-lang-block', tagText => {
    const on = attrOf(tagText, 'data-lang-block') === lang;
    const cls = (attrOf(tagText, 'class') || '').split(/\s+/).filter(c => c && c !== 'active');
    if (on) cls.push('active');
    let t = setAttr(tagText, 'class', cls.join(' '));
    t = removeAttr(t, 'hidden');
    return on ? t : t.replace(/>$/, ' hidden>');
  });

  // 5. Язык страницы и пути к файлам сайта (копии лежат на уровень глубже)
  html = html.replace(/<html lang="[^"]*"[^>]*>/, `<html lang="${lang}" data-root="../">`);
  html = html.replace(/(\s(?:src|href))="assets\//g, '$1="../assets/');

  // 6. Пометка, что файл собран автоматически
  html = html.replace(/^<!DOCTYPE html>\n/i, m => m +
    `<!-- СОБРАНО АВТОМАТИЧЕСКИ: tools/build-languages.mjs из ../${pageFile(page)} и assets/js/i18n.js.\n     Не правь этот файл вручную — правки пропадут при следующей сборке. -->\n`);
  return html;
}


/* ---------- sitemap.xml ---------- */

function sitemap() {
  const urls = [];
  for (const page of PAGES) {
    for (const lang of LANGS) {
      urls.push([
        '  <url>',
        `    <loc>${absUrl(page, lang)}</loc>`,
        ...LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${absUrl(page, l)}" />`),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${absUrl(page, 'en')}" />`,
        '  </url>'
      ].join('\n'));
    }
  }
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!-- Собрано автоматически: tools/build-languages.mjs -->',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    ''
  ].join('\n');
}


/* ---------- запись ---------- */

function write(rel, content) {
  const file = path.join(ROOT, rel);
  const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (old === content) return;
  changed.push(rel);
  if (CHECK) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

const STRINGS = loadStrings();
for (const page of PAGES) {
  const srcRel = pageFile(page);
  let src = fs.readFileSync(path.join(ROOT, srcRel), 'utf8');
  src = withLangLinks(withLanguagesBlock(src, page, 'en'), page, 'en');
  write(srcRel, src);
  for (const lang of COPIES) {
    let out = withLanguagesBlock(src, page, lang);
    out = translate(out, page, lang, STRINGS[lang] || {});
    out = withLangLinks(out, page, lang);
    write(`${lang}/${srcRel}`, out);
  }
}
write('sitemap.xml', sitemap());

const missing = [...new Set(warnings)];
if (missing.length) console.log(`Переводов не хватает (${missing.length}):\n  ` + missing.join('\n  '));
if (CHECK) {
  if (changed.length) {
    console.log('Не собрано: ' + changed.join(', ') + '\nЗапусти: node tools/build-languages.mjs');
    process.exit(1);
  }
  console.log('Всё собрано.');
} else {
  console.log(changed.length ? 'Обновлено: ' + changed.join(', ') : 'Ничего не изменилось.');
}
