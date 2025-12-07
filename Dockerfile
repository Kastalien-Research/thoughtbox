# =============================================================================
# Thoughtbox MCP Server - Multi-Stage Docker Build
# =============================================================================
# This Dockerfile creates a production-ready container for Thoughtbox.
#
# IMPORTANT: Single-agent usage only. This container is designed for one
# MCP client connection at a time. Multi-agent support requires additional
# infrastructure (see DOCKER_ARCHITECTURE.md for roadmap).
# =============================================================================

# -----------------------------------------------------------------------------
# Base Stage: Common Node.js Alpine image
# -----------------------------------------------------------------------------
FROM node:22-alpine AS base
WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# -----------------------------------------------------------------------------
# Dependencies Stage: Install production dependencies only
# -----------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json* ./
# Skip husky prepare script (not needed in production), then rebuild native modules
RUN npm ci --omit=dev --ignore-scripts && npm rebuild better-sqlite3

# -----------------------------------------------------------------------------
# Build Stage: Compile TypeScript with all dependencies
# -----------------------------------------------------------------------------
FROM base AS build
COPY package.json package-lock.json* ./
# Skip husky prepare script during install, then build
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build:local

# -----------------------------------------------------------------------------
# Runtime Stage: Minimal production image
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app

# Security: Run as non-root user (optional, but recommended)
# Note: Using root for now to simplify volume mount permissions
# RUN addgroup -S thoughtbox && adduser -S thoughtbox -G thoughtbox
# USER thoughtbox

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy built application from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/templates ./templates
COPY --from=build /app/drizzle ./drizzle

# Copy package.json for version info
COPY --from=build /app/package.json ./

# Create data directory for volume mount
RUN mkdir -p /root/.thoughtbox

# Environment configuration
ENV NODE_ENV=production
ENV PORT=1729
ENV THOUGHTBOX_DATA_DIR=/root/.thoughtbox

# Volume mount point - data persists on host
VOLUME ["/root/.thoughtbox"]

# Expose MCP server port
EXPOSE 1729

# Health check - verify server is responding
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:1729/health || exit 1

# Start the HTTP server
CMD ["node", "dist/http.js"]
