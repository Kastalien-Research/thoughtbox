---
name: Docker Patterns
description: Multi-stage builds, security, optimization
---

# Docker Development Patterns

Container best practices and security patterns for 2025.

## Multi-Stage Builds

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Security Best Practices

### Non-Root User

```dockerfile
FROM node:20-alpine

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app
COPY --chown=nextjs:nodejs . .

USER nextjs
CMD ["node", "server.js"]
```

### Minimal Base Images

```dockerfile
# ✅ Good - Alpine (small, secure)
FROM node:20-alpine

# ❌ Bad - Full Debian (large attack surface)
FROM node:20
```

### Scan for Vulnerabilities

```bash
# Scan image
docker scan myapp:latest

# Use Trivy
trivy image myapp:latest
```

## Optimization

### Layer Caching

```dockerfile
# ✅ Good - Dependencies cached separately
COPY package*.json ./
RUN npm ci
COPY . .

# ❌ Bad - Cache invalidated on any file change
COPY . .
RUN npm ci
```

### .dockerignore

```
node_modules
npm-debug.log
.git
.env
*.md
.vscode
coverage
dist
.next
```

### Minimize Layers

```dockerfile
# ✅ Good - Single RUN
RUN apk add --no-cache git curl && \
    npm ci && \
    rm -rf /tmp/*

# ❌ Bad - Multiple layers
RUN apk add git
RUN apk add curl
RUN npm ci
```

## Docker Compose

### Development Setup

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://db:5432/myapp
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=myapp
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## Healthchecks

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1
```

```javascript
// healthcheck.js
const http = require('http');

const options = {
  host: 'localhost',
  port: 3000,
  path: '/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  process.exitCode = (res.statusCode === 200) ? 0 : 1;
  process.exit();
});

request.on('error', () => {
  console.log('ERROR');
  process.exit(1);
});

request.end();
```

## Best Practices

✅ **Do**:
- Use multi-stage builds
- Run as non-root user
- Use specific image tags (not `latest`)
- Minimize layers
- Use .dockerignore
- Scan images for vulnerabilities
- Add health checks
- Keep images small

❌ **Don't**:
- Run as root
- Use `latest` tag
- Include secrets in images
- Install unnecessary packages
- Copy node_modules into container
- Ignore security scans
