# Architecture & Code Documentation

## System Architecture

### Frontend Architecture (Next.js App Router)

```
┌─────────────────────────────────────────────┐
│           Browser / Client                  │
│  (React Components, Client Hooks)           │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         Next.js App Router                  │
│  (Middleware, Server Components, API)       │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│      Supabase Client / Server SDK           │
│  (Auth, Database, Realtime)                 │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         Supabase Backend                    │
│  (PostgreSQL, Auth, Storage)                │
└─────────────────────────────────────────────┘
```

### Component Hierarchy

```
RootLayout
├── Navbar
│   ├── ThemeToggle
│   └── Auth Status
├── Main Content (Dynamic)
│   ├── Home Page
│   ├── SignUp / SignIn Forms
│   ├── Dashboard
│   │   ├── Stats Cards
│   │   └── AppointmentList
│   ├── Appointments Booking
│   │   ├── BookingForm
│   │   ├── AppointmentCalendar
│   │   └── TimeSlotSelector
│   └── Admin Dashboard
│       ├── Analytics Chart
│       ├── Users Table
│       └── Appointments Manager
└── Footer
```

## Key Files & Their Responsibilities

### 1. Authentication & Authorization

**`lib/supabase.ts`**
- Initializes Supabase client and admin client
- Handles authentication context
- Manages session persistence

**`utils/auth.ts`**
- User creation and updates
- User fetching with error handling
- Email existence checks

**`hooks/useAuth.ts`**
- React hook for auth state management
- Listens to auth state changes
- Sign out functionality

### 2. Scheduling Logic

**`utils/scheduling.ts`**
- `generateTimeSlots()`: Creates available time slots for a date
- `getAvailableSlotsForDays()`: Generates slots for multiple days
- `getLeastBusyDay()`: Finds the least booked day
- `isSlotAvailable()`: Checks if a slot is free
- `getSuggestedTimes()`: Returns recommended slots

**Working Hours Configuration:**
```typescript
const WORKING_HOURS_START = 9;      // 9 AM
const WORKING_HOURS_END = 17;       // 5 PM
const SLOT_DURATION_MINUTES = 30;   // 30-minute slots
```

### 3. Form Validation

**`utils/validation.ts`**
- Zod schemas for all forms
- Email, password, appointment data validation
- Real-time error messages

**Schemas:**
- `signUpSchema`: Name, email, password, terms
- `signInSchema`: Email, password
- `appointmentSchema`: Date, time, duration, notes
- `updateProfileSchema`: User name

### 4. Email Notifications

**`utils/email.ts`**
- `sendBookingConfirmation()`: New appointment email
- `sendAppointmentReminder()`: 24-hour reminder
- `sendCancellationNotification()`: Cancellation alert
- Uses Nodemailer for SMTP

### 5. API Actions

**`app/api/appointments/actions.ts`**
- `bookAppointment()`: Create new appointment
- `cancelAppointment()`: Cancel booking
- `rescheduleAppointment()`: Move to new slot
- `getUserAppointments()`: Fetch user appointments
- `getAdminAppointments()`: Fetch all appointments

### 6. Database Schema

