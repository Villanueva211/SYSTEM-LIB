export const Badge = ({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}) => {
  const variantStyles = {
    default: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    success: 'bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200',
    warning: 'bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200',
    error: 'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200',
  };

  return <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${variantStyles[variant]}`}>{children}</span>;
};
