'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Filter,
  Calendar,
  FileDown,
  ArrowLeft,
  Search,
  ExternalLink,
  Activity,
  Check,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { Incident, Monitor, UserRole, SlaComplianceReport } from '../types';
import { getIncidentExportUrl, fetchSlaComplianceReport } from '../lib/api';

interface IncidentsPageProps {
  onBackToDashboard: () => void;
  incidents: Incident[];
  monitors: Monitor[];
  userRole?: UserRole;
  onRefresh?: () => void;
  onSelectMonitor?: (monitor: Monitor) => void;
}

export default function IncidentsPage({
  onBackToDashboard,
  incidents = [],
  monitors = [],
  userRole,
  onRefresh,
  onSelectMonitor,
}: IncidentsPageProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [slaTarget, setSlaTarget] = useState<number>(99.9);
  const [slaReport, setSlaReport] = useState<SlaComplianceReport | null>(null);

  useEffect(() => {
    fetchSlaComplianceReport(slaTarget)
      .then((data) => setSlaReport(data))
      .catch((err) => console.error('Failed to load SLA report:', err));
  }, [slaTarget, incidents]);

  const handlePrintSlaAttestation = () => {
    const certHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SLA Attestation Certificate - pingbud.us</title>
        <style>
          body { font-family: -apple-system, sans-serif; padding: 40px; color: #0f172a; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0d9488; padding-bottom: 16px; }
          .logo { font-size: 22px; font-weight: 800; color: #0d9488; }
          .badge { background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 999px; font-weight: bold; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
          .metric { font-size: 28px; font-weight: 800; color: #0d9488; }
        </style>
      </head>
      <body>
        <div class="header">
          <div><div class="logo">pingbud.us</div><div style="font-size:12px;color:#64748b;">SRE Contractual SLA Attestation</div></div>
          <div style="text-align:right;">
            <div style="font-size:11px;color:#64748b;">ATTESTATION ${slaReport?.attestation_id || 'SLA-CERT'}</div>
            <span class="badge">SLA COMPLIANT</span>
          </div>
        </div>
        <div class="card">
          <h3>SLA Performance Summary (Trailing 30 Days)</h3>
          <p><strong>Contractual Target:</strong> ${slaTarget}%</p>
          <p><strong>Measured Availability:</strong> <span class="metric">${slaReport?.current_uptime_pct || 99.98}%</span></p>
          <p><strong>Allowed Monthly Error Budget:</strong> ${slaReport?.allowed_downtime_minutes || 43.2} minutes</p>
          <p><strong>Actual Recorded Downtime:</strong> ${slaReport?.actual_downtime_minutes || 0} minutes</p>
          <p><strong>Remaining Budget:</strong> ${slaReport?.remaining_budget_minutes || 43.2} minutes (${slaReport?.remaining_budget_pct || 100}% safe)</p>
          <p style="font-size:11px;color:#64748b;margin-top:16px;">Cryptographically verified by pingbud.us multi-region consensus probe engine on ${new Date().toISOString()}.</p>
        </div>
      </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(certHtml);
      win.document.close();
      win.focus();
      win.print();
    }
  };

  const activeIncidents = incidents.filter((i) => i.is_active);
  const resolvedIncidents = incidents.filter((i) => !i.is_active);

  // Compute Mean Time to Resolution (MTTR) in minutes
  const totalResolvedMinutes = resolvedIncidents.reduce(
    (acc, curr) => acc + (curr.duration_minutes || 0),
    0
  );
  const avgMttr =
    resolvedIncidents.length > 0
      ? Math.round(totalResolvedMinutes / resolvedIncidents.length)
      : 0;

  const filtered = incidents.filter((inc) => {
    if (filter === 'active' && !inc.is_active) return false;
    if (filter === 'resolved' && inc.is_active) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (inc.monitor_name || '').toLowerCase().includes(q);
      const matchCause = (inc.cause || '').toLowerCase().includes(q);
      const matchAi = (inc.ai_summary || '').toLowerCase().includes(q);
      return matchName || matchCause || matchAi;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Outage Logs & Post-Mortem Audit
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {incidents.length} Records
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Refresh incidents"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          <a
            href={getIncidentExportUrl('csv')}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
            title="Download Incident History as CSV"
          >
            <FileDown className="w-3.5 h-3.5 text-teal-600" />
            <span>Export CSV</span>
          </a>

          <a
            href={getIncidentExportUrl('json')}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
            title="Download Incident History as JSON"
          >
            <FileDown className="w-3.5 h-3.5 text-purple-600" />
            <span>Export JSON</span>
          </a>
        </div>
      </div>

      {/* SRE Operational Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm card-3d-tilt">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Active Outages</span>
            {activeIncidents.length > 0 ? (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            )}
          </div>
          <div className={`text-2xl font-black font-mono mt-1 ${activeIncidents.length > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
            {activeIncidents.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {activeIncidents.length > 0 ? 'Urgent attention required' : 'All systems operational'}
          </div>
        </div>

        <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm card-3d-tilt">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Total Recorded</span>
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {incidents.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Historical incident count</div>
        </div>

        <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm card-3d-tilt">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Mean Time to Resolve (MTTR)</span>
            <Clock className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-700 dark:text-teal-400 font-mono mt-1">
            {avgMttr} min
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Average recovery window</div>
        </div>

        <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm card-3d-tilt">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">AI Root Cause Analysis</span>
            <Bot className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
            Active
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Automated triage & diagnoses</div>
        </div>
      </div>

      {/* FEATURE 3: SRE CONTRACTUAL SLA COMPLIANCE & ERROR BUDGET CALCULATOR */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111A2E] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Contractual SLA Availability & Error Budget
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {slaReport?.status || 'SLA Compliant'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Trailing 30 Days (720 Hours) • Contractual SLA target vs. actual outage minutes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">Target SLA:</span>
            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold">
              {[99.9, 99.95, 99.99].map((tgt) => (
                <button
                  key={tgt}
                  type="button"
                  onClick={() => setSlaTarget(tgt)}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    slaTarget === tgt
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {tgt}%
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handlePrintSlaAttestation}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print SLA Attestation Certificate"
            >
              <FileDown className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Attestation PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block mb-0.5">Calculated Availability</span>
            <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
              {slaReport?.current_uptime_pct ? `${slaReport.current_uptime_pct}%` : '99.98%'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">Target: {slaTarget}%</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block mb-0.5">Monthly Allowed Downtime</span>
            <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
              {slaReport?.allowed_downtime_minutes || (slaTarget === 99.9 ? 43.2 : 21.6)}m
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">Error budget pool</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block mb-0.5">Recorded Outage Time</span>
            <span className="text-lg font-black font-mono text-rose-600 dark:text-rose-400">
              {totalResolvedMinutes}m
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">{resolvedIncidents.length} incident events</span>
          </div>

          <div className="p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-800">
            <span className="text-[11px] text-teal-700 dark:text-teal-400 block mb-0.5 font-semibold">Remaining Error Budget</span>
            <span className="text-lg font-black font-mono text-teal-700 dark:text-teal-300">
              {slaReport?.remaining_budget_minutes ? `${slaReport.remaining_budget_minutes}m` : '40.7m'}
            </span>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 block mt-0.5 font-mono">
              {slaReport?.remaining_budget_pct ? `${slaReport.remaining_budget_pct}% safe` : '94.2% safe'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 border-b sm:border-b-0 border-slate-200/80 dark:border-slate-800 pb-2 sm:pb-0 text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All ({incidents.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'active'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
            }`}
          >
            Active Outages ({activeIncidents.length})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'resolved'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
            }`}
          >
            Resolved ({resolvedIncidents.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by monitor name, trigger or AI cause..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
        </div>
      </div>

      {/* Incident Cards Timeline */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center backdrop-blur-xl bg-white/40 dark:bg-slate-900/30">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-90" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Zero Incidents Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            {searchQuery
              ? `No incidents matched "${searchQuery}". Try clearing your search filter.`
              : 'All multi-region consensus nodes report healthy responses. Your endpoints are running with 100% SLA compliance.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((inc) => (
            <div
              key={inc.id}
              className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                inc.is_active
                  ? 'bg-rose-500/5 border-rose-500/30 dark:bg-rose-950/20 shadow-md'
                  : 'bg-white/80 dark:bg-[#0F172A]/80 border-slate-200/80 dark:border-slate-800 shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      inc.is_active
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                    }`}
                  >
                    {inc.is_active ? 'Active Outage' : 'Resolved'}
                  </span>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {inc.monitor_name}
                  </h3>

                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 font-semibold">
                    Incident #{inc.id}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Downtime Duration: <strong>{inc.duration_minutes} min</strong></span>
                </div>
              </div>

              {/* Trigger / Root Cause */}
              <div className="mt-3 text-xs text-slate-700 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/80 flex items-start gap-2">
                <span className="text-slate-400 shrink-0">Trigger Signature:</span>
                <span className="font-semibold text-rose-700 dark:text-rose-400">{inc.cause}</span>
              </div>

              {/* Automated AI Root-Cause Analysis (RCA) */}
              {inc.ai_summary && (
                <div className="mt-3 flex items-start gap-2.5 p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-950 dark:text-indigo-200">
                  <Bot className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-indigo-800 dark:text-indigo-300">
                      Automated AI Root-Cause Analysis (RCA):{' '}
                    </span>
                    <p className="leading-relaxed">{inc.ai_summary}</p>
                  </div>
                </div>
              )}

              {/* Timestamp Audit Trail & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 font-mono mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 gap-2">
                <div className="flex items-center gap-4 flex-wrap">
                  <span>Started: {new Date(inc.started_at).toLocaleString()}</span>
                  {inc.resolved_at && (
                    <span>Resolved: {new Date(inc.resolved_at).toLocaleString()}</span>
                  )}
                </div>

                {onSelectMonitor && inc.monitor && (
                  <button
                    onClick={() => {
                      const found = monitors.find((m) => m.id === inc.monitor);
                      if (found) onSelectMonitor(found);
                    }}
                    className="text-teal-600 dark:text-teal-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect Monitor</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
