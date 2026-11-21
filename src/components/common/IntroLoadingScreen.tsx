import React, { useState, useEffect } from 'react';
import { OrbitGuardLogo } from './OrbitGuardLogo';
import { ShieldAlert, Activity, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { audioService } from '../../services/audioService';

interface IntroLoadingScreenProps {
  onComplete: () => void;
}

const BOOT_STEPS = [
  { text: 'INITIALIZING ORBITGUARD AI KERNEL v2.4.0...', duration: 240 },
  { text: 'CALIBRATING WGS-84 GEODETIC & EGM96 GRAVITATIONAL FRAMES...', duration: 280 },
  { text: 'ESTABLISHING CELESTRAK SGP4 EPHEMERIS TELEMETRY BUS...', duration: 320 },
  { text: 'INGESTING 47,100 CATALOGED OBJECTS (LEO / MEO / GEO)...', duration: 340 },
  { text: 'RUNNING NASA CARA COLLISION PROBABILITY (Pc) MATRIX...', duration: 360 },
  { text: 'CALIBRATING SPACE SUSTAINABILITY RATING (SSR) ALGORITHMS...', duration: 260 },
  { text: 'MISSION CONTROL CONSOLE READY — ALL SYSTEMS GREEN', duration: 300 }
];

export const IntroLoadingScreen: React.FC<IntroLoadingScreenProps> = ({ onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(12);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let progressInterval: ReturnType<typeof setInterval>;

    // Increment progress continuously
    progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        const remaining = 100 - prev;
        return Math.min(100, prev + Math.max(1, Math.floor(remaining * 0.12)));
      });
    }, 90);

    const runSteps = (index: number) => {
      if (index >= BOOT_STEPS.length) {
        setProgress(100);
        timeoutId = setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(onComplete, 400);
        }, 500);
        return;
      }

      setCurrentStepIndex(index);
      audioService.playBlip();

      timeoutId = setTimeout(() => {
        runSteps(index + 1);
      }, BOOT_STEPS[index].duration);
    };

    runSteps(0);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  const handleSkip = () => {
    audioService.playBlip();
    setIsFadingOut(true);
    setTimeout(onComplete, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 font-mono text-slate-100 select-none transition-opacity duration-400 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Cyber Grid & Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#08334415_1px,transparent_1px),linear-gradient(to_bottom,#08334415_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Main Mission Initialization Modal */}
      <div className="relative z-10 w-full max-w-xl p-8 mx-4 rounded-xl border border-cyan-500/30 bg-slate-900/90 backdrop-blur-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col items-center text-center space-y-6">
        {/* Animated Corner Brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

        {/* Big Logo */}
        <OrbitGuardLogo size="xl" showText={true} />

        {/* Subtitle / Agency Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-400 tracking-wider">
          <span className="px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
            USSPACECOM / ESA DEBRIS DATA BUS
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
            SGP4 / SDP4 HIGH PRECISION
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/30 text-emerald-300">
            DEFCON 2 STATUS
          </span>
        </div>

        {/* Progress Bar & Telemetry Status */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              BOOT SEQUENCE
            </span>
            <span className="text-cyan-400 font-mono">{progress}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-150 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Terminal Boot Log Output */}
        <div className="w-full h-32 p-3 rounded-lg bg-slate-950/90 border border-slate-800 text-left overflow-y-auto space-y-1.5 text-[11px] font-mono">
          {BOOT_STEPS.slice(0, currentStepIndex + 1).map((step, idx) => {
            const isLatest = idx === currentStepIndex;
            return (
              <div
                key={idx}
                className={`flex items-start gap-2 transition-opacity duration-200 ${
                  isLatest ? 'text-cyan-300 font-semibold' : 'text-slate-500'
                }`}
              >
                {idx < currentStepIndex ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  </span>
                )}
                <span className="truncate">{step.text}</span>
              </div>
            );
          })}
        </div>

        {/* Enter / Skip Button */}
        <div className="w-full flex items-center justify-between pt-2 border-t border-slate-800/80">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            LIVE TELEMETRY STREAM
          </span>

          <button
            onClick={handleSkip}
            className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] group"
          >
            <span>ENTER MISSION CONTROL</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
