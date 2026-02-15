# SPEC-OBS-001 Addendum: Observability Gateway Tool

> **Status**: Draft
> **Parent Spec**: SPEC-OBS-001-mcp-sidecar-integration.md
> **Purpose**: Define a dedicated `observability_gateway` MCP tool for querying metrics and system health

---

## Summary

Add a new `observability_gateway` tool to thoughtbox that provides operators and agents with access to observability data (metrics, health, sessions, alerts). This is separate from `thoughtbox_gateway` because the use cases and access patterns are fundamentally different.

## Rationale

| Aspect | thoughtbox_gateway | observability_gateway |
|--------|-------------------|----------------------|
| **User** | Agent doing reasoning | Operator monitoring system |
| **Flow** | init → cipher → thought | direct query |
| **State** | Session-scoped | System-wide |
| **Progressive Disclosure** | Yes (stages 0→1→2) | No |
| **Purpose** | Structured reasoning | System observability |

Keeping these separate:
- Avoids bloating thoughtbox_gateway with unrelated operations
- Removes need for cipher/init before checking metrics
- Cleaner mental model for both tools

## Tool Definition

### Tool Name
```
observability_gateway
```

### Tool Description
```
Query system observability data including metrics, health status, active sessions,
and alerts. No session initialization required - connect and query directly.
```

### Operations

| Operation | Description | Parameters |
|-----------|-------------|------------|
| `health` | System and service health check | `services?: string[]` |
| `metrics` | Query Prometheus metrics | `query: string`, `time?: string` |
| `metrics_range` | Query metrics over time range | `query: string`, `start: string`, `end: string`, `step?: string` |
| `sessions` | List active reasoning sessions | `limit?: number`, `status?: 'active' \| 'idle' \| 'all'` |
| `session_info` | Get details about a specific session | `sessionId: string` |
| `alerts` | Get active/firing alerts | `state?: 'firing' \| 'pending' \| 'all'` |
| `dashboard_url` | Get Grafana dashboard URL | `dashboard?: string` |

### Input Schema (JSON Schema)

```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": ["health", "metrics", "metrics_range", "sessions", "session_info", "alerts", "dashboard_url"],
      "description": "The observability operation to perform"
    },
    "args": {
      "type": "object",
      "description": "Operation-specific arguments",
      "properties": {
        "query": {
          "type": "string",
          "description": "PromQL query for metrics operations"
        },
        "time": {
          "type": "string",
          "description": "Evaluation timestamp (RFC3339 or Unix timestamp)"
        },
        "start": {
          "type": "string",
          "description": "Range query start time"
        },
        "end": {
          "type": "string",
          "description": "Range query end time"
        },
        "step": {
          "type": "string",
          "description": "Query resolution step (e.g., '15s', '1m')"
        },
        "sessionId": {
          "type": "string",
          "description": "Session ID for session_info operation"
        },
        "services": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Filter health check to specific services"
        },
        "limit": {
          "type": "number",
          "description": "Maximum number of results"
        },
        "status": {
          "type": "string",
          "enum": ["active", "idle", "all"],
          "description": "Filter sessions by status"
        },
        "state": {
          "type": "string",
          "enum": ["firing", "pending", "all"],
          "description": "Filter alerts by state"
        },
        "dashboard": {
          "type": "string",
          "description": "Dashboard name for URL generation"
        }
      }
    }
  },
  "required": ["operation"]
}
```

## Operation Details

### `health`

Check health of thoughtbox and related services.

**Request:**
```json
{
  "operation": "health",
  "args": {
    "services": ["thoughtbox", "sidecar", "prometheus", "grafana"]
  }
}
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-19T15:30:00Z",
  "services": {
    "thoughtbox": {
      "status": "healthy",
      "uptime": "2h 15m",
      "version": "1.0.0"
    },
    "sidecar": {
      "status": "healthy",
      "upstream_available": true,
      "active_connections": 3
    },
    "prometheus": {
      "status": "healthy",
      "targets_up": 1,
      "targets_total": 1
    },
    "grafana": {
      "status": "healthy",
      "version": "11.0.0",
      "database": "ok"
    }
  }
}
```

> **Implementation Note:** Grafana health is checked via `GET /api/health` which returns `{ "commit", "database", "version" }`.

