'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { appointmentSchema, AppointmentFormData } from '@/utils/validation';
import { getAvailableSlotsForDays } from '@/utils/scheduling';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import { Appointment, TimeSlot } from '@/types/database';
import toast from 'react-hot-toast';

interface BookingFormProps {
  userId: string;
  userName: string;
  userEmail: string;
}

export const BookingForm = ({ userId, userName, userEmail }: BookingFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  });

  const selectedDate = watch('date');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data, error: err } = await supabase
          .from('appointments')
          .select('*')
          .neq('status', 'cancelled');

        if (err) throw err;
        setAppointments(data || []);
        const slots = getAvailableSlotsForDays(30, data);
        setTimeSlots(slots);
      } catch (err) {
        console.error('Error fetching slots:', err);
      }
    };

    fetchAppointments();
  }, []);

  const availableTimesForDate = timeSlots.filter((slot) => slot.date === selectedDate);

  const onSubmit = async (data: AppointmentFormData) => {
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('appointments').insert([
        {
          user_id: userId,
          date: data.date,
          time: data.time,
          duration_minutes: data.duration_minutes,
          status: 'confirmed',
          notes: data.notes,
        },
      ]);

      if (insertError) throw insertError;

      // Email confirmation is handled server-side via API route
      fetch('/api/appointments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, date: data.date, time: data.time, name: userName }),
      }).catch(() => {}); // fire-and-forget, non-blocking

      toast.success('Appointment booked successfully!');
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to book appointment';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert type="error" title="Booking Failed" message={error} onClose={() => setError(null)} />}

      <Input {...register('date')} label="Appointment Date" type="date" error={errors.date?.message} />

      {selectedDate && availableTimesForDate.length > 0 ? (
        <Select {...register('time')} label="Time" error={errors.time?.message}>
          <option value="">Select a time</option>
          {availableTimesForDate.map((slot) => (
            <option key={`${slot.date}-${slot.time}`} value={slot.time}>
              {slot.time}
            </option>
          ))}
        </Select>
      ) : selectedDate ? (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200">
          No available slots for this date
        </div>
      ) : null}

      <Select
        {...register('duration_minutes', { valueAsNumber: true })}
        label="Duration"
        error={errors.duration_minutes?.message}
        options={[
          { value: '30', label: '30 minutes' },
          { value: '60', label: '1 hour' },
          { value: '90', label: '1.5 hours' },
          { value: '120', label: '2 hours' },
        ]}
      />

      <Textarea {...register('notes')} label="Additional Notes (optional)" placeholder="Any special requests or information..." />

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Booking...' : 'Book Appointment'}
      </Button>
    </form>
  );
};
