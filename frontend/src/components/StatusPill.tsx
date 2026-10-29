import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, PauseCircle, Wrench } from 'lucide-react';
import { MonitorState } from '../types';

interface StatusPillProps {
  state: MonitorState;
  className?: string;
  size?: 'sm' | 'md';
}

export default function StatusPill({ state, className = '', size = 'md' }: StatusPillProps) {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  switch (state) {
    case 'up':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold text-emerald-700 bg-emerald-500/10 dark:text-emerald-300 dark:bg-emerald-500/15 border border-emerald-500/20 ${pad} ${className}`}
        >
          <CheckCircle2 className={`${iconSize} stroke-[2.2]`} />
          <span>Operational</span>
        </span>
      );
    case 'down':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold text-red-700 bg-red-500/10 dark:text-red-300 dark:bg-red-500/15 border border-red-500/20 animate-pulse ${pad} ${className}`}
        >
          <XCircle className={`${iconSize} stroke-[2.2]`} />
          <span>Major Outage</span>
        </span>
      );
    case 'suspect':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold text-amber-700 bg-amber-500/10 dark:text-amber-300 dark:bg-amber-500/15 border border-amber-500/20 ${pad} ${className}`}
        >
          <AlertTriangle className={`${iconSize} stroke-[2.2]`} />
          <span>Degraded</span>
        </span>
      );
    case 'maintenance':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold text-blue-700 bg-blue-500/10 dark:text-blue-300 dark:bg-blue-500/15 border border-blue-500/20 ${pad} ${className}`}
        >
          <Wrench className={`${iconSize} stroke-[2.2]`} />
          <span>Maintenance</span>
        </span>
      );
    case 'paused':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold text-slate-600 bg-slate-500/10 dark:text-slate-400 dark:bg-slate-500/15 border border-slate-500/20 ${pad} ${className}`}
        >
          <PauseCircle className={`${iconSize} stroke-[2.2]`} />
          <span>Paused</span>
        </span>
      );
  }
}
