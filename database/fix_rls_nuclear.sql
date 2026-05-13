-- ============================================================
-- NUCLEAR FIX: Drop ALL policies on users table, recreate clean
-- This handles any leftover policies with unexpected names.
-- Run in: Supabase → SQL Editor → New Query
-- ============================================================

-- Step 1: Drop EVERY policy on the users table (by name from pg_policies)
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies where tablename = 'users' and schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.users', pol.policyname);
    raise notice 'Dropped policy: %', pol.policyname;
  end loop;
end $$;

-- Step 2: Recreate users policies using auth.jwt() ONLY (no is_admin() call)
create policy "users_select" on public.users
  for select using (
    auth.uid() = id
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    or coalesce((auth.jwt() -> 'app_metadata'  ->> 'role'), '') = 'admin'
  );

create policy "users_insert" on public.users
  for insert with check (auth.uid() = id);

create policy "users_update" on public.users
  for update using (
    auth.uid() = id
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    or coalesce((auth.jwt() -> 'app_metadata'  ->> 'role'), '') = 'admin'
  );

create policy "users_delete" on public.users
  for delete using (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    or coalesce((auth.jwt() -> 'app_metadata'  ->> 'role'), '') = 'admin'
  );

-- Step 3: Verify all policies on users now
select policyname, cmd, qual
from pg_policies
where tablename = 'users' and schemaname = 'public'
order by policyname;

-- Step 4: Quick smoke test — if this returns rows/empty without error, recursion is gone
select 'appointments OK' as test, count(*) from public.appointments;
select 'borrows OK' as test, count(*) from public.borrows;
select 'users OK' as test, count(*) from public.users;
select 'ALL CLEAR' as result;
