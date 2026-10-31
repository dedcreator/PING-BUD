'use client';

import React, { useState } from 'react';
import {
  X,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Crown,
  Zap,
  Globe,
  Loader2,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { Project, ProPlan, UserRole } from '../types';
import { createProject, deleteProject } from '../lib/api';
import ThreeDWorkspaceCluster from './ThreeDWorkspaceCluster';
import SentiroLogo from './SentiroLogo';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectSlug: string;
  onSelectProject: (slug: string) => void;
  onProjectsUpdated: () => void;
  proPlan?: ProPlan | null;
  activeRole: UserRole;
  onGoToBilling: () => void;
}

export default function WorkspaceModal({
  isOpen,
  onClose,
  projects = [],
  activeProjectSlug,
  onSelectProject,
  onProjectsUpdated,
  proPlan,
  activeRole,
  onGoToBilling,
}: WorkspaceModalProps) {
  const [name, setName] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const isPro = proPlan?.is_active && (proPlan?.active_tier === 'indie_pro' || proPlan?.active_tier === 'team_pro');
  const canEdit = activeRole === 'owner' || activeRole === 'editor';
  const isOwner = activeRole === 'owner';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (!isPro && projects.length >= 1) {
      setErrorMsg('Multiple workspaces is an Indie Pro (₦2,000/mo) and Team Pro (₦5,000/mo) feature. Community Free is limited to 1 workspace.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const newProj = await createProject(name.trim(), customDomain.trim());
      setSuccessMsg(`Workspace "${newProj.name}" created!`);
      setName('');
      setCustomDomain('');
      onProjectsUpdated();
      onSelectProject(newProj.slug);
      setTimeout(() => {
        setSuccessMsg('');
      }, 2500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (proj: Project) => {
    if (!isOwner) {
      setErrorMsg('Only Workspace Owner can delete workspaces.');
      return;
    }
    if (projects.length <= 1) {
      setErrorMsg('Cannot delete the primary workspace. At least one workspace is required.');
      return;
    }
    if (!window.confirm(`Delete workspace "${proj.name}" and all its monitors? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(proj.id);
      setErrorMsg('');
      await deleteProject(proj.id);
      setSuccessMsg(`Workspace "${proj.name}" removed.`);
      onProjectsUpdated();
      if (activeProjectSlug === proj.slug) {
        const remaining = projects.filter((p) => p.id !== proj.id);
        if (remaining.length > 0) {
          onSelectProject(remaining[0].slug);
        }
      }
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete workspace');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <SentiroLogo size="sm" showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Sentiro Workspaces & Multi-Tenancy
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  Pro Feature
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Isolate environments, client clusters, and staging probes
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

        {/* Alerts */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 3D Multi-Tenant Workspace Cluster */}
        <div className="mt-4">
          <ThreeDWorkspaceCluster
            projects={projects}
            activeSlug={activeProjectSlug}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Existing Workspaces List */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider font-mono">
            <span>Your Workspaces ({projects.length})</span>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-normal">
              Click to switch
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {projects.map((proj) => {
              const isActive = activeProjectSlug === proj.slug;
              return (
                <div
                  key={proj.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isActive
                      ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 ring-1 ring-teal-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                  }`}
                >
                  <div
                    onClick={() => onSelectProject(proj.slug)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {proj.name}
                      </span>
                      {isActive && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-teal-600 text-white font-bold">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                      <span>slug: {proj.slug}</span>
                      <span>•</span>
                      <span>{proj.monitors_count || 0} monitors</span>
                    </div>
                  </div>

                  {projects.length > 1 && isOwner && (
                    <button
                      onClick={() => handleDelete(proj)}
                      disabled={deletingId === proj.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete workspace"
                    >
                      {deletingId === proj.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pro Feature Gating Banner for Free Tier */}
        {!isPro && projects.length >= 1 ? (
          <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-start gap-2.5">
              <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Multi-Workspace is an Indie Pro & Team Pro Feature
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  The Community Free tier includes 1 workspace. Upgrade to Indie Pro (₦2,000/mo) to unlock up to 5 isolated workspaces with custom domains, or Team Pro (₦5,000/mo) for unlimited client clusters.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onGoToBilling();
              }}
              className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Upgrade to Indie Pro (₦2,000/mo)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Create Workspace Form (Available for Pro users or if allowed) */
          <form onSubmit={handleCreate} className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
              Create New Workspace
            </span>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Workspace Name:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Staging & QA Cluster"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Globe className="w-3 h-3 text-teal-600" />
                <span>Custom Status Domain (Optional):</span>
              </label>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="status.clientbrand.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Provisioning Workspace...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Create Workspace</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
