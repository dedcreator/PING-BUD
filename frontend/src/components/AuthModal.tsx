'use client';

import React, { useState, useEffect } from 'react';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}
import {
  X,
  Lock,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Crown,
  Wrench,
  Eye,
  LogOut,
  ArrowRight,
  Mail,
  Zap,
  KeyRound,
} from 'lucide-react';
import { User as UserType, UserRole } from '../types';
import {
  loginUser,
  registerUser,
  switchUserRole,
  loginWithGoogle,
  switchDemoTierUser,
  forgotPassword,
  resetPassword,
} from '../lib/api';
import SentiroLogo from './SentiroLogo';

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

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  activeRole: UserRole;
  onRoleChanged: (newRole: UserRole) => void;
  onUserLoggedIn: (user: UserType, role: UserRole) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  activeRole,
  onRoleChanged,
  onUserLoggedIn,
}: AuthModalProps) {
  const [tab, setTab] = useState<'switch_role' | 'login' | 'register' | 'forgot'>('switch_role');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('editor');

  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const [googleEmail, setGoogleEmail] = useState('');
  const [showGoogleCustomInput, setShowGoogleCustomInput] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (typeof window === 'undefined' || !isOpen || !googleClientId) return;

    const existingScript = document.getElementById('google-gsi-script');
    const initGsi = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: { credential?: string }) => {
            if (!response?.credential) return;
            try {
              setLoading(true);
              setMsg(null);
              const res = await loginWithGoogle({ credential: response.credential });
              if (res.user && res.role) {
                onUserLoggedIn(res.user, res.role);
                setMsg({ text: `Signed in as ${res.user.email} with Google!`, error: false });
                setTimeout(() => onClose(), 1000);
              }
            } catch (err: unknown) {
              setMsg({ text: err instanceof Error ? err.message : 'Google authentication failed', error: true });
            } finally {
              setLoading(false);
            }
          },
        });

        const btnEl = document.getElementById('google-gsi-button');
        if (btnEl) {
          window.google.accounts.id.renderButton(btnEl, {
            theme: 'outline',
            size: 'large',
            width: 360,
            text: 'continue_with',
            shape: 'rectangular',
          });
        }
      }
    };

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    } else {
      initGsi();
    }
  }, [isOpen, tab, googleClientId]);

  if (!isOpen) return null;

  const handleRoleSelect = async (role: UserRole) => {
    try {
      setLoading(true);
      setMsg(null);
      await switchUserRole(role);
      onRoleChanged(role);
      setMsg({ text: `Switched active RBAC role to ${role.toUpperCase()}`, error: false });
    } catch {
      setMsg({ text: 'Failed to switch role', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchTier = async (tier: 'free' | 'indie' | 'team') => {
    try {
      setLoading(true);
      setMsg(null);
      const res = await switchDemoTierUser(tier);
      onUserLoggedIn(res.user, res.role);
      const tierLabel =
        tier === 'free'
          ? 'Starter Free (₦0)'
          : tier === 'indie'
          ? 'Indie Pro (₦2,000/mo)'
          : 'Team Pro (₦5,000/mo)';
      setMsg({ text: `Switched to ${tierLabel} account: ${res.user.email}`, error: false });
      setTimeout(() => {
        onClose();
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 750);
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : 'Failed to switch user', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pulsewatch_token');
      localStorage.removeItem('pulsewatch_demo_role');
      window.location.href = '/';
    }
  };

  const handleGoogleLogin = async (overrideEmail?: string) => {
    const targetEmail = overrideEmail || (showGoogleCustomInput && googleEmail.trim() ? googleEmail.trim() : 'alex.dev@gmail.com');
    try {
      setLoading(true);
      setMsg(null);
      const name = targetEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const res = await loginWithGoogle({
        email: targetEmail,
        name: name || 'Google Developer',
      });
      onUserLoggedIn(res.user, res.role);
      setMsg({ text: `Signed in as ${res.user.email} with Google!`, error: false });
      setTimeout(() => onClose(), 1100);
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : 'Google authentication failed', error: true });
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
      onUserLoggedIn(res.user, res.role);
      setMsg({ text: `Welcome back, ${res.user.username}! Signed in as ${res.role.toUpperCase()}.`, error: false });
      setTimeout(() => onClose(), 1200);
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : 'Invalid credentials', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMsg(null);
      const res = await registerUser(regEmail, regUsername, regPassword, regRole);
      onUserLoggedIn(res.user, regRole);
      setMsg({ text: `Account created! Role: ${regRole.toUpperCase()}.`, error: false });
      setTimeout(() => onClose(), 1200);
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : 'Failed to register', error: true });
    } finally {
      setLoading(false);
    }
  };

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
        text: res.message || 'Password reset token sent via Resend!',
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
        text: res.message || 'Password updated successfully!',
        error: false,
      });
      setTimeout(() => {
        setTab('login');
        setResetSent(false);
        setForgotEmail('');
        setResetToken('');
        setNewPassword('');
      }, 1400);
    } catch (err: unknown) {
      setMsg({
        text: err instanceof Error ? err.message : 'Password reset failed.',
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <SentiroLogo size="sm" showText={false} />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Sentiro Team Auth & RBAC
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Google OAuth, Granular Roles & Access Control
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Identity Chip */}
        <div className="my-4 p-3 rounded-xl bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
              {currentUser?.first_name?.[0] || currentUser?.username?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {currentUser?.email || currentUser?.username || 'Current Session'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Role: <span className="font-bold text-teal-600 dark:text-teal-400">{activeRole.toUpperCase()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 uppercase">
              Active
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-500 transition-colors flex items-center gap-1 text-[11px]"
              title="Log Out (Sign Out)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 mb-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium">
          <button
            onClick={() => setTab('switch_role')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              tab === 'switch_role'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Switch User / Tiers
          </button>
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              tab === 'register'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Message Alert */}
        {msg && (
          <div
            className={`mb-4 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
              msg.error
                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {msg.error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* GOOGLE SIGN IN BAR (VISIBLE FOR SIGN IN & SIGN UP) */}
        {(tab === 'login' || tab === 'register') && (
          <div className="space-y-3 mb-4">
            {googleClientId ? (
              <div className="space-y-2">
                <div id="google-gsi-button" className="flex justify-center w-full min-h-[44px]" />
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin()}
                    className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Use 1-click dev Google sign-in instead
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGoogleCustomInput(!showGoogleCustomInput)}
                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                  >
                    <span>{showGoogleCustomInput ? 'Hide manual email' : 'Manual Gmail'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleGoogleLogin()}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16223B] hover:bg-slate-50 dark:hover:bg-[#1E2D4A] text-slate-800 dark:text-slate-100 text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1 text-teal-600" />}
                </button>

                {/* Optional Custom Google Email toggle */}
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => setShowGoogleCustomInput(!showGoogleCustomInput)}
                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                  >
                    <span>{showGoogleCustomInput ? 'Hide Google email input' : 'Sign in with a specific Google email'}</span>
                  </button>
                </div>
              </>
            )}

            {showGoogleCustomInput && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Google Workspace / Gmail Address:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="engineer@gmail.com"
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin(googleEmail)}
                    disabled={!googleEmail.includes('@') || loading}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                  >
                    Authorize
                  </button>
                </div>
              </div>
            )}

            <div className="relative flex items-center justify-center my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <span className="relative px-3 bg-white dark:bg-[#111A2E] text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                or with email
              </span>
            </div>
          </div>
        )}

        {/* TAB 1: SWITCH DEMO USER TIERS & RBAC ROLE */}
        {tab === 'switch_role' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* 3 Seeded User Accounts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  1-Click Seeded User Accounts
                </span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                  Pro Plans
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                Instantly switch active session between the 3 provisioned user accounts:
              </p>

              <div className="space-y-2">
                {/* 1. Free Account */}
                <div
                  onClick={() => handleSwitchTier('free')}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500/60 bg-slate-50/50 dark:bg-slate-900/40 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold font-mono">
                      ₦0
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
                        Free Starter User
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        free@sentiro • Viewer Role
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Community ₦0
                  </span>
                </div>

                {/* 2. Indie Pro Account (₦2,000) */}
                <div
                  onClick={() => handleSwitchTier('indie')}
                  className="p-3 rounded-xl border border-teal-200 dark:border-teal-900/60 hover:border-teal-500 bg-teal-50/30 dark:bg-teal-950/20 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                      2k
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors flex items-center gap-1.5">
                        <span>Indie Pro User</span>
                        <Zap className="w-3 h-3 text-teal-600 shrink-0" />
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        indie@sentiro • Owner Role
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold">
                    ₦2,000/mo Pro
                  </span>
                </div>

                {/* 3. Team Pro Account (₦5,000) */}
                <div
                  onClick={() => handleSwitchTier('team')}
                  className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                      5k
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                        <span>Team Pro User</span>
                        <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        team@sentiro • Owner Role
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold">
                    ₦5,000/mo Pro
                  </span>
                </div>
              </div>
            </div>

            {/* Granular RBAC Role Switcher */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block mb-2">
                Simulate Active RBAC Role
              </span>

              <div className="space-y-2">
                {/* Owner */}
                <div
                  onClick={() => handleRoleSelect('owner')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    activeRole === 'owner'
                      ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">Workspace Owner</span>
                    </div>
                    {activeRole === 'owner' && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-teal-600 text-white font-bold">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Full control: manage monitors, trigger checks, manage API keys, billing & team.
                  </p>
                </div>

                {/* Editor */}
                <div
                  onClick={() => handleRoleSelect('editor')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    activeRole === 'editor'
                      ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5 text-teal-500" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">DevOps Editor</span>
                    </div>
                    {activeRole === 'editor' && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-teal-600 text-white font-bold">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Create & edit monitors, trigger manual checks, and test alert channels.
                  </p>
                </div>

                {/* Viewer */}
                <div
                  onClick={() => handleRoleSelect('viewer')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    activeRole === 'viewer'
                      ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">Observer / Viewer (Read Only)</span>
                    </div>
                    {activeRole === 'viewer' && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-teal-600 text-white font-bold">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Read-only view for stakeholders & QA. All edit, delete, and check actions disabled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SIGN IN */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email or Username
              </label>
              <input
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="indie@sentiro"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTab('forgot');
                    setMsg(null);
                  }}
                  className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
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
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                <span>Sign In to Workspace</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: SIGN UP */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="alex_dev"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Team Role
              </label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="owner">Owner (Full Admin)</option>
                <option value="editor">Editor (Monitors & Alerts)</option>
                <option value="viewer">Viewer (Read Only)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <User className="w-3.5 h-3.5" />}
                <span>Create Team Member Account</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: FORGOT / RESET PASSWORD */}
        {tab === 'forgot' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                Password Recovery
              </span>
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setMsg(null);
                }}
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
              >
                ← Back to sign in
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Enter your account email to receive a password reset token via Resend.
            </p>

            {!resetSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !forgotEmail}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  <span>Send Reset Token via Resend</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="e.g. 849204"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !newPassword || !resetToken}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>Update Password</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
