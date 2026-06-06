# Root Dockerfile - backend va frontendni birlashtirilgan build
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

# Backend (FastAPI) ni uvicorn orqali ishga tushirish
RUN apk add --no-cache python3 py3-pip

WORKDIR /app
COPY --from=backend-builder /backend /app
COPY --from=backend-builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages

# Frontend fayllar
COPY --from=frontend-builder /frontend /usr/share/nginx/html

# Nginx konfiguratsiyasi
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Backendni ishga tushirish uchun supervisor yoki alohida process
RUN pip install uvicorn

EXPOSE 80

# Backend va frontendni birga ishga tushirish (odatda tavsiya etilmaydi)
CMD nginx -g "daemon off;" & uvicorn app.main:app --host 0.0.0.0 --port 8000