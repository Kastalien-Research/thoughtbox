# Thoughtbox Docker Architecture

## Overview

Thoughtbox is a **local-first** MCP server providing cognitive enhancement tools for LLM agents. When deployed in Docker, it provides an isolated, reproducible environment while maintaining full data locality through volume mounts.

**IMPORTANT: Single-Agent Usage Only**

This deployment is designed for **one MCP client connection at a time**. Multi-agent concurrent access is not supported in this version. See [Future Multi-Agent Support](#future-multi-agent-support) for the roadmap.

---

## Quick Start

```bash
# Start Thoughtbox
docker-compose up -d

# Check status
curl http://localhost:1729/health

# View logs
docker-compose logs -f

# Stop (data preserved)
docker-compose down
```

**MCP Client Configuration:**
```json
{
  "mcpServers": {
    "thoughtbox": {
      "url": "http://localhost:1729/mcp",
      "transport": "streamable-http"
    }
  }
}
```

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HOST MACHINE                                       │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     Docker Container                                 │   │
│   │   ┌───────────────────────────────────────────────────────────────┐ │   │
│   │   │                    Node.js Runtime                            │ │   │
│   │   │   ┌─────────────────────────────────────────────────────────┐ │ │   │
│   │   │   │               Thoughtbox MCP Server                     │ │ │   │
│   │   │   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │ │ │   │
│   │   │   │  │  Express    │  │  Reasoning  │  │  Notebook       │  │ │ │   │
│   │   │   │  │  HTTP API   │  │  Engine     │  │  Executor       │  │ │ │   │
│   │   │   │  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │ │ │   │
│   │   │   │         │                │                  │           │ │ │   │
│   │   │   │         └────────────────┼──────────────────┘           │ │ │   │
│   │   │   │                          │                              │ │ │   │
│   │   │   │              Streamable HTTP (Port 1729)                │ │ │   │
│   │   │   └──────────────────────────┼──────────────────────────────┘ │ │   │
│   │   │                              │                                │ │   │
│   │   │   ┌─────────────┐   ┌────────┴────────┐   ┌─────────────────┐ │ │   │
│   │   │   │   SQLite    │   │   Persistence   │   │   Mental        │ │ │   │
│   │   │   │   Database  │   │   Layer         │   │   Models        │ │ │   │
│   │   │   │             │   │                 │   │                 │ │ │   │
│   │   │   └──────┬──────┘   └─────────────────┘   └─────────────────┘ │ │   │
│   │   │          │                                                    │ │   │
│   │   └──────────┼────────────────────────────────────────────────────┘ │   │
│   │              │                                                      │   │
│   │   ┌──────────▼──────────┐                                           │   │
│   │   │  /root/.thoughtbox  │  ◄─── Volume Mount                        │   │
│   │   │  (Container Path)   │                                           │   │
│   │   └──────────┬──────────┘                                           │   │
│   └──────────────┼──────────────────────────────────────────────────────┘   │
│                  │                                                           │
│   ┌──────────────▼──────────┐                                               │
│   │  ~/.thoughtbox          │  (Host Path)                                  │
│   │  ├── thoughtbox.db      │  SQLite database                              │
│   │  └── sessions/          │  Reasoning session storage                    │
│   │      └── {session-id}/                                                  │
│   │          ├── manifest.json                                              │
│   │          └── thoughts/                                                  │
│   │              └── 001.json                                               │
│   └─────────────────────────┘                                               │
│                                                                             │
│   MCP Client ──────────────────► http://localhost:1729/mcp                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Single-Agent Constraint

### Why Single-Agent Only?

This deployment enforces **one active MCP client at a time** for the following reasons:

1. **SQLite Locking**: SQLite in default journal mode allows only one writer at a time. Concurrent writes from multiple agents would cause lock contention and potential data corruption.

2. **Session State**: The reasoning engine maintains in-memory session state that isn't designed for concurrent modification by multiple agents.

3. **File System Safety**: Thought chains are stored as JSON files. Concurrent writes to the same session directory could cause race conditions.

4. **Simplified Deployment**: Single-agent mode enables a simpler, more reliable architecture without distributed locking or coordination overhead.

### What Happens with Multiple Agents?

If multiple MCP clients attempt to connect simultaneously:

- **Read operations**: Generally safe, may see stale data
- **Write operations**: Will block or fail due to SQLite locks
- **Session conflicts**: Second agent may overwrite first agent's thoughts

### Recommendations

| Scenario | Recommendation |
|----------|----------------|
| Single developer | Use as-is |
| Team sharing | Deploy separate containers per user |
| CI/CD pipeline | Serialize agent operations |
| Production multi-agent | Wait for future multi-agent support |

---

## Future Multi-Agent Support

Multi-agent concurrent access is on the roadmap. Required infrastructure:

### Phase 1: SQLite WAL Mode
```typescript
// Enable Write-Ahead Logging for concurrent reads
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
```

### Phase 2: Session Isolation
- Session-level locking (one agent per session)
- Connection pooling for database access
- File locking for JSON thought files

### Phase 3: Distributed Coordination
- Redis or etcd for distributed locks
- Session affinity via consistent hashing
- Event streaming for cross-agent notifications

### Phase 4: Database Migration (Optional)
- PostgreSQL for true multi-writer support
- Connection pooling (PgBouncer)
- MVCC for concurrent access

**Timeline**: Multi-agent support is planned for a future release. Track progress at [GitHub Issues](https://github.com/Kastalien-Research/thoughtbox/issues).

---

## Volume Mount Architecture

### Data Directory Structure

```
~/.thoughtbox/                          # THOUGHTBOX_DATA_DIR
├── thoughtbox.db                       # SQLite: config, session index
└── sessions/                           # Reasoning chain storage
    └── {session-id}/
        ├── manifest.json               # Session metadata
        └── thoughts/                   # Individual thought files
            ├── 001.json
            ├── 002.json
            └── ...
```

### Benefits of Mounted Volumes

| Benefit | Description |
|---------|-------------|
| **Data Ownership** | All data lives on your host filesystem |
| **Transparency** | Browse sessions, read thoughts directly |
| **Portability** | Copy `~/.thoughtbox` to new machine |
| **Backup** | Git-track or backup service can snapshot |
| **Recovery** | Container dies, data survives |
| **Debugging** | Inspect DB with `sqlite3`, read JSON files |

### Volume Mount Configuration

```yaml
# docker-compose.yml
volumes:
  - type: bind
    source: ~/.thoughtbox
    target: /root/.thoughtbox
    bind:
      create_host_path: true  # Auto-creates if missing
```

---

## Docker Configuration

### Dockerfile Overview

Multi-stage build for minimal image size:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Build Pipeline                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Stage 1: base                                                  │
│  └── node:22-alpine with build dependencies                     │
│                          ▼                                      │
│  Stage 2: deps                                                  │
│  └── Production dependencies only (npm ci --omit=dev)           │
│                          ▼                                      │
│  Stage 3: build                                                 │
│  └── Compile TypeScript, embed templates                        │
│                          ▼                                      │
│  Stage 4: runtime                                               │
│  └── Minimal runtime with dist/ and node_modules                │
│                                                                 │
│  CMD ["node", "dist/http.js"]                                   │
│  EXPOSE 1729                                                    │
│  HEALTHCHECK → http://localhost:1729/health                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### docker-compose.yml Configuration

```yaml
services:
  thoughtbox:
    build: .
    container_name: thoughtbox
    ports:
      - '${HOST_BIND:-127.0.0.1}:1729:1729'  # Localhost only by default
    volumes:
      - ~/.thoughtbox:/root/.thoughtbox:rw
    environment:
      - NODE_ENV=production
      - PORT=1729
      - THOUGHTBOX_DATA_DIR=/root/.thoughtbox
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `1729` | MCP server port |
| `HOST_BIND` | `127.0.0.1` | Network interface (localhost only) |
| `THOUGHTBOX_DATA_DIR` | `/root/.thoughtbox` | Data directory path |
| `DISABLE_THOUGHT_LOGGING` | `false` | Suppress stderr output |

---

## Network Configuration

### Default: Localhost Only (Secure)

```bash
# Only accessible from host machine
docker-compose up -d
curl http://localhost:1729/health
```

### Network Access (Use with Caution)

```bash
# Accessible from network
HOST_BIND=0.0.0.0 docker-compose up -d
```

**Security Note**: Exposing on 0.0.0.0 allows network access. Ensure proper firewall rules if used.

---

## Operations

### Starting

```bash
docker-compose up -d        # Start in background
docker-compose up           # Start with logs attached
```

### Monitoring

```bash
docker-compose ps           # Check container status
docker-compose logs -f      # Follow logs
curl localhost:1729/health  # Health check
```

### Stopping

```bash
docker-compose down         # Stop (data preserved)
docker-compose down -v      # Stop and remove volumes
```

### Rebuilding

```bash
docker-compose build        # Rebuild image
docker-compose up -d --build  # Rebuild and start
```

### Data Management

```bash
# Backup
cp -r ~/.thoughtbox ~/thoughtbox-backup-$(date +%Y%m%d)

# Inspect database
sqlite3 ~/.thoughtbox/thoughtbox.db ".tables"
sqlite3 ~/.thoughtbox/thoughtbox.db "SELECT * FROM sessions;"

# View a thought chain
cat ~/.thoughtbox/sessions/{session-id}/thoughts/001.json | jq
```

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs

# Verify data directory permissions
ls -la ~/.thoughtbox

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Health check failing

```bash
# Check if server is running
docker-compose exec thoughtbox ps aux

# Check port binding
docker-compose exec thoughtbox netstat -tlnp

# Test from inside container
docker-compose exec thoughtbox wget -q http://localhost:1729/health -O-
```

### Database locked errors

This indicates multiple processes are trying to access SQLite:

1. Ensure only one container is running: `docker-compose ps`
2. Stop any local `npm start` processes
3. Check for orphan processes: `docker-compose down && docker-compose up -d`

---

## Summary

Thoughtbox's Docker architecture provides:

1. **Isolation**: Containerized Node.js environment
2. **Persistence**: Volume-mounted data survives restarts
3. **Portability**: Works on any Docker-capable host
4. **Security**: Default localhost-only binding
5. **Simplicity**: Single container, single agent

**Current Limitation**: Single-agent usage only. Multi-agent support is planned for future releases.

Your reasoning chains and sessions are stored locally in `~/.thoughtbox` - your data never leaves your control.
