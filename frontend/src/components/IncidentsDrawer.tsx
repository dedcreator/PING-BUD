'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Filter,
  Calendar,
  Layers,
  FileDown,
} from 'lucide-react';
import { Incident } from '../types';
import { getIncidentExportUrl } from '../lib/api';

interface IncidentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: Incident[];
  onSelectMonitor?: (monitorId: number) => void;
}

export default function IncidentsDrawer({
  isOpen,
  onClose,
  incidents,
  onSelectMonitor,
}: IncidentsDrawerProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  if (!isOpen) return null;

  const filtered = (incidents || []).filter((inc) => {
    if (filter === 'active') return inc.is_active;
    if (filter === 'resolved') return !inc.is_active;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 my-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Incident Timeline & Outage History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track root-cause investigations, automatic failover and post-mortem logs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs & Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-slate-100 dark:border-slate-800 mb-2">
          <div className="flex items-center gap-1.5 text-xs">
            {(
              [
                { id: 'all', label: `All (${incidents.length})` },
                { id: 'active', label: `Active (${incidents.filter((i) => i.is_active).length})` },
                { id: 'resolved', label: `Resolved (${incidents.filter((i) => !i.is_active).length})` },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  filter === t.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={getIncidentExportUrl('csv')}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Download Incident History as CSV"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-500" />
              <span>Export CSV</span>
            </a>
            <a
              href={getIncidentExportUrl('json')}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Download Incident History as JSON"
            >
              <FileDown className="w-3.5 h-3.5 text-purple-500" />
              <span>Export JSON</span>
            </a>
          </div>
        </div>

        {/* Timeline List */}
        <div className="space-y-3 mt-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <span>No incidents match this filter. All systems functioning within SLA!</span>
            </div>
          ) : (
            filtered.map((inc) => (
              <div
                key={inc.id}
                className={`p-4 rounded-xl border transition-all ${
                  inc.is_active
                    ? 'bg-red-500/5 border-red-500/30 dark:bg-red-950/20 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#16223B]/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        inc.is_active
                          ? 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 animate-pulse'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                      }`}
                    >
                      {inc.is_active ? 'Active Outage' : 'Resolved'}
                    </span>

                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                      {inc.monitor_name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Duration: {inc.duration_minutes} min</span>
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-700 dark:text-slate-300 font-mono bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/80">
                  <span className="text-slate-400">Trigger: </span>
                  <span>{inc.cause}</span>
                </div>

                {inc.ai_summary && (
                  <div className="mt-2.5 flex items-start gap-2 p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200">
                    <Bot className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                        Automated AI Root-Cause Analysis (RCA):{' '}
                      </span>
                      <span>{inc.ai_summary}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <span>Started: {new Date(inc.started_at).toLocaleString()}</span>
                    {inc.resolved_at && (
                      <span>Resolved: {new Date(inc.resolved_at).toLocaleString()}</span>
                    )}
                  </div>

                  {onSelectMonitor && inc.monitor && (
                    <button
                      onClick={() => {
                        onClose();
                        onSelectMonitor(inc.monitor);
                      }}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      View Monitor →
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
