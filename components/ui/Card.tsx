import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, glow, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'glass transition-all duration-300',
        glow && 'hover:glow-border',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = 'Card';

export const CardHeader = ({ className, children, ...props }: CardProps) => (
  <div
    className={clsx('border-b border-white/06 px-6 py-5', className)}
    {...props}
  >
    {children}
  </div>
);

export const CardBody = ({ className, children, ...props }: CardProps) => (
  <div className={clsx('px-6 py-5', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }: CardProps) => (
  <div
    className={clsx('border-t border-white/06 px-6 py-4 flex justify-end gap-3', className)}
    {...props}
  >
    {children}
  </div>
);
