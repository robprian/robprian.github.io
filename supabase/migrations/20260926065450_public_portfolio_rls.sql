grant select on public.posts_metadata to anon;
create policy "public reads published post metadata" on public.posts_metadata for select to anon using (status='PUBLISHED');
grant select on public.projects to anon;
drop policy if exists "public reads visible projects" on public.projects;
create policy "public reads visible projects" on public.projects for select to anon using (is_public);
