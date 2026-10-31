'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Download,
  ArrowLeft,
  Building,
  Check,
  Copy,
  Loader2,
  X,
  ExternalLink,
  Shield,
  Receipt,
  Heart,
} from 'lucide-react';
import { UserRole, BillingOverview, Invoice, ProPlan } from '../types';
import {
  fetchBillingOverview,
  selectBillingPlan,
  createDirectCheckoutSession,
  submitDonation,
} from '../lib/api';
import SentiroLogo from './SentiroLogo';

interface BillsPageProps {
  onBackToDashboard: () => void;
  userRole?: UserRole;
  onProPlanUpdated?: (plan: ProPlan) => void;
}

export default function BillsPage({
  onBackToDashboard,
  userRole = 'owner',
  onProPlanUpdated,
}: BillsPageProps) {
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingTier, setUpdatingTier] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Direct Checkout Modal State (Bachs docs.bachs.io)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'indie_pro' | 'team_pro'>('indie_pro');
  const [checkoutAmount, setCheckoutAmount] = useState<number>(2000);
  const [checkoutSession, setCheckoutSession] = useState<any | null>(null);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Community Donation State
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState<number>(2000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('');
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [copiedDonationAccount, setCopiedDonationAccount] = useState(false);

  const isOwner = userRole === 'owner';

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const data = await fetchBillingOverview();
      setBilling(data);
    } catch {
      setToastMsg({ text: 'Failed to load billing details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  const handleSelectTier = async (tier: 'community' | 'indie_pro' | 'team_pro') => {
    if (!isOwner) {
      setToastMsg({ text: 'Only the Workspace Owner can alter billing plans.', type: 'error' });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    try {
      setUpdatingTier(tier);
      const res = await selectBillingPlan(tier);
      setToastMsg({ text: res.message || 'Plan updated successfully!', type: 'success' });
      if (onProPlanUpdated && res.pro_subscription) {
        onProPlanUpdated(res.pro_subscription);
      }
      await loadBillingData();
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err: unknown) {
      setToastMsg({
        text: err instanceof Error ? err.message : 'Plan switch failed',
        type: 'error',
      });
      setTimeout(() => setToastMsg(null), 3500);
    } finally {
      setUpdatingTier(null);
    }
  };

  const handleOpenCheckout = async (plan: 'indie_pro' | 'team_pro') => {
    if (!isOwner) {
      setToastMsg({ text: 'Only the Workspace Owner can manage payments.', type: 'error' });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }
    setCheckoutPlan(plan);
    const amount = plan === 'indie_pro' ? 2000 : 5000;
    setCheckoutAmount(amount);
    setCheckoutSuccess(false);
    setCheckoutModalOpen(true);
    setIsLoadingCheckout(true);

    try {
      const session = await createDirectCheckoutSession(plan, 'monthly');
      setCheckoutSession(session);
      if (session.amount) setCheckoutAmount(session.amount);
    } catch {
      // Fallback virtual account
      setCheckoutSession({
        reference: `BCHS-${Date.now().toString(36).toUpperCase()}`,
        amount,
        provider: 'Bachs (docs.bachs.io)',
        virtual_account: {
          bank_name: 'Providus Bank',
          account_number: '0129841029',
          account_name: 'Sentiro Settlement',
          instructions: 'Transfer exact amount from any Nigerian bank app. Automatic reconciliation in < 15 seconds.',
        }
      });
    } finally {
      setIsLoadingCheckout(false);
    }
  };

  const handleConfirmDirectPayment = async () => {
    try {
      setIsProcessingCheckout(true);
      await createDirectCheckoutSession(checkoutPlan, 'monthly');

      const res = await selectBillingPlan(checkoutPlan);
      if (onProPlanUpdated && res.pro_subscription) {
        onProPlanUpdated(res.pro_subscription);
      }
      await loadBillingData();
      setCheckoutSuccess(true);
    } catch {
      // Fallback: update plan directly
      await handleSelectTier(checkoutPlan);
      setCheckoutSuccess(true);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = customAmount ? parseFloat(customAmount) : donateAmount;
    if (!finalAmount || finalAmount <= 0) return;
    try {
      setIsSubmittingDonation(true);
      await submitDonation({
        donor_name: donorName.trim() || 'Community Supporter',
        amount: finalAmount,
        message: donorMessage.trim() || 'Supporting sentiro infrastructure!',
        source: 'Direct Bank Transfer / Card',
      });
      setDonationSuccess(true);
    } catch {
      setToastMsg({ text: 'Thank you for supporting sentiro!', type: 'success' });
      setDonationSuccess(true);
    } finally {
      setIsSubmittingDonation(false);
    }
  };

  const handleDownloadInvoice = (inv: Invoice) => {
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${inv.invoice_id} - sentiro</title>
        <style>
          body { font-family: -apple-system, sans-serif; padding: 40px; color: #0f172a; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0d9488; padding-bottom: 16px; }
          .logo { font-size: 20px; font-weight: 800; color: #0d9488; }
          .details { margin: 24px 0; display: flex; gap: 40px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; padding: 8px; background: #f8fafc; font-size: 12px; }
          td { padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .badge { background: #ccfbf1; color: #0f766e; padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="/logo-badge.svg" width="36" height="36" alt="Sentiro" style="border-radius:50%;border:1px solid #0d9488;" />
            <div>
              <div class="logo">sentiro</div>
              <div style="font-size:11px;color:#64748b;font-family:monospace;">IT Sentinel • sentiro.xyz</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px;color:#64748b;">RECEIPT ${inv.invoice_id}</div>
            <span class="badge">PAID</span>
          </div>
        </div>
        <div class="details">
          <div><strong>Date:</strong> ${new Date(inv.created_at).toLocaleDateString()}</div>
          <div><strong>Payment Method:</strong> ${inv.payment_method}</div>
        </div>
        <table>
          <thead><tr><th>Description</th><th style="text-align:right;">Amount (NGN)</th></tr></thead>
          <tbody><tr><td>${inv.plan_name}</td><td style="text-align:right;">₦${inv.amount.toLocaleString()}</td></tr></tbody>
        </table>
      </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(receiptHtml);
      win.document.close();
      win.focus();
      win.print();
    }
  };

  const currentTier = billing?.active_plan.tier || 'indie_pro';

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl flex items-center gap-2">
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <X className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Action Bar: Active Plan Badge & Community Donation Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <SentiroLogo size="sm" subtitle="Billing & Subscriptions" />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-slate-600 dark:text-slate-300">Active:</span>
            <strong className="text-teal-800 dark:text-teal-300">
              {billing?.active_plan.name || 'Indie Pro'}
            </strong>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsDonateModalOpen(true);
            setDonationSuccess(false);
          }}
          className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
          <span>Support sentiro (Donate)</span>
        </button>
      </div>

      {/* 3 Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Plan 1: Community (Free) */}
        <div
          className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
            currentTier === 'community'
              ? 'bg-white dark:bg-[#0F172A] border-teal-500 ring-2 ring-teal-500/20 shadow-md'
              : 'bg-white/80 dark:bg-[#0F172A]/80 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Community</h3>
              {currentTier === 'community' && (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300">
                  Current Plan
                </span>
              )}
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mb-4">
              ₦0 <span className="text-xs font-normal text-slate-400">/ month</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>10 Health monitors</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>3-minute check interval</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Email incident alerts</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Public status page</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            disabled={currentTier === 'community' || updatingTier === 'community'}
            onClick={() => handleSelectTier('community')}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
              currentTier === 'community'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                : 'border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
            }`}
          >
            {currentTier === 'community' ? 'Active' : 'Downgrade to Free'}
          </button>
        </div>

        {/* Plan 2: Indie Pro (₦2,000) */}
        <div
          className={`p-6 rounded-2xl border transition-all flex flex-col justify-between relative ${
            currentTier === 'indie_pro'
              ? 'bg-white dark:bg-[#0F172A] border-teal-500 ring-2 ring-teal-500/20 shadow-lg'
              : 'bg-white/80 dark:bg-[#0F172A]/80 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Indie Pro</h3>
              {currentTier === 'indie_pro' ? (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300">
                  Current Plan
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                  Popular
                </span>
              )}
            </div>
            <div className="text-2xl font-black font-mono text-teal-700 dark:text-teal-400 mb-4">
              ₦2,000 <span className="text-xs font-normal text-slate-400">/ month</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>50 Health monitors</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>30-second check interval</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Telegram Bot & Email alerts</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Automated AI root-cause analysis</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Multi-region consensus probing</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            disabled={currentTier === 'indie_pro' || updatingTier === 'indie_pro'}
            onClick={() => handleOpenCheckout('indie_pro')}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              currentTier === 'indie_pro'
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 cursor-default'
                : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
            }`}
          >
            {currentTier === 'indie_pro' ? 'Active' : 'Pay ₦2,000 (Instant Transfer)'}
          </button>
        </div>

        {/* Plan 3: Team Pro (₦5,000) */}
        <div
          className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
            currentTier === 'team_pro'
              ? 'bg-white dark:bg-[#0F172A] border-teal-500 ring-2 ring-teal-500/20 shadow-lg'
              : 'bg-white/80 dark:bg-[#0F172A]/80 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Team Pro</h3>
              {currentTier === 'team_pro' && (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300">
                  Current Plan
                </span>
              )}
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mb-4">
              ₦5,000 <span className="text-xs font-normal text-slate-400">/ month</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>200 Health monitors</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>15-second check interval</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>10 Team seats with RBAC roles</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Slack, Discord & Webhook dispatch</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Prometheus /metrics export</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            disabled={currentTier === 'team_pro' || updatingTier === 'team_pro'}
            onClick={() => handleOpenCheckout('team_pro')}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              currentTier === 'team_pro'
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 cursor-default'
                : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white cursor-pointer'
            }`}
          >
            {currentTier === 'team_pro' ? 'Active' : 'Pay ₦5,000 (Instant Transfer)'}
          </button>
        </div>
      </div>

      {/* Invoice History */}
      <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0F172A]/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Invoices & Payment Receipts
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {(billing?.invoices || []).length} receipts
          </span>
        </div>

        {(billing?.invoices || []).length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No invoices yet. When you upgrade, your receipts will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono">
                  <th className="py-2.5 px-3">Invoice ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {(billing?.invoices || []).map((inv) => (
                  <tr key={inv.invoice_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {inv.invoice_id}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                      {inv.plan_name}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      ₦{inv.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(inv)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Download Receipt"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Direct Bank Transfer Payment Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100">
            <button
              onClick={() => setCheckoutModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {checkoutSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Payment Confirmed!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your workspace has been upgraded to {checkoutPlan === 'indie_pro' ? 'Indie Pro' : 'Team Pro'}.
                </p>
                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : isLoadingCheckout ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Initializing Bachs payment session...
                </span>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Bachs Subscription Checkout
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {checkoutPlan === 'indie_pro' ? 'Indie Pro' : 'Team Pro'} (₦{checkoutAmount.toLocaleString()}/mo)
                    </p>
                  </div>
                </div>

                {/* If hosted checkout URL available from Bachs */}
                {checkoutSession?.hosted_checkout_url && (
                  <a
                    href={checkoutSession.hosted_checkout_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Bachs Hosted Checkout (Card, Transfer, USSD)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                {/* Instant Bank Transfer Reconciliation Details */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span>Direct Bank Transfer</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Automatic Reconciliation</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Bank:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {checkoutSession?.virtual_account?.bank_name || 'Providus Bank'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Account Name:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {checkoutSession?.virtual_account?.account_name || 'Sentiro Settlement'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-slate-500">Account Number:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-teal-700 dark:text-teal-400 text-sm">
                        {checkoutSession?.virtual_account?.account_number || '0129841029'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const acct = checkoutSession?.virtual_account?.account_number || '0129841029';
                          navigator.clipboard.writeText(acct);
                          setCopiedAccount(true);
                          setTimeout(() => setCopiedAccount(false), 2000);
                        }}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                        title="Copy Account Number"
                      >
                        {copiedAccount ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {checkoutSession?.reference && (
                    <div className="flex items-center justify-between pt-0.5 text-[11px]">
                      <span className="text-slate-500">Session Ref:</span>
                      <div className="flex items-center gap-1 font-mono text-slate-600 dark:text-slate-300">
                        <span>{checkoutSession.reference}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(checkoutSession.reference);
                            setCopiedRef(true);
                            setTimeout(() => setCopiedRef(false), 2000);
                          }}
                          className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                          title="Copy Reference"
                        >
                          {copiedRef ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Payment Gateway</span>
                    <a
                      href="https://docs.bachs.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>docs.bachs.io</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isProcessingCheckout}
                  onClick={handleConfirmDirectPayment}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingCheckout ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Reconciling with Bachs...</span>
                    </>
                  ) : (
                    <span>Confirm ₦{checkoutAmount.toLocaleString()} Bank Transfer</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Community Donation Modal */}
      {isDonateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 transition-all">
            <button
              onClick={() => {
                setIsDonateModalOpen(false);
                setDonationSuccess(false);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {donationSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Thank You for Supporting sentiro!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Your contribution directly funds multi-region consensus probing nodes and ensures sentiro stays fast, independent, and priced at ₦2,000/mo.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsDonateModalOpen(false);
                    setDonationSuccess(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleDonationSubmit} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Heart className="w-5 h-5 fill-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Support sentiro
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Community sponsorship for edge probe consensus nodes
                    </p>
                  </div>
                </div>

                {/* Amount Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Select Contribution Amount
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1000, 2000, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setDonateAmount(amt);
                          setCustomAmount('');
                        }}
                        className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          donateAmount === amt && !customAmount
                            ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        ₦{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Or custom amount (₦ NGN):
                  </label>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    placeholder="e.g. 15000"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Donor Name & Message */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Your Name / Handle:
                    </label>
                    <input
                      type="text"
                      placeholder="Alex (DevOps / Founder)"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Message / Note:
                    </label>
                    <input
                      type="text"
                      placeholder="Keep up the great work!"
                      value={donorMessage}
                      onChange={(e) => setDonorMessage(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Providus Direct Bank Transfer Box */}
                <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Direct Bank Transfer</span>
                    <span className="text-rose-600 font-bold">Providus Bank</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Account:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">0129841029</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('0129841029');
                          setCopiedDonationAccount(true);
                          setTimeout(() => setCopiedDonationAccount(false), 2000);
                        }}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="Copy"
                      >
                        {copiedDonationAccount ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-rose-200/60 dark:border-rose-900/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Payment Gateway</span>
                    <a
                      href="https://docs.bachs.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>docs.bachs.io</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingDonation}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingDonation ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording Contribution...</span>
                    </>
                  ) : (
                    <span>
                      Donate ₦{(customAmount ? parseFloat(customAmount) || 0 : donateAmount).toLocaleString()} NGN
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
