# Observability

Monitoring, metrics, and real-time visualization.

---

## Overview

Thoughtbox provides multiple observability layers:

| Layer | Purpose | Access |
|-------|---------|--------|
| **Observatory UI** | Real-time thought visualization | WebSocket (port 1729) |
| **Prometheus Metrics** | Quantitative monitoring | `/metrics` endpoint |
| **Grafana Dashboards** | Historical analysis | Grafana UI |
| **Observability Gateway** | Programmatic access | MCP tool |

---

## Observatory UI

Real-time visualization of reasoning sessions via WebSocket.

### Starting the Observatory

The Observatory starts automatically with the server:

```bash
OBSERVATORY_PORT=1729 thoughtbox
```

Access at: `http://localhost:1729`

### Features

- **Live Graph** — Thoughts appear as they're added
- **Snake Layout** — Compact left-to-right with row wrapping
- **Branch Visualization** — Hierarchical display with collapsible branches
- **Click Navigation** — Click nodes to view full content
- **Multi-Session** — Switch between active sessions

### WebSocket Events

Connect via WebSocket to receive events:

```javascript
const ws = new WebSocket('ws://localhost:1729');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'thought_added':
      // New thought with full structure
      console.log('New thought:', message.payload);
      break;

    case 'thought_updated':
      // Revision applied
      console.log('Updated:', message.payload);
      break;

    case 'branch_created':
      // Fork detected
      console.log('Branch:', message.payload);
      break;

    case 'session_loaded':
      // Context switched
      console.log('Session:', message.payload);
      break;
  }
};
```

### Event Payloads

**thought_added:**
```json
{
  "type": "thought_added",
  "payload": {
    "id": "session-123:5",
    "data": {
      "thought": "Analyzing the root cause...",
      "thoughtNumber": 5,
      "totalThoughts": 7,
      "timestamp": "2025-01-15T10:35:00Z"
    },
    "prev": "session-123:4",
    "next": []
  }
}
```

**session_loaded:**
```json
{
  "type": "session_loaded",
  "payload": {
    "id": "session-123",
    "title": "Debug authentication",
    "thoughtCount": 7
  }
}
```

---

## Prometheus Metrics

Thoughtbox exposes metrics for Prometheus scraping.

### Available Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `thoughtbox_thoughts_total` | Counter | Total thoughts recorded |
| `thoughtbox_sessions_total` | Counter | Total sessions created |
| `thoughtbox_branches_total` | Counter | Total branches created |
| `thoughtbox_revisions_total` | Counter | Total revisions made |
| `thoughtbox_critiques_total` | Counter | Total critiques requested |
| `thoughtbox_session_duration_seconds` | Histogram | Session duration |
| `thoughtbox_thoughts_per_session` | Histogram | Thoughts per session |

### Prometheus Configuration

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'thoughtbox'
    static_configs:
      - targets: ['thoughtbox:1731']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### Querying via Observability Gateway

Query metrics programmatically:

```json
{
  "operation": "metrics",
  "args": {
    "query": "thoughtbox_thoughts_total"
  }
}
```

**Time range query:**
```json
{
  "operation": "metrics_range",
  "args": {
    "query": "rate(thoughtbox_thoughts_total[5m])",
    "start": "2025-01-15T10:00:00Z",
    "end": "2025-01-15T12:00:00Z",
    "step": "1m"
  }
}
```

---

## Grafana Dashboards

Pre-built dashboards for reasoning analysis.

### Dashboard: Thoughtbox Overview

Shows:
- Active sessions
- Thoughts per minute
- Branch/revision rates
- Session duration distribution

### Dashboard: Session Deep Dive

Shows:
- Individual session timeline
- Thought progression
- Branch points
- Critique distribution

### Getting Dashboard URLs

```json
{
  "operation": "dashboard_url",
  "args": {
    "name": "thoughtbox-overview"
  }
}
```

**Returns:**
```json
{
  "url": "http://localhost:3001/d/thoughtbox-overview"
}
```

---

## Observability Gateway

The `observability_gateway` tool provides programmatic access to monitoring data. **No initialization required.**

### health

Check system health:

```json
{
  "operation": "health"
}
```

**Returns:**
```json
{
  "status": "healthy",
  "services": {
    "thoughtbox": {
      "status": "up",
      "version": "1.0.0",
      "uptime": 3600
    },
    "prometheus": {
      "status": "up",
      "url": "http://prometheus:9090"
    },
    "grafana": {
      "status": "up",
      "url": "http://localhost:3001"
    }
  },
  "timestamp": "2025-01-15T12:00:00Z"
}
```

### sessions

List active reasoning sessions:

```json
{
  "operation": "sessions",
  "args": {
    "limit": 10,
    "status": "active"
  }
}
```

**Returns:**
```json
{
  "sessions": [
    {
      "id": "debug-auth-2025-01",
      "title": "Debug authentication",
      "status": "active",
      "thoughtCount": 7,
      "lastActivity": "2025-01-15T11:55:00Z"
    }
  ]
}
```

### session_info

Get details for a specific session:

```json
{
  "operation": "session_info",
  "args": {
    "sessionId": "debug-auth-2025-01"
  }
}
```

