# Sentiro Documentation Wiki

Welcome to the **Sentiro** (`sentiro.xyz`) Technical Knowledge Base & Operations Wiki.

Sentiro is an ultra-lean, 24/7 IT Sentinel synthetic uptime and status monitoring platform engineered for high reliability, multi-region edge consensus, sub-30s heartbeats, and instant alerts.

---

## 📚 Wiki Contents

1. **[Pxxl.app Cloud Deployment Guide](Pxxl-Deployment.md)**
   - Deploying Next.js frontend & Django backend to `pxxl.app`.
   - Custom domain mapping for `sentiro.xyz` and `api.sentiro.xyz`.
   - Running background probe worker daemons.

2. **[Bachs Payment & Monetization Guide](Bachs-Billing-Integration.md)**
   - Complete integration with **Bachs** ([docs.bachs.io](https://docs.bachs.io)).
   - Hosted checkout sessions (`POST /v1/checkout-sessions`).
   - Nigerian Naira pricing: Indie Pro (₦2,000/mo) & Team Pro (₦5,000/mo).
   - HMAC-SHA256 webhook signature verification (`checkout.completed`).
   - Community donation funds & tax receipts.

3. **[Telegram Alert Bot Integration](Telegram-Alert-Bot.md)**
   - Official `@SentiroAlertBot` setup.
   - Zero per-message fee alerts (how to find your Telegram Chat ID).
   - Custom private bot token override for enterprise organizations.

4. **[SRE Architecture, SQLite WAL & Security](Architecture-and-Security.md)**
   - Single-node SQLite in Write-Ahead Logging mode (`< 120MB` RAM).
   - Multi-region 4-node quorum consensus engine (Lagos, London, Frankfurt, Oregon).
   - Automated AI root-cause analysis (RCA).
   - Security controls: TOTP 2FA, immutable Audit Logs, and compliance exports.
