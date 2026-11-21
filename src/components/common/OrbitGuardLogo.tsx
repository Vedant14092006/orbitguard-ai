import React from 'react';

interface OrbitGuardLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const OrbitGuardLogo: React.FC<OrbitGuardLogoProps> = ({
  size = 'md',
  showText = true,
  className = ''
}) => {
  const iconDimensions = {
    sm: { width: 28, height: 28 },
    md: { width: 36, height: 36 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 }
  }[size];

  const titleSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-2xl'
  }[size];

  const subSizes = {
    sm: 'text-[8px]',
    md: 'text-[9px]',
    lg: 'text-[11px]',
    xl: 'text-xs'
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* High-Tech Aerospace Vector Insignia */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={iconDimensions.width}
          height={iconDimensions.height}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_12px_rgba(6,182,212,0.5)] transition-transform duration-300 hover:scale-105"
        >
          {/* Outer Protective Hexagon Ring */}
          <polygon
            points="50,4 90,26 90,74 50,96 10,74 10,26"
            stroke="#0e7490"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            opacity="0.6"
          />

          {/* Inclined Orbital Ellipse 1 (LEO / ISS 51.6 deg) */}
          <ellipse
            cx="50"
            cy="50"
            rx="42"
            ry="18"
            transform="rotate(-28 50 50)"
            stroke="#06b6d4"
            strokeWidth="2"
            opacity="0.85"
          />

          {/* Inclined Orbital Ellipse 2 (Polar SSO 98 deg) */}
          <ellipse
            cx="50"
            cy="50"
            rx="40"
            ry="14"
            transform="rotate(62 50 50)"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeDasharray="5 3"
            opacity="0.75"
          />

          {/* Earth Celestial Core Sphere */}
          <circle
            cx="50"
            cy="50"
            r="20"
            fill="url(#earthGradient)"
            stroke="#06b6d4"
            strokeWidth="1.5"
          />

          {/* Earth Coordinate Grid Lat/Lon */}
          <ellipse cx="50" cy="50" rx="20" ry="8" stroke="#0891b2" strokeWidth="0.8" opacity="0.6" />
          <ellipse cx="50" cy="50" rx="8" ry="20" stroke="#0891b2" strokeWidth="0.8" opacity="0.6" />
          <line x1="30" y1="50" x2="70" y2="50" stroke="#0891b2" strokeWidth="0.8" opacity="0.6" />
          <line x1="50" y1="30" x2="50" y2="70" stroke="#0891b2" strokeWidth="0.8" opacity="0.6" />

          {/* Active Satellite Node on Orbit 1 */}
          <g transform="translate(76, 32)">
            <circle cx="0" cy="0" r="3.5" fill="#38bdf8" />
            <circle cx="0" cy="0" r="6" stroke="#38bdf8" strokeWidth="0.8" opacity="0.8">
              <animate attributeName="r" values="3.5;8;3.5" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0;0.8" dur="2.4s" repeatCount="indefinite" />
            </circle>
            {/* Satellite Solar Panels */}
            <rect x="-6" y="-1" width="3" height="2" fill="#0284c7" />
            <rect x="3" y="-1" width="3" height="2" fill="#0284c7" />
          </g>

          {/* Space Debris Fragment on Orbit 2 */}
          <polygon
            points="22,66 25,63 27,67 23,69"
            fill="#f97316"
            className="animate-pulse"
          />

          {/* Gradients */}
          <defs>
            <radialGradient
              id="earthGradient"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(46 44) rotate(48.5) scale(24)"
            >
              <stop offset="0%" stopColor="#083344" />
              <stop offset="60%" stopColor="#031f30" />
              <stop offset="100%" stopColor="#020d18" />
            </radialGradient>
          </defs>
        </svg>

        {/* Ambient Pulsing Radar Ping */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
        </span>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-mono">
            <span className={`font-black tracking-wider text-slate-100 ${titleSizes} uppercase flex items-center`}>
              ORBITGUARD
            </span>
            <span className="px-1.5 py-0.2 rounded bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black text-[9px] tracking-tight shadow-[0_0_10px_rgba(6,182,212,0.4)]">
              AI
            </span>
          </div>
          <span className={`text-slate-400 font-mono tracking-widest uppercase flex items-center gap-1 ${subSizes}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SPACE DOMAIN AWARENESS
          </span>
        </div>
      )}
    </div>
  );
};
