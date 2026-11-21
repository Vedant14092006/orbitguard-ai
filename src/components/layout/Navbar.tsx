import React, { useState, useEffect } from 'react';
import {
  Radio,
  Volume2,
  VolumeX,
  Search,
  Bell,
  Sun,
  ShieldAlert,
  Activity,
  Database,
  Terminal
} from 'lucide-react';
import { CURRENT_SPACE_WEATHER } from '../../data/mockWeather';
import { audioService } from '../../services/audioService';
import { OrbitGuardLogo } from '../common/OrbitGuardLogo';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenSpaceData?: () => void;
  onReplayBoot?: () => void;
  unreadNotificationsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenNotifications,
  onOpenSpaceData,
  onReplayBoot,
  unreadNotificationsCount
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [julianDate, setJulianDate] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(audioService.isMuted());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));

      // Calculate Julian Date
      const timeMs = now.getTime();
      const jd = timeMs / 86400000 + 2440587.5;
      setJulianDate(`JD ${jd.toFixed(4)}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAudioToggle = () => {
    const muted = audioService.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="h-16 border-b border-cyan-500/20 bg-slate-950/90 backdrop-blur-xl px-4 flex items-center justify-between sticky top-0 z-30 select-none shadow-[0_4px_25px_rgba(2,6,23,0.8)]">
      {/* Brand Logo & Mission Status */}
      <div className="flex items-center gap-3">
        <OrbitGuardLogo size="md" showText={true} />

        {/* DEFCON Orbit Alert Status */}
        <div className="hidden lg:flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-md bg-red-950/40 border border-red-500/40 text-red-400">
          <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
          <span className="text-[11px] font-mono font-bold tracking-wider">
            ORBITCON-2: ELEVATED CONJUNCTION RISK
          </span>
        </div>
      </div>

      {/* Center Mission Clocks & Space Weather */}
      <div className="hidden md:flex items-center gap-4 text-xs font-mono">
        {/* UTC Clock */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/70 border border-slate-800 text-slate-300 shadow-inner">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-100 font-semibold">{utcTime || 'CALCULATING...'}</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400/90 font-mono">{julianDate}</span>
        </div>

        {/* Space Weather Widget */}
        <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-md bg-slate-900/70 border border-slate-800 text-slate-400 shadow-inner">
          <div className="flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>SOLAR FLUX:</span>
            <span className="text-amber-300 font-semibold">{CURRENT_SPACE_WEATHER.solarFluxF107} sfu</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-orange-400" />
            <span>Kp-INDEX:</span>
            <span className="text-orange-400 font-bold">{CURRENT_SPACE_WEATHER.kpIndex}</span>
            <span className="text-[10px] px-1 rounded bg-orange-950/60 border border-orange-500/40 text-orange-300">
              {CURRENT_SPACE_WEATHER.geomagneticStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-2">
        {/* Replay Boot Sequence (System Initialization Diagnostics) */}
        {onReplayBoot && (
          <button
            onClick={onReplayBoot}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-colors text-xs font-mono"
            title="Replay System Boot Diagnostics"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Diagnostics</span>
          </button>
        )}

        {/* Data Pipeline Provenance Button */}
        <button
          onClick={onOpenSpaceData}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 transition-colors text-xs font-mono shadow-[0_0_12px_rgba(16,185,129,0.15)]"
          title="Space Data Provenance & Real-Time Pipeline"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            CELESTRAK SGP4
          </span>
        </button>

        {/* Global Quick Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-colors text-xs font-mono"
          title="Quick Jump (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Search Catalog...</span>
          <kbd className="hidden sm:inline text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-700 text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={handleAudioToggle}
          className={`p-2 rounded-md border transition-colors ${
            isMuted
              ? 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
              : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400 hover:bg-cyan-950/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
          }`}
          title={isMuted ? 'Telemetry Audio: Muted' : 'Telemetry Audio: Active'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-md bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-colors shadow-sm"
          title="Orbital Event Alerts"
        >
          <Bell className="w-4 h-4 text-cyan-400" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-mono font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.8)]">
              {unreadNotificationsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
