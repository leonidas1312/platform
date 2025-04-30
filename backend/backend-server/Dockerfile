# Use an official Node.js image from Docker Hub
FROM node:23-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (important for caching dependencies)
COPY ./package*.json ./


# Debug step 1: Print out the current directory and list files
RUN echo "Current Directory: $(pwd)" && ls -al

# Install dependencies
RUN npm install

# Debug step 2: Check if node_modules are installed correctly
RUN ls -al /app/node_modules

# Copy the rest of the application files
COPY . .

EXPOSE 4000

# Start the app
CMD ["node", "server.js"]