-- Run once in Supabase SQL Editor before deploying v12.9.
-- Preserves existing translated text, ownership and RLS policies.
alter table public.saved_translations
  add column if not exists is_favorite boolean not null default false,
  add column if not exists reading_progress integer not null default 0,
  add column if not exists last_read_at timestamptz;
alter table public.saved_translations
  drop constraint if exists saved_translations_reading_progress_check;
alter table public.saved_translations
  add constraint saved_translations_reading_progress_check check (reading_progress between 0 and 100);
create index if not exists saved_translations_user_favorites
  on public.saved_translations(user_id, is_favorite, last_read_at desc);
