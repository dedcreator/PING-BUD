#!/usr/bin/env bash
set -e

PORT="${PORT:-8000}"
if [ -z "$PORT" ] || [ "$PORT" = "0" ]; then
    PORT=8000
fi

echo "--> Starting Sentiro Backend on 0.0.0.0:$PORT"
exec gunicorn pulsewatch.wsgi:application --bind "0.0.0.0:$PORT" --workers 2 --timeout 120
