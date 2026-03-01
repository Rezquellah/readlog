-- ReadLog Supabase schema + RLS
-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  language text not null check (language in ('EN', 'FR')),
  title text not null,
  author text,
  cover_url text,
  status text not null check (status in ('PLANNED', 'READING', 'FINISHED')),
  tags text[] not null default '{}',
  total_chapters integer not null check (total_chapters >= 1),
  current_chapter integer not null check (current_chapter >= 0),
  start_date date,
  target_finish_date date,
  finished_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chapter_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  chapter_number integer not null check (chapter_number > 0),
  chapter_title text,
  learned_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null unique references public.books(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vocab_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  word text not null,
  meaning text not null,
  example text not null,
  chapter_number integer,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cloud_sync_enabled boolean not null default true,
  celebrations_enabled boolean not null default true,
  last_backup_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_log_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  count integer not null default 1,
  last_activity_at timestamptz not null default now(),
  types text[] not null default '{}',
  primary key (user_id, date)
);

create index if not exists books_user_updated_idx on public.books (user_id, updated_at desc);
create index if not exists books_user_target_idx on public.books (user_id, target_finish_date);
create index if not exists chapter_notes_user_book_idx on public.chapter_notes (user_id, book_id);
create index if not exists vocab_entries_user_book_idx on public.vocab_entries (user_id, book_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists books_set_updated_at on public.books;
create trigger books_set_updated_at
before update on public.books
for each row execute procedure public.set_updated_at();

drop trigger if exists chapter_notes_set_updated_at on public.chapter_notes;
create trigger chapter_notes_set_updated_at
before update on public.chapter_notes
for each row execute procedure public.set_updated_at();

drop trigger if exists book_notes_set_updated_at on public.book_notes;
create trigger book_notes_set_updated_at
before update on public.book_notes
for each row execute procedure public.set_updated_at();

drop trigger if exists vocab_entries_set_updated_at on public.vocab_entries;
create trigger vocab_entries_set_updated_at
before update on public.vocab_entries
for each row execute procedure public.set_updated_at();

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
before update on public.app_settings
for each row execute procedure public.set_updated_at();

alter table public.books enable row level security;
alter table public.chapter_notes enable row level security;
alter table public.book_notes enable row level security;
alter table public.vocab_entries enable row level security;
alter table public.app_settings enable row level security;
alter table public.activity_log_days enable row level security;

drop policy if exists "books_select_own" on public.books;
create policy "books_select_own" on public.books for select using (auth.uid() = user_id);
drop policy if exists "books_insert_own" on public.books;
create policy "books_insert_own" on public.books for insert with check (auth.uid() = user_id);
drop policy if exists "books_update_own" on public.books;
create policy "books_update_own" on public.books for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "books_delete_own" on public.books;
create policy "books_delete_own" on public.books for delete using (auth.uid() = user_id);

drop policy if exists "chapter_notes_select_own" on public.chapter_notes;
create policy "chapter_notes_select_own" on public.chapter_notes for select using (auth.uid() = user_id);
drop policy if exists "chapter_notes_insert_own" on public.chapter_notes;
create policy "chapter_notes_insert_own" on public.chapter_notes for insert with check (auth.uid() = user_id);
drop policy if exists "chapter_notes_update_own" on public.chapter_notes;
create policy "chapter_notes_update_own" on public.chapter_notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "chapter_notes_delete_own" on public.chapter_notes;
create policy "chapter_notes_delete_own" on public.chapter_notes for delete using (auth.uid() = user_id);

drop policy if exists "book_notes_select_own" on public.book_notes;
create policy "book_notes_select_own" on public.book_notes for select using (auth.uid() = user_id);
drop policy if exists "book_notes_insert_own" on public.book_notes;
create policy "book_notes_insert_own" on public.book_notes for insert with check (auth.uid() = user_id);
drop policy if exists "book_notes_update_own" on public.book_notes;
create policy "book_notes_update_own" on public.book_notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "book_notes_delete_own" on public.book_notes;
create policy "book_notes_delete_own" on public.book_notes for delete using (auth.uid() = user_id);

drop policy if exists "vocab_entries_select_own" on public.vocab_entries;
create policy "vocab_entries_select_own" on public.vocab_entries for select using (auth.uid() = user_id);
drop policy if exists "vocab_entries_insert_own" on public.vocab_entries;
create policy "vocab_entries_insert_own" on public.vocab_entries for insert with check (auth.uid() = user_id);
drop policy if exists "vocab_entries_update_own" on public.vocab_entries;
create policy "vocab_entries_update_own" on public.vocab_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "vocab_entries_delete_own" on public.vocab_entries;
create policy "vocab_entries_delete_own" on public.vocab_entries for delete using (auth.uid() = user_id);

drop policy if exists "app_settings_select_own" on public.app_settings;
create policy "app_settings_select_own" on public.app_settings for select using (auth.uid() = user_id);
drop policy if exists "app_settings_insert_own" on public.app_settings;
create policy "app_settings_insert_own" on public.app_settings for insert with check (auth.uid() = user_id);
drop policy if exists "app_settings_update_own" on public.app_settings;
create policy "app_settings_update_own" on public.app_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "app_settings_delete_own" on public.app_settings;
create policy "app_settings_delete_own" on public.app_settings for delete using (auth.uid() = user_id);

drop policy if exists "activity_log_days_select_own" on public.activity_log_days;
create policy "activity_log_days_select_own" on public.activity_log_days for select using (auth.uid() = user_id);
drop policy if exists "activity_log_days_insert_own" on public.activity_log_days;
create policy "activity_log_days_insert_own" on public.activity_log_days for insert with check (auth.uid() = user_id);
drop policy if exists "activity_log_days_update_own" on public.activity_log_days;
create policy "activity_log_days_update_own" on public.activity_log_days for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "activity_log_days_delete_own" on public.activity_log_days;
create policy "activity_log_days_delete_own" on public.activity_log_days for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('readlog-covers', 'readlog-covers', true)
on conflict (id) do update set public = excluded.public;
-- storage.objects is managed by Supabase and already has RLS enabled.

drop policy if exists "covers_public_read" on storage.objects;
create policy "covers_public_read"
on storage.objects for select
using (bucket_id = 'readlog-covers');

drop policy if exists "covers_insert_own_folder" on storage.objects;
create policy "covers_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'readlog-covers'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "covers_update_own_folder" on storage.objects;
create policy "covers_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'readlog-covers'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'readlog-covers'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "covers_delete_own_folder" on storage.objects;
create policy "covers_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'readlog-covers'
  and auth.uid()::text = (storage.foldername(name))[1]
);
