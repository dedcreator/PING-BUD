# Deploying Sentiro to Pxxl (`pxxl.app`)

[**Pxxl** (`pxxl.app`)](https://pxxl.app) is the modern web hosting and deployment platform optimized for developer productivity, global edge routing, and automated continuous deployment.

---

## 1. Prerequisites
- A [Pxxl account](https://pxxl.app) connected to your GitHub or GitLab repository.
- A custom domain registered at your registrar (e.g. `sentiro.xyz`).
- API credentials for optional cloud services:
  - `BACHS_API_KEY` (from [dashboard.bachs.io](https://dashboard.bachs.io))
  - `RESEND_API_KEY` (from [resend.com](https://resend.com))

---

## 2. Deploying Backend API Service (`backend/`)

1. In the Pxxl dashboard, click **New Project** → **Import from GitHub** → select your `Sentiro` repository.
2. Select **Python** runtime with the following settings:
   - **Service Name**: `sentiro-api`
   - **Root Directory**: `backend`
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `gunicorn pulsewatch.wsgi:application --bind 0.0.0.0:$PORT`
3. Add your production **Environment Variables**:
   ```ini
   DJANGO_SECRET_KEY=YOUR_SECURE_RANDOM_SECRET_KEY
   DEBUG=False
   ALLOWED_HOSTS=*
   CSRF_TRUSTED_ORIGINS=https://sentiro.xyz,https://*.sentiro.xyz,https://*.pxxl.app,https://*.pxxl.pro
   
   # Bachs Billing Integration (docs.bachs.io)
   BACHS_API_KEY=sk_live_...
   BACHS_WEBHOOK_SECRET=whsec_...
   BACHS_BASE_URL=https://api.bachs.io
   
   # Telegram Official Bot Alerts (@SentiroAlertBot)
   TELEGRAM_BOT_TOKEN=8123456789:AA...
   
   # Resend SRE Transactional Email
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=alerts@sentiro.xyz
   ```
4. Click **Deploy**. Pxxl provisions your service with an automatic HTTPS URL like `https://sentiro-api.pxxl.pro`.

---

## 3. Deploying Frontend Web Service (`frontend/`)

1. Click **Add Service** in your project → select the same repository.
2. Select **Next.js** framework:
   - **Service Name**: `sentiro-web`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
3. Add Environment Variable:
   ```ini
   NEXT_PUBLIC_API_URL=https://sentiro-api.pxxl.pro
   ```
4. Click **Deploy**. Pxxl compiles Next.js with Turbopack and issues your live URL at `https://sentiro-web.pxxl.pro`.

---

## 4. Custom Domain Setup for `sentiro.xyz`

1. In the Pxxl dashboard:
   - Go to `sentiro-web` → **Domains** → Add `sentiro.xyz` and `www.sentiro.xyz`.
   - Go to `sentiro-api` → **Domains** → Add `api.sentiro.xyz`.
2. Configure DNS at your registrar:
   - `CNAME` for `@` pointing to your Pxxl web address.
   - `CNAME` for `api` pointing to your Pxxl API address.
3. Update `NEXT_PUBLIC_API_URL` on the frontend to `https://api.sentiro.xyz`.
4. Pxxl provisions and auto-renews free SSL certificates via Let's Encrypt / Cloudflare.

---

## 5. Background Probe Daemon
Run continuous multi-region health checks by configuring a background worker in Pxxl:
```bash
python manage.py run_checks
```
Or trigger it via a 30-second cron job:
```bash
python manage.py run_checks --once
```
