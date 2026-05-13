-- ============================================================
-- Library System Schema
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Books catalog table
create table if not exists public.books (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  author text not null,
  isbn text unique,
  category text default 'General',
  description text,
  cover_url text,
  total_copies int default 1,
  available_copies int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Borrow records table
create table if not exists public.borrows (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  book_id uuid references public.books(id) on delete cascade,
  status text default 'pending' check (status in ('pending','approved','declined','returned','overdue')),
  borrow_date date,
  due_date date,
  return_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Enable RLS
alter table public.books enable row level security;
alter table public.borrows enable row level security;

-- 4. Books policies (everyone can read, only admin can write)
drop policy if exists "Anyone can read books" on books;
drop policy if exists "Admins can manage books" on books;

create policy "Anyone can read books" on books for select using (true);
create policy "Admins can insert books" on books for insert using (public.is_admin());
create policy "Admins can update books" on books for update using (public.is_admin());
create policy "Admins can delete books" on books for delete using (public.is_admin());

-- 5. Borrows policies
drop policy if exists "Users see own borrows" on borrows;
drop policy if exists "Admins see all borrows" on borrows;

create policy "Users see own borrows" on borrows for select using (auth.uid() = user_id or public.is_admin());
create policy "Users can request borrow" on borrows for insert with check (auth.uid() = user_id);
create policy "Admins can update borrows" on borrows for update using (public.is_admin());
create policy "Admins can delete borrows" on borrows for delete using (public.is_admin());

-- 6. Users INSERT policy (if missing)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='users' and policyname='Users can insert own profile') then
    execute 'create policy "Users can insert own profile" on users for insert with check (auth.uid() = id)';
  end if;
end $$;

-- 7. Promote jayvee to admin
update public.users set role = 'admin' where email = 'jayvee.villanueva@urios.edu.ph';

-- 8. Create demo student account in auth
do $$
declare new_id uuid := gen_random_uuid();
begin
  if not exists (select 1 from auth.users where email = 'student@library.com') then
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, role, aud, raw_user_meta_data)
    values (new_id,'00000000-0000-0000-0000-000000000000','student@library.com',
      crypt('student123', gen_salt('bf')), now(), now(), now(), 'authenticated','authenticated','{"name":"Demo Student"}');
    insert into public.users (id, email, name, role)
    values (new_id, 'student@library.com', 'Demo Student', 'user');
  end if;
end $$;

-- 9. Seed sample books
insert into public.books (title, author, isbn, category, description, total_copies, available_copies) values
  ('The Great Gatsby', 'F. Scott Fitzgerald', '978-0-7432-7356-5', 'Fiction', 'A story of the fabulously wealthy Jay Gatsby.', 3, 3),
  ('To Kill a Mockingbird', 'Harper Lee', '978-0-06-112008-4', 'Fiction', 'The unforgettable novel of a childhood in a sleepy Southern town.', 2, 2),
  ('1984', 'George Orwell', '978-0-45-228423-4', 'Dystopian', 'A dystopian novel set in a totalitarian society.', 4, 4),
  ('Introduction to Algorithms', 'CLRS', '978-0-26-204630-5', 'Technology', 'Comprehensive guide to algorithms.', 2, 2),
  ('Clean Code', 'Robert C. Martin', '978-0-13-235088-4', 'Technology', 'A handbook of agile software craftsmanship.', 3, 3),
  ('Sapiens', 'Yuval Noah Harari', '978-0-06-231609-7', 'History', 'A brief history of humankind.', 2, 2)
on conflict (isbn) do nothing;

-- Verify
select email, name, role from public.users;
select title, author, available_copies from public.books;
