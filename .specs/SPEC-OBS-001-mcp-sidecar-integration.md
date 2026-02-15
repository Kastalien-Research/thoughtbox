# SPEC-OBS-001: MCP Sidecar Observability Integration

> **Status**: Draft
> **Priority**: P1 (Enhancement)
> **Dependencies**: None (external mcp-sidecar-observability repo)
> **Branch**: `feat/mcp-sidecar-observability`
> **Implementation Target**: Claude Code Web

## Summary

Integrate the [mcp-sidecar-observability](https://github.com/waldzellai/waldzell-mcp/tree/main/mcp-sidecar-observability) project as a transparent proxy in front of thoughtbox to add MCP protocol-level observability. This provides metrics for every MCP method call, tool invocation, resource access, and connection lifecycle.

## Motivation

Currently, thoughtbox has:
- OTEL collector configured for Claude Code CLI telemetry (client-side)
- No server-side MCP protocol instrumentation
- No visibility into tool call frequency, latency, or error rates

The mcp-sidecar-observability project provides:
- Protocol-aware metrics (`mcp_requests_total`, `mcp_tool_calls_total`, etc.)
- Pre-built Grafana dashboards
- Prometheus alerting rules
- PII protection in the collector
- Zero code changes to the upstream server

## Architecture

```
┌─────────────────┐     ┌─────────────────────────┐     ┌─────────────────┐
│  MCP Client     │────▶│  mcp-sidecar (:4000)    │────▶│  thoughtbox     │
│  (Claude Code,  │     │  - Intercept JSON-RPC   │     │  (:1731)        │
│   Agent SDK)    │     │  - Record OTel metrics  │     │                 │
└─────────────────┘     └─────────────────────────┘     └─────────────────┘
                                    │
                                    │ OTLP
                                    ▼
                        ┌─────────────────────────┐
                        │  otel-collector (:4318) │
                        │  - Batch & sanitize     │
                        │  - Export to Prometheus │
                        └─────────────────────────┘
                                    │
                                    ▼
                        ┌─────────────────────────┐
                        │  prometheus (:9090)     │
                        │  - Metrics storage      │
                        │  - Alerting rules       │
                        └─────────────────────────┘
                                    │
                                    ▼
                        ┌─────────────────────────┐
                        │  grafana (:3000)        │
                        │  - MCP dashboard        │
                        │  - Alerting UI          │
                        └─────────────────────────┘
```

## Design

### Port Allocation

| Service | Internal Port | External Port | Purpose |
|---------|--------------|---------------|---------|
| thoughtbox | 1731 | (none - internal) | MCP server |
| mcp-sidecar | 4000 | 4000 | Public MCP endpoint |
| observatory | 1729 | 1729 | WebSocket for UI |
| otel-collector | 4318, 8889 | 4318 | OTLP receiver, Prometheus exporter |
| prometheus | 9090 | 9090 | Metrics UI |
| grafana | 3000 | 3001 | Dashboard UI (avoid conflict with local dev) |

### Docker Compose Changes

**Replace** the current `docker-compose.yml` with an expanded version that includes the full observability stack.

```yaml
# docker-compose.yml

services:
  # Thoughtbox MCP server (internal only)
  thoughtbox:
    build:
      context: .
      dockerfile: Dockerfile
    image: thoughtbox:local
    expose:
      - "1731"  # Internal only, not published
    ports:
      - "1729:1729"  # Observatory still public
    environment:
      NODE_ENV: production
      PORT: 1731
      THOUGHTBOX_DATA_DIR: /data/thoughtbox
      THOUGHTBOX_PROJECT: _default
      THOUGHTBOX_TRANSPORT: http
      THOUGHTBOX_OBSERVATORY_ENABLED: "true"
      THOUGHTBOX_OBSERVATORY_PORT: 1729
      THOUGHTBOX_OBSERVATORY_CORS: "*"
    volumes:
      - thoughtbox-data:/data/thoughtbox
    networks:
      - mcp-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:1731/health').catch(()=>process.exit(1))"]
      interval: 10s
      timeout: 5s
      retries: 3

  # MCP Observability Sidecar (public MCP endpoint)
  mcp-sidecar:
    image: ghcr.io/waldzellai/mcp-sidecar-observability:latest
    # Or build from source:
    # build:
    #   context: ./mcp-sidecar-observability
    environment:
      # Upstream: thoughtbox
      MCP_UPSTREAM_URL: http://thoughtbox:1731
      MCP_UPSTREAM_NAME: thoughtbox
      MCP_UPSTREAM_TIMEOUT_MS: 60000  # Longer timeout for reasoning sessions

      # Listen
      PORT: 4000
      HOST: 0.0.0.0

      # OpenTelemetry
      OTEL_SERVICE_NAME: thoughtbox-sidecar
      SERVICE_VERSION: 0.2.0
      OTEL_ENV: dev
      OTEL_EXPORTER_OTLP_PROTOCOL: http/protobuf
      OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4318
      OTEL_METRIC_EXPORT_INTERVAL: 10000

      LOG_LEVEL: info
    ports:
      - "4000:4000"  # Public MCP endpoint
    networks:
      - mcp-network
    depends_on:
      thoughtbox:
        condition: service_healthy
      otel-collector:
        condition: service_started
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:4000/health').catch(()=>process.exit(1))"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  # OpenTelemetry Collector (upgraded config)
  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.113.0
    command: ["--config=/etc/otelcol/config.yaml"]
    volumes:
      - ./otel-collector/config-with-prometheus.yaml:/etc/otelcol/config.yaml:ro
    ports:
      - "4318:4318"  # OTLP HTTP
      - "8889:8889"  # Prometheus exporter
    networks:
      - mcp-network
    restart: unless-stopped

  # Prometheus (metrics storage)
  prometheus:
    image: prom/prometheus:v2.52.0
    volumes:
      - ./observability/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./observability/alerts.yml:/etc/prometheus/alerts.yml:ro
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - mcp-network
    depends_on:
      - otel-collector
    restart: unless-stopped

  # Grafana (visualization)
  grafana:
    image: grafana/grafana:11.0.0
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
      GF_SECURITY_ADMIN_USER: admin
    ports:
      - "3001:3000"  # Port 3001 to avoid conflicts
    volumes:
      - ./observability/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./observability/grafana/dashboards:/var/lib/grafana/dashboards:ro
      - grafana-data:/var/lib/grafana
    networks:
      - mcp-network
    depends_on:
      - prometheus
    restart: unless-stopped

networks:
  mcp-network:
    driver: bridge

volumes:
  thoughtbox-data:
  prometheus-data:
  grafana-data:
```

### New Configuration Files

#### 1. `otel-collector/config-with-prometheus.yaml`

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: "0.0.0.0:4318"
      grpc:
        endpoint: "0.0.0.0:4317"

processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: 512
  batch:
    timeout: 1s
  attributes/sanitize:
    actions:
      # Hash user identifiers
      - key: user.account_uuid
        action: hash
      - key: user.id
        action: hash
      # Delete sensitive content
      - key: prompt
        action: delete
      - key: message.content
        action: delete
      - key: thought.content
        action: delete

exporters:
  # Prometheus exporter for Grafana
  prometheus:
    endpoint: "0.0.0.0:8889"
    namespace: mcp
  # Debug output for development
  debug:
    verbosity: basic
  # File exporter for Claude Code CLI telemetry (existing)
  file/logs:
    path: /tmp/claude-code-events.jsonl
    rotation:
      max_megabytes: 100
      max_days: 7
  file/metrics:
    path: /tmp/claude-code-metrics.jsonl
    rotation:
      max_megabytes: 50
      max_days: 7

service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch, attributes/sanitize]
      exporters: [prometheus, file/metrics]
    logs:
      receivers: [otlp]
      processors: [batch, attributes/sanitize]
      exporters: [debug, file/logs]
