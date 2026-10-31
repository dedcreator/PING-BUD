'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Send,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Bug,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import SentiroLogo from './SentiroLogo';
import { submitFeedback } from '../lib/api';

export type FeedbackMode = 'feature' | 'issue';

interface FeedbackModalProps {
  isOpen: boolean;
  initialMode?: FeedbackMode;
  onClose: () => void;
  currentUserEmail?: string;
}

export default function FeedbackModal({
  isOpen,
  initialMode = 'feature',
  onClose,
  currentUserEmail = '',
}: FeedbackModalProps) {
  const [mode, setMode] = useState<FeedbackMode>(initialMode);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('probes');
  const [severity, setSeverity] = useState('p3');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState(currentUserEmail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await submitFeedback({
        mode,
        title: title.trim(),
        description: description.trim(),
        category,
        severity: mode === 'issue' ? severity : undefined,
        email: email.trim(),
      });

      setIsSuccess(true);
      setSuccessMsg(res.message || 'Dispatched successfully to engineering.');
      setTimeout(() => {
        setIsSuccess(false);
        setTitle('');
        setDescription('');
        onClose();
      }, 2200);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to deliver feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 transition-all max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <SentiroLogo size="sm" showText={false} />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {mode === 'feature' ? 'Request a Feature' : 'Report an Issue'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'feature'
                  ? 'Help shape the future of Sentiro IT Sentinel'
                  : 'Report a bug or unexpected behavior to our engineering team'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 my-4 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('feature');
              setIsSuccess(false);
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              mode === 'feature'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Request Feature</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('issue');
              setIsSuccess(false);
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              mode === 'issue'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Report Issue</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {isSuccess ? (
          <div className="py-8 text-center space-y-3 animate-slide-up-spring">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {mode === 'feature' ? 'Feature Request Dispatched!' : 'Issue Report Logged!'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Thank you for helping us make Sentiro better. Our team has received your ticket.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {mode === 'feature' ? 'Feature Summary / Suggestion' : 'Issue Summary'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  mode === 'feature'
                    ? 'e.g. Add gRPC health check probe protocol'
                    : 'e.g. SSL expiry alert fired 2 days early'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            {/* Category / Severity Grid */}
            <div className="grid grid-cols-2 gap-3">
              {mode === 'feature' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value="probes">Synthetic Probes</option>
                    <option value="channels">Alert Channels</option>
                    <option value="status">Public Status Pages</option>
                    <option value="ai">AI Root-Cause (RCA)</option>
                    <option value="ui">Dashboard & UX</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value="p1">P1 - Outage / Blocker</option>
                    <option value="p2">P2 - Major Glitch</option>
                    <option value="p3">P3 - Minor Issue</option>
                    <option value="p4">P4 - Cosmetic / Visual</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Your Work Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sre@company.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {mode === 'feature' ? 'Detailed Description & Use Case' : 'Steps to Reproduce / Expected Behavior'}
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  mode === 'feature'
                    ? 'Explain how this feature helps your infrastructure and why it would be valuable...'
                    : '1. Navigate to...\n2. Click on...\n3. Observed behavior vs Expected behavior...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-400 font-mono">
                Dispatched directly to Sentiro SRE team
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                    mode === 'feature'
                      ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/20'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : mode === 'feature' ? 'Submit Request' : 'Submit Issue'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
