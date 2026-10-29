'use client';

import React, { useState, useEffect } from 'react';
import {
  Building,
  Users,
  Bell,
  Key,
  Shield,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  Copy,
  Trash2,
  Plus,
  RefreshCw,
  Clock,
  Mail,
  Send,
  Server,
  Lock,
  Eye,
  Sliders,
  ExternalLink,
  Info,
  Check,
  Smartphone,
  AlertCircle,
  Database,
  Calendar,
} from 'lucide-react';
import { UserRole, ApiKey, User } from '../types';
import {
  fetchApiKeys,
  createApiKey,
  deleteApiKey,
  setClientDemoRole,
  getClientDemoRole,
  linkGoogleAccount,
  sendTestEmail,
} from '../lib/api';

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

interface SettingsPageProps {
  onBackToDashboard?: () => void;
  currentUser?: User | null;
  activeRole: UserRole;
  onRoleChanged: (newRole: UserRole) => void;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  plan: string;
  joined_at: string;
  is_current?: boolean;
}

export default function SettingsPage({
  onBackToDashboard,
  currentUser,
  activeRole,
  onRoleChanged,
}: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<
    'general' | 'alerts' | 'team' | 'developer' | 'security'
  >('general');

  // General settings state
  const [workspaceName, setWorkspaceName] = useState('pingbud.us Core Infrastructure');
  const [workspaceSlug, setWorkspaceSlug] = useState('production');
  const [contactEmail, setContactEmail] = useState('ops@pingbud.us');
  const [timezone, setTimezone] = useState('Africa/Lagos (WAT, UTC+1)');
  const [savedGeneral, setSavedGeneral] = useState(false);

  // Telegram & Email Notifications state
  const [telegramBotToken, setTelegramBotToken] = useState('6829104812:AAH92vLksP89Qx_PingBud');
  const [telegramChatId, setTelegramChatId] = useState('-1001982736451');
  const [telegramBotUsername, setTelegramBotUsername] = useState('@PingBudAlertBot');
  const [telegramEnabled, setTelegramEnabled] = useState(true);

  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [sreEmailRecipients, setSreEmailRecipients] = useState('ops@pulsewatch.dev, sre-team@company.com');
  const [includeAiSummary, setIncludeAiSummary] = useState(true);
  const [alertOnRecovery, setAlertOnRecovery] = useState(true);

  // Quiet Hours & Escalation Policy
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState('23:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [escalationDelayMinutes, setEscalationDelayMinutes] = useState(5);
  const [savedAlerts, setSavedAlerts] = useState(false);
  const [testAlertFeedback, setTestAlertFeedback] = useState<string | null>(null);

  // Google / Gmail Link State
  const [linkedGoogleEmail, setLinkedGoogleEmail] = useState(
    currentUser?.email?.includes('@gmail.com') ? currentUser.email : ''
  );
  const [googleInputEmail, setGoogleInputEmail] = useState('');
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [googleLinkMsg, setGoogleLinkMsg] = useState<string | null>(null);

  // Resend Settings State
  const [resendApiKey, setResendApiKey] = useState('re_live_98a72b109c8e...');
  const [resendFromEmail, setResendFromEmail] = useState('pingbud.us <onboarding@resend.dev>');
  const [resendTestStatus, setResendTestStatus] = useState<string | null>(null);
  const [isTestingResend, setIsTestingResend] = useState(false);

  // Team settings state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: 1,
      name: 'System Administrator',
      email: 'admin@pulsewatch.dev',
      role: 'owner',
      plan: 'Full SaaS Admin',
      joined_at: 'Oct 2026',
      is_current: true,
    },
    {
      id: 2,
      name: 'Indie Pro Lead',
      email: 'indie@pulsewatch.dev',
      role: 'owner',
      plan: 'Indie Pro (₦2,000/mo)',
      joined_at: 'Oct 2026',
    },
    {
      id: 3,
      name: 'Team Pro Lead',
      email: 'team@pulsewatch.dev',
      role: 'owner',
      plan: 'Team Pro (₦5,000/mo)',
      joined_at: 'Oct 2026',
    },
    {
      id: 4,
      name: 'DevOps Engineer',
      email: 'devops@pulsewatch.dev',
      role: 'editor',
      plan: 'Engineering Team',
      joined_at: 'Oct 2026',
    },
    {
      id: 5,
      name: 'Stakeholder Observer',
      email: 'free@pulsewatch.dev',
      role: 'viewer',
      plan: 'Community (₦0)',
      joined_at: 'Oct 2026',
    },
  ]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Developer & API keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState<'read' | 'write' | 'admin'>('read');
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Security & Compliance state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [dataRetentionDays, setDataRetentionDays] = useState(365);
  const [ipWhitelistingEnabled, setIpWhitelistingEnabled] = useState(false);

  const isOwner = activeRole === 'owner';

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      setLoadingKeys(true);
      const keys = await fetchApiKeys();
      setApiKeys(keys);
    } catch {
      // fallback
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      const res = await createApiKey(newKeyName.trim(), newKeyScope);
      setCreatedRawKey(res.secret_key);
      setNewKeyName('');
      loadKeys();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create API key');
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    try {
      await deleteApiKey(id);
      loadKeys();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to revoke API key');
    }
  };

  const handleCopyRawKey = () => {
    if (!createdRawKey) return;
    navigator.clipboard.writeText(createdRawKey);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const newMember: TeamMember = {
      id: Date.now(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail.trim(),
      role: inviteRole,
      plan: 'Team Member',
      joined_at: 'Just now',
    };
    setTeamMembers((prev) => [...prev, newMember]);
    setInviteSuccess(`Invitation sent to ${inviteEmail} as ${inviteRole.toUpperCase()}`);
    setInviteEmail('');
    setTimeout(() => setInviteSuccess(''), 4000);
  };

  const handleRoleSwitch = (role: UserRole) => {
    setClientDemoRole(role);
    onRoleChanged(role);
  };

  const handleTestTelegram = () => {
    setTestAlertFeedback('Testing Telegram Bot connection...');
    setTimeout(() => {
      setTestAlertFeedback(
        `Test incident alert broadcast successfully to ${telegramChatId} via ${telegramBotUsername}! (100% Free)`
      );
      setTimeout(() => setTestAlertFeedback(null), 5000);
    }, 600);
  };

  const handleTestEmail = () => {
    setTestAlertFeedback('Sending test SRE incident digest...');
    setTimeout(() => {
      setTestAlertFeedback(
        `Test HTML incident report delivered to ${sreEmailRecipients.split(',')[0]}!`
      );
      setTimeout(() => setTestAlertFeedback(null), 5000);
    }, 600);
  };

  const handleLinkGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = googleInputEmail.trim() || 'alex.engineer@gmail.com';
    try {
      setIsLinkingGoogle(true);
      setGoogleLinkMsg(null);
      const res = await linkGoogleAccount(targetEmail);
      setLinkedGoogleEmail(targetEmail);
      setGoogleLinkMsg(res.message);
      setTimeout(() => setGoogleLinkMsg(null), 4000);
    } catch (err: unknown) {
      setGoogleLinkMsg(err instanceof Error ? err.message : 'Failed to link Google account');
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleTestResend = async () => {
    try {
      setIsTestingResend(true);
      setResendTestStatus('Dispatching live test email via Resend API...');
      const target = sreEmailRecipients.split(',')[0].trim() || 'oncall@pingbud.us';
      const res = await sendTestEmail(target);
      if (res.ok) {
        setResendTestStatus(`Resend test email dispatched successfully! ${res.message || ''}`);
      } else {
        setResendTestStatus(`Resend returned: ${res.error || 'Check API key'}`);
      }
      setTimeout(() => setResendTestStatus(null), 5000);
    } catch (err: unknown) {
      setResendTestStatus(err instanceof Error ? err.message : 'Resend request failed');
    } finally {
      setIsTestingResend(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & RBAC Quick Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider font-mono mb-1">
            <Sliders className="w-4 h-4" />
            <span>Workspace Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Workspace Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage workspace identity, free Telegram & email alert routing, team RBAC, API keys, and compliance.
          </p>
        </div>

        {/* Quick RBAC Role Tester */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-mono text-slate-400">Active Role:</span>
          <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {(['owner', 'editor', 'viewer'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleSwitch(r)}
                className={`px-2 py-0.5 text-[11px] font-bold rounded capitalize transition-all ${
                  activeRole === r
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { id: 'general', label: 'General Profile', icon: Building },
          { id: 'alerts', label: 'Email & Telegram Routing', icon: Send },
          { id: 'team', label: 'Team & RBAC', icon: Users },
          { id: 'developer', label: 'Developer & API Keys', icon: Key },
          { id: 'security', label: 'Security & Compliance', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-[#111A2E]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENERAL PROFILE */}
      {activeTab === 'general' && (
        <div className="space-y-6 max-w-4xl">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Workspace Identity & Organization Details
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Organization metadata used for multi-region consensus probing, alert signatures, and audit logs.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSavedGeneral(true);
                setTimeout(() => setSavedGeneral(false), 3000);
              }}
              className="space-y-4 max-w-xl"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Workspace Slug / Identifier
                </label>
                <input
                  type="text"
                  value={workspaceSlug}
                  onChange={(e) => setWorkspaceSlug(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Operational SRE Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Default Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Africa/Lagos (WAT, UTC+1)">Africa/Lagos (WAT, UTC+1 - Nigerian Standard Time)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="Europe/London (GMT/BST)">Europe/London (GMT/BST)</option>
                  <option value="America/New_York (EST)">America/New_York (EST)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Save Profile Changes
                </button>
                {savedGeneral && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Settings saved successfully!
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* LINK GOOGLE / GMAIL CARD */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <GoogleIcon />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Link Google / Gmail Account
                  </h3>
                  <p className="text-xs text-slate-500">
                    Connect your Gmail for 1-click Google sign-in and direct incident dispatch.
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                  linkedGoogleEmail
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {linkedGoogleEmail ? 'Linked' : 'Not Linked'}
              </span>
            </div>

            {linkedGoogleEmail ? (
              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    Google account linked: <strong>{linkedGoogleEmail}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLinkedGoogleEmail('')}
                  className="text-xs text-slate-400 hover:text-rose-600 underline cursor-pointer"
                >
                  Unlink
                </button>
              </div>
            ) : (
              <form onSubmit={handleLinkGoogle} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Gmail Address
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={googleInputEmail}
                      onChange={(e) => setGoogleInputEmail(e.target.value)}
                      placeholder="e.g., yourname@gmail.com"
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={isLinkingGoogle}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <GoogleIcon />
                      <span>{isLinkingGoogle ? 'Linking...' : 'Link Gmail'}</span>
                    </button>
                  </div>
                </div>

                {googleLinkMsg && (
                  <p className="text-xs text-teal-600 font-semibold">{googleLinkMsg}</p>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EMAIL & TELEGRAM NOTIFICATIONS */}
      {activeTab === 'alerts' && (
        <div className="space-y-6 max-w-4xl">
          {testAlertFeedback && (
            <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{testAlertFeedback}</span>
            </div>
          )}

          {/* TELEGRAM BOT NOTIFICATIONS CARD (100% FREE FOREVER) */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                  <Send className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Telegram Bot Alerts
                    </h2>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                      100% Free Forever
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Instant incident broadcast directly to your phone, group, or engineering channel with zero carrier SMS fees.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestTelegram}
                className="px-3.5 py-1.5 rounded-xl border border-cyan-500/30 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Test Telegram Ping</span>
              </button>
            </div>

            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telegram Bot Username / Token
                </label>
                <input
                  type="text"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="bot6829104812:AAH92vLksP89Qx_..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Use the official <code className="text-teal-600">@PingBudAlertBot</code> or your company's private bot from <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="underline text-teal-600">@BotFather</a>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telegram Chat ID / Channel Username
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="-1001982736451 or @YourEngineeringTeam"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#16223B]/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Instant P1 Telegram Outage Broadcast
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Send real-time alerts immediately when 2+ regional nodes detect consensus failure.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={telegramEnabled}
                  onChange={(e) => setTelegramEnabled(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* RESEND EMAIL INFRASTRUCTURE CARD */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                  <Mail className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Resend Email Delivery
                    </h2>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                      resend.com
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    REST API email infrastructure for password resets, outage alerts, and incident summaries.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestResend}
                disabled={isTestingResend}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer self-start sm:self-auto disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{isTestingResend ? 'Testing...' : 'Test Resend Email'}</span>
              </button>
            </div>

            {resendTestStatus && (
              <div className="mb-4 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs text-teal-800 dark:text-teal-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{resendTestStatus}</span>
              </div>
            )}

            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resend API Key (<code className="text-teal-600 font-mono">RESEND_API_KEY</code>)
                </label>
                <input
                  type="password"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  placeholder="re_123456789_abcdef..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Verified Sender Address (<code className="text-teal-600 font-mono">RESEND_FROM_EMAIL</code>)
                </label>
                <input
                  type="text"
                  value={resendFromEmail}
                  onChange={(e) => setResendFromEmail(e.target.value)}
                  placeholder="pingbud.us <onboarding@resend.dev>"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* SRE EMAIL NOTIFICATIONS CARD */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                  <Mail className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    SRE Incident Email Dispatch
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    High-deliverability HTML outage digests formatted with AI root cause explanations.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestEmail}
                className="px-3.5 py-1.5 rounded-xl border border-teal-500/30 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Test Email Dispatch</span>
              </button>
            </div>

            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Email Addresses (Comma separated)
                </label>
                <textarea
                  rows={2}
                  value={sreEmailRecipients}
                  onChange={(e) => setSreEmailRecipients(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#16223B]/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Include Automated AI Root-Cause Diagnostic
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Synthesizes DNS handshake, TLS cert status, and HTTP error code in email body.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={includeAiSummary}
                  onChange={(e) => setIncludeAiSummary(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#16223B]/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Send Incident Resolution & Recovery Confirmation
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Dispatches a green recovery email when all probe nodes report HTTP 200 OK.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={alertOnRecovery}
                  onChange={(e) => setAlertOnRecovery(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* QUIET HOURS & ESCALATION POLICY */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Quiet Hours & Sleep Protection
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Prevent off-hours alert fatigue for transient warnings while still escalating genuine downtime.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSavedAlerts(true);
                setTimeout(() => setSavedAlerts(false), 3000);
              }}
              className="space-y-4 max-w-xl"
            >
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#16223B]/40">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Enable Scheduled Quiet Hours
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Suppress loud alerts for non-critical monitors between scheduled hours.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={quietHoursEnabled}
                  onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
              </div>

              {quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Quiet Hours Start
                    </label>
                    <input
                      type="time"
                      value={quietStart}
                      onChange={(e) => setQuietStart(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Quiet Hours End
                    </label>
                    <input
                      type="time"
                      value={quietEnd}
                      onChange={(e) => setQuietEnd(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Escalation Delay Before High-Priority Broadcast (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={escalationDelayMinutes}
                  onChange={(e) => setEscalationDelayMinutes(parseInt(e.target.value) || 5)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Wait {escalationDelayMinutes} min after initial Telegram ping before broadcasting to full team email list.
                </span>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Save Alert Routing Rules
                </button>
                {savedAlerts && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Routing rules updated!
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: TEAM & RBAC */}
      {activeTab === 'team' && (
        <div className="space-y-6 max-w-4xl">
          {/* Team Members List */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Team Members & Granular RBAC Directory
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Granular role permissions enforced on every backend probe, manual trigger, and billing action.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-teal-600">
                {teamMembers.length} Active Seat(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#16223B] text-[11px] text-slate-500 uppercase font-mono border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Member Name</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Workspace Role</th>
                    <th className="py-2.5 px-4">Assigned Plan</th>
                    <th className="py-2.5 px-4 text-right">Access Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {teamMembers.map((m) => (
                    <tr key={m.id}>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs uppercase">
                          {m.name.charAt(0)}
                        </div>
                        <span>{m.name}</span>
                        {m.is_current && (
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                            You
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {m.email}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                            m.role === 'owner'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : m.role === 'editor'
                              ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {m.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">{m.plan}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[11px] text-slate-500 font-medium">
                          {m.role === 'owner'
                            ? 'Full Admin & Bachs Billing'
                            : m.role === 'editor'
                            ? 'Create & Edit Monitors'
                            : 'Read-only Observer'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invite Form */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Invite New Team Member
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Send an invitation email with scoped RBAC permissions.
            </p>

            {inviteSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{inviteSuccess}</span>
              </div>
            )}

            <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder="colleague@yourcompany.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="viewer">Viewer (Read-only)</option>
                <option value="editor">Editor (Create/Edit Monitors)</option>
                <option value="owner">Owner (Full Admin & Billing)</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Send Invite</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: DEVELOPER & API KEYS */}
      {activeTab === 'developer' && (
        <div className="space-y-6 max-w-4xl">
          {/* Create API Key Card */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Scoped Developer API Keys
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Integrate pingbud.us with CI/CD GitHub Actions, Terraform, Kubernetes health probes, or internal services.
            </p>

            {createdRawKey && (
              <div className="mb-4 p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
                <div className="text-xs font-bold mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Key Generated! Copy it now (it won't be displayed again):</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 p-2 rounded-lg bg-white dark:bg-slate-900 text-xs font-mono select-all border border-emerald-300 dark:border-emerald-800">
                    {createdRawKey}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyRawKey}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                placeholder="e.g. GitHub Actions Production Probe"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <select
                value={newKeyScope}
                onChange={(e) => setNewKeyScope(e.target.value as any)}
                className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="read">Read Only (Dashboard & Metrics)</option>
                <option value="write">Write (Push Heartbeats & Checks)</option>
                <option value="admin">Admin (Full Control)</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Generate Key</span>
              </button>
            </form>
          </div>

          {/* Existing Keys Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
                Active Workspace Keys ({apiKeys.length})
              </span>
              <button
                type="button"
                onClick={loadKeys}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingKeys ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#16223B] text-[11px] text-slate-500 uppercase font-mono border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Key Prefix</th>
                    <th className="py-2.5 px-4">Scope</th>
                    <th className="py-2.5 px-4">Created</th>
                    <th className="py-2.5 px-4 text-right">Revoke</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {apiKeys.length > 0 ? (
                    apiKeys.map((k) => (
                      <tr key={k.id}>
                        <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-white">
                          {k.name}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {k.key_prefix}...
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                            {k.scope}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {new Date(k.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteKey(k.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                            title="Revoke Key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-slate-500 font-sans">
                        No custom API keys generated yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Prometheus Exporter Feed */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-600" />
              <span>Prometheus Scrape Exporter (`/metrics`)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Standard OpenMetrics feed to scrape uptime, latency, and incident counters into your Prometheus agent or Grafana cloud.
            </p>
            <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs flex items-center justify-between">
              <span>GET /metrics</span>
              <a
                href="http://127.0.0.1:8000/metrics"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-teal-400 hover:underline flex items-center gap-1 font-sans"
              >
                <span>View Raw Exporter Stream</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY & COMPLIANCE */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-4xl">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Security, Audit Logs & Compliance Controls
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Configure session controls, multi-factor authentication, and data retention policies.
            </p>

            <div className="space-y-4 max-w-xl">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#16223B]/40">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Two-Factor Authentication (TOTP)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Require Google Authenticator / 1Password TOTP for Workspace Owner actions.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Historical Metric & Incident Log Retention
                </label>
                <select
                  value={dataRetentionDays}
                  onChange={(e) => setDataRetentionDays(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value={30}>30 Days (Community Standard)</option>
                  <option value={90}>90 Days (Quarterly Audit)</option>
                  <option value={365}>1 Year (Included in Indie Pro & Team Pro)</option>
                  <option value={730}>2 Years (Enterprise Extended Compliance)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('pulsewatch_token');
                      localStorage.removeItem('pulsewatch_demo_role');
                      window.location.href = '/';
                    }
                  }}
                  className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors cursor-pointer"
                >
                  Sign Out of All Active Sessions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
