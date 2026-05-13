interface AlertProps {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  onClose?: () => void;
}

const alertStyles = {
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
};

export const Alert = ({ type, title, message, onClose }: AlertProps) => (
  <div className={`border rounded-lg p-4 ${alertStyles[type]}`}>
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-semibold">{title}</h3>
        {message && <p className="text-sm mt-1">{message}</p>}
      </div>
      {onClose && (
        <button onClick={onClose} className="text-lg font-bold">
          ×
        </button>
      )}
    </div>
  </div>
);
