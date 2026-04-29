FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY README.md /usr/share/nginx/html/README.md
COPY favicon.svg /usr/share/nginx/html/favicon.svg
COPY favicon-32.png /usr/share/nginx/html/favicon-32.png
COPY apple-touch-icon.png /usr/share/nginx/html/apple-touch-icon.png
COPY icon-512.png /usr/share/nginx/html/icon-512.png

# Listen on $PORT (CranL convention) — fall back to 80 for local
RUN apk add --no-cache gettext
COPY <<'EOF' /etc/nginx/templates/default.conf.template
server {
    listen ${PORT};
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    # Cache control: HTML is fresh, static assets cached
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
EOF

ENV PORT=80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
