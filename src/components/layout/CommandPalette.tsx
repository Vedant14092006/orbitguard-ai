import React, { useState, useEffect } from 'react';
import { Search, Globe, Trash2, ShieldAlert, Satellite, Activity, Bot, X, ArrowRight } from 'lucide-react';
import { MOCK_SATELLITES } from '../../data/mockSatellites';
import { MOCK_DEBRIS } from '../../data/mockDebris';
import { NavPage } from './Sidebar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (page: NavPage, objectId?: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectPage
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const pages = [
    { id: 'overview' as NavPage, name: 'Overview Dashboard', icon: Globe, category: 'Navigation' },
    { id: 'tracker' as NavPage, name: '3D Orbital Tracker (WebGL)', icon: Globe, category: 'Navigation' },
    { id: 'debris' as NavPage, name: 'Space Debris Explorer & Catalog', icon: Trash2, category: 'Navigation' },
    { id: 'collision-risk' as NavPage, name: 'Collision Risk Analyzer (CDM Table)', icon: ShieldAlert, category: 'Navigation' },
    { id: 'satellites' as NavPage, name: 'Satellite Monitoring Fleet Manager', icon: Satellite, category: 'Navigation' },
    { id: 'sustainability' as NavPage, name: 'Sustainability Analytics & Kessler Simulator', icon: Activity, category: 'Navigation' },
    { id: 'ai-assistant' as NavPage, name: 'AI Space Assistant (ASTRA)', icon: Bot, category: 'Navigation' },
  ];

  const matchedPages = pages.filter(p => p.name.toLowerCase().includes(q));
  const matchedSats = MOCK_SATELLITES.filter(s =>
    s.name.toLowerCase().includes(q) || s.noradId.toString().includes(q) || s.operator.toLowerCase().includes(q)
  );
  const matchedDebris = MOCK_DEBRIS.filter(d =>
    d.name.toLowerCase().includes(q) || d.noradId.toString().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-lg border border-cyan-500/30 bg-slate-900 shadow-2xl shadow-cyan-950/50 overflow-hidden font-mono">
        {/* Search Input Box */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search satellites, debris (NORAD ID), pages, maneuvers..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Pages */}
          {matchedPages.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500">
                Mission Views
              </div>
              <div className="space-y-1">
                {matchedPages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <button
                      key={page.id}
                      onClick={() => {
                        onSelectPage(page.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-cyan-950/40 hover:border-cyan-500/30 border border-transparent text-xs text-slate-300 hover:text-cyan-300 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-cyan-400" />
                        <span>{page.name}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Satellites */}
          {matchedSats.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500">
                Tracked Satellites
              </div>
              <div className="space-y-1">
                {matchedSats.slice(0, 5).map((sat) => (
                  <button
                    key={sat.id}
                    onClick={() => {
                      onSelectPage('satellites', sat.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-blue-950/40 hover:border-blue-500/30 border border-transparent text-xs text-slate-300 hover:text-blue-300 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Satellite className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="font-semibold">{sat.name}</div>
                        <div className="text-[10px] text-slate-500">
                          NORAD {sat.noradId} &bull; {sat.altitude} km &bull; {sat.operator}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-blue-300 uppercase">
                      {sat.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Debris */}
          {matchedDebris.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500">
                Orbital Debris Targets
              </div>
              <div className="space-y-1">
                {matchedDebris.slice(0, 5).map((deb) => (
                  <button
                    key={deb.id}
                    onClick={() => {
                      onSelectPage('debris', deb.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-orange-950/40 hover:border-orange-500/30 border border-transparent text-xs text-slate-300 hover:text-orange-300 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Trash2 className="w-4 h-4 text-orange-400" />
                      <div>
                        <div className="font-semibold">{deb.name}</div>
                        <div className="text-[10px] text-slate-500">
                          NORAD {deb.noradId} &bull; Alt: {deb.altitude} km &bull; Risk: {deb.riskLevel}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-300 uppercase">
                      {deb.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty Search State */}
          {matchedPages.length === 0 && matchedSats.length === 0 && matchedDebris.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-500 font-mono space-y-1">
              <div>No satellites, debris targets, or mission views matching &quot;{query}&quot;</div>
              <div className="text-[10px] text-slate-600">Try searching for &quot;Starlink&quot;, &quot;ISS&quot;, &quot;Cosmos&quot;, or &quot;Tracker&quot;</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Press ESC or click outside to dismiss</span>
          <span>ORBITGUARD SURVEILLANCE ENGINE</span>
        </div>
      </div>
    </div>
  );
};
