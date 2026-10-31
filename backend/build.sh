#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "==> Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Collecting static files with WhiteNoise..."
python manage.py collectstatic --noinput

echo "==> Running database migrations..."
python manage.py migrate

echo "==> Seeding demo monitors, users, and invoices..."
python manage.py seed_demo_data

echo "==> Sentiro backend build successfully completed!"
