# PulseWatch — High-Class SaaS Feature Matrix & Architecture Guide

> **Version 1.1 (Enterprise SaaS Edition) | Open Source (MIT) | October 2026**  
> *Self-Hostable Uptime & Incident Monitoring That Costs Almost Nothing to Run.*

---

## 1. Executive Summary & Design Principles

PulseWatch delivers a modern, high-class alternative to legacy status monitors (UptimeRobot, BetterStack, Pingdom, Datadog Synthetics) while adhering to three uncompromised engineering pillars:

1. **Ultra-Cheap Operational Footprint**:
   - Single-process architecture backed by **SQLite in WAL mode** (`PRAGMA journal_mode=WAL;`).
   - Runs comfortably on a **1 vCPU / 512 MB RAM** VPS ($2.50–$4/mo) or free cloud tier, consuming under **120 MB RAM** with lock-free readers, avoiding costly multi-node Postgres or managed time-series databases.
2. **True Open Source (MIT License)**:
   - Zero vendor lock-in. 100% self-hostable with a single Docker command or local Django process.
3. **Consensus-Driven Precision & High Reliability**:
   - Multi-check retries with jitter and cross-region consensus before triggering alerts to eradicate false alarms.

---

## 2. Authentication, Authorization & Team Management (RBAC)

PulseWatch features enterprise-grade Role-Based Access Control (RBAC) to support agencies, indie hackers, and distributed engineering teams:

| Role | Access Level | Description |
| :--- | :---: | :--- |
| **👑 Workspace Owner** | **Full Admin** | Complete workspace ownership: manage billing/Naira subscriptions, create/revoke scoped API keys, invite team members, delete projects/monitors, manage audit logs. |
| **🛠️ DevOps Editor** | **Read & Write** | Create, edit, pause, and resume health monitors; schedule maintenance windows; test alert channels; update status page announcements. |
| **👁️ Observer / Viewer** | **Read Only** | Inspect dashboards, timeseries metrics, incident logs, and public status pages. All destructive, creation, or probe execution actions are strictly disabled with HTTP 403 enforcement. |

### Security & Access Control Surface
- **Session & API Token Authentication**: Token-based REST API (`Authorization: Token <key>`) alongside HttpOnly Lax session cookies.
- **Two-Factor Authentication (TOTP)**: RFC 6238 time-based one-time password security for sensitive account actions.
- **Scoped Developer API Keys**:
  - `read`: Query monitor status, latency percentiles, and incident history.
  - `write`: Register new monitors, trigger immediate on-demand checks, update configs.
  - `admin`: Full team management, webhook rotation, and project settings.
