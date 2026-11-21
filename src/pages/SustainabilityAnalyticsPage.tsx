import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  calculateSustainabilityScore,
  SustainabilityScoringInputs,
  SAMPLE_MISSIONS,
  ORBITAL_CONGESTION_HEATMAP_DATA,
  HISTORICAL_DEBRIS_TRENDS,
  simulateKesslerProjection,
  KesslerSimulationParams,
  SUSTAINABILITY_RECOMMENDATIONS
} from '../services/sustainabilityService';
import { DebrisMitigationGuideline, SampleMissionComparison } from '../types/orbit';
import { audioService } from '../services/audioService';
import {
  Award,
  Activity,
  Sliders,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Layers,
  Flame,
  Globe2,
  Compass,
  ArrowRight,
  ShieldAlert,
  Info,
  ExternalLink,
  BookOpen,
  RefreshCw,
  Zap,
  BarChart3,
  Cpu
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

interface SustainabilityAnalyticsPageProps {
  onNavigateToSatellite?: (satId: string) => void;
  onNavigateToTracker?: (objId: string) => void;
  onNavigateToAssistant?: (prompt?: string) => void;
}

export const SustainabilityAnalyticsPage: React.FC<SustainabilityAnalyticsPageProps> = ({
  onNavigateToSatellite,
  onNavigateToTracker,
  onNavigateToAssistant
}) => {
  // Navigation / View Tabs
  const [activeTab, setActiveTab] = useState<'CALCULATOR' | 'COMPARISON' | 'LEADERBOARD' | 'CONGESTION' | 'TRENDS' | 'FUTURE'>('CALCULATOR');

  // 1. Scoring Calculator State
  const [scoringInputs, setScoringInputs] = useState<SustainabilityScoringInputs>({
    orbitalAltitudeKm: 550,
    inclinationDeg: 53.2,
    missionDurationYears: 5,
    postMissionDisposalYears: 3,
    disposalMethod: 'CONTROLLED_REENTRY',
    passivationReadiness: true,
    nonFragmentationDesign: true,
    debrisShielding: true,
    autonomousAvoidance: true,
    propellantReservePct: 20,
    trackabilityAssistance: true,
    guidelineStandard: 'FCC_5_YEAR'
  });

  const ssrScore = useMemo(() => calculateSustainabilityScore(scoringInputs), [scoringInputs]);

  // 2. Comparison Tool State (Comparing 2 missions side-by-side)
  const [compareMissionAId, setCompareMissionAId] = useState<string>('mission-starlink-v2');
  const [compareMissionBId, setCompareMissionBId] = useState<string>('mission-envisat');

  const missionA = useMemo(() => SAMPLE_MISSIONS.find(m => m.id === compareMissionAId) || SAMPLE_MISSIONS[0], [compareMissionAId]);
  const missionB = useMemo(() => SAMPLE_MISSIONS.find(m => m.id === compareMissionBId) || SAMPLE_MISSIONS[5], [compareMissionBId]);

  const mapMissionToObjectId = (mId: string): string => {
    if (mId.includes('starlink')) return 'sat-starlink-5120';
    if (mId.includes('envisat')) return 'deb-envisat-27386';
    if (mId.includes('sentinel')) return 'sat-sentinel-2a';
    if (mId.includes('iss')) return 'sat-iss';
    if (mId.includes('oneweb')) return 'sat-oneweb-0120';
    return 'sat-starlink-5120';
  };

  // 3. Kessler Projection Simulator State
  const [kesslerParams, setKesslerParams] = useState<KesslerSimulationParams>({
    annualLaunches: 2200,
    deorbitCompliancePct: 85,
    adrMissionsAnnual: 5,
    catastrophicAsatEvent: false
  });

  const kesslerData = useMemo(() => simulateKesslerProjection(kesslerParams), [kesslerParams]);

  const handleApplyPreset = (preset: 'BAU' | 'MEGA' | 'CLEAN' | 'ASAT') => {
    audioService.playBlip();
    if (preset === 'BAU') {
      setKesslerParams({ annualLaunches: 2500, deorbitCompliancePct: 75, adrMissionsAnnual: 0, catastrophicAsatEvent: false });
    } else if (preset === 'MEGA') {
      setKesslerParams({ annualLaunches: 6000, deorbitCompliancePct: 80, adrMissionsAnnual: 2, catastrophicAsatEvent: false });
    } else if (preset === 'CLEAN') {
      setKesslerParams({ annualLaunches: 1800, deorbitCompliancePct: 98, adrMissionsAnnual: 20, catastrophicAsatEvent: false });
    } else if (preset === 'ASAT') {
      setKesslerParams({ annualLaunches: 2500, deorbitCompliancePct: 80, adrMissionsAnnual: 0, catastrophicAsatEvent: true });
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]">PLATINUM TIER (ELITE)</span>;
      case 'GOLD':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/50">GOLD TIER (EXCELLENT)</span>;
      case 'SILVER':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-500/50">SILVER TIER (COMPLIANT)</span>;
      case 'BRONZE':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/50">BRONZE TIER (MARGINAL)</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-500/50">NON-COMPLIANT / HIGH RISK</span>;
    }
  };

  return (
    <div className="space-y-6 font-mono pb-16">
      {/* Top Banner Header */}
      <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                ORBITAL SUSTAINABILITY ANALYTICS
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 border border-cyan-500/40 bg-cyan-950/60">
                STANDARD: {scoringInputs.guidelineStandard.replace(/_/g, ' ')}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 border border-slate-800 bg-slate-900/80">
                LEO CARRYING CAPACITY: 74 / 100
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-100 tracking-wider uppercase flex items-center gap-3">
              <Award className="w-6 h-6 text-emerald-400" />
              Space Sustainability Analytics & Carrying Capacity
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Evaluate how responsibly satellites and space missions use Earth's orbital environment. Score missions against 6 core parameters, compare sample spacecraft, inspect orbital congestion, and model runaway cascade projections.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-right">
              <span className="text-[10px] text-emerald-400 block font-bold">CURRENT MISSION SCORE</span>
              <span className="text-2xl font-black text-slate-100 font-mono">{ssrScore.totalScore} / 100</span>
              <div className="mt-1">{getTierBadge(ssrScore.tier)}</div>
            </div>
          </div>
        </div>

        {/* Mandatory Educational Project Disclaimer Banner */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-start gap-2.5 text-[11px] text-amber-300/90 bg-amber-950/20 px-3.5 py-2.5 rounded-lg border border-amber-500/30">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <strong className="text-amber-300 uppercase tracking-wide">
              Educational Project Scoring Model Notice:
            </strong>{' '}
            This space sustainability scoring framework is an educational and analytical demonstration model developed for the ORBITGUARD AI platform. While it synthesizes criteria from the World Economic Forum (WEF) Space Sustainability Rating, ESA Zero Debris Charter, and IADC Guidelines, it does not represent an official regulatory certification or binding government compliance standard.
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 text-xs overflow-x-auto">
        {[
          { id: 'CALCULATOR', label: '1. Sustainability Score Calculator', icon: Sliders },
          { id: 'COMPARISON', label: '2. Mission Comparison Matrix', icon: RefreshCw },
          { id: 'LEADERBOARD', label: '3. Mission Leaderboard', icon: Award },
          { id: 'CONGESTION', label: '4. Orbital Congestion Heatmap', icon: Layers },
          { id: 'TRENDS', label: '5. Debris Growth & Kessler Trends', icon: TrendingUp },
          { id: 'FUTURE', label: '6. Future of Sustainable Space', icon: BookOpen }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as typeof activeTab);
                audioService.playBlip();
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 font-bold transition-all border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SUSTAINABILITY SCORE CALCULATOR */}
      {activeTab === 'CALCULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Configurable Parameters */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                    Configure Mission Parameters
                  </h2>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">6 CORE PARAMETERS</span>
              </div>

              {/* Regulatory Guideline Standard Switcher */}
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-950 border border-slate-800">
                <label className="text-[11px] font-bold text-slate-300 block uppercase">
                  6. Active Debris Mitigation Guideline Framework:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                  {[
                    { id: 'FCC_5_YEAR', label: 'FCC 5-Year Rule', desc: '5-Year deorbit mandate' },
                    { id: 'ESA_ZERO_DEBRIS_2030', label: 'ESA Zero Debris', desc: '1-Yr deorbit, 99% disposal' },
                    { id: 'IADC_25_YEAR', label: 'IADC 25-Year', desc: 'Legacy standard' },
                    { id: 'UN_COPUOS', label: 'UN COPUOS', desc: 'International guidelines' }
                  ].map((guide) => (
                    <button
                      key={guide.id}
                      onClick={() => {
                        setScoringInputs({ ...scoringInputs, guidelineStandard: guide.id as DebrisMitigationGuideline });
                        audioService.playBlip();
                      }}
                      className={`p-2 rounded text-left transition-all ${
                        scoringInputs.guidelineStandard === guide.id
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-md'
                          : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold">{guide.label}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{guide.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider 1: Orbital Altitude */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase">
                    1. Operating Altitude (Orbital Congestion Zone)
                  </span>
                  <span className="text-cyan-400 font-bold font-mono">{scoringInputs.orbitalAltitudeKm} km</span>
                </div>
                <input
                  type="range"
                  min="250"
                  max="1200"
                  step="10"
                  value={scoringInputs.orbitalAltitudeKm}
                  onChange={(e) => setScoringInputs({ ...scoringInputs, orbitalAltitudeKm: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>250 km (VLEO / Drag Cleansed)</span>
                  <span className="text-amber-400">750 - 850 km (Critical Debris Core)</span>
                  <span>1,200 km (High LEO)</span>
                </div>
              </div>

              {/* Selector 2: End-of-Life Disposal Strategy */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block uppercase">
                  2. Satellite End-of-Life Disposal Planning:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'CONTROLLED_REENTRY', label: 'Controlled Pacific Re-entry', desc: 'Direct targeted ocean splashdown' },
                    { id: 'UNCONTROLLED_ATMOSPHERIC', label: 'Uncontrolled Atmospheric', desc: 'Natural orbital drag burnup' },
                    { id: 'GRAVEYARD_ORBIT', label: 'Graveyard Storage', desc: '+300 km above operational slot' },
                    { id: 'NONE', label: 'No Plan / Stranded', desc: 'Derelict post-mission abandonment' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => {
                        setScoringInputs({ ...scoringInputs, disposalMethod: method.id as any });
                        audioService.playBlip();
                      }}
                      className={`p-2.5 rounded border text-left transition-all ${
                        scoringInputs.disposalMethod === method.id
                          ? 'border-emerald-500 bg-emerald-950/70 text-emerald-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{method.label}</div>
                      <div className="text-[9px] text-slate-500 mt-1">{method.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider 4: Post-Mission Disposal Timeline */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase">
                    4. Post-Mission Disposal Timeline (Years until Re-entry)
                  </span>
                  <span className={`font-bold font-mono ${scoringInputs.postMissionDisposalYears <= 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {scoringInputs.postMissionDisposalYears} Years
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={scoringInputs.postMissionDisposalYears}
                  onChange={(e) => setScoringInputs({ ...scoringInputs, postMissionDisposalYears: parseInt(e.target.value) })}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0 - 1 Yr (Zero Debris Target)</span>
                  <span className="text-emerald-400">5 Yrs (FCC Mandate)</span>
                  <span className="text-amber-400">25 Yrs (Legacy IADC)</span>
                </div>
              </div>

              {/* Toggles: Subsystem Features (Debris Risk & Collision Avoidance) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase block">
                  3 & 5. Spacecraft Engineering Features:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'passivationReadiness', label: 'Passivation Circuit Ready', desc: 'Vents residual fuel & isolates batteries at EOL' },
                    { key: 'nonFragmentationDesign', label: 'Design for Demise (D4D)', desc: 'Zero explosive bolts or intentional release debris' },
                    { key: 'debrisShielding', label: 'Whipple Debris Shielding', desc: 'Protects critical bus against < 1 cm micro-debris' },
                    { key: 'autonomousAvoidance', label: 'Autonomous Collision Avoidance', desc: 'Automated screening & thruster maneuver execution' },
                    { key: 'trackabilityAssistance', label: 'Laser Retroreflectors / Transponder', desc: 'Precision ground radar & laser ranging visibility' }
                  ].map((feat) => {
                    const isChecked = (scoringInputs as any)[feat.key];
                    return (
                      <div
                        key={feat.key}
                        onClick={() => {
                          setScoringInputs({ ...scoringInputs, [feat.key]: !isChecked });
                          audioService.playBlip();
                        }}
                        className={`p-2.5 rounded border cursor-pointer transition-all flex items-start gap-2.5 ${
                          isChecked
                            ? 'border-cyan-500/60 bg-cyan-950/40 text-slate-200'
                            : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="mt-0.5 accent-cyan-400"
                        />
                        <div>
                          <div className="font-bold text-xs">{feat.label}</div>
                          <div className="text-[10px] text-slate-500 leading-tight">{feat.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Live Score Card & Individual Parameters */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-xl border border-emerald-500/40 bg-slate-900/80 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Calculated Sustainability Breakdown
                </span>
                <span className="text-xs font-mono font-bold text-slate-200">
                  TOTAL: {ssrScore.totalScore} / 100
                </span>
              </div>

              {/* Big Score Gauge Meter */}
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center space-y-2">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">
                  Space Sustainability Rating
                </div>
                <div className="text-4xl font-black text-slate-100 font-mono">
                  {ssrScore.totalScore} <span className="text-lg text-slate-500 font-normal">/ 100</span>
                </div>
                <div>{getTierBadge(ssrScore.tier)}</div>

                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-amber-500 via-blue-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${ssrScore.totalScore}%` }}
                  />
                </div>
              </div>

              {/* 6 Individual Parameter Breakdown Bars */}
              <div className="space-y-2.5">
                {[
                  { label: '1. Orbital Congestion (Region)', score: ssrScore.orbitalCongestion, max: 18, desc: 'Operating altitude debris density & collision risk' },
                  { label: '2. End-of-Life Disposal Planning', score: ssrScore.endOfLifeDisposal, max: 18, desc: 'Controlled re-entry & passivation readiness' },
                  { label: '3. Debris Generation Mitigation', score: ssrScore.debrisGenerationRisk, max: 16, desc: 'Whipple shielding & design for demise' },
                  { label: '4. Mission Lifetime Strategy', score: ssrScore.missionLifetimeStrategy, max: 16, desc: 'Post-mission orbital residence duration' },
                  { label: '5. Collision Avoidance Readiness', score: ssrScore.collisionAvoidancePreparedness, max: 16, desc: 'Autonomous propulsion & trackability aids' },
                  { label: '6. Mitigation Guideline Adherence', score: ssrScore.guidelineCompliance, max: 16, desc: `Compliance with ${scoringInputs.guidelineStandard}` }
                ].map((param) => {
                  const pct = Math.round((param.score / param.max) * 100);
                  return (
                    <div key={param.label} className="p-2.5 rounded bg-slate-950 border border-slate-800/80 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-300">{param.label}</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {param.score} / {param.max}
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500">{param.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MISSION COMPARISON MATRIX */}
      {activeTab === 'COMPARISON' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  Mission Sustainability Comparison Matrix
                </h2>
                <span className="text-[11px] text-slate-400">
                  Compare two space missions side-by-side across all 6 orbital sustainability scoring criteria
                </span>
              </div>

              {/* Mission Pickers */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Mission A:</span>
                  <select
                    value={compareMissionAId}
                    onChange={(e) => setCompareMissionAId(e.target.value)}
                    className="p-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono"
                  >
                    {SAMPLE_MISSIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.totalScore}/100)
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-slate-600 font-bold self-end pb-1.5">VS</span>

                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Mission B:</span>
                  <select
                    value={compareMissionBId}
                    onChange={(e) => setCompareMissionBId(e.target.value)}
                    className="p-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono"
                  >
                    {SAMPLE_MISSIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.totalScore}/100)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Side-by-Side Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mission A Card */}
              <div className="p-4 rounded-xl border border-cyan-500/40 bg-slate-950 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase">MISSION ALPHA</span>
                    <h3 className="text-base font-bold text-slate-100">{missionA.name}</h3>
                    <div className="text-[11px] text-slate-400">
                      {missionA.operator} &bull; {missionA.country} &bull; {missionA.altitudeKm} km
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-cyan-300 font-mono">{missionA.totalScore}</span>
                    <span className="text-xs text-slate-500"> / 100</span>
                    <div className="mt-0.5">{getTierBadge(missionA.tier)}</div>
                  </div>
                </div>

                {/* 6 Parameter Bars for Mission A */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                  {[
                    { label: 'Orbital Congestion', val: missionA.scores.orbitalCongestion, max: 18 },
                    { label: 'EOL Disposal Planning', val: missionA.scores.endOfLifeDisposal, max: 18 },
                    { label: 'Debris Generation Risk', val: missionA.scores.debrisGenerationRisk, max: 16 },
                    { label: 'Mission Lifetime Strategy', val: missionA.scores.missionLifetimeStrategy, max: 16 },
                    { label: 'Collision Preparedness', val: missionA.scores.collisionAvoidancePreparedness, max: 16 },
                    { label: 'Guideline Compliance', val: missionA.scores.guidelineCompliance, max: 16 }
                  ].map((p) => (
                    <div key={p.label} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{p.label}</span>
                      <strong className="text-cyan-400 font-mono">{p.val}/{p.max}</strong>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Disposal Strategy:</span>
                  <p className="text-[11px] text-slate-300">{missionA.disposalStrategy}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex gap-2">
                  <button
                    onClick={() => onNavigateToSatellite?.(mapMissionToObjectId(missionA.id))}
                    className="flex-1 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold transition-colors"
                  >
                    Inspect Fleet Profile
                  </button>
                  <button
                    onClick={() => onNavigateToTracker?.(mapMissionToObjectId(missionA.id))}
                    className="py-1 px-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] transition-colors"
                  >
                    3D View
                  </button>
                </div>
              </div>

              {/* Mission B Card */}
              <div className="p-4 rounded-xl border border-red-500/40 bg-slate-950 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-red-400 uppercase">MISSION BETA</span>
                    <h3 className="text-base font-bold text-slate-100">{missionB.name}</h3>
                    <div className="text-[11px] text-slate-400">
                      {missionB.operator} &bull; {missionB.country} &bull; {missionB.altitudeKm} km
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-red-300 font-mono">{missionB.totalScore}</span>
                    <span className="text-xs text-slate-500"> / 100</span>
                    <div className="mt-0.5">{getTierBadge(missionB.tier)}</div>
                  </div>
                </div>

                {/* 6 Parameter Bars for Mission B */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                  {[
                    { label: 'Orbital Congestion', val: missionB.scores.orbitalCongestion, max: 18 },
                    { label: 'EOL Disposal Planning', val: missionB.scores.endOfLifeDisposal, max: 18 },
                    { label: 'Debris Generation Risk', val: missionB.scores.debrisGenerationRisk, max: 16 },
                    { label: 'Mission Lifetime Strategy', val: missionB.scores.missionLifetimeStrategy, max: 16 },
                    { label: 'Collision Preparedness', val: missionB.scores.collisionAvoidancePreparedness, max: 16 },
                    { label: 'Guideline Compliance', val: missionB.scores.guidelineCompliance, max: 16 }
                  ].map((p) => (
                    <div key={p.label} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{p.label}</span>
                      <strong className="text-red-400 font-mono">{p.val}/{p.max}</strong>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Disposal Strategy:</span>
                  <p className="text-[11px] text-slate-300">{missionB.disposalStrategy}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex gap-2">
                  <button
                    onClick={() => onNavigateToSatellite?.(mapMissionToObjectId(missionB.id))}
                    className="flex-1 py-1 rounded bg-red-950/70 hover:bg-red-900/80 border border-red-500/40 text-red-300 text-[10px] font-bold transition-colors"
                  >
                    Inspect Fleet Profile
                  </button>
                  <button
                    onClick={() => onNavigateToTracker?.(mapMissionToObjectId(missionB.id))}
                    className="py-1 px-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] transition-colors"
                  >
                    3D View
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MISSION SUSTAINABILITY LEADERBOARD */}
      {activeTab === 'LEADERBOARD' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  Mission Sustainability Leaderboard
                </h2>
                <span className="text-[11px] text-slate-400">
                  Global ranking of real and benchmark spacecraft evaluated by the Space Sustainability Rating model
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Mission Name</th>
                    <th className="p-3">Operator</th>
                    <th className="p-3">Regime</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Certification Tier</th>
                    <th className="p-3">Disposal Method</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-[11px]">
                  {[...SAMPLE_MISSIONS]
                    .sort((a, b) => b.totalScore - a.totalScore)
                    .map((m, index) => (
                      <tr key={m.id} className="hover:bg-slate-950/60 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-400">#{index + 1}</td>
                        <td className="p-3 font-bold text-slate-100">{m.name}</td>
                        <td className="p-3 text-slate-300">{m.operator}</td>
                        <td className="p-3 font-mono text-cyan-400">{m.altitudeKm} km</td>
                        <td className="p-3 font-mono font-black text-slate-100 text-sm">
                          {m.totalScore} <span className="text-[10px] text-slate-500 font-normal">/100</span>
                        </td>
                        <td className="p-3">{getTierBadge(m.tier)}</td>
                        <td className="p-3 text-slate-400 text-[10px] max-w-xs truncate" title={m.disposalStrategy}>
                          {m.disposalStrategy}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onNavigateToTracker?.(mapMissionToObjectId(m.id))}
                            className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold transition-colors inline-flex items-center gap-1 shadow-sm"
                          >
                            <Compass className="w-3 h-3 text-cyan-400" />
                            <span>Track 3D</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ORBITAL CONGESTION HEATMAP */}
      {activeTab === 'CONGESTION' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                Orbital Congestion & Carrying Capacity Heatmap
              </h2>
              <span className="text-[11px] text-slate-400">
                Spatial density and debris-to-active ratios across key orbital shells from 200 km to 36,000 km
              </span>
            </div>

            {/* Heatmap Bands */}
            <div className="space-y-3">
              {ORBITAL_CONGESTION_HEATMAP_DATA.map((band) => {
                const isCritical = band.densityLevel === 'CRITICAL';
                const isHigh = band.densityLevel === 'HIGH';
                const isModerate = band.densityLevel === 'MODERATE';

                const badgeBg = isCritical
                  ? 'bg-red-950 text-red-400 border-red-500/50'
                  : isHigh
                  ? 'bg-orange-950 text-orange-400 border-orange-500/50'
                  : isModerate
                  ? 'bg-amber-950 text-amber-400 border-amber-500/50'
                  : 'bg-emerald-950 text-emerald-400 border-emerald-500/50';

                return (
                  <div
                    key={band.regime}
                    className={`p-4 rounded-xl border transition-all ${
                      isCritical
                        ? 'border-red-500/50 bg-red-950/20'
                        : isHigh
                        ? 'border-orange-500/40 bg-orange-950/15'
                        : 'border-slate-800 bg-slate-950/70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-xs text-slate-100">{band.regime}</h3>
                          <span className={`px-2 py-0.2 rounded text-[9px] font-bold border ${badgeBg}`}>
                            {band.densityLevel} DENSITY
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{band.altitudeRange}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase">Tracked Objects</span>
                          <strong className="text-slate-200">{band.objectsCount.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase">Debris Ratio</span>
                          <strong className={isCritical ? 'text-red-400' : 'text-slate-300'}>
                            {Math.round((band.debrisCount / band.objectsCount) * 100)}%
                          </strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase">Congestion Index</span>
                          <strong className={isCritical ? 'text-red-400' : 'text-emerald-400'}>
                            {band.congestionIndex}/100
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-3">
                      <div
                        className={`h-full ${
                          isCritical ? 'bg-red-500' : isHigh ? 'bg-orange-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${band.congestionIndex}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{band.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DEBRIS GROWTH & KESSLER TRENDS */}
      {activeTab === 'TRENDS' && (
        <div className="space-y-6">
          {/* Historical Growth Chart */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Historical Debris Accumulation (1960 - 2026)
                </h2>
                <span className="text-[11px] text-slate-400">
                  Trackable objects in orbit documented since the dawn of the space age
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={HISTORICAL_DEBRIS_TRENDS} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="debHistGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="debris" name="Cataloged Debris" stroke="#ef4444" fill="url(#debHistGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="active" name="Active Satellites" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Kessler Projection Simulator (2026 - 2060) */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Kessler Syndrome Runaway Cascade Simulator (2026 - 2060)
                </h2>
                <span className="text-[11px] text-slate-400">
                  Model runaway fragmentation tipping points under configurable launch and removal scenarios
                </span>
              </div>

              {/* Scenario Presets */}
              <div className="flex flex-wrap gap-1 text-[10px]">
                <button
                  onClick={() => handleApplyPreset('BAU')}
                  className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-slate-300 hover:text-white"
                >
                  Business-As-Usual (BAU)
                </button>
                <button
                  onClick={() => handleApplyPreset('CLEAN')}
                  className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold"
                >
                  98% Deorbit + ADR
                </button>
                <button
                  onClick={() => handleApplyPreset('MEGA')}
                  className="px-2.5 py-1 rounded bg-blue-950 border border-blue-500/50 text-blue-300"
                >
                  Megaconstellation Expansion
                </button>
                <button
                  onClick={() => handleApplyPreset('ASAT')}
                  className="px-2.5 py-1 rounded bg-red-950 border border-red-500/50 text-red-300 font-bold"
                >
                  Kinetic ASAT Strike
                </button>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kesslerData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="debrisFragments" name="Projected Debris" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="activeSatellites" name="Active Constellations" stroke="#06b6d4" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="leosUsabilityScore" name="LEO Usability Score (0-100)" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: FUTURE OF SUSTAINABLE SPACE & RECOMMENDATIONS */}
      {activeTab === 'FUTURE' && (
        <div className="space-y-6">
          {/* Educational Showcase: 4 Pillars of Future Space */}
          <div className="p-5 rounded-xl border border-cyan-500/30 bg-slate-900/80 backdrop-blur-md space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                Aerospace Strategic Briefing
              </span>
              <h2 className="text-lg font-bold text-slate-100 uppercase">
                The Future of Sustainable Space
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Protecting Earth's orbital commons through technological innovation, active debris remediation, and multilateral cooperation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pillar 1 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase">
                  <Flame className="w-4 h-4 text-orange-400" />
                  1. Responsible Launch Practices
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Historically, spent rocket upper stages accounted for major on-orbit explosion events due to unvented hypergolic fuels. Modern responsible launch architectures mandate direct controlled deorbiting of upper stages during the launch sequence itself, green non-toxic propellants, and the elimination of mission-related debris such as yo-yo despin weights, lens caps, and clamp bands.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  2. Satellite End-of-Life Disposal
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Moving beyond legacy 25-year guidelines, the aerospace standard is now the FCC 5-Year Deorbit Mandate and the ESA Zero Debris 2030 target (&lt; 1 year). Spacecraft must employ "Design for Demise" (D4D) alloys ensuring 100% atmospheric burnup, or direct propulsion into the South Pacific Uninhabited Area. For GEO assets, supersynchronous boost into the designated IADC graveyard orbit (+300 km) is strictly required.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  3. Active Debris Removal (ADR)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Scientific consensus (NASA Liou-Johnson criteria) shows that even 100% post-mission disposal compliance cannot prevent long-term debris growth because massive derelict rocket bodies already in orbit will continue colliding. Actively capturing and removing just 5 to 10 massive derelict bodies per year using robotic arms, harpoons, magnetic capture plates, and deorbit drag sails can stabilize the LEO collision environment.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase">
                  <Globe2 className="w-4 h-4 text-blue-400" />
                  4. International Cooperation & Transparency
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Orbital sustainability requires global governance: transparent Space Situational Awareness (SSA) sharing, universal adherence to the UN COPUOS Space Debris Mitigation Guidelines, the Space Sustainability Rating (SSR) developed by EPFL and the World Economic Forum, and multilateral bans on destructive kinetic Anti-Satellite (ASAT) missile testing.
                </p>
              </div>
            </div>
          </div>

          {/* Actionable Recommendations Section */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Recommendations for Responsible Satellite Operations
              </h2>
              <span className="text-[11px] text-slate-400">
                Actionable engineering and mission design recommendations to achieve elite sustainability ratings
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SUSTAINABILITY_RECOMMENDATIONS.map((rec) => (
                <div key={rec.title} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">{rec.category}</span>
                    <Badge label={rec.impact} variant={rec.badgeVariant} />
                  </div>
                  <h3 className="font-bold text-xs text-slate-200">{rec.title}</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{rec.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
