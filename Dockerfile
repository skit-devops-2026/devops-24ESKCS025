# syntax=docker/dockerfile:1

# ==========================================
# Stage 1: Build the HostelFix application
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests first for efficient layer caching
COPY package*.json ./

# Install project dependencies
RUN npm install --legacy-peer-deps

# Copy full application source
COPY . .

# Build the production server bundle
ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
RUN npm run build

# ==========================================
# Stage 2: Minimal Production Runtime
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
ENV NITRO_PORT=8080
ENV NITRO_HOST=0.0.0.0

# Non-root user for container security
USER node

# Copy compiled artifacts from builder stage
COPY --chown=node:node --from=builder /app/.output ./.output
COPY --chown=node:node --from=builder /app/package.json ./package.json

EXPOSE 8080

# Built-in healthcheck probe using the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-8080}/health || exit 1

# Start the standalone Node.js production server
CMD ["node", ".output/server/index.mjs"]
