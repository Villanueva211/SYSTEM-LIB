# AutoBook - API Reference

## Authentication Endpoints

All requests must include authentication token from Supabase.

### Sign Up
```typescript
supabase.auth.signUp({
  email: string;
  password: string;
})
```

### Sign In
```typescript
supabase.auth.signInWithPassword({
  email: string;
  password: string;
})
```

### Sign Out
```typescript
supabase.auth.signOut()
```

## Database Operations

### Appointments - Book

**Function**: `bookAppointment()`

```typescript
await bookAppointment(
  userId: string,
  date: string,        // YYYY-MM-DD
  time: string,        // HH:MM
  duration: number,    // minutes
  notes?: string,
  userEmail?: string,
  userName?: string
)

Returns: { data: Appointment, error: string | null }
```

### Appointments - Cancel

**Function**: `cancelAppointment()`

```typescript
await cancelAppointment(
  appointmentId: string,
  userEmail?: string,
  userName?: string,
  date?: string,
  time?: string
)

Returns: { data: Appointment, error: string | null }
```

### Appointments - Reschedule

**Function**: `rescheduleAppointment()`

```typescript
await rescheduleAppointment(
  appointmentId: string,
  newDate: string,     // YYYY-MM-DD
  newTime: string      // HH:MM
)

Returns: { data: Appointment, error: string | null }
```

### Appointments - Get User's

**Function**: `getUserAppointments()`

```typescript
await getUserAppointments(userId: string)

Returns: { data: Appointment[], error: string | null }
```

### Appointments - Get All (Admin)

**Function**: `getAdminAppointments()`

```typescript
await getAdminAppointments()

Returns: { data: Appointment[], error: string | null }
```

### Available Slots

**Function**: `getAvailableSlots()`

```typescript
await getAvailableSlots(date: string)  // YYYY-MM-DD

Returns: { booked: string[], error: string | null }
```

## Scheduling Functions

### Generate Time Slots

**Function**: `generateTimeSlots()`

```typescript
generateTimeSlots(date: Date): TimeSlot[]

// Returns array of available slots for the day
// Default working hours: 9 AM - 5 PM
// Slot duration: 30 minutes
```

### Get Available Slots for Period

**Function**: `getAvailableSlotsForDays()`

```typescript
getAvailableSlotsForDays(
  days: number = 14,
  existingAppointments: Appointment[] = []
): TimeSlot[]

// Generates slots for next N days
// Skips weekends
// Excludes booked times
```

### Get Least Busy Day

**Function**: `getLeastBusyDay()`

```typescript
getLeastBusyDay(appointments: Appointment[]): string | null

// Returns date (YYYY-MM-DD) with least bookings
```

### Check Slot Availability

**Function**: `isSlotAvailable()`

```typescript
isSlotAvailable(
  date: string,
  time: string,
  appointments: Appointment[]
): boolean

// Returns true if slot is free
```

## Email Functions

### Send Booking Confirmation

**Function**: `sendBookingConfirmation()`

```typescript
await sendBookingConfirmation(
  email: string,
  appointmentDate: string,
  appointmentTime: string,
  userName: string
)

// Sends HTML email with appointment details
```

### Send Appointment Reminder

**Function**: `sendAppointmentReminder()`

```typescript
await sendAppointmentReminder(
  email: string,
  appointmentDate: string,
  appointmentTime: string,
  userName: string
)

// Sends 24-hour reminder email
```

### Send Cancellation Notification

**Function**: `sendCancellationNotification()`

```typescript
await sendCancellationNotification(
  email: string,
  appointmentDate: string,
  appointmentTime: string,
  userName: string
)

// Sends cancellation confirmation email
```

## Form Validation Schemas

### Sign Up Schema

```typescript
{
  email: string (valid email);
  password: string (min 8 chars);
  confirmPassword: string (matches password);
  name: string (min 2 chars);
  agreeToTerms: boolean (must be true);
}
```

### Sign In Schema

```typescript
{
  email: string (valid email);
  password: string (required);
}
```

### Appointment Schema

```typescript
{
  date: string (future date, YYYY-MM-DD);
  time: string (HH:MM format);
  duration_minutes: number (15-480);
  notes?: string;
}
```

## Type Definitions

### User Type

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'staff' | 'admin';
  created_at: string;
  updated_at: string;
}
```

### Appointment Type

```typescript
interface Appointment {
  id: string;
  user_id: string;
  date: string;           // YYYY-MM-DD
  time: string;           // HH:MM
  duration_minutes: number;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  notes?: string;
  created_at: string;
  updated_at: string;
  user?: User;            // Joined data
}
```

### TimeSlot Type

```typescript
interface TimeSlot {
  date: string;           // YYYY-MM-DD
  time: string;           // HH:MM
  available: boolean;
  duration_minutes: number;
}
```

## Hooks

### useAuth

```typescript
const { user, loading, signOut } = useAuth()

// Properties:
// - user: User | null (current authenticated user)
// - loading: boolean (auth state loading)
// - signOut(): Promise<void> (sign out function)
```

### useUserAppointments

```typescript
const { appointments, loading, error } = useUserAppointments(userId)

// Properties:
// - appointments: Appointment[] (user's appointments)
// - loading: boolean (data loading state)
// - error: string | null (error message)
```

## Components

### Button

```typescript
<Button 
  variant="default" | "secondary" | "outline" | "ghost" | "destructive"
  size="default" | "sm" | "lg" | "icon"
  disabled?: boolean
>
  Label
</Button>
```

### Input

```typescript
<Input 
  label?: string
  error?: string
  type?: string
  placeholder?: string
  {...props}
/>
```

### Card

```typescript
<Card>
  <CardHeader>Header Content</CardHeader>
  <CardBody>Body Content</CardBody>
  <CardFooter>Footer Content</CardFooter>
</Card>
```

### Alert

```typescript
<Alert 
  type="success" | "error" | "info" | "warning"
  title="Alert Title"
  message="Alert Message"
  onClose={() => {}}
/>
```

### Badge

```typescript
<Badge variant="default" | "success" | "warning" | "error">
  Label
</Badge>
```

## Environment Variables

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Email (Optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=email@example.com
SMTP_PASSWORD=password
EMAIL_FROM=noreply@autobook.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Error Handling

All functions follow consistent error handling:

```typescript
Returns: { data?: T, error?: string }

// Usage
const { data, error } = await bookAppointment(...)
if (error) {
  console.error(error)
  // Show user-friendly message
}
```

## Rate Limiting

Add rate limiting to prevent abuse:

```typescript
// Install: npm install next-rate-limit
import { RateLimit } from 'next-rate-limit'

const limit = new RateLimit({ interval: 60 * 1000, maxRequests: 10 })
```

## Pagination Example

```typescript
// For large appointment lists
const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .range(0, 9)  // Items 0-9
  .order('date', { ascending: false })
```

