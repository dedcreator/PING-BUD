import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scheduled Maintenance Windows',
  description:
    'Upcoming and past scheduled maintenance windows across monitored services on Sentiro IT Sentinel.',
  alternates: {
    canonical: 'https://sentiro.xyz/maintenance',
  },
};

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