### `metrics`

Query Prometheus metrics using PromQL (instant query).

**Request:**
```json
{
  "operation": "metrics",
  "args": {
    "query": "mcp_requests_total{server_name=\"thoughtbox\"}"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "resultType": "vector",
    "result": [
      {
        "metric": {
          "__name__": "mcp_requests_total",
          "method": "tools/call",
          "server_name": "thoughtbox",
          "status": "success"
        },
        "value": [1705678200, "1523"]
      }
    ]
  }
}
```

### `metrics_range`

Query Prometheus metrics over a time range.

**Request:**
```json
{
  "operation": "metrics_range",
  "args": {
    "query": "rate(mcp_requests_total{server_name=\"thoughtbox\"}[5m])",
    "start": "2026-01-19T14:00:00Z",
    "end": "2026-01-19T15:00:00Z",
    "step": "1m"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "resultType": "matrix",
    "result": [
      {
        "metric": {
          "__name__": "mcp_requests_total",
          "server_name": "thoughtbox"
        },
        "values": [
          [1705672800, "2.5"],
          [1705672860, "2.7"],
          [1705672920, "2.4"]
        ]
      }
    ]
  }
}
```

> **Note:** Range queries return `values` (array of [timestamp, value] pairs), while instant queries return `value` (single pair).

### `sessions`

List active reasoning sessions from thoughtbox.

**Request:**
```json
{
  "operation": "sessions",
  "args": {
    "limit": 10,
    "status": "active"
  }
}
```

**Response:**
```json
{
  "sessions": [
    {
      "id": "sess_abc123",
      "title": "Debugging API timeout",
      "thoughtCount": 15,
      "branchCount": 2,
      "createdAt": "2026-01-19T14:00:00Z",
      "lastActivity": "2026-01-19T15:25:00Z",
      "status": "active"
    }
  ],
  "total": 1
}
```

### `session_info`

Get detailed information about a specific session.

**Request:**
```json
{
  "operation": "session_info",
  "args": {
    "sessionId": "sess_abc123"
  }
}
```

**Response:**
```json
{
  "id": "sess_abc123",
  "title": "Debugging API timeout",
  "thoughtCount": 15,
  "branchCount": 2,
  "tags": ["debugging", "api"],
  "createdAt": "2026-01-19T14:00:00Z",
  "lastActivity": "2026-01-19T15:25:00Z",
  "metrics": {
    "avgThoughtDuration": "2.3s",
    "revisionsCount": 3,
    "convergenceScore": 0.85
  }
}
```

### `alerts`

Get active Prometheus alerts.

**Request:**
```json
{
  "operation": "alerts",
  "args": {
    "state": "firing"
  }
}
```

**Response (normalized):**
```json
{
  "alerts": [
    {
      "name": "ThoughtboxLatencyP95High",
      "state": "firing",
      "severity": "warning",
      "summary": "Thoughtbox p95 latency > 5s",
      "activeAt": "2026-01-19T15:20:00Z",
      "value": "7.2"
    }
  ],
  "firing": 1,
  "pending": 0
}
```

> **Note:** This response is normalized for agent consumption. The raw Prometheus `/api/v1/alerts` response uses nested `labels` (containing `alertname`, `severity`) and `annotations` (containing `summary`, `description`). We flatten these for easier parsing.

### `dashboard_url`

Get URL to Grafana dashboard.

**Request:**
```json
{
  "operation": "dashboard_url",
  "args": {
    "dashboard": "thoughtbox-mcp"
  }
}
```

**Response:**
```json
{
  "url": "http://localhost:3001/d/thoughtbox-mcp/thoughtbox-mcp-observability",
  "dashboard": "thoughtbox-mcp"
}
```

## Implementation

### File Structure

```
src/
├── observability/
│   ├── gateway-handler.ts      # Main gateway handler
│   ├── operations/
│   │   ├── health.ts           # Health check logic
│   │   ├── metrics.ts          # Prometheus query wrapper
│   │   ├── sessions.ts         # Session listing from storage
│   │   └── alerts.ts           # Alert query from Prometheus
│   └── prometheus-client.ts    # HTTP client for Prometheus API
```

### Gateway Handler

