"""
WSGI Configuration Template for PythonAnywhere
==============================================
Copy and paste this snippet into your PythonAnywhere WSGI configuration file:
/var/www/<your-username>_pythonanywhere_com_wsgi.py

Make sure to replace `<your-username>` with your actual PythonAnywhere username!
"""

import os
import sys

# 1. Add your project directory to the sys.path
# Replace 'your-username' with your actual PythonAnywhere username
username = 'your-username'  # <-- CHANGE THIS TO YOUR USERNAME
project_home = f'/home/{username}/PING-BUD/backend'

if project_home not in sys.path:
    sys.path.insert(0, project_home)

# 2. Set environment variables (optional overrides)
os.environ['DJANGO_SETTINGS_MODULE'] = 'pulsewatch.settings'

# 3. Serve through Django's WSGI application handler
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
