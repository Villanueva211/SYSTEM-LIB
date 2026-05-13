import { format } from 'date-fns';
import { Appointment } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';

interface AppointmentListProps {
  appointments: Appointment[];
  onCancel?: (id: string) => void;
  isLoading?: boolean;
}

const statusStyles: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  confirmed: 'success',
  completed: 'success',
  cancelled: 'error',
  'no-show': 'error',
};

export const AppointmentList = ({ appointments, onCancel, isLoading }: AppointmentListProps) => {
  if (isLoading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading appointments...</div>;
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        <p className="text-lg font-medium">No appointments found</p>
        <p className="text-sm">Book your first appointment to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((apt) => (
        <Card key={apt.id} className="p-4">
          <CardBody className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">
                  {format(new Date(apt.date), 'MMMM d, yyyy')} at {apt.time}
                </h3>
                <Badge variant={statusStyles[apt.status] || 'default'}>{apt.status}</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{apt.duration_minutes} minutes</p>
              {apt.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{apt.notes}</p>}
              {apt.user && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Client: {apt.user.name}</p>}
            </div>
            {onCancel && apt.status === 'confirmed' && (
              <button
                onClick={() => onCancel(apt.id)}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Cancel
              </button>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
};
