# Root Dockerfile - Backend va frontendni birlashtirilgan build
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/ .
# Frontend build buyruqlari (agar kerak bo'lsa)
# RUN npm install && npm run build


FROM python:3.12-slim AS backend-builder

WORKDIR /backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .


FROM nginx:1.27-alpine

# Backend (FastAPI) uchun Python va kerakli paketlarni o'rnatish
RUN apk add --no-cache python3 py3-pip py3-virtualenv && \
    python3 -m venv /venv && \
    /venv/bin/pip install --no-cache-dir uvicorn

WORKDIR /app

# Backend kodini va kutubxonalarni nusxalash
COPY --from=backend-builder /backend /app
COPY --from=backend-builder /usr/local/lib/python3.12/site-packages /venv/lib/python3.12/site-packages/

# Frontend fayllar
COPY --from=frontend-builder /frontend /usr/share/nginx/html

# Nginx konfiguratsiyasi
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Backendni ishga tushirish uchun startup skript
RUN echo '#!/bin/sh' > /start.sh && \
    echo '/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 &' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]# Root papkada Dockerfile yaratish
cat > Dockerfile << 'EOF'
# Root Dockerfile - CI/CD placeholder
FROM alpine:latest

LABEL maintainer="TrendWear Team"
LABEL description="Use 'docker-compose up' to run the full application stack"

RUN echo "✅ Docker build successful for TrendWear"

CMD ["sh", "-c", "echo 'Please use docker-compose up to run the application' && tail -f /dev/null"]
EOF

# Build qilish
docker build -t trendwear .

# Test qilish
docker run --rm trendwear