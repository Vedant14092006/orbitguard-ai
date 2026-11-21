import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { MOCK_CONJUNCTIONS } from '../data/mockConjunctions';
import { MOCK_SATELLITES } from '../data/mockSatellites';
import { MOCK_DEBRIS } from '../data/mockDebris';
import { ConjunctionEvent, OrbitalObject, RiskLevel, ManeuverOption } from '../types/orbit';
import {
  calculateAvoidanceManeuver,
  AvoidanceManeuverResult,
  getRiskCategoryBadge,
  screenArbitraryPair,
  generateDistanceProfile
} from '../services/conjunctionService';
import { audioService } from '../services/audioService';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  Zap,
  CheckCircle2,
  Flame,
  Activity,
  ArrowRight,
  Info,
  Sparkles,
  Search,
  Target,
  Sliders,
  Crosshair,
  BarChart3,
  Orbit,
  Compass,
  Cpu
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

interface CollisionRiskPageProps {
  initialEventId?: string | null;
  onNavigateToSatellite?: (satId: string) => void;
  onNavigateToTracker?: (objId: string) => void;
  onNavigateToAssistant?: (prompt?: string) => void;
}

export const CollisionRiskPage: React.FC<CollisionRiskPageProps> = ({
  initialEventId,
  onNavigateToSatellite,
  onNavigateToTracker,
  onNavigateToAssistant
}) => {
  const [conjunctions, setConjunctions] = useState<ConjunctionEvent[]>(MOCK_CONJUNCTIONS);
  const [selectedEventId, setSelectedEventId] = useState<string>(MOCK_CONJUNCTIONS[0].id);

  // Sync initialEventId when navigating from notification or other modules
  useEffect(() => {
    if (initialEventId) {
      const directMatch = conjunctions.find((c) => c.id === initialEventId);
      if (directMatch) {
        setSelectedEventId(directMatch.id);
      } else {
        const satMatch = conjunctions.find(
          (c) => c.targetObject.id === initialEventId || c.chaserObject.id === initialEventId
        );
        if (satMatch) {
          setSelectedEventId(satMatch.id);
        }
      }
    }
  }, [initialEventId, conjunctions]);
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');
  const [burnType, setBurnType] = useState<'PROGRADE' | 'RETROGRADE' | 'RADIAL_IN' | 'RADIAL_OUT' | 'CROSS_TRACK'>('RETROGRADE');
  const [deltaV, setDeltaV] = useState<number>(0.45);
  const [maneuverResult, setManeuverResult] = useState<AvoidanceManeuverResult | null>(null);

  // Custom Pair Screener state
  const [isScreenerOpen, setIsScreenerOpen] = useState<boolean>(false);
  const [screenerSatId, setScreenerSatId] = useState<string>(MOCK_SATELLITES[0].id);
  const [screenerDebId, setScreenerDebId] = useState<string>(MOCK_DEBRIS[0].id);

  const selectedEvent = useMemo(() => {
    return conjunctions.find((c) => c.id === selectedEventId) || conjunctions[0];
  }, [conjunctions, selectedEventId]);

  // Recalculate maneuver whenever parameters change
  useEffect(() => {
    if (selectedEvent) {
      const res = calculateAvoidanceManeuver(selectedEvent, deltaV, burnType);
      setManeuverResult(res);
    }
  }, [selectedEvent, deltaV, burnType]);

  // Filtered list
  const filteredConjunctions = useMemo(() => {
    if (riskFilter === 'ALL') return conjunctions;
    return conjunctions.filter((c) => {
      if (riskFilter === 'MODERATE') return c.riskLevel === 'MODERATE' || c.riskLevel === 'ELEVATED';
      if (riskFilter === 'LOW') return c.riskLevel === 'LOW' || c.riskLevel === 'NOMINAL';
      return c.riskLevel === riskFilter;
    });
  }, [conjunctions, riskFilter]);

  const handleExecuteBurn = () => {
    if (!maneuverResult) return;

    audioService.playSuccess();
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 }
    });

    // Update conjunction state to resolved
    setConjunctions((prev) =>
      prev.map((item) => {
        if (item.id === selectedEvent.id) {
          return {
            ...item,
            riskLevel: 'LOW',
            missDistanceKm: maneuverResult.newMissDistanceKm,
            collisionProbability: maneuverResult.newCollisionProb,
            maneuverExecuted: true,
            maneuverDetails: maneuverResult,
            distanceProfile: generateDistanceProfile({
              ...item,
              missDistanceKm: maneuverResult.newMissDistanceKm
            })
          };
        }
        return item;
      })
    );
  };

  const handleApplyPresetManeuver = (opt: ManeuverOption) => {
    setBurnType(opt.type);
    setDeltaV(opt.deltaV);
    audioService.playBlip();
  };

  const handleRunCustomScreen = () => {
    const sat = MOCK_SATELLITES.find((s) => s.id === screenerSatId) || MOCK_SATELLITES[0];
    const deb = MOCK_DEBRIS.find((d) => d.id === screenerDebId) || MOCK_DEBRIS[0];
    const newEvent = screenArbitraryPair(sat, deb);

    audioService.playSuccess();
    setConjunctions((prev) => [newEvent, ...prev]);
    setSelectedEventId(newEvent.id);
    setIsScreenerOpen(false);
  };

  const riskBadge = getRiskCategoryBadge(selectedEvent.riskLevel);
  const profileData = selectedEvent.distanceProfile || generateDistanceProfile(selectedEvent);

  // Formatting helper for countdown
  const formatTcaCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 font-mono pb-16">
      {/* Top Mission Control Header */}
      <div className="rounded-xl border border-red-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-red-950/80 text-red-400 border border-red-500/40 animate-pulse">
                ORBITAL CONJUNCTION ASSESSMENT CENTER
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-cyan-950/80 text-cyan-400 border border-cyan-500/40">
                CARA SCREENING THRESHOLD: Pc &gt; 1.0e-4
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 border border-slate-800 bg-slate-900/80">
                ACTIVE CDMs: {conjunctions.length}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-100 tracking-wider uppercase flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-red-400" />
              Collision Risk Analyzer & Maneuver Planner
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Real-time screening of close approaches between operational spacecraft and orbital debris. Calculates relative velocities, closest approach distances (TCA), and Foster 2D collision probability ($P_c$) over B-plane covariance ellipsoids.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsScreenerOpen(true);
                audioService.playBlip();
              }}
              className="px-3.5 py-2.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 text-xs font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              <Target className="w-4 h-4 text-cyan-400" />
              <span>Screen Custom Object Pair</span>
            </button>
          </div>
        </div>

        {/* Mandatory Aerospace Simulation Disclaimer Banner */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-start gap-2.5 text-[11px] text-amber-300/90 bg-amber-950/20 px-3.5 py-2.5 rounded-lg border border-amber-500/30">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <strong className="text-amber-300 uppercase tracking-wide">
              Astrodynamics Advisory & Operational Simulation Notice:
            </strong>{' '}
            Close approach distances and collision probabilities ($P_c$) displayed herein are generated via numerical Keplerian propagation and representative 1-sigma covariance models for mission simulation and flight education. Real-world satellite avoidance maneuvers require validated high-precision ephemerides from 18 SDS, GPS telemetry, solar flux drag models, and formal flight director review.
          </div>
        </div>
      </div>

      {/* Main 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Timeline of Predicted Close Approaches */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Predicted Close Approaches ({filteredConjunctions.length})
              </h2>
            </div>

            {/* Risk Category Filters */}
            <div className="flex items-center gap-1 text-[10px]">
              {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setRiskFilter(cat);
                    audioService.playBlip();
                  }}
                  className={`px-2 py-1 rounded transition-all font-bold ${
                    riskFilter === cat
                      ? 'bg-slate-700 text-cyan-300 border border-cyan-500/50'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* CDM Cards Feed */}
          <div className="space-y-2.5 max-h-[820px] overflow-y-auto pr-1">
            {filteredConjunctions.length === 0 ? (
              <div className="p-8 text-center rounded-lg border border-slate-800 bg-slate-950/60 text-xs text-slate-500 font-mono space-y-2">
                <ShieldAlert className="w-6 h-6 text-slate-600 mx-auto" />
                <p>No conjunctions found for the &quot;{riskFilter}&quot; severity tier.</p>
                <button
                  onClick={() => setRiskFilter('ALL')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                >
                  Reset Filter to ALL
                </button>
              </div>
            ) : (
              filteredConjunctions.map((cdm) => {
              const isSelected = cdm.id === selectedEvent.id;
              const badge = getRiskCategoryBadge(cdm.riskLevel);
              const missFormatted =
                cdm.missDistanceKm < 1
                  ? `${Math.round(cdm.missDistanceKm * 1000)} m`
                  : `${cdm.missDistanceKm.toFixed(2)} km`;

              return (
                <div
                  key={cdm.id}
                  onClick={() => {
                    setSelectedEventId(cdm.id);
                    audioService.playBlip();
                  }}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-500/70 bg-slate-900/90 shadow-[0_0_20px_rgba(6,182,212,0.18)] ring-1 ring-cyan-500/30'
                      : 'border-slate-800/80 hover:border-slate-700 bg-slate-950/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                        <span className="text-cyan-300">{cdm.targetObject.name}</span>
                        <span className="text-slate-500 text-[10px]">VS</span>
                        <span className="text-red-400">{cdm.chaserObject.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>ID: {cdm.id}</span>
                        <span>&bull;</span>
                        <span>v_rel: {cdm.relativeVelocityKmS} km/s</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.badgeClass}`}>
                        {cdm.maneuverExecuted ? 'RESOLVED' : badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-[9px] text-slate-500 block uppercase">Miss Dist</span>
                      <strong className={cdm.missDistanceKm < 0.5 ? 'text-red-400 font-bold' : 'text-slate-200'}>
                        {missFormatted}
                      </strong>
                    </div>

                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-[9px] text-slate-500 block uppercase">Prob ($P_c$)</span>
                      <strong className={cdm.collisionProbability >= 1e-4 ? 'text-red-400 font-bold' : 'text-slate-200'}>
                        {cdm.collisionProbability.toExponential(2)}
                      </strong>
                    </div>

                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-[9px] text-slate-500 block uppercase">TCA Countdown</span>
                      <strong className="text-amber-400 font-bold font-mono">
                        T - {formatTcaCountdown(cdm.tcaSeconds)}
                      </strong>
                    </div>
                  </div>

                  {cdm.maneuverExecuted && (
                    <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>AVOIDANCE MANEUVER EXECUTED &bull; CLEARANCE ASSURED</span>
                    </div>
                  )}
                </div>
              );
            }))}
          </div>
        </div>

        {/* Right Column (7 Cols): Comprehensive Conjunction Assessment Center */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Visual Risk Gauges & Metrics Panel */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-cyan-400" />
                <div>
                  <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                    Conjunction Telemetry & Risk Gauges
                  </h2>
                  <span className="text-[10px] text-slate-400">
                    EVENT ID: <strong className="text-cyan-400">{selectedEvent.id}</strong> &bull; TCA:{' '}
                    {new Date(selectedEvent.tca).toLocaleTimeString()} UTC
                  </span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-bold border ${riskBadge.badgeClass}`}>
                STATUS: {riskBadge.label} RISK
              </span>
            </div>

            {/* Gauges Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Risk Level Category Gauge */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    Risk Category Gauge
                  </span>
                  <span className={`font-bold ${riskBadge.textClass}`}>{riskBadge.label}</span>
                </div>

                {/* 4-Tier Segmented Gauge */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[
                    { label: 'LOW', color: 'bg-emerald-500', text: 'text-emerald-400', active: selectedEvent.riskLevel === 'LOW' || selectedEvent.riskLevel === 'NOMINAL' },
                    { label: 'MODERATE', color: 'bg-yellow-500', text: 'text-yellow-400', active: selectedEvent.riskLevel === 'MODERATE' || selectedEvent.riskLevel === 'ELEVATED' },
                    { label: 'HIGH', color: 'bg-orange-500', text: 'text-orange-400', active: selectedEvent.riskLevel === 'HIGH' },
                    { label: 'CRITICAL', color: 'bg-red-500', text: 'text-red-400', active: selectedEvent.riskLevel === 'CRITICAL' }
                  ].map((tier) => (
                    <div
                      key={tier.label}
                      className={`p-2 rounded text-center transition-all border ${
                        tier.active
                          ? `${tier.color} text-slate-950 font-black shadow-[0_0_12px_rgba(255,255,255,0.2)] border-white/50 scale-[1.02]`
                          : 'bg-slate-900/60 border-slate-800 text-slate-500 font-bold opacity-40'
                      }`}
                    >
                      <div className="text-[10px] uppercase">{tier.label}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[9px] text-slate-500 flex justify-between">
                  <span>Pc &lt; 1e-6</span>
                  <span>1e-6 to 1e-5</span>
                  <span>1e-5 to 1e-4</span>
                  <span>Pc &ge; 1e-4</span>
                </div>
              </div>

              {/* Collision Probability (Pc) Logarithmic Meter */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Collision Probability ($P_c$)
                  </span>
                  <span className={`font-mono font-bold ${selectedEvent.collisionProbability >= 1e-4 ? 'text-red-400' : 'text-slate-200'}`}>
                    {selectedEvent.collisionProbability.toExponential(2)}
                  </span>
                </div>

                {/* Logarithmic Scale Progress Bar */}
                {(() => {
                  // Map log10(Pc) from -8 to -1 into 0% to 100%
                  const logPc = Math.log10(Math.max(1e-8, Math.min(0.1, selectedEvent.collisionProbability)));
                  const pct = Math.min(100, Math.max(0, ((logPc - (-8)) / 7) * 100));
                  return (
                    <div className="space-y-1">
                      <div className="h-3 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden relative">
                        {/* Actionable threshold marker at 1e-4 (log = -4 -> (4/7)*100 = 57.14%) */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10 shadow-[0_0_8px_rgba(239,68,68,1)]"
                          style={{ left: '57.14%' }}
                          title="CARA Action Threshold 1.0e-4"
                        />
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            selectedEvent.collisionProbability >= 1e-4
                              ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500'
                              : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                        <span>1e-8 (Safe)</span>
                        <span className="text-red-400">CARA Threshold: 1e-4</span>
                        <span>1e-1 (Imminent)</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Vector Breakdown (Radial, In-track, Cross-track, Rel Velocity) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Radial Miss ($\Delta R$)</span>
                <strong className="text-slate-100 text-sm">
                  {Math.round(selectedEvent.radialDistanceKm * 1000)} m
                </strong>
                <span className="text-[9px] text-slate-500 block">Altitude clearance</span>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">In-Track Miss ($\Delta T$)</span>
                <strong className="text-slate-100 text-sm">
                  {Math.round(selectedEvent.inTrackDistanceKm * 1000)} m
                </strong>
                <span className="text-[9px] text-slate-500 block">Phasing separation</span>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Cross-Track ($\Delta N$)</span>
                <strong className="text-slate-100 text-sm">
                  {Math.round(selectedEvent.crossTrackDistanceKm * 1000)} m
                </strong>
                <span className="text-[9px] text-slate-500 block">Plane displacement</span>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Relative Velocity</span>
                <strong className="text-red-400 text-sm font-bold">
                  {selectedEvent.relativeVelocityKmS} km/s
                </strong>
                <span className="text-[9px] text-slate-500 block">
                  ~{(selectedEvent.relativeVelocityKmS * 3600).toLocaleString()} km/h
                </span>
              </div>
            </div>
          </div>

          {/* 2. Dual Objects Involved in Event */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Orbit className="w-4 h-4 text-cyan-400" />
              Objects Involved in Conjunction
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Primary Object */}
              <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase">Primary Asset (Target)</span>
                  <Badge label={`NORAD #${selectedEvent.targetObject.noradId}`} variant="cyan" />
                </div>
                <div className="text-sm font-bold text-slate-100">{selectedEvent.targetObject.name}</div>
                <div className="text-[10px] text-slate-400 space-y-0.5">
                  <div>Operator: <strong className="text-slate-300">{selectedEvent.targetObject.operator}</strong></div>
                  <div>Altitude: <strong className="text-slate-300">{selectedEvent.targetObject.altitude} km</strong> &bull; Velocity: <strong className="text-slate-300">{selectedEvent.targetObject.velocity} km/s</strong></div>
                  <div>Hard-Body Radius: <strong className="text-cyan-300">{selectedEvent.targetObject.rcsSize === 'LARGE' ? '28.0 m' : '1.8 m'}</strong></div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onNavigateToSatellite?.(selectedEvent.targetObject.id)}
                    className="flex-1 py-1 px-2 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Target className="w-3 h-3" />
                    <span>Satellite Profile</span>
                  </button>
                  <button
                    onClick={() => onNavigateToTracker?.(selectedEvent.targetObject.id)}
                    className="py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] transition-colors flex items-center justify-center gap-1"
                    title="View in 3D Orbit Tracker"
                  >
                    <Compass className="w-3 h-3 text-cyan-400" />
                    <span>3D</span>
                  </button>
                </div>
              </div>

              {/* Secondary Object */}
              <div className="p-3 rounded-lg bg-slate-950 border border-red-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-red-400 uppercase">Secondary Object (Chaser)</span>
                  <Badge label={`NORAD #${selectedEvent.chaserObject.noradId}`} variant="red" />
                </div>
                <div className="text-sm font-bold text-slate-100">{selectedEvent.chaserObject.name}</div>
                <div className="text-[10px] text-slate-400 space-y-0.5">
                  <div>Classification: <strong className="text-slate-300">{selectedEvent.chaserObject.type}</strong> ({selectedEvent.chaserObject.rcsSize})</div>
                  <div>Altitude: <strong className="text-slate-300">{selectedEvent.chaserObject.altitude} km</strong> &bull; Velocity: <strong className="text-slate-300">{selectedEvent.chaserObject.velocity} km/s</strong></div>
                  <div>Estimated RCS: <strong className="text-red-300">{selectedEvent.chaserObject.rcs} m²</strong> &bull; Tumbling: <strong className="text-amber-400">Yes</strong></div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onNavigateToTracker?.(selectedEvent.chaserObject.id)}
                    className="w-full py-1 px-2 rounded bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Compass className="w-3 h-3" />
                    <span>Track Debris in 3D</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Distance Profile Chart Over Time ($d(t)$ vs TCA) */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Hyperbolic Distance Profile Around Closest Approach ($d(t)$)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                CLOSEST: <strong className="text-cyan-400">{selectedEvent.missDistanceKm < 1 ? `${Math.round(selectedEvent.missDistanceKm * 1000)}m` : `${selectedEvent.missDistanceKm}km`}</strong> at T = 0
              </span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profileData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="timeOffsetMin"
                    stroke="#64748b"
                    fontSize={10}
                    tickFormatter={(v) => `${v > 0 ? `+${v}` : v}m`}
                  />
                  <YAxis stroke="#64748b" fontSize={10} unit="km" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#1e293b',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}
                    formatter={(val: any) => [`${val} km`, 'Relative Distance']}
                    labelFormatter={(lbl) => `T ${Number(lbl) >= 0 ? `+${lbl}` : lbl} minutes from TCA`}
                  />
                  <ReferenceLine x={0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'TCA', fill: '#ef4444', fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="distanceKm"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#distGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-slate-500 text-center font-mono">
              Encounter duration inside 50 km boundary is approximately ~12 seconds due to {selectedEvent.relativeVelocityKmS} km/s relative speed.
            </div>
          </div>

          {/* 4. AI-Generated Risk Assessment (ASTRA Copilot) */}
          <div className="p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/20 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  ASTRA AI Flight Director Risk Assessment
                </h3>
              </div>
              <Badge label="AUTOMATED SATELLITE COPILOT" variant="cyan" />
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <div className="font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>{selectedEvent.aiAssessment?.headline}</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                {selectedEvent.aiAssessment?.executiveSummary}
              </p>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-[11px] space-y-1">
                <span className="text-[10px] font-bold text-amber-400 block uppercase">
                  Technical Encounter Geometry:
                </span>
                <p className="text-slate-400">
                  {selectedEvent.aiAssessment?.geometryExplanation}
                </p>
              </div>
              <div className="p-2.5 rounded bg-cyan-950/30 border border-cyan-500/20 text-[11px] space-y-1">
                <span className="text-[10px] font-bold text-cyan-400 block uppercase">
                  Operational Flight Recommendation:
                </span>
                <p className="text-cyan-200">
                  {selectedEvent.aiAssessment?.recommendedAction}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() =>
                    onNavigateToAssistant?.(
                      `Summarize active collision report ${selectedEvent.id} for ${selectedEvent.targetObject.name} vs ${selectedEvent.chaserObject.name} with miss distance ${selectedEvent.missDistanceKm} km.`
                    )
                  }
                  className="px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open Full Briefing in ASTRA AI Assistant</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. Avoidance Recommendation System & Maneuver Comparison */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                    Avoidance Recommendation System
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Compare candidate hypothetical maneuvers and simulate thruster burn execution
                  </span>
                </div>
              </div>
            </div>

            {/* Candidate Maneuvers Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(selectedEvent.candidateManeuvers || []).map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => handleApplyPresetManeuver(opt)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    burnType === opt.type
                      ? 'border-cyan-500 bg-cyan-950/70 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200">{opt.name}</span>
                    <Badge
                      label={opt.efficiencyRating}
                      variant={
                        opt.efficiencyRating === 'OPTIMAL'
                          ? 'emerald'
                          : opt.efficiencyRating === 'ACCEPTABLE'
                          ? 'cyan'
                          : 'amber'
                      }
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{opt.rationale}</p>

                  <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-slate-800 text-[10px]">
                    <div>
                      <span className="text-[9px] text-slate-500 block">$\Delta V$</span>
                      <strong className="text-cyan-300">{opt.deltaV} m/s</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Propellant</span>
                      <strong className="text-slate-300">{opt.propellantKg} kg</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">New Miss</span>
                      <strong className="text-emerald-400">{opt.newMissDistanceKm} km</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Maneuver Tuning Controls */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-200 uppercase flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Interactive $\Delta V$ Magnitude Fine-Tuning
                </span>
                <span className="font-mono text-cyan-400 font-bold text-sm">
                  {deltaV.toFixed(2)} m/s
                </span>
              </div>

              <input
                type="range"
                min="0.05"
                max="2.50"
                step="0.05"
                value={deltaV}
                onChange={(e) => setDeltaV(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.05 m/s (Micro-trim)</span>
                <span>Optimal: 0.45 m/s</span>
                <span>2.50 m/s (Max Evasion)</span>
              </div>

              {/* Real-time Simulated Astrodynamic Outcome */}
              {maneuverResult && (
                <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[9px] text-slate-500 block">POST-BURN MISS</span>
                    <strong className="text-emerald-400 text-sm">{maneuverResult.newMissDistanceKm} km</strong>
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[9px] text-slate-500 block">POST-BURN $P_c$</span>
                    <strong className="text-emerald-400 text-sm font-mono">
                      {maneuverResult.newCollisionProb.toExponential(2)}
                    </strong>
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[9px] text-slate-500 block">BURN DURATION</span>
                    <strong className="text-slate-200 text-sm">{maneuverResult.burnDurationSec}s</strong>
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[9px] text-slate-500 block">FUEL CONSUMED</span>
                    <strong className="text-slate-200 text-sm">{maneuverResult.propellantUsedKg} kg</strong>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleExecuteBurn}
                disabled={selectedEvent.maneuverExecuted}
                className={`w-full py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                  selectedEvent.maneuverExecuted
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white border border-cyan-400/50 shadow-cyan-500/20'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-300" />
                <span>
                  {selectedEvent.maneuverExecuted
                    ? 'AVOIDANCE MANEUVER ALREADY EXECUTED (CLEARANCE SECURED)'
                    : 'EXECUTE SIMULATED AVOIDANCE BURN & UPDATE TELEMETRY'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Object Pair Conjunction Screener Modal */}
      {isScreenerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl border border-cyan-500/50 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Screen Custom Satellite vs Debris Pair
                </h3>
              </div>
              <button
                onClick={() => setIsScreenerOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-900"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select any active spacecraft from your fleet and any cataloged debris object to calculate the relative encounter geometry, closest approach distance, relative velocity, and Foster $P_c$.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1 uppercase">
                  1. Select Operational Satellite
                </label>
                <select
                  value={screenerSatId}
                  onChange={(e) => setScreenerSatId(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                >
                  {MOCK_SATELLITES.map((sat) => (
                    <option key={sat.id} value={sat.id}>
                      {sat.name} (NORAD #{sat.noradId}) — {sat.altitude} km ({sat.operator})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1 uppercase">
                  2. Select Debris Object
                </label>
                <select
                  value={screenerDebId}
                  onChange={(e) => setScreenerDebId(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                >
                  {MOCK_DEBRIS.map((deb) => (
                    <option key={deb.id} value={deb.id}>
                      {deb.name} (NORAD #{deb.noradId}) — {deb.altitude} km ({deb.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsScreenerOpen(false)}
                className="px-4 py-2 rounded bg-slate-900 text-slate-300 text-xs hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRunCustomScreen}
                className="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
              >
                <Crosshair className="w-4 h-4" />
                <span>Run Conjunction Screening</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

