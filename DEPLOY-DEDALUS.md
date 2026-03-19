# Deploying Thoughtbox to Dedalus Labs

This branch (`deploy/dedalus`) is configured for deployment to the [Dedalus Labs](https://dedaluslabs.ai) MCP marketplace.

## How it works

Dedalus pulls from this branch and builds the Docker image. The Dockerfile produces a minimal Node.js server that speaks Streamable HTTP on the configured port.

No Prometheus, Grafana, OTel, or observatory — just the core MCP server with Supabase persistence.

## Environment Variables (set in Dedalus dashboard)

### Required

| Variable | Description |
|----------|-------------|
| `THOUGHTBOX_STORAGE` | Set to `supabase` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret for auth |
| `PORT` | Server port (default: `1731`) |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `THOUGHTBOX_TRANSPORT` | `http` | Transport mode (`http` or `stdio`) |
| `THOUGHTBOX_WORKSPACE_ID` | auto | Workspace isolation ID |
| `THOUGHTBOX_AGENT_ID` | - | Default agent ID for hub registration |
| `THOUGHTBOX_AGENT_NAME` | - | Default agent name for hub registration |
| `THOUGHTBOX_API_KEY_LOCAL` | - | Optional API key for auth |
| `DISABLE_THOUGHT_LOGGING` | `false` | Disable thought logging |
| `THOUGHTBOX_EVENTS_ENABLED` | `false` | Enable event emission |
| `THOUGHTBOX_EVENTS_DEST` | `stderr` | Event destination |

### Not needed (compose-only)

These are used by the local docker-compose stack and should NOT be set on Dedalus:

- `PROMETHEUS_URL` — no Prometheus in marketplace deployment
- `GRAFANA_URL` — no Grafana in marketplace deployment
- `THOUGHTBOX_OBSERVATORY_ENABLED` — observatory disabled for marketplace
- `THOUGHTBOX_OBSERVATORY_PORT` — observatory disabled for marketplace

## Marketplace user experience

Users connect via the Dedalus SDK:

```typescript
import Dedalus from "dedalus-labs";
import { DedalusRunner } from "dedalus-labs";

const client = new Dedalus();
const runner = new DedalusRunner(client);

const result = await runner.run({
  input: "Use Thoughtbox to structure my reasoning about this problem...",
  model: "anthropic/claude-opus-4-6",
  mcpServers: ["kastalien-research/thoughtbox"],
});
```

No credentials required from marketplace users — they connect to Kastalien's Supabase backend. Workspace isolation is handled per-session.

## Keeping this branch in sync

This branch tracks `main`. To update:

```bash
git checkout deploy/dedalus
git merge main
# Resolve any conflicts in deployment-specific files
git push
```
