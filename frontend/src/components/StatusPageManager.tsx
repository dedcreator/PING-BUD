'use client';

import React, { useState, useEffect } from 'react';
import {
  Radio,
  Globe,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  Send,
  Code,
  Copy,
  Check,
  Bell,
  Eye,
  RefreshCw,
  Layers,
  Sparkles,
} from 'lucide-react';
import { StatusPageConfig, Monitor } from '@/types';
import { fetchStatusPageConfig, updateStatusPageConfig, createStatusPost } from '@/lib/api';
import SentiroLogo from './SentiroLogo';

interface StatusPageManagerProps {
  monitors: Monitor[];
  canEdit: boolean;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export default function StatusPageManager({
  monitors,
  canEdit,
  showToast,
}: StatusPageManagerProps) {
  const [config, setConfig] = useState<StatusPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState('Sentiro Core Infrastructure');
  const [headline, setHeadline] = useState('Real-time edge uptime & global probe telemetry');
  const [announcementText, setAnnouncementText] = useState('');
  const [customDomain, setCustomDomain] = useState('status.sentiro.xyz');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [showUptimeHistory, setShowUptimeHistory] = useState(true);
  const [allowSubscriptions, setAllowSubscriptions] = useState(true);

  // Quick Incident Post state
  const [postTitle, setPostTitle] = useState('');
  const [postKind, setPostKind] = useState('investigating');
  const [postBody, setPostBody] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Copy badge state
  const [badgeCopied, setBadgeCopied] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await fetchStatusPageConfig();
      if (data) {
        setConfig(data);
        if (data.company_name && data.company_name !== 'PulseWatch Infrastructure') {
          setCompanyName(data.company_name);
        }
        if (data.headline) setHeadline(data.headline);
        if (data.announcement_text) setAnnouncementText(data.announcement_text);
        if (data.custom_domain) setCustomDomain(data.custom_domain);
        if (data.theme) setTheme(data.theme);
        if (data.show_uptime_history !== undefined) setShowUptimeHistory(data.show_uptime_history);
        if (data.allow_subscriptions !== undefined) setAllowSubscriptions(data.allow_subscriptions);
      }
    } catch (err) {
      console.error('Failed to load status page config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      showToast('Viewer role cannot modify status page configuration.', 'error');
      return;
    }
    try {
      setSaving(true);
      await updateStatusPageConfig({
        company_name: companyName,
        headline,
        announcement_text: announcementText,
        custom_domain: customDomain,
        theme,
        show_uptime_history: showUptimeHistory,
        allow_subscriptions: allowSubscriptions,
      });
      showToast('Status page settings saved successfully!', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      showToast('Viewer role cannot publish status posts.', 'error');
      return;
    }
    if (!postTitle.trim() || !postBody.trim()) {
      showToast('Please provide both title and body for the incident note.', 'info');
      return;
    }
    try {
      setPublishing(true);
      await createStatusPost(postTitle.trim(), postBody.trim(), postKind);
      showToast('Incident update published to live status page!', 'success');
      setPostTitle('');
      setPostBody('');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to publish post', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const badgeMarkdown = `[![Sentiro Status](https://api.sentiro.xyz/api/status-page/badge.svg)](https://sentiro.xyz/status)`;

  const handleCopyBadge = () => {
    navigator.clipboard.writeText(badgeMarkdown);
    setBadgeCopied(true);
    showToast('Status badge markdown copied to clipboard!', 'success');
    setTimeout(() => setBadgeCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-[#0F172A]/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/80 border border-teal-200/80 dark:border-teal-800/80 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-sm">
            <Radio className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Status Page Service</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                Live &amp; Public
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Host transparent public status pages with 90-day SLA heatmaps and multi-channel subscriber dispatch.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyBadge}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all duration-150 active:scale-95 shadow-sm"
          >
            {badgeCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Code className="w-3.5 h-3.5 text-teal-600" />}
            <span>{badgeCopied ? 'Badge Copied' : 'Embed Badge'}</span>
          </button>

          <a
            href="/status"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all duration-150 active:scale-95"
          >
            <span>View Live Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Settings & Customizer Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveConfig} className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-[#0F172A]/80 backdrop-blur-xl shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-600" />
                <span>Status Page Branding &amp; Configuration</span>
              </h2>
              {saving && <span className="text-xs text-teal-600 font-mono animate-pulse">Saving changes...</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Custom Domain or Subdomain
                </label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="status.yourdomain.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Headline Tagline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Live Announcement Banner (Optional)
              </label>
              <textarea
                rows={2}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="e.g., Scheduled database migration successfully completed. All nodes operational."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            {/* Feature Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUptimeHistory}
                  onChange={(e) => setShowUptimeHistory(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">90-Day SLA Bars</span>
                  <span className="text-[10px] text-slate-400">Display daily uptime matrix per service</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowSubscriptions}
                  onChange={(e) => setAllowSubscriptions(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Subscriber Form</span>
                  <span className="text-[10px] text-slate-400">Allow visitors to subscribe via Email &amp; Telegram</span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="submit"
                disabled={saving || !canEdit}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all duration-150 active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>

          {/* Incident Publisher Box */}
          <form onSubmit={handlePublishPost} className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-[#0F172A]/80 backdrop-blur-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-teal-600" />
                <span>Publish Incident or Maintenance Note</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">Dispatches to status subscribers</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Update Title
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. EU Region Database Query Latency"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Investigation Status
                </label>
                <select
                  value={postKind}
                  onChange={(e) => setPostKind(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="investigating">Investigating</option>
                  <option value="identified">Identified</option>
                  <option value="monitoring">Monitoring Fix</option>
                  <option value="resolved">Resolved</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                SRE Explanation / Root Cause
              </label>
              <textarea
                rows={3}
                value={postBody}
                onChange={(e) => setPostBody(e.target.value)}
                placeholder="Provide details on the incident scope, mitigation actions taken, and verification results..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={publishing || !canEdit}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all duration-150 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{publishing ? 'Publishing...' : 'Publish Update'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (1 Col): Live Mini-Preview & Badges */}
        <div className="space-y-6">
          {/* Card: Live Preview Card */}
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-[#0F172A]/80 backdrop-blur-xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-teal-600" />
              <span>Status Page Preview</span>
            </h3>

            <div className="p-4 rounded-xl border border-teal-200/70 dark:border-teal-800/50 bg-teal-50/30 dark:bg-teal-950/20 space-y-3">
              <div className="flex items-center gap-2">
                <SentiroLogo size="xs" showText={false} />
                <span className="font-extrabold text-xs text-slate-900 dark:text-white">{companyName}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>All Systems Operational</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{headline}</p>
              <div className="text-[10px] text-slate-400 font-mono">
                {monitors.length} Monitors • 4 Probe Regions (Lagos, London, Oregon, Frankfurt)
              </div>
            </div>
          </div>

          {/* Card: Embeddable SVG Status Badge */}
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-[#0F172A]/80 backdrop-blur-xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-teal-600" />
              <span>Embeddable SVG Badge</span>
            </h3>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <div className="flex items-center rounded-md border border-teal-500 overflow-hidden text-[10px] font-bold shadow-md">
                <span className="px-2.5 py-1 bg-white text-slate-950 flex items-center gap-1.5 border-r border-teal-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  sentiro
                </span>
                <span className="px-2.5 py-1 bg-emerald-600 text-white flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> operational
                </span>
              </div>
            </div>

            <div>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                Add to your GitHub README or project documentation:
              </span>
              <div className="relative">
                <textarea
                  readOnly
                  rows={2}
                  value={badgeMarkdown}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[10px] text-slate-700 dark:text-slate-300 resize-none focus:outline-none"
                />
                <button
                  onClick={handleCopyBadge}
                  className="absolute right-2 top-2 p-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold shadow"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
