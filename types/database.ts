export type UserRole = 'user' | 'staff' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  date: string;
  time: string;
  duration_minutes: number;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  notes?: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Availability {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
  duration_minutes: number;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  email_on_booking: boolean;
  email_on_reminder: boolean;
  email_on_cancellation: boolean;
  reminder_hours_before: number;
  created_at: string;
  updated_at: string;
}
