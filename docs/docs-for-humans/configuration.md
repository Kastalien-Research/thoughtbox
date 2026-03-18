# Configuration

Environment variables, settings, and customization options.

---

## Environment Variables

Configure Thoughtbox behavior through environment variables.

### Core Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `THOUGHTBOX_TRANSPORT` | Transport mode: `stdio` or `http` | `http` |
| `THOUGHTBOX_STORAGE` | Storage backend: `fs` or `memory` | `fs` |
| `THOUGHTBOX_DATA_DIR` | Base directory for all data | `~/.thoughtbox` |
| `THOUGHTBOX_PROJECT` | Default project name | `_default` |

### Server Settings (HTTP mode)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `1731` |
| `HOST` | HTTP server bind address | `0.0.0.0` |

### Observatory Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `OBSERVATORY_PORT` | WebSocket UI port | `1729` |

### Observability Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `PROMETHEUS_URL` | Prometheus server endpoint | `http://prometheus:9090` |
| `GRAFANA_URL` | Grafana dashboard URL | `http://localhost:3001` |

### Debug Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `DISABLE_THOUGHT_LOGGING` | Suppress stderr output | `false` |

---

## Transport Modes

### stdio Mode

Best for MCP clients that manage server lifecycle (Claude Code, Cursor).

```bash
THOUGHTBOX_TRANSPORT=stdio thoughtbox
```

**Characteristics:**
- Server starts/stops with client
- Communication via stdin/stdout
- No port binding required
- Single client connection

### HTTP Mode

Best for persistent servers or multi-client scenarios.

```bash
THOUGHTBOX_TRANSPORT=http PORT=1731 thoughtbox
```

**Characteristics:**
- Server runs independently
- HTTP endpoint at `/mcp`
- Multiple clients can connect
- Survives client disconnects

---

## Storage Backends

### Filesystem Storage (Default)

Persists all data to disk. Recommended for production.

```bash
THOUGHTBOX_STORAGE=fs thoughtbox
```

**Data location:**
```
~/.thoughtbox/
├── config.json          # Global configuration
├── mental-models/       # Synced mental model content
└── projects/
    └── {project}/
        └── sessions/
            └── {partition}/
                └── {session-id}/
                    ├── manifest.json
                    ├── 001.json
                    └── ...
```

### In-Memory Storage

Volatile storage for development/testing. Data lost on restart.

```bash
THOUGHTBOX_STORAGE=memory thoughtbox
```

**Use cases:**
- Unit testing
- Development
- Temporary sessions

---

## Data Directory Structure

### Changing the Data Directory

```bash
THOUGHTBOX_DATA_DIR=/custom/path thoughtbox
```

### Directory Layout

```
{THOUGHTBOX_DATA_DIR}/
├── config.json              # Server configuration
├── mental-models/           # Persistent mental models
│   ├── rubber-duck.md
│   ├── five-whys.md
│   └── ...
└── projects/
    ├── _default/            # Default project
    │   └── sessions/
    │       └── 2025-01/     # Monthly partition
    │           └── session-abc/
    │               ├── manifest.json
    │               ├── 001.json
    │               └── 002.json
    └── my-app/              # Custom project
        └── sessions/
            └── ...
```

---

## Session Partitioning

Sessions are organized into time-based partitions for easier management.

### Partition Granularities

| Granularity | Path Format | Example |
|-------------|-------------|---------|
| `monthly` | `YYYY-MM` | `2025-01/` |
| `weekly` | `YYYY-Www` | `2025-W03/` |
| `daily` | `YYYY-MM-DD` | `2025-01-15/` |
| `none` | (flat) | (no partitioning) |

### Configuring Partitioning

Set via `config.json`:

```json
{
  "partitionGranularity": "monthly"
}
```

### Choosing a Granularity

| Volume | Recommended |
|--------|-------------|
| < 100 sessions/month | `monthly` |
| 100-500 sessions/month | `weekly` |
| 500+ sessions/month | `daily` |
| Very few sessions | `none` |

---

