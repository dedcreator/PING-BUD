'use client';

import React from 'react';
import {
  Menu,
  Search,
  RefreshCw,
  Plus,
  Flame,
  Bell,
  Terminal,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { UserRole } from '../types';
import { toggleTheme, getInitialTheme } from '../lib/theme';
import SentiroLogo from './SentiroLogo';

interface TopHeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu: () => void;
  onOpenCommandPalette: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenAddModal: () => void;
  onOpenIncidentsModal: () => void;
  onOpenDeveloperModal: () => void;
  canEdit: boolean;
  activeIncidentsCount: number;
}

export default function TopHeader({
  title,
  subtitle,
  onOpenMobileMenu,
  onOpenCommandPalette,
  onRefresh,
  isRefreshing,
  onOpenAddModal,
  onOpenIncidentsModal,
  onOpenDeveloperModal,
  canEdit,
  activeIncidentsCount,
}: TopHeaderProps) {
  const isOutage = activeIncidentsCount > 0;
  const [isDark, setIsDark] = React.useState(true);

  React.useEffect(() => {
    setIsDark(getInitialTheme() === 'dark');
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: 'dark' | 'light' }>;
      setIsDark(customEvent.detail?.theme === 'dark');
    };
    window.addEventListener('sentiro-theme-change', handler);
    return () => window.removeEventListener('sentiro-theme-change', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 backdrop-blur-xl bg-white/70 dark:bg-[#0B1120]/75 border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors">
      {/* Left: Mobile Menu Trigger & Section Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 lg:hidden"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile brand badge */}
        <div className="lg:hidden flex items-center shrink-0">
          <SentiroLogo size="xs" showText={false} />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Center: Command Palette Trigger Input */}
      <div
        onClick={onOpenCommandPalette}
        className="hidden md:flex items-center flex-1 max-w-sm relative cursor-pointer"
      >
        <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
        <input
          readOnly
          type="text"
          placeholder="Search monitors, commands..."
          className="w-full pl-9 pr-14 py-1.5 text-xs bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 cursor-pointer font-mono transition-colors"
        />
        <kbd className="absolute right-2.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400">
          ⌘K
        </kbd>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Incidents Drawer Trigger */}
        <button
          onClick={onOpenIncidentsModal}
          className={`relative p-2 rounded-xl transition-colors ${
            isOutage
              ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
          }`}
          title="Incident Logs"
        >
          <Flame className="w-4 h-4" />
          {isOutage && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>

        {/* Developer Modal Trigger */}
        <button
          onClick={onOpenDeveloperModal}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
          title="Developer Scoped API Keys & Metrics"
        >
          <Terminal className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        </button>

        {/* Dark / Light Theme Toggle */}
        <button
          onClick={() => {
            const next = toggleTheme();
            setIsDark(next === 'dark');
          }}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 rounded-xl transition-colors disabled:opacity-50"
          title="Refresh Probes"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
        </button>

        {/* Log Out Button */}
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('pulsewatch_token');
              localStorage.removeItem('pulsewatch_demo_role');
              window.location.href = '/';
            }
          }}
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          title="Log Out (Sign Out)"
        >
          <LogOut className="w-4 h-4" />
        </button>

        {/* Quick Add Monitor Button */}
        <button
          onClick={canEdit ? onOpenAddModal : undefined}
          disabled={!canEdit}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            canEdit
              ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
          }`}
          title={canEdit ? 'Add Health Monitor (N)' : 'Requires Editor or Owner'}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Add Monitor</span>
          <span className="inline sm:hidden">Add</span>
        </button>
      </div>
    </header>
  );
}
