-- ============================================================
-- LIBRARY MANAGEMENT SYSTEM — COMPLETE SETUP SCRIPT
-- Run this ONCE in: Supabase → SQL Editor → New Query
-- ============================================================

-- ── 1. Helper: is_admin() ───────────────────────────────────
-- NOTE: This queries public.users but is safe for non-users tables.
-- The users table policies use auth.jwt() directly to avoid recursion.
create or replace function public.is_admin()
returns boolean language sql security definer stable
set search_path = public
as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

-- ── 2. Ensure users table exists ────────────────────────────
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  name text not null default 'User',
  role text not null default 'user' check (role in ('user','staff','admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.users enable row level security;

-- Users RLS
-- CRITICAL: Do NOT use is_admin() here — it queries public.users,
-- which would trigger this policy again → infinite recursion.
-- Instead, read the role directly from the JWT token.
--
-- Drop ALL existing policies first (catches any leftover names)
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where tablename = 'users' and schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.users', pol.policyname);
  end loop;
end $$;

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

-- ── 3. Books ─────────────────────────────────────────────────
create table if not exists public.books (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  author text not null,
  isbn text unique,
  category text default 'General',
  description text,
  cover_url text,
  total_copies int default 1 check (total_copies >= 0),
  available_copies int default 1 check (available_copies >= 0),
  archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.books enable row level security;
drop policy if exists "Anyone can read books" on books;
create policy "Anyone can read books" on books for select using (true);
drop policy if exists "Admins manage books" on books;
create policy "Admins manage books" on books for all using (public.is_admin());

-- ── 4. Borrows ───────────────────────────────────────────────
create table if not exists public.borrows (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  book_id uuid references public.books(id) on delete cascade,
  status text default 'pending' check (status in ('pending','approved','declined','returned','overdue')),
  borrow_date date,
  due_date date,
  return_date date,
  renewed_count int default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.borrows enable row level security;
drop policy if exists "Users see own borrows" on borrows;
create policy "Users see own borrows" on borrows for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "Users can request borrow" on borrows;
create policy "Users can request borrow" on borrows for insert with check (auth.uid() = user_id);
drop policy if exists "Admins update borrows" on borrows;
create policy "Admins update borrows" on borrows for update using (public.is_admin() or auth.uid() = user_id);
drop policy if exists "Admins delete borrows" on borrows;
create policy "Admins delete borrows" on borrows for delete using (public.is_admin());

-- ── 5. Reservations ──────────────────────────────────────────
create table if not exists public.reservations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  book_id uuid references public.books(id) on delete cascade,
  status text default 'waiting' check (status in ('waiting','notified','fulfilled','cancelled')),
  queue_position int,
  created_at timestamptz default now()
);
alter table public.reservations enable row level security;
drop policy if exists "Users see own reservations" on reservations;
create policy "Users see own reservations" on reservations for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "Users can reserve" on reservations;
create policy "Users can reserve" on reservations for insert with check (auth.uid() = user_id);
drop policy if exists "Users can cancel own reservation" on reservations;
create policy "Users can cancel own reservation" on reservations for update using (auth.uid() = user_id or public.is_admin());
drop policy if exists "Admins delete reservations" on reservations;
create policy "Admins delete reservations" on reservations for delete using (public.is_admin());

-- ── 6. Appointments ──────────────────────────────────────────
create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  type text default 'study_room' check (type in ('study_room','librarian')),
  room text,
  date date not null,
  start_time time not null,
  end_time time not null,
  status text default 'pending' check (status in ('pending','approved','declined','cancelled')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.appointments enable row level security;
drop policy if exists "Users see own appointments" on appointments;
create policy "Users see own appointments" on appointments for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "Users can book appointment" on appointments;
create policy "Users can book appointment" on appointments for insert with check (auth.uid() = user_id);
drop policy if exists "Users or admins update appointment" on appointments;
create policy "Users or admins update appointment" on appointments for update using (auth.uid() = user_id or public.is_admin());
drop policy if exists "Admins delete appointments" on appointments;
create policy "Admins delete appointments" on appointments for delete using (public.is_admin());

-- ── 7. Fines ─────────────────────────────────────────────────
create table if not exists public.fines (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  borrow_id uuid references public.borrows(id) on delete cascade,
  amount numeric(10,2) default 0,
  paid boolean default false,
  paid_at timestamptz,
  created_at timestamptz default now()
);
alter table public.fines enable row level security;
drop policy if exists "Users see own fines" on fines;
create policy "Users see own fines" on fines for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "Admins manage fines" on fines;
create policy "Admins manage fines" on fines for all using (public.is_admin());

-- ── 8. Notifications ─────────────────────────────────────────
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info','warning','success','error')),
  read boolean default false,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;
drop policy if exists "Users see own notifications" on notifications;
create policy "Users see own notifications" on notifications for select using (auth.uid() = user_id);
drop policy if exists "Admins insert notifications" on notifications;
create policy "Admins insert notifications" on notifications for insert with check (public.is_admin() or auth.uid() = user_id);
drop policy if exists "Users mark read" on notifications;
create policy "Users mark read" on notifications for update using (auth.uid() = user_id);

-- ── 9. Settings ──────────────────────────────────────────────
create table if not exists public.settings (
  id int primary key default 1,
  library_name text default 'Library System',
  max_borrow_days int default 7,
  max_books_per_member int default 3,
  fine_per_day numeric(10,2) default 5.00,
  allow_renewals boolean default true,
  max_renewals int default 1,
  updated_at timestamptz default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;
alter table public.settings enable row level security;
drop policy if exists "Anyone can read settings" on settings;
create policy "Anyone can read settings" on settings for select using (true);
drop policy if exists "Admins update settings" on settings;
create policy "Admins update settings" on settings for update using (public.is_admin());

-- ── 10. Enable Realtime ──────────────────────────────────────
-- Go to: Supabase Dashboard → Database → Replication → Enable for these tables:
-- notifications, borrows, appointments, reservations
-- OR run:
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.borrows;
alter publication supabase_realtime add table public.appointments;
alter publication supabase_realtime add table public.reservations;

-- ── 11. Promote admin account ────────────────────────────────
-- Update public.users row
update public.users set role = 'admin' where email = 'jayvee.villanueva@urios.edu.ph';
-- Also embed role in auth JWT metadata so the JWT-based RLS check works
update auth.users
  set raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'::jsonb
  where email = 'jayvee.villanueva@urios.edu.ph';

-- ── 12. Migrate existing auth users → public.users ───────────
-- This inserts any existing Supabase auth users who don't yet have a public.users row
insert into public.users (id, email, name, role)
select
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data->>'name', split_part(au.email,'@',1), 'User') as name,
  case when au.email = 'jayvee.villanueva@urios.edu.ph' then 'admin' else 'user' end as role
from auth.users au
where not exists (select 1 from public.users pu where pu.id = au.id)
on conflict (id) do nothing;

-- ── 13. Sample book catalog ──────────────────────────────────
insert into public.books (title, author, isbn, category, description, total_copies, available_copies) values
  ('The Great Gatsby','F. Scott Fitzgerald','978-0-7432-7356-5','Fiction','A story of the fabulously wealthy Jay Gatsby and his love for Daisy Buchanan.',3,3),
  ('To Kill a Mockingbird','Harper Lee','978-0-06-112008-4','Fiction','A powerful story of racial injustice and childhood innocence in the American South.',2,2),
  ('1984','George Orwell','978-0-45-228423-4','Fiction','A chilling portrait of a totalitarian society ruled by Big Brother.',4,4),
  ('Introduction to Algorithms','Thomas H. Cormen','978-0-26-204630-5','Technology','The definitive guide to computer algorithms — comprehensive and rigorous.',2,2),
  ('Clean Code','Robert C. Martin','978-0-13-235088-4','Technology','A handbook of agile software craftsmanship for writing readable, maintainable code.',3,3),
  ('Sapiens: A Brief History of Humankind','Yuval Noah Harari','978-0-06-231609-7','History','A sweeping narrative of human history spanning 70,000 years.',2,2),
  ('The Alchemist','Paulo Coelho','978-0-06-112241-5','Fiction','A magical story about following your dreams and listening to your heart.',3,3),
  ('Atomic Habits','James Clear','978-0-73-521129-2','Self-Help','Tiny changes, remarkable results — the science of habit formation.',2,2),
  ('Harry Potter and the Sorcerer''s Stone','J.K. Rowling','978-0-59-035342-7','Fantasy','A young wizard discovers his magical heritage at Hogwarts School.',5,5),
  ('The Art of War','Sun Tzu','978-1-59-030763-1','Philosophy','Ancient Chinese military treatise on strategy, tactics, and leadership.',2,2),
  ('Thinking, Fast and Slow','Daniel Kahneman','978-0-37-453355-7','Psychology','Explores the two systems of thought that drive the way we make decisions.',2,2),
  ('The Pragmatic Programmer','David Thomas','978-0-13-595705-9','Technology','Timeless lessons for developers on writing better, more maintainable code.',2,2)
on conflict (isbn) do nothing;

-- ── 14. Verification ────────────────────────────────────────
select 'users' as table_name, count(*) as rows from public.users
union all select 'books', count(*) from public.books
union all select 'borrows', count(*) from public.borrows
union all select 'reservations', count(*) from public.reservations
union all select 'appointments', count(*) from public.appointments
union all select 'fines', count(*) from public.fines
union all select 'notifications', count(*) from public.notifications
union all select 'settings', count(*) from public.settings
order by table_name;
