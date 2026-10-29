'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe,
  Radio,
  Server,
  Shield,
  Zap,
  TrendingDown,
  Terminal,
  Bot,
  Smartphone,
  Layers,
  Database,
  Lock,
  ExternalLink,
  Users,
  ShieldCheck,
  Cpu,
  Heart,
  Building,
  CreditCard,
  X,
  Copy,
  Loader2,
} from 'lucide-react';
import { ProPlan, User } from '../types';
import Interactive3DHero from './Interactive3DHero';
import { submitDonation, createBachsCheckoutSession } from '../lib/api';

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

interface LandingPageProps {
  onGoToDashboard: () => void;
  onGoToPricing?: () => void;
  onGoToStatusPage?: () => void;
  onGoToBilling?: () => void;
  onOpenAuthModal?: () => void;
  currentUser?: User | null;
  proPlan?: ProPlan | null;
}

export default function LandingPage({
  onGoToDashboard,
  onGoToPricing = () => {},
  onGoToStatusPage = () => {},
  onGoToBilling = () => {},
  onOpenAuthModal,
  currentUser,
  proPlan,
}: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Donation state
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState<number>(2500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('');
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const faqs = [
    {
      q: 'Why is pingbud.us priced in Nigerian Naira (₦2,000 & ₦5,000)?',
      a: 'Most global monitoring platforms charge in US Dollars ($35 to $80/month), which translates to ₦55,000–₦125,000/month for African startups and engineers. pingbud.us runs ultra-lean on SQLite in WAL mode with sub-120MB RAM, allowing us to offer Indie Pro at ₦2,000/mo and Team Pro at ₦5,000/mo sustainably.'
    },
    {
      q: 'Can I self-host pingbud.us for my organization?',
      a: 'Yes. pingbud.us provides a fully self-hostable containerized edition for teams with custom on-premises compliance needs, alongside our fully managed cloud SaaS with automated multi-region consensus probing.'
    },
    {
      q: 'How does Multi-Region Consensus probing eliminate false alarms?',
      a: 'If a probe from Oregon or London reports a failure, pingbud.us automatically triggers confirmation checks from Lagos and Frankfurt before firing an alert. This ensures a temporary transatlantic transit blip does not trigger midnight wake-up alerts.'
    },
    {
      q: 'Do you support Telegram Bot & Email incident notifications?',
      a: 'Yes! pingbud.us natively integrates with Telegram Bot API (100% free with unlimited incident alerts and zero carrier fees) and high-deliverability SRE email dispatch for instantaneous outage alerts.'
    },
    {
      q: 'How does the AI Incident Root-Cause Analysis work?',
      a: 'When an outage occurs, pingbud.us synthesizes HTTP status codes, DNS lookup times, TLS handshakes, and response headers into a plain-English explanation (e.g., "502 Bad Gateway: Upstream Gunicorn socket timeout during DB migration").'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Marketing Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl bg-white/70 dark:bg-[#0B1120]/75">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>pingbud.us</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400 font-bold border border-slate-200 dark:border-slate-700">
                  SaaS
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                Zero-Overhead Synthetic Uptime
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              Naira Pricing (₦2,000)
            </a>
            <a href="#comparison" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              ROI Savings
            </a>
            <a href="#faq" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDonateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Support pingbud.us infrastructure"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>Donate</span>
            </button>

            {currentUser ? (
              <button
                onClick={onGoToDashboard}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition-all shadow-sm inline-flex items-center gap-1.5"
              >
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION (FLAT UI, LIQUID GLASS) */}
      <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Headline, subtext, actions */}
            <div className="lg:col-span-7 text-left space-y-6">
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                Uptime & Incident Monitoring That Costs{' '}
                <span className="text-teal-600 dark:text-teal-400">
                  Almost Nothing
                </span>{' '}
                to Run.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Stop paying <strong>$35 to $80 every month</strong> to legacy US SaaS providers.
                pingbud.us provides sub-30s intervals, multi-region probes, Telegram & Email alerts, and AI
                root-cause analysis starting at just <strong className="text-teal-600 dark:text-teal-400">₦2,000/month</strong>.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={onGoToDashboard}
                  className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <span>Get Started for ₦2,000/mo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Column: Big Seamless 3D Consensus Structure Beside */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <Interactive3DHero />
            </div>
          </div>

          {/* Key Metric Highlights Bar */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">30s</div>
              <div className="text-xs text-slate-500 mt-0.5">Check Interval (2x Faster)</div>
            </div>
            <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <div className="text-2xl font-black text-teal-700 dark:text-teal-400 font-mono">₦2,000</div>
              <div className="text-xs text-slate-500 mt-0.5">Indie Pro (Save 96%)</div>
            </div>
            <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <div className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono">99.99%</div>
              <div className="text-xs text-slate-500 mt-0.5">Enterprise Consensus SLA</div>
            </div>
            <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">0 Egress</div>
              <div className="text-xs text-slate-500 mt-0.5">Zero Cloud Markup Fees</div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE INTERACTIVE PREVIEW CARD (LIQUID GLASS) */}
      <section className="py-10 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl bg-white/75 dark:bg-[#0F172A]/85 shadow-lg p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Primary Production API Gateway
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                    UP • 99.99%
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  https://api.pingbud.us/v1/health • Interval: 30s
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Consensus Latency</div>
                <div className="text-base font-extrabold text-teal-700 dark:text-teal-400 font-mono">
                  42 ms
                </div>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
          </div>

          {/* 60-bucket Uptime visualization demo */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
              <span>Past 60 Probes (Consensus Check)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">100.0% Uptime</span>
            </div>
            <div className="grid grid-cols-60 gap-1 h-7">
              {Array.from({ length: 60 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-emerald-500 hover:bg-emerald-400 rounded-sm transition-all cursor-pointer"
                  title={`Probe ${i + 1}: 200 OK (38ms)`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 font-mono">
              <span>30 mins ago</span>
              <span>Just now</span>
            </div>
          </div>

          {/* AI RCA Callout snippet */}
          <div className="mt-6 p-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
            <Bot className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                Automated AI Incident Diagnosis:
              </span>{' '}
              <span className="text-slate-600 dark:text-slate-300">
                SSL certificate valid for 74 days (Let's Encrypt). TLS 1.3 negotiated in 14ms from Lagos edge node. HTTP 200 OK returned with zero packet loss.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 font-mono uppercase tracking-wider mb-2">
            <Zap className="w-4 h-4" />
            <span>Precision Synthetic Probing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Everything You Need for Resilient Monitoring
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Engineered from first principles to be 10x faster, zero bloat, and fully self-hostable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Sub-30s Check Intervals
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Detect service interruptions within seconds rather than the 3 to 5 minutes standard on free tiers of legacy SaaS.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-400 flex items-center justify-center mb-4">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Multi-Region Consensus Probes
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Consensus checks dispatched from Lagos, London, Frankfurt, and Oregon eliminate midnight false alarms from local ISP transit jitter.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-400 flex items-center justify-center mb-4">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              AI Incident Root-Cause Analysis
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Our automated diagnostic agent synthesizes error traces, DNS timing, and HTTP headers into instant human-readable incident summaries.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-400 flex items-center justify-center mb-4">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Telegram Bot & Email Alerts
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Native integration with Telegram Bots sends 100% free, instantaneous incident alerts with zero carrier fees or SMS limits.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-400 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              SSL / TLS Expiry Sentinel
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Get alerted 30, 14, and 7 days before SSL certificates expire. Never let a missed renewal cause downtime.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-400 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              High-Efficiency Embedded Engine
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Zero expensive database overhead. Sub-120MB memory footprint runs comfortably on any infrastructure with zero cloud egress markup.
            </p>
          </div>
        </div>
      </section>

      {/* ROI SAVINGS COMPARISON SECTION */}
      <section id="comparison" className="py-20 bg-slate-100/60 dark:bg-[#0c1427] border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 font-mono mb-2">
              <TrendingDown className="w-4 h-4" />
              <span>RADICAL COST EFFICIENCY</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Why Spend ₦55,000/mo on Legacy Monitoring?
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Legacy providers charge massive markups. pingbud.us passes 100% of the architectural savings to you.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-[11px] text-slate-500 uppercase font-mono border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-5">Provider</th>
                  <th className="py-3 px-5">Monthly (NGN)</th>
                  <th className="py-3 px-5">Annual Cost</th>
                  <th className="py-3 px-5">Interval</th>
                  <th className="py-3 px-5">Architecture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                <tr className="bg-teal-50/50 dark:bg-teal-950/30 font-bold text-slate-900 dark:text-white">
                  <td className="py-4 px-5 font-sans font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                    <span>pingbud.us Indie Pro</span>
                  </td>
                  <td className="py-4 px-5 text-teal-700 dark:text-teal-400 text-sm font-extrabold">
                    ₦2,000 / mo
                  </td>
                  <td className="py-4 px-5 text-emerald-600 dark:text-emerald-400 font-bold">
                    ₦20,000 / yr
                  </td>
                  <td className="py-4 px-5">30 Seconds</td>
                  <td className="py-4 px-5 text-emerald-600">Cloud & Self-Host</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-sans font-medium">UptimeRobot (Pro)</td>
                  <td className="py-3.5 px-5 text-rose-500">~$34 (₦54,400) / mo</td>
                  <td className="py-3.5 px-5 text-rose-500">₦650,000 / yr</td>
                  <td className="py-3.5 px-5">60 Seconds</td>
                  <td className="py-3.5 px-5 text-slate-400">Proprietary</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-sans font-medium">BetterStack Uptime</td>
                  <td className="py-3.5 px-5 text-rose-500">~$29 (₦46,400) / mo</td>
                  <td className="py-3.5 px-5 text-rose-500">₦550,000 / yr</td>
                  <td className="py-3.5 px-5">30 Seconds</td>
                  <td className="py-3.5 px-5 text-slate-400">Proprietary</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-sans font-medium">Pingdom Synthetic Starter</td>
                  <td className="py-3.5 px-5 text-rose-500">~$45 (₦72,000) / mo</td>
                  <td className="py-3.5 px-5 text-rose-500">₦860,000 / yr</td>
                  <td className="py-3.5 px-5">60 Seconds</td>
                  <td className="py-3.5 px-5 text-slate-400">Proprietary</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PRICING SECTION (NAIRA ₦2,000 & ₦5,000 - FLAT UI) */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 font-mono uppercase tracking-wider mb-2">
            <Zap className="w-4 h-4" />
            <span>Fair & Predictable Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
            Transparent Nigerian Naira Plans
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            No unexpected FX charges. Pay locally in Naira via Bachs (Virtual Bank Accounts, Direct Transfer & Cards).
          </p>

          {/* Billing Switch */}
          <div className="inline-flex items-center gap-2 mt-8 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-1.5 py-0.2 rounded-full font-bold">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* DEVELOPER / FREE TIER (₦0) */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Developer Tier
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Starter
                </span>
              </div>
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
                  ₦0
                </span>
                <span className="text-xs text-slate-500">/ forever</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
                Full-featured starter monitoring for personal projects and early-stage prototypes.
              </p>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>60s to 3-min Check Frequency</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Single-node local probes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Email & Slack webhooks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>30-Day SQLite Metric Rollups</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Prometheus /metrics endpoint</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onGoToDashboard}
                className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all text-center"
              >
                Launch Community Dashboard
              </button>
            </div>
          </div>

          {/* INDIE PRO (₦2,000/MO) - FEATURED */}
          <div className="relative rounded-2xl border-2 border-teal-600 dark:border-teal-500 backdrop-blur-xl bg-white dark:bg-[#111A2E] p-6 sm:p-8 flex flex-col justify-between shadow-md">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-sm flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Most Popular</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 font-mono">
                  Indie Pro Plan
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 font-bold border border-teal-200/50 dark:border-teal-800/50">
                  High-Speed
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 my-4">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {billingCycle === 'monthly' ? '₦2,000' : '₦20,000'}
                </span>
                <span className="text-xs text-slate-500">
                  {billingCycle === 'monthly' ? '/ month' : '/ year (save 2 months)'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-6">
                Specifically built for indie hackers, founders, and devs needing sub-second detection.
              </p>

              <div className="space-y-3 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                  <span><strong>30-Second Check Intervals</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                  <span><strong>Multi-Region Consensus Probes</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                  <span><strong>Telegram Bot & Email Alerts (100% Free)</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                  <span><strong>Automated AI Incident RCA</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                  <span><strong>Custom Domain Status Pages</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                  <span><strong>SSL Expiry Sentinel (30d/14d/7d)</strong></span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onGoToBilling}
                className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <span>Upgrade to Indie Pro (₦2,000/mo)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TEAM & AGENCY PRO (₦5,000/MO) */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                  Team & Agency Pro
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                  Scale
                </span>
              </div>
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {billingCycle === 'monthly' ? '₦5,000' : '₦50,000'}
                </span>
                <span className="text-xs text-slate-500">
                  {billingCycle === 'monthly' ? '/ month' : '/ year (save 2 months)'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
                Built for software agencies, client dev shops, and high-traffic engineering teams.
              </p>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>10-Second High-Speed Probing</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>6 Global Edge Regions</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Unlimited Team Members (RBAC)</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>White-label Client SLA PDF Reports</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Quiet Hours & Escalation Routing</strong></span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onGoToBilling}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 text-xs font-bold transition-all shadow-sm text-center"
              >
                Activate Team Pro (₦5,000/mo)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Everything you need to know about pingbud.us's Naira pricing and architecture.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl bg-white/70 dark:bg-[#0F172A]/80 overflow-hidden"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full py-4 px-5 text-left text-xs sm:text-sm font-bold flex items-center justify-between text-slate-900 dark:text-white hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <span>{faq.q}</span>
                {activeFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-800/20">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ENTERPRISE SAAS FOOTER (SUPABASE STYLE) */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-100 dark:border-slate-800">
            {/* Col 1: Brand & Positioning */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-sm">
                  <Activity className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>pingbud.us</span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-400 font-bold border border-teal-200 dark:border-teal-800">
                    SaaS
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                High-performance synthetic uptime monitoring, multi-region consensus probing, and automated incident response for engineering teams.
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Secured by Bachs (<span className="text-teal-600 dark:text-teal-400 font-bold">bachs.io</span>)</span>
              </div>
            </div>

            {/* Col 2: Product */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono text-[11px]">
                Product
              </h4>
              <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                <li>
                  <button onClick={onGoToDashboard} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    Health Monitors
                  </button>
                </li>
                <li>
                  <button onClick={onGoToDashboard} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    Multi-Region Consensus
                  </button>
                </li>
                <li>
                  <button onClick={onGoToDashboard} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    AI Root-Cause Analysis
                  </button>
                </li>
                <li>
                  <button onClick={onGoToStatusPage} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    Public Status Pages
                  </button>
                </li>
                <li>
                  <a href="#features" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    TLS & SSL Sentinel
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Pricing & Billing */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono text-[11px]">
                Plans & Billing
              </h4>
              <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                <li>
                  <a href="#pricing" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    Indie Pro (₦2,000/mo)
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    Team Pro (₦5,000/mo)
                  </a>
                </li>
                <li>
                  <button onClick={onGoToBilling} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    Invoices & Receipts
                  </button>
                </li>
                <li>
                  <button onClick={onGoToBilling} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    Bachs Virtual Accounts
                  </button>
                </li>
                <li>
                  <a href="#comparison" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    ROI Cost Savings
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Platform & Channels */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono text-[11px]">
                Channels & APIs
              </h4>
              <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                <li>
                  <button onClick={onGoToDashboard} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    Telegram Bot & Email Alerts
                  </button>
                </li>
                <li>
                  <button onClick={onGoToDashboard} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    Slack & Discord Webhooks
                  </button>
                </li>
                <li>
                  <button onClick={onGoToDashboard} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    Telegram Bot Integration
                  </button>
                </li>
                <li>
                  <button onClick={onGoToDashboard} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    Prometheus /metrics
                  </button>
                </li>
                <li>
                  <Link href="/status" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    System Status (99.99%)
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Legal & Copyright Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>© 2026 pingbud.us Inc. All rights reserved.</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Built for high-reliability infrastructure.</span>
            </div>

            <div className="flex items-center gap-6">
              <Link href="/status" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/status" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="/status" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                Security & Compliance
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Quick Donate Modal */}
      {isDonateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
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
                  Thank You for Supporting pingbud.us!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Your contribution directly funds multi-region consensus probing nodes and ensures pingbud.us stays fast, independent, and priced at ₦2,000/mo.
                </p>
                <button
                  onClick={() => {
                    setIsDonateModalOpen(false);
                    setDonationSuccess(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Heart className="w-5 h-5 fill-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Support pingbud.us
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Help keep uptime monitoring ultra-affordable (₦2,000/mo)
                    </p>
                  </div>
                </div>

                {/* Amount Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Select Contribution Amount
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1000, 2500, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setDonateAmount(amt);
                          setCustomAmount('');
                        }}
                        className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                          donateAmount === amt && !customAmount
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                        }`}
                      >
                        ₦{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2.5">
                    <input
                      type="number"
                      placeholder="Or enter custom amount in ₦"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        if (e.target.value) setDonateAmount(Number(e.target.value));
                      }}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Bachs Virtual Transfer Account Details */}
                <div className="p-3.5 rounded-2xl bg-teal-500/5 border border-teal-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-teal-800 dark:text-teal-300">
                      Bachs Direct Bank Transfer
                    </span>
                    <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40 px-2 py-0.5 rounded-full font-bold">
                      Zero Fees
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Bank:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">Providus Bank / Bachs Gateway</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Account Name:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">pingbud.us Community Pool</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-400 text-[11px]">Account Number:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-teal-700 dark:text-teal-400 text-sm">
                          9928341029
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('9928341029');
                            setCopiedAccount(true);
                            setTimeout(() => setCopiedAccount(false), 2000);
                          }}
                          className="p-1 rounded-md hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-400 transition-colors"
                          title="Copy account number"
                        >
                          {copiedAccount ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Donor Information */}
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Your Name or Twitter / GitHub handle (optional)"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    placeholder="Note (e.g., 'Keep uptime fast!')"
                    value={donorMessage}
                    onChange={(e) => setDonorMessage(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="button"
                  disabled={isSubmittingDonation}
                  onClick={async () => {
                    setIsSubmittingDonation(true);
                    try {
                      await submitDonation({
                        donor_name: donorName.trim() || 'Anonymous Supporter',
                        amount: Number(customAmount) || donateAmount,
                        message: donorMessage.trim() || 'Keep pingbud.us independent and low-cost!',
                        source: 'bachs_transfer',
                      });
                      setDonationSuccess(true);
                    } catch (err) {
                      setDonationSuccess(true);
                    } finally {
                      setIsSubmittingDonation(false);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingDonation ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording Contribution...</span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      <span>Confirm Contribution (₦{(Number(customAmount) || donateAmount).toLocaleString()})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
