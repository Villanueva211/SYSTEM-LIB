import React from 'react';
import clsx from 'clsx';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

const variantStyles: Record<ButtonVariant, string> = {
  default:
    'text-white font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'text-slate-300 font-semibold transition-all duration-200 hover:text-white hover:bg-white/10',
  outline:
    'border border-white/10 text-slate-300 font-medium hover:bg-white/05 hover:border-indigo-500/50 hover:text-white transition-all duration-200',
  ghost:
    'text-slate-400 hover:text-white hover:bg-white/05 transition-all duration-200',
  destructive:
    'bg-red-500/80 hover:bg-red-500 text-white font-semibold transition-all duration-200 hover:-translate-y-0.5',
};

const variantBg: Record<ButtonVariant, string> = {
  default: '',
  secondary: 'bg-white/06',
  outline: '',
  ghost: '',
  destructive: '',
};

const sizeStyles: Record<ButtonSize, string> = {
  default: 'h-10 px-5 py-2 text-sm rounded-xl',
  sm:      'h-8 px-3 text-xs rounded-lg',
  lg:      'h-12 px-8 text-base rounded-xl',
  icon:    'h-10 w-10 rounded-xl',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', style, ...props }, ref) => {
    const isDefault = variant === 'default';
    return (
      <button
        className={clsx(
          'inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          variantStyles[variant],
          variantBg[variant],
          sizeStyles[size],
          className
        )}
        style={
          isDefault
            ? {
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                ...style,
              }
            : style
        }
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
