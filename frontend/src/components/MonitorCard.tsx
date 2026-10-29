'use client';

import React, { useState } from 'react';
import {
  MoreVertical,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Globe,
  Radio,
  Terminal,
  Key,
  Lock,
  Search,
} from 'lucide-react';
import { Monitor } from '../types';
import StatusPill from './StatusPill';
import UptimeBar from './UptimeBar';
import LatencySparkline from './LatencySparkline';

interface MonitorCardProps {
  monitor: Monitor;
  onSelect: (monitor: Monitor) => void;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
  onCheckNow: (id: number) => Promise<void>;
  onDelete: (id: number) => void;
}

export default function MonitorCard({
  monitor,
  onSelect,
  onPause,
  onResume,
  onCheckNow,
  onDelete,
}: MonitorCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDown = monitor.state === 'down';
  const isSuspect = monitor.state === 'suspect';
  const isPaused = monitor.state === 'paused' || monitor.paused;

  const handleInstantCheck = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setChecking(true);
      await onCheckNow(monitor.id);
    } finally {
      setChecking(false);
    }
  };

  const getTypeIcon = () => {
    switch (monitor.monitor_type) {
      case 'keyword':
        return <Search className="w-3.5 h-3.5 text-sky-500" />;
      case 'ping':
        return <Radio className="w-3.5 h-3.5 text-violet-500" />;
      case 'port':
        return <Terminal className="w-3.5 h-3.5 text-orange-500" />;
      case 'heartbeat':
        return <Key className="w-3.5 h-3.5 text-pink-500" />;
      case 'ssl':
        return <Lock className="w-3.5 h-3.5 text-emerald-500" />;
      case 'http':
      default:
        return <Globe className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  return (
    <div
      onClick={() => onSelect(monitor)}
      className={`group relative rounded-xl border p-3 sm:p-3.5 transition-all duration-150 cursor-pointer ${
        isDown
          ? 'bg-rose-500/[0.04] dark:bg-rose-950/20 border-rose-500/40 hover:border-rose-500 shadow-sm'
          : isSuspect
          ? 'bg-amber-500/[0.04] dark:bg-amber-950/20 border-amber-500/40 hover:border-amber-500'
          : 'backdrop-blur-xl bg-white/75 dark:bg-[#0F172A]/80 border-slate-200/80 dark:border-slate-800/80 hover:border-teal-500/60 dark:hover:border-teal-500/60 shadow-sm hover:shadow'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-2.5 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span
              className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0"
              title={`Type: ${monitor.monitor_type.toUpperCase()}`}
            >
              {getTypeIcon()}
            </span>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
              {monitor.name}
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {monitor.monitor_type}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="truncate max-w-[200px] sm:max-w-xs block" title={monitor.target}>
              {monitor.target}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{monitor.interval_seconds}s</span>
          </div>
        </div>

        {/* Status Pill & Action Menu */}
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusPill state={monitor.state} size="sm" />

          {/* Quick Check button */}
          <button
            onClick={handleInstantCheck}
            disabled={checking || isPaused}
            className="p-1 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30"
            title="Check this monitor now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-teal-600' : ''}`} />
          </button>

          {/* Overflow Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-white dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-20 text-xs"
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onSelect(monitor);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Analytics</span>
                </button>

                {isPaused ? (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onResume(monitor.id);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Resume Monitor</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onPause(monitor.id);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                  >
                    <Pause className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pause Monitor</span>
                  </button>
                )}

                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(monitor.id);
                    }}
                    className="w-full px-3 py-2 text-left bg-red-600 text-white font-semibold flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete?</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signature Uptime Bar */}
      <div className="my-2">
        <UptimeBar ticks={monitor.uptime_bar} height={18} />
      </div>

      {/* Footer Metrics Row */}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800/60 text-[11px]">
        {/* Left: 24h & 30d Uptime */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] text-slate-400">24h:</span>
            <span
              className={`font-mono font-semibold ${
                monitor.uptime_24h >= 99
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : monitor.uptime_24h >= 95
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {monitor.uptime_24h > 0 ? `${monitor.uptime_24h.toFixed(2)}%` : '100%'}
            </span>
          </div>

          <div className="hidden sm:flex items-baseline gap-1">
            <span className="text-[10px] text-slate-400">30d:</span>
            <span className="font-mono text-slate-600 dark:text-slate-300 font-medium">
              {monitor.uptime_30d > 0 ? `${monitor.uptime_30d.toFixed(2)}%` : '99.9%'}
            </span>
          </div>

          {monitor.cert_info && (
            <div className="hidden md:flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
              <ShieldCheck className="w-3 h-3" />
              <span>SSL: {monitor.cert_info.days_remaining}d</span>
            </div>
          )}
        </div>

        {/* Right: Latency & Sparkline */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] text-slate-400">Avg:</span>
            <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
              {monitor.avg_latency > 0 ? `${Math.round(monitor.avg_latency)} ms` : '--'}
            </span>
          </div>

          <div className="hidden sm:block">
            <LatencySparkline
              ticks={monitor.uptime_bar}
              width={70}
              height={16}
              color={isDown ? '#DC2626' : isSuspect ? '#D97706' : '#0D9488'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
