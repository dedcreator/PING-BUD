import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Incident History & Root Cause Analysis',
  description:
    'Comprehensive incident logs, multi-region consensus telemetry, and post-mortem analysis on Sentiro IT Sentinel.',
  alternates: {
    canonical: 'https://sentiro.xyz/incidents',
  },
};

export default function IncidentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
