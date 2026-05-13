// Calendar component for displaying appointments
'use client';

import { useState } from 'react';
import { Appointment } from '@/types/database';
import { format, getDaysInMonth, startOfMonth } from 'date-fns';

interface CalendarProps {
  appointments: Appointment[];
  onDateSelect?: (date: string) => void;
}

export const AppointmentCalendar = ({ appointments, onDateSelect }: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const daysInMonth = getDaysInMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const appointmentDates = appointments.map((apt) => apt.date);

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-semibold text-gray-600 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells for days before month starts */}
        {Array(monthStart.getDay())
          .fill(null)
          .map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square"></div>
          ))}

        {/* Days of month */}
        {days.map((day) => {
          const dateStr = format(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day),
            'yyyy-MM-dd'
          );
          const hasAppointment = appointmentDates.includes(dateStr);

          return (
            <button
              key={day}
              onClick={() => onDateSelect?.(dateStr)}
              className={`aspect-square rounded-lg flex items-center justify-center font-medium transition-colors ${
                hasAppointment
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};
