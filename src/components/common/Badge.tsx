import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'cyan' | 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'slate';
  size?: 'xs' | 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'cyan',
  size = 'sm',
  pulse = false,
  className = ''
}) => {
  const variantStyles = {
    cyan: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10',
    blue: 'bg-blue-950/60 text-blue-300 border-blue-500/40 shadow-blue-500/10',
    emerald: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10',
    amber: 'bg-amber-950/60 text-amber-300 border-amber-500/40 shadow-amber-500/10',
    red: 'bg-red-950/60 text-red-300 border-red-500/40 shadow-red-500/20',
    purple: 'bg-purple-950/60 text-purple-300 border-purple-500/40 shadow-purple-500/10',
    slate: 'bg-slate-900/80 text-slate-300 border-slate-700/60'
  }[variant];

  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 tracking-wider',
    sm: 'text-xs px-2 py-0.5 tracking-wide',
    md: 'text-sm px-2.5 py-1'
  }[size];

  const dotColors = {
    cyan: 'bg-cyan-400',
    blue: 'bg-blue-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
    purple: 'bg-purple-400',
    slate: 'bg-slate-400'
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase font-semibold border rounded-sm backdrop-blur-sm shadow-sm ${variantStyles} ${sizeStyles} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors}`}></span>
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors}`}></span>
        </span>
      )}
      {label}
    </span>
  );
};
