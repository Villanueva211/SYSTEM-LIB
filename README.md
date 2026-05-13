# AutoBook: Smart Appointment Scheduler

A full-stack web application built with **Next.js (App Router)**, **Supabase**, and **TypeScript**.

## Features Implemented

1. ✅ **User Authentication**
   - Email/password signup and signin with Supabase Auth
   - Role-based access (User, Staff, Admin)
   - Protected routes

2. ✅ **Appointment Booking System**
   - View available time slots
   - Book appointments with duration selection
   - Reschedule and cancel appointments
   - Prevent double-booking

3. ✅ **Smart Scheduling**
   - Automatic available slot generation based on working hours
   - Suggest least busy days for appointments
   - Configurable appointment duration

4. ✅ **Dashboards**
   - User Dashboard: View upcoming and past appointments
   - Admin Dashboard: Manage all bookings, users, and analytics

5. ✅ **Notifications**
   - Email confirmation on booking
   - Email reminders
   - Cancellation notifications
   - (Requires SMTP configuration)

6. ✅ **Calendar View**
   - Appointment calendar display
   - Status tracking (confirmed, cancelled, completed, no-show)

7. ✅ **Additional Features**
   - Dark mode support
   - Responsive UI (mobile-friendly)
   - Form validation with Zod
   - Analytics dashboard for admins

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a Supabase project at https://supabase.com
2. Copy your project credentials (URL and anon key)
3. Execute the SQL schema from `database/schema.sql` in Supabase SQL editor
4. Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email (optional)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_password
EMAIL_FROM=noreply@autobook.com

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Project Structure

```
app/
├── api/                    # Server actions and API routes
├── appointments/           # Appointment booking page
├── admin/                  # Admin dashboard
├── dashboard/              # User dashboard
├── signin/                 # Sign in page
├── signup/                 # Sign up page
├── layout.tsx              # Root layout
└── page.tsx                # Home page

components/
├── ui/                     # Reusable UI components
├── forms/                  # Auth forms
├── appointments/           # Appointment components
├── dashboard/              # Dashboard components
└── layout/                 # Header, Footer, Navbar

lib/
└── supabase.ts            # Supabase client configuration

types/
├── database.ts            # Database types
└── auth.ts                # Auth types

utils/
├── scheduling.ts          # Smart scheduling logic
├── validation.ts          # Zod schemas
├── email.ts               # Email notifications
└── auth.ts                # Auth utilities

database/
└── schema.sql             # Database schema
```

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Backend**: Supabase (PostgreSQL, Auth)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **UI Components**: Custom components with Lucide React icons
- **Theme**: next-themes (dark mode support)
- **Notifications**: React Hot Toast
- **Charts**: Recharts for analytics
- **Email**: Nodemailer (optional)

## Usage Guide

### For Users

1. **Sign Up**: Create a new account at `/signup`
2. **Book Appointment**: Visit `/appointments` to book a slot
3. **View Dashboard**: Check `/dashboard` for all appointments
4. **Cancel/Reschedule**: Manage appointments from dashboard

### For Admins

1. **Admin Dashboard**: Visit `/admin`
2. **Manage Appointments**: View, delete, or modify appointments
3. **Manage Users**: View and manage user accounts
4. **Analytics**: View booking statistics and trends

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Vercel will automatically deploy on push

```bash
npm run build
npm start
```

## Troubleshooting

**Issue**: "Missing Supabase configuration"
- **Solution**: Ensure `.env.local` has valid Supabase credentials

**Issue**: "Table does not exist"
- **Solution**: Run the SQL schema in Supabase SQL editor

**Issue**: "Email not sending"
- **Solution**: Verify SMTP configuration or disable email in `.env.local`

## License

MIT License
