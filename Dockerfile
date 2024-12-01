# Build stage
FROM node:20-bullseye-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application
COPY . .

# Final stage
FROM node:20-bullseye-slim

# Install taskwarrior
RUN apt-get update && \
    apt-get install -y taskwarrior bash && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean && \
    mkdir -p /root/.task

# Set environment variables
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Set working directory
WORKDIR /app

# Copy from builder stage
COPY --from=builder /app ./

# Expose port
EXPOSE 3000

# Set default command
CMD ["npm", "run", "dev"]