'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar, { NavItem } from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';
import SummaryStrip from '@/components/SummaryStrip';
import IncidentBanner from '@/components/IncidentBanner';
import MonitorCard from '@/components/MonitorCard';
import AddMonitorModal from '@/components/AddMonitorModal';
import MonitorDetailModal from '@/components/MonitorDetailModal';
import IncidentsDrawer from '@/components/IncidentsDrawer';
import ChannelsModal from '@/components/ChannelsModal';
import AuthModal from '@/components/AuthModal';
import DeveloperModal from '@/components/DeveloperModal';
import MaintenanceModal from '@/components/MaintenanceModal';
import WorkspaceModal from '@/components/WorkspaceModal';
import CommandPalette from '@/components/CommandPalette';
import BillsPage from '@/components/BillsPage';
import SettingsPage from '@/components/SettingsPage';
import ExecutiveDashboardView from '@/components/ExecutiveDashboardView';
import AlertChannelsPage from '@/components/AlertChannelsPage';
import MaintenancePage from '@/components/MaintenancePage';
import IncidentsPage from '@/components/IncidentsPage';
import StatusPageManager from '@/components/StatusPageManager';
import { getInitialTheme, applyTheme } from '@/lib/theme';
import {
  Monitor,
  Incident,
  StatusSummary,
  ProPlan,
  AlertChannel,
  User,
  Project,
  UserRole,
} from '@/types';
import {
  fetchOverview,
  fetchIncidents,
  fetchChannels,
  fetchProInfo,
  fetchCurrentUser,
  createMonitor,
  pauseMonitor,
  resumeMonitor,
  deleteMonitor,
  checkMonitorNow,
  getIncidentExportUrl,
} from '@/lib/api';
import {
  Plus,
  Search,
  Server,
  CheckCircle2,
  AlertCircle,
  Globe,
  Heart,
} from 'lucide-react';

export type ViewMode =
  | 'dashboard'
  | 'monitors'
  | 'incidents'
  | 'channels'
  | 'bills'
  | 'settings'
  | 'maintenance'
  | 'status-page';

