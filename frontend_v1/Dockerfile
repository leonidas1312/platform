# Stage 1: Build the static files
FROM node:23-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
# Expose port 80 for the container
EXPOSE 8080
CMD ["npm", "run", "dev"]