- **SSRF Protection Engine**: Blocks target checks against private subnet ranges (`127.0.0.0/8`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254`) unless explicitly allowlisted by an admin.

---

## 3. High-Class SaaS Tiering & Monetization Model (Nigerian Naira: ₦2,000 & ₦5,000)

To overcome the crippling foreign exchange barrier of US Dollar monitoring tools ($35 to $80/mo = ₦55,000–₦125,000/mo), PulseWatch introduces native **Nigerian Naira (NGN / ₦)** pricing:

```
+---------------------------------------------------------------------------------------------------+
|                                         PULSEWATCH TIERS                                          |
+---------------------------------------------------------------------------------------------------+
| Feature                      | Community (₦0/mo)     | Indie Pro (₦2,000/mo)  | Team Pro (₦5,000/mo)      |
+------------------------------+-----------------------+------------------------+---------------------------+
| Target Audience              | Self-hosters & Devs   | Indie Hackers & Startups| Agencies & Cloud Teams   |
| Annual Equivalent (20% Off)  | ₦0 / forever          | ₦20,000 / year         | ₦50,000 / year            |
| Check Intervals              | 60s to 3 min          | ⚡ 30 Seconds           | 🚀 10 Seconds             |
| Multi-Region Global Probes   | Single Node (Local)   | 🌍 Lagos, US-East, EU  | 🌐 6 Edge Regions (Global)|
| Automated AI Incident RCA    | Optional (BYO Key)    | ✅ Unlimited AI RCA     | ✅ Unlimited AI RCA        |
| SMS & WhatsApp Alerts        | Bring Your Twilio     | ✅ Included (Termii)    | ✅ Included + Voice       |
| Custom Domain Status Page    | status.pulsewatch.app | ✅ status.yourbrand.com| ✅ Multiple Custom Domains|
| Historical Metric Retention  | 30 Days (Rollups)     | 📈 1 Year (365d)       | 🏆 Multi-Year Retention   |
| Team Members (RBAC)          | 1 Admin               | Up to 5 Team Seats     | 👥 Unlimited Seats (RBAC) |
| Maintenance Windows          | Manual Toggle         | ✅ Scheduled Windows   | ✅ Recurring & Automated  |
| Client SLA Reports           | JSON / CSV Export     | ✅ Standard PDF Receipts| ✅ Custom White-labeled   |
| Prometheus /metrics Endpoint | ✅ Included           | ✅ Included            | ✅ Grafana Direct Connect |
| Support Channel              | GitHub Community      | Priority Discord       | 24/7 Dedicated Slack/Tel  |
+---------------------------------------------------------------------------------------------------+
```

---

## 4. Modern SaaS Application Views

PulseWatch is structured as a full-featured SaaS web application with dedicated, responsive views:

1. **Public Marketing Landing Page (`/` / `landing`)**:
   - High-converting hero section with instant CTAs ("Launch Dashboard", "Naira Pricing", "Public Status Demo").
   - Live interactive monitor card simulation with real-time ping animation, 60-bucket uptime bar, and AI RCA diagnostic snippet.
   - ROI Savings comparison matrix: **₦2,000/mo vs $35/mo (~₦55,000/mo)** legacy SaaS — saving over **96%**.
   - Feature showcase highlighting sub-30s intervals, multi-region consensus, SMS via Termii, and sub-120MB SQLite WAL engine.
   - Pricing cards, interactive FAQ accordion, and transparent footer links.

2. **Operational Dashboard (`dashboard`)**:
   - Real-time status summary strip (overall 24h uptime %, avg latency ms, active incidents, total monitors).
   - Down-first prioritized health probes list with 60-bucket uptime bars, latency sparklines, and TLS expiry countdowns.
   - Instant actions: on-demand probe trigger, pause/resume, and drill-down detail modal with probe history.
   - Quick search filter and keyboard shortcuts (`N` for New Monitor, `⌘K` for Command Palette).

3. **Billing, Subscriptions & Invoices Page (`bills`)**:
   - Active subscription status card (Current tier, next renewal date, active status badge).
   - 1-click plan switcher between **Community (₦0)**, **Indie Pro (₦2,000/mo)**, and **Team Pro (₦5,000/mo)**.
   - Resource quotas & utilization widgets (monitors used, 30s checks, team seats, Termii SMS credits remaining).
   - Saved payment method card (Paystack / Flutterwave card on file, Mastercard ending in `4242`).
   - Complete invoice history table (`INV-2026-9403`, etc.) with one-click printable **Tax Receipt** generation.

4. **Workspace Settings & Team RBAC Page (`settings`)**:
   - **General**: Workspace name, slug, contact notification email, default alert timezone (WAT / UTC).
   - **Team & Permissions (RBAC)**: Team member list (`admin@pulsewatch.dev` Owner, `devops@pulsewatch.dev` Editor, `observer@pulsewatch.dev` Viewer), invite member form, interactive live role switcher.
   - **Alert Routing & Quiet Hours**: Quiet hours scheduler (e.g. 23:00 to 07:00), escalation delay slider before SMS/WhatsApp phone alert.
   - **Developer & API Keys**: Scoped API key generator (`read`, `write`, `admin`), Prometheus `/metrics` link.
   - **Storage & SQLite WAL Engine**: Data retention configuration (30-day raw checks, 12-month rollups), manual checkpointing (`VACUUM`).

5. **Dedicated Pricing Page (`pro-pricing`)**:
   - Deep comparison of Nigerian Naira plans (₦2,000 & ₦5,000) with monthly/yearly billing switches.
   - Competitor cost analysis table showing over ₦600,000/year savings.
   - Open-source coffee fund & supporter wall with Naira tip presets (₦1,000, ₦2,000, ₦5,000, ₦10,000).

6. **Branded Public Status Page (`status-page`)**:
   - Public-facing availability dashboard for stakeholders and end-users with live incident feeds and uptime history.

---

## 5. Comprehensive Monitor Types & Checking Engine

PulseWatch supports seven dedicated probe types out of the box:

1. **HTTP / HTTPS Endpoint**:
   - Custom HTTP method (`GET`, `POST`, `HEAD`, `PUT`, `PATCH`, `DELETE`).
   - Expected status code matcher (e.g. `200`, `201`, or `2xx/3xx`).
   - Custom request headers (JSON) and custom request payload body.
2. **Keyword Presence / Absence**:
   - Body response string validator (`contains` or `not_contains`) with regex support.
3. **ICMP Ping**:
   - Real socket ping measuring round-trip time (RTT) and packet availability.
4. **TCP / UDP Port Socket Check**:
   - Direct socket handshake on arbitrary ports (e.g. Postgres `:5432`, Redis `:6379`, MySQL `:3306`, SSH `:22`).
5. **TLS / SSL Certificate & Expiry Validity**:
   - Proactive warnings at 30, 14, 7, and 1 days before expiration with certificate chain validation and issuer tracking.
6. **DNS Record Verification**:
   - Dynamic validation of `A`, `AAAA`, `CNAME`, `MX`, and `TXT` records against an expected resolved address.
7. **Cron / Scheduled Job Heartbeat (Dead-Man's Switch)**:
   - External cron jobs ping an ingest token: `curl -fsS https://pulsewatch.app/hb/<token>`.
   - If PulseWatch misses a scheduled beat beyond a configurable grace window, an incident alert triggers immediately.

---

## 6. Alerting, Routing & Escalation Intelligence

- **Supported Channels**:
  - Email (SMTP with retry outbox)
  - Slack (Incoming Webhooks & Block Kit interactive notifications)
  - Discord (Rich Embed Webhooks)
  - Telegram (Direct Bot API)
  - Microsoft Teams (Adaptive Card webhooks)
  - Generic Webhook (HMAC-SHA256 signed payloads)
  - SMS & WhatsApp (via Termii Africa & Twilio)
- **Escalation Policies**:
  - Automatically page Primary Channel (Slack). If unresolved after *X* minutes, escalate to Secondary Channel (Urgent SMS / PagerDuty).
- **Quiet Hours & Alert Routing**:
  - Suppress non-critical notifications during sleep hours (e.g. 23:00–07:00).
- **Outbox Pattern with Exponential Backoff**:
  - Guarantees notification delivery through transient network failures without duplicating alert storms.

---

## 7. Developer Surface, Metrics & Integrations

- **Prometheus `/metrics` Endpoint**:
  - Standard Prometheus format reporting `pulsewatch_monitor_status`, `pulsewatch_monitor_uptime_24h_percent`, and `pulsewatch_monitor_latency_ms`. Directly scrapable by Prometheus and Grafana.
- **Dynamic Embeddable SVG Badges**:
  - Embed live uptime badges in GitHub READMEs and landing pages: `GET /badge/<monitor_id>.svg`.
- **Data Export & Post-Mortems**:
  - One-click export of incidents and downtime logs to downloadable **CSV** and **JSON** formats.
