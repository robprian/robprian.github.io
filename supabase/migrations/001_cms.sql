create extension if not exists pgcrypto;

create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  title text not null default '',
  description text not null default '',
  content text not null default '',
  categories text[] not null default '{}',
  tags text[] not null default '{}',
  status text not null default 'DRAFT' check (status in ('DRAFT','SCHEDULED','PUBLISHED','ARCHIVED')),
  github_path text,
  github_sha text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, slug)
);

create table public.posts_metadata (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  status text not null default 'PUBLISHED' check (status in ('DRAFT','SCHEDULED','PUBLISHED','ARCHIVED')),
  github_path text not null,
  github_sha text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  category text not null default '',
  tags text[] not null default '{}',
  is_pinned boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index drafts_user_updated_idx on public.drafts(user_id, updated_at desc);
create index posts_metadata_user_idx on public.posts_metadata(user_id);
create index posts_metadata_updated_idx on public.posts_metadata(updated_at desc);
create index notes_user_updated_idx on public.notes(user_id, updated_at desc);

alter table public.admin_profiles enable row level security;
alter table public.drafts enable row level security;
alter table public.posts_metadata enable row level security;
alter table public.notes enable row level security;

create policy "admin profile is self only" on public.admin_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "admin reads own drafts" on public.drafts for select to authenticated using ((select auth.uid()) = user_id);
create policy "admin creates own drafts" on public.drafts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "admin updates own drafts" on public.drafts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "admin deletes own drafts" on public.drafts for delete to authenticated using ((select auth.uid()) = user_id);
create policy "admin reads own posts" on public.posts_metadata for select to authenticated using ((select auth.uid()) = user_id);
create policy "admin creates own posts" on public.posts_metadata for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "admin updates own posts" on public.posts_metadata for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "admin deletes own posts" on public.posts_metadata for delete to authenticated using ((select auth.uid()) = user_id);
create policy "admin reads own notes" on public.notes for select to authenticated using ((select auth.uid()) = user_id);
create policy "admin creates own notes" on public.notes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "admin updates own notes" on public.notes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "admin deletes own notes" on public.notes for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.admin_profiles, public.drafts, public.posts_metadata, public.notes from anon;
grant select, insert, update, delete on public.drafts, public.posts_metadata, public.notes to authenticated;
grant select on public.admin_profiles to authenticated;
