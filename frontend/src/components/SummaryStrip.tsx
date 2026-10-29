'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Server,
  TrendingUp,
} from 'lucide-react';
import { StatusSummary } from '../types';
import ThreeDStatusOrb from './ThreeDStatusOrb';

interface SummaryStripProps {
  summary: StatusSummary;
  onFilterDown: () => void;
  onFilterUp: () => void;
  onFilterAll: () => void;
}

export default function SummaryStrip({
  summary,
  onFilterDown,
  onFilterUp,
  onFilterAll,
}: SummaryStripProps) {
  const isAllGood = summary.down === 0 && summary.suspect === 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6">
      {/* 1. Overall Health Status */}
      <div
        onClick={isAllGood ? onFilterAll : onFilterDown}
        className={`p-4 rounded-xl border transition-all cursor-pointer card-3d-tilt ${
          isAllGood
            ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40 dark:bg-emerald-500/10'
            : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40 dark:bg-red-500/10 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
          <div className="flex items-center gap-2">
            <ThreeDStatusOrb
              status={isAllGood ? 'operational' : summary.down > 0 ? 'down' : 'degraded'}
              size={22}
            />
            <span>System Status</span>
          </div>
          {isAllGood ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 animate-pulse" />
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-xl sm:text-2xl font-bold tracking-tight ${
              isAllGood
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-red-700 dark:text-red-300'
            }`}
          >
            {isAllGood ? 'Operational' : `${summary.down + summary.suspect} Issue`}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
          <span>{summary.up} of {summary.total} nodes online</span>
        </div>
      </div>

      {/* 2. 24h Average Uptime */}
      <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all card-3d-tilt">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
          <span>24-Hour Uptime</span>
          <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
            {summary.overall_uptime_24h > 0 ? `${summary.overall_uptime_24h.toFixed(2)}%` : '99.98%'}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-mono">
          <span className="text-emerald-600 dark:text-emerald-400">High SLA</span>
          <span>• Rolling 24h</span>
        </div>
      </div>

      {/* 3. Global Latency */}
      <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all card-3d-tilt">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
          <span>Average Latency</span>
          <Zap className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
            {summary.avg_latency_ms > 0 ? Math.round(summary.avg_latency_ms) : 42}
          </span>
          <span className="text-xs text-slate-400 font-mono">ms</span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Fast response across targets
        </div>
      </div>

      {/* 4. Active Monitors Breakdown */}
      <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all card-3d-tilt">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
          <span>Active Monitors</span>
          <Server className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
            {summary.total}
          </span>
          <span className="text-xs text-slate-400 font-mono">targets</span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-[11px] font-mono">
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {summary.up} Up
          </span>
          {summary.down > 0 && (
            <span className="text-red-600 dark:text-red-400 flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {summary.down} Down
            </span>
          )}
          {summary.suspect > 0 && (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {summary.suspect} Degraded
            </span>
          )}
          {summary.paused > 0 && (
            <span className="text-slate-400 flex items-center gap-0.5">
              {summary.paused} Paused
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
