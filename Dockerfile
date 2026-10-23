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
ENV VITE_SUPABASE_URL=https://devops-24eskcs025.supabase.co
ENV VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldm9wcy0yNGVza2NzMDI1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2MjAwMDAwMDAsImV4cCI6MTk5OTk5OTk5OX0.dummy_signature
ENV VITE_SUPABASE_PROJECT_ID=devops-24eskcs025
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
ENV VITE_SUPABASE_URL=https://devops-24eskcs025.supabase.co
ENV VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldm9wcy0yNGVza2NzMDI1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2MjAwMDAwMDAsImV4cCI6MTk5OTk5OTk5OX0.dummy_signature
ENV VITE_SUPABASE_PROJECT_ID=devops-24eskcs025


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
