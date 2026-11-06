-- ============================================================
-- GARBAGE OF PARIS — галерея зрителей (visitors.html)
-- ============================================================
-- Выполнить ОДИН РАЗ в своём проекте Supabase:
-- SQL Editor → New query → вставить весь этот файл → Run.
-- Повторный запуск ничего не ломает.
--
-- Что получается:
-- - посетители могут ТОЛЬКО отправить фото (оно попадает в очередь);
-- - на сайте видны только одобренные фото;
-- - одобрять и удалять может только владелец — самый первый
--   пользователь, созданный в проекте (Authentication → Users);
-- - неодобренные фото не видны никому, даже по прямой ссылке;
-- - в очереди может ждать не больше 300 фото (защита от спама).
-- ============================================================


-- ---------- 1. Таблица с подписями к фото ----------

create table if not exists public.visitor_photos (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  path        text not null unique,               -- путь к файлу в хранилище: incoming/<uuid>.jpg
  name        text check (char_length(name) <= 60),      -- имя или ник автора
  location    text check (char_length(location) <= 80),  -- место в Париже
  caption     text check (char_length(caption) <= 200),  -- подпись
  status      text not null default 'pending' check (status in ('pending', 'approved'))
);

alter table public.visitor_photos enable row level security;


-- ---------- 2. Вспомогательные функции ----------

-- Владелец — самый первый пользователь проекта
create or replace function public.is_visitor_gallery_owner()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select auth.uid() is not null
     and auth.uid() = (select u.id from auth.users u order by u.created_at asc limit 1);
$$;

-- Сколько фото ждут проверки (нужно для лимита очереди)
create or replace function public.visitor_photos_pending_count()
returns integer
language sql stable security definer
set search_path = ''
as $$
  select count(*)::integer from public.visitor_photos where status = 'pending';
$$;

revoke all on function public.is_visitor_gallery_owner() from public;
revoke all on function public.visitor_photos_pending_count() from public;
grant execute on function public.is_visitor_gallery_owner() to anon, authenticated;
grant execute on function public.visitor_photos_pending_count() to anon, authenticated;


-- ---------- 3. Кто что может делать с таблицей ----------

revoke all on public.visitor_photos from anon, authenticated;
grant select on public.visitor_photos to anon, authenticated;
grant insert (path, name, location, caption) on public.visitor_photos to anon;
grant update (status), delete on public.visitor_photos to authenticated;

drop policy if exists "visitors send photos" on public.visitor_photos;
create policy "visitors send photos" on public.visitor_photos
  for insert to anon
  with check (
    status = 'pending'
    and path ~ '^incoming/[0-9a-f-]{36}\.jpg$'
    and public.visitor_photos_pending_count() < 300
  );

drop policy if exists "everyone sees approved photos" on public.visitor_photos;
create policy "everyone sees approved photos" on public.visitor_photos
  for select to anon, authenticated
  using (status = 'approved' or public.is_visitor_gallery_owner());

drop policy if exists "owner approves" on public.visitor_photos;
create policy "owner approves" on public.visitor_photos
  for update to authenticated
  using (public.is_visitor_gallery_owner())
  with check (public.is_visitor_gallery_owner());

drop policy if exists "owner deletes" on public.visitor_photos;
create policy "owner deletes" on public.visitor_photos
  for delete to authenticated
  using (public.is_visitor_gallery_owner());


-- ---------- 4. Хранилище для самих фото (закрытое) ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('visitor-photos', 'visitor-photos', false, 3145728, array['image/jpeg'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "visitors upload photos" on storage.objects;
create policy "visitors upload photos" on storage.objects
  for insert to anon
  with check (
    bucket_id = 'visitor-photos'
    and name ~ '^incoming/[0-9a-f-]{36}\.jpg$'
    and public.visitor_photos_pending_count() < 300
  );

drop policy if exists "approved photos are visible" on storage.objects;
create policy "approved photos are visible" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'visitor-photos'
    and (
      public.is_visitor_gallery_owner()
      or exists (
        select 1 from public.visitor_photos v
        where v.path = storage.objects.name and v.status = 'approved'
      )
    )
  );

drop policy if exists "owner deletes photos" on storage.objects;
create policy "owner deletes photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'visitor-photos' and public.is_visitor_gallery_owner());
