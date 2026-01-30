# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source files
COPY . .

# Make scripts executable
RUN chmod +x scripts/check-cycles.sh

# Build TypeScript and generate assets
RUN npm run build:local

# Production stage
FROM node:22-slim

WORKDIR /app

# Install build tools for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies only (--ignore-scripts skips husky prepare)
RUN npm ci --omit=dev --ignore-scripts

# Rebuild native modules for Docker architecture
RUN npm rebuild better-sqlite3

# Copy built files from builder
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

# Data directory for persistent sessions
# Mount a host volume here for persistence: -v ~/.thoughtbox:/data/thoughtbox
ENV THOUGHTBOX_DATA_DIR=/data/thoughtbox

# Project isolation - set to scope sessions to a specific project
# Sessions are stored at: /data/thoughtbox/projects/{project}/sessions/
# Default: _default
# Example: THOUGHTBOX_PROJECT=my-project
ENV THOUGHTBOX_PROJECT=_default

VOLUME ["/data/thoughtbox"]

# Health check endpoint (use PORT env var, default 1731)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e 'const port = process.env.PORT || "1731"; require("http").get(`http://localhost:${port}/health`, (r) => process.exit(r.statusCode === 200 ? 0 : 1))' || exit 1

# Start the HTTP server
CMD ["node", "dist/index.js"]

