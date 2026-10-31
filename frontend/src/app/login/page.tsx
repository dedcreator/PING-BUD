'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Zap,
  Crown,
} from 'lucide-react';
import SentiroLogo from '@/components/SentiroLogo';
import {
  loginUser,
  loginWithGoogle,
  switchDemoTierUser,
  forgotPassword,
  resetPassword,
} from '@/lib/api';

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

export default function LoginPage() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState('indie@sentiro');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Forgot password state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    try {
      setLoading(true);
      setMsg(null);
      const res = await forgotPassword(forgotEmail.trim());
      setResetSent(true);
      if (res.token) {
        setResetToken(res.token);
      }
      setMsg({
        text: res.message || 'Password reset instructions sent via Resend!',
        error: false,
      });
    } catch (err: unknown) {
      setMsg({
        text: err instanceof Error ? err.message : 'Failed to send reset email.',
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setMsg({ text: 'New password must be at least 6 characters.', error: true });
      return;
    }
    try {
      setLoading(true);
      setMsg(null);
      const res = await resetPassword({
        email: forgotEmail.trim(),
        token: resetToken.trim(),
        new_password: newPassword,
      });
      setMsg({
        text: res.message || 'Password updated successfully! Redirecting...',
        error: false,
      });
      setTimeout(() => {
        router.push('/dashboard');
      }, 800);
    } catch (err: unknown) {
      setMsg({
        text: err instanceof Error ? err.message : 'Password reset failed.',
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMsg(null);
      const res = await loginUser(emailOrUsername, password);
      setMsg({
        text: `Welcome back, ${res.user.username}! Redirecting to dashboard...`,
        error: false,
      });
      setTimeout(() => {
        router.push('/dashboard');
      }, 700);
    } catch (err: unknown) {
      setMsg({
        text: err instanceof Error ? err.message : 'Invalid login credentials.',
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setMsg(null);
      const res = await loginWithGoogle({
        email: 'alex.engineer@gmail.com',
        name: 'Alex Engineer',
      });
      setMsg({
        text: `Signed in with Google as ${res.user.email}! Redirecting...`,
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

  const handle1ClickSwitch = async (tier: 'free' | 'indie' | 'team') => {
    try {
      setLoading(true);
      setMsg(null);
      const res = await switchDemoTierUser(tier);
      setMsg({
        text: `Signed in as ${res.user.email} (${res.plan_tier}). Redirecting...`,
        error: false,
      });
      setTimeout(() => {
        router.push('/dashboard');
      }, 700);
    } catch (err: unknown) {
      setMsg({
        text: err instanceof Error ? err.message : 'Failed to switch user.',
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
          Sign in to your Workspace
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Or{' '}
          <Link
            href="/register"
            className="font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 underline underline-offset-4"
          >
            create a new account
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

          {/* Google OAuth Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16223B] hover:bg-slate-50 dark:hover:bg-[#1E2D4A] text-slate-800 dark:text-slate-100 text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1 text-teal-600" />}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white dark:bg-[#111A2E] text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                Or with credentials
              </span>
            </div>
          </div>

          {/* Email/Password or Forgot Password Form */}
          {isForgotMode ? (
            <form onSubmit={resetSent ? handleResetPassword : handleForgotPassword} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                  {resetSent ? 'Enter New Password' : 'Reset Password via Resend'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(false);
                    setResetSent(false);
                    setMsg(null);
                  }}
                  className="text-xs text-teal-600 hover:underline font-semibold"
                >
                  Back to Sign In
                </button>
              </div>

              {!resetSent ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    We will dispatch a secure reset token via Resend email service.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Reset Token
                    </label>
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Paste token from Resend email"
                      className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{resetSent ? 'Update Password & Sign In' : 'Send Reset Link via Resend'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email or Username
                </label>
                <input
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="indie@sentiro"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setForgotEmail(emailOrUsername.includes('@') ? emailOrUsername : '');
                      setMsg(null);
                    }}
                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* 1-Click Fast Switch Chips */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2.5">
              1-Click Demo Accounts
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handle1ClickSwitch('free')}
                disabled={loading}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 text-left text-xs transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-900/50"
              >
                <div className="font-bold text-[11px] text-slate-900 dark:text-white">Free User</div>
                <div className="text-[9px] text-slate-400 font-mono">₦0 Community</div>
              </button>
              <button
                type="button"
                onClick={() => handle1ClickSwitch('indie')}
                disabled={loading}
                className="p-2 rounded-xl border border-teal-200 dark:border-teal-900 hover:border-teal-500 text-left text-xs transition-all cursor-pointer bg-teal-50/40 dark:bg-teal-950/40"
              >
                <div className="font-bold text-[11px] text-teal-700 dark:text-teal-300 flex items-center gap-1">
                  <span>Indie Pro</span>
                  <Zap className="w-2.5 h-2.5" />
                </div>
                <div className="text-[9px] text-teal-600 dark:text-teal-400 font-mono">₦2,000/mo</div>
              </button>
              <button
                type="button"
                onClick={() => handle1ClickSwitch('team')}
                disabled={loading}
                className="p-2 rounded-xl border border-indigo-200 dark:border-indigo-900 hover:border-indigo-500 text-left text-xs transition-all cursor-pointer bg-indigo-50/40 dark:bg-indigo-950/40"
              >
                <div className="font-bold text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                  <span>Team Pro</span>
                  <Crown className="w-2.5 h-2.5 text-amber-500" />
                </div>
                <div className="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono">₦5,000/mo</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
