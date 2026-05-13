'use server';

import { supabase } from '@/lib/supabase';
import { sendBookingConfirmation, sendCancellationNotification } from '@/utils/email';

export async function getAvailableSlots(date: string) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('time')
      .eq('date', date)
      .neq('status', 'cancelled');

    if (error) throw error;

    const booked = data.map((apt) => apt.time);
    return { booked, error: null };
  } catch (err) {
    return { booked: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function bookAppointment(
  userId: string,
  date: string,
  time: string,
  duration: number,
  notes?: string,
  userEmail?: string,
  userName?: string
) {
  try {
    // Check if slot is already booked
    const { data: existing } = await supabase
      .from('appointments')
      .select('id')
      .eq('date', date)
      .eq('time', time)
      .neq('status', 'cancelled');

    if (existing && existing.length > 0) {
      throw new Error('This time slot is already booked');
    }

    // Insert appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          user_id: userId,
          date,
          time,
          duration_minutes: duration,
          status: 'confirmed',
          notes,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Send confirmation email
    if (userEmail && userName) {
      try {
        await sendBookingConfirmation(userEmail, date, time, userName);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function cancelAppointment(appointmentId: string, userEmail?: string, userName?: string, date?: string, time?: string) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    // Send cancellation email
    if (userEmail && userName && date && time) {
      try {
        await sendCancellationNotification(userEmail, date, time, userName);
      } catch (emailError) {
        console.error('Failed to send cancellation email:', emailError);
      }
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string
) {
  try {
    // Check if new slot is available
    const { data: existing } = await supabase
      .from('appointments')
      .select('id')
      .eq('date', newDate)
      .eq('time', newTime)
      .neq('status', 'cancelled');

    if (existing && existing.length > 0) {
      throw new Error('This time slot is already booked');
    }

    // Update appointment
    const { data, error } = await supabase
      .from('appointments')
      .update({
        date: newDate,
        time: newTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getUserAppointments(userId: string) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getAdminAppointments() {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, user:users(*)')
      .order('date', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
