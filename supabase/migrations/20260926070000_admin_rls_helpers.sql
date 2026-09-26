create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_admin() from public, anon, authenticated;
drop policy if exists "admin manages profiles" on public.profiles;
create policy "admin manages profiles" on public.profiles for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "admin manages social links" on public.social_links;
create policy "admin manages social links" on public.social_links for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "admin manages skills" on public.skills;
create policy "admin manages skills" on public.skills for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "admin manages experience" on public.experiences;
create policy "admin manages experience" on public.experiences for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "admin manages education" on public.education;
create policy "admin manages education" on public.education for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "admin manages interests" on public.interests;
create policy "admin manages interests" on public.interests for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "admin manages projects" on public.projects;
create policy "admin manages projects" on public.projects for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "admin reads every project" on public.projects;
create policy "admin reads every project" on public.projects for select to authenticated using ((select private.is_admin()));
