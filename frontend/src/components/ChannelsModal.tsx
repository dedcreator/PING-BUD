'use client';

import React, { useState } from 'react';
import {
  X,
  Bell,
  Mail,
  Send,
  MessageSquare,
  Webhook,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';
import { AlertChannel } from '../types';
import { testChannel } from '../lib/api';

interface ChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: AlertChannel[];
}

export default function ChannelsModal({ isOpen, onClose, channels }: ChannelsModalProps) {
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ id: number; ok: boolean; message: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleTest = async (id: number) => {
    try {
      setTestingId(id);
      setTestResult(null);
      const res = await testChannel(id);
      setTestResult({ id, ok: res.ok, message: res.message });
      setTimeout(() => setTestResult(null), 4000);
    } catch {
      setTestResult({ id, ok: false, message: 'Failed to send test ping' });
    } finally {
      setTestingId(null);
    }
  };

  const getChannelIcon = (kind: string) => {
    switch (kind) {
      case 'email':
        return <Mail className="w-4 h-4 text-sky-500" />;
      case 'slack':
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'discord':
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      case 'telegram':
        return <Send className="w-4 h-4 text-cyan-500" />;
      case 'sms_whatsapp':
        return <Smartphone className="w-4 h-4 text-pink-500" />;
      case 'webhook':
      default:
        return <Webhook className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 my-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Bell className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Notification Channels & Alert Routing
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instant delivery over Email, Telegram Bot (100% Free), Slack, Discord & Webhooks
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

        {/* Channels List */}
        <div className="space-y-3 mt-4">
          {channels.map((chan) => (
            <div
              key={chan.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#16223B]/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {getChannelIcon(chan.kind)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {chan.name}
                    </h4>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {chan.kind}
                    </span>
                    {chan.enabled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Enabled
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Disabled</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate max-w-sm">
                    {chan.config?.email || chan.config?.webhook_url || chan.config?.bot_token ? 'Configured • Ready for dispatch' : 'Default endpoint'}
                  </p>
                </div>
              </div>

              {/* Action: Test Ping */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {testResult && testResult.id === chan.id && (
                  <span
                    className={`text-xs font-mono px-2 py-1 rounded flex items-center gap-1 ${
                      testResult.ok
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {testResult.ok ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {testResult.message}
                  </span>
                )}

                <button
                  onClick={() => handleTest(chan.id)}
                  disabled={testingId === chan.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  {testingId === chan.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-teal-600" />
                  )}
                  <span>Send Test Alert</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Telegram & Email Architecture Note */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-500" />
            <span>Telegram Bot & Email Notification Architecture (100% Free Forever)</span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed">
            <div>
              • <strong>Telegram Bots:</strong> Completely free to send unlimited messages, incident media, and recovery reports directly to channels or private chats via the official Telegram Bot API (zero SIM or per-message fees).
            </div>
            <div>
              • <strong>High-Deliverability Email:</strong> Outage digests with plain-English AI root-cause analysis sent via standard SMTP / Postmark / SendGrid.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
