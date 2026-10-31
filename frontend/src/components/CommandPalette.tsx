'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Shield,
  Key,
  Wrench,
  FileDown,
  Server,
  ArrowRight,
} from 'lucide-react';
import { Monitor } from '../types';
import SentiroLogo from './SentiroLogo';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  monitors: Monitor[];
  onSelectMonitor: (m: Monitor) => void;
  onOpenAdd: () => void;
  onOpenAuth: () => void;
  onOpenDeveloper: () => void;
  onOpenMaintenance: () => void;
  onExportCsv: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  monitors,
  onSelectMonitor,
  onOpenAdd,
  onOpenAuth,
  onOpenDeveloper,
  onOpenMaintenance,
  onExportCsv,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredMonitors = monitors.filter(
    (m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.target.toLowerCase().includes(query.toLowerCase())
  );

  const actions = [
    { id: 'add', label: 'Add New Monitor', icon: <Plus className="w-4 h-4 text-teal-600" />, run: onOpenAdd },
    { id: 'auth', label: 'Workspace & Account Settings', icon: <Shield className="w-4 h-4 text-emerald-600" />, run: onOpenAuth },
    { id: 'dev', label: 'Developer API Keys & Prometheus /metrics', icon: <Key className="w-4 h-4 text-purple-600" />, run: onOpenDeveloper },
    { id: 'maint', label: 'Scheduled Maintenance Windows', icon: <Wrench className="w-4 h-4 text-teal-600" />, run: onOpenMaintenance },
    { id: 'csv', label: 'Export Incident Logs to CSV', icon: <FileDown className="w-4 h-4 text-slate-500" />, run: onExportCsv },
  ];

  const filteredActions = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/65 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all text-xs"
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search monitors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-mono"
          />
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {/* Monitors Matching */}
          {filteredMonitors.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Monitors ({filteredMonitors.length})
              </div>
              {filteredMonitors.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    onSelectMonitor(m);
                    onClose();
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-800 dark:text-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <Server className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold">{m.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-[180px]">
                      {m.target}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    {m.uptime_24h > 0 ? `${m.uptime_24h}%` : '100%'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div>
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 mt-2">
              Commands
            </div>
            {filteredActions.map((act) => (
              <div
                key={act.id}
                onClick={() => {
                  onClose();
                  act.run();
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  {act.icon}
                  <span className="font-medium">{act.label}</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#16223B] flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <SentiroLogo size="xs" showText={false} />
            <span>Sentiro Quick Ops</span>
          </div>
          <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700">Cmd+K</kbd> anytime</span>
        </div>
      </div>
    </div>
  );
}
