#!/bin/bash
# PulseWatch / PingBud — PythonAnywhere Scheduled Task Runner
# ==========================================================
# This script executes scheduled health checks on PythonAnywhere.
# In the PythonAnywhere 'Tasks' tab, add this command:
# /home/<your-username>/PING-BUD/backend/pythonanywhere_cron.sh

set -e

# Replace with your actual PythonAnywhere username
USER_NAME="your-username"

PROJECT_DIR="/home/${USER_NAME}/PING-BUD/backend"
VENV_PYTHON="/home/${USER_NAME}/.virtualenvs/pulsewatch-env/bin/python"

# Fallback if virtualenv is inside backend
if [ ! -f "$VENV_PYTHON" ]; then
    VENV_PYTHON="${PROJECT_DIR}/.venv/bin/python"
fi

cd "$PROJECT_DIR"

# Run a single check cycle for all due monitors
$VENV_PYTHON manage.py run_checks --once
