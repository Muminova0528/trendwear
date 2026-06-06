# Root Dockerfile - Backend va Frontend birlashtirilgan (Render uchun)
FROM python:3.12-slim AS backend-builder

WORKDIR /backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .


FROM nginx:1.27-alpine

# Backend uchun Python va kerakli paketlar
RUN apk add --no-cache python3 py3-pip && \
    pip install --no-cache-dir uvicorn

WORKDIR /app

# Backend kodini nusxalash
COPY --from=backend-builder /backend /app

# Frontend fayllarni nusxalash
COPY frontend/index.html frontend/styles.css frontend/app.js /usr/share/nginx/html/
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Render PORT (10000) da ishlaydi
EXPOSE 10000

# Backend va frontendni birga ishga tushirish
RUN echo '#!/bin/sh\n\
echo "Starting TrendWear application..."\n\
echo "Backend: uvicorn on port 10000"\n\
echo "Frontend: nginx on port 10000"\n\
uvicorn app.main:app --host 0.0.0.0 --port 10000 &\n\
nginx -g "daemon off;"' > /start.sh && chmod +x /start.sh

CMD ["/start.sh"]