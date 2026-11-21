import React from 'react';
import {
  LayoutDashboard,
  Globe,
  Trash2,
  ShieldAlert,
  Satellite,
  Activity,
  Bot,
  ChevronLeft,
  ChevronRight,
  Zap,
  Server
} from 'lucide-react';
import { audioService } from '../../services/audioService';

export type NavPage =
  | 'overview'
  | 'tracker'
  | 'debris'
  | 'collision-risk'
  | 'satellites'
  | 'sustainability'
  | 'ai-assistant';

interface SidebarProps {
  activePage: NavPage;
  onSelectPage: (page: NavPage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  collapsed,
  onToggleCollapse
}) => {
  const navItems = [
    {
      id: 'overview' as NavPage,
      label: 'Overview Dashboard',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
      badge: undefined
    },
    {
      id: 'tracker' as NavPage,
      label: '3D Orbital Tracker',
      shortLabel: '3D Tracker',
      icon: Globe,
      badge: { text: 'LIVE 3D', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' }
    },
    {
      id: 'debris' as NavPage,
      label: 'Space Debris Explorer',
      shortLabel: 'Debris Catalog',
      icon: Trash2,
      badge: { text: '36.5K', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' }
    },
    {
      id: 'collision-risk' as NavPage,
      label: 'Collision Risk Analyzer',
      shortLabel: 'Collision Risk',
      icon: ShieldAlert,
      badge: { text: '4 CRIT', color: 'bg-red-500/20 text-red-300 border-red-500/40' }
    },
    {
      id: 'satellites' as NavPage,
      label: 'Satellite Monitoring',
      shortLabel: 'Satellites',
      icon: Satellite,
      badge: { text: '7,420', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' }
    },
    {
      id: 'sustainability' as NavPage,
      label: 'Sustainability Analytics',
      shortLabel: 'Sustainability',
      icon: Activity,
      badge: { text: 'SSR', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' }
    },
    {
      id: 'ai-assistant' as NavPage,
      label: 'AI Space Assistant',
      shortLabel: 'ASTRA AI',
      icon: Bot,
      badge: { text: 'ASTRA', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' }
    }
  ];

  const handleNavClick = (page: NavPage) => {
    audioService.playBlip();
    onSelectPage(page);
  };

  return (
    <aside
      className={`relative flex flex-col border-r border-cyan-500/20 bg-slate-950/90 backdrop-blur-md transition-all duration-300 z-20 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Navigation Links */}
      <div className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono tracking-widest uppercase text-slate-500">
          {!collapsed ? 'Mission Control Console' : 'MCC'}
        </div>

        {navItems.map((item) => {
          const isActive = activePage === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-mono transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
              title={collapsed ? item.label : undefined}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-400 rounded-r shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              )}

              <Icon
                className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'
                }`}
              />

              {!collapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-bold uppercase shrink-0 ${item.badge.color}`}
                    >
                      {item.badge.text}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Satellite Constellation Status Box */}
      {!collapsed && (
        <div className="m-3 p-3 rounded bg-slate-900/70 border border-slate-800 text-[11px] font-mono space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              CONSTELLATION SYNC
            </span>
            <span className="text-emerald-400">99.8%</span>
          </div>
          <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full w-[99.8%]" />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <Server className="w-3 h-3 text-slate-400" />
              TLE EPOCH: TODAY
            </span>
            <span className="text-cyan-400/80">SGP4 PROPAGATOR</span>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-slate-800 flex justify-end">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors w-full flex items-center justify-center gap-2 text-xs font-mono"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-cyan-400" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400 text-[11px]">COLLAPSE HUD</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
