-- Blog CMS: public storage bucket for article/cover images.
-- Apply as project owner in Supabase SQL Editor (storage policies need owner).
-- Bucket is PUBLIC for reads so Jekyll pages and cards can hotlink images.
-- Writes are restricted to admin_profiles members via private.is_admin().

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public reads blog images" on storage.objects;
create policy "public reads blog images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'blog-images');

drop policy if exists "admin uploads blog images" on storage.objects;
create policy "admin uploads blog images"
on storage.objects for insert to authenticated
with check (bucket_id = 'blog-images' and (select private.is_admin()));

drop policy if exists "admin updates blog images" on storage.objects;
create policy "admin updates blog images"
on storage.objects for update to authenticated
using (bucket_id = 'blog-images' and (select private.is_admin()))
with check (bucket_id = 'blog-images' and (select private.is_admin()));

drop policy if exists "admin deletes blog images" on storage.objects;
create policy "admin deletes blog images"
on storage.objects for delete to authenticated
using (bucket_id = 'blog-images' and (select private.is_admin()));

-- Verification:
-- select id, public from storage.buckets where id = 'blog-images';
