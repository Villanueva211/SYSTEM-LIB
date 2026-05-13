-- ============================================================
-- AutoBook Admin Setup + RLS Fix + Demo Accounts
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Helper function to check if current user is admin (avoids recursive RLS)
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- 2. Drop old conflicting policies
drop policy if exists "Admins can read all user data" on users;
drop policy if exists "Admins can read all appointments" on appointments;
drop policy if exists "Admins can manage availability" on availability;
drop policy if exists "Admins can delete appointments" on appointments;
drop policy if exists "Admins can update appointments" on appointments;
drop policy if exists "Admins can delete users" on users;
drop policy if exists "Admins can update users" on users;
drop policy if exists "Users can read their own data" on users;
drop policy if exists "Users can read their own appointments" on appointments;

-- 3. Re-create clean RLS policies
-- Users table
create policy "Users can read own or admin reads all" on users
  for select using (auth.uid() = id or public.is_admin());

create policy "Admins can update users" on users
  for update using (public.is_admin());

create policy "Admins can delete users" on users
  for delete using (public.is_admin());

-- Appointments table
create policy "Users read own or admin reads all" on appointments
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Admins can update appointments" on appointments
  for update using (auth.uid() = user_id or public.is_admin());

create policy "Admins can delete appointments" on appointments
  for delete using (public.is_admin());

-- Availability
create policy "Admins can manage availability" on availability
  for all using (public.is_admin());

-- 4. Promote jayvee.villanueva@urios.edu.ph to admin
update public.users
set role = 'admin'
where email = 'jayvee.villanueva@urios.edu.ph';

-- 5. Create demo customer account in auth.users
do $$
declare
  new_user_id uuid := gen_random_uuid();
begin
  -- Only insert if customer doesn't already exist
  if not exists (select 1 from auth.users where email = 'customer@autobook.com') then
    insert into auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      role,
      aud,
      raw_user_meta_data
    ) values (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'customer@autobook.com',
      crypt('customer123', gen_salt('bf')),
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated',
      '{"name": "Demo Customer"}'::jsonb
    );

    -- Insert into public.users
    insert into public.users (id, email, name, role)
    values (new_user_id, 'customer@autobook.com', 'Demo Customer', 'user');
  end if;
end $$;

-- 6. Verify all accounts
select id, email, name, role, created_at from public.users order by created_at;
