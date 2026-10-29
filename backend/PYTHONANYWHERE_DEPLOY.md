# 🐍 PythonAnywhere Backend Deployment Guide

Deploy the **PulseWatch (PingBud)** Django REST API backend to PythonAnywhere in under 5 minutes.

---

## 📋 Step 1: Open a Bash Console on PythonAnywhere

1. Log in to your [PythonAnywhere Dashboard](https://www.pythonanywhere.com).
2. Go to the **Consoles** tab.
3. Click on **Bash** to open a new terminal.

---

## 📦 Step 2: Clone the Repository & Set Up Virtualenv

Run the following commands in the Bash console:

```bash
# 1. Clone your GitHub repository into your home directory
cd ~
git clone https://github.com/dedcreator/PING-BUD.git

# 2. Navigate to backend
cd ~/PING-BUD/backend

# 3. Create a Python 3.11 virtual environment
mkvirtualenv --python=/usr/bin/python3.11 pulsewatch-env
# (or if using standard venv):
# python3.11 -m venv ~/.virtualenvs/pulsewatch-env
# source ~/.virtualenvs/pulsewatch-env/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Run database migrations
python manage.py migrate

# 6. Seed demo monitors, users, and invoices
python manage.py seed_demo_data

# 7. Collect Django admin & DRF static files
python manage.py collectstatic --noinput
```

---

## 🌐 Step 3: Configure the Web App

1. Go to the **Web** tab in PythonAnywhere.
2. Click **"Add a new web app"**.
3. Select your domain (e.g. `your-username.pythonanywhere.com`).
4. Choose **"Manual configuration"** (do NOT choose Django, choose Manual so we use our virtualenv).
5. Select **Python 3.11**.

---

## ⚙️ Step 4: Configure Paths & Virtualenv in the Web Tab

Under the **Code** section:
- **Source code**: `/home/<your-username>/PING-BUD/backend`
- **Working directory**: `/home/<your-username>/PING-BUD/backend`

Under the **Virtualenv** section:
- Enter: `/home/<your-username>/.virtualenvs/pulsewatch-env`

Under the **Static files** section:
- **URL**: `/static/`
- **Directory**: `/home/<your-username>/PING-BUD/backend/staticfiles`

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
project_home = f'/home/{username}/PING-BUD/backend'

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
   You will see the live Django REST API response!

---

## ⏱️ Step 7: Configure Scheduled Probes (Background Worker)

Because PythonAnywhere free accounts do not allow persistent 24/7 background daemons, run checks via the **Tasks** tab:

1. Open the **Tasks** tab in PythonAnywhere.
2. In the **"Scheduled tasks"** section, enter:
   ```bash
   /home/<your-username>/PING-BUD/backend/pythonanywhere_cron.sh
   ```
3. Set the schedule frequency (e.g., Hourly).

> **For Sub-Minute Checks**: Open a Bash console and run:
> ```bash
> while true; do python ~/PING-BUD/backend/manage.py run_checks --once; sleep 30; done
> ```

---

## ⚠️ Important Note About PythonAnywhere Free Tier

- **Outbound HTTP Whitelist**: PythonAnywhere free accounts restrict outbound internet access to a whitelist of approved APIs (Google, Telegram, Slack, GitHub, Resend, Twilio, etc.).
- If you monitor custom websites or private IP addresses, they must be on PythonAnywhere's whitelist, or you can upgrade to PythonAnywhere's $5/month "Hacker" plan which lifts all proxy restrictions.
