FROM python:3.12-slim

WORKDIR /code

# Tizim kutubxonalari (psycopg2 uchun)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app ./app

# Frontend statik fayllari (Render'da bitta servis hammasini xizmat qiladi).
# Build kontekstida frontend mavjud bo'lsa nusxalaymiz; bo'lmasa skip.
COPY ./static ./static

EXPOSE 8000

# Render konteynerga $PORT beradi; lokalda esa 8000 ishlatiladi.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
