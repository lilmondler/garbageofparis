/*
  ============================================================
  GARBAGE OF PARIS — visitors-config.js
  ============================================================
  Подключение галереи зрителей (visitors.html) и страницы
  модерации (backstage.html) к проекту Supabase.

  Оба значения — публичные: их видит любой посетитель сайта,
  так и задумано. Кто что может делать, решают правила в
  supabase/visitor-gallery.sql, а не секретность ключа.

  Где взять: supabase.com → свой проект → Project Settings →
  API Keys (Project URL и publishable key / anon public key).

  Пока поля пустые, форма на сайте пишет, что приём фото
  скоро откроется.
  ============================================================
*/

window.VISITOR_GALLERY = {
  url: '',   // Project URL, например https://abcdefgh.supabase.co
  key: ''    // publishable key (sb_publishable_…) или anon public key (eyJ…)
};
