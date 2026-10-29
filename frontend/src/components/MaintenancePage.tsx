'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Server,
  Shield,
  Loader2,
  RefreshCw,
  BellOff,
  Radio,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { MaintenanceWindow, Monitor, UserRole } from '../types';
import {
  fetchMaintenanceWindows,
  createMaintenanceWindow,
  deleteMaintenanceWindow,
} from '../lib/api';

interface MaintenancePageProps {
  onBackToDashboard: () => void;
  monitors: Monitor[];
  userRole: UserRole;
  onWindowsUpdated?: () => void;
}

export default function MaintenancePage({
  onBackToDashboard,
  monitors,
  userRole,
  onWindowsUpdated,
}: MaintenancePageProps) {
  const [windows, setWindows] = useState<MaintenanceWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'upcoming' | 'past'>('all');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [selectedMonitorIds, setSelectedMonitorIds] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [nowTime, setNowTime] = useState<number>(0);

  useEffect(() => {
    setNowTime(Date.now());
    const interval = setInterval(() => setNowTime(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const canEdit = userRole === 'owner' || userRole === 'editor';

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchMaintenanceWindows();
      setWindows(data || []);
    } catch (err) {
      console.error('Failed to load maintenance windows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Default form times: starts in 30 mins, lasts 2 hours
    const now = new Date();
    const start = new Date(now.getTime() + 30 * 60 * 1000);
    const end = new Date(now.getTime() + 150 * 60 * 1000);
    setStartsAt(start.toISOString().slice(0, 16));
    setEndsAt(end.toISOString().slice(0, 16));
    if (monitors.length > 0) {
      setSelectedMonitorIds(monitors.slice(0, 2).map((m) => m.id));
    }
  }, [monitors]);

  const handleToggleMonitor = (id: number) => {
    setSelectedMonitorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllMonitors = () => {
    if (selectedMonitorIds.length === monitors.length) {
      setSelectedMonitorIds([]);
    } else {
      setSelectedMonitorIds(monitors.map((m) => m.id));
    }
  };

  const handleSetPreset = (preset: '1hour' | 'tonight' | 'weekend') => {
    const now = new Date();
    if (preset === '1hour') {
      const start = new Date(now.getTime() + 15 * 60 * 1000);
      const end = new Date(now.getTime() + 75 * 60 * 1000);
      setStartsAt(start.toISOString().slice(0, 16));
      setEndsAt(end.toISOString().slice(0, 16));
    } else if (preset === 'tonight') {
      const tonight = new Date();
      tonight.setHours(23, 0, 0, 0);
      const endTonight = new Date(tonight.getTime() + 4 * 60 * 60 * 1000);
      setStartsAt(tonight.toISOString().slice(0, 16));
      setEndsAt(endTonight.toISOString().slice(0, 16));
    } else if (preset === 'weekend') {
      const sat = new Date();
      sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7));
      sat.setHours(2, 0, 0, 0);
      const endSat = new Date(sat.getTime() + 4 * 60 * 60 * 1000);
      setStartsAt(sat.toISOString().slice(0, 16));
      setEndsAt(endSat.toISOString().slice(0, 16));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      setErrorMsg('Viewer role cannot schedule maintenance windows.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Maintenance window title is required.');
      return;
    }

    try {
      setCreating(true);
      setErrorMsg('');
      await createMaintenanceWindow({
        title: title.trim(),
        description: description.trim(),
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        monitor_ids: selectedMonitorIds,
      });

      setShowAddForm(false);
      setTitle('');
      setDescription('');
      setSuccessToast('Maintenance window scheduled successfully.');
      setTimeout(() => setSuccessToast(''), 4000);
      await loadData();
      if (onWindowsUpdated) onWindowsUpdated();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to schedule maintenance window');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    if (!window.confirm('Are you sure you want to cancel this maintenance window? Alerts will resume immediately.')) {
      return;
    }
    try {
      await deleteMaintenanceWindow(id);
      setWindows((prev) => prev.filter((w) => w.id !== id));
      setSuccessToast('Maintenance window removed. Active monitoring resumed.');
      setTimeout(() => setSuccessToast(''), 4000);
      if (onWindowsUpdated) onWindowsUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  // Window status calculation
  const currentTs = nowTime;
  const activeWindows = windows.filter((w) => {
    if (!currentTs) return false;
    const s = new Date(w.starts_at).getTime();
    const e = new Date(w.ends_at).getTime();
    return currentTs >= s && currentTs <= e;
  });
  const upcomingWindows = windows.filter((w) => {
    if (!currentTs) return false;
    const s = new Date(w.starts_at).getTime();
    return currentTs < s;
  });
  const pastWindows = windows.filter((w) => {
    if (!currentTs) return false;
    const e = new Date(w.ends_at).getTime();
    return currentTs > e;
  });

  const filteredWindows = windows.filter((w) => {
    if (!currentTs) return true;
    const s = new Date(w.starts_at).getTime();
    const e = new Date(w.ends_at).getTime();
    if (filterTab === 'active') return currentTs >= s && currentTs <= e;
    if (filterTab === 'upcoming') return currentTs < s;
    if (filterTab === 'past') return currentTs > e;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs font-semibold shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Maintenance Windows
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {windows.length} Windows
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Refresh windows"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canEdit && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{showAddForm ? 'Close Form' : 'Schedule Maintenance'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SRE Operational Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Active Now</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {activeWindows.length}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
            {activeWindows.length > 0 ? 'Alerts suppressed' : 'All probes alerting live'}
          </div>
        </div>

        <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Upcoming Windows</span>
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
            {upcomingWindows.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Scheduled in calendar</div>
        </div>

        <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Total Monitored Endpoints</span>
            <Server className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {monitors.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Available for target scope</div>
        </div>

        <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Alert Silence Mode</span>
            <BellOff className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            Zero False Alarm
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Telegram & Email protected</div>
        </div>
      </div>

      {/* Schedule Window Creation Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-3xl border border-teal-200/80 dark:border-teal-800/80 backdrop-blur-xl bg-white/90 dark:bg-[#0F172A]/90 p-6 shadow-xl space-y-5 animate-in slide-in-from-top-3 duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Schedule New Maintenance Window
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Maintenance Window Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., PostgreSQL 16 Migration & Index Rebuild"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Quick Time Presets
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetPreset('1hour')}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 border border-slate-200 dark:border-slate-700"
                >
                  Next 1 Hour
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPreset('tonight')}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 border border-slate-200 dark:border-slate-700"
                >
                  Tonight (11 PM)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPreset('weekend')}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 border border-slate-200 dark:border-slate-700"
                >
                  Saturday 2 AM
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Starts At *
              </label>
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Ends At *
              </label>
              <input
                type="datetime-local"
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Public Description & Subscriber Notice
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notice displayed on public status page: 'Upgrading database storage volume. Brief HTTP 502 blips expected between 2:00 AM and 3:30 AM.'"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Targeted Monitors Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Target Monitors to Suppress ({selectedMonitorIds.length} of {monitors.length} selected)
              </label>
              <button
                type="button"
                onClick={handleSelectAllMonitors}
                className="text-xs text-teal-600 font-semibold hover:underline"
              >
                {selectedMonitorIds.length === monitors.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              {monitors.map((m) => {
                const selected = selectedMonitorIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleToggleMonitor(m.id)}
                    className={`p-2 rounded-lg text-left text-xs font-medium transition-all flex items-center justify-between border ${
                      selected
                        ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-900 dark:text-teal-200 font-semibold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-300'
                    }`}
                  >
                    <span className="truncate">{m.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {m.monitor_type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {creating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scheduling Window...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Activate Maintenance Window</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            filterTab === 'all'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          All Windows ({windows.length})
        </button>
        <button
          onClick={() => setFilterTab('active')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            filterTab === 'active'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
          }`}
        >
          Active Now ({activeWindows.length})
        </button>
        <button
          onClick={() => setFilterTab('upcoming')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            filterTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
          }`}
        >
          Upcoming ({upcomingWindows.length})
        </button>
        <button
          onClick={() => setFilterTab('past')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            filterTab === 'past'
              ? 'bg-slate-700 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          Past / Completed ({pastWindows.length})
        </button>
      </div>

      {/* Maintenance Windows List / Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
          <span>Loading scheduled maintenance windows...</span>
        </div>
      ) : filteredWindows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center backdrop-blur-xl bg-white/40 dark:bg-slate-900/30">
          <Calendar className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No Maintenance Windows Scheduled
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            All monitors are in active, 24/7 probing mode. When performing migrations or software deploys, scheduling a maintenance window suppresses midnight false alarms and keeps your 99.99% SLA clean.
          </p>
          {canEdit && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Schedule First Window</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredWindows.map((w) => {
            const s = new Date(w.starts_at).getTime();
            const e = new Date(w.ends_at).getTime();
            const isActive = currentTs > 0 && currentTs >= s && currentTs <= e;
            const isPast = currentTs > 0 && currentTs > e;

            return (
              <div
                key={w.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-amber-500/5 border-amber-500/30 shadow-md'
                    : isPast
                    ? 'bg-white/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-70'
                    : 'bg-white/80 dark:bg-[#0F172A]/80 border-slate-200/80 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        isActive
                          ? 'bg-amber-500 text-white animate-pulse'
                          : isPast
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {isActive ? 'In Progress' : isPast ? 'Completed' : 'Upcoming'}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {w.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(w.starts_at).toLocaleDateString()} {new Date(w.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>→</span>
                      <span>{new Date(w.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {canEdit && (
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete maintenance window"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {w.description && (
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {w.description}
                  </p>
                )}

                <div className="mt-3 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-mono">Protected Endpoints:</span>
                    {(w.monitor_ids || []).length === 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-mono">
                        All Monitors in Workspace
                      </span>
                    ) : (
                      (w.monitor_ids || []).map((mid) => {
                        const target = monitors.find((m) => m.id === mid);
                        return (
                          <span
                            key={mid}
                            className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-[10px] font-mono font-semibold"
                          >
                            {target?.name || `Monitor #${mid}`}
                          </span>
                        );
                      })
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Telegram & Email alerts muted</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