## Projects

Projects provide namespace isolation for sessions.

### Default Project

Without configuration, all sessions go to `_default`:

```
~/.thoughtbox/projects/_default/sessions/
```

### Setting a Project

```bash
THOUGHTBOX_PROJECT=my-app thoughtbox
```

Or via the API:

```json
{
  "operation": "start_new",
  "args": {
    "title": "Fix login bug",
    "project": "my-app"
  }
}
```

### Project Use Cases

- **Per-repository** — One project per codebase
- **Per-team** — Separate team reasoning
- **Per-client** — Client-specific sessions

---

## Server Configuration

Server-level settings in `config.json`:

```json
{
  "disableThoughtLogging": false,
  "autoCreateSession": true,
  "reasoningSessionId": "session-to-preload"
}
```

### Settings

| Setting | Type | Description | Default |
|---------|------|-------------|---------|
| `disableThoughtLogging` | boolean | Suppress thought output to stderr | `false` |
| `autoCreateSession` | boolean | Auto-create session on first thought | `true` |
| `reasoningSessionId` | string | Pre-load this session on startup | (none) |

---

## MCP Client Configuration

### Claude Code

Add to your MCP settings file:

```json
{
  "mcpServers": {
    "thoughtbox": {
      "command": "thoughtbox",
      "args": [],
      "env": {
        "THOUGHTBOX_PROJECT": "my-project"
      }
    }
  }
}
```

### With Custom Data Directory

```json
{
  "mcpServers": {
    "thoughtbox": {
      "command": "thoughtbox",
      "env": {
        "THOUGHTBOX_DATA_DIR": "/home/user/my-thoughtbox-data"
      }
    }
  }
}
```

### HTTP Connection

```json
{
  "mcpServers": {
    "thoughtbox": {
      "url": "http://localhost:1731/mcp"
    }
  }
}
```

---

## Docker Configuration

### Basic Docker Run

```bash
docker run -p 1731:1731 -v ~/.thoughtbox:/data \
  -e THOUGHTBOX_TRANSPORT=http \
  -e THOUGHTBOX_DATA_DIR=/data \
  thoughtbox
```

### Docker Compose

```yaml
version: '3.8'

services:
  thoughtbox:
    image: thoughtbox
    ports:
      - "1731:1731"
      - "1729:1729"
    volumes:
      - thoughtbox-data:/data
    environment:
      - THOUGHTBOX_TRANSPORT=http
      - THOUGHTBOX_DATA_DIR=/data
      - THOUGHTBOX_PROJECT=my-app

volumes:
  thoughtbox-data:
```

### With Observability Stack

```yaml
version: '3.8'

services:
  thoughtbox:
    image: thoughtbox
    ports:
      - "1731:1731"
      - "1729:1729"
    environment:
      - THOUGHTBOX_TRANSPORT=http
      - PROMETHEUS_URL=http://prometheus:9090
      - GRAFANA_URL=http://grafana:3000

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## Common Configurations

### Development Setup

```bash
# Volatile storage, verbose output
THOUGHTBOX_STORAGE=memory \
THOUGHTBOX_TRANSPORT=http \
PORT=1731 \
thoughtbox
```

### Production Setup

```bash
# Persistent storage, specific data dir
THOUGHTBOX_STORAGE=fs \
THOUGHTBOX_DATA_DIR=/var/lib/thoughtbox \
THOUGHTBOX_TRANSPORT=http \
THOUGHTBOX_PROJECT=production \
PORT=1731 \
HOST=0.0.0.0 \
DISABLE_THOUGHT_LOGGING=true \
thoughtbox
```

### CI/Testing Setup

```bash
# In-memory, no output
THOUGHTBOX_STORAGE=memory \
DISABLE_THOUGHT_LOGGING=true \
thoughtbox
```

---

## Next Steps

- [**Getting Started**](./getting-started.md) — Installation and first session
- [**Architecture**](./architecture.md) — Technical deep-dive
- [**Observability**](./observability.md) — Monitoring and visualization
