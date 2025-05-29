# Stage 1: Build the static files
FROM node:23-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production server
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx config for SPA routing
RUN echo 'server { \
    listen 8080; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Handle SPA routing \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Proxy API requests to backend \
    location /api/ { \
        proxy_pass http://backend.rastion.svc.cluster.local:4000; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_set_header X-Forwarded-Host $host; \
        proxy_set_header X-Forwarded-Port $server_port; \
        \
        # WebSocket support \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_cache_bypass $http_upgrade; \
        proxy_read_timeout 86400; \
        \
        # Handle CORS \
        add_header Access-Control-Allow-Origin *; \
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"; \
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization"; \
        \
        # Handle preflight requests \
        if ($request_method = OPTIONS) { \
            add_header Access-Control-Allow-Origin *; \
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"; \
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization"; \
            add_header Access-Control-Max-Age 1728000; \
            add_header Content-Type "text/plain; charset=utf-8"; \
            add_header Content-Length 0; \
            return 204; \
        } \
    } \
}' > /etc/nginx/conf.d/default.conf

# Change nginx to listen on port 8080 instead of 80
RUN sed -i 's/listen       80;/listen       8080;/' /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
