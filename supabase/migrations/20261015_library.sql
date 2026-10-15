-- Apply in Supabase SQL editor once. Authenticated users see only their own rows.
create table if not exists public.saved_translations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 source_url text not null check (length(source_url) between 9 and 2048),
 source_title text not null default '',
 language text not null default 'sk' check (language = 'sk'),
 source_hash text not null,
 translated_text text not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (user_id, source_hash, language)
);
create index if not exists saved_translations_user_updated on public.saved_translations(user_id, updated_at desc);
alter table public.saved_translations enable row level security;
revoke all on public.saved_translations from anon;
grant select, insert, update, delete on public.saved_translations to authenticated;
create policy "read own translations" on public.saved_translations for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own translations" on public.saved_translations for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own translations" on public.saved_translations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own translations" on public.saved_translations for delete to authenticated using ((select auth.uid()) = user_id);
