import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Info,
  Bell,
  CheckCheck,
  ChevronRight,
  Radio,
  Trash2,
  Zap,
  Target
} from 'lucide-react';
import { MOCK_EVENTS } from '../../data/mockEvents';
import { OrbitalEvent } from '../../types/orbit';
import { audioService } from '../../services/audioService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent?: (event: OrbitalEvent) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onSelectEvent
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [events, setEvents] = useState<OrbitalEvent[]>(MOCK_EVENTS);

  if (!isOpen) return null;

  const filteredEvents = events.filter((e) => {
    if (filter === 'ALL') return true;
    return e.severity === filter;
  });

  const handleClearAll = () => {
    audioService.playBlip();
    setEvents([]);
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    audioService.playBlip();
    setEvents((prev) => prev.filter((item) => item.id !== id));
  };

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse shrink-0" />;
      case 'HIGH':
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'border-red-500/40 bg-red-950/20 text-red-100 hover:border-red-500/70 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
      case 'HIGH':
      case 'WARNING':
        return 'border-amber-500/40 bg-amber-950/20 text-amber-100 hover:border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.1)]';
      default:
        return 'border-cyan-500/30 bg-cyan-950/20 text-cyan-100 hover:border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.1)]';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-slate-950/95 border-l border-cyan-500/30 backdrop-blur-2xl shadow-[0_0_50px_rgba(2,6,23,0.9)] flex flex-col font-mono select-none">
      {/* Tactical Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
        <div className="flex items-center gap-2.5">
          <div className="relative p-1.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <div>
            <h2 className="text-xs font-black tracking-wider text-slate-100 uppercase flex items-center gap-1.5">
              <span>ORBITAL EVENT FEED</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[9px]">
                {events.length} ACTIVE
              </span>
            </h2>
            <span className="text-[10px] text-slate-400">COMMAND & CONTROL DISPATCH</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Close Feed"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs & Quick Actions */}
      <div className="p-2.5 border-b border-slate-800 flex items-center justify-between text-[11px] bg-slate-900/40">
        <div className="flex gap-1">
          {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setFilter(tab);
                audioService.playBlip();
              }}
              className={`px-2.5 py-1 rounded transition-colors text-[10px] font-bold ${
                filter === tab
                  ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {events.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-slate-900"
            title="Clear all alerts"
          >
            <CheckCheck className="w-3 h-3" />
            <span>Dismiss All</span>
          </button>
        )}
      </div>

      {/* Event List Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredEvents.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500 flex flex-col items-center justify-center space-y-3">
            <Radio className="w-8 h-8 text-slate-700 animate-pulse" />
            <p>No orbital alerts matching selected tier.</p>
            <button
              onClick={() => setFilter('ALL')}
              className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px]"
            >
              Reset to ALL
            </button>
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              onClick={() => {
                audioService.playBlip();
                onSelectEvent?.(evt);
              }}
              className={`p-3.5 rounded-lg border text-xs transition-all cursor-pointer group relative overflow-hidden ${getSeverityStyle(
                evt.severity
              )}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 font-bold">
                  {getSeverityIcon(evt.severity)}
                  <span className="text-slate-100 group-hover:text-cyan-300 transition-colors">{evt.title}</span>
                </div>

                <button
                  onClick={(e) => handleDismiss(evt.id, e)}
                  className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Dismiss alert"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">{evt.description}</p>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-mono">{evt.timestamp}</span>
                <span className="text-cyan-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>DISPATCH TELEMETRY</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 text-[10px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          AUTO-REFRESH: 1 SEC
        </span>
        <span className="text-cyan-400/80">USSPACECOM 18TH SDS ACTIVE</span>
      </div>
    </div>
  );
};
