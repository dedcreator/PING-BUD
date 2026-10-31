import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sentiro.xyz"),
  title: {
    default: "Sentiro • 24/7 IT Sentinel | Ultra-Lean Uptime & Synthetic Monitoring",
    template: "%s | Sentiro IT Sentinel",
  },
  description:
    "Sentiro (sentiro.xyz) is the high-precision 24/7 IT Sentinel for modern engineering teams. Multi-region quorum consensus probing across Africa, Europe, US, and Asia, sub-30s synthetic HTTP/SSL/DNS heartbeats, zero false alarms, instant Telegram alerts without SMS markups, and public status pages.",
  keywords: [
    "uptime monitoring",
    "synthetic monitoring",
    "website uptime monitor",
    "API health check",
    "multi-region consensus",
    "SSL certificate expiration monitor",
    "cron job heartbeat monitoring",
    "DNS health check",
    "telegram outage alerts",
    "free telegram alert bot",
    "public status page",
    "incident management",
    "SRE devops observability",
    "Prometheus metrics exporter",
    "Pingdom alternative",
    "Better Uptime alternative",
    "UptimeRobot alternative",
    "Datadog alternative",
    "sentiro.xyz",
    "Sentiro IT Sentinel",
  ],
  authors: [{ name: "Sentiro SRE Team", url: "https://sentiro.xyz" }],
  creator: "Sentiro",
  publisher: "Sentiro",
  applicationName: "Sentiro",
  alternates: {
    canonical: "https://sentiro.xyz",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Sentiro • Your 24/7 IT Sentinel | Multi-Region Synthetic Uptime Monitoring",
    description:
      "Multi-region edge consensus, sub-30s heartbeats, zero false alarms, and instant Telegram alerts on sentiro.xyz. Eliminate carrier SMS fees.",
    url: "https://sentiro.xyz",
    siteName: "Sentiro IT Sentinel",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sentiro - 24/7 IT Sentinel Uptime & Synthetic Monitoring",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sentiro • The 24/7 IT Sentinel",
    description:
      "Ultra-lean synthetic uptime monitoring, multi-region quorum consensus, and instant Telegram alerts on sentiro.xyz.",
    images: ["/og-image.png"],
    creator: "@sentiro_sre",
  },
};

const jsonLdStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "Sentiro IT Sentinel",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All",
      "url": "https://sentiro.xyz",
      "description": "Ultra-lean 24/7 IT Sentinel synthetic uptime monitoring with multi-region edge consensus and instant Telegram alerts.",
      "offers": [
        {
          "@type": "Offer",
          "name": "Community Free Tier",
          "price": "0",
          "priceCurrency": "USD",
        },
        {
          "@type": "Offer",
          "name": "Indie Pro Tier",
          "price": "2000",
          "priceCurrency": "NGN",
        },
        {
          "@type": "Offer",
          "name": "Team Pro Tier",
          "price": "5000",
          "priceCurrency": "NGN",
        },
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "128",
      },
    },
    {
      "@type": "Organization",
      "name": "Sentiro",
      "url": "https://sentiro.xyz",
      "logo": "https://sentiro.xyz/logo-icon.svg",
      "sameAs": [
        "https://github.com/dedcreator/PING-BUD",
        "https://t.me/SentiroAlertBot",
      ],
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Sentiro?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sentiro (sentiro.xyz) is a high-performance synthetic uptime and infrastructure monitoring platform featuring multi-region edge consensus, sub-30s checks, instant Telegram alerts, and public status pages."
          }
        },
        {
          "@type": "Question",
          "name": "How does Multi-Region Consensus Probing prevent false alarms?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Before dispatching an incident alert, Sentiro corroborates suspect outages across 4 distributed geographic edge nodes in Lagos, Frankfurt, Virginia, and Mumbai. Isolated local ISP glitches never trigger false alarms."
          }
        },
        {
          "@type": "Question",
          "name": "Are Telegram alerts really free forever?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, Telegram Bot notifications carry zero carrier SMS or WhatsApp markups. You can connect your team channel using our official @SentiroAlertBot or your company bot via @BotFather."
          }
        }
      ]
    }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdStructuredData),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('sentiro_theme');
                if (t === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 transition-colors">
        {children}
      </body>
    </html>
  );
}
