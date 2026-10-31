'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Send,
  MessageSquare,
  Webhook,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Power,
  ExternalLink,
  ShieldCheck,
  Check,
  HelpCircle,
  Copy,
  Heart,
  ArrowRight,
  Sparkles,
  Lock,
  Crown,
} from 'lucide-react';
import { AlertChannel, UserRole, ProPlan } from '../types';
import { fetchChannels, createChannel, updateChannel, deleteChannel, testChannel } from '../lib/api';
import SentiroLogo from './SentiroLogo';

interface AlertChannelsPageProps {
  onBackToDashboard?: () => void;
  onGoToBilling?: () => void;
  userRole?: UserRole;
  proPlan?: ProPlan | null;
}

export default function AlertChannelsPage({
  onBackToDashboard,
  onGoToBilling,
  userRole = 'owner',
  proPlan,
}: AlertChannelsPageProps) {
  const [channels, setChannels] = useState<AlertChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ id: number; ok: boolean; message: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  // New Channel Form State
  const [newKind, setNewKind] = useState<'telegram' | 'email' | 'slack' | 'discord' | 'webhook'>('email');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTgToken, setNewTgToken] = useState('');
  const [newTgChatId, setNewTgChatId] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newSecretKey, setNewSecretKey] = useState('');
  const [showCustomTgToken, setShowCustomTgToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = userRole === 'owner' || userRole === 'editor';
  const currentTier = (proPlan?.is_active ? proPlan?.active_tier : 'community') || 'community';
  const isTeamPro = currentTier === 'team_pro';
  const isIndiePro = currentTier === 'indie_pro';
  const isPro = Boolean(proPlan?.is_active && (isIndiePro || isTeamPro));

  const maxChannels = currentTier === 'community' ? 2 : (currentTier === 'indie_pro' ? 5 : 25);
  const isLimitReached = channels.length >= maxChannels;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadChannelsData = async () => {
    try {
      setLoading(true);
      const data = await fetchChannels();
      setChannels(data || []);
    } catch {
      showToast('Failed to load alert channels', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannelsData();
  }, []);

  const handleTestChannel = async (id: number) => {
    try {
      setTestingId(id);
      setTestResult(null);
      const res = await testChannel(id);
      setTestResult({ id, ok: res.ok, message: res.message });
      showToast(res.message, 'success');
      setTimeout(() => setTestResult(null), 4000);
    } catch {
      setTestResult({ id, ok: false, message: 'Failed to dispatch test notification' });
      showToast('Failed to dispatch test notification', 'error');
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleEnabled = async (channel: AlertChannel) => {
    if (!canEdit) {
      showToast('Viewer role cannot modify notification channels.', 'error');
      return;
    }
    try {
      setTogglingId(channel.id);
      const updated = await updateChannel(channel.id, { enabled: !channel.enabled });
      setChannels((prev) => prev.map((c) => (c.id === channel.id ? updated : c)));
      showToast(`Channel "${channel.name}" ${updated.enabled ? 'activated' : 'paused'}.`, 'success');
    } catch {
      showToast('Failed to update channel state', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteChannel = async (id: number, name: string) => {
    if (!canEdit) {
      showToast('Viewer role cannot delete channels.', 'error');
      return;
    }
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteChannel(id);
      setChannels((prev) => prev.filter((c) => c.id !== id));
      showToast(`Channel "${name}" removed.`, 'success');
    } catch {
      showToast('Failed to delete channel', 'error');
    }
  };

  const handleCreateChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      showToast('Viewer role cannot create channels.', 'error');
      return;
    }
    if (isLimitReached) {
      showToast(`Channel limit reached (${channels.length}/${maxChannels}) for your current tier. Please upgrade in Billing.`, 'error');
      return;
    }
    if (newKind === 'telegram' && !isPro) {
      showToast('Telegram bot incident alerts require an Indie Pro (₦2,000/mo) or Team Pro plan. Please upgrade in Billing.', 'error');
      return;
    }
    if (['slack', 'discord', 'webhook'].includes(newKind) && !isTeamPro) {
      showToast(`${newKind.toUpperCase()} webhook dispatch is exclusive to Team Pro (₦5,000/mo). Upgrade in Billing.`, 'error');
      return;
    }
    if (!newName.trim()) {
      showToast('Please provide a channel name.', 'error');
      return;
    }

    let config: Record<string, string> = {};
    if (newKind === 'telegram') {
      if (!newTgChatId.trim()) {
        showToast('Telegram Chat ID is required.', 'error');
        return;
      }
      if (newTgToken.trim() && !isPro) {
        showToast('Custom bot tokens are an Indie Pro & Team Pro feature. Please upgrade your plan or clear the custom token.', 'error');
        return;
      }
      config = {
        chat_id: newTgChatId.trim(),
        bot_username: '@SentiroAlertBot',
        bot_token: isPro ? newTgToken.trim() : '',
      };
    } else if (newKind === 'email') {
      if (!newEmail.trim()) {
        showToast('At least one email recipient is required.', 'error');
        return;
      }
      config = {
        recipients: newEmail.trim(),
        include_ai_summary: 'true',
      };
    } else if (newKind === 'slack' || newKind === 'discord') {
      if (!newWebhookUrl.trim()) {
        showToast('Webhook URL is required.', 'error');
        return;
      }
      config = {
        webhook_url: newWebhookUrl.trim(),
      };
    } else if (newKind === 'webhook') {
      if (!newWebhookUrl.trim()) {
        showToast('HTTP target URL is required.', 'error');
        return;
      }
      config = {
        url: newWebhookUrl.trim(),
        secret_key: newSecretKey.trim(),
        method: 'POST',
      };
    }

    try {
      setIsSubmitting(true);
      const created = await createChannel({
        name: newName.trim(),
        kind: newKind,
        config,
        enabled: true,
      });
      setChannels((prev) => [created, ...prev]);
      showToast(`Alert channel "${created.name}" created successfully.`, 'success');
      setIsAddModalOpen(false);
      // Reset form
      setNewName('');
      setNewEmail('');
      setNewTgToken('');
      setNewTgChatId('');
      setNewWebhookUrl('');
      setNewSecretKey('');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to create channel', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChannelIcon = (kind: string) => {
    switch (kind) {
      case 'telegram':
        return <Send className="w-4 h-4 text-cyan-600" />;
      case 'email':
        return <Mail className="w-4 h-4 text-sky-600" />;
      case 'slack':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case 'discord':
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      case 'webhook':
      default:
        return <Webhook className="w-4 h-4 text-teal-600" />;
    }
  };

  const enabledCount = channels.filter((c) => c.enabled).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border text-xs font-semibold shadow-xl flex items-center gap-2.5 transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-700 border-rose-500/20'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Top Action Bar with Tier Limit Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Configured Channels
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {channels.length} / {maxChannels} Used
          </span>
          <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
            isTeamPro
              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
              : isIndiePro
              ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}>
            {currentTier === 'team_pro' ? 'Team Pro (25 Max)' : currentTier === 'indie_pro' ? 'Indie Pro (5 Max)' : 'Community Free (2 Max)'}
          </span>
          {isLimitReached && (
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              Tier Limit Reached
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setGuideOpen(!guideOpen)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
            <span>Telegram Bot Setup Guide</span>
          </button>

          {isLimitReached && onGoToBilling && (
            <button
              type="button"
              onClick={onGoToBilling}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Upgrade for More Channels</span>
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={() => {
                if (isLimitReached) {
                  showToast(`Channel limit reached (${channels.length}/${maxChannels}). Please upgrade your workspace tier in Billing to add more.`, 'error');
                  if (onGoToBilling) onGoToBilling();
                  return;
                }
                setIsAddModalOpen(true);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                isLimitReached
                  ? 'bg-slate-400 dark:bg-slate-700 hover:bg-slate-500'
                  : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Configure New Channel</span>
            </button>
          )}
        </div>
      </div>

      {/* Telegram Pro Bot Guide Accordion */}
      {guideOpen && (
        <div className="p-5 rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20 text-slate-800 dark:text-slate-200 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-2 text-teal-800 dark:text-teal-300">
              <Send className="w-4 h-4 text-cyan-600" />
              <span>Telegram Bot Alerts Guide (Indie Pro &amp; Team Pro)</span>
            </span>
            <button
              type="button"
              onClick={() => setGuideOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Telegram alerts are powered by our official <strong>@SentiroAlertBot</strong> or your company private bot with <strong>zero per-message carrier fees</strong> for Pro subscribers. Follow these simple steps:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-300">
            <li>
              Open Telegram and search for <a href="https://t.me/SentiroAlertBot" target="_blank" rel="noreferrer" className="underline text-teal-700 dark:text-teal-400 font-semibold">@SentiroAlertBot</a> (or click <a href="https://t.me/SentiroAlertBot" target="_blank" rel="noreferrer" className="underline text-teal-700 dark:text-teal-400 font-semibold">t.me/SentiroAlertBot</a>).
            </li>
            <li>
              Click <strong>Start</strong> (or add <code>@SentiroAlertBot</code> to your engineering team group or incident channel).
            </li>
            <li>
              Obtain your Chat ID (e.g. from <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="underline text-teal-700 dark:text-teal-400">@userinfobot</a>, or use your public channel handle like <code>@my_sre_alerts</code>).
            </li>
            <li>
              Enter your <strong>Chat ID</strong> below and click <strong>Test Ping</strong>. Incident notifications will arrive in milliseconds!
            </li>
          </ol>
        </div>
      )}

      {/* KPI METRIC STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] shadow-sm">
          <div className="text-[11px] font-mono uppercase text-slate-400 mb-1">Active Routing Channels</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {enabledCount} <span className="text-xs text-slate-400 font-normal">/ {channels.length} Total</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Ready for instant incident dispatch</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] shadow-sm">
          <div className="text-[11px] font-mono uppercase text-slate-400 mb-1">Dispatch Reliability SLA</div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono">
            99.99% <span className="text-xs text-slate-400 font-normal">Guaranteed</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Sub-second P1 consensus broadcast fanout
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] shadow-sm">
          <div className="text-[11px] font-mono uppercase text-slate-400 mb-1">Average Dispatch Latency</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            320ms
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Async Celery-free threadpool queuing
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] shadow-sm">
          <div className="text-[11px] font-mono uppercase text-slate-400 mb-1">Corroborated Quorum</div>
          <div className="text-2xl font-black text-teal-700 dark:text-teal-300 font-mono">
            2+ Nodes
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Zero false alerts from single-region hiccups
          </div>
        </div>
      </div>

      {/* CHANNELS WORKBENCH TABLE / CARDS */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Configured Alert Endpoints
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Every probe failure corroborated by 2+ consensus nodes fires to all enabled channels simultaneously.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {channels.length} Channel(s)
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            <span>Loading alert channels...</span>
          </div>
        ) : channels.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="font-bold text-slate-800 dark:text-slate-200">No Alert Channels Configured</p>
            <p className="text-slate-400 mt-1 max-w-sm mx-auto">
              Add your first Telegram Bot token or SRE email address to start receiving instant outage notifications.
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Channel</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {channels.map((chan) => (
              <div
                key={chan.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-[#16223B]/40 transition-colors"
              >
                {/* Left: Info */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                    {getChannelIcon(chan.kind)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {chan.name}
                      </h3>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                        {chan.kind}
                      </span>
                      {chan.enabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          Disabled
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 truncate">
                      {chan.kind === 'telegram' && (
                        <span>
                          Telegram Chat: {chan.config?.chat_id || '@SentiroAlertBot'} • Bot Token Configured
                        </span>
                      )}
                      {chan.kind === 'email' && (
                        <span>
                          Recipients: {chan.config?.recipients || chan.config?.email || 'ops@sentiro'}
                        </span>
                      )}
                      {(chan.kind === 'slack' || chan.kind === 'discord') && (
                        <span>
                          Target: {chan.config?.webhook_url ? chan.config.webhook_url.substring(0, 42) + '...' : 'Webhook URL configured'}
                        </span>
                      )}
                      {chan.kind === 'webhook' && (
                        <span>
                          Endpoint: {chan.config?.url ? chan.config.url.substring(0, 42) + '...' : 'HTTP POST configured'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions (Test, Toggle, Delete) */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {testResult && testResult.id === chan.id && (
                    <span
                      className={`text-xs font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                        testResult.ok
                          ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-700 border border-rose-500/20'
                      }`}
                    >
                      {testResult.ok ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <span className="truncate max-w-[140px]">{testResult.ok ? 'Sent' : 'Failed'}</span>
                    </span>
                  )}

                  {/* Send Test Alert Button */}
                  <button
                    type="button"
                    onClick={() => handleTestChannel(chan.id)}
                    disabled={testingId === chan.id}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                    title="Send instant synthetic test alert"
                  >
                    {testingId === chan.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-teal-600" />
                    )}
                    <span>Test Ping</span>
                  </button>

                  {/* Enable / Disable Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleEnabled(chan)}
                    disabled={!canEdit || togglingId === chan.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      chan.enabled
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800'
                    }`}
                    title={canEdit ? 'Toggle active state' : 'Requires Editor or Owner role'}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{chan.enabled ? 'Enabled' : 'Disabled'}</span>
                  </button>

                  {/* Delete Button */}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleDeleteChannel(chan.id, chan.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete alert channel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DONATE TO KEEP PIPBUD.US CHEAP BANNER */}
      <div className="p-6 rounded-2xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-[#111A2E] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 max-w-2xl">
          <div className="w-10 h-10 rounded-xl bg-teal-600/10 text-teal-600 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 fill-teal-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Donate to keep sentiro cheap</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800">
                Community Backed
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              sentiro is engineered to replace $80/mo (₦120,000/mo) legacy providers at just <strong>₦2,000/month</strong>. By utilizing Telegram Bots and single-node SQLite WAL, our overhead is minimal. Support our edge probe servers with a community donation!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onGoToBilling}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-2"
        >
          <Heart className="w-3.5 h-3.5 fill-white" />
          <span>Sponsor SRE Infrastructure</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ADD CHANNEL MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-600/10 text-teal-600 flex items-center justify-center">
                  <Plus className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Add Alert Channel
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select delivery protocol and endpoint credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChannelSubmit} className="space-y-4 mt-4">
              {/* Kind Selector */}
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Channel Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isPro) {
                        showToast('Telegram bot incident alerts require an Indie Pro (₦2,000/mo) or Team Pro plan. Upgrade in Billing.', 'error');
                        return;
                      }
                      setNewKind('telegram');
                      setNewName('Telegram Incident Bot');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all relative ${
                      newKind === 'telegram'
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    } ${!isPro ? 'opacity-80' : ''}`}
                  >
                    <div className="flex items-center gap-1">
                      <Send className="w-4 h-4 text-cyan-600" />
                      {!isPro && <Lock className="w-2.5 h-2.5 text-amber-500" />}
                    </div>
                    <span>Telegram Bot</span>
                    {!isPro && (
                      <span className="text-[9px] font-mono font-bold uppercase px-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                        Pro Only
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewKind('email');
                      setNewName('SRE On-Call Email');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      newKind === 'email'
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-sky-600" />
                    <span>Email Dispatch</span>
                    <span className="text-[9px] font-mono font-bold uppercase px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      Free &amp; Pro
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isTeamPro) {
                        showToast('Slack webhook alerts require Team Pro tier (₦5,000/mo). Upgrade in Billing to unlock.', 'error');
                        return;
                      }
                      setNewKind('slack');
                      setNewName('Slack Alerts Channel');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all relative ${
                      newKind === 'slack'
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    } ${!isTeamPro ? 'opacity-80' : ''}`}
                  >
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      {!isTeamPro && <Lock className="w-2.5 h-2.5 text-amber-500" />}
                    </div>
                    <span>Slack Webhook</span>
                    {!isTeamPro && (
                      <span className="text-[9px] font-mono font-bold uppercase px-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                        Team Pro
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isTeamPro) {
                        showToast('Discord webhook alerts require Team Pro tier (₦5,000/mo). Upgrade in Billing to unlock.', 'error');
                        return;
                      }
                      setNewKind('discord');
                      setNewName('Discord Incident Room');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all relative ${
                      newKind === 'discord'
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    } ${!isTeamPro ? 'opacity-80' : ''}`}
                  >
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                      {!isTeamPro && <Lock className="w-2.5 h-2.5 text-amber-500" />}
                    </div>
                    <span>Discord</span>
                    {!isTeamPro && (
                      <span className="text-[9px] font-mono font-bold uppercase px-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                        Team Pro
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isTeamPro) {
                        showToast('Custom HTTP Webhook dispatch requires Team Pro tier (₦5,000/mo). Upgrade in Billing to unlock.', 'error');
                        return;
                      }
                      setNewKind('webhook');
                      setNewName('Custom HTTP Webhook');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all col-span-2 relative ${
                      newKind === 'webhook'
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    } ${!isTeamPro ? 'opacity-80' : ''}`}
                  >
                    <div className="flex items-center gap-1">
                      <Webhook className="w-4 h-4 text-teal-600" />
                      {!isTeamPro && <Lock className="w-2.5 h-2.5 text-amber-500" />}
                    </div>
                    <span>Custom HTTP POST Webhook</span>
                    {!isTeamPro && (
                      <span className="text-[9px] font-mono font-bold uppercase px-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                        Team Pro Only
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Channel Friendly Name */}
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Channel Display Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. SRE Production Outage Channel"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              {/* Dynamic Type Config Fields */}
              {newKind === 'telegram' && (
                <div className="space-y-3 p-3.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-950/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-teal-800 dark:text-teal-300 font-bold flex items-center gap-2">
                      <SentiroLogo size="xs" showText={false} />
                      <span>Official Bot: @SentiroAlertBot</span>
                    </span>
                    <a
                      href="https://t.me/SentiroAlertBot"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold underline"
                    >
                      Open Bot ↗
                    </a>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Telegram Chat ID or Group ID
                    </label>
                    <input
                      type="text"
                      required
                      value={newTgChatId}
                      onChange={(e) => setNewTgChatId(e.target.value)}
                      placeholder="e.g. 123456789 or -1001234567890 or @sre_alerts"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Start <a href="https://t.me/SentiroAlertBot" target="_blank" rel="noreferrer" className="underline text-teal-600">@SentiroAlertBot</a> or add it to your team group, then paste your Chat ID here. Free for all plans!
                    </p>
                  </div>

                  {/* Custom Bot Token (Pro Exclusive) */}
                  <div className="pt-2 border-t border-teal-200/60 dark:border-teal-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowCustomTgToken(!showCustomTgToken)}
                        className="text-[11px] text-teal-700 dark:text-teal-300 font-semibold flex items-center gap-1.5 hover:underline cursor-pointer"
                      >
                        {isPro ? (
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{showCustomTgToken ? '− Hide Custom Bot Token' : '+ Use Custom Bot Token'}</span>
                      </button>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border ${
                        isPro
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}>
                        {isPro ? 'Pro Active' : 'Pro Required'}
                      </span>
                    </div>

                    {showCustomTgToken && (
                      <div className="p-3 rounded-xl bg-white/70 dark:bg-[#111A2E] border border-slate-200 dark:border-slate-700 space-y-2">
                        {!isPro ? (
                          <div className="space-y-2 text-xs">
                            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                              Custom branded Telegram bot tokens are an <strong>Indie Pro</strong> (₦2,000/mo) and <strong>Team Pro</strong> (₦5,000/mo) feature. The official <strong>@SentiroAlertBot</strong> is free and ready to use above.
                            </p>
                            {onGoToBilling && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddModalOpen(false);
                                  onGoToBilling();
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] shadow-sm transition-all"
                              >
                                <Crown className="w-3.5 h-3.5" />
                                <span>Upgrade to Pro to Unlock Custom Bots →</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="block text-[10px] font-mono text-slate-500 uppercase">
                              Private Bot HTTP API Token (Pro)
                            </label>
                            <input
                              type="text"
                              value={newTgToken}
                              onChange={(e) => setNewTgToken(e.target.value)}
                              placeholder="e.g. 123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            <p className="text-[10px] text-slate-400">
                              Obtained from @BotFather. Alerts will be dispatched using your private branded bot identity.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {newKind === 'email' && (
                <div className="space-y-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Recipient Email Addresses (Comma-Separated)
                    </label>
                    <input
                      type="text"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="ops@sentiro, sre-team@company.com"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      High-deliverability SRE transactional email with full AI root cause summary.
                    </p>
                  </div>
                </div>
              )}

              {(newKind === 'slack' || newKind === 'discord') && (
                <div className="space-y-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Incoming Webhook URL
                    </label>
                    <input
                      type="url"
                      required
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                      placeholder={
                        newKind === 'slack'
                          ? 'https://hooks.slack.com/services/T00/B00/XXXX'
                          : 'https://discord.com/api/webhooks/000/XXXX'
                      }
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {newKind === 'webhook' && (
                <div className="space-y-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Endpoint URL (HTTP POST)
                    </label>
                    <input
                      type="url"
                      required
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                      placeholder="https://api.internal/v1/sentiro-webhook"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      HMAC Secret Signature (Optional)
                    </label>
                    <input
                      type="text"
                      value={newSecretKey}
                      onChange={(e) => setNewSecretKey(e.target.value)}
                      placeholder="e.g. whsec_abc12345"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save & Activate Channel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
