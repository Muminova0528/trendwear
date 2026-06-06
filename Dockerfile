# Root Dockerfile - Minimal working version
FROM python:3.11-slim

RUN apt-get update && apt-get install -y nginx && \
    pip install uvicorn

WORKDIR /app

# Backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .

# Frontend
COPY frontend/ /var/www/html/
COPY frontend/nginx.conf /etc/nginx/sites-available/default

EXPOSE 10000

CMD service nginx start && uvicorn app.main:app --host 0.0.0.0 --port 10000