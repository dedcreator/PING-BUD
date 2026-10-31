FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . /app/

# Collect static files and prepare database
RUN chmod +x build.sh && \
    python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["sh", "-c", "gunicorn pulsewatch.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3"]