```

#### 2. `observability/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - alerts.yml

scrape_configs:
  - job_name: "otelcol-thoughtbox"
    static_configs:
      - targets: ["otel-collector:8889"]
```

#### 3. `observability/alerts.yml`

```yaml
groups:
- name: thoughtbox-mcp
  rules:
  - alert: ThoughtboxHighErrorRate
    expr: sum(rate(mcp_requests_total{status="error", server_name="thoughtbox"}[5m])) / sum(rate(mcp_requests_total{server_name="thoughtbox"}[5m])) > 0.05
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Thoughtbox error rate > 5%"
      description: "Error rate is {{ $value | humanizePercentage }}"

  - alert: ThoughtboxLatencyP95High
    expr: histogram_quantile(0.95, sum by (le) (rate(mcp_request_duration_seconds_bucket{server_name="thoughtbox"}[10m]))) > 5
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "Thoughtbox p95 latency > 5s"
      description: "P95 latency is {{ $value }}s"

  - alert: ThoughtboxDown
    expr: mcp_upstream_available{server_name="thoughtbox"} == 0
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Thoughtbox MCP server is DOWN"
      description: "Upstream thoughtbox server is not responding"

  - alert: ThoughtboxToolCallSlow
    expr: histogram_quantile(0.95, sum by (le, tool_name) (rate(mcp_tool_duration_seconds_bucket{server_name="thoughtbox"}[10m]))) > 10
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Tool {{ $labels.tool_name }} p95 > 10s"
      description: "Tool call latency is {{ $value }}s"
