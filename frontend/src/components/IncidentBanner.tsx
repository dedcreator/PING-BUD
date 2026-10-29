'use client';

import React from 'react';
import { AlertOctagon, Bot, ChevronRight, Clock, ShieldAlert } from 'lucide-react';
import { Incident } from '../types';

interface IncidentBannerProps {
  incidents: Incident[];
  onViewIncidents: () => void;
  onSelectIncidentMonitor?: (monitorId: number) => void;
}

export default function IncidentBanner({
  incidents,
  onViewIncidents,
  onSelectIncidentMonitor,
}: IncidentBannerProps) {
  if (!incidents || incidents.length === 0) return null;

  const topIncident = incidents[0];

  return (
    <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 dark:bg-red-950/30 p-4 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 shrink-0 mt-0.5 sm:mt-0">
            <ShieldAlert className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-red-900 dark:text-red-200">
                Active Outage Detected: {topIncident.monitor_name}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-red-200/50 dark:bg-red-900/60 text-red-800 dark:text-red-300">
                <Clock className="w-3 h-3" />
                <span>Ongoing for {topIncident.duration_minutes} min</span>
              </span>
            </div>

            <p className="text-xs text-red-800/90 dark:text-red-300/90 mt-1 font-mono">
              Cause: {topIncident.cause}
            </p>

            {/* AI Root-Cause Analysis snippet */}
            {topIncident.ai_summary && (
              <div className="mt-2 flex items-start gap-1.5 p-2 rounded-md bg-white/60 dark:bg-[#111A2E]/80 border border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-200">
                <Bot className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">AI Root Cause Summary: </span>
                  <span className="font-sans">{topIncident.ai_summary}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={() => {
              if (onSelectIncidentMonitor && topIncident.monitor) {
                onSelectIncidentMonitor(topIncident.monitor);
              } else {
                onViewIncidents();
              }
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
          >
            <span>View Timeline</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
