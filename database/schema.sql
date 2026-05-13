-- Users table
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  role text default 'user' check (role in ('user', 'staff', 'admin')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Appointments table
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  date date not null,
  time time not null,
  duration_minutes integer default 60,
  status text default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed', 'no-show')),
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(date, time) -- Prevent double booking
);

-- Availability table
create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  is_available boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Notification preferences table
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

-- Create indexes for better query performance
create index if not exists idx_appointments_user_id on appointments(user_id);
create index if not exists idx_appointments_date on appointments(date);
create index if not exists idx_appointments_status on appointments(status);
create index if not exists idx_availability_date on availability(date);

-- Enable RLS (Row Level Security)
alter table users enable row level security;
alter table appointments enable row level security;
alter table availability enable row level security;
alter table notification_preferences enable row level security;

-- RLS Policies for users
create policy "Users can read their own data" on users for select using (auth.uid() = id);
create policy "Admins can read all user data" on users for select using (
  auth.uid() in (select id from users where role = 'admin')
);

-- RLS Policies for appointments
create policy "Users can read their own appointments" on appointments for select using (auth.uid() = user_id);
create policy "Admins can read all appointments" on appointments for select using (
  auth.uid() in (select id from users where role = 'admin')
);
create policy "Users can insert their own appointments" on appointments for insert with check (auth.uid() = user_id);
create policy "Users can update their own appointments" on appointments for update using (auth.uid() = user_id);

-- RLS Policies for availability
create policy "Everyone can read availability" on availability for select using (true);
create policy "Admins can manage availability" on availability for all using (
  auth.uid() in (select id from users where role = 'admin')
);

-- RLS Policies for notification preferences
create policy "Users can read their own preferences" on notification_preferences for select using (auth.uid() = user_id);
create policy "Users can update their own preferences" on notification_preferences for update using (auth.uid() = user_id);
create policy "Users can insert their own preferences" on notification_preferences for insert with check (auth.uid() = user_id);
