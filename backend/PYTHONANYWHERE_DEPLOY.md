# 🐍 Sentiro — PythonAnywhere Production Deployment Guide

Deploy **Sentiro** (The 24/7 IT Sentinel & Consensus Uptime Engine) to PythonAnywhere step by step.

---

## 🏗️ Architecture Overview

| Component | Platform | Role |
| :--- | :--- | :--- |
| **Backend API** | PythonAnywhere WSGI (Django 5 + DRF) | Multi-region probe engine, SQLite WAL database, alert dispatching |
| **Scheduled Worker** | PythonAnywhere Scheduled Tasks (Cron) | Background synthetic pings, SSL expiration checks, quorum consensus |
| **Frontend UI** | Vercel / Cloudflare Pages / PythonAnywhere Static | Next.js 16 app with 3D canvas, live status pages, and dark/light themes |

---

## 📋 Step 1: Open a Bash Console on PythonAnywhere

1. Log in to your [PythonAnywhere Dashboard](https://www.pythonanywhere.com).
2. Go to the **Consoles** tab.
3. Click on **Bash** to open a new terminal session.

---

## 📦 Step 2: Clone the Repository & Set Up Virtual Environment

Run the following commands in the Bash console:

```bash
# 1. Clone your repository into your home directory
cd ~
git clone https://github.com/dedcreator/PING-BUD.git sentiro

# 2. Navigate to backend
cd ~/sentiro/backend

# 3. Create a Python 3.11 virtual environment
mkvirtualenv --python=/usr/bin/python3.11 sentiro-env

# 4. Install production dependencies
pip install -r requirements.txt

# 5. Run database migrations
python manage.py migrate

# 6. Seed demo monitors, users, status page, and invoices
python manage.py seed_demo_data

# 7. Collect Django admin & DRF static files
python manage.py collectstatic --noinput
```

---

## 🌐 Step 3: Configure the Web App

1. Go to the **Web** tab in PythonAnywhere.
2. Click **"Add a new web app"**.
3. Select your domain (e.g. `yourusername.pythonanywhere.com`).
4. Choose **"Manual configuration"** (*Important: Do NOT select "Django", choose Manual so we use our virtualenv*).
5. Select **Python 3.11**.

---

## ⚙️ Step 4: Configure Paths & Virtualenv in the Web Tab

Under the **Code** section:
- **Source code**: `/home/<your-username>/sentiro/backend`
- **Working directory**: `/home/<your-username>/sentiro/backend`

Under the **Virtualenv** section:
- Enter: `/home/<your-username>/.virtualenvs/sentiro-env`

Under the **Static files** section:
- **URL**: `/static/`
- **Directory**: `/home/<your-username>/sentiro/backend/staticfiles`

---

## 📝 Step 5: Edit the WSGI Configuration File

1. On the **Web** tab, click the link under **Code**:  
   `WSGI configuration file: /var/www/<your-username>_pythonanywhere_com_wsgi.py`
2. **Delete everything** currently in that file.
3. Paste the following configuration (replace `<your-username>` with your actual username):

```python
import os
import sys

# Replace with your actual PythonAnywhere username
username = '<your-username>'
project_home = f'/home/{username}/sentiro/backend'

if project_home not in sys.path:
    sys.path.insert(0, project_home)

os.environ['DJANGO_SETTINGS_MODULE'] = 'pulsewatch.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

4. Click the green **"Save"** button in the top right.

---

## 🔄 Step 6: Reload Your Web App

1. Return to the **Web** tab.
2. Click the big green **"Reload <your-username>.pythonanywhere.com"** button at the top.
3. Visit `https://<your-username>.pythonanywhere.com/api/overview/` in your browser.  
   You will see the live Sentiro REST API response!

---

## ⏱️ Step 7: Configure Scheduled Probes (Background Ping Worker)

Because PythonAnywhere free accounts do not allow persistent 24/7 background daemons, configure checks via the **Tasks** tab:

1. Open the **Tasks** tab in PythonAnywhere.
2. In the **"Scheduled tasks"** section, enter:
   ```bash
   /home/<your-username>/sentiro/backend/pythonanywhere_cron.sh
   ```
3. Set the schedule frequency (e.g., Hourly or Daily).

> 💡 **For Real-Time Sub-Minute Checks**:  
> Keep a dedicated Bash console running:
> ```bash
> while true; do python ~/sentiro/backend/manage.py run_checks --once; sleep 30; done
> ```

---

## 💻 Step 8: Deploying the Next.js Frontend

### Option A: 1-Click Free Hosting on Vercel (Recommended)
1. Push your repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Set **Root Directory** to `frontend`.
4. Add an Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://<your-username>.pythonanywhere.com`
5. Click **Deploy**. Vercel gives you instant edge CDN caching, global SSL, and zero maintenance.

### Option B: Hosting Frontend on PythonAnywhere (Single-Host Static Export)
If you prefer running everything on PythonAnywhere:
1. In `frontend/next.config.ts`, ensure `output: 'export'`.
2. Build locally: `npm run build` (generates the `frontend/out` folder).
3. On PythonAnywhere **Web** tab, under **Static files**, map:
   - **URL**: `/`
   - **Directory**: `/home/<your-username>/sentiro/frontend/out`

---

## ⚠️ PythonAnywhere Free Tier Whitelist Note

- PythonAnywhere free accounts restrict outbound internet access to an approved whitelist of external APIs.
- Official integrations like **Telegram Bot API**, **Slack Webhooks**, **GitHub**, **Resend**, and **Twilio** are whitelisted and work out of the box!
- If you monitor private web services or custom IP addresses, upgrade to PythonAnywhere's $5/month "Hacker" plan to lift all outbound proxy restrictions.
