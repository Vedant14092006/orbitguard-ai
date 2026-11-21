import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { MOCK_SATELLITES } from '../data/mockSatellites';
import { OrbitalObject, RiskLevel } from '../types/orbit';
import {
  getMissionTypeLabel,
  calculateDebrisExposureLevel,
  getEstimatedMissionLife,
  getSatelliteWarningHistory,
  generateGroundTrack,
  getSatelliteSafetyNotifications
} from '../services/satelliteSafetyService';
import { audioService } from '../services/audioService';
import {
  Satellite,
  Search,
  Activity,
  Zap,
  Battery,
  Flame,
  Radio,
  Clock,
  Compass,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Cpu,
  Orbit,
  Layers,
  Thermometer,
  ShieldCheck,
  Bell,
  BarChart3,
  Globe2,
  HelpCircle,
  Bot,
  Award
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

interface SatelliteMonitoringPageProps {
  initialSatelliteId?: string | null;
  onNavigateToTracker?: (id: string) => void;
  onNavigateToCollision?: (conjunctionId?: string, satId?: string) => void;
  onNavigateToSustainability?: () => void;
  onNavigateToAssistant?: (prompt?: string) => void;
}

export const SatelliteMonitoringPage: React.FC<SatelliteMonitoringPageProps> = ({
  initialSatelliteId,
  onNavigateToTracker,
  onNavigateToCollision,
  onNavigateToSustainability,
  onNavigateToAssistant
}) => {
  const [selectedSatId, setSelectedSatId] = useState<string>(initialSatelliteId || 'sat-iss');

  // Sync when initialSatelliteId changes
  React.useEffect(() => {
    if (initialSatelliteId) {
      setSelectedSatId(initialSatelliteId);
    }
  }, [initialSatelliteId]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [regimeFilter, setRegimeFilter] = useState<'ALL' | 'LEO' | 'MEO' | 'GEO'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [exposureFilter, setExposureFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'WARNINGS' | 'TRAJECTORY' | 'NOTIFICATIONS'>('TELEMETRY');

  const selectedSat = useMemo(() => {
    return MOCK_SATELLITES.find((s) => s.id === selectedSatId) || MOCK_SATELLITES[0];
  }, [selectedSatId]);

  // Derived calculations for selected satellite
  const missionType = useMemo(() => getMissionTypeLabel(selectedSat.category, selectedSat.name), [selectedSat]);
  const debrisExposure = useMemo(() => calculateDebrisExposureLevel(selectedSat), [selectedSat]);
  const missionLifeInfo = useMemo(() => getEstimatedMissionLife(selectedSat), [selectedSat]);
  const warningHistory = useMemo(() => getSatelliteWarningHistory(selectedSat), [selectedSat]);
  const groundTrackPoints = useMemo(() => generateGroundTrack(selectedSat), [selectedSat]);
  const safetyNotifications = useMemo(() => getSatelliteSafetyNotifications(selectedSat), [selectedSat]);

  // Multi-criteria filtering
  const filteredSatellites = useMemo(() => {
    return MOCK_SATELLITES.filter((s) => {
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          s.name.toLowerCase().includes(q) ||
          s.noradId.toString().includes(q) ||
          s.operator.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL' && s.category !== categoryFilter) {
        return false;
      }

      // Regime filter
      if (regimeFilter !== 'ALL') {
        if (regimeFilter === 'LEO' && s.altitude >= 2000) return false;
        if (regimeFilter === 'MEO' && (s.altitude < 2000 || s.altitude >= 35000)) return false;
        if (regimeFilter === 'GEO' && s.altitude < 35000) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && s.status !== statusFilter) {
        return false;
      }

      // Debris exposure filter
      if (exposureFilter !== 'ALL') {
        const exp = calculateDebrisExposureLevel(s);
        if (exp !== exposureFilter) return false;
      }

      return true;
    });
  }, [searchQuery, categoryFilter, regimeFilter, statusFilter, exposureFilter]);

  const groundStations = [
    { name: 'Svalbard (SGS)', lat: '78.2° N', nextPass: '14 mins', elev: '68°', status: 'AOS IN 14M' },
    { name: 'Goldstone (DSN)', lat: '35.4° N', nextPass: '1h 22m', elev: '42°', status: 'SCHEDULED' },
    { name: 'Madrid (MDSCC)', lat: '40.4° N', nextPass: '2h 45m', elev: '55°', status: 'SCHEDULED' },
    { name: 'Canberra (CDSCC)', lat: '35.4° S', nextPass: '4h 10m', elev: '78°', status: 'SCHEDULED' },
    { name: 'ISRO ISTRAC (Bangalore)', lat: '13.0° N', nextPass: '5h 30m', elev: '34°', status: 'SCHEDULED' }
  ];

  const getExposureBadge = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return { label: 'CRITICAL', bg: 'bg-red-950/80 text-red-400 border-red-500/50' };
      case 'HIGH':
        return { label: 'HIGH', bg: 'bg-orange-950/80 text-orange-400 border-orange-500/50' };
      case 'MODERATE':
      case 'ELEVATED':
        return { label: 'MODERATE', bg: 'bg-yellow-950/80 text-yellow-400 border-yellow-500/50' };
      default:
        return { label: 'LOW', bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50' };
    }
  };

  const exposureBadge = getExposureBadge(debrisExposure);

  return (
    <div className="space-y-6 font-mono pb-16">
      {/* Top Banner Header */}
      <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-blue-950/80 text-cyan-400 border border-blue-500/40">
              FLEET SAFETY & TELEMETRY OPERATIONS
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 border border-emerald-500/40 bg-emerald-950/60">
              ACTIVE ASSETS MONITORED: {MOCK_SATELLITES.length}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 border border-slate-800 bg-slate-900/80">
              5-YEAR DEORBIT AUDIT: 92.4% COMPLIANT
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-100 tracking-wider uppercase flex items-center gap-2.5">
            <Satellite className="w-6 h-6 text-cyan-400" />
            Satellite Safety Monitoring Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Real-time constellation monitoring, bus subsystem telemetry, orbital debris flux exposure, collision warning history, and post-mission disposal compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToTracker?.(selectedSat.id)}
            className="px-4 py-2.5 rounded-lg border border-cyan-500/50 bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 text-cyan-300 text-xs font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Track {selectedSat.name} in 3D</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Fleet Search/List + Selected Satellite Command Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Satellite Search & Fleet List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-md space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, NORAD ID, operator..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Orbit Regime Filter Pills */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                Orbital Regime:
              </span>
              <div className="flex gap-1 text-[10px]">
                {(['ALL', 'LEO', 'MEO', 'GEO'] as const).map((reg) => (
                  <button
                    key={reg}
                    onClick={() => {
                      setRegimeFilter(reg);
                      audioService.playBlip();
                    }}
                    className={`flex-1 py-1 rounded transition-all font-bold ${
                      regimeFilter === reg
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                        : 'bg-slate-950/80 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {reg}
                  </button>
                ))}
              </div>
            </div>

            {/* Mission Category Filter Pills */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                Mission Category:
              </span>
              <div className="flex flex-wrap gap-1 text-[10px]">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'COMMERCIAL', label: 'Commercial' },
                  { id: 'SCIENTIFIC', label: 'Scientific' },
                  { id: 'NAVIGATION', label: 'Navigation' },
                  { id: 'SPACE_STATION', label: 'Habitat' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategoryFilter(cat.id);
                      audioService.playBlip();
                    }}
                    className={`px-2 py-0.5 rounded transition-all ${
                      categoryFilter === cat.id
                        ? 'bg-blue-950 border border-blue-500/50 text-cyan-300 font-bold'
                        : 'text-slate-400 bg-slate-950/80 border border-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Debris Exposure Filter */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                Debris Exposure Level:
              </span>
              <div className="grid grid-cols-5 gap-1 text-[9px] font-bold">
                {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      setExposureFilter(lvl);
                      audioService.playBlip();
                    }}
                    className={`py-1 rounded text-center transition-all ${
                      exposureFilter === lvl
                        ? 'bg-slate-700 text-slate-100 border border-slate-500'
                        : 'bg-slate-950/60 text-slate-500 border border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Satellite Selection List */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            <div className="text-[10px] text-slate-500 px-1 flex justify-between">
              <span>Matching Spacecraft ({filteredSatellites.length})</span>
              <span>Click to Inspect Telemetry</span>
            </div>

            {filteredSatellites.length === 0 ? (
              <div className="p-8 text-center rounded-lg border border-slate-800 bg-slate-950/60 text-xs text-slate-500 font-mono space-y-2">
                <Satellite className="w-6 h-6 text-slate-600 mx-auto" />
                <p>No spacecraft matching current filters.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('ALL');
                    setRegimeFilter('ALL');
                    setStatusFilter('ALL');
                    setExposureFilter('ALL');
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredSatellites.map((sat) => {
              const isSelected = sat.id === selectedSat.id;
              const exp = calculateDebrisExposureLevel(sat);
              const expBadge = getExposureBadge(exp);

              return (
                <div
                  key={sat.id}
                  onClick={() => {
                    setSelectedSatId(sat.id);
                    audioService.playBlip();
                  }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-500/70 bg-slate-900/90 shadow-[0_0_15px_rgba(6,182,212,0.18)] ring-1 ring-cyan-500/30'
                      : 'border-slate-800/80 hover:border-slate-700 bg-slate-950/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-100">{sat.name}</span>
                        {sat.isSimulated && (
                          <span className="px-1 py-0.2 rounded text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono">
                            DEMO
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        NORAD #{sat.noradId} &bull; {sat.altitude} km &bull; {sat.operator}
                      </div>
                    </div>

                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${expBadge.bg}`}>
                      {expBadge.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 mt-2.5 pt-2 border-t border-slate-800/80 text-[10px]">
                    <div>
                      <span className="text-[9px] text-slate-500 block">Status</span>
                      <strong className={sat.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'}>
                        {sat.status}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Velocity</span>
                      <strong className="text-slate-300">{sat.velocity} km/s</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Inclination</span>
                      <strong className="text-slate-300">{sat.inclination}°</strong>
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Right Column (8 cols): Individual Satellite Detail Console */}
        <div className="lg:col-span-8 space-y-4">
          {/* Main Inspection Header */}
          <div className="rounded-xl border border-cyan-500/30 bg-slate-900/80 p-5 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Satellite className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-slate-100">{selectedSat.name}</h2>
                  <Badge
                    label={selectedSat.status}
                    variant={selectedSat.status === 'ACTIVE' ? 'emerald' : 'amber'}
                    pulse={selectedSat.status === 'ACTIVE'}
                  />
                  {selectedSat.isSimulated && (
                    <Badge label="SIMULATED DEMO OBJECT" variant="cyan" />
                  )}
                </div>
                <div className="text-xs text-cyan-400/90 mt-1 font-semibold">
                  {missionType}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  NORAD ID: <strong className="text-slate-200">#{selectedSat.noradId}</strong> &bull; Operator:{' '}
                  <strong className="text-slate-200">{selectedSat.operator}</strong> &bull; Nation: {selectedSat.country} ({selectedSat.countryCode}) &bull; Launch: {selectedSat.launchDate}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onNavigateToTracker?.(selectedSat.id)}
                  className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                >
                  <Compass className="w-4 h-4" />
                  <span>Track in 3D</span>
                </button>
                <button
                  onClick={() =>
                    onNavigateToAssistant?.(
                      `Provide an operational safety audit and debris exposure risk analysis for ${selectedSat.name} (NORAD #${selectedSat.noradId}) in ${selectedSat.altitude} km orbit.`
                    )
                  }
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Bot className="w-4 h-4" />
                  <span>Ask ASTRA</span>
                </button>
              </div>
            </div>

            {/* Core Telemetry Strip: Altitude, Velocity, Inclination, Period, Debris Exposure, Warnings */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Altitude</span>
                <strong className="text-slate-100 text-sm font-bold">{selectedSat.altitude} km</strong>
                <span className="text-[9px] text-slate-500 block">Apogee: {selectedSat.apogee} km</span>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Velocity</span>
                <strong className="text-slate-100 text-sm font-bold">{selectedSat.velocity} km/s</strong>
                <span className="text-[9px] text-slate-500 block">~{Math.round(selectedSat.velocity * 3600)} km/h</span>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Inclination</span>
                <strong className="text-slate-100 text-sm font-bold">{selectedSat.inclination}°</strong>
                <span className="text-[9px] text-slate-500 block">Eccentricity: {selectedSat.eccentricity}</span>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Orbital Period</span>
                <strong className="text-slate-100 text-sm font-bold">{selectedSat.period} min</strong>
                <span className="text-[9px] text-slate-500 block">~{(1440 / selectedSat.period).toFixed(1)} revs/day</span>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Debris Exposure</span>
                <strong className={`text-sm font-bold block ${exposureBadge.bg.split(' ')[1]}`}>
                  {exposureBadge.label}
                </strong>
                <span className="text-[9px] text-slate-500 block">Spatial Flux Index</span>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Close Warnings</span>
                <strong className="text-amber-400 text-sm font-bold">
                  {warningHistory.length} Recorded
                </strong>
                <span className="text-[9px] text-slate-500 block">CDMs in pipeline</span>
              </div>
            </div>

            {/* Estimated Remaining Mission Life Banner */}
            <div className={`p-3.5 rounded-lg border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              missionLifeInfo.status === 'DATA_AVAILABLE'
                ? 'bg-slate-950/80 border-cyan-500/30'
                : 'bg-amber-950/20 border-amber-500/40 text-amber-200'
            }`}>
              <div className="flex items-start gap-2.5">
                <Clock className={`w-4 h-4 shrink-0 mt-0.5 ${
                  missionLifeInfo.status === 'DATA_AVAILABLE' ? 'text-cyan-400' : 'text-amber-400'
                }`} />
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>ESTIMATED REMAINING MISSION LIFE:</span>
                    {missionLifeInfo.lifeYears !== null ? (
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        {missionLifeInfo.lifeYears} YEARS
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-bold uppercase">
                        DATA UNAVAILABLE / UNCERTAIN DATA
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {missionLifeInfo.explanation}
                  </p>
                </div>
              </div>

              {missionLifeInfo.lifeYears !== null && (
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 block">Disposal Horizon</span>
                  <span className="text-xs font-bold text-slate-300">
                    Target: {new Date().getFullYear() + Math.round(missionLifeInfo.lifeYears)}
                  </span>
                </div>
              )}
            </div>

            {/* Navigation Tabs for Detail Views */}
            <div className="flex border-b border-slate-800 text-xs">
              {[
                { id: 'TELEMETRY', label: 'Subsystem Health & Safety', icon: Activity },
                { id: 'WARNINGS', label: `Collision Warnings (${warningHistory.length})`, icon: ShieldAlert },
                { id: 'TRAJECTORY', label: 'Orbital Ground Track', icon: Orbit },
                { id: 'NOTIFICATIONS', label: `Safety Notifications (${safetyNotifications.length})`, icon: Bell }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as typeof activeTab);
                      audioService.playBlip();
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2.5 font-bold transition-all border-b-2 -mb-px ${
                      activeTab === tab.id
                        ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Subsystem Health & Safety Indicators */}
            {activeTab === 'TELEMETRY' && (
              <div className="space-y-4 pt-1">
                {/* 4 Health Gauges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {/* Power Generation */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        EPS POWER
                      </span>
                      <span className="text-emerald-400 font-bold">NOMINAL</span>
                    </div>
                    <div className="text-xl font-bold text-slate-100">
                      {selectedSat.health?.powerWatts ? `${(selectedSat.health.powerWatts / 1000).toFixed(1)} kW` : '1.8 kW'}
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full w-[90%]" />
                    </div>
                    <span className="text-[9px] text-slate-500 block">Solar Array Drive: Sun-Locked</span>
                  </div>

                  {/* Battery State of Charge */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span className="flex items-center gap-1">
                        <Battery className="w-3.5 h-3.5 text-cyan-400" />
                        BATTERY SOC
                      </span>
                      <span className="text-cyan-400 font-bold">
                        {selectedSat.health?.batterySocPct || 92}%
                      </span>
                    </div>
                    <div className="text-xl font-bold text-cyan-400">
                      {selectedSat.health?.batterySocPct || 92}%
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full"
                        style={{ width: `${selectedSat.health?.batterySocPct || 92}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 block">Li-Ion Cell Balance: Nominal</span>
                  </div>

                  {/* Internal Thermal */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span className="flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
                        THERMAL BUS
                      </span>
                      <span className="text-emerald-400 font-bold">STABLE</span>
                    </div>
                    <div className="text-xl font-bold text-emerald-400">
                      {selectedSat.health?.temperatureC || 19.5}°C
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full w-[65%]" />
                    </div>
                    <span className="text-[9px] text-slate-500 block">Range: -10°C to +40°C</span>
                  </div>

                  {/* Propellant Fuel Reserve */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        PROPULSION
                      </span>
                      <span className="text-orange-400 font-bold">
                        {selectedSat.health?.propellantKg || 0} kg
                      </span>
                    </div>
                    <div className="text-xl font-bold text-orange-400">
                      {selectedSat.health?.propellantKg || 0} kg
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-orange-400 h-full"
                        style={{ width: `${Math.min(100, ((selectedSat.health?.propellantKg || 0) / 60) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 block">
                      {selectedSat.health?.propellantKg ? 'Delta-V Margin: ~180 m/s' : 'Passive Drift Only'}
                    </span>
                  </div>
                </div>

                {/* Safety Status Indicators (Kessler Index, SSR Rating, 5-Year Compliance) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Kessler Vulnerability */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        Kessler Vulnerability
                      </span>
                      <span className={`font-bold ${
                        selectedSat.kesslerIndex > 75 ? 'text-red-400' : selectedSat.kesslerIndex > 50 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {selectedSat.kesslerIndex} / 100
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          selectedSat.kesslerIndex > 75 ? 'bg-red-500' : selectedSat.kesslerIndex > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${selectedSat.kesslerIndex}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Cascading fragmentation risk based on altitude band and radar cross-section.
                    </p>
                  </div>

                  {/* Space Sustainability Rating (SSR) */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        Sustainability (SSR)
                      </span>
                      <span className="font-bold text-cyan-400">
                        {selectedSat.ssrRating || 85} / 100
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        style={{ width: `${selectedSat.ssrRating || 85}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      WEF/EPFL composite score evaluating tracking ease, collision avoidance, and deorbit plan.
                    </p>
                    <button
                      onClick={() => onNavigateToSustainability?.()}
                      className="w-full mt-2 py-1 rounded bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <Award className="w-3 h-3 text-cyan-400" />
                      <span>View Sustainability Scorecard</span>
                    </button>
                  </div>

                  {/* 5-Year Deorbit Rule Compliance */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        5-Yr Disposal Rule
                      </span>
                      <span className={`font-bold ${selectedSat.health?.deorbitRuleCompliant ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {selectedSat.health?.deorbitRuleCompliant ? 'COMPLIANT' : 'AUDIT PENDING'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${selectedSat.health?.deorbitRuleCompliant ? 'bg-emerald-400' : 'bg-amber-400'}`}
                        style={{ width: selectedSat.health?.deorbitRuleCompliant ? '95%' : '40%' }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Post-mission orbital lifetime forecast: <strong>{selectedSat.health?.disposalWindowYears || 5} years</strong> (Mandate &le; 5 yrs).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Collision Warning History */}
            {activeTab === 'WARNINGS' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wide">
                    Historical & Screened Conjunction Events
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Source: CARA / 18th Space Defense Squadron CDMs
                  </span>
                </div>

                <div className="rounded-lg border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">CDM ID</th>
                        <th className="p-2.5">TCA Epoch</th>
                        <th className="p-2.5">Chaser Object</th>
                        <th className="p-2.5">Miss Distance</th>
                        <th className="p-2.5">Rel. Speed</th>
                        <th className="p-2.5">Risk Level</th>
                        <th className="p-2.5">Action Taken</th>
                        <th className="p-2.5 text-right">Inspection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-[11px]">
                      {warningHistory.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-950/60 transition-colors">
                          <td className="p-2.5 font-mono text-cyan-400 font-bold">{w.id}</td>
                          <td className="p-2.5 text-slate-300 font-mono">
                            {new Date(w.tca).toLocaleDateString()} {new Date(w.tca).toLocaleTimeString()}
                          </td>
                          <td className="p-2.5">
                            <span className="font-bold text-red-400">{w.chaserName}</span>
                            <span className="text-[9px] text-slate-500 block">#{w.chaserNoradId}</span>
                          </td>
                          <td className="p-2.5 font-bold font-mono text-slate-200">
                            {w.missDistanceM < 1000 ? `${w.missDistanceM} m` : `${(w.missDistanceM / 1000).toFixed(2)} km`}
                          </td>
                          <td className="p-2.5 text-slate-300 font-mono">{w.relativeVelKmS} km/s</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getExposureBadge(w.risk).bg}`}>
                              {w.risk}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-400 text-[10px]">{w.actionTaken}</td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => onNavigateToCollision?.(w.id, selectedSat.id)}
                              className="px-2 py-1 rounded bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 text-[10px] font-bold transition-colors inline-flex items-center gap-1 shadow-sm"
                            >
                              <ShieldAlert className="w-3 h-3 text-red-400" />
                              <span>Analyze CDM</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Orbital Trajectory Visualization & Ground Station Passes */}
            {activeTab === 'TRAJECTORY' && (
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Orbit className="w-4 h-4 text-cyan-400" />
                    Orbital Sub-Satellite Trajectory Profile (1 Revolution: {selectedSat.period} mins)
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    INCLINATION: {selectedSat.inclination}° &bull; ALTITUDE: {selectedSat.altitude} km
                  </span>
                </div>

                {/* Trajectory Elevation/Sub-Satellite Latitude Profile Chart */}
                <div className="h-48 w-full bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={groundTrackPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="timeOffsetMin"
                        stroke="#64748b"
                        fontSize={10}
                        tickFormatter={(v) => `+${v}m`}
                      />
                      <YAxis stroke="#64748b" fontSize={10} unit="°" domain={[-90, 90]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#020617',
                          borderColor: '#1e293b',
                          fontSize: '11px',
                          fontFamily: 'monospace'
                        }}
                        formatter={(val: any) => [`${val}° Lat`, 'Sub-Satellite Latitude']}
                        labelFormatter={(lbl) => `T + ${lbl} min into revolution`}
                      />
                      <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" label={{ value: 'Equator', fill: '#64748b', fontSize: 9 }} />
                      <Line
                        type="monotone"
                        dataKey="latitude"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[10px] text-slate-500 text-center font-mono">
                  Sub-satellite ground track spans ±{selectedSat.inclination}° latitude. Nodal regression rate is ~0.8°/day.
                </div>

                {/* Ground Station Passes */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    Ground Station Downlink Windows
                  </span>

                  <div className="rounded border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">Ground Station</th>
                          <th className="p-2.5">Latitude</th>
                          <th className="p-2.5">Max Elev</th>
                          <th className="p-2.5">Next Contact</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 text-[11px]">
                        {groundStations.map((gs, i) => (
                          <tr key={i} className="hover:bg-slate-950/60 transition-colors">
                            <td className="p-2.5 font-bold text-slate-200">{gs.name}</td>
                            <td className="p-2.5 text-slate-400">{gs.lat}</td>
                            <td className="p-2.5 text-cyan-400 font-semibold">{gs.elev}</td>
                            <td className="p-2.5 text-slate-300 font-mono">{gs.nextPass}</td>
                            <td className="p-2.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  i === 0
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 animate-pulse'
                                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                                }`}
                              >
                                {gs.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Concerning Orbital Events & Safety Notifications */}
            {activeTab === 'NOTIFICATIONS' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-400" />
                    Active Space Safety Notifications ({safetyNotifications.length})
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Real-time safety alerts for {selectedSat.name}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {safetyNotifications.map((notif) => {
                    const sevBadge = getExposureBadge(notif.severity);
                    return (
                      <div
                        key={notif.id}
                        className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`w-4 h-4 ${
                              notif.severity === 'CRITICAL' ? 'text-red-400' : notif.severity === 'HIGH' ? 'text-orange-400' : 'text-amber-400'
                            }`} />
                            <span className="font-bold text-xs text-slate-200">{notif.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-mono">{notif.timestamp}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${sevBadge.bg}`}>
                              {sevBadge.label}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed pl-6">
                          {notif.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
