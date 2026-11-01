import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-lg transition select-none disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-accent-blue hover:bg-blue-600 text-white shadow-md shadow-accent-blue/20',
    secondary: 'bg-dark-700 hover:bg-dark-600 text-slate-200 border border-dark-600',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40',
    ghost: 'hover:bg-dark-700 text-slate-400 hover:text-slate-100',
    success: 'bg-accent-green/20 hover:bg-accent-green/30 text-accent-green border border-accent-green/40',
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-2 text-xs',
    lg: 'px-4 py-2.5 text-sm',
  };

  return (
    <button
      className={twMerge(clsx(base, variants[variant], sizes[size], className))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {children}
    </button>
  );
};
