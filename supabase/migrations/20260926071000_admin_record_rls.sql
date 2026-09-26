drop policy if exists "admin updates own drafts" on public.drafts;
create policy "admins update drafts" on public.drafts for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()) and user_id=(select auth.uid()));
drop policy if exists "admin creates own drafts" on public.drafts;
create policy "admins insert drafts" on public.drafts for insert to authenticated with check ((select private.is_admin()) and user_id=(select auth.uid()));
drop policy if exists "admin reads own drafts" on public.drafts;
create policy "admins read drafts" on public.drafts for select to authenticated using ((select private.is_admin()) and user_id=(select auth.uid()));
drop policy if exists "admin deletes own drafts" on public.drafts;
create policy "admins delete drafts" on public.drafts for delete to authenticated using ((select private.is_admin()) and user_id=(select auth.uid()));

drop policy if exists "admin updates own posts" on public.posts_metadata;
create policy "admins update post metadata" on public.posts_metadata for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "admin creates own posts" on public.posts_metadata;
create policy "admins insert post metadata" on public.posts_metadata for insert to authenticated with check ((select private.is_admin()));
drop policy if exists "admin reads own posts" on public.posts_metadata;
create policy "admins read post metadata" on public.posts_metadata for select to authenticated using ((select private.is_admin()));
drop policy if exists "admin deletes own posts" on public.posts_metadata;
create policy "admins delete post metadata" on public.posts_metadata for delete to authenticated using ((select private.is_admin()));
