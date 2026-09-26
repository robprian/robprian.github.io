grant select on public.profiles, public.social_links, public.skills, public.experiences, public.education, public.interests to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.social_links, public.skills, public.experiences, public.education, public.interests to authenticated;
grant select on public.projects to anon;
grant select, insert, update, delete on public.projects to authenticated;
grant select on public.posts_metadata to anon;
grant select, insert, update, delete on public.posts_metadata to authenticated;
grant select, insert, update, delete on public.drafts, public.notes to authenticated;
grant select on public.admin_profiles to authenticated;