```typescript
// src/observability/gateway-handler.ts

import { z } from 'zod';

const ObservabilityOperationSchema = z.enum([
  'health',
  'metrics',
  'metrics_range',
  'sessions',
  'session_info',
  'alerts',
  'dashboard_url'
]);

const ObservabilityArgsSchema = z.object({
  query: z.string().optional(),
  time: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  step: z.string().optional(),
  sessionId: z.string().optional(),
  services: z.array(z.string()).optional(),
  limit: z.number().optional(),
  status: z.enum(['active', 'idle', 'all']).optional(),
  state: z.enum(['firing', 'pending', 'all']).optional(),
  dashboard: z.string().optional(),
}).optional();

const ObservabilityInputSchema = z.object({
  operation: ObservabilityOperationSchema,
  args: ObservabilityArgsSchema,
});

export class ObservabilityGatewayHandler {
  private prometheusUrl: string;
  private grafanaUrl: string;
  private storage: ThoughtboxStorage;

  constructor(config: ObservabilityConfig) {
    this.prometheusUrl = config.prometheusUrl || 'http://prometheus:9090';
    this.grafanaUrl = config.grafanaUrl || 'http://localhost:3001';
    this.storage = config.storage;
  }

  async handle(input: unknown): Promise<ToolResult> {
    const validated = ObservabilityInputSchema.parse(input);
    const { operation, args = {} } = validated;

    switch (operation) {
      case 'health':
        return this.handleHealth(args);
      case 'metrics':
        return this.handleMetrics(args);
      case 'metrics_range':
        return this.handleMetricsRange(args);
      case 'sessions':
        return this.handleSessions(args);
      case 'session_info':
        return this.handleSessionInfo(args);
      case 'alerts':
        return this.handleAlerts(args);
      case 'dashboard_url':
        return this.handleDashboardUrl(args);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  // ... operation implementations
}
```

### Tool Registration

```typescript
// In src/server-factory.ts or similar

server.tool(
  'observability_gateway',
  'Query system observability data including metrics, health status, active sessions, and alerts. No session initialization required.',
  {
    operation: {
      type: 'string',
      enum: ['health', 'metrics', 'metrics_range', 'sessions', 'session_info', 'alerts', 'dashboard_url'],
      description: 'The observability operation to perform'
    },
    args: {
      type: 'object',
      description: 'Operation-specific arguments'
    }
  },
  async (input) => observabilityHandler.handle(input)
);
```

### Configuration

Add to environment variables:

```bash
# Observability gateway config
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://localhost:3001
OBSERVABILITY_ENABLED=true
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/observability/gateway-handler.ts` | Create | Main gateway handler |
| `src/observability/operations/health.ts` | Create | Health check implementation |
| `src/observability/operations/metrics.ts` | Create | Prometheus query wrapper |
| `src/observability/operations/sessions.ts` | Create | Session listing |
| `src/observability/operations/alerts.ts` | Create | Alert queries |
| `src/observability/prometheus-client.ts` | Create | Prometheus HTTP client |
| `src/server-factory.ts` | Modify | Register observability_gateway tool |
| `src/index.ts` | Modify | Initialize observability handler |

## Test Scenarios

1. **Health Check**
   - Call `health` operation
   - Verify all services report status
   - Simulate service down, verify unhealthy status

2. **Metrics Query**
   - Call `metrics` with valid PromQL
   - Verify response matches Prometheus API format
   - Call with invalid query, verify error handling

3. **Session Listing**
   - Create some thoughtbox sessions
   - Call `sessions` operation
   - Verify sessions returned with correct metadata

4. **Alerts**
   - Trigger an alert condition
   - Call `alerts` operation
   - Verify alert appears in response

## Acceptance Criteria

- [ ] `observability_gateway` tool registered and callable
- [ ] All 7 operations implemented and working
- [ ] Prometheus queries work for instant and range queries
- [ ] Session listing pulls from thoughtbox storage
- [ ] Alerts reflect actual Prometheus alert state
- [ ] No authentication required (or configurable)
- [ ] Graceful error handling when Prometheus unavailable

## API References (Source of Truth)

This spec is based on the following official documentation:

