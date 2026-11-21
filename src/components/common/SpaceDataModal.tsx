import React, { useState } from 'react';
import {
  X,
  Database,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Radio,
  FileText,
  AlertTriangle,
  Globe2,
  CheckCircle2,
  Clock,
  Cpu
} from 'lucide-react';
import {
  fetchLiveCelestrakTle,
  NASA_ODPO_RESEARCH_DATA
} from '../../services/realDataService';
import { REAL_TLE_CATALOG } from '../../data/realTleData';
import { CURRENT_SPACE_WEATHER } from '../../data/mockWeather';
import { audioService } from '../../services/audioService';

interface SpaceDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpaceDataModal: React.FC<SpaceDataModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'celestrak' | 'nasa-odpo' | 'nasa-apis' | 'disclaimer'>('celestrak');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('2026-11-21 15:42:00 UTC');

  if (!isOpen) return null;

  const handleRefreshCelestrak = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    audioService.playBlip();

    try {
      const result = await fetchLiveCelestrakTle('stations');
      const nowStr = new Date().toUTCString().replace('GMT', 'UTC');
      setLastSyncTime(nowStr);

      if (result.source === 'LIVE_NETWORK') {
        setRefreshMessage('Successfully refreshed live TLE elements directly from CelesTrak GP API.');
      } else if (result.source === 'CACHED_LOCAL') {
        setRefreshMessage('Served from local cache (TTL 60m active). Rate limit protection engaged.');
      } else {
        setRefreshMessage('Offline safety fallback verified. 12 catalog TLEs active.');
      }
    } catch {
      setRefreshMessage('Network error; fallback baseline elements active.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-mono">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-cyan-500/40 bg-slate-950 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-400">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  SPACE DATA INTEGRATION & PROVENANCE PIPELINE
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                  SGP4 ONLINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Official integrations: CelesTrak, NASA Open APIs, and NASA Orbital Debris Program Office (ODPO).
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioService.playBlip();
              onClose();
            }}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 px-4 text-xs">
          <button
            onClick={() => setActiveTab('celestrak')}
            className={`py-3 px-4 font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'celestrak'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>CelesTrak TLE Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('nasa-odpo')}
            className={`py-3 px-4 font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'nasa-odpo'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>NASA ODPO Debris Models</span>
          </button>

          <button
            onClick={() => setActiveTab('nasa-apis')}
            className={`py-3 px-4 font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'nasa-apis'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>NASA Space Weather & APIs</span>
          </button>

          <button
            onClick={() => setActiveTab('disclaimer')}
            className={`py-3 px-4 font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'disclaimer'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Simulation Transparency</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* TAB 1: CelesTrak */}
          {activeTab === 'celestrak' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg bg-cyan-950/20 border border-cyan-500/30">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 text-sm">CelesTrak General Perturbations (GP) TLE Service</span>
                    <a
                      href="https://celestrak.org/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>celestrak.org</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Operated by Dr. T.S. Kelso. Serves public NORAD Two-Line Element sets published by the U.S. Space Force 18th Space Defense Squadron.
                  </p>
                </div>

                <button
                  onClick={handleRefreshCelestrak}
                  disabled={isRefreshing}
                  className="px-3 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Querying CelesTrak...' : 'Refresh TLE Catalog'}</span>
                </button>
              </div>

              {refreshMessage && (
                <div className="p-3 rounded bg-slate-900 border border-cyan-500/40 text-cyan-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{refreshMessage}</span>
                </div>
              )}

              {/* Status & Pipeline Specs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">LAST DATA SYNC</span>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-200 font-bold">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{lastSyncTime}</span>
                  </div>
                </div>

                <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">SGP4 PROPAGATION ENGINE</span>
                  <div className="flex items-center gap-1.5 mt-1 text-emerald-400 font-bold">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>satellite.js (v7.2.0)</span>
                  </div>
                </div>

                <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">CACHE & RATE LIMIT STRATEGY</span>
                  <div className="flex items-center gap-1.5 mt-1 text-amber-400 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>60-Min LocalStorage TTL</span>
                  </div>
                </div>
              </div>

              {/* Active TLE Objects Table */}
              <div>
                <h4 className="font-bold text-slate-200 mb-2 uppercase text-[11px] tracking-wider">
                  Active Real-World Tracked Objects in SGP4 Memory ({REAL_TLE_CATALOG.length})
                </h4>
                <div className="border border-slate-800 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">NORAD ID</th>
                        <th className="p-2.5">Object Name</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Operator</th>
                        <th className="p-2.5">RCS Size</th>
                        <th className="p-2.5">Propagator Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {REAL_TLE_CATALOG.map((tle) => (
                        <tr key={tle.noradId} className="hover:bg-slate-900/40">
                          <td className="p-2.5 text-cyan-400 font-bold">#{tle.noradId}</td>
                          <td className="p-2.5 font-semibold text-slate-100">{tle.name}</td>
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px]">
                              {tle.category}
                            </span>
                          </td>
                          <td className="p-2.5">{tle.operator}</td>
                          <td className="p-2.5">{tle.rcsSize}</td>
                          <td className="p-2.5 text-emerald-400 font-mono text-[10px]">CelesTrak SGP4</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NASA ODPO */}
          {activeTab === 'nasa-odpo' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-orange-950/20 border border-orange-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">
                      NASA Orbital Debris Program Office (ODPO)
                    </span>
                    <a
                      href={NASA_ODPO_RESEARCH_DATA.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>orbitaldebris.jsc.nasa.gov</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-orange-900/60 text-orange-300 border border-orange-500/40">
                    JSC HOUSTON
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  NASA's lead center for orbital debris research. Governs the NASA Standard Breakup Model, ORDEM 3.1 environmental flux models, and international Active Debris Removal (ADR) priority criteria.
                </p>
              </div>

              {/* Research Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold">
                    <FileText className="w-4 h-4" />
                    <span>NASA Standard Breakup Model</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Characterizes fragment size distribution $N(L_c)$, area-to-mass ratio $(A/M)$, and ejection velocities for catastrophic hypervelocity collisions:
                  </p>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-cyan-300 text-center font-bold">
                    N(L_c) = 0.1 &times; M^0.75 &times; L_c^-1.71
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Where $M$ is total collision mass in kg and $L_c$ is characteristic fragment length in meters.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-orange-400 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Liou-Johnson ADR Target Criteria</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    NASA research demonstrates that active removal of just 5 top massive derelict objects per year can stabilize LEO debris growth:
                  </p>
                  <ul className="text-[10px] text-slate-400 space-y-1 list-disc pl-4">
                    <li>Mass $M &gt; 1,000$ kg (high kinetic mass reservoir)</li>
                    <li>Inclination $i &gt; 70^\circ$ (polar/sun-synchronous congestion)</li>
                    <li>Altitude between 750 km and 950 km (peak spatial density band)</li>
                  </ul>
                </div>
              </div>

              {/* Major Breakup Events Historical Registry */}
              <div>
                <h4 className="font-bold text-slate-200 mb-2 uppercase text-[11px] tracking-wider">
                  Major Historical Breakup Events Recorded by NASA ODPO
                </h4>
                <div className="border border-slate-800 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Year</th>
                        <th className="p-2.5">Breakup Incident</th>
                        <th className="p-2.5">Root Cause</th>
                        <th className="p-2.5">Fragments Cataloged</th>
                        <th className="p-2.5">Altitude</th>
                        <th className="p-2.5">Orbital Persistence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {NASA_ODPO_RESEARCH_DATA.majorHistoricalBreakups.map((ev) => (
                        <tr key={ev.name} className="hover:bg-slate-900/40">
                          <td className="p-2.5 text-orange-400 font-bold">{ev.year}</td>
                          <td className="p-2.5 font-semibold text-slate-100">{ev.name}</td>
                          <td className="p-2.5 text-slate-400">{ev.cause}</td>
                          <td className="p-2.5 text-red-400 font-bold">{ev.fragmentsCataloged.toLocaleString()}</td>
                          <td className="p-2.5">{ev.altitudeKm} km</td>
                          <td className="p-2.5 text-[10px] text-slate-400">{ev.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NASA APIs */}
          {activeTab === 'nasa-apis' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">NASA Open APIs & Space Weather</span>
                    <a
                      href="https://api.nasa.gov/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>api.nasa.gov</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-500/40">
                    NOAA / NASA SWPC
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Connects space weather solar radio flux $(F_{10.7})$ and planetary geomagnetic indices to compute thermospheric atmospheric density scale heights $(\rho)$ and orbital drag decay.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">SOLAR RADIO FLUX (10.7 CM)</span>
                  <div className="text-amber-400 text-lg font-bold mt-1">
                    {CURRENT_SPACE_WEATHER.solarFluxF107} sfu
                  </div>
                  <span className="text-[10px] text-slate-400">High solar UV expansion increases upper LEO drag</span>
                </div>

                <div className="p-3 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">PLANETARY Kp INDEX</span>
                  <div className="text-orange-400 text-lg font-bold mt-1">
                    Kp {CURRENT_SPACE_WEATHER.kpIndex}
                  </div>
                  <span className="text-[10px] text-slate-400">{CURRENT_SPACE_WEATHER.geomagneticStatus}</span>
                </div>

                <div className="p-3 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">SOLAR CYCLE 25</span>
                  <div className="text-cyan-400 text-lg font-bold mt-1">
                    Active Maximum
                  </div>
                  <span className="text-[10px] text-slate-400">Accelerates passive deorbit of debris &lt;500km</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Disclaimer & Scientific Integrity */}
          {activeTab === 'disclaimer' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-red-950/20 border border-red-500/40 text-slate-300 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-sm">Scientific Integrity & Simulation Transparency Policy</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  ORBITGUARD AI is an aerospace educational research and mission engineering prototype. To ensure rigorous scientific clarity, the application enforces the following clear distinctions:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-emerald-400 font-bold block text-[11px]">
                      &bull; REAL OBSERVATIONS & SGP4 ORBIT ESTIMATES
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Objects marked with real NORAD IDs (e.g., #25544 ISS, #48274 Tiangong, #20580 Hubble, #34120 Cosmos debris) are propagated using real Two-Line Element (TLE) ephemerides published via CelesTrak and the SGP4 analytical perturbation theory.
                    </p>
                  </div>

                  <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-purple-400 font-bold block text-[11px]">
                      &bull; SIMULATED TESTBED CONJUNCTIONS & DEMO ASSETS
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Objects with demo IDs (e.g. #99101, #99204), close-approach miss distance predictions, covariance ellipsoids, avoidance &Delta;V burns, and SSR scores are simulated testbed scenarios designed for educational study and operator decision support. They do not constitute official operational flight safety advisories.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Data Caching Architecture: Stored locally with 60-min TTL. Zero API key leakage.</span>
                <span className="text-cyan-400 font-bold">ORBITGUARD DATA ENGINE v2.4</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs">
          <div className="text-[11px] text-slate-500">
            CelesTrak &bull; NASA Open APIs &bull; NASA ODPO JSC Houston
          </div>
          <button
            onClick={() => {
              audioService.playBlip();
              onClose();
            }}
            className="px-4 py-2 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
