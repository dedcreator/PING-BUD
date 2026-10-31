# Deploying Sentiro on Pxxl (`pxxl.app`)

This guide provides end-to-end instructions for deploying **Sentiro** (`sentiro.xyz`) to [**Pxxl** (`pxxl.app`)](https://pxxl.app).

---

## Architecture on Pxxl
Sentiro is deployed on Pxxl as two linked micro-services (or via Docker):
1. **Backend Service (`backend/`)**: Django 5 REST API + SQLite WAL / PostgreSQL + Gunicorn + Background Probe Worker.
2. **Frontend Service (`frontend/`)**: Next.js 16 (App Router + Turbopack) web interface with dark mode and real-time SRE metrics.

---

## Deployment Option A: Two Native Services on Pxxl (Recommended)

### 1. Deploy the Django Backend Service
1. Log in to [pxxl.app](https://pxxl.app) and click **New Project** → **Deploy from GitHub**.
2. Select your repository (`Sentiro` or `Pulsewatch`).
3. Set the configuration:
   - **Service Name**: `sentiro-api`
   - **Root Directory**: `backend`
   - **Framework / Runtime**: `Python`
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `gunicorn pulsewatch.wsgi:application --bind 0.0.0.0:$PORT`
4. Set **Environment Variables** in the Pxxl dashboard:
   ```ini
   DJANGO_SECRET_KEY=generate_a_long_random_secret_key_here
   DEBUG=False
   ALLOWED_HOSTS=*
   CSRF_TRUSTED_ORIGINS=https://sentiro.xyz,https://*.sentiro.xyz,https://*.pxxl.app,https://*.pxxl.pro
   
   # Bachs Billing Integration (docs.bachs.io)
   BACHS_API_KEY=sk_live_your_bachs_api_key
   BACHS_WEBHOOK_SECRET=whsec_your_bachs_webhook_secret
   BACHS_BASE_URL=https://api.bachs.io
   
   # Telegram Incident Alerts (@SentiroAlertBot)
   TELEGRAM_BOT_TOKEN=8123456789:AA...your_bot_token_from_botfather
   
   # Resend Email Delivery
   RESEND_API_KEY=re_your_resend_api_key
   RESEND_FROM_EMAIL=alerts@sentiro.xyz
   ```
5. Click **Deploy**. Pxxl will automatically install dependencies, run migrations, collect static files, and provision your live backend API URL (e.g., `https://sentiro-api.pxxl.pro`).

---

### 2. Deploy the Next.js Frontend Service
1. In your Pxxl dashboard, click **Add Service** (or **New Project**) linked to the same repository.
2. Set the configuration:
   - **Service Name**: `sentiro-web`
   - **Root Directory**: `frontend`
   - **Framework / Runtime**: `Next.js`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
3. Set **Environment Variables**:
   ```ini
   NEXT_PUBLIC_API_URL=https://sentiro-api.pxxl.pro
   ```
   *(Replace with your live backend domain or `https://api.sentiro.xyz` if using a custom domain).*
4. Click **Deploy**. Pxxl will build your static pages and publish your live UI at `https://sentiro-web.pxxl.pro`.

---

## 3. Custom Domain Configuration (`sentiro.xyz`)

In your Pxxl Dashboard:
1. Navigate to `sentiro-web` → **Domains** → Click **Add Domain** → Enter `sentiro.xyz` and `www.sentiro.xyz`.
2. Navigate to `sentiro-api` → **Domains** → Click **Add Domain** → Enter `api.sentiro.xyz`.
3. At your DNS provider (Cloudflare, Namecheap, etc.), add the DNS records provided by Pxxl:
   | Type | Host | Value |
   | :--- | :--- | :--- |
   | `CNAME` | `@` / `www` | `your-assigned-domain.pxxl.app` |
   | `CNAME` | `api` | `your-assigned-domain.pxxl.app` |
4. Pxxl automatically issues and renews free SSL certificates (Let's Encrypt / Cloudflare).

---

## 4. Background Probe Checker Worker
To run the automated 24/7 synthetic health checks on Pxxl:
* **Option 1 (Background Process)**: In Pxxl, add a background worker process using the command:
  ```bash
  python manage.py run_checks
  ```
* **Option 2 (Cron Job)**: Set up a recurring cron trigger in Pxxl calling:
  ```bash
  python manage.py run_checks --once
  ```

---

## 5. Bachs Webhook Verification
In your **Bachs Dashboard** (`https://dashboard.bachs.io`):
1. Navigate to **Developers** → **Webhooks** → **Add Webhook Endpoint**.
2. **Endpoint URL**: `https://api.sentiro.xyz/api/billing/webhook/` (or `https://sentiro-api.pxxl.pro/api/billing/webhook/`).
3. **Events to Subscribe**:
   - `checkout.completed`
   - `payment.successful`
   - `charge.successful`
4. Copy the **Signing Secret** (`whsec_...`) and add it to your Pxxl environment variables as `BACHS_WEBHOOK_SECRET`.
