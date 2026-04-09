# Observability and Telemetry

Set up telemetry collection and query observability data from Thoughtbox.

## What's Collected

Claude Code emits OpenTelemetry data: tool calls, API costs per model, session timelines, and errors. Thoughtbox stores this in Supabase and makes it queryable through the observability module.

## Setup: settings.local.json

Add the OTEL environment variables to your project's `.claude/settings.local.json`:

```json
{
  "env": {
    "OTEL_EXPORTER_OTLP_PROTOCOL": "http/json",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "https://mcp.kastalienresearch.ai",
    "OTEL_EXPORTER_OTLP_HEADERS": "Authorization=Bearer tbx_YOUR_KEY_HERE",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_LOGS_EXPORTER": "otlp"
  }
}
```

`.claude/settings.local.json` is gitignored -- it holds per-developer config. The OTEL endpoint is the same Thoughtbox URL as your MCP connection. The API key authenticates the telemetry stream.

## Hook Setup

The `post_tool_use.sh` hook tracks file access and writes tool receipts automatically. Add to `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/post_tool_use.sh\""
          }
        ]
      }
    ]
  }
}
```

The session tracker hook (`thoughtbox_session_tracker.sh`) binds Claude Code sessions to Thoughtbox sessions, enabling cross-system correlation. When both hooks are active, every tool call in Claude Code produces a traceable event in the Thoughtbox OTEL store.

## Querying Observability Data

### Health Check

```javascript
// Are services up?
async () => tb.observability({ operation: "health" })
// Returns: { status: "healthy"|"unhealthy", services: { thoughtbox: {...}, supabase: {...} } }
```

### Active Sessions

```javascript
// List active reasoning sessions
async () => tb.observability({ operation: "sessions", limit: 10, status: "active" })
```

### Cost Breakdown

```javascript
// Cost breakdown by model for a session
async () => tb.observability({
  operation: "session_cost",
  sessionId: "session-uuid"
})
```

### Event Timeline

```javascript
// Chronological event timeline
async () => tb.observability({
  operation: "session_timeline",
  args: {
    sessionId: "session-uuid",
    limit: 50
  }
})
```

## Health Check Interpretation

| Service | Healthy means | Unhealthy means |
|---------|--------------|----------------|
| `thoughtbox` | MCP server responds to requests | Server unreachable or erroring |
| `supabase` | OTEL event store accepts writes, returns event counts | Database connection failed |

## Troubleshooting

**No telemetry arriving.** Verify `settings.local.json` is in `.claude/` (not the project root). Confirm the API key starts with `tbx_`. Check that the endpoint URL has no trailing slash.

**Health check shows unhealthy.** Run the health operation first to identify which service is down. If `supabase` is unhealthy, check your Supabase project status. If `thoughtbox` is unhealthy, verify the MCP server is running and the endpoint is reachable.

**Timeline shows gaps.** The PostToolUse hook must be registered in `settings.json` (not `settings.local.json`). Hooks in `settings.local.json` are not loaded by all Claude Code versions. Verify with `cat .claude/settings.json | grep PostToolUse`.

**Cost data missing for a session.** Cost tracking depends on OTEL metrics export. Confirm `OTEL_METRICS_EXPORTER` is set to `otlp` in `settings.local.json`. Sessions started before the config was added will not have cost data retroactively.
