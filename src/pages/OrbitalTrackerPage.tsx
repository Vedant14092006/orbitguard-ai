import React, { useState } from 'react';
import { OrbitalGlobe, OrbitalFilters } from '../components/3d/OrbitalGlobe';
import { MOCK_SATELLITES } from '../data/mockSatellites';
import { MOCK_DEBRIS } from '../data/mockDebris';
import { REAL_TLE_CATALOG } from '../data/realTleData';
import { OrbitalObject } from '../types/orbit';
import {
  Globe,
  Target,
  ShieldAlert,
  Compass,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Database,
  Satellite,
  Trash2,
  Bot
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { audioService } from '../services/audioService';

interface OrbitalTrackerPageProps {
  initialObjectId?: string | null;
  onNavigateToSatellite?: (id: string) => void;
  onNavigateToDebris?: (id: string) => void;
  onNavigateToAssistant?: (prompt?: string) => void;
}

export const OrbitalTrackerPage: React.FC<OrbitalTrackerPageProps> = ({
  initialObjectId,
  onNavigateToSatellite,
  onNavigateToDebris,
  onNavigateToAssistant
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(initialObjectId || 'sat-starlink-5120');
  const [searchQuery, setSearchQuery] = useState('');
  const [provenanceFilter, setProvenanceFilter] = useState<'ALL' | 'REAL_TLE' | 'SIMULATED'>('ALL');

  React.useEffect(() => {
    if (initialObjectId) {
      setSelectedId(initialObjectId);
    }
  }, [initialObjectId]);

  // Interactive Filter Toggles
  const [filters, setFilters] = useState<OrbitalFilters>({
    showActive: true,
    showInactive: true,
    showDebris: true,
    showHighRiskOnly: false,
    showOrbits: true,
    showShells: true
  });

  const allObjects = [...MOCK_SATELLITES, ...MOCK_DEBRIS];
  const selectedObj = allObjects.find((o) => o.id === selectedId) || MOCK_SATELLITES[0];

  const filteredList = allObjects.filter((o) => {
    const isRealTle = REAL_TLE_CATALOG.some((t) => t.noradId === o.noradId);
    if (provenanceFilter === 'REAL_TLE' && !isRealTle) return false;
    if (provenanceFilter === 'SIMULATED' && isRealTle) return false;

    if (filters.showHighRiskOnly && o.riskLevel !== 'CRITICAL' && o.riskLevel !== 'HIGH') {
      return false;
    }
    if (o.type === 'SATELLITE') {
      if (o.status === 'ACTIVE' && !filters.showActive) return false;
      if (o.status === 'INACTIVE' && !filters.showInactive) return false;
    }
    if ((o.type === 'DEBRIS' || o.type === 'ROCKET_BODY') && !filters.showDebris) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        o.name.toLowerCase().includes(q) ||
        o.noradId.toString().includes(q) ||
        o.operator.toLowerCase().includes(q) ||
        o.country.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSelect = (obj: OrbitalObject | null) => {
    if (obj) {
      setSelectedId(obj.id);
      audioService.playBlip();
    }
  };

  return (
    <div className="space-y-4 font-mono pb-8">
      {/* Top Banner / Disclaimer HUD */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 p-4 rounded-lg border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h1 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              3D Interactive Orbital Tracker (WebGL 60FPS)
            </h1>
            <Badge label="ANALYTICAL SGP4 MODEL" variant="emerald" />
          </div>
          <p className="text-[11px] text-slate-400 max-w-2xl">
            Simulated numerical Keplerian propagation. Demo IDs (e.g. 99101, 99204) are test assets; real NORAD catalog objects are verified against observation TLE epoch 2026.
          </p>
        </div>

        {/* Global Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => {
              setFilters((prev) => ({ ...prev, showActive: !prev.showActive }));
              audioService.playBlip();
            }}
            className={`px-3 py-1.5 rounded transition-all text-[11px] font-bold ${
              filters.showActive
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-slate-300'
            }`}
          >
            Active Satellites
          </button>

          <button
            onClick={() => {
              setFilters((prev) => ({ ...prev, showInactive: !prev.showInactive }));
              audioService.playBlip();
            }}
            className={`px-3 py-1.5 rounded transition-all text-[11px] font-bold ${
              filters.showInactive
                ? 'bg-amber-950 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-slate-300'
            }`}
          >
            Inactive Satellites
          </button>

          <button
            onClick={() => {
              setFilters((prev) => ({ ...prev, showDebris: !prev.showDebris }));
              audioService.playBlip();
            }}
            className={`px-3 py-1.5 rounded transition-all text-[11px] font-bold ${
              filters.showDebris
                ? 'bg-orange-950 text-orange-300 border border-orange-500/60 shadow-[0_0_10px_rgba(249,115,22,0.2)]'
                : 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-slate-300'
            }`}
          >
            Space Debris (Red/Orange/White)
          </button>

          <button
            onClick={() => {
              setFilters((prev) => ({ ...prev, showHighRiskOnly: !prev.showHighRiskOnly }));
              audioService.playAlarm();
            }}
            className={`px-3 py-1.5 rounded transition-all text-[11px] font-bold flex items-center gap-1.5 ${
              filters.showHighRiskOnly
                ? 'bg-red-950 text-red-300 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse'
                : 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-red-400'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>High-Risk Objects Only</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas + Sidebar Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Full 3D WebGL Canvas */}
        <div className="lg:col-span-8 xl:col-span-9 relative">
          <OrbitalGlobe
            selectedObjectId={selectedId}
            onSelectObject={handleSelect}
            fullHeight={true}
            externalFilters={filters}
            onFilterChange={setFilters}
          />
        </div>

        {/* Right Side: Target Telemetry Details + Filtered Fleet */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          {/* Target Telemetry Card */}
          <div className="rounded-lg border border-cyan-500/30 bg-slate-900/80 p-4 backdrop-blur-md space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Target Telemetry Lock
                </span>
              </div>
              <Badge
                label={selectedObj.riskLevel}
                variant={
                  selectedObj.riskLevel === 'CRITICAL'
                    ? 'red'
                    : selectedObj.riskLevel === 'HIGH'
                    ? 'amber'
                    : 'emerald'
                }
                pulse={selectedObj.riskLevel === 'CRITICAL'}
              />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-100">{selectedObj.name}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                {REAL_TLE_CATALOG.some((t) => t.noradId === selectedObj.noradId) ? (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 uppercase font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    NORAD #{selectedObj.noradId} (CELESTRAK SGP4 VERIFIED)
                  </span>
                ) : selectedObj.isSimulated ? (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/40 uppercase font-bold">
                    DEMO ID: #{selectedObj.noradId} (SIMULATED TESTBED)
                  </span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-500/40 uppercase font-bold">
                    NORAD TLE: #{selectedObj.noradId} (REAL OBSERVATION)
                  </span>
                )}
              </div>
            </div>

            {/* Keplerian Elements Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">ALTITUDE</span>
                <strong className="text-cyan-400 font-bold">{selectedObj.altitude} km</strong>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">VELOCITY</span>
                <strong className="text-slate-200 font-bold">{selectedObj.velocity} km/s</strong>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">INCLINATION</span>
                <strong className="text-slate-200 font-bold">{selectedObj.inclination}&deg;</strong>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">MISSION STATUS</span>
                <strong
                  className={
                    selectedObj.status === 'ACTIVE'
                      ? 'text-emerald-400 font-bold'
                      : selectedObj.status === 'FRAGMENTED'
                      ? 'text-red-400 font-bold'
                      : 'text-amber-400 font-bold'
                  }
                >
                  {selectedObj.status}
                </strong>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Operator:</span>
                <span className="text-slate-200 font-semibold truncate max-w-[170px]">
                  {selectedObj.operator}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Country:</span>
                <span className="text-slate-300">{selectedObj.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Data Source:</span>
                <span className="text-cyan-400 font-mono text-[10px]">
                  {REAL_TLE_CATALOG.some((t) => t.noradId === selectedObj.noradId)
                    ? 'CelesTrak GP (SGP4)'
                    : 'Keplerian Testbed'}
                </span>
              </div>
              {selectedObj.ssrRating && (
                <div className="flex justify-between">
                  <span className="text-slate-500">SSR Score:</span>
                  <span className="text-cyan-400 font-bold">{selectedObj.ssrRating} / 100</span>
                </div>
              )}
            </div>

            {/* Cross-Module Navigation Actions */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
              {selectedObj.type === 'SATELLITE' ? (
                <button
                  onClick={() => onNavigateToSatellite?.(selectedObj.id)}
                  className="w-full py-1.5 rounded bg-blue-950/70 hover:bg-blue-900/80 border border-blue-500/40 text-blue-300 hover:text-blue-100 text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Satellite className="w-3.5 h-3.5" />
                  <span>Open Fleet Health Monitor</span>
                </button>
              ) : (
                <button
                  onClick={() => onNavigateToDebris?.(selectedObj.id)}
                  className="w-full py-1.5 rounded bg-orange-950/70 hover:bg-orange-900/80 border border-orange-500/40 text-orange-300 hover:text-orange-100 text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Inspect in Debris Explorer</span>
                </button>
              )}

              <button
                onClick={() =>
                  onNavigateToAssistant?.(
                    `Analyze orbital safety and conjunction risks for ${selectedObj.name} (NORAD #${selectedObj.noradId}) at altitude ${selectedObj.altitude} km.`
                  )
                }
                className="w-full py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-[11px] transition-colors flex items-center justify-center gap-1.5"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Ask ASTRA AI to Analyze</span>
              </button>
            </div>
          </div>

          {/* Quick Selection Fleet List */}
          <div className="rounded-lg border border-cyan-500/20 bg-slate-900/60 p-3 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Filtered Objects ({filteredList.length})
              </span>
              <span className="text-[9px] text-slate-500">CLICK TO LOCK</span>
            </div>

            {/* Provenance Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded bg-slate-950 border border-slate-800 text-[10px]">
              <button
                onClick={() => {
                  setProvenanceFilter('ALL');
                  audioService.playBlip();
                }}
                className={`py-1 rounded font-bold transition-colors ${
                  provenanceFilter === 'ALL'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({allObjects.length})
              </button>
              <button
                onClick={() => {
                  setProvenanceFilter('REAL_TLE');
                  audioService.playBlip();
                }}
                className={`py-1 rounded font-bold transition-colors ${
                  provenanceFilter === 'REAL_TLE'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Real TLEs
              </button>
              <button
                onClick={() => {
                  setProvenanceFilter('SIMULATED');
                  audioService.playBlip();
                }}
                className={`py-1 rounded font-bold transition-colors ${
                  provenanceFilter === 'SIMULATED'
                    ? 'bg-purple-950 text-purple-300 border border-purple-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Simulated
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, NORAD..."
                className="w-full pl-8 pr-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {filteredList.length === 0 ? (
                <div className="p-4 text-center text-[11px] text-slate-500 font-mono space-y-1">
                  <div>No orbital objects found matching query</div>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setProvenanceFilter('ALL');
                    }}
                    className="text-cyan-400 hover:underline text-[10px]"
                  >
                    Reset Search
                  </button>
                </div>
              ) : (
                filteredList.map((obj) => {
                  const isReal = REAL_TLE_CATALOG.some((t) => t.noradId === obj.noradId);
                  return (
                    <button
                      key={obj.id}
                      onClick={() => handleSelect(obj)}
                      className={`w-full flex items-center justify-between p-2 rounded text-left text-xs transition-colors ${
                        selectedId === obj.id
                          ? 'bg-cyan-950/80 border border-cyan-500/60 text-cyan-300'
                          : 'hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-semibold truncate">{obj.name}</div>
                        <div className="text-[10px] text-slate-500">
                          #{obj.noradId} &bull; {obj.altitude} km &bull; {obj.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`text-[8px] px-1 py-0.2 rounded uppercase font-bold ${
                            isReal
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                              : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {isReal ? 'SGP4' : 'SIM'}
                        </span>
                        <span
                          className={`text-[8px] px-1 py-0.2 rounded uppercase font-bold ${
                            obj.type === 'SATELLITE'
                              ? 'bg-blue-950 text-blue-400 border border-blue-500/30'
                              : 'bg-orange-950 text-orange-400 border border-orange-500/30'
                          }`}
                        >
                          {obj.type === 'SATELLITE' ? 'SAT' : 'DEB'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
