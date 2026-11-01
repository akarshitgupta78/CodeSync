import React from 'react';

interface LoaderProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Loader: React.FC<LoaderProps> = ({ label = 'Loading...', size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-slate-400">
      <div className={`${sizes[size]} border-accent-blue border-t-transparent rounded-full animate-spin`} />
      {label && <span className="text-xs font-medium">{label}</span>}
    </div>
  );
};
