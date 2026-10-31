web: cd backend && gunicorn pulsewatch.wsgi:application --bind 0.0.0.0:$PORT
worker: cd backend && python manage.py run_checks
