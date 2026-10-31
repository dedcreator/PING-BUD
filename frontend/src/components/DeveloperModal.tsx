'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Code,
  Copy,
  Check,
  Trash2,
  Plus,
  Loader2,
  Terminal,
  Activity,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { ApiKey, UserRole } from '../types';
import { fetchApiKeys, createApiKey, deleteApiKey } from '../lib/api';
import SentiroLogo from './SentiroLogo';

interface DeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  firstMonitorId?: number;
}

export default function DeveloperModal({
  isOpen,
  onClose,
  userRole,
  firstMonitorId = 1,
}: DeveloperModalProps) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyScope, setKeyScope] = useState<'read' | 'write' | 'admin'>('write');
  const [newSecretKey, setNewSecretKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isOwner = userRole === 'owner';

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchApiKeys()
        .then(setKeys)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      setErrorMsg('Only Owner role can generate new API keys.');
      return;
    }
    setErrorMsg('');
    try {
      setLoading(true);
      const res = await createApiKey(keyName.trim() || 'CLI Tool Key', keyScope);
      setKeys((prev) => [res.api_key, ...prev]);
      setNewSecretKey(res.secret_key);
      setKeyName('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to generate key');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (!isOwner) return;
    try {
      await deleteApiKey(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const copyText = (txt: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(txt);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const sampleCurl = `curl -H "Authorization: Token ${newSecretKey || 'pw_live_demo_token'}" http://127.0.0.1:8000/api/overview/`;
  const badgeMarkdown = `![Uptime](http://127.0.0.1:8000/badge/${firstMonitorId}.svg)`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <SentiroLogo size="sm" showText={false} />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Sentiro Developer API & Observability
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scoped API Keys, Prometheus /metrics & Embed Badges
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
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SECTION 1: API KEYS */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-indigo-500" />
              <span>Personal & CI/CD API Keys</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Header: <code>Authorization: Token &lt;key&gt;</code>
            </span>
          </div>

          {/* New Key Revealed Banner */}
          {newSecretKey && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs">
              <span className="font-bold block mb-1">Generated Secret API Key:</span>
              <div className="flex items-center gap-2 bg-slate-900 text-slate-100 px-3 py-2 rounded-lg font-mono text-xs">
                <span className="flex-1 truncate">{newSecretKey}</span>
                <button
                  onClick={() => copyText(newSecretKey, setCopiedKey)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                Store this token safely now. sentiro hashes keys with SHA-256 and will not display it again.
              </p>
            </div>
          )}

          {/* List of existing keys */}
          <div className="space-y-2 mb-4">
            {loading ? (
              <div className="text-center py-4 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                Loading keys...
              </div>
            ) : keys.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 border border-dashed rounded-lg">
                No active API keys found. Generate one below.
              </div>
            ) : (
              keys.map((k) => (
                <div
                  key={k.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#16223B]/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{k.name}</span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                        {k.scope}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Prefix: {k.key_prefix}•••••••• • Created {new Date(k.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => handleDeleteKey(k.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Revoke Key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Create Key Form (Owner only) */}
          {isOwner ? (
            <form onSubmit={handleGenerateKey} className="flex gap-2">
              <input
                type="text"
                placeholder="Key Description (e.g. Terraform / CI Runner)"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <select
                value={keyScope}
                onChange={(e) => setKeyScope(e.target.value as 'read' | 'write' | 'admin')}
                className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
              >
                <option value="write">Write Scope</option>
                <option value="read">Read Only</option>
                <option value="admin">Full Admin</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generate Key</span>
              </button>
            </form>
          ) : (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
              API key creation is restricted to the <strong>Owner</strong> role. Switch role in Auth Modal to test.
            </div>
          )}
        </div>

        {/* SECTION 2: PROMETHEUS /METRICS */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Prometheus & Grafana Scraper</span>
            </h3>
            <a
              href="http://127.0.0.1:8000/metrics"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>View Live /metrics</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="relative">
            <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto">
              curl -s http://127.0.0.1:8000/metrics
            </pre>
            <button
              onClick={() => copyText('curl -s http://127.0.0.1:8000/metrics', setCopiedCurl)}
              className="absolute right-2.5 top-2.5 p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
            >
              {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-mono">
            Directly compatible with Prometheus scraping: <code>pulsewatch_monitor_status</code>, <code>pulsewatch_monitor_uptime_24h_percent</code>.
          </p>
        </div>

        {/* SECTION 3: EMBEDDABLE SVG BADGE */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Code className="w-4 h-4 text-purple-500" />
              <span>Embeddable Markdown / HTML Badge</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Live SVG</span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-800">
            <div className="shrink-0">
              {/* Badge Preview */}
              <div className="inline-flex rounded text-[11px] font-sans overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm">
                <span className="bg-slate-700 text-white px-2 py-0.5">uptime</span>
                <span className="bg-emerald-600 text-white px-2 py-0.5 font-bold font-mono">99.98%</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <input
                type="text"
                readOnly
                value={badgeMarkdown}
                className="w-full px-2.5 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
              />
            </div>

            <button
              onClick={() => copyText(badgeMarkdown, setCopiedBadge)}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900"
            >
              {copiedBadge ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
