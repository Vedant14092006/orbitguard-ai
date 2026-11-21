import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  ArrowRight,
  Sparkles,
  Compass,
  CheckCircle2,
  Clock,
  Radio,
  Zap,
  Target
} from 'lucide-react';
import { MOCK_CONJUNCTIONS } from '../../data/mockConjunctions';
import { audioService } from '../../services/audioService';

interface CollisionWarningHeroProps {
  onNavigateToCollision: (eventId?: string) => void;
  onNavigateToSatellite: (satId?: string) => void;
  onNavigateToAssistant: (prompt?: string) => void;
  onTrack3D?: (objectId?: string) => void;
}

export const CollisionWarningHero: React.FC<CollisionWarningHeroProps> = ({
  onNavigateToCollision,
  onNavigateToSatellite,
  onNavigateToAssistant,
  onTrack3D
}) => {
  const criticalEvent = MOCK_CONJUNCTIONS[0]; // Starlink-5120 vs Cosmos-2251 Debris
  const [secondsRemaining, setSecondsRemaining] = useState<number>(criticalEvent.tcaSeconds);
  const [maneuverPlanned, setManeuverPlanned] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `T - ${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleExecuteManeuver = () => {
    audioService.playSuccess();
    setManeuverPlanned(true);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-red-500/40 bg-gradient-to-r from-red-950/40 via-slate-900/90 to-slate-950/90 p-5 backdrop-blur-xl shadow-[0_0_35px_rgba(239,68,68,0.15)] font-mono select-none">
      {/* Background Warning Radar Pulse */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-red-500/10 blur-2xl pointer-events-none" />

      {/* Top Header / DEFCON Alert Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-500/30 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-red-950 border border-red-500/60 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-red-300 uppercase">
                EMERGENCY CONJUNCTION ALERT // CARA CRITICAL THRESHOLD
              </span>
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/50 text-[10px] font-bold animate-pulse">
                ORBITCON-1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Event ID: <strong className="text-slate-200">{criticalEvent.id}</strong> &bull; NASA CARA / USSPACECOM 18th SDS CDM
            </p>
          </div>
        </div>

        {/* Dynamic TCA Countdown Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-950 border border-red-500/50 shadow-inner">
          <Clock className="w-4 h-4 text-red-400 animate-pulse" />
          <div className="text-right">
            <span className="text-[9px] text-slate-500 block leading-none">TIME TO CLOSEST APPROACH</span>
            <span className="text-xs font-black text-red-400 font-mono tracking-wider">
              {formatCountdown(secondsRemaining)}
            </span>
          </div>
        </div>
      </div>

      {/* Encounter Geometry & Object Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 my-4 items-center">
        {/* Left: Primary Asset */}
        <div className="lg:col-span-4 p-3.5 rounded-lg bg-slate-950/80 border border-cyan-500/30 hover:border-cyan-500/60 transition-colors">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="uppercase tracking-wider text-cyan-400 font-bold">PRIMARY ASSET (ACTIVE)</span>
            <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
              PROPULSION READY
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>{criticalEvent.targetObject.name}</span>
            <span className="text-[10px] font-mono text-cyan-400">NORAD #{criticalEvent.targetObject.noradId}</span>
          </h3>
          <div className="mt-2 text-[11px] text-slate-400 grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800">
            <div>
              <span className="text-[9px] text-slate-500 block">ALTITUDE</span>
              <strong className="text-slate-200">{criticalEvent.targetObject.altitude} km</strong>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block">OPERATOR</span>
              <strong className="text-slate-200 truncate block">{criticalEvent.targetObject.operator}</strong>
            </div>
          </div>
        </div>

        {/* Center: Conjunction Encounter Telemetry Gauges */}
        <div className="lg:col-span-4 p-3.5 rounded-lg bg-slate-950/90 border border-red-500/30 flex flex-col items-center justify-center text-center space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold">
            <Target className="w-4 h-4 animate-spin-slow" />
            <span>HYPERVELOCITY INTERSECT</span>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full text-center">
            {/* Miss Distance */}
            <div className="p-1.5 rounded bg-slate-900 border border-red-500/40">
              <span className="text-[9px] text-slate-400 block uppercase">Miss Dist</span>
              <strong className="text-red-400 text-xs font-bold font-mono">
                {Math.round(criticalEvent.missDistanceKm * 1000)} m
              </strong>
            </div>

            {/* Collision Probability */}
            <div className="p-1.5 rounded bg-slate-900 border border-red-500/40">
              <span className="text-[9px] text-slate-400 block uppercase">Prob ($P_c$)</span>
              <strong className="text-red-400 text-xs font-bold font-mono">
                {criticalEvent.collisionProbability.toExponential(2)}
              </strong>
            </div>

            {/* Relative Velocity */}
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-[9px] text-slate-400 block uppercase">Rel. Vel</span>
              <strong className="text-amber-400 text-xs font-bold font-mono">
                {criticalEvent.relativeVelocityKmS} km/s
              </strong>
            </div>
          </div>

          {/* Linear Danger Bar: Miss Distance Safety Margin */}
          <div className="w-full space-y-1">
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>0 m (IMPACT)</span>
              <span className="text-red-400 font-bold">140 m</span>
              <span>1,000 m (SAFE)</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-emerald-500 w-[14%]" />
            </div>
          </div>
        </div>

        {/* Right: Secondary Chaser Object */}
        <div className="lg:col-span-4 p-3.5 rounded-lg bg-slate-950/80 border border-red-500/30 hover:border-red-500/60 transition-colors">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="uppercase tracking-wider text-red-400 font-bold">SECONDARY CHASER (DEBRIS)</span>
            <span className="px-1.5 py-0.2 rounded bg-red-950 border border-red-500/40 text-red-300">
              NON-MANEUVERABLE
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>{criticalEvent.chaserObject.name}</span>
            <span className="text-[10px] font-mono text-red-400">NORAD #{criticalEvent.chaserObject.noradId}</span>
          </h3>
          <div className="mt-2 text-[11px] text-slate-400 grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800">
            <div>
              <span className="text-[9px] text-slate-500 block">TYPE</span>
              <strong className="text-slate-200">FRAGMENTATION</strong>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block">KESSLER RISK</span>
              <strong className="text-red-400">94 / 100</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Maneuver Impact & Immediate Action Controls */}
      <div className="pt-3 border-t border-red-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          {maneuverPlanned ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>AVOIDANCE BURN SIMULATED &bull; MISS DISTANCE EXPANDED TO 4.2 KM</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-300 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Recommended: +0.18 m/s Prograde Thruster Burn (TCA - 45 mins)</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!maneuverPlanned && (
            <button
              onClick={handleExecuteManeuver}
              className="px-3 py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate Burn</span>
            </button>
          )}

          <button
            onClick={() => onTrack3D?.(criticalEvent.targetObject.id)}
            className="px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Track 3D</span>
          </button>

          <button
            onClick={() => onNavigateToCollision(criticalEvent.id)}
            className="px-3.5 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
          >
            <span>Full CDM Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() =>
              onNavigateToAssistant?.(
                `Brief the flight dynamics team on critical conjunction ${criticalEvent.id} between ${criticalEvent.targetObject.name} and ${criticalEvent.chaserObject.name}. Include recommended Delta-V maneuver vector and post-burn clearance.`
              )
            }
            className="px-3 py-1.5 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask ASTRA AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
