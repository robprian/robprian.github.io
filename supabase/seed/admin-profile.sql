-- Run after creating or confirming admin user in Supabase Auth.
-- Replace USER_UUID with Auth user UUID. Do not store password here.
insert into public.admin_profiles (user_id, email)
select id, email
from auth.users
where lower(email) in ('robprian@gmail.com', 'robbyaprianto@outlook.co.id')
on conflict (user_id) do update set email = excluded.email;

-- Verify result without exposing credentials:
select user_id, email from public.admin_profiles;
