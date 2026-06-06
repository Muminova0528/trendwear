FROM nginx:1.27-alpine

# Statik fayllar
COPY index.html styles.css app.js /usr/share/nginx/html/

# Nginx konfiguratsiyasi
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE ${PORT:-10000}