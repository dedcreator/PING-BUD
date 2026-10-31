# 🚀 Deploying PulseWatch Backend on Render

Deploy the **PulseWatch (Sentiro)** Django REST API to [Render](https://render.com) for free with automated SSL, continuous deployment, and WhiteNoise static serving.

---

## ⚡ Option 1: Instant 1-Click Blueprint (Recommended)

1. Fork or push this repository to your GitHub account: **`https://github.com/dedcreator/PING-BUD`**.
2. Log in to your [Render Dashboard](https://dashboard.render.com/).
3. Click the blue **"New +"** button in the top right and select **"Blueprint"**.
4. Connect your GitHub repository (`PING-BUD`).
5. Render will automatically detect [`render.yaml`](file:///Users/apple/Desktop/Pulsewatch/render.yaml) and configure:
   - **Service Name**: `pulsewatch-backend`
   - **Environment**: Python 3.11.9
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn pulsewatch.wsgi:application --bind 0.0.0.0:$PORT --workers 2`
   - **Health Check**: `/api/overview/`
6. Click **"Apply"** — Render will build and deploy your API in ~2 minutes!

---

## 🛠️ Option 2: Manual Web Service Setup

If you prefer to configure the Web Service manually:

1. In Render Dashboard, click **"New +"** ➔ **"Web Service"**.
2. Connect your GitHub repository (`dedcreator/PING-BUD`).
3. Fill in the following fields:
   - **Name**: `pulsewatch-backend`
   - **Region**: Oregon or Frankfurt
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn pulsewatch.wsgi:application --bind 0.0.0.0:$PORT --workers 2`
   - **Instance Type**: `Free`
4. Under **Environment Variables**, add:
   - `PYTHON_VERSION` = `3.11.9`
   - `DJANGO_SECRET_KEY` = *(click Generate)*
   - `DEBUG` = `False`
   - `ALLOWED_HOSTS` = `*`
   - `CSRF_TRUSTED_ORIGINS` = `https://*.onrender.com,https://sentiro.xyz`
   - `FEEDBACK_RECEIVE_EMAIL` = `your_email@domain.com` *(Email address where user Feature Requests & Bug Reports will be delivered)*
   - `RESEND_API_KEY` = `re_...` *(Your Resend API Key from resend.com for email delivery)*
   - `RESEND_FROM_EMAIL` = `Sentiro Alerts <alerts@sentiro.xyz>`
   - `BACHS_API_KEY` = `sk_live_...` *(Your Bachs API Secret from docs.bachs.io for billing)*
   - `BACHS_WEBHOOK_SECRET` = `whsec_...` *(Your Bachs Webhook Secret)*
   - `TELEGRAM_BOT_TOKEN` = `...` *(Your Telegram bot token from @BotFather)*
5. Click **"Create Web Service"**.

---

## 💾 Database Options on Render

### Option A: Default SQLite WAL (Zero Setup)
By default, PulseWatch runs on its high-speed SQLite WAL engine.
*Note: On Render's Free tier, the filesystem is ephemeral (redeploying resets SQLite to the seeded demo data).*

### Option B: Render Free PostgreSQL (Permanent Storage)
If you want permanent data across redeploys on Render for $0:
1. In Render Dashboard, click **"New +"** ➔ **"PostgreSQL"**.
2. Name it `pulsewatch-db`, select `Free` instance.
3. Once created, copy the **Internal Database URL** (e.g. `postgres://user:pass@host/db`).
4. In your `pulsewatch-backend` Web Service, add an environment variable:
   - `DATABASE_URL` = *(paste your Postgres URL)*
5. PulseWatch will automatically detect the PostgreSQL connection string via `dj-database-url` and run migrations automatically!

---

## ⏰ Keeping Render Awake 24/7 (Preventing 15-Min Sleep)

Render's free tier spins down after 15 minutes of inactivity. For an uptime monitor:
1. Create a free account at [cron-job.org](https://cron-job.org).
2. Create a new cron job pointing to:
   ```
   https://pulsewatch-backend.onrender.com/api/overview/
   ```
3. Set the schedule to **Every 10 minutes**.
4. This ensures your Render instance stays warm and responsive 24 hours a day without sleeping!

---

## 🔗 Connecting Your Next.js Frontend

In your Next.js frontend (hosted on Vercel, Netlify, or Render):
Set the environment variable:
```ini
NEXT_PUBLIC_API_URL=https://pulsewatch-backend.onrender.com
```
Your frontend will immediately connect to your live Render backend!