```

#### 4. `observability/grafana/provisioning/datasources/prometheus.yml`

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
```

#### 5. `observability/grafana/provisioning/dashboards/default.yml`

```yaml
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    options:
      path: /var/lib/grafana/dashboards
```

#### 6. `observability/grafana/dashboards/thoughtbox-mcp.json`

Copy the dashboard from `mcp-sidecar-observability/grafana/dashboards/mcp-observability.json` and customize:
- Update title to "Thoughtbox MCP Observability"
- Filter by `server_name="thoughtbox"`
- Add thought-specific panels if desired

### Directory Structure

```
thoughtbox/
├── docker-compose.yml              # Updated with full stack
├── otel-collector/
│   ├── config.yaml                 # Existing (keep for CLI telemetry)
│   ├── config-with-prometheus.yaml # New: adds Prometheus exporter
│   └── enable-telemetry.sh         # Existing
└── observability/                  # New directory
    ├── prometheus.yml
    ├── alerts.yml
    └── grafana/
        ├── provisioning/
        │   ├── datasources/
        │   │   └── prometheus.yml
        │   └── dashboards/
        │       └── default.yml
        └── dashboards/
            └── thoughtbox-mcp.json
```

## Metrics Available After Integration

### Protocol Metrics
| Metric | Description |
|--------|-------------|
| `mcp_requests_total{method, server_name, status}` | Request count by method |
| `mcp_request_duration_seconds{method, server_name}` | Request latency histogram |
| `mcp_active_connections{server_name}` | Current active connections |
| `mcp_protocol_errors_total{error_code, method}` | Protocol error count |
| `mcp_message_bytes_total{direction, server_name}` | Throughput |

### Tool Metrics
| Metric | Description |
|--------|-------------|
| `mcp_tool_calls_total{tool_name, server_name, status}` | Tool call count |
| `mcp_tool_duration_seconds{tool_name, server_name}` | Tool execution time |
| `mcp_tools_listed_total{server_name}` | tools/list call count |

### Resource Metrics
| Metric | Description |
|--------|-------------|
| `mcp_resource_reads_total{resource_uri, server_name}` | Resource read count |
| `mcp_resources_listed_total{server_name}` | resources/list call count |