**Users Table**
```sql
users (
  id UUID (PK),
  email TEXT UNIQUE,
  name TEXT,
  role TEXT ('user' | 'staff' | 'admin'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Appointments Table**
```sql
appointments (
  id UUID (PK),
  user_id UUID (FK → users),
  date DATE,
  time TIME,
  duration_minutes INT,
  status TEXT ('confirmed' | 'cancelled' | 'completed' | 'no-show'),
  notes TEXT,
  UNIQUE (date, time)  -- Prevents double-booking
)
```

**Availability Table**
```sql
availability (
  id UUID (PK),
  date DATE,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN
)
```

**Notification Preferences Table**
```sql
notification_preferences (
  id UUID (PK),
  user_id UUID (FK → users UNIQUE),
  email_on_booking BOOLEAN,
  email_on_reminder BOOLEAN,
  email_on_cancellation BOOLEAN,
  reminder_hours_before INT
)
```

### 7. Row Level Security (RLS)

**Users**: Can read own, admins read all
**Appointments**: Users read own, admins read all, insert/update own
**Availability**: Everyone reads, admins manage
**Preferences**: Users manage own

## Data Flow Examples

### 1. Booking an Appointment

```
User clicks "Book" → BookingForm → validationSchema
→ bookAppointment() action → Check slot availability
→ Insert into appointments → Send confirmation email
→ Update local state → Show success toast
```

### 2. User Authentication

```
User signs up → signUpSchema validation → supabase.auth.signUp()
→ createUser() in database → Send verification email
→ User clicks link → Account verified
→ User can sign in → Auth state updates → Redirect to dashboard
```

### 3. Admin Analytics

```
Admin visits /admin → Fetch all appointments (server)
→ Calculate stats → Generate chart data
→ Recharts renders BarChart → Display trends
```

## State Management

### Global State
- **Auth**: Managed by Supabase SDK + custom hook
- **Theme**: Managed by next-themes
- **Notifications**: React Hot Toast

### Component State
- Form inputs: React Hook Form
- UI toggles: useState
- Loading states: useState

## Performance Optimizations

1. **Server Components**: Used by default in Next.js 14
2. **Server Actions**: Reduce client bundle size
3. **Code Splitting**: Automatic per-route
4. **Image Optimization**: Next.js Image component
5. **Database Indexes**: On `user_id`, `date`, `status`
6. **Caching**: Built-in Next.js caching

## Security Measures

1. **Authentication**: Supabase Auth with JWT
2. **Row Level Security**: Database level access control
3. **Environment Variables**: Sensitive data not exposed
4. **Input Validation**: Zod schemas on all inputs
5. **CORS**: Configured via Supabase
6. **SQL Injection**: Prevented by Supabase SDK

## Error Handling

**Strategy**: Try-catch with user-friendly messages

```typescript
try {
  // Action
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  toast.error(message);
  setError(message);
}
```

## Testing Recommendations

```bash
# Unit tests for utilities
npm install --save-dev jest @testing-library/react

# E2E tests
npm install --save-dev playwright
npm install --save-dev @playwright/test
```

### Test Files to Create
- `utils/__tests__/scheduling.test.ts`
- `utils/__tests__/validation.test.ts`
- `components/__tests__/BookingForm.test.tsx`
- `e2e/booking.spec.ts`

## Extending the Application

### Add Payment Integration
1. Install Stripe: `npm install stripe @stripe/react-js`
2. Create payment table in Supabase
3. Add checkout page
4. Update appointments schema with payment_id

### Add Video Calls
1. Install Zoom SDK or similar
2. Generate meeting link on appointment confirmation
3. Store meeting URL in appointments table
4. Display link in dashboard

### Add SMS Notifications
1. Install Twilio: `npm install twilio`
2. Add phone number field to users table
3. Send SMS in addition to email

### Add Multi-language Support
1. Install i18next: `npm install i18next react-i18next`
2. Create translation files
3. Wrap app with I18nextProvider
4. Use useTranslation hook in components

## Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Database backups configured in Supabase
- [ ] Email service verified
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Database indexes created
- [ ] Monitoring/logging setup
- [ ] Error tracking (e.g., Sentry)
- [ ] Analytics enabled
- [ ] Rate limiting configured

## Common Issues & Solutions

### Issue: "RLS policy violation"
**Solution**: Check Supabase RLS policies, ensure user is authenticated

### Issue: "Slot already booked"
**Solution**: Add unique constraint on (date, time) in database

### Issue: "Email not sending in production"
**Solution**: Verify SMTP credentials, check spam folder, enable less secure apps

### Issue: "Dark mode not working"
**Solution**: Ensure next-themes provider wraps entire app, clear cache

