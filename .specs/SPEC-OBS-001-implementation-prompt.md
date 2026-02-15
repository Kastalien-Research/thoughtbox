# Implementation Prompt for Claude Code Web

> Copy this entire document and paste it into Claude Code on the web to implement SPEC-OBS-001.

---

## Task

Implement MCP sidecar observability integration for thoughtbox. This adds a transparent proxy (mcp-sidecar-observability) in front of thoughtbox to collect MCP protocol-level metrics, with Prometheus for storage and Grafana for visualization.

## Branch

```bash
git checkout -b feat/mcp-sidecar-observability
```

## Context

**What we're doing**: Wrapping thoughtbox with a sidecar proxy that intercepts all MCP traffic and emits OpenTelemetry metrics. The full stack is:

```
MCP Client → mcp-sidecar (:4000) → thoughtbox (:1731)
                    ↓
            otel-collector → prometheus → grafana
```

**Why**: Currently thoughtbox has no server-side metrics. This gives us visibility into:
- Request rates by MCP method
- Tool call frequency and latency
- Error rates and types
- Connection health

**Source**: The sidecar comes from https://github.com/waldzellai/waldzell-mcp/tree/main/mcp-sidecar-observability

## Files to Create

### 1. `otel-collector/config-with-prometheus.yaml`

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
      - key: user.account_uuid
        action: hash
      - key: user.id
        action: hash
      - key: prompt
        action: delete
      - key: message.content
        action: delete
      - key: thought.content
        action: delete

exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"
    namespace: mcp
  debug:
    verbosity: basic
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

### 2. `observability/prometheus.yml`

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

### 3. `observability/alerts.yml`

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

### 4. `observability/grafana/provisioning/datasources/prometheus.yml`

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

### 5. `observability/grafana/provisioning/dashboards/default.yml`

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

### 6. `observability/grafana/dashboards/thoughtbox-mcp.json`

Fetch the dashboard from:
```
https://raw.githubusercontent.com/waldzellai/waldzell-mcp/main/mcp-sidecar-observability/grafana/dashboards/mcp-observability.json
```

Then update the dashboard JSON:
- Change `"title"` to `"Thoughtbox MCP Observability"`
- Keep everything else as-is (it will work with thoughtbox metrics)

## File to Modify

### `docker-compose.yml`

Replace the entire file with:

```yaml
services:
  # Thoughtbox MCP server (internal only)
  thoughtbox:
    build:
      context: .
      dockerfile: Dockerfile
    image: thoughtbox:local
    expose:
      - "1731"
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
    image: node:20-slim
    working_dir: /app
    command: >
      sh -c "npm install -g @anthropic-ai/mcp-sidecar-observability@latest 2>/dev/null ||
             (git clone --depth 1 https://github.com/waldzellai/waldzell-mcp.git /tmp/waldzell &&
              cd /tmp/waldzell/mcp-sidecar-observability &&
              npm install && npm run build && npm start) ||
             (echo 'Falling back to simple proxy' &&
              npx http-proxy-cli -p 4000 -t http://thoughtbox:1731)"
    environment:
      MCP_UPSTREAM_URL: http://thoughtbox:1731
      MCP_UPSTREAM_NAME: thoughtbox
      MCP_UPSTREAM_TIMEOUT_MS: 60000
      PORT: 4000
      HOST: 0.0.0.0
      OTEL_SERVICE_NAME: thoughtbox-sidecar
      SERVICE_VERSION: 0.2.0
      OTEL_ENV: dev
      OTEL_EXPORTER_OTLP_PROTOCOL: http/protobuf
      OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4318
      OTEL_METRIC_EXPORT_INTERVAL: 10000
      LOG_LEVEL: info
    ports:
      - "4000:4000"
    networks:
      - mcp-network
    depends_on:
      thoughtbox:
        condition: service_healthy
      otel-collector:
        condition: service_started
    restart: unless-stopped

  # OpenTelemetry Collector
  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.113.0
    command: ["--config=/etc/otelcol/config.yaml"]
    volumes:
      - ./otel-collector/config-with-prometheus.yaml:/etc/otelcol/config.yaml:ro
    ports:
      - "4318:4318"
      - "8889:8889"
    networks:
      - mcp-network
    restart: unless-stopped

  # Prometheus
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

  # Grafana
  grafana:
    image: grafana/grafana:11.0.0
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
      GF_SECURITY_ADMIN_USER: admin
    ports:
      - "3001:3000"
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

## Directory Structure

After implementation:

```
thoughtbox/
├── docker-compose.yml              # Updated
├── otel-collector/
│   ├── config.yaml                 # Existing (keep)
│   ├── config-with-prometheus.yaml # New
│   └── enable-telemetry.sh         # Existing (keep)
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

## Testing

After creating all files:

```bash
# Build and start
docker compose up --build -d

# Wait for services to start
sleep 30

# Test MCP endpoint through sidecar
curl -X POST http://localhost:4000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}'

# Check Prometheus is scraping metrics
curl -s http://localhost:9090/api/v1/query?query=up | jq

# Open Grafana
echo "Grafana: http://localhost:3001 (admin/admin)"

# Check logs if something fails
docker compose logs mcp-sidecar
docker compose logs otel-collector
```

## Commit

```bash
git add .
git commit -m "feat: Add MCP sidecar observability integration

- Add mcp-sidecar-observability as transparent proxy
- Configure OTEL collector with Prometheus exporter
- Add Prometheus with thoughtbox-specific alerts
- Add Grafana with MCP dashboard
- MCP clients now connect to :4000, forwarded to thoughtbox :1731

Metrics available:
- mcp_requests_total (by method, status)
- mcp_tool_calls_total (by tool_name)
- mcp_request_duration_seconds
- mcp_upstream_available

Access:
- MCP endpoint: http://localhost:4000
- Observatory: http://localhost:1729
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)"
```

## Notes

- The mcp-sidecar-observability package may not be published to npm yet, so the docker-compose uses a fallback that clones and builds from source
- Port 3001 is used for Grafana to avoid conflicts with local development servers on 3000
- Observatory WebSocket remains on port 1729 (unchanged)
- The existing `otel-collector/config.yaml` is preserved for Claude Code CLI telemetry

---

**Full spec**: `.specs/SPEC-OBS-001-mcp-sidecar-integration.md`
