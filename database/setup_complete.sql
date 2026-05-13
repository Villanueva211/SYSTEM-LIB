-- ============================================================
-- AutoBook Complete Database Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. USERS TABLE
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  role text default 'user' check (role in ('user', 'staff', 'admin')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. APPOINTMENTS TABLE
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  date date not null,
  time time not null,
  duration_minutes integer default 60,
  status text default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed', 'no-show')),
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. AVAILABILITY TABLE
create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  is_available boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. NOTIFICATION PREFERENCES TABLE
create table if not exists notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  email_on_booking boolean default true,
  email_on_reminder boolean default true,
  email_on_cancellation boolean default true,
  reminder_hours_before integer default 24,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. INDEXES
create index if not exists idx_appointments_user_id on appointments(user_id);
create index if not exists idx_appointments_date on appointments(date);
create index if not exists idx_appointments_status on appointments(status);
create index if not exists idx_availability_date on availability(date);

-- 6. ROW LEVEL SECURITY
alter table users enable row level security;
alter table appointments enable row level security;
alter table availability enable row level security;
alter table notification_preferences enable row level security;

-- Drop existing policies first to avoid conflicts
drop policy if exists "Users can read their own data" on users;
drop policy if exists "Admins can read all user data" on users;
drop policy if exists "Users can read their own appointments" on appointments;
drop policy if exists "Admins can read all appointments" on appointments;
drop policy if exists "Users can insert their own appointments" on appointments;
drop policy if exists "Users can update their own appointments" on appointments;
drop policy if exists "Everyone can read availability" on availability;
drop policy if exists "Admins can manage availability" on availability;
drop policy if exists "Users can read their own preferences" on notification_preferences;
drop policy if exists "Users can update their own preferences" on notification_preferences;
drop policy if exists "Users can insert their own preferences" on notification_preferences;

-- RLS: users
create policy "Users can read their own data" on users for select using (auth.uid() = id);
create policy "Admins can read all user data" on users for select using (
  auth.uid() in (select id from users where role = 'admin')
);

-- RLS: appointments
create policy "Users can read their own appointments" on appointments for select using (auth.uid() = user_id);
create policy "Admins can read all appointments" on appointments for select using (
  auth.uid() in (select id from users where role = 'admin')
);
create policy "Users can insert their own appointments" on appointments for insert with check (auth.uid() = user_id);
create policy "Users can update their own appointments" on appointments for update using (auth.uid() = user_id);

-- RLS: availability
create policy "Everyone can read availability" on availability for select using (true);
create policy "Admins can manage availability" on availability for all using (
  auth.uid() in (select id from users where role = 'admin')
);

-- RLS: notification_preferences
create policy "Users can read their own preferences" on notification_preferences for select using (auth.uid() = user_id);
create policy "Users can update their own preferences" on notification_preferences for update using (auth.uid() = user_id);
create policy "Users can insert their own preferences" on notification_preferences for insert with check (auth.uid() = user_id);

-- 7. AUTO-CREATE USER PROFILE ON SIGNUP TRIGGER
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. SEED EXISTING AUTH USERS WHO HAVE NO PROFILE ROW YET
insert into public.users (id, email, name, role)
select
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  'user'
from auth.users au
left join public.users u on u.id = au.id
where u.id is null
on conflict (id) do nothing;
