# Observability - Behavioral Tests

Workflows for verifying the `observability_gateway` MCP tool.

**Tool:** `observability_gateway`
**Operations (7):** `health`, `metrics`, `metrics_range`, `sessions`, `session_info`, `alerts`, `dashboard_url`
**Required stage:** None — always available (no progressive disclosure)

**Dependencies:** Prometheus (for metrics/alerts), Grafana (for dashboard URLs), Thoughtbox server (for session data)

---

## OB-001: health — All Services

**Goal:** Verify health check returns status for all default services.

**Steps:**
1. Call `observability_gateway` with `{ operation: "health" }`
2. Verify response includes health status for default services:
   - `thoughtbox` — server health
   - `sidecar` — MCP sidecar (if running)
   - `prometheus` — metrics backend
   - `grafana` — dashboards
3. Each service should have:
   - `status` (`"healthy"`, `"unhealthy"`, or `"unknown"`)
   - Additional context (e.g., version, uptime, or error message)

**Expected:** Health status returned for all 4 default services

---

## OB-002: health — Filtered Services

**Goal:** Verify health check filters to specific services only.

**Steps:**
1. Call `{ operation: "health", args: { services: ["thoughtbox", "prometheus"] } }`
2. Verify only `thoughtbox` and `prometheus` health returned
3. Verify `grafana` and `sidecar` are NOT in the response
4. Call with `{ services: ["thoughtbox"] }`
5. Verify only `thoughtbox` health returned

**Expected:** Only requested services checked

---

## OB-003: metrics — Instant Query

**Goal:** Verify instant PromQL query execution.

**Steps:**
1. Call `{ operation: "metrics", args: { query: "up" } }`
2. Verify response includes:
   - Query result data (metric name, labels, value)
   - `resultType` (typically `"vector"`)
3. If Prometheus is not running, verify a clear error (not a crash)

**Expected:** PromQL query executed, results returned (or clear connection error)

---

## OB-004: metrics_range — Range Query

**Goal:** Verify range query with start/end/step parameters.

**Steps:**
1. Call:
   ```json
   {
     "operation": "metrics_range",
     "args": {
       "query": "up",
       "start": "2025-01-01T00:00:00Z",
       "end": "2025-01-01T01:00:00Z",
       "step": "15m"
     }
   }
   ```
2. Verify response includes:
   - Time series data points
   - `resultType` (typically `"matrix"`)
   - Multiple values across the time range
3. If Prometheus has no data for the range, verify empty result (not error)

**Expected:** Range query returns time series data or empty result

---

## OB-005: sessions — List Active Sessions

**Goal:** Verify listing active reasoning sessions from storage.

**Steps:**
1. Ensure at least one session exists (create one via `thoughtbox_gateway` if needed)
2. Call `{ operation: "sessions" }`
3. Verify response includes:
   - `sessions` array
   - `total` count
   - Each session has: `id`, `title`, `status` (`"active"` or `"idle"`)
4. Active sessions are those accessed within 30 minutes

**Expected:** Session list with activity status

---

## OB-006: sessions — Status Filter

**Goal:** Verify filtering sessions by status.

**Steps:**
1. Call `{ operation: "sessions", args: { status: "active" } }`
2. Verify only sessions with recent activity returned
3. Call `{ operation: "sessions", args: { status: "idle" } }`
4. Verify only sessions without recent activity returned
5. Call `{ operation: "sessions", args: { status: "all" } }`
6. Verify all sessions returned regardless of activity

**Expected:** Status filter correctly partitions sessions by activity threshold (30 min)

---

## OB-007: session_info — Specific Session

**Goal:** Verify getting details for a specific session.

**Steps:**
1. Get a session ID from `sessions` operation
2. Call `{ operation: "session_info", args: { sessionId: "<id>" } }`
3. Verify response includes:
   - Session metadata (id, title, tags)
   - Thought count
   - Activity metrics (revisions count)
   - Status (`"active"` or `"idle"`)
   - Timestamps

**Expected:** Detailed session info with metrics

---

## OB-008: alerts — Active Alerts

**Goal:** Verify returning active and pending Prometheus alerts.

**Steps:**
1. Call `{ operation: "alerts" }`
2. Verify response includes:
   - `alerts` array (may be empty)
   - `firingCount` (integer ≥ 0)
   - `pendingCount` (integer ≥ 0)
3. If alerts exist, each should have: name, state, labels, annotations
4. Call with `{ args: { state: "firing" } }`
5. Verify only firing alerts returned
6. Call with `{ args: { state: "pending" } }`
7. Verify only pending alerts returned

**Expected:** Alert data from Prometheus with state filtering

---

## OB-009: dashboard_url — Grafana URL

**Goal:** Verify Grafana dashboard URL generation.

**Steps:**
1. Call `{ operation: "dashboard_url" }`
2. Verify response includes:
   - `url` (valid URL string)
   - `dashboard` (default: `"thoughtbox-mcp"`)
3. Call with `{ args: { dashboard: "custom-dashboard" } }`
4. Verify URL contains `"custom-dashboard"` in the path
5. Verify URL is well-formed (contains grafana host)

**Expected:** Dashboard URL generated with correct dashboard name

---

## Running These Tests

Execute by calling the `observability_gateway` MCP tool. No initialization or stage progression required.

**Infrastructure requirements:** Tests OB-003, OB-004, and OB-008 require a running Prometheus instance. Tests OB-001 (grafana check) and OB-009 require Grafana. If infrastructure is unavailable, verify the tool returns clear connection errors rather than crashing.

**Session data requirements:** Tests OB-005, OB-006, and OB-007 require existing sessions in Thoughtbox storage. Create test sessions via `thoughtbox_gateway` if none exist.
