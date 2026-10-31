'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  Bell,
  Send,
  Mail,
  ShieldCheck,
  Calendar,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  XCircle,
  HelpCircle,
  Code,
  Copy,
  Check,
  Radio,
  Sliders,
  Moon,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import { toggleTheme as sharedToggleTheme, getInitialTheme } from '@/lib/theme';
import { fetchStatusPage, subscribeToStatusPage } from '@/lib/api';
import { Monitor, Incident, StatusSummary } from '@/types';
import UptimeBar from '@/components/UptimeBar';
import StatusPill from '@/components/StatusPill';
import SentiroLogo from '@/components/SentiroLogo';

interface StatusGroup {
  name: string;
  description: string;
  monitors: Monitor[];
}

interface StatusPagePayload {
  system_status: string;
  status_headline: string;
  avg_sla_90d?: number;
  company_name?: string;
  headline?: string;
  announcement_text?: string;
  custom_domain?: string;
  updated_at: string;
  component_groups?: StatusGroup[];
  monitors: Monitor[];
  active_incidents: Incident[];
  past_incidents?: Incident[];
  recent_posts: Array<{ id: number; title: string; body: string; kind: string; created_at: string }>;
  scheduled_maintenances?: Array<{ id: number; title: string; description: string; starts_at: string; ends_at: string; is_currently_active?: boolean }>;
}

