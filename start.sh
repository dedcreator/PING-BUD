#!/usr/bin/env bash
set -e

# Fallback PORT to 3000 if unset or empty
PORT="${PORT:-3000}"
if [ -z "$PORT" ] || [ "$PORT" = "0" ]; then
    PORT=3000
fi

echo "============================================================"
echo "🚀 Starting Sentiro on 0.0.0.0:$PORT..."
echo "============================================================"

# Helper cleanup trap
cleanup() {
    echo "--> Shutting down services..."
    if [ -n "$DJANGO_PID" ]; then
        kill -TERM "$DJANGO_PID" 2>/dev/null || true
    fi
}
trap cleanup SIGTERM SIGINT EXIT

# 1. Standalone Backend Request (explicit)
if [ "$SERVICE" = "backend" ] || [ "$DEPLOY_TARGET" = "api" ]; then
    echo "--> [Mode: Standalone Backend] Starting Gunicorn on 0.0.0.0:$PORT..."
    cd backend
    exec gunicorn pulsewatch.wsgi:application --bind "0.0.0.0:$PORT" --workers 2 --timeout 120
fi

# 2. Standalone Frontend Request (explicit)
if [ "$SERVICE" = "frontend" ] || [ "$DEPLOY_TARGET" = "web" ]; then
    echo "--> [Mode: Standalone Frontend] Starting Next.js on 0.0.0.0:$PORT..."
    cd frontend
    exec npx next start -H 0.0.0.0 -p "$PORT"
fi

# 3. Running from inside backend/ directory
if [ -f "manage.py" ] && [ -f "requirements.txt" ]; then
    BACKEND_PORT="${PORT:-8000}"
    echo "--> [Mode: Inside backend/] Starting Gunicorn on 0.0.0.0:$BACKEND_PORT..."
    exec gunicorn pulsewatch.wsgi:application --bind "0.0.0.0:$BACKEND_PORT" --workers 2 --timeout 120
fi

# 4. Running from inside frontend/ directory
if [ -f "package.json" ] && [ -d ".next" ]; then
    echo "--> [Mode: Inside frontend/] Starting Next.js on 0.0.0.0:$PORT..."
    exec npx next start -H 0.0.0.0 -p "$PORT"
fi

# 5. Fullstack / Multi-process Auto-Detection from Repository Root
HAS_PYTHON=false
if command -v python3 >/dev/null 2>&1 || command -v python >/dev/null 2>&1; then
    HAS_PYTHON=true
fi

HAS_NODE=false
if command -v node >/dev/null 2>&1 && command -v npx >/dev/null 2>&1; then
    HAS_NODE=true
fi

# Fullstack: Both Python backend and Next.js frontend are ready
if [ "$HAS_PYTHON" = true ] && [ "$HAS_NODE" = true ] && [ -d "backend" ] && [ -d "frontend" ]; then
    echo "--> [Mode: Fullstack] Starting Django API on internal port 127.0.0.1:8000..."
    cd backend
    gunicorn pulsewatch.wsgi:application --bind "127.0.0.1:8000" --workers 2 --timeout 120 &
    DJANGO_PID=$!
    cd ..

    # Wait for Django to bind
    sleep 1

    echo "--> [Mode: Fullstack] Starting Next.js Web UI on public 0.0.0.0:$PORT..."
    cd frontend
    npx next start -H 0.0.0.0 -p "$PORT" &
    NEXT_PID=$!
    cd ..

    wait -n $NEXT_PID $DJANGO_PID
    exit $?
fi

# Python-only fallback
if [ "$HAS_PYTHON" = true ] && [ -d "backend" ]; then
    echo "--> [Mode: Python Container] Starting Gunicorn on 0.0.0.0:$PORT..."
    cd backend
    exec gunicorn pulsewatch.wsgi:application --bind "0.0.0.0:$PORT" --workers 2 --timeout 120
fi

# Node-only fallback
if [ "$HAS_NODE" = true ] && [ -d "frontend" ]; then
    echo "--> [Mode: Node Container] Starting Next.js on 0.0.0.0:$PORT..."
    cd frontend
    exec npx next start -H 0.0.0.0 -p "$PORT"
fi

echo "Error: Unable to start Sentiro. No valid Python or Node environment found."
exit 1