### Health Metrics
| Metric | Description |
|--------|-------------|
| `mcp_upstream_available{server_name}` | 1 if upstream is healthy, 0 otherwise |

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `docker-compose.yml` | Modify | Add sidecar, prometheus, grafana services |
| `otel-collector/config-with-prometheus.yaml` | Create | Collector config with Prometheus exporter |
| `observability/prometheus.yml` | Create | Prometheus scrape config |
| `observability/alerts.yml` | Create | Alerting rules |
| `observability/grafana/provisioning/datasources/prometheus.yml` | Create | Grafana datasource |
| `observability/grafana/provisioning/dashboards/default.yml` | Create | Dashboard provisioning |
| `observability/grafana/dashboards/thoughtbox-mcp.json` | Create | MCP dashboard (copy from sidecar repo) |
| `README.md` | Modify | Add observability documentation |

## Test Scenarios

1. **Sidecar Proxy Works**
   - Start stack with `docker compose up`
   - Connect MCP client to `http://localhost:4000`
   - Verify requests reach thoughtbox and responses return

2. **Metrics Collected**
   - Make several MCP requests (initialize, tools/list, tools/call)
   - Check Prometheus at `http://localhost:9090`
   - Query `mcp_requests_total{server_name="thoughtbox"}`
   - Verify counts match requests made

3. **Dashboard Displays Data**
   - Open Grafana at `http://localhost:3001`
   - Login (admin/admin)
   - Open "Thoughtbox MCP Observability" dashboard
   - Verify panels show data

4. **Alerts Fire**
   - Stop thoughtbox container
   - Wait 2+ minutes
   - Check Prometheus alerts page
   - Verify `ThoughtboxDown` alert fires

5. **PII Sanitization**
   - Send request with user identifier
   - Check collector debug output
   - Verify `user.account_uuid` is hashed, not plaintext

## Acceptance Criteria

- [ ] MCP clients can connect to port 4000 and use thoughtbox normally
- [ ] Observatory WebSocket (port 1729) remains functional
- [ ] Prometheus scrapes metrics successfully
- [ ] Grafana dashboard shows MCP metrics
- [ ] Alert rules are loaded in Prometheus
- [ ] No sensitive data (thoughts, prompts) exported in metrics
- [ ] `docker compose up` starts all services with correct dependencies
- [ ] README documents how to access Grafana and interpret metrics

## Implementation Notes for Claude Code Web

### Branch Setup
```bash
git checkout -b feat/mcp-sidecar-observability
```

### Implementation Order
1. Create `observability/` directory structure
2. Create Prometheus and Grafana config files
3. Create new OTEL collector config
4. Update `docker-compose.yml`
5. Copy dashboard JSON from sidecar repo
6. Test the full stack
7. Update README with observability section

### Dashboard Source
The Grafana dashboard can be fetched from:
```
https://raw.githubusercontent.com/waldzellai/waldzell-mcp/main/mcp-sidecar-observability/grafana/dashboards/mcp-observability.json
```

### Sidecar Image
The sidecar can be:
1. Built from the waldzell-mcp repo (if you want local modifications)
2. Referenced as a GitHub Container Registry image (once published)
3. For initial implementation, use `build:` with a git submodule or cloned directory

### Local Testing
```bash
# Start full stack
docker compose up --build

# Test MCP endpoint
curl -X POST http://localhost:4000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}'

# Check Prometheus
open http://localhost:9090

# Check Grafana
open http://localhost:3001
```

## Future Enhancements

- **Distributed Tracing**: Add span export for request tracing across sidecar → thoughtbox
- **Log Export**: Send structured logs to Loki for correlation
- **Custom Thoughtbox Metrics**: Add thought-specific metrics (thought count, session duration)
- **Multi-Server**: Support wrapping multiple MCP servers with server_name labels
- **Alertmanager**: Add alertmanager service for notification routing

## References

- [mcp-sidecar-observability repo](https://github.com/waldzellai/waldzell-mcp/tree/main/mcp-sidecar-observability)
- [OpenTelemetry Collector docs](https://opentelemetry.io/docs/collector/)
- [Prometheus documentation](https://prometheus.io/docs/)
- [Grafana provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/)
