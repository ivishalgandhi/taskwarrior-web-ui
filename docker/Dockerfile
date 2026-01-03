# Build stage
FROM node:20-bullseye-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Production stage
FROM node:20-bullseye-slim

# Install taskwarrior
RUN apt-get update && \
    apt-get install -y taskwarrior bash && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean && \
    mkdir -p /root/.task

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./

# Expose port
EXPOSE 3000

# Set default command to production start
CMD ["npm", "start"]