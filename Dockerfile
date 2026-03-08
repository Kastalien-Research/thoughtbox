# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Enable pnpm via Corepack (matches packageManager field in package.json)
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Make scripts executable
RUN chmod +x scripts/check-cycles.sh

# Build TypeScript and generate assets
RUN pnpm build:local

# Production stage
FROM node:22-slim

WORKDIR /app

# Enable pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only (--ignore-scripts skips husky prepare)
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy entire better-sqlite3 package from builder (where pnpm install compiled native bindings).
# pnpm-lock.yaml ensures both stages resolve to identical versions, so this is safe.
# Copying the full package (not just build/) ensures complete consistency of package structure.
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

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
