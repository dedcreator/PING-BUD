'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';

export interface DeployingSentinelOverlayProps {
  target: string;
  monitorName?: string;
  regions?: string[];
  isSuccess?: boolean;
  onComplete?: () => void;
}

export default function DeployingSentinelOverlay({
  target,
  monitorName,
  isSuccess = false,
  onComplete,
}: DeployingSentinelOverlayProps) {
  const [phase, setPhase] = useState<'connecting' | 'verified'>('connecting');
  const [progress, setProgress] = useState(20);

  useEffect(() => {
    // Phase 1: Smooth laser progress advancing
    const pTimer = setTimeout(() => {
      setProgress(78);
    }, 150);

    return () => clearTimeout(pTimer);
  }, []);

  useEffect(() => {
    // If isSuccess is true, or once the backend has saved the monitor
    if (isSuccess && phase === 'connecting') {
      const lockTimer = setTimeout(() => {
        setPhase('verified');
        setProgress(100);
      }, 400);

      const doneTimer = setTimeout(() => {
        onComplete?.();
      }, 1250);

      return () => {
        clearTimeout(lockTimer);
        clearTimeout(doneTimer);
      };
    }
  }, [isSuccess, phase, onComplete]);

  // Fallback: If isSuccess wasn't explicitly managed by the parent, automatically transition after reasonable probe time
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (phase === 'connecting') {
        setPhase('verified');
        setProgress(100);
        setTimeout(() => {
          onComplete?.();
        }, 800);
      }
    }, 1200);

    return () => clearTimeout(fallbackTimer);
  }, [phase, onComplete]);

  return (
    <div className="absolute inset-0 z-50 rounded-2xl overflow-hidden bg-slate-950/85 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white select-none animate-in fade-in duration-200 border border-white/10 shadow-2xl">
      {/* Central Sentinel Aperture Housing */}
      <div className="relative flex items-center justify-center my-4">
        {/* Sonar Radar Concentric Wave Rings */}
        <div
          className={`absolute w-32 h-32 rounded-full border transition-all duration-700 pointer-events-none ${
            phase === 'verified'
              ? 'border-emerald-500/50 scale-110 shadow-[0_0_40px_rgba(16,185,129,0.3)]'
              : 'border-teal-500/30 animate-sonar-1'
          }`}
        />
        <div
          className={`absolute w-44 h-44 rounded-full border transition-all duration-700 pointer-events-none ${
            phase === 'verified'
              ? 'border-emerald-500/20 scale-105'
              : 'border-teal-500/20 animate-sonar-2'
          }`}
        />

        {/* Sentinel Robotic Avatar Badge */}
        <div
          className={`relative w-20 h-20 rounded-full bg-white border p-1.5 flex items-center justify-center transition-all duration-500 z-10 shadow-xl ${
            phase === 'verified'
              ? 'border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.4)] scale-105'
              : 'border-teal-500/60 shadow-[0_0_25px_rgba(20,184,166,0.3)]'
          }`}
        >
          <Image
            src="/sentiro-avatar.png"
            alt="Sentiro Sentinel"
            width={64}
            height={64}
            className="w-full h-full object-contain rounded-full"
            priority
          />

          {/* Micro status confirmation checkmark badge */}
          {phase === 'verified' && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-200">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          )}
        </div>
      </div>

      {/* Meaningful Telemetry Oscilloscope Ping Wave */}
      <div className="w-28 h-6 my-2 flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 120 32"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 0 16 L 35 16 L 45 6 L 55 26 L 65 11 L 75 21 L 85 16 L 120 16"
            className={`transition-colors duration-500 ${
              phase === 'verified'
                ? 'stroke-emerald-400 stroke-2'
                : 'stroke-teal-400/80 animate-osc-sweep stroke-[1.75]'
            }`}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Minimal, Professional Status Line (Zero AI jargon or buzzword walls) */}
      <div className="flex flex-col items-center text-center mt-1">
        <div className="text-sm font-semibold tracking-tight transition-colors duration-300 flex items-center gap-2">
          {phase === 'verified' ? (
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              Probe active
            </span>
          ) : (
            <span className="text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              Connecting probe
            </span>
          )}
        </div>

        {/* Target Host Pill */}
        <div className="mt-2 px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-slate-400 max-w-[260px] truncate">
          {target}
        </div>
      </div>

      {/* Hairline Laser Progress Track */}
      <div className="w-36 bg-slate-800/80 rounded-full h-1 mt-5 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            phase === 'verified' ? 'bg-emerald-400' : 'bg-teal-400'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
