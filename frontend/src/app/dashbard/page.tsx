'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashbardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300 font-mono text-sm">
      <span>Redirecting to Dashboard...</span>
    </div>
  );
}