| API | Documentation | Notes |
|-----|---------------|-------|
| **Prometheus HTTP API** | https://prometheus.io/docs/prometheus/latest/querying/api/ | Query and alerts endpoints |
| **Grafana HTTP API** | https://grafana.com/docs/grafana/latest/developers/http_api/ | Dashboard, health, alerting |

### OpenAPI Specifications

| Format | URL |
|--------|-----|
| **Grafana OpenAPI v2** | https://raw.githubusercontent.com/grafana/grafana/main/public/api-merged.json |
| **Grafana OpenAPI v3** | https://raw.githubusercontent.com/grafana/grafana/main/public/openapi3.json |
| **Interactive Explorer** | `http://<grafana-host>/swagger-ui` (on any Grafana instance) |

### Prometheus API Endpoints Used

| Our Operation | Prometheus Endpoint | Method |
|---------------|---------------------|--------|
| `metrics` | `/api/v1/query` | GET/POST |
| `metrics_range` | `/api/v1/query_range` | GET/POST |
| `alerts` | `/api/v1/alerts` | GET |

### Grafana API Endpoints

| Purpose | Endpoint | Response |
|---------|----------|----------|
| **Health check** | `GET /api/health` | `{ "commit": "...", "database": "ok", "version": "11.0.0" }` |
| **Dashboard by UID** | `GET /apis/dashboard.grafana.app/v1beta1/namespaces/:ns/dashboards/:uid` | Full dashboard spec |
| **List dashboards** | `GET /apis/dashboard.grafana.app/v1beta1/namespaces/:ns/dashboards` | Paginated list |
| **Active alerts** | `GET /api/alertmanager/grafana/api/v2/alerts` | Firing alerts |
| **Alert rules + state** | `GET /api/prometheus/grafana/api/v1/rules` | Rules with pending/firing state |

### Grafana URL Patterns

| Type | Pattern | Example |
|------|---------|---------|
| **Dashboard view** | `/d/<uid>/<slug>` | `/d/thoughtbox-mcp/thoughtbox-mcp-observability` |
| **Dashboard edit** | `/d/<uid>/<slug>?editPanel=<id>` | For panel editing |
| **Explore** | `/explore` | Ad-hoc queries |
| **Alerting** | `/alerting/list` | Alert rules list |

## Example Agent Usage

```
Agent: I want to check if thoughtbox is healthy and see recent request rates.

// Call 1: Health check
{
  "operation": "health"
}

// Response shows all services healthy

// Call 2: Check request rate
{
  "operation": "metrics",
  "args": {
    "query": "rate(mcp_requests_total{server_name=\"thoughtbox\"}[5m])"
  }
}

// Response shows 2.5 requests/second

Agent: The system is healthy with moderate load of ~2.5 req/s.
```

---

## Implementation Prompt for Claude Code Web

Copy everything below this line and add it to your implementation session:

---

### Additional Task: Observability Gateway Tool

After implementing the base SPEC-OBS-001 (sidecar + prometheus + grafana), also implement the `observability_gateway` MCP tool.

**Create these files:**

1. `src/observability/gateway-handler.ts` - Main handler with operation dispatch
2. `src/observability/prometheus-client.ts` - HTTP client for Prometheus API
3. `src/observability/operations/health.ts` - Health check logic
4. `src/observability/operations/metrics.ts` - Prometheus query wrapper
5. `src/observability/operations/sessions.ts` - List sessions from storage
6. `src/observability/operations/alerts.ts` - Query alerts from Prometheus

**Modify:**
- `src/server-factory.ts` - Register the `observability_gateway` tool
- `src/index.ts` - Initialize the ObservabilityGatewayHandler

**Key points:**
- No progressive disclosure needed - tool is always available
- Uses Prometheus HTTP API at `http://prometheus:9090/api/v1/`
- Session listing reuses existing ThoughtboxStorage
- All operations are read-only (no mutations)

**Environment variables to add:**
```
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://localhost:3001
```

**Commit message:**
```
feat: Add observability_gateway MCP tool

New tool for querying observability data:
- health: System and service health check
- metrics: Instant Prometheus queries
- metrics_range: Range queries over time
- sessions: List active reasoning sessions
- session_info: Details about specific session
- alerts: Active/firing Prometheus alerts
- dashboard_url: Grafana dashboard links

No session init required - direct query access.
```
