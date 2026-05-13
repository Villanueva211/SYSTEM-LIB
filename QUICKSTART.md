# AutoBook - Quick Reference

## 📋 First Time Setup (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Edit .env.local with your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# 4. Run schema.sql in Supabase SQL Editor
# Go to database/schema.sql, copy all, paste in Supabase

# 5. Start development
npm run dev

# 6. Open http://localhost:3000
```

## 🔗 Key URLs

| Path | Purpose |
|------|---------|
| `/` | Home page |
| `/signup` | Create account |
| `/signin` | Login |
| `/dashboard` | User dashboard (protected) |
| `/appointments` | Book appointment (protected) |
| `/admin` | Admin panel (admin only) |

## 👤 Default Test Users

None - Create your own via signup page

### Make User Admin
```sql
UPDATE users SET role = 'admin' 
WHERE email = 'your@email.com';
```

## 💻 Common Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build           # Production build
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # Check TypeScript

# Database
# Run SQL file in Supabase console: database/schema.sql

# Install packages
npm install package-name

# Update packages
npm update

# Clean install
rm -rf node_modules package-lock.json && npm install
```

## 📁 File Locations Quick Map

| What | Where |
|------|-------|
| Pages | `app/[name]/page.tsx` |
| Components | `components/[section]/` |
| Utilities | `utils/[feature].ts` |
| Types | `types/` |
| Database queries | `app/api/appointments/actions.ts` |
| Styling | `app/globals.css` or inline classes |
| Environment vars | `.env.local` |
| Database schema | `database/schema.sql` |

## 🎨 Styling Quick Guide

```typescript
// Tailwind classes
className="bg-blue-500 dark:bg-blue-900 text-white px-4 py-2 rounded-lg"

// Dark mode
<div className="dark:bg-gray-800">Dark content</div>

// Responsive
<div className="md:grid-cols-2 lg:grid-cols-3">Responsive grid</div>

// Custom components
import { Button, Input, Card } from '@/components/ui'
```

## 🔐 Authentication Quick Reference

```typescript
// In client component
import { useAuth } from '@/hooks/useAuth'

const { user, loading, signOut } = useAuth()

// user: { id, email, name, role, ... }
// loading: boolean
// signOut: () => Promise<void>

// Sign in/up
import { supabase } from '@/lib/supabase'
await supabase.auth.signUp({ email, password })
await supabase.auth.signInWithPassword({ email, password })
await supabase.auth.signOut()
```

## 📅 Appointment Quick Reference

```typescript
// Book appointment
import { bookAppointment } from '@/app/api/appointments/actions'

const { data, error } = await bookAppointment(
  userId,
  "2024-01-15",  // date
  "10:30",       // time
  60,            // duration minutes
  "notes"        // optional
)

// Get user appointments
const { appointments } = useUserAppointments(userId)

// Cancel
import { cancelAppointment } from '@/app/api/appointments/actions'
await cancelAppointment(appointmentId, email, name, date, time)
```

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Module not found" | `npm install` and restart dev server |
| Page blank | Check browser console for errors |
| Can't login | Verify credentials in Supabase auth tab |
| No available slots | Check scheduling.ts working hours |
| Email not sending | Check SMTP config in .env.local |
| Dark mode not working | Clear cache and restart |
| Type errors | Run `npm run type-check` |

## 🚀 Deployment Steps

```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Go to Vercel.com → New Project
# 3. Select your GitHub repo
# 4. Add environment variables in Vercel dashboard
# 5. Click Deploy
```

## 📊 Data Models Quick View

```typescript
// User
{ id, email, name, role: 'user'|'staff'|'admin' }

// Appointment
{ 
  id, user_id, date: "2024-01-15", 
  time: "10:30", duration_minutes: 60,
  status: 'confirmed'|'cancelled'|'completed'|'no-show',
  notes: string
}

// TimeSlot
{ date, time, available: bool, duration_minutes }
```

## 🎯 Component Usage Examples

```typescript
// Button
<Button onClick={handler}>Click me</Button>
<Button variant="secondary" size="sm">Small</Button>
<Button variant="destructive">Delete</Button>

// Input
<Input label="Name" placeholder="John" error={error} />

// Card
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Buttons</CardFooter>
</Card>

// Alert
<Alert type="error" title="Error" message="Something failed" />

// Badge
<Badge variant="success">Confirmed</Badge>
```

## 📧 Email Configuration

### Gmail SMTP
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
```

### Gmail App Password
1. Enable 2FA
2. Generate App Password (16 chars)
3. Use as SMTP_PASSWORD

## 🔑 Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Optional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASSWORD=password
EMAIL_FROM=noreply@autobook.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎯 Feature Toggle Quick Guide

### Enable/Disable Email
```typescript
// In utils/email.ts, comment out sendEmail calls
// OR just don't configure SMTP in .env.local
// App will work without it (no emails sent)
```

### Change Working Hours
```typescript
// In utils/scheduling.ts
const WORKING_HOURS_START = 9;    // 9 AM
const WORKING_HOURS_END = 17;     // 5 PM
const SLOT_DURATION_MINUTES = 30; // 30 min
```

### Change Primary Color
```typescript
// In tailwind.config.js
// Change 'primary' color definitions
// Uses sky blue by default
```

## 📞 Need Help?

1. Check SETUP.md for detailed setup
2. See ARCHITECTURE.md for system design
3. Review API.md for complete API reference
4. Check PROJECT_SUMMARY.md for overview

## ✅ Verification Checklist

- [ ] `npm install` completed
- [ ] `.env.local` configured
- [ ] Supabase schema.sql executed
- [ ] `npm run dev` starts without errors
- [ ] http://localhost:3000 loads
- [ ] Can sign up with test email
- [ ] Can sign in
- [ ] Can book appointment
- [ ] Dashboard shows appointments
- [ ] Dark mode toggle works

## 🎉 You're Ready!

Start at http://localhost:3000 and explore!
