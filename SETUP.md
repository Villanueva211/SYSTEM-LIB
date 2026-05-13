# AutoBook Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Supabase Project
1. Go to https://supabase.com and create a new project
2. Wait for the project to be ready
3. Get your credentials from Settings > API

### 3. Setup Environment Variables
Create `.env.local` in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (copy from Supabase)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (copy from Supabase)

# Email (optional - skip if not needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@autobook.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Setup Database Schema
1. In Supabase dashboard, go to SQL Editor
2. Create a new query
3. Copy the entire SQL from `database/schema.sql`
4. Paste and run it

### 5. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## First Time User Flow

1. **Homepage** - See features and CTA buttons
2. **Sign Up** - Create account at `/signup`
3. **Dashboard** - View stats at `/dashboard`
4. **Book Appointment** - Schedule at `/appointments`
5. **Admin** (if admin) - Manage all at `/admin`

## For Admin Access

To make a user an admin:

1. Go to Supabase SQL Editor
2. Run this query:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

3. Log out and log back in
4. Access `/admin`

## Email Configuration (Optional)

If you skip email setup, the app will log email details to console instead of sending actual emails.

### Using Gmail:
1. Enable 2-Factor Authentication
2. Create App Password (16 characters)
3. Use as `SMTP_PASSWORD`

## Testing Checklist

- [ ] Can sign up with new account
- [ ] Can sign in with existing account
- [ ] Can book appointments
- [ ] Can view dashboard
- [ ] Can cancel appointments
- [ ] (Admin) Can access admin page
- [ ] (Admin) Can see all appointments and users
- [ ] Dark mode toggle works

## Troubleshooting

### "Supabase connection error"
- Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Ensure Supabase project is active

### "Table does not exist"
- Run the schema SQL file from database/schema.sql
- Check Supabase SQL Editor for errors

### "Authentication failed"
- Clear browser cookies
- Ensure auth is enabled in Supabase
- Check user exists in users table

### "Email not sending"
- Check SMTP configuration
- For Gmail, use App Password not regular password
- Check spam folder

## Next Steps

After setup is complete, you can:

1. **Customize** - Modify colors, emails, working hours in code
2. **Add Features** - Integrate payment, video calls, SMS
3. **Deploy** - Push to GitHub and connect to Vercel
4. **Monitor** - Check Supabase logs and analytics

## Common Customizations

### Change Working Hours
Edit `utils/scheduling.ts`:
```typescript
const WORKING_HOURS_START = 9;  // 9 AM
const WORKING_HOURS_END = 17;   // 5 PM
```

### Change Appointment Duration
Edit `utils/scheduling.ts`:
```typescript
const APPOINTMENT_DURATION_MINUTES = 60; // Change to 30, 45, etc.
```

### Change Primary Color
Edit `tailwind.config.js` - the `primary` color palette

### Add Custom Email Template
Edit `utils/email.ts` - the HTML templates

## Deployment to Vercel

1. Push code to GitHub
2. Go to Vercel.com
3. Click "New Project"
4. Select your repository
5. Add environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - (Email vars if needed)
6. Click Deploy

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
