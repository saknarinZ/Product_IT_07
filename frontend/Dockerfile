# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Builder — compile Angular app with Node.js
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first to leverage layer cache
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source code and build for production
COPY . .
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Runtime — serve static files with Nginx
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy built Angular output (dist/frontend/browser for Angular 17+)
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# Nginx config: SPA support (redirect 404 → index.html for Angular Router)
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location /api/ {\n\
        proxy_pass http://backend:8080;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