### alerts

Check Prometheus alerts:

```json
{
  "operation": "alerts",
  "args": {
    "state": "firing"
  }
}
```

**Returns:**
```json
{
  "alerts": [
    {
      "name": "HighThoughtRate",
      "state": "firing",
      "severity": "warning",
      "message": "Thought rate exceeds 10/minute",
      "startsAt": "2025-01-15T11:50:00Z"
    }
  ]
}
```

---

## Docker Compose Setup

Full observability stack:

```yaml
version: '3.8'

services:
  thoughtbox:
    build: .
    ports:
      - "1731:1731"   # HTTP API
      - "1729:1729"   # Observatory WebSocket
    environment:
      - THOUGHTBOX_TRANSPORT=http
      - PROMETHEUS_URL=http://prometheus:9090
      - GRAFANA_URL=http://grafana:3000
    volumes:
      - thoughtbox-data:/data
    networks:
      - observability

  prometheus:
    image: prom/prometheus:v2.45.0
    ports:
      - "9090:9090"
    volumes:
      - ./observability/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - observability

  grafana:
    image: grafana/grafana:10.0.0
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - ./observability/grafana/provisioning:/etc/grafana/provisioning
      - grafana-data:/var/lib/grafana
    networks:
      - observability

  otel-collector:
    image: otel/opentelemetry-collector:0.80.0
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
    volumes:
      - ./observability/otel-collector/config.yaml:/etc/otelcol/config.yaml
    networks:
      - observability

networks:
  observability:
    driver: bridge

volumes:
  thoughtbox-data:
  prometheus-data:
  grafana-data:
```

### Starting the Stack

```bash
docker-compose up -d
```

### Accessing Services

| Service | URL |
|---------|-----|
| Thoughtbox API | http://localhost:1731 |
| Observatory UI | http://localhost:1729 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |

---

## Prometheus Configuration

`observability/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

rule_files:
  - /etc/prometheus/rules/*.yml

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'thoughtbox'
    static_configs:
      - targets: ['thoughtbox:1731']
    metrics_path: '/metrics'
```

### Alert Rules

`observability/prometheus/rules/thoughtbox.yml`:

```yaml
groups:
  - name: thoughtbox
    rules:
      - alert: HighThoughtRate
        expr: rate(thoughtbox_thoughts_total[5m]) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High thought rate detected"
          description: "More than 30 thoughts per minute for 5 minutes"

      - alert: LongSession
        expr: thoughtbox_session_duration_seconds > 3600
        for: 1m
        labels:
          severity: info
        annotations:
          summary: "Long reasoning session"
          description: "Session has been active for over 1 hour"

      - alert: HighBranchRate
        expr: rate(thoughtbox_branches_total[10m]) / rate(thoughtbox_thoughts_total[10m]) > 0.3
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High branching rate"
          description: "More than 30% of thoughts are branches"
```

---

## OpenTelemetry Integration

Thoughtbox supports OpenTelemetry for distributed tracing.

### Configuration

`observability/otel-collector/config.yaml`:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024

exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"

  logging:
    verbosity: detailed

service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus, logging]

    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging]
```

### Enabling in Thoughtbox

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317 \
OTEL_SERVICE_NAME=thoughtbox \
thoughtbox
```

---

## Custom Integrations

### Building a Custom Dashboard

Use the observability gateway to build custom monitoring:

```javascript
// Fetch active sessions
const sessions = await thoughtbox.call('observability_gateway', {
  operation: 'sessions',
  args: { limit: 100 }
});

// Get metrics for each
for (const session of sessions) {
  const info = await thoughtbox.call('observability_gateway', {
    operation: 'session_info',
    args: { sessionId: session.id }
  });

  console.log(`${session.title}: ${info.thoughtCount} thoughts`);
}
```

### Webhook Notifications

Create a simple webhook listener for Observatory events:

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:1729');

ws.on('message', async (data) => {
  const event = JSON.parse(data);

  if (event.type === 'thought_added' && event.payload.data.thoughtNumber === 1) {
    // New session started
    await fetch('https://hooks.slack.com/services/...', {
      method: 'POST',
      body: JSON.stringify({
        text: `New reasoning session: ${event.payload.data.sessionTitle}`
      })
    });
  }
});
```

---

## Troubleshooting

### Observatory Not Connecting

1. Check port availability:
   ```bash
   lsof -i :1729
   ```

2. Verify WebSocket URL:
   ```javascript
   // Correct
   new WebSocket('ws://localhost:1729')

   // Wrong (https)
   new WebSocket('wss://localhost:1729')
   ```

### Metrics Not Appearing

1. Check Prometheus targets:
   - Visit http://localhost:9090/targets
   - Verify thoughtbox target is "UP"

2. Check metrics endpoint:
   ```bash
   curl http://localhost:1731/metrics
   ```

### Grafana Dashboard Empty

1. Verify data source configuration
2. Check time range (default may be too narrow)
3. Ensure Prometheus is receiving data

---

## Next Steps

- [**Architecture**](./architecture.md) — Technical deep-dive
- [**Configuration**](./configuration.md) — Environment settings
- [**Tools Reference**](./tools-reference.md) — API documentation
