# Root Dockerfile - Backend va Frontend birlashtirilgan (Render uchun)
FROM python:3.12-slim AS backend-builder

WORKDIR /backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .


FROM nginx:1.27-alpine

# Backend uchun Python - Alpine 3.19 (eski versiya) ishlatamiz
RUN apk add --no-cache python3 py3-pip && \
    python3 -m pip install --no-cache-dir --break-system-packages uvicorn

WORKDIR /app

# Backend kodini nusxalash
COPY --from=backend-builder /backend /app

# Frontend fayllarni nusxalash
COPY frontend/index.html frontend/styles.css frontend/app.js /usr/share/nginx/html/
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Render PORT (10000) da ishlaydi
EXPOSE 10000

# Backend va frontendni birga ishga tushirish
CMD sh -c "python3 -m uvicorn app.main:app --host 0.0.0.0 --port 10000 & nginx -g 'daemon off;'"