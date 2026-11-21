import React, { useState, useEffect } from 'react';
import { MOCK_DEBRIS } from '../data/mockDebris';
import { OrbitalObject } from '../types/orbit';
import {
  filterDebrisCatalog,
  sortDebrisCatalog,
  calculateADRScore,
  ADRFeasibility,
  DebrisSortField,
  SortOrder
} from '../services/debrisService';
import {
  Trash2,
  Search,
  Filter,
  AlertTriangle,
  Rocket,
  ShieldAlert,
  ArrowUpDown,
  Compass,
  X,
  Target,
  Wrench,
  CheckCircle2,
  Table,
  LayoutGrid,
  Info,
  Flame,
  Activity,
  TrendingUp,
  BarChart2,
  ExternalLink,
  Database,
  Globe2,
  Sparkles
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { audioService } from '../services/audioService';
import { NASA_ODPO_RESEARCH_DATA } from '../services/realDataService';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

interface DebrisExplorerPageProps {
  initialObjectId?: string | null;
  onNavigateToTracker?: (id: string) => void;
  onNavigateToAssistant?: (prompt?: string) => void;
}

export const DebrisExplorerPage: React.FC<DebrisExplorerPageProps> = ({
  initialObjectId,
  onNavigateToTracker,
  onNavigateToAssistant
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [altitudeBand, setAltitudeBand] = useState('ALL');
  const [rcsFilter, setRcsFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<DebrisSortField>('risk');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedObjectModal, setSelectedObjectModal] = useState<OrbitalObject | null>(null);
  const [selectedADR, setSelectedADR] = useState<ADRFeasibility | null>(null);

  useEffect(() => {
    if (initialObjectId) {
      const match = MOCK_DEBRIS.find(
        (d) => d.id === initialObjectId || d.noradId.toString() === initialObjectId
      );
      if (match) {
        setSelectedObjectModal(match);
      } else {
        setSearchQuery(initialObjectId);
      }
    }
  }, [initialObjectId]);

  const filteredDebris = filterDebrisCatalog(
    MOCK_DEBRIS,
    searchQuery,
    altitudeBand,
    rcsFilter,
    typeFilter
  );

  const sortedDebris = sortDebrisCatalog(filteredDebris, sortBy, sortOrder);

  const handleSortToggle = (field: DebrisSortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    audioService.playBlip();
  };

  const handleOpenADR = (obj: OrbitalObject, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const adr = calculateADRScore(obj);
    setSelectedADR(adr);
    audioService.playBlip();
  };

  const handleOpenInspector = (obj: OrbitalObject) => {
    setSelectedObjectModal(obj);
    audioService.playBlip();
  };

  // Recharts Data: Debris Altitude Distribution
  const altitudeChartData = [
    { band: 'VLEO (<450km)', count: 2400 },
    { band: 'LEO Low (450-700km)', count: 12200 },
    { band: 'LEO Peak (700-1000km)', count: 16800 },
    { band: 'Upper LEO (1000-2000km)', count: 3400 },
    { band: 'MEO (2k-35k km)', count: 850 },
    { band: 'GEO (~35786km)', count: 1850 }
  ];

  // Recharts Data: Debris by Object Type
  const typePieData = [
    { name: 'Fragmentation Shrapnel', value: 23200, color: '#ef4444' },
    { name: 'Spent Rocket Bodies', value: 8700, color: '#f97316' },
    { name: 'Defunct Satellites', value: 3600, color: '#eab308' },
    { name: 'Mission Hardware', value: 1000, color: '#38bdf8' }
  ];


  return (
    <div className="space-y-6 font-mono pb-16">
      {/* Top Banner */}
      <div className="rounded-lg border border-orange-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge label="SPACE DEBRIS CATALOG (LEO/MEO/GEO)" variant="amber" pulse />
            <Badge label="36,500 TRACKED OBJECTS" variant="slate" />
            <Badge label="SPACE-TRACK REST API READY" variant="cyan" />
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-100 tracking-wider uppercase">
            ORBITAL DEBRIS EXPLORER & ADVANCED SURVEILLANCE
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Surveillance of hypervelocity fragmentation clouds, spent upper rocket stages, and derelict payloads. Evaluates collision cross-sections, orbital decay lifetimes, and Active Debris Removal (ADR) feasibility.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded bg-orange-950/40 border border-orange-500/30 text-right">
            <span className="text-[10px] text-orange-400 block font-bold">CRITICAL DEBRIS RISK</span>
            <span className="text-xl font-bold text-slate-100 font-mono">1,000,000+</span>
            <span className="text-[9px] text-slate-500 block">Lethal &gt;1cm Fragments</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Debris by Altitude Band */}
        <div className="lg:col-span-7 rounded-lg border border-cyan-500/20 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              Debris Spatial Distribution by Altitude Band
            </h3>
            <span className="text-[10px] text-slate-400">GLOBAL ESTIMATES</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={altitudeChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="band" stroke="#64748b" tick={{ fontSize: 9 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#030712', borderColor: '#f97316', borderRadius: '4px' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" name="Cataloged Objects" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Debris Breakdown by Object Type */}
        <div className="lg:col-span-5 rounded-lg border border-cyan-500/20 bg-slate-900/60 p-4 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              Orbital Debris Breakdown by Type
            </h3>
            <span className="text-[10px] text-slate-400">PERCENTAGE</span>
          </div>

          <div className="h-44 my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {typePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#030712', borderColor: '#06b6d4', borderRadius: '4px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-800">
            {typePieData.map((t, idx) => (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-slate-400 truncate">{t.name}:</span>
                <strong className="text-slate-200">{t.value.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter, Search, and Sort Toolbar */}
      <div className="p-4 rounded-lg border border-cyan-500/20 bg-slate-900/70 backdrop-blur-md space-y-3 shadow-lg">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search debris by name, NORAD ID, or launching country..."
              className="w-full pl-9 pr-4 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Altitude Filter */}
            <select
              value={altitudeBand}
              onChange={(e) => setAltitudeBand(e.target.value)}
              className="px-2.5 py-2 rounded bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-cyan-500/50"
            >
              <option value="ALL">All Orbit Altitudes</option>
              <option value="LEO">Low Earth Orbit (LEO)</option>
              <option value="MEO">Medium Earth Orbit (MEO)</option>
              <option value="GEO">Geostationary Orbit (GEO)</option>
              <option value="VLEO">Very Low Orbit (VLEO)</option>
            </select>

            {/* Object Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-2 rounded bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-cyan-500/50"
            >
              <option value="ALL">All Debris Types</option>
              <option value="ROCKET_BODY">Spent Rocket Bodies</option>
              <option value="FRAGMENT">Fragmentation Shrapnel</option>
              <option value="DEFUNCT_SAT">Defunct Satellites</option>
            </select>

            {/* RCS Size Filter */}
            <select
              value={rcsFilter}
              onChange={(e) => setRcsFilter(e.target.value)}
              className="px-2.5 py-2 rounded bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-cyan-500/50"
            >
              <option value="ALL">All RCS Sizes</option>
              <option value="SMALL">Small (&lt; 0.1 m²)</option>
              <option value="MEDIUM">Medium (0.1 - 1.0 m²)</option>
              <option value="LARGE">Large (&gt; 1.0 m²)</option>
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as DebrisSortField)}
              className="px-2.5 py-2 rounded bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-cyan-500/50"
            >
              <option value="risk">Sort by: Collision Risk</option>
              <option value="altitude">Sort by: Altitude</option>
              <option value="velocity">Sort by: Velocity</option>
              <option value="id">Sort by: NORAD ID</option>
              <option value="name">Sort by: Object Name</option>
            </select>

            {/* Sort Order Toggle */}
            <button
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                audioService.playBlip();
              }}
              className="p-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
              title={`Sort: ${sortOrder === 'desc' ? 'Descending' : 'Ascending'}`}
            >
              <ArrowUpDown className="w-4 h-4 text-cyan-400" />
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded border border-slate-800 bg-slate-950 p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table' ? 'bg-cyan-950 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Table View"
              >
                <Table className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-cyan-950 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>Showing {sortedDebris.length} of {MOCK_DEBRIS.length} cataloged orbital debris items</span>
          <span>SGP4 ANALYTICAL PROPAGATOR SYNCED</span>
        </div>
      </div>


      {/* Main Debris Presentation: Table View or Grid View */}
      {viewMode === 'table' ? (
        <div className="rounded-lg border border-cyan-500/20 bg-slate-900/80 backdrop-blur-md overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/90 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th
                    onClick={() => handleSortToggle('id')}
                    className="p-3 cursor-pointer hover:text-cyan-300 transition-colors"
                  >
                    Object ID
                  </th>
                  <th
                    onClick={() => handleSortToggle('name')}
                    className="p-3 cursor-pointer hover:text-cyan-300 transition-colors"
                  >
                    Object Name
                  </th>
                  <th className="p-3">Type / Category</th>
                  <th
                    onClick={() => handleSortToggle('altitude')}
                    className="p-3 cursor-pointer hover:text-cyan-300 transition-colors"
                  >
                    Altitude (km)
                  </th>
                  <th className="p-3">Inclination</th>
                  <th
                    onClick={() => handleSortToggle('velocity')}
                    className="p-3 cursor-pointer hover:text-cyan-300 transition-colors"
                  >
                    Velocity (km/s)
                  </th>
                  <th className="p-3">Size / RCS</th>
                  <th
                    onClick={() => handleSortToggle('risk')}
                    className="p-3 cursor-pointer hover:text-cyan-300 transition-colors"
                  >
                    Risk Level
                  </th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-[11px]">
                {sortedDebris.map((deb) => (
                  <tr
                    key={deb.id}
                    onClick={() => handleOpenInspector(deb)}
                    className="hover:bg-slate-950/70 cursor-pointer transition-colors group"
                  >
                    <td className="p-3 font-mono text-cyan-400 font-semibold">
                      {deb.isSimulated ? `DEMO-${deb.noradId}` : deb.noradId}
                    </td>

                    <td className="p-3 font-bold text-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[200px]">{deb.name}</span>
                        {deb.isSimulated ? (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30 uppercase font-semibold">
                            Simulated
                          </span>
                        ) : (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-blue-950/80 text-blue-300 border border-blue-500/30 uppercase font-semibold">
                            Real TLE
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <Badge
                        label={deb.type === 'ROCKET_BODY' ? 'ROCKET BODY' : 'FRAGMENT'}
                        variant={deb.type === 'ROCKET_BODY' ? 'amber' : 'red'}
                        size="xs"
                      />
                    </td>

                    <td className="p-3 font-mono text-orange-400 font-semibold">
                      {deb.altitude.toLocaleString()} km
                    </td>

                    <td className="p-3 text-slate-300 font-mono">
                      {deb.inclination.toFixed(1)}&deg;
                    </td>

                    <td className="p-3 text-slate-200 font-mono">
                      {deb.velocity.toFixed(2)} km/s
                    </td>

                    <td className="p-3 text-slate-300">
                      <span className="font-bold">{deb.rcsSize}</span>
                      <span className="text-slate-500 text-[10px] ml-1">({deb.rcs} m²)</span>
                    </td>

                    <td className="p-3">
                      <Badge
                        label={deb.riskLevel}
                        variant={
                          deb.riskLevel === 'CRITICAL'
                            ? 'red'
                            : deb.riskLevel === 'HIGH'
                            ? 'amber'
                            : 'slate'
                        }
                        pulse={deb.riskLevel === 'CRITICAL'}
                        size="xs"
                      />
                    </td>

                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenADR(deb)}
                          className="px-2 py-1 rounded bg-orange-950/70 hover:bg-orange-900 border border-orange-500/40 text-orange-300 text-[10px] transition-colors flex items-center gap-1"
                          title="ADR Feasibility"
                        >
                          <Wrench className="w-3 h-3" />
                          <span className="hidden sm:inline">ADR</span>
                        </button>
                        <button
                          onClick={() => onNavigateToTracker?.(deb.id)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors flex items-center gap-1"
                          title="Track in 3D"
                        >
                          <Compass className="w-3 h-3 text-cyan-400" />
                          <span className="hidden sm:inline">3D</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sortedDebris.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500 font-mono">
                      <div className="flex flex-col items-center gap-2">
                        <Trash2 className="w-6 h-6 text-slate-600" />
                        <span>No orbital debris objects match the current filters.</span>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setAltitudeBand('ALL');
                            setRcsFilter('ALL');
                            setTypeFilter('ALL');
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                        >
                          Clear All Debris Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedDebris.length === 0 && (
            <div className="col-span-full p-12 text-center rounded-lg border border-slate-800 bg-slate-950/60 text-slate-500 font-mono space-y-2">
              <Trash2 className="w-6 h-6 text-slate-600 mx-auto" />
              <p>No orbital debris objects match the current filters.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setAltitudeBand('ALL');
                  setRcsFilter('ALL');
                  setTypeFilter('ALL');
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
              >
                Clear All Debris Filters
              </button>
            </div>
          )}
          {sortedDebris.map((deb) => (
            <div
              key={deb.id}
              onClick={() => handleOpenInspector(deb)}
              className="rounded-lg border border-slate-800 hover:border-orange-500/50 bg-slate-900/70 p-4 backdrop-blur-md transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      label={deb.type === 'ROCKET_BODY' ? 'ROCKET BODY' : 'FRAGMENT'}
                      variant={deb.type === 'ROCKET_BODY' ? 'amber' : 'red'}
                      size="xs"
                    />
                    <span className="text-[10px] text-slate-500">#{deb.noradId}</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-100 truncate max-w-[200px]">
                    {deb.name}
                  </h3>
                </div>
                <Badge
                  label={deb.riskLevel}
                  variant={deb.riskLevel === 'CRITICAL' ? 'red' : 'amber'}
                  pulse={deb.riskLevel === 'CRITICAL'}
                  size="xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">ALTITUDE</span>
                  <strong className="text-orange-400">{deb.altitude} km</strong>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">VELOCITY</span>
                  <strong className="text-slate-200">{deb.velocity} km/s</strong>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">INCLINATION</span>
                  <strong className="text-slate-200">{deb.inclination}&deg;</strong>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">KESSLER SCORE</span>
                  <strong className="text-red-400">{deb.kesslerIndex} / 100</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleOpenADR(deb)}
                  className="flex-1 py-1.5 rounded bg-orange-950/60 hover:bg-orange-900/60 border border-orange-500/40 text-orange-300 text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>ADR Feasibility</span>
                </button>
                <button
                  onClick={() => onNavigateToTracker?.(deb.id)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors flex items-center justify-center gap-1"
                  title="View in 3D"
                >
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>3D</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDUCATIONAL SITUATIONAL BRIEFING SECTION */}
      <div className="rounded-lg border border-red-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 space-y-4 shadow-2xl">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            AEROSPACE BRIEFING: THE THREAT OF ORBITAL DEBRIS ACCUMULATION
          </h2>
          <Badge label="KESSLER SYNDROME ADVISORY" variant="red" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Card 1: Hypervelocity Physics */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-red-400 text-xs uppercase">
              <Flame className="w-4 h-4 text-orange-400" />
              Hypervelocity Impact Physics
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Objects in Low Earth Orbit travel at relative velocities up to <strong>15 km/s (54,000 km/h)</strong>. Kinetic energy scales quadratically with velocity (Ek = 0.5 * m * v²). A 1cm aluminum fragment strikes with the destructive kinetic force of an exploding hand grenade. Microscopic 1mm paint flecks can crater space station windows and slice through pressurized spacesuits.
            </p>
          </div>

          {/* Card 2: The Kessler Cascade */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400 text-xs uppercase">
              <Activity className="w-4 h-4 text-amber-400" />
              Kessler Syndrome Cascade
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Proposed by NASA astrophysicist Donald J. Kessler, the critical density threshold occurs when debris generation by collision exceeds removal by atmospheric drag (dN/dt &gt; 0). In dense sun-synchronous bands (700-900 km), collisions trigger chain reactions of fragments—potentially locking humanity out of low orbits for generations.
            </p>
          </div>

          {/* Card 3: Threat to Global Missions */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-cyan-400 text-xs uppercase">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Threat to Critical Infrastructure
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Debris imperils crewed habitats like the International Space Station and Tiangong, which perform Pre-Planned Debris Avoidance Maneuvers (PDAMs). It also jeopardizes critical Earth observation, GPS positioning, weather forecasting, and mega-telecom constellations upon which global civilization depends.
            </p>
          </div>
        </div>
      </div>

      {/* NASA ORBITAL DEBRIS PROGRAM OFFICE (ODPO) RESEARCH SECTION */}
      <div className="rounded-lg border border-orange-500/30 bg-slate-900/60 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Globe2 className="w-5 h-5 text-orange-400" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  NASA ORBITAL DEBRIS PROGRAM OFFICE (ODPO) RESEARCH REGISTRY
                </h2>
                <Badge label="AUTHORITATIVE JSC REFERENCE" variant="amber" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                NASA Johnson Space Center Houston &bull; Breakup Models & Active Debris Removal (ADR)
              </p>
            </div>
          </div>

          <a
            href={NASA_ODPO_RESEARCH_DATA.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1 shrink-0 font-bold"
          >
            <span>orbitaldebris.jsc.nasa.gov</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* ODPO Models & Historical Events */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Breakup Equation & ADR Criteria */}
          <div className="lg:col-span-5 space-y-3">
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-cyan-400 block uppercase">
                NASA Standard Breakup Model (Johnson et al.)
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Empirical power-law characterizing cumulative fragment counts $N(L_c)$ for catastrophic hypervelocity collisions:
              </p>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-cyan-300 text-center font-bold text-xs">
                {NASA_ODPO_RESEARCH_DATA.standardBreakupModel.fragmentationPowerLaw}
              </div>
              <p className="text-[10px] text-slate-500">
                Where $M$ is total collision mass (kg) and $L_c$ is characteristic fragment length (meters).
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-orange-400 block uppercase">
                Liou-Johnson Active Debris Removal (ADR) Criteria
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {NASA_ODPO_RESEARCH_DATA.standardBreakupModel.adrTargetCriteria}
              </p>
            </div>
          </div>

          {/* Right: Major Historical Breakup Events Table */}
          <div className="lg:col-span-7">
            <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Year</th>
                    <th className="p-2.5">Incident</th>
                    <th className="p-2.5">Fragments</th>
                    <th className="p-2.5">Altitude</th>
                    <th className="p-2.5">Orbital Persistence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-[11px] text-slate-300">
                  {NASA_ODPO_RESEARCH_DATA.majorHistoricalBreakups.map((ev) => (
                    <tr key={ev.name} className="hover:bg-slate-900/40">
                      <td className="p-2.5 text-orange-400 font-bold">{ev.year}</td>
                      <td className="p-2.5">
                        <div className="font-semibold text-slate-100">{ev.name}</div>
                        <div className="text-[10px] text-slate-500">{ev.cause}</div>
                      </td>
                      <td className="p-2.5 text-red-400 font-bold">{ev.fragmentsCataloged.toLocaleString()}</td>
                      <td className="p-2.5">{ev.altitudeKm} km</td>
                      <td className="p-2.5 text-[10px] text-slate-400 max-w-[170px]">{ev.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED OBJECT INFORMATION MODAL */}
      {selectedObjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-xl border border-cyan-500/40 bg-slate-900 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-mono">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <h3 className="text-base font-bold text-slate-100">{selectedObjectModal.name}</h3>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {selectedObjectModal.isSimulated ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40 font-bold uppercase">
                      DEMO ID: #{selectedObjectModal.noradId} (SIMULATED)
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40 font-bold uppercase">
                      NORAD TLE: #{selectedObjectModal.noradId} (REAL OBSERVATION)
                    </span>
                  )}
                  <Badge
                    label={selectedObjectModal.riskLevel}
                    variant={selectedObjectModal.riskLevel === 'CRITICAL' ? 'red' : 'amber'}
                    pulse={selectedObjectModal.riskLevel === 'CRITICAL'}
                  />
                </div>
              </div>
              <button
                onClick={() => setSelectedObjectModal(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Keplerian Elements Readout */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">ALTITUDE</span>
                <strong className="text-orange-400 text-sm">{selectedObjectModal.altitude} km</strong>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">VELOCITY</span>
                <strong className="text-slate-200 text-sm">{selectedObjectModal.velocity} km/s</strong>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">INCLINATION</span>
                <strong className="text-slate-200 text-sm">{selectedObjectModal.inclination}&deg;</strong>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">PERIOD</span>
                <strong className="text-slate-200 text-sm">{selectedObjectModal.period} mins</strong>
              </div>
            </div>

            {/* Origin & Decay Status */}
            <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Origin Mission / Breakup:</span>
                <strong className="text-slate-200 truncate max-w-[280px]">{selectedObjectModal.operator}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Launching State:</span>
                <strong className="text-slate-300">{selectedObjectModal.country}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Launch Date:</span>
                <strong className="text-slate-300">{selectedObjectModal.launchDate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Atmospheric Decay Prediction:</span>
                <strong className="text-amber-400">{selectedObjectModal.decayForecast || 'Stable Multi-Decade Orbit'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kessler Hazard Contribution:</span>
                <strong className="text-red-400 font-bold">{selectedObjectModal.kesslerIndex} / 100</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={() => {
                  setSelectedObjectModal(null);
                  handleOpenADR(selectedObjectModal);
                }}
                className="w-full sm:flex-1 py-2.5 rounded bg-orange-950 hover:bg-orange-900 border border-orange-500/40 text-orange-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Wrench className="w-4 h-4" />
                <span>Calculate ADR</span>
              </button>

              <button
                onClick={() => {
                  setSelectedObjectModal(null);
                  onNavigateToTracker?.(selectedObjectModal.id);
                }}
                className="w-full sm:flex-1 py-2.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                <Compass className="w-4 h-4" />
                <span>Track 3D</span>
              </button>

              {onNavigateToAssistant && (
                <button
                  onClick={() => {
                    const obj = selectedObjectModal;
                    setSelectedObjectModal(null);
                    onNavigateToAssistant(
                      `Assess the orbital hazard, Kessler index, and active removal urgency for debris object "${obj.name}" (NORAD #${obj.noradId}, Altitude: ${obj.altitude} km, Kessler Index: ${obj.kesslerIndex}/100).`
                    );
                  }}
                  className="w-full sm:flex-1 py-2.5 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask ASTRA AI</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Debris Removal (ADR) Modal */}
      {selectedADR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-lg border border-orange-500/40 bg-slate-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Active Debris Removal (ADR) Feasibility Report
                </h3>
              </div>
              <button
                onClick={() => setSelectedADR(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">TARGET OBJECT:</span>
              <h4 className="text-base font-bold text-slate-100">{selectedADR.name}</h4>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">ADR PRIORITY SCORE</span>
                <span className="text-2xl font-bold text-orange-400">{selectedADR.priorityScore} / 100</span>
              </div>
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">EST. SERVICER FUEL</span>
                <span className="text-2xl font-bold text-cyan-400">{selectedADR.fuelEstimatedKg} kg</span>
              </div>
            </div>

            <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Capture Methodology:</span>
                <strong className="text-emerald-400">{selectedADR.captureMethod}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mission Risk Factor:</span>
                <strong className="text-amber-400">{selectedADR.riskFactor}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Environmental Benefit:</span>
                <strong className="text-slate-200">{selectedADR.economicImpact}</strong>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedADR(null)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
              >
                Close Report
              </button>
              <button
                onClick={() => {
                  audioService.playSuccess();
                  alert(`ADR Removal Sequence simulated for ${selectedADR.name}. Mission profile queued.`);
                  setSelectedADR(null);
                }}
                className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 text-xs text-white font-bold transition-colors flex items-center gap-1.5 shadow-[0_0_15px_rgba(249,115,22,0.4)]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulate ADR Mission Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
