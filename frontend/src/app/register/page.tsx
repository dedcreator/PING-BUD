'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Zap,
  Crown,
} from 'lucide-react';
import { registerUser, loginWithGoogle } from '@/lib/api';
import { UserRole } from '@/types';
import SentiroLogo from '@/components/SentiroLogo';

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

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('owner');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMsg(null);
      const res = await registerUser(email, username, password, role);
      setMsg({
        text: `Account created for ${res.user.username}! Redirecting to dashboard...`,
        error: false,
      });
      setTimeout(() => {
        router.push('/dashboard');
      }, 700);
    } catch (err: unknown) {
      setMsg({
        text: err instanceof Error ? err.message : 'Registration failed.',
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      setMsg(null);
      const res = await loginWithGoogle({
        email: 'dev.signup@gmail.com',
        name: 'Developer Account',
      });
      setMsg({
        text: `Signed up with Google as ${res.user.email}! Redirecting...`,
        error: false,
      });
      setTimeout(() => {
        router.push('/dashboard');
      }, 700);
    } catch (err: unknown) {
      setMsg({
        text: err instanceof Error ? err.message : 'Google authentication failed.',
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 group transition-transform hover:scale-105"
        >
          <SentiroLogo size="lg" subtitle="The IT Sentinel" />
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Create your sentiro account
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#111A2E] py-8 px-6 sm:px-8 shadow-xl border border-slate-200 dark:border-slate-800 rounded-2xl">
          {msg && (
            <div
              className={`mb-5 p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                msg.error
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {msg.error ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{msg.text}</span>
            </div>
          )}

          {/* Google Sign Up */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16223B] hover:bg-slate-50 dark:hover:bg-[#1E2D4A] text-slate-800 dark:text-slate-100 text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <GoogleIcon />
              <span>Sign up with Google</span>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1 text-teal-600" />}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white dark:bg-[#111A2E] text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                Or register with email
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alex_dev"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Initial Workspace Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="owner">Workspace Owner (Full Admin &amp; Billing)</option>
                <option value="editor">DevOps Editor (Monitors, Probes & Alerts)</option>
                <option value="viewer">Viewer (Read-only Observer)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                <span>Create Workspace Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Quick Perks Summary */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Includes ₦0 Starter Free Tier or 14-day Indie Pro trial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Nigerian Naira payments (₦2,000 &amp; ₦5,000 Instant Transfer &amp; Cards)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
