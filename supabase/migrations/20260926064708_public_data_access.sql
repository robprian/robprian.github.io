grant select on public.projects to anon;
revoke all on public.projects from authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select on public.public_projects, public.public_posts to anon, authenticated;
