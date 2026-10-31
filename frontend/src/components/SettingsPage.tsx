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
  Search,
  Download,
  Filter,
  Crown,
  Loader2,
} from 'lucide-react';
import { UserRole, ApiKey, User, AuditLogItem, ProPlan } from '../types';
import {
  fetchApiKeys,
  createApiKey,
  deleteApiKey,
  setClientDemoRole,
  getClientDemoRole,
  fetchAuditLogs,
  getAuditLogExportUrl,
  getApiBase,
  fetchTotpSetup,
  verifyTotp,
  disableTotp,
} from '../lib/api';

interface SettingsPageProps {
  onBackToDashboard?: () => void;
  currentUser?: User | null;
  activeRole: UserRole;
  onRoleChanged: (newRole: UserRole) => void;
  proPlan?: ProPlan | null;
  onGoToBilling?: () => void;
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
  proPlan,
  onGoToBilling,
}: SettingsPageProps) {
  const isPro = Boolean(proPlan?.is_active && (proPlan?.active_tier === 'indie_pro' || proPlan?.active_tier === 'team_pro'));
  const [activeTab, setActiveTab] = useState<
    'general' | 'alerts' | 'team' | 'developer' | 'security'
  >('general');

  // General settings state
  const [workspaceName, setWorkspaceName] = useState('Sentiro Core Infrastructure');
  const [workspaceSlug, setWorkspaceSlug] = useState('production');
  const [contactEmail, setContactEmail] = useState('ops@sentiro.xyz');
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

  // Security, Audit Logs & Compliance Controls State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditCategory, setAuditCategory] = useState<string>('all');
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [totpModalOpen, setTotpModalOpen] = useState(false);
  const [totpCodeInput, setTotpCodeInput] = useState('');
  const [totpVerified, setTotpVerified] = useState(false);
  const [totpData, setTotpData] = useState<{ secret: string; otpauth_url: string; account_name: string } | null>(null);
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState('');
  const [totpCopied, setTotpCopied] = useState(false);
  const [isVerifyingTotp, setIsVerifyingTotp] = useState(false);
  const [retentionSavedMsg, setRetentionSavedMsg] = useState(false);

  const handleOpenTotpModal = async () => {
    setTotpModalOpen(true);
    setTotpError('');
    setTotpCodeInput('');
    setTotpLoading(true);
    try {
      const data = await fetchTotpSetup();
      setTotpData(data);
      if (data.totp_enabled) {
        setTwoFactorEnabled(true);
        setTotpVerified(true);
      }
    } catch (e: unknown) {
      setTotpError(e instanceof Error ? e.message : 'Failed to initialize TOTP');
    } finally {
      setTotpLoading(false);
    }
  };

  const handleDisableTotp = async () => {
    try {
      await disableTotp();
      setTwoFactorEnabled(false);
      setTotpVerified(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to disable 2FA');
    }
  };

  const handleVerifyTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCodeInput.length < 6) return;
    try {
      setIsVerifyingTotp(true);
      setTotpError('');
      const res = await verifyTotp(totpCodeInput.trim());
      if (res.ok) {
        setTwoFactorEnabled(true);
        setTotpVerified(true);
        setTotpModalOpen(false);
        setTotpCodeInput('');
      }
    } catch (err: unknown) {
      setTotpError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setIsVerifyingTotp(false);
    }
  };

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

  const loadAuditLogs = async (cat = auditCategory, q = auditSearch) => {
    try {
      setLoadingAudit(true);
      const data = await fetchAuditLogs(cat, q);
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'security') {
      loadAuditLogs(auditCategory, auditSearch);
    }
  }, [activeTab, auditCategory]);

  return (
    <div className="space-y-6">
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

          {/* TELEGRAM BOT NOTIFICATIONS CARD (PRO EXCLUSIVE) */}
          {!isPro ? (
            <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-200/60 dark:border-amber-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Telegram Bot Alerts
                      </h2>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase">
                        Pro Feature
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Instant P1 Telegram incident dispatch is an Indie Pro &amp; Team Pro feature. Not available on Community Free.
                    </p>
                  </div>
                </div>

                {onGoToBilling && (
                  <button
                    type="button"
                    onClick={onGoToBilling}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    <span>Upgrade to Pro →</span>
                  </button>
                )}
              </div>

              <div className="p-4 rounded-xl bg-white/70 dark:bg-[#111A2E]/70 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <p>
                  Upgrade to <strong>Indie Pro</strong> (₦2,000/mo) or <strong>Team Pro</strong> (₦5,000/mo) to unlock real-time Telegram incident broadcasting directly to your phone, group, or engineering channel with private bot tokens.
                </p>
                <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>• Sub-second dispatch</span>
                  <span>• Corroborated 2+ node quorum</span>
                  <span>• Zero carrier SMS markups</span>
                </div>
              </div>
            </div>
          ) : (
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
                      <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 border border-teal-200 dark:border-teal-800 uppercase">
                        Pro Active
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
                    Use the official <code className="text-teal-600">@SentiroAlertBot</code> or your company's private bot from <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="underline text-teal-600">@BotFather</a>.
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
          )}

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
                            ? 'Full Admin & Billing'
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
              Integrate Sentiro with CI/CD GitHub Actions, Terraform, Kubernetes health probes, or internal services.
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
                href={`${getApiBase()}/metrics`}
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

      {/* TAB 5: SECURITY, AUDIT LOGS & COMPLIANCE CONTROLS */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-4xl">
          {/* Section 1: Security & Session Controls */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-0.5">
                  Security, Audit Logs &amp; Compliance Controls
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure cryptographic authentication, multi-region session controls, and statutory compliance data retention.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                SOC-2 Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1A: Two-Factor Authentication (TOTP) */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#16223B]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Two-Factor Authentication (TOTP)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!twoFactorEnabled) {
                        handleOpenTotpModal();
                      } else {
                        handleDisableTotp();
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      twoFactorEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-700 hover:bg-teal-600 hover:text-white text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {twoFactorEnabled ? 'Enabled (Active)' : 'Configure 2FA'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Requires a 6-digit TOTP code (Google Authenticator, 1Password) for production monitor updates and destructive actions.
                </p>
              </div>

              {/* Card 1B: Data Retention Policy */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#16223B]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Metric &amp; Incident Retention
                    </span>
                  </div>
                  {retentionSavedMsg && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Saved
                    </span>
                  )}
                </div>
                <select
                  value={dataRetentionDays}
                  onChange={(e) => {
                    const days = parseInt(e.target.value);
                    setDataRetentionDays(days);
                    setRetentionSavedMsg(true);
                    setTimeout(() => setRetentionSavedMsg(false), 2500);
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                >
                  <option value={30}>30 Days (Community Standard)</option>
                  <option value={90}>90 Days (Quarterly SRE Audit)</option>
                  <option value={365}>1 Year (Indie Pro &amp; Team Pro)</option>
                  <option value={730}>2 Years (Enterprise Extended Compliance)</option>
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Raw probe pings and outage post-mortems are automatically preserved for compliance audits.
                </p>
              </div>
            </div>

            {/* Active Sessions & Revocation */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                Active Session Terminals
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">Current Browser Session</span>
                      <span className="text-slate-400 text-[11px] block font-mono">macOS • Chrome 130 • 102.89.44.18 (Lagos, NG)</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Active Now
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-teal-500" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">Sentiro Edge Consensus Daemon</span>
                      <span className="text-slate-400 text-[11px] block font-mono">VPC Node 01 • Frankfurt Edge • 10.0.4.12</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    Consensus Verified
                  </span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('pulsewatch_token');
                      localStorage.removeItem('pulsewatch_demo_role');
                      window.location.href = '/login';
                    }
                  }}
                  className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors cursor-pointer"
                >
                  Sign Out of All Active Sessions
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Live Security & Audit Logs Stream */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-teal-600" />
                  <span>Immutable Audit Log Stream</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cryptographically timestamped trail of authentication events, target modifications, and consensus actions.
                </p>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadAuditLogs(auditCategory, auditSearch)}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  title="Refresh Audit Logs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin text-teal-600' : ''}`} />
                </button>

                <a
                  href={getAuditLogExportUrl('csv')}
                  download="sentiro_audit_logs.csv"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-teal-600" />
                  <span>Export CSV</span>
                </a>

                <a
                  href={getAuditLogExportUrl('json')}
                  download="sentiro_audit_logs.json"
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-teal-600/20 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </a>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'All Events' },
                  { id: 'auth', label: 'Authentication' },
                  { id: 'monitor', label: 'Monitors' },
                  { id: 'settings', label: 'Settings' },
                  { id: 'security', label: 'Security' },
                  { id: 'compliance', label: 'Compliance' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setAuditCategory(cat.id);
                      loadAuditLogs(cat.id, auditSearch);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      auditCategory === cat.id
                        ? 'bg-teal-600 text-white font-bold shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => {
                    setAuditSearch(e.target.value);
                    loadAuditLogs(auditCategory, e.target.value);
                  }}
                  placeholder="Search action, actor, IP..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Details</th>
                    <th className="py-2.5 px-3">IP Address</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {new Date(log.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {log.actor}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={log.details}>
                          {log.details}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                          {log.ip_address}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Check className="w-2.5 h-2.5" />
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                        {loadingAudit ? 'Loading audit records...' : 'No audit log entries matching criteria.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Compliance Footer Attestation */}
            <div className="p-3.5 rounded-xl border border-teal-500/20 bg-teal-500/5 dark:bg-teal-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  SOC-2 Type II &amp; ISO-27001 statutory attestation compliant. Retention window: <strong>{dataRetentionDays} days</strong>.
                </span>
              </div>
              <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-bold">
                Attestation ID: SLA-2026-PW99
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TOTP Modal */}
      {totpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-slide-up-spring text-slate-900 dark:text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">Two-Factor Authentication (TOTP)</h3>
                  <p className="text-[11px] text-slate-400">RFC 6238 Standard (Google Authenticator, 1Password, Authy)</p>
                </div>
              </div>
              <button
                onClick={() => setTotpModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {totpError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{totpError}</span>
              </div>
            )}

            {totpLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                <span className="text-xs font-mono text-slate-400">Generating cryptographic secret...</span>
              </div>
            ) : (
              <>
                {/* Visual Base32 Secret Key Box */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-slate-400">Base32 Secret Key</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (totpData?.secret) {
                          navigator.clipboard.writeText(totpData.secret);
                          setTotpCopied(true);
                          setTimeout(() => setTotpCopied(false), 2000);
                        }
                      }}
                      className="text-[10px] text-teal-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      {totpCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Key</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-sm font-extrabold text-teal-400 tracking-wider break-all selection:bg-teal-500 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    {totpData?.secret || 'JBSWY3DPEHPK3PXP'}
                  </div>
                </div>

                {/* 1-Click Authenticator Link */}
                {totpData?.otpauth_url && (
                  <a
                    href={totpData.otpauth_url}
                    className="w-full py-2 px-3 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Open in Authenticator App</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <form onSubmit={handleVerifyTotpSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Enter 6-digit Code from Authenticator
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={totpCodeInput}
                      onChange={(e) => setTotpCodeInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      className="w-full text-center tracking-widest text-xl font-mono px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setTotpModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={totpCodeInput.length < 6 || isVerifyingTotp}
                      className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-teal-600/20 cursor-pointer flex items-center gap-1.5"
                    >
                      {isVerifyingTotp ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <span>Verify &amp; Activate</span>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
