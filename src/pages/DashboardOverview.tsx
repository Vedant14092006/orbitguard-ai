import React, { useState } from 'react';
import {
  Satellite,
  Trash2,
  ShieldAlert,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Radio,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
  Globe2,
  Compass,
  Layers,
  Crosshair,
  Maximize2
} from 'lucide-react';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { OrbitalGlobe } from '../components/3d/OrbitalGlobe';
import { CollisionWarningHero } from '../components/dashboard/CollisionWarningHero';
import { MOCK_CONJUNCTIONS } from '../data/mockConjunctions';
import { MOCK_EVENTS } from '../data/mockEvents';
import { NavPage } from '../components/layout/Sidebar';
import { audioService } from '../services/audioService';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

interface DashboardOverviewProps {
  onNavigate: (page: NavPage, objectId?: string) => void;
  onNavigateToAssistant?: (prompt?: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  onNavigateToAssistant
}) => {
  const [selectedCenterpieceId, setSelectedCenterpieceId] = useState<string | null>('sat-starlink-5120');

  // Chart Data: Debris Altitude Distribution
  const altitudeData = [
    { band: 'VLEO (200-450km)', debris: 2400, satellites: 1850 },
    { band: 'LEO Low (450-700km)', debris: 12200, satellites: 4600 },
    { band: 'LEO Peak (700-1000km)', debris: 16800, satellites: 720 },
    { band: 'Upper LEO (1000-2000km)', debris: 3400, satellites: 250 },
    { band: 'MEO (2000-35000km)', debris: 850, satellites: 180 },
    { band: 'GEO (~35786km)', debris: 1850, satellites: 540 }
  ];

  // Chart Data: Satellite Fleet by Operator
  const operatorData = [
    { name: 'SpaceX', sats: 6200 },
    { name: 'Eutelsat OneWeb', sats: 640 },
    { name: 'US Gov/DoD', sats: 420 },
    { name: 'China CNSA/CASC', sats: 560 },
    { name: 'ESA / EU', sats: 210 },
    { name: 'ISRO (India)', sats: 110 },
    { name: 'Commercial Other', sats: 880 }
  ];

  const quickFocusTargets = [
    { id: 'sat-iss', label: 'ISS (ZARYA)', norad: '25544', color: 'text-emerald-400' },
    { id: 'sat-starlink-5120', label: 'STARLINK-5120', norad: '51200', color: 'text-cyan-400' },
    { id: 'deb-cosmos-frag-1', label: 'COSMOS-2251 DEBRIS', norad: '18420', color: 'text-red-400' },
    { id: 'sat-tiangong', label: 'TIANGONG (CSS)', norad: '48274', color: 'text-emerald-400' },
    { id: 'sat-sentinel-2a', label: 'SENTINEL-2A', norad: '40697', color: 'text-sky-400' }
  ];

  return (
    <div className="space-y-6 font-mono pb-12 select-none">
      {/* 1. Aerospace Hero Banner */}
      <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge label="USSPACECOM & ESA SENSOR STREAM" variant="cyan" pulse />
              <Badge label="REAL-TIME SGP4 EPHEMERIS" variant="emerald" />
              <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                WGS-84 / EGM96 REFERENCE FRAME
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-100 tracking-wider uppercase flex items-center gap-2">
              <span>ORBITGUARD AI</span>
              <span className="text-cyan-400 font-light">//</span>
              <span className="text-cyan-300 font-bold">MISSION CONTROL COCKPIT</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Global space situational awareness and autonomous collision avoidance. Monitoring 47,100 cataloged orbital assets with high-precision SGP4 orbital propagation, NASA CARA conjunction screening, and Kessler syndrome mitigation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('collision-risk')}
              className="px-3.5 py-2 rounded bg-red-950/70 hover:bg-red-900/80 border border-red-500/50 text-red-300 hover:text-red-100 transition-colors text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.25)] group"
            >
              <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
              <span>4 CRITICAL CONJUNCTIONS</span>
            </button>

            <button
              onClick={() => onNavigate('tracker', selectedCenterpieceId || undefined)}
              className="px-3.5 py-2 rounded bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/50 text-cyan-300 hover:text-cyan-100 transition-colors text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.25)] group"
            >
              <Maximize2 className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>FULLSCREEN 3D TRACKER</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. GRAND CENTERPIECE: 3D EARTH ORBITAL COCKPIT */}
      <div className="rounded-xl border border-cyan-500/40 bg-slate-950/80 p-4 backdrop-blur-xl shadow-[0_0_40px_rgba(6,182,212,0.15)] relative overflow-hidden">
        {/* Centerpiece Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Globe2 className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Interactive 3D Orbital Centerpiece // Earth & Satellite Swarm
                </h2>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </div>
              <span className="text-[10px] text-slate-400">
                Left-drag to rotate globe &bull; Scroll to zoom &bull; Click any object to lock telemetry
              </span>
            </div>
          </div>

          {/* Quick Target Locks */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase mr-1 hidden lg:inline">Quick Lock:</span>
            {quickFocusTargets.map((tgt) => (
              <button
                key={tgt.id}
                onClick={() => {
                  setSelectedCenterpieceId(tgt.id);
                  audioService.playBlip();
                }}
                className={`px-2 py-1 rounded text-[10px] font-mono border transition-all flex items-center gap-1 ${
                  selectedCenterpieceId === tgt.id
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)] font-bold'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Crosshair className="w-3 h-3" />
                <span>{tgt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3D WebGL Canvas Centerpiece */}
        <div className="h-[520px] w-full rounded-lg overflow-hidden border border-slate-800/80 relative shadow-inner">
          <OrbitalGlobe
            fullHeight={false}
            selectedObjectId={selectedCenterpieceId}
            onSelectObject={(obj) => {
              if (obj) setSelectedCenterpieceId(obj.id);
            }}
          />

          {/* Centerpiece Quick HUD Pill */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-20 pointer-events-none">
            <div className="px-2.5 py-1 rounded-md bg-slate-950/85 border border-cyan-500/40 text-[10px] text-cyan-300 backdrop-blur-md shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block mr-1.5 animate-pulse" />
              INTERACTIVE 3D WEBGL CORE
            </div>
          </div>
        </div>

        {/* Centerpiece Bottom Telemetry Ticker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px]">
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Low Earth Orbit (LEO)</span>
            <strong className="text-cyan-400 font-bold">82.4%</strong>
            <span className="text-[10px] text-slate-400 ml-1.5 font-normal">Active Shell</span>
          </div>

          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Medium Earth Orbit (MEO)</span>
            <strong className="text-amber-400 font-bold">4.1%</strong>
            <span className="text-[10px] text-slate-400 ml-1.5 font-normal">GPS / Galileo</span>
          </div>

          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Geostationary Belt (GEO)</span>
            <strong className="text-purple-400 font-bold">13.5%</strong>
            <span className="text-[10px] text-slate-400 ml-1.5 font-normal">35,786 km</span>
          </div>

          <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">SGP4 Propagation</span>
              <strong className="text-emerald-400 font-bold">60 FPS</strong>
            </div>
            <button
              onClick={() => onNavigate('tracker', selectedCenterpieceId || undefined)}
              className="px-2 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 text-[10px] flex items-center gap-1"
            >
              <span>Expand</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. VISUALLY IMPRESSIVE EMERGENCY COLLISION WARNING PANEL */}
      <CollisionWarningHero
        onNavigateToCollision={(id) => onNavigate('collision-risk', id)}
        onNavigateToSatellite={(satId) => onNavigate('satellites', satId)}
        onNavigateToAssistant={(prompt) => onNavigateToAssistant?.(prompt)}
        onTrack3D={(objId) => onNavigate('tracker', objId)}
      />

      {/* 4. KEY PERFORMANCE INDICATORS (5 Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Tracked Satellites"
          value="7,420"
          subtitle="6,180 Active / 1,240 Idle"
          icon={Satellite}
          accentColor="blue"
          trend={{ value: "+840", isPositive: true, label: "this yr" }}
          onClick={() => onNavigate('satellites')}
        />
        <MetricCard
          title="Tracked Debris"
          value="36,500"
          subtitle=">10cm Lethal Objects"
          icon={Trash2}
          accentColor="amber"
          trend={{ value: "+1,200", isPositive: false, label: "since 2024" }}
          onClick={() => onNavigate('debris')}
        />
        <MetricCard
          title="Active Warnings"
          value="4 CRIT"
          subtitle="TCA < 24h Window"
          icon={ShieldAlert}
          accentColor="red"
          badge="ALERT"
          onClick={() => onNavigate('collision-risk')}
        />
        <MetricCard
          title="Satellites At Risk"
          value="18"
          subtitle="ISS, Starlink, Sentinel"
          icon={AlertTriangle}
          accentColor="amber"
          onClick={() => onNavigate('collision-risk')}
        />
        <MetricCard
          title="Sustainability Index"
          value="72 / 100"
          subtitle="SSR Global Score"
          icon={Activity}
          accentColor="emerald"
          trend={{ value: "Silver Tier", isPositive: true }}
          onClick={() => onNavigate('sustainability')}
        />
      </div>

      {/* 5. ANALYTICS CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debris Distribution by Altitude Shell */}
        <div className="rounded-xl border border-cyan-500/20 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Orbital Density Distribution by Altitude Band
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">OBJECT COUNT</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={altitudeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="debrisGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="satGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="band" stroke="#64748b" tick={{ fontSize: 9 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#030712', borderColor: '#06b6d4', borderRadius: '6px' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="debris" name="Tracked Debris" stroke="#f97316" fillOpacity={1} fill="url(#debrisGrad)" />
                <Area type="monotone" dataKey="satellites" name="Active Satellites" stroke="#06b6d4" fillOpacity={1} fill="url(#satGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Constellation Satellites by Operator */}
        <div className="rounded-xl border border-cyan-500/20 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Satellite className="w-4 h-4 text-blue-400" />
              Active Satellite Population by Operator Fleet
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">CONSTELLATION FLEET</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operatorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#030712', borderColor: '#3b82f6', borderRadius: '6px' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Bar dataKey="sats" name="Active Fleet" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 6. REAL-TIME ORBITAL INCIDENT & OPERATIONS STREAM */}
      <div className="rounded-xl border border-cyan-500/20 bg-slate-900/60 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Real-Time Orbital Incident & Operations Stream
            </h3>
          </div>
          <span className="text-[10px] text-emerald-400">TELEMETRY LINK: NOMINAL</span>
        </div>

        <div className="space-y-2">
          {MOCK_EVENTS.map((evt) => (
            <div
              key={evt.id}
              onClick={() => {
                if (evt.type === 'CONJUNCTION_WARNING') {
                  onNavigate('collision-risk', evt.objectId);
                } else if (evt.type === 'DEBRIS_DETECTED' || evt.type === 'REENTRY_FORECAST') {
                  onNavigate('debris', evt.objectId);
                } else if (evt.type === 'MANEUVER_EXECUTED') {
                  onNavigate('satellites', evt.objectId);
                } else {
                  onNavigate('satellites', evt.objectId);
                }
              }}
              className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-950 transition-all cursor-pointer flex items-start justify-between gap-4 text-xs group"
              title="Click to jump to incident telemetry"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded uppercase ${
                      evt.severity === 'CRITICAL'
                        ? 'bg-red-950 text-red-400 border border-red-500/40'
                        : evt.severity === 'WARNING'
                        ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                        : 'bg-cyan-950 text-cyan-400 border border-cyan-500/40'
                    }`}
                  >
                    {evt.severity}
                  </span>
                  <span className="group-hover:text-cyan-300 transition-colors">{evt.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{evt.description}</p>
              </div>
              <span className="text-[10px] text-slate-500 shrink-0 font-mono">{evt.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
