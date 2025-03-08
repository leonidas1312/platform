# Stage 1: Build the static files
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve static files with Nginx
FROM nginx:alpine
# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*
# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html
# Expose port 80 for the container
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
