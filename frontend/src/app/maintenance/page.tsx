'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MaintenancePage from '@/components/MaintenancePage';
import { Monitor, UserRole } from '@/types';
import { fetchOverview, fetchCurrentUser } from '@/lib/api';
import { Activity } from 'lucide-react';

export default function StandaloneMaintenancePage() {
  const router = useRouter();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('owner');

  useEffect(() => {
    Promise.all([
      fetchOverview('production').catch(() => ({ monitors: [] })),
      fetchCurrentUser().catch(() => ({ active_role: 'owner' })),
    ])
      .then(([overviewData, userData]) => {
        setMonitors(overviewData.monitors || []);
        if (userData && (userData as { active_role?: UserRole }).active_role) {
          setUserRole((userData as { active_role: UserRole }).active_role);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                <span>sentiro</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-100 text-teal-700 font-bold border border-slate-200">
                  Maintenance
                </span>
              </span>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <MaintenancePage
          onBackToDashboard={() => router.push('/dashboard')}
          monitors={monitors}
          userRole={userRole}
        />
      </main>
    </div>
  );
}
