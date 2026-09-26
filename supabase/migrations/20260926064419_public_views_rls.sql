revoke all on public.projects from anon, authenticated;
grant select, insert, update, delete on public.projects to authenticated;
drop policy if exists "public reads visible projects" on public.projects;
create policy "public reads visible projects" on public.projects for select to anon using (is_public);
drop policy if exists "admin manages projects" on public.projects;
create policy "admin manages projects" on public.projects for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "admin reads every project" on public.projects;
create policy "admin reads every project" on public.projects for select to authenticated using ((select private.is_admin()));

create or replace view public.public_projects with (security_invoker=true) as
select id, github_repo_id, name, description, is_private, case when is_private then null else public_url end as public_url, case when is_private then null else homepage end as homepage, language, topics, is_fork, is_archived, stars, github_created_at, github_updated_at, sort_order, is_featured
from public.projects;
create or replace view public.public_posts with (security_invoker=true) as
select slug,title,excerpt,content,tags,cover_image,seo_title,seo_description,published_at,created_at,updated_at from public.posts_metadata where status='PUBLISHED';
revoke all on public.public_projects, public.public_posts from anon, authenticated;
grant select on public.public_projects, public.public_posts to anon, authenticated;
