'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/components/LandingPage';
import AuthModal from '@/components/AuthModal';
import { User, UserRole, ProPlan } from '@/types';
import { fetchCurrentUser, fetchProInfo } from '@/lib/api';

export default function RootHomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('owner');
  const [proPlan, setProPlan] = useState<ProPlan | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    fetchCurrentUser()
      .then((data) => {
        setCurrentUser(data.user);
        setActiveRole(data.active_role);
      })
      .catch(() => {});

    fetchProInfo()
      .then((data) => {
        setProPlan(data.pro_subscription);
      })
      .catch(() => {});
  }, []);

  const handleRoleChanged = (newRole: UserRole) => {
    setActiveRole(newRole);
  };

  const handleUserLoggedIn = (user: User, role: UserRole) => {
    setCurrentUser(user);
    setActiveRole(role);
    setIsAuthModalOpen(false);
    router.push('/dashboard');
  };

  return (
    <>
      <LandingPage
        onGoToDashboard={() => router.push('/dashboard')}
        onGoToPricing={() => router.push('/dashboard')}
        onGoToStatusPage={() => router.push('/status')}
        onGoToBilling={() => router.push('/dashboard')}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        currentUser={currentUser}
        proPlan={proPlan}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        activeRole={activeRole}
        onRoleChanged={handleRoleChanged}
        onUserLoggedIn={handleUserLoggedIn}
      />
    </>
  );
}
