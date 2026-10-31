'use client';

import React from 'react';

interface SentiroLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  animated?: boolean;
  className?: string;
}

const sizeMap = {
  xs: { icon: 20, font: 'text-xs', subFont: 'text-[9px]' },
  sm: { icon: 28, font: 'text-sm', subFont: 'text-[10px]' },
  md: { icon: 34, font: 'text-base', subFont: 'text-[11px]' },
  lg: { icon: 42, font: 'text-lg', subFont: 'text-xs' },
  xl: { icon: 56, font: 'text-2xl', subFont: 'text-sm' },
};

export default function SentiroLogo({
  size = 'md',
  showText = true,
  subtitle = 'sentiro.xyz',
  animated = true,
  className = '',
}: SentiroLogoProps) {
  const cfg = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* High-Contrast Black & White Sentinel Disc Badge */}
      <div
        className="relative flex-shrink-0 rounded-full bg-white p-0.5 shadow-sm transition-transform duration-200 hover:scale-105 border border-slate-200/80 dark:border-slate-700/80"
        style={{ width: cfg.icon, height: cfg.icon }}
      >
        <img
          src="/logo-badge.svg"
          alt="Sentiro IT Sentinel"
          width={cfg.icon}
          height={cfg.icon}
          className="w-full h-full object-contain rounded-full select-none"
        />
        {/* Subtle live radar ping pulse dot */}
        {animated && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
          </span>
        )}
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 ${cfg.font}`}>
            <span>
              sent<span className="text-teal-500 dark:text-teal-400">iro</span>
            </span>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 font-bold border border-teal-200/80 dark:border-teal-800/80">
              SRE
            </span>
          </div>
          {subtitle && (
            <span className={`text-slate-500 dark:text-slate-400 font-mono tracking-tight mt-0.5 ${cfg.subFont}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
