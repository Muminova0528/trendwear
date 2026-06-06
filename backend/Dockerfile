FROM python:3.12-slim

WORKDIR /code

# Tizim kutubxonalari (psycopg2 uchun)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render PORT environment variable dan foydalanish
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}