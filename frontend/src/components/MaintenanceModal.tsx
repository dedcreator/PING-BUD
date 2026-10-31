'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  Calendar,
  Clock,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import { MaintenanceWindow, Monitor, UserRole } from '../types';
import { fetchMaintenanceWindows, createMaintenanceWindow, deleteMaintenanceWindow } from '../lib/api';
import SentiroLogo from './SentiroLogo';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  monitors: Monitor[];
  userRole: UserRole;
  onWindowsUpdated?: () => void;
}

export default function MaintenanceModal({
  isOpen,
  onClose,
  monitors,
  userRole,
  onWindowsUpdated,
}: MaintenanceModalProps) {
  const [windows, setWindows] = useState<MaintenanceWindow[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [selectedMonitorIds, setSelectedMonitorIds] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const canEdit = userRole === 'owner' || userRole === 'editor';

  const loadData = () => {
    setLoading(true);
    fetchMaintenanceWindows()
      .then(setWindows)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      // Default to starting in 1 hour, ending in 3 hours
      const now = new Date();
      const start = new Date(now.getTime() + 60 * 60 * 1000);
      const end = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      setStartsAt(start.toISOString().slice(0, 16));
      setEndsAt(end.toISOString().slice(0, 16));
      setSelectedMonitorIds(monitors.slice(0, 2).map((m) => m.id));
    }
  }, [isOpen, monitors]);

  if (!isOpen) return null;

  const handleToggleMonitor = (id: number) => {
    setSelectedMonitorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      setErrorMsg('Viewer role cannot schedule maintenance.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Title is required');
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
      loadData();
      if (onWindowsUpdated) onWindowsUpdated();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to schedule');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    try {
      await deleteMaintenanceWindow(id);
      setWindows((prev) => prev.filter((w) => w.id !== id));
      if (onWindowsUpdated) onWindowsUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <SentiroLogo size="sm" showText={false} />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Scheduled Maintenance Windows
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Suppress false alarms and display maintenance notices on public status pages
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

        {errorMsg && (
          <div className="mt-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Windows List */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Upcoming & Active Windows ({windows.length})
            </span>
            {canEdit && !showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Maintenance</span>
              </button>
            )}
          </div>

          {/* New Window Form */}
          {showAddForm && (
            <form onSubmit={handleCreate} className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span>Schedule New Planned Downtime</span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title / Reason
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Postgres DB Migration & Kernel Updates"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Affected Monitors (Alerts will be silenced)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  {monitors.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMonitorIds.includes(m.id)}
                        onChange={() => handleToggleMonitor(m.id)}
                        className="rounded text-indigo-600 focus:ring-0"
                      />
                      <span className="truncate">{m.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 rounded-lg font-bold bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 flex items-center gap-1.5"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Maintenance Window</span>
                </button>
              </div>
            </form>
          )}

          {/* List items */}
          <div className="space-y-2.5">
            {windows.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                No scheduled maintenance windows. All monitors are in active live check mode.
              </div>
            ) : (
              windows.map((w) => (
                <div
                  key={w.id}
                  className={`p-4 rounded-xl border transition-all ${
                    w.is_currently_active
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-slate-50/60 dark:bg-[#16223B]/60 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{w.title}</span>
                        {w.is_currently_active ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold animate-pulse">
                            Active Right Now
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
                            Upcoming
                          </span>
                        )}
                      </div>
                      {w.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{w.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(w.starts_at).toLocaleString()} → {new Date(w.ends_at).toLocaleTimeString()}</span>
                        </span>
                        <span>•</span>
                        <span>{w.monitor_ids?.length || 0} services silenced</span>
                      </div>
                    </div>

                    {canEdit && (
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Delete Window"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
