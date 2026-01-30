 # Observability and Events
 
 Thoughtbox provides both operational observability (metrics, health, alerts) and reasoning observability (real-time thought events).
 
 ## Observability gateway
 
 `observability_gateway` is always available and does not require session initialization.
 
 Operations:
 
 - `health`: service health checks (thoughtbox, sidecar, Prometheus, Grafana)
 - `metrics`: instant PromQL query
 - `metrics_range`: time series query
 - `sessions`: list sessions with active/idle status
 - `session_info`: detailed session info + revision counts
 - `alerts`: active/firing alerts from Prometheus
 - `dashboard_url`: Grafana dashboard URL generator
 
 Configuration:
 
 - `PROMETHEUS_URL` for Prometheus API
 - `GRAFANA_URL` for Grafana URLs
 
 ## Observatory (real-time reasoning events)
 
 The Observatory is an optional HTTP + WebSocket server for real-time reasoning monitoring.
 
 Features:
 
 - Fire-and-forget event emission via `ThoughtEmitter`
 - WebSocket subscriptions by channel/topic
 - REST API for session snapshots and listing
 - Built-in UI (HTML) served from the Observatory server
 
 HTTP endpoints (when enabled):
 
 - `/` and `/observatory` — Observatory UI
 - `/api/health` — health and connection counts
 - `/api/sessions` — session listing
 - `/api/sessions/{id}` — session details (thoughts + branches)
 - `/api/test/mock-collab-session` — emit mock events
 
 WebSocket:
 
 - Channel-based routing with topic subscriptions
 - Snapshot-on-join behavior for reasoning channels
 
 Configuration env vars:
 
 - `THOUGHTBOX_OBSERVATORY_ENABLED`
 - `THOUGHTBOX_OBSERVATORY_PORT`
 - `THOUGHTBOX_OBSERVATORY_CORS`
 - `THOUGHTBOX_OBSERVATORY_PATH`
 - `THOUGHTBOX_OBSERVATORY_MAX_CONN`
 - `THOUGHTBOX_OBSERVATORY_HTTP_API`
 
 ## Event stream (SIL-104)
 
 Thoughtbox can emit JSONL events to stdout, stderr, or file:
 
 - `session_created`
 - `thought_added`
 - `branch_created`
 - `session_completed`
 - `export_requested`
 
 Configuration:
 
 - `THOUGHTBOX_EVENTS_ENABLED=true`
 - `THOUGHTBOX_EVENTS_DEST=stderr|stdout|<path>`
 
 ## Self-improvement loop tracking (SIL-001)
 
 The `ImprovementTracker` emits improvement events to the Observatory:
 
 - `discovery`, `filter`, `experiment`, `evaluate`, `integrate`
 - `cycle_start`, `cycle_end`