export default function DashboardPage() {
  const router = useRouter();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [summary, setSummary] = useState<StatusSummary>({
    total: 0,
    up: 0,
    down: 0,
    suspect: 0,
    paused: 0,
    in_maintenance: 0,
    active_maintenance_windows: 0,
    overall_uptime_24h: 100,
    avg_latency_ms: 0,
    active_incidents_count: 0,
  });
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [channels, setChannels] = useState<AlertChannel[]>([]);
  const [proPlan, setProPlan] = useState<ProPlan | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectSlug, setActiveProjectSlug] = useState('production');

  // RBAC & Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('owner');
  const [canEdit, setCanEdit] = useState<boolean>(true);
  const [isOwner, setIsOwner] = useState<boolean>(true);

  // UI state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'down' | 'up' | 'paused'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isChannelsModalOpen, setIsChannelsModalOpen] = useState(false);
  const [isIncidentsModalOpen, setIsIncidentsModalOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Initial Setup: Theme & User Profile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const theme = getInitialTheme();
      applyTheme(theme);
    }

    fetchCurrentUser().then((data) => {
      if (!data.authenticated || !data.user) {
        router.replace('/login');
        return;
      }
      setCurrentUser(data.user);
      setActiveRole(data.active_role);
      setCanEdit(data.can_edit);
      setIsOwner(data.is_owner);
    });
  }, []);

  const handleRoleChanged = (newRole: UserRole) => {
    setActiveRole(newRole);
    setCanEdit(newRole === 'owner' || newRole === 'editor');
    setIsOwner(newRole === 'owner');
    showToast(`Role switched to ${newRole.toUpperCase()}. Permissions updated.`, 'info');
    loadData();
  };

  // Load dashboard overview data
  const loadData = useCallback(async (showLoadingSpinner = false) => {
    try {
      if (showLoadingSpinner) setIsRefreshing(true);
      const [overviewData, incidentsData, channelsData, proData] = await Promise.all([
        fetchOverview(activeProjectSlug),
        fetchIncidents('all'),
        fetchChannels(),
        fetchProInfo(),
      ]);

      setMonitors(overviewData.monitors || []);
      setSummary(overviewData.status_summary);
      setActiveIncidents(overviewData.active_incidents || []);
      setProPlan(overviewData.pro_plan || proData.pro_subscription);
      setAllIncidents(incidentsData || []);
      setChannels(channelsData || []);
      if (overviewData.projects) setProjects(overviewData.projects);

      setSelectedMonitor((prev) => {
        if (!prev) return null;
        const refreshed = overviewData.monitors?.find((m) => m.id === prev.id);
        return refreshed || prev;
      });
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
    } finally {
      if (showLoadingSpinner) setIsRefreshing(false);
    }
  }, [activeProjectSlug]);

  useEffect(() => {
    loadData(true);
    const timer = setInterval(() => {
      loadData(false);
    }, 15000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Global Keyboard Shortcuts (Cmd+K for search, N for new monitor)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      const isInput = target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !isInput) {
        if (canEdit) {
          e.preventDefault();
          setIsAddModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canEdit]);

  // Filter monitors based on active tab and search query
  const filteredMonitors = useMemo(() => {
    return monitors.filter((m) => {
      if (activeTab === 'down' && m.state !== 'down') return false;
      if (activeTab === 'up' && m.state !== 'up') return false;
      if (activeTab === 'paused' && !m.paused) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesTarget = m.target.toLowerCase().includes(q);
        const matchesType = (m.monitor_type || '').toLowerCase().includes(q);
        return matchesName || matchesTarget || matchesType;
      }
      return true;
    });
  }, [monitors, activeTab, searchQuery]);

  // Monitor operations with RBAC permission enforcement
  const handleCheckNow = async (id: number) => {
    if (!canEdit) {
      showToast('Permission denied: Viewer role cannot trigger manual checks.', 'error');
      return;
    }
    try {
      showToast('Running consensus probe check...', 'info');
      await checkMonitorNow(id);
      showToast('Check completed successfully.', 'success');
      loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Check failed', 'error');
    }
  };

  const handlePause = async (id: number) => {
    if (!canEdit) {
      showToast('Permission denied: Viewer role cannot pause monitors.', 'error');
      return;
    }
    try {
      await pauseMonitor(id);
      showToast('Monitor paused.', 'info');
      loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Pause failed', 'error');
    }
  };

  const handleResume = async (id: number) => {
    if (!canEdit) {
      showToast('Permission denied: Viewer role cannot resume monitors.', 'error');
      return;
    }
    try {
      await resumeMonitor(id);
      showToast('Monitor resumed.', 'success');
      loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Resume failed', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) {
      showToast('Permission denied: Viewer role cannot delete monitors.', 'error');
      return;
    }
    try {
      // Optimistic state filter for smooth animated card exit
      setMonitors((prev) => prev.filter((m) => m.id !== id));
      await deleteMonitor(id);
      showToast('Monitor vaporized successfully.', 'info');
      setSelectedMonitor(null);
      loadData(true);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
      loadData(true);
    }
  };

  const handleAddSubmit = async (data: Parameters<typeof createMonitor>[0]) => {
    if (!canEdit) {
      showToast('Permission denied: Viewer role cannot add monitors.', 'error');
      return;
    }
    await createMonitor(data);
    showToast('Monitor created successfully.', 'success');
    loadData();
  };

  // Sidebar navigation handler
  const handleNavigate = (view: NavItem) => {
    if (
      view === 'dashboard' ||
      view === 'monitors' ||
      view === 'incidents' ||
      view === 'channels' ||
      view === 'maintenance' ||
      view === 'bills' ||
      view === 'settings' ||
      view === 'status-page'
    ) {
      setViewMode(view);
    }
  };

  // Determine current page header title & subtitle
  const headerMeta: Record<ViewMode, { title: string; subtitle?: string }> = {
    dashboard: {
      title: 'Infrastructure Overview',
      subtitle: 'Real-time multi-region consensus probing with zero overhead',
    },
    monitors: {
      title: 'Health Monitors & Endpoints',
      subtitle: `${monitors.length} active probes across HTTP, TCP, TLS, and ICMP`,
    },
    incidents: {
      title: 'Incident Timeline & Outage History',
    },
    channels: {
      title: 'Alert Channels & Notification Routing',
    },
    maintenance: {
      title: 'Scheduled Maintenance Windows',
    },
    bills: {
      title: 'Billing & Invoices',
    },
    'status-page': {
      title: 'Status Page Service',
      subtitle: 'Public uptime transparency & 90-day SLA dashboard',
    },
    settings: {
      title: 'Workspace Settings & Team RBAC',
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 flex transition-colors">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border text-xs font-semibold shadow-xl flex items-center gap-2.5 transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : toast.type === 'error'
              ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
              : 'bg-teal-500/10 text-teal-600 border-teal-500/20'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Persistent Liquid-Glass Sidebar */}
      <Sidebar
        currentView={viewMode}
        onNavigate={handleNavigate}
        projects={projects}
        activeProjectSlug={activeProjectSlug}
        onSelectProject={(slug) => setActiveProjectSlug(slug)}
        activeRole={activeRole}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        canEdit={canEdit}
        activeIncidentsCount={activeIncidents.length}
        monitorsCount={monitors.length}
        proPlan={proPlan}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Top Header */}
        <TopHeader
          title={headerMeta[viewMode]?.title || 'Dashboard'}
          subtitle={headerMeta[viewMode]?.subtitle}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onRefresh={() => loadData(true)}
          isRefreshing={isRefreshing}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenIncidentsModal={() => setViewMode('incidents')}
          onOpenDeveloperModal={() => setIsDeveloperModalOpen(true)}
          canEdit={canEdit}
          activeIncidentsCount={activeIncidents.length}
        />

        {/* Dynamic Main View Switcher */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* 1. INCIDENTS TIMELINE PAGE */}
          {viewMode === 'incidents' && (
            <IncidentsPage
              onBackToDashboard={() => setViewMode('dashboard')}
              incidents={allIncidents}
              monitors={monitors}
              userRole={activeRole}
              onRefresh={() => loadData(true)}
              onSelectMonitor={(m) => setSelectedMonitor(m)}
            />
          )}

          {/* 2. ALERT CHANNELS PAGE */}
          {viewMode === 'channels' && (
            <AlertChannelsPage
              onBackToDashboard={() => setViewMode('dashboard')}
              onGoToBilling={() => setViewMode('bills')}
              userRole={activeRole}
              proPlan={proPlan}
            />
          )}

          {/* 2. BILLING & INVOICES PAGE */}
          {viewMode === 'bills' && (
            <BillsPage
              onBackToDashboard={() => setViewMode('dashboard')}
              userRole={activeRole}
              onProPlanUpdated={(p) => setProPlan(p)}
            />
          )}

          {/* 3. SETTINGS PAGE */}
          {viewMode === 'settings' && (
            <SettingsPage
              onBackToDashboard={() => setViewMode('dashboard')}
              currentUser={currentUser}
              activeRole={activeRole}
              onRoleChanged={handleRoleChanged}
              proPlan={proPlan}
              onGoToBilling={() => setViewMode('bills')}
            />
          )}

          {/* 4. SCHEDULED MAINTENANCE WINDOWS PAGE */}
          {viewMode === 'maintenance' && (
            <MaintenancePage
              onBackToDashboard={() => setViewMode('dashboard')}
              monitors={monitors}
              userRole={activeRole}
              onWindowsUpdated={() => loadData(true)}
            />
          )}

          {/* 5. ADVANCED STATUS PAGE SERVICE */}
          {viewMode === 'status-page' && (
            <StatusPageManager
              monitors={monitors}
              canEdit={canEdit}
              showToast={showToast}
            />
          )}

          {/* 4. EXECUTIVE OPERATIONS COMMAND CENTER */}
          {viewMode === 'dashboard' && (
            <ExecutiveDashboardView
              summary={summary}
              monitors={monitors}
              activeIncidents={activeIncidents}
              allIncidents={allIncidents}
              proPlan={proPlan}
              onGoToMonitors={() => setViewMode('monitors')}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenChannelsModal={() => setViewMode('channels')}
              onOpenIncidentsModal={() => setViewMode('incidents')}
              onSelectMonitor={(m) => setSelectedMonitor(m)}
              onExportCsv={() => window.open(getIncidentExportUrl('csv'), '_blank')}
              canEdit={canEdit}
            />
          )}

          {/* 5. DEDICATED HEALTH MONITORS INVENTORY */}
          {viewMode === 'monitors' && (
            <>
              {/* Active Incident Warning Banner */}
              <IncidentBanner
                incidents={activeIncidents}
                onViewIncidents={() => setViewMode('incidents')}
              />

              {/* Status Metric Strip (Zero-Overhead Metrics) */}
              <SummaryStrip
                summary={summary}
                onFilterDown={() => setActiveTab('down')}
                onFilterUp={() => setActiveTab('up')}
                onFilterAll={() => setActiveTab('all')}
              />

              {/* Filter Tabs & Search Controls Strip */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                {/* Status Segmented Buttons */}
                <div className="flex items-center p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold backdrop-blur-md">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'all'
                        ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    All ({monitors.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('down')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'down'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
                    }`}
                  >
                    Down ({summary.down})
                  </button>
                  <button
                    onClick={() => setActiveTab('up')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'up'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                    }`}
                  >
                    Operational ({summary.up})
                  </button>
                  <button
                    onClick={() => setActiveTab('paused')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'paused'
                        ? 'bg-slate-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Paused ({summary.paused})
                  </button>
                </div>

                {/* Inline Search Bar */}
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by name, URL, or port..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Monitors Grid */}
              {filteredMonitors.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center backdrop-blur-xl bg-white/40 dark:bg-slate-900/30">
                  <Server className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    No Health Monitors Found
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? `No monitors matched "${searchQuery}". Try clearing search.`
                      : 'Add your first HTTP endpoint, TLS certificate, or ICMP ping target.'}
                  </p>
                  {canEdit && (
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="mt-4 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add New Monitor</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMonitors.map((monitor) => (
                    <MonitorCard
                      key={monitor.id}
                      monitor={monitor}
                      onSelect={(m) => setSelectedMonitor(m)}
                      onCheckNow={handleCheckNow}
                      onPause={handlePause}
                      onResume={handleResume}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        {/* Minimal Clean Dashboard Footer */}
        <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-[#0B1120]/70 py-3.5 px-6 text-xs text-slate-400 flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-200">Sentiro</span>
            <span>•</span>
            <span className="font-mono text-teal-600 dark:text-teal-400 font-semibold">sentiro.xyz</span>
            <span>•</span>
            <span>The IT Sentinel</span>
          </div>
        </footer>
      </div>

      {/* ALL MODALS */}

      {/* Add Monitor Modal */}
      <AddMonitorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
        isPro={proPlan?.is_active}
        userRole={activeRole}
      />

      {/* Monitor Detail Modal */}
      <MonitorDetailModal
        monitor={selectedMonitor}
        isOpen={Boolean(selectedMonitor)}
        onClose={() => setSelectedMonitor(null)}
        onCheckNow={handleCheckNow}
        onPause={handlePause}
        onResume={handleResume}
        onDelete={handleDelete}
      />

      {/* Incidents Drawer */}
      <IncidentsDrawer
        isOpen={isIncidentsModalOpen}
        onClose={() => setIsIncidentsModalOpen(false)}
        incidents={allIncidents}
        onSelectMonitor={(monId) => {
          const found = monitors.find((m) => m.id === monId);
          if (found) setSelectedMonitor(found);
        }}
      />

      {/* Channels Modal */}
      <ChannelsModal
        isOpen={isChannelsModalOpen}
        onClose={() => setIsChannelsModalOpen(false)}
        channels={channels}
      />

      {/* Auth & RBAC Modal with Google Login */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        activeRole={activeRole}
        onRoleChanged={handleRoleChanged}
        onUserLoggedIn={(u, r) => {
          setCurrentUser(u);
          handleRoleChanged(r);
        }}
      />

      {/* Developer API & Observability Modal */}
      <DeveloperModal
        isOpen={isDeveloperModalOpen}
        onClose={() => setIsDeveloperModalOpen(false)}
        userRole={activeRole}
        firstMonitorId={monitors[0]?.id || 1}
      />

      {/* Scheduled Maintenance Modal */}
      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        monitors={monitors}
        userRole={activeRole}
        onWindowsUpdated={loadData}
      />

      {/* Workspace Multi-Tenancy Modal (Pro Feature) */}
      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        projects={projects}
        activeProjectSlug={activeProjectSlug}
        onSelectProject={(slug) => {
          setActiveProjectSlug(slug);
          loadData();
        }}
        onProjectsUpdated={loadData}
        proPlan={proPlan}
        activeRole={activeRole}
        onGoToBilling={() => setViewMode('bills')}
      />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        monitors={monitors}
        onSelectMonitor={(m) => setSelectedMonitor(m)}
        onOpenAdd={() => setIsAddModalOpen(true)}
        onOpenAuth={() => setViewMode('settings')}
        onOpenDeveloper={() => setIsDeveloperModalOpen(true)}
        onOpenMaintenance={() => setViewMode('maintenance')}
        onExportCsv={() => window.open(getIncidentExportUrl('csv'), '_blank')}
      />
    </div>
  );
}
