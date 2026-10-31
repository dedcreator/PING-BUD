import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live System Status & Operational Telemetry',
  description:
    'Real-time operational status, active incidents, and 90-day SLA uptime metrics for Sentiro and monitored multi-region edge infrastructure.',
  alternates: {
    canonical: 'https://sentiro.xyz/status',
  },
  openGraph: {
    title: 'Live System Status | Sentiro IT Sentinel',
    description:
      'Real-time uptime status, multi-region latency, and incident timeline on sentiro.xyz.',
    url: 'https://sentiro.xyz/status',
    siteName: 'Sentiro IT Sentinel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live System Status | Sentiro IT Sentinel',
    description: 'Real-time operational health and 90-day SLA uptime.',
  },
};

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
