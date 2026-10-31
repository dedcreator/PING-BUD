#!/usr/bin/env bash
# Sentiro Unified Production Build Script for Pxxl.app & PaaS Environments
set -o errexit

echo "============================================================"
echo "🚀 Starting Sentiro Production Build on Pxxl..."
echo "============================================================"

# Resolve python and pip commands
PYTHON_BIN=""
if command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
fi

PIP_BIN=""
if command -v pip3 >/dev/null 2>&1; then
    PIP_BIN="pip3"
elif command -v pip >/dev/null 2>&1; then
    PIP_BIN="pip"
fi

# 1. Django Backend Build (Root or backend/ subdirectory)
if [ -n "$PYTHON_BIN" ] && [ -n "$PIP_BIN" ]; then
    if [ -f "requirements.txt" ] && [ -f "manage.py" ]; then
        echo "--> [Backend] Installing Python dependencies from root requirements.txt..."
        $PIP_BIN install --upgrade pip
        $PIP_BIN install -r requirements.txt

        echo "--> [Backend] Collecting static files..."
        $PYTHON_BIN manage.py collectstatic --noinput

        echo "--> [Backend] Running database migrations..."
        $PYTHON_BIN manage.py migrate --noinput

        echo "--> [Backend] Seeding demo monitors and initial topology..."
        $PYTHON_BIN manage.py seed_demo_data || true

    elif [ -d "backend" ] && [ -f "backend/requirements.txt" ]; then
        echo "--> [Backend] Installing Python dependencies from backend/requirements.txt..."
        $PIP_BIN install --upgrade pip
        $PIP_BIN install -r backend/requirements.txt

        echo "--> [Backend] Collecting static files..."
        $PYTHON_BIN backend/manage.py collectstatic --noinput

        echo "--> [Backend] Running database migrations..."
        $PYTHON_BIN backend/manage.py migrate --noinput

        echo "--> [Backend] Seeding demo monitors and initial topology..."
        $PYTHON_BIN backend/manage.py seed_demo_data || true
    fi
else
    echo "--> [Notice] Python not detected; skipping backend build steps."
fi

# 2. Next.js Frontend Build (Root or frontend/ subdirectory)
if command -v npm >/dev/null 2>&1; then
    if [ -f "package.json" ]; then
        echo "--> [Frontend] Installing Node dependencies and building Next.js application..."
        npm ci || npm install
        npm run build
    elif [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        # If deploying fullstack or standalone web on Pxxl
        if [ "$DEPLOY_TARGET" != "api-only" ]; then
            echo "--> [Frontend] Building Next.js application in frontend/ directory..."
            cd frontend
            npm ci || npm install
            npm run build
            cd ..
        fi
    fi
else
    echo "--> [Notice] Node/npm not detected; skipping frontend build steps."
fi

echo "============================================================"
echo "✅ Sentiro Production Build successfully completed!"
echo "============================================================"
