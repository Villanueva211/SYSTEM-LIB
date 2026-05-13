'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/types/database';

export const useUserAppointments = (userId?: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchAppointments = async () => {
      try {
        const { data, error: err } = await supabase
          .from('appointments')
          .select(`*, user:users(*)`)
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (err) throw err;
        setAppointments(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();

    // Subscribe to changes
    const subscription = supabase
      .from('appointments')
      .on('*', (payload) => {
        if (payload.new?.user_id === userId) {
          setAppointments((prev) => [payload.new as Appointment, ...prev]);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return { appointments, loading, error };
};
