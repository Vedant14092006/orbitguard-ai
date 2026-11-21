import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  accentColor?: 'cyan' | 'blue' | 'amber' | 'red' | 'emerald';
  badge?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'cyan',
  badge,
  onClick
}) => {
  const accentThemes = {
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.08)]',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      corner: 'border-cyan-400/60',
      text: 'text-cyan-400'
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.08)]',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      corner: 'border-blue-400/60',
      text: 'text-blue-400'
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.08)]',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      corner: 'border-amber-400/60',
      text: 'text-amber-400'
    },
    red: {
      border: 'border-red-500/30 hover:border-red-500/50',
      glow: 'shadow-[0_0_25px_rgba(239,68,68,0.15)] animate-pulse-subtle',
      iconBg: 'bg-red-500/10 text-red-400 border-red-500/30',
      corner: 'border-red-400/80',
      text: 'text-red-400'
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.08)]',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      corner: 'border-emerald-400/60',
      text: 'text-emerald-400'
    }
  }[accentColor];

  return (
    <div
      onClick={onClick}
      className={`relative group bg-slate-900/60 backdrop-blur-md rounded-md p-4 border ${accentThemes.border} ${accentThemes.glow} transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:bg-slate-900/80' : ''
      }`}
    >
      {/* Tactical HUD Corner Brackets */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${accentThemes.corner}`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${accentThemes.corner}`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${accentThemes.corner}`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${accentThemes.corner}`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400">
              {title}
            </span>
            {badge && (
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase ${accentThemes.iconBg}`}>
                {badge}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
            {value}
          </div>
        </div>
        <div className={`p-2.5 rounded-md border ${accentThemes.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
          {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`flex items-center gap-1 ${
                trend.isPositive ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              <span>{trend.value}</span>
              {trend.label && <span className="text-slate-500">{trend.label}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