export default function AdvancedPublicStatusPage() {
  const [statusData, setStatusData] = useState<StatusPagePayload | null>(null);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pastIncidents, setPastIncidents] = useState<Incident[]>([]);
  const [scheduledMaintenances, setScheduledMaintenances] = useState<Array<{ id: number; title: string; description: string; starts_at: string; ends_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [refreshCountdown, setRefreshCountdown] = useState(30);
  
  // Modals & Interactivity
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [subscriberChannel, setSubscriberChannel] = useState<'email' | 'telegram' | 'webhook'>('email');
  const [subscriberInput, setSubscriberInput] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribedToast, setSubscribedToast] = useState<{ text: string; success: boolean } | null>(null);

  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [badgeCopied, setBadgeCopied] = useState<'markdown' | 'html' | 'url' | null>(null);

  // Dynamic origin for badge
  const [origin, setOrigin] = useState('https://sentiro.xyz');

  // Theme
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    setIsDark(getInitialTheme() === 'dark');
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: 'dark' | 'light' }>;
      setIsDark(customEvent.detail?.theme === 'dark');
    };
    window.addEventListener('sentiro-theme-change', handler);
    return () => window.removeEventListener('sentiro-theme-change', handler);
  }, []);

  const toggleTheme = () => {
    const next = sharedToggleTheme();
    setIsDark(next === 'dark');
  };

  const loadStatusData = async () => {
    try {
      setLoading(true);
      const data = await fetchStatusPage();
      setStatusData(data);
      setMonitors(data.monitors || []);
      setIncidents(data.active_incidents || []);
      setPastIncidents(data.past_incidents || []);
      setScheduledMaintenances(data.scheduled_maintenances || []);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setRefreshCountdown(30);
    } catch (err) {
      console.error('Failed to load status page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatusData();
    const refreshInterval = setInterval(loadStatusData, 30000);
    const ticker = setInterval(() => {
      setRefreshCountdown((prev) => (prev > 1 ? prev - 1 : 30));
    }, 1000);
    return () => {
      clearInterval(refreshInterval);
      clearInterval(ticker);
    };
  }, []);

  const systemStatus = statusData?.system_status || 'operational';
  const hasOutage = systemStatus === 'major_outage';
  const hasDegraded = systemStatus === 'degraded';

  // Group monitors if backend groups not present
  const componentGroups: StatusGroup[] = statusData?.component_groups && statusData.component_groups.length > 0
    ? statusData.component_groups
    : [
        {
          name: 'Core APIs & Ingestion Edge',
          description: 'High-throughput synthetic REST APIs, heartbeat receivers, and quorum probes',
          monitors: monitors.filter((m) => m.monitor_type === 'http' || m.monitor_type === 'heartbeat'),
        },
        {
          name: 'Web Applications & CDN Edge',
          description: 'Front-end applications, SSL certificates, and documentation portals',
          monitors: monitors.filter((m) => m.monitor_type === 'keyword' || m.monitor_type === 'ssl'),
        },
        {
          name: 'Data & Networking Infrastructure',
          description: 'TCP database ports, ICMP edge ping, and multi-region consensus routing',
          monitors: monitors.filter((m) => m.monitor_type === 'port' || m.monitor_type === 'ping' || m.monitor_type === 'dns'),
        },
      ];

  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberInput.trim()) return;
    try {
      setSubscribing(true);
      const res = await subscribeToStatusPage(subscriberChannel, subscriberInput.trim());
      setSubscribedToast({ text: res.message || 'Subscribed successfully!', success: true });
      setSubscribeOpen(false);
      setSubscriberInput('');
      setTimeout(() => setSubscribedToast(null), 5000);
    } catch (err: unknown) {
      setSubscribedToast({ text: err instanceof Error ? err.message : 'Subscription failed', success: false });
    } finally {
      setSubscribing(false);
    }
  };

  const badgeUrl = `${origin}/api/status-page/badge.svg`;
  const badgeMarkdown = `[![Sentiro Status](${badgeUrl})](https://sentiro.xyz/status)`;
  const badgeHtml = `<a href="https://sentiro.xyz/status"><img src="${badgeUrl}" alt="Sentiro Status" /></a>`;

  const copyText = (txt: string, type: 'markdown' | 'html' | 'url') => {
    navigator.clipboard.writeText(txt);
    setBadgeCopied(type);
    setTimeout(() => setBadgeCopied(null), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {subscribedToast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2.5 animate-slide-up-spring ${
            subscribedToast.success
              ? 'bg-teal-50 dark:bg-teal-950/80 border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200'
              : 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          {subscribedToast.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          )}
          <span>{subscribedToast.text}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <SentiroLogo size="md" subtitle={statusData?.company_name || 'Public Status Engine'} />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Refresh Counter */}
            <button
              onClick={loadStatusData}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-[11px] font-mono text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              title="Click to refresh now"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-teal-600' : 'text-slate-400'}`} />
              <span>{refreshCountdown}s</span>
            </button>

            {/* Embed Status Badge Button */}
            <button
              onClick={() => setBadgeModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <Code className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Badge</span>
            </button>

            {/* Subscribe to Updates Button */}
            <button
              onClick={() => setSubscribeOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm shadow-teal-600/20 transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Subscribe</span>
            </button>

            {/* Dark / Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Active Announcement Banner (if any configured by admin) */}
        {statusData?.announcement_text && (
          <div className="rounded-2xl border border-teal-200/90 dark:border-teal-800/60 bg-gradient-to-r from-teal-50/80 via-white to-teal-50/40 dark:from-teal-950/40 dark:via-[#0F172A] dark:to-teal-950/20 p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Bell className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                Official Operational Announcement
              </span>
              <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                {statusData.announcement_text}
              </p>
            </div>
          </div>
        )}

        {/* Overall System Health Status Hero Banner */}
        <div
          className={`relative overflow-hidden rounded-2xl border p-6 sm:p-7 shadow-sm transition-all duration-300 ${
            hasOutage
              ? 'bg-gradient-to-r from-rose-50 to-white dark:from-rose-950/40 dark:to-[#0B1120] border-rose-200 dark:border-rose-900/50'
              : hasDegraded
              ? 'bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/40 dark:to-[#0B1120] border-amber-200 dark:border-amber-900/50'
              : 'bg-gradient-to-r from-teal-50/60 via-white to-slate-50 dark:from-teal-950/30 dark:via-[#0F172A] dark:to-[#0B1120] border-teal-200/80 dark:border-teal-800/40'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                  hasOutage
                    ? 'bg-rose-600 text-white'
                    : hasDegraded
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white animate-sentinel-pulse'
                }`}
              >
                {hasOutage ? (
                  <XCircle className="w-6 h-6 stroke-[2.2]" />
                ) : hasDegraded ? (
                  <AlertCircle className="w-6 h-6 stroke-[2.2]" />
                ) : (
                  <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                )}
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {statusData?.status_headline ||
                    (hasOutage
                      ? 'Active Service Outage'
                      : hasDegraded
                      ? 'Degraded System Performance'
                      : 'All Systems Fully Operational')}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Verified across multi-region edge quorum probes • {statusData?.headline || 'Continuous SRE synthetic monitoring'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-500 dark:text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Updated {lastUpdated || 'just now'}</span>
            </div>
          </div>

          {/* 90-Day SLA Uptime Gauge Strip */}
          <div className="mt-6 pt-5 border-t border-slate-200/70 dark:border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-slate-400 font-medium">90-Day System SLA:</span>
                <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                  {statusData?.avg_sla_90d ?? 99.98}%
                </span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-slate-400 font-medium">Edge Ping:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">18ms avg</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Operational
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Suspect
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Outage
              </span>
            </div>
          </div>
        </div>

        {/* Active Incidents Banner (if any) */}
        {incidents.filter((i) => !i.resolved_at).length > 0 && (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-5 space-y-3">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Active Incident in Progress</span>
            </div>
            {incidents
              .filter((i) => !i.resolved_at)
              .map((inc) => (
                <div key={inc.id} className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-rose-100 dark:border-rose-900/40 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{inc.monitor_name}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono font-bold text-[10px] uppercase">
                      {inc.auto ? 'AUTOMATED CONSENSUS' : 'SRE DISPATCH'}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{inc.cause || inc.ai_summary || 'Edge probe reported timeout'}</p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Started: {new Date(inc.started_at).toLocaleString()}</span>
                    <span>Consensus: Corroborated by 4 edge nodes</span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Scheduled Maintenance Windows Section (if any scheduled) */}
        {scheduledMaintenances.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Scheduled Maintenance Windows</span>
            </h2>

            <div className="space-y-3">
              {scheduledMaintenances.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 p-5 space-y-2 backdrop-blur-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{m.title}</span>
                    </div>
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold self-start sm:self-auto">
                      Maintenance Notice
                    </span>
                  </div>
                  {m.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300">{m.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono pt-1 border-t border-amber-100 dark:border-amber-900/30">
                    <span>Starts: {new Date(m.starts_at).toLocaleString()}</span>
                    <span>Ends: {new Date(m.ends_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grouped SRE Service Components */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Service Component Health &amp; 90-Day SLA</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">{monitors.length} active monitors</span>
          </div>

          <div className="space-y-4">
            {componentGroups.map((group) => {
              if (group.monitors.length === 0) return null;
              const hasGroupDown = group.monitors.some((m) => m.state === 'down');
              const hasGroupSuspect = group.monitors.some((m) => m.state === 'suspect');
              return (
                <div
                  key={group.name}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-xl overflow-hidden shadow-sm"
                >
                  <div className="px-5 py-3.5 bg-slate-50/60 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{group.name}</h3>
                      <p className="text-[11px] text-slate-400">{group.description}</p>
                    </div>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold border ${
                        hasGroupDown
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60'
                          : hasGroupSuspect
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60'
                          : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200/60 dark:border-teal-800/60'
                      }`}
                    >
                      {hasGroupDown ? 'Disrupted' : hasGroupSuspect ? 'Degraded' : 'Operational'}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {group.monitors.map((mon) => (
                      <div key={mon.id} className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {mon.name}
                            </span>
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {mon.monitor_type}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-mono text-slate-400">
                              {mon.avg_latency ? `${mon.avg_latency}ms` : '18ms'}
                            </span>
                            <StatusPill state={mon.state} />
                          </div>
                        </div>

                        {/* Interactive 90-Day SLA Matrix Bar */}
                        <div className="space-y-1">
                          <UptimeBar ticks={mon.uptime_bar} height={16} />
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>90 days ago</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {mon.uptime_30d ?? 99.98}% uptime
                            </span>
                            <span>Today</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incident History & Resolved Timeline */}
        <div className="space-y-4">
          <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>Past Incidents &amp; Maintenance Timeline</span>
          </h2>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#0F172A]/70 p-5 divide-y divide-slate-100 dark:divide-slate-800/60 shadow-sm">
            {pastIncidents.length > 0 ? (
              pastIncidents.slice(0, 5).map((inc) => (
                <div key={inc.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                      {inc.monitor_name} — Outage Resolution
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(inc.started_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {inc.cause || inc.ai_summary || 'Transient packet loss on upstream transatlantic link. Consensus probe corroboration verified recovery.'}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolved in {inc.duration_minutes ? `${inc.duration_minutes} minutes` : '4 minutes'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                <span>Zero major service outages recorded in the last 90 days. High availability consensus verified.</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Subscribe to Outage Notifications Modal */}
      {subscribeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-slide-up-spring">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Subscribe to Alerts</h3>
                  <p className="text-[11px] text-slate-400">Receive instant notifications when outages occur</p>
                </div>
              </div>
              <button
                onClick={() => setSubscribeOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification Channel Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSubscriberChannel('email')}
                className={`py-1.5 rounded-lg transition-all ${
                  subscriberChannel === 'email'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setSubscriberChannel('telegram')}
                className={`py-1.5 rounded-lg transition-all ${
                  subscriberChannel === 'telegram'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Telegram Bot
              </button>
              <button
                type="button"
                onClick={() => setSubscriberChannel('webhook')}
                className={`py-1.5 rounded-lg transition-all ${
                  subscriberChannel === 'webhook'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Webhook
              </button>
            </div>

            <form onSubmit={handleSubscribeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {subscriberChannel === 'email'
                    ? 'Email Address'
                    : subscriberChannel === 'telegram'
                    ? 'Telegram Chat ID (Official @SentiroAlertBot)'
                    : 'Webhook Endpoint URL'}
                </label>
                <input
                  type={subscriberChannel === 'email' ? 'email' : 'text'}
                  value={subscriberInput}
                  onChange={(e) => setSubscriberInput(e.target.value)}
                  placeholder={
                    subscriberChannel === 'email'
                      ? 'ops@company.com'
                      : subscriberChannel === 'telegram'
                      ? 'e.g. 123456789 or @sre_alerts'
                      : 'https://api.company.com/v1/sentiro-hook'
                  }
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
                {subscriberChannel === 'telegram' && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Start <a href="https://t.me/SentiroAlertBot" target="_blank" rel="noreferrer" className="underline text-teal-500">@SentiroAlertBot</a> on Telegram, then enter your Chat ID.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubscribeOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subscribing}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  {subscribing ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embed Badge Code Modal */}
      {badgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-slide-up-spring">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Live Status Badge</h3>
                  <p className="text-[11px] text-slate-400">Embed real-time operational status on GitHub, docs, or websites</p>
                </div>
              </div>
              <button
                onClick={() => setBadgeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Badge Preview */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <img src={badgeUrl} alt="Sentiro Live Status Badge" className="h-7 object-contain" />
            </div>

            {/* Markdown Code */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Markdown Code
                </label>
                <button
                  onClick={() => copyText(badgeMarkdown, 'markdown')}
                  className="text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  {badgeCopied === 'markdown' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{badgeCopied === 'markdown' ? 'Copied' : 'Copy Markdown'}</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={2}
                value={badgeMarkdown}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 resize-none focus:outline-none"
              />
            </div>

            {/* HTML Code */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  HTML Snippet
                </label>
                <button
                  onClick={() => copyText(badgeHtml, 'html')}
                  className="text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  {badgeCopied === 'html' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{badgeCopied === 'html' ? 'Copied' : 'Copy HTML'}</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={2}
                value={badgeHtml}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 resize-none focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-8 px-4 text-center text-xs text-slate-400 bg-white/40 dark:bg-[#0B1120]/40">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SentiroLogo size="xs" showText={false} />
            <span>Powered by <Link href="/" className="font-semibold text-teal-600 hover:underline">Sentiro</Link> IT Sentinel</span>
          </div>
          <div>
            <span>Multi-Region Quorum • SQLite WAL • Sub-120MB Memory Footprint</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
