alter table public.posts_metadata alter column github_path drop not null;
alter table public.posts_metadata add column if not exists source_key text;
alter table public.posts_metadata add column if not exists content text not null default '';
alter table public.posts_metadata add column if not exists tags text[] not null default '{}';
alter table public.posts_metadata add column if not exists cover_image text;
alter table public.posts_metadata add column if not exists seo_title text;
alter table public.posts_metadata add column if not exists seo_description text;
create unique index if not exists posts_metadata_source_key_idx on public.posts_metadata(source_key) where source_key is not null;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  name text not null,
  headline text not null,
  summary text not null default '',
  location text not null default '',
  email text not null default '',
  phone text not null default '',
  alternate_email text not null default '',
  profile_image text,
  handle text not null default '',
  timezone text not null default '',
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  label text not null,
  url text not null,
  sort_order integer not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  name text not null,
  category text not null,
  icon_slug text,
  proficiency text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  role text not null,
  organization text not null,
  location text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text not null default '',
  technologies text[] not null default '{}',
  sort_order integer not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.education (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  institution text not null,
  credential text not null,
  start_date date,
  end_date date,
  description text not null default '',
  sort_order integer not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.interests (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  name text not null,
  sort_order integer not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  github_repo_id bigint unique,
  source_key text not null unique,
  name text not null,
  description text,
  is_private boolean not null default false,
  public_url text,
  homepage text,
  language text,
  topics text[] not null default '{}',
  is_fork boolean not null default false,
  is_archived boolean not null default false,
  stars integer not null default 0,
  default_branch text,
  github_created_at timestamptz,
  github_updated_at timestamptz,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint private_project_url_hidden check (not is_private or (public_url is null and homepage is null))
);
create index if not exists projects_visible_updated_idx on public.projects(is_public, github_updated_at desc);
create index if not exists skills_active_sort_idx on public.skills(is_active, sort_order);
create index if not exists experiences_public_sort_idx on public.experiences(is_public, sort_order);
create index if not exists social_links_public_sort_idx on public.social_links(is_public, sort_order);
create index if not exists education_public_sort_idx on public.education(is_public, sort_order);
create index if not exists interests_public_sort_idx on public.interests(is_public, sort_order);

alter table public.profiles enable row level security;
alter table public.social_links enable row level security;
alter table public.skills enable row level security;
alter table public.experiences enable row level security;
alter table public.education enable row level security;
alter table public.interests enable row level security;
alter table public.projects enable row level security;

create policy "public reads visible profiles" on public.profiles for select to anon, authenticated using (is_public);
create policy "admin manages profiles" on public.profiles for all to authenticated using (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())));
create policy "public reads visible social links" on public.social_links for select to anon, authenticated using (is_public);
create policy "admin manages social links" on public.social_links for all to authenticated using (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())));
create policy "public reads active skills" on public.skills for select to anon, authenticated using (is_active);
create policy "admin manages skills" on public.skills for all to authenticated using (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())));
create policy "public reads visible experience" on public.experiences for select to anon, authenticated using (is_public);
create policy "admin manages experience" on public.experiences for all to authenticated using (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())));
create policy "public reads visible education" on public.education for select to anon, authenticated using (is_public);
create policy "admin manages education" on public.education for all to authenticated using (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())));
create policy "public reads visible interests" on public.interests for select to anon, authenticated using (is_public);
create policy "admin manages interests" on public.interests for all to authenticated using (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())));
create policy "admin manages projects" on public.projects for all to authenticated using (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())));
create policy "admin reads every project" on public.projects for select to authenticated using (exists(select 1 from public.admin_profiles a where a.user_id=(select auth.uid())));

create or replace view public.public_projects with (security_barrier=true) as
select id, github_repo_id, name, description, is_private, case when is_private then null else public_url end as public_url, case when is_private then null else homepage end as homepage, language, topics, is_fork, is_archived, stars, github_created_at, github_updated_at, sort_order, is_featured
from public.projects;
create or replace view public.public_posts with (security_barrier=true) as
select slug,title,excerpt,content,tags,cover_image,seo_title,seo_description,published_at,created_at,updated_at from public.posts_metadata where status='PUBLISHED';
revoke all on public.profiles, public.social_links, public.skills, public.experiences, public.education, public.interests, public.projects, public.public_projects, public.public_posts from anon, authenticated;
grant select on public.profiles, public.social_links, public.skills, public.experiences, public.education, public.interests, public.projects, public.public_projects, public.public_posts to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.social_links, public.skills, public.experiences, public.education, public.interests, public.projects to authenticated;
grant select, insert, update, delete on public.posts_metadata, public.drafts, public.notes to authenticated;
