import { addHours, startOfDay, endOfDay, format, addDays, isWeekend } from 'date-fns';
import { TimeSlot, Appointment } from '@/types/database';

const SLOT_DURATION_MINUTES = 30;
const WORKING_HOURS_START = 9;
const WORKING_HOURS_END = 17;
const APPOINTMENT_DURATION_MINUTES = 60;

/**
 * Generate available time slots for a given date
 */
export const generateTimeSlots = (date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const dayStart = startOfDay(date);

  for (let hour = WORKING_HOURS_START; hour < WORKING_HOURS_END; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_DURATION_MINUTES) {
      const slotTime = new Date(dayStart);
      slotTime.setHours(hour, minute);

      slots.push({
        date: format(date, 'yyyy-MM-dd'),
        time: format(slotTime, 'HH:mm'),
        available: true,
        duration_minutes: APPOINTMENT_DURATION_MINUTES,
      });
    }
  }

  return slots;
};

/**
 * Get available slots for the next N days
 */
export const getAvailableSlotsForDays = (
  days: number = 14,
  existingAppointments: Appointment[] = []
): TimeSlot[] => {
  const availableSlots: TimeSlot[] = [];
  const today = new Date();

  for (let i = 1; i <= days; i++) {
    const date = addDays(today, i);

    // Skip weekends
    if (isWeekend(date)) continue;

    const daySlots = generateTimeSlots(date);

    // Filter out booked slots
    const bookedTimes = existingAppointments
      .filter((apt) => apt.date === format(date, 'yyyy-MM-dd'))
      .map((apt) => apt.time);

    const availableDaySlots = daySlots.filter((slot) => !bookedTimes.includes(slot.time));
    availableSlots.push(...availableDaySlots);
  }

  return availableSlots;
};

/**
 * Find the least busy day in the next N days
 */
export const getLeastBusyDay = (appointments: Appointment[]): string | null => {
  const dayCounts: { [key: string]: number } = {};

  appointments.forEach((apt) => {
    dayCounts[apt.date] = (dayCounts[apt.date] || 0) + 1;
  });

  const allDays = getAvailableSlotsForDays(14).map((slot) => slot.date);
  const leastBusy = allDays.reduce((min, day) => {
    const count = dayCounts[day] || 0;
    const minCount = dayCounts[min] || 0;
    return count < minCount ? day : min;
  });

  return leastBusy || null;
};

/**
 * Check if a slot is available
 */
export const isSlotAvailable = (
  date: string,
  time: string,
  appointments: Appointment[]
): boolean => {
  return !appointments.some(
    (apt) => apt.date === date && apt.time === time && apt.status !== 'cancelled'
  );
};

/**
 * Get suggestions for best available times
 */
export const getSuggestedTimes = (
  appointments: Appointment[],
  limit: number = 5
): TimeSlot[] => {
  const availableSlots = getAvailableSlotsForDays(30, appointments);

  // Prioritize slots on less busy days
  const slots = availableSlots.sort((a, b) => {
    const countA = appointments.filter((apt) => apt.date === a.date).length;
    const countB = appointments.filter((apt) => apt.date === b.date).length;
    return countA - countB;
  });

  return slots.slice(0, limit);
};

/**
 * Get working hours for display
 */
export const getWorkingHoursString = (): string => {
  const start = `${String(WORKING_HOURS_START).padStart(2, '0')}:00`;
  const end = `${String(WORKING_HOURS_END).padStart(2, '0')}:00`;
  return `${start} - ${end}`;
};
