'use client';

import React, { useState } from 'react';
import {
  Activity,
  LayoutDashboard,
  Server,
  Flame,
  Bell,
  Calendar,
  Radio,
  Receipt,
  Settings,
  Tag,
  Globe,
  Terminal,
  ShieldCheck,
  ChevronDown,
  Layers,
  Plus,
  ExternalLink,
  ChevronRight,
  User,
  Sliders,
  CheckCircle2,
  X,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { ProPlan, Project, UserRole } from '../types';
import SentiroLogo from './SentiroLogo';
import { toggleTheme, getInitialTheme } from '../lib/theme';
import FeedbackModal, { FeedbackMode } from './FeedbackModal';

export type NavItem =
  | 'dashboard'
  | 'monitors'
  | 'incidents'
  | 'channels'
  | 'maintenance'
  | 'bills'
  | 'settings'
  | 'status-page'
  | 'feature-request'
  | 'report-issue';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: NavItem) => void;
  projects?: Project[];
  activeProjectSlug: string;
  onSelectProject: (slug: string) => void;
  activeRole: UserRole;
  onOpenAuthModal: () => void;
  onOpenAddModal: () => void;
  onOpenWorkspaceModal?: () => void;
  canEdit: boolean;
  activeIncidentsCount: number;
  monitorsCount: number;
  proPlan?: ProPlan | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({
  currentView,
  onNavigate,
  projects = [],
  activeProjectSlug,
  onSelectProject,
  activeRole,
  onOpenAuthModal,
  onOpenAddModal,
  onOpenWorkspaceModal,
  canEdit,
  activeIncidentsCount,
  monitorsCount,
  proPlan,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>('feature');
  const [isDark, setIsDark] = useState(true);

  React.useEffect(() => {
    setIsDark(getInitialTheme() === 'dark');
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: 'dark' | 'light' }>;
      setIsDark(customEvent.detail?.theme === 'dark');
    };
    window.addEventListener('sentiro-theme-change', handler);
    return () => window.removeEventListener('sentiro-theme-change', handler);
  }, []);

  const currentProjectName =
    projects.find((p) => p.slug === activeProjectSlug)?.name ||
    'Production Infrastructure';

  const isOutage = activeIncidentsCount > 0;

  const roleLabels: Record<UserRole, { label: string; badgeClass: string }> = {
    owner: {
      label: 'Workspace Owner',
      badgeClass: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20',
    },
    editor: {
      label: 'DevOps Editor',
      badgeClass: 'text-teal-700 dark:text-teal-300 bg-teal-500/10 border-teal-500/20',
    },
    viewer: {
      label: 'Read-only Viewer',
      badgeClass: 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20',
    },
  };

  const navGroups = [
    {
      group: 'Overview',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          id: 'monitors',
          label: 'Health Monitors',
          icon: Server,
          badge: monitorsCount.toString(),
        },
        {
          id: 'incidents',
          label: 'Incidents & Log',
          icon: Flame,
          badge: isOutage ? `${activeIncidentsCount} active` : null,
          badgeColor: isOutage ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600',
        },
      ],
    },
    {
      group: 'Operations',
      items: [
        {
          id: 'status-page' as NavItem,
          label: 'Status Page',
          icon: Radio,
          badge: 'Live',
          badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
        },
        {
          id: 'channels' as NavItem,
          label: 'Alert Channels',
          icon: Bell,
          badge: null,
        },
        {
          id: 'maintenance' as NavItem,
          label: 'Maintenance',
          icon: Calendar,
          badge: null,
        },
      ],
    },
    {
      group: 'Workspace & SaaS',
      items: [
        {
          id: 'bills',
          label: 'Billing & Invoices',
          icon: Receipt,
          badge: 'Pro',
        },
        {
          id: 'settings',
          label: 'Workspace Settings',
          icon: Settings,
          badge: null,
        },
      ],
    },
    {
      group: 'Support & Feedback',
      items: [
        {
          id: 'feature-request',
          label: 'Request a Feature',
          icon: Sparkles,
          badge: 'New',
          badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
        },
        {
          id: 'report-issue',
          label: 'Report an Issue',
          icon: AlertCircle,
          badge: null,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Main Liquid Glass Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 flex flex-col justify-between backdrop-blur-xl bg-white/80 dark:bg-[#0D1527]/90 border-r border-slate-200/80 dark:border-slate-800/80 shadow-lg lg:shadow-none transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Top Brand & Workspace Strip */}
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  onNavigate('dashboard');
                  onCloseMobile();
                }}
                className="flex items-center gap-2.5 text-left group"
              >
                <SentiroLogo size="md" subtitle="sentiro.xyz" />
              </button>

              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Workspace / Project Selector Dropdown */}
            <div className="relative mt-2">
              <button
                onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100/70 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="truncate">{currentProjectName}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
              </button>

              {workspaceMenuOpen && (
                <div
                  onClick={() => setWorkspaceMenuOpen(false)}
                  className="absolute left-0 right-0 top-full mt-1.5 rounded-xl bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 z-50 text-xs"
                >
                  <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Switch Workspace
                  </div>
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => onSelectProject(proj.slug)}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                        activeProjectSlug === proj.slug
                          ? 'font-bold text-teal-700 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-950/30'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{proj.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {proj.monitors_count || 0}
                      </span>
                    </button>
                  ))}

                  <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800 px-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setWorkspaceMenuOpen(false);
                        if (onOpenWorkspaceModal) onOpenWorkspaceModal();
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 font-semibold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Manage Workspace</span>
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20">
                        PRO
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action: Add Monitor */}
            <button
              onClick={() => {
                if (canEdit) onOpenAddModal();
                onCloseMobile();
              }}
              disabled={!canEdit}
              className={`w-full mt-2.5 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                canEdit
                  ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                  : 'bg-slate-200/60 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Health Monitor</span>
            </button>
          </div>

          {/* Navigation Items by Group */}
          <nav className="p-3 space-y-5 flex-1">
            {navGroups.map((grp) => (
              <div key={grp.group}>
                <div className="px-3 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  {grp.group}
                </div>
                <div className="space-y-0.5">
                  {grp.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.id === 'feature-request') {
                            setFeedbackMode('feature');
                            setFeedbackModalOpen(true);
                          } else if (item.id === 'report-issue') {
                            setFeedbackMode('issue');
                            setFeedbackModalOpen(true);
                          } else {
                            onNavigate(item.id as NavItem);
                          }
                          onCloseMobile();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-semibold border border-teal-200/60 dark:border-teal-800/60'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 ${
                              isActive
                                ? 'text-teal-600 dark:text-teal-400'
                                : 'text-slate-400 group-hover:text-slate-600'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          item.id === 'status-page' ? (
                            <a
                              href="/status"
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 flex items-center gap-1 transition-colors"
                              title="Open public status page in new tab"
                            >
                              <span>Live</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border border-slate-200 dark:border-slate-700 ${
                                item.badgeColor ||
                                (isActive
                                  ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400')
                              }`}
                            >
                              {item.badge}
                            </span>
                          )
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom User & Role Strip */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0B1120]/50 space-y-2">
          {/* RBAC Role Chip Button + Log Out Button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onOpenAuthModal();
                onCloseMobile();
              }}
              className={`flex-1 flex items-center justify-between p-2 rounded-xl text-xs font-semibold border transition-all truncate ${roleLabels[activeRole].badgeClass}`}
              title="Click to Switch User / Role"
            >
              <div className="flex items-center gap-1.5 truncate">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{roleLabels[activeRole].label}</span>
              </div>
              <span className="text-[10px] uppercase font-mono font-bold opacity-70 shrink-0 ml-1">
                RBAC
              </span>
            </button>

            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={() => {
                const next = toggleTheme();
                setIsDark(next === 'dark');
              }}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('pulsewatch_token');
                  localStorage.removeItem('pulsewatch_demo_role');
                  window.location.href = '/';
                }
              }}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-500 transition-colors shrink-0"
              title="Log Out (Sign Out)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Feature Request & Issue Reporting Modal */}
      <FeedbackModal
        isOpen={feedbackModalOpen}
        initialMode={feedbackMode}
        onClose={() => setFeedbackModalOpen(false)}
      />
    </>
  );
}
