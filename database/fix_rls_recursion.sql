-- ============================================================
-- FIX: Infinite Recursion in users RLS Policies
-- Run this in Supabase → SQL Editor → New Query
-- ============================================================
-- Root cause: is_admin() queries public.users, but the SELECT
-- policy on public.users also calls is_admin() → infinite loop.
--
-- Fix: The users table policies use auth.jwt() directly.
--      All other tables can safely call is_admin() (which
--      queries users, whose policy no longer recurses).
-- ============================================================

-- Step 1: Fix is_admin() to be extra safe (no table query needed
--         if we use JWT, but keeping it for non-users tables)
create or replace function public.is_admin()
returns boolean language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Step 2: Replace the users table SELECT policy to use JWT directly
--         (avoids calling is_admin() on the users table itself)
drop policy if exists "Users can read own or admin reads all" on public.users;
create policy "Users can read own or admin reads all" on public.users
  for select using (
    auth.uid() = id
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    or coalesce((auth.jwt() -> 'app_metadata'  ->> 'role'), '') = 'admin'
  );

-- Step 3: Fix users UPDATE policy the same way
drop policy if exists "Admins can update users" on public.users;
create policy "Admins can update users" on public.users
  for update using (
    auth.uid() = id
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    or coalesce((auth.jwt() -> 'app_metadata'  ->> 'role'), '') = 'admin'
  );

-- Step 4: Fix users DELETE policy the same way
drop policy if exists "Admins can delete users" on public.users;
create policy "Admins can delete users" on public.users
  for delete using (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    or coalesce((auth.jwt() -> 'app_metadata'  ->> 'role'), '') = 'admin'
  );

-- Step 5: Make sure admin's JWT has the right role metadata
--         (so the JWT check above works for your admin user)
update auth.users
set raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'::jsonb
where email = 'jayvee.villanueva@urios.edu.ph';

-- Also ensure the public.users row has admin role
update public.users set role = 'admin'
where email = 'jayvee.villanueva@urios.edu.ph';

-- Step 6: Verify the fix
select 'Testing users table access...' as status;
select id, email, name, role from public.users limit 5;

select 'Testing appointments table...' as status;
select count(*) as appointment_count from public.appointments;

select 'Testing borrows table...' as status;
select count(*) as borrow_count from public.borrows;

select 'All tables OK — recursion fixed!' as result;
