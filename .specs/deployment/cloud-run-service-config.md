# SPEC: Cloud Run Service Configuration

**ADR**: ADR-GCP-01
**Initiative**: `.specs/deployment/v1-initiative.md` (WS-01)
**Status**: Draft

---

## Service Definition

### Cloud Run Service

| Parameter | Value |
|-----------|-------|
| Service name | `thoughtbox-mcp` |
| Region | `us-central1` |
| CPU | 1 vCPU |
| Memory | 1 GiB |
| Max concurrency | 10 (requests per container instance) |
| Min instances | 1 |
| Max instances | 5 |
| Request timeout | 300s |
| Container port | 8080 (Cloud Run default; `PORT` env var) |
| Startup CPU boost | Enabled |
| Ingress | All traffic (restricted by auth at application layer) |
| Execution environment | Second generation (gen2) |
| Session affinity | Enabled |

### Container Image

Base: `node:22-slim` (multi-stage build, existing Dockerfile pattern).

### Scaling Rationale

- Concurrency 10: each active MCP session holds an open streaming connection and accumulates in-memory state (~5-10 MB per session). 10 concurrent sessions per instance keeps memory safely under 1 GiB with headroom.
- Min instances 1: eliminates cold starts for steady-state traffic. Billed at reduced idle rate.
- Max instances 5: sufficient for v1 launch load. Revisit based on actual usage.

---

## Persistence: Dual-Backend Storage

ADR-013 established the storage interface abstraction (`setProject()` on `ThoughtboxStorage` and `KnowledgeStorage`). The same codebase runs with two backends selected by environment:

- **Local development**: `FileSystemStorage` / `FileSystemKnowledgeStorage` — writes to `~/.thoughtbox/`
- **Cloud Run deployment**: `SupabaseStorage` / `SupabaseKnowledgeStorage` — writes to Supabase Postgres

Neither replaces the other. Both implement the same interface.

### What goes in Supabase Postgres (deployed environment)

- Session metadata (titles, tags, timestamps, thought counts)
- Thoughts and thought chains
- Knowledge graph entities, relations, observations
- Hub state (workspaces, proposals, consensus markers)

### What goes in Supabase Storage (deployed environment)

- Large artifacts, exports, or blobs that don't belong in Postgres rows

### What stays ephemeral (container-local)

- SQLite query index: if retained as a local cache, rebuilt on startup from Postgres. Alternatively, replaced entirely by Postgres queries.
- `node_modules`, application code, temp files.

### Storage backend (implemented)

`SupabaseStorage` and `SupabaseKnowledgeStorage` are implemented (ADR-DATA-01, PR #161). Both accept an optional `userToken` for OAuth-authenticated access (ADR-AUTH-01). The app connects via Supabase PostgREST API using the anon key + user token; RLS enforces data isolation at the database level.

---

## Session Routing: Cloud Memorystore for Redis

| Parameter | Value |
|-----------|-------|
| Instance name | `thoughtbox-sessions-{env}` |
| Tier | Basic (no replication; acceptable for session routing) |
| Memory | 1 GB |
| Redis version | 7.x |
| Network | Same VPC as Cloud Run service |
| Auth | IAM-based (AUTH string via Secret Manager) |

### Session Routing Contract

The in-memory `Map<string, SessionEntry>` at `src/index.ts:139` currently maps `mcp-session-id` to a live transport connection. This cannot be shared across instances.

Redis stores session metadata for routing:

```
Key:    session:{mcp-session-id}
Value:  JSON { instanceId, projectId, createdAt, lastActiveAt }
TTL:    3600s (1 hour idle expiry)
```

Cloud Run does not expose stable instance IDs. Instead, use **session affinity** (Cloud Run built-in):

- Enable session affinity on the Cloud Run service.
- Cloud Run routes requests with the same session cookie to the same instance.
- Redis serves as the fallback lookup if affinity breaks (instance scaled down).
- If affinity breaks and the session's instance is gone, the client gets a 410 Gone and must re-initialize.

### Application Code Changes

1. On session creation: write session metadata to Redis.
2. On session request: refresh `lastActiveAt` TTL in Redis.
3. On session close / transport disconnect: delete Redis key.
4. Add `REDIS_URL` environment variable (injected via Secret Manager).

---

## Environment Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `PORT` | Cloud Run (automatic) | Container port; Cloud Run injects this |
| `NODE_ENV` | Service config | `production` |
| `THOUGHTBOX_STORAGE` | Service config | `supabase` — selects Supabase backend (ADR-DATA-01) |
| `SUPABASE_URL` | Secret Manager | Supabase project URL (`https://akjccuoncxlvrrtkvtno.supabase.co`) |
| `SUPABASE_ANON_KEY` | Secret Manager | Supabase anon key — used with user tokens for RLS-enforced access |
| `SUPABASE_JWT_SECRET` | Secret Manager | JWT secret — used for custom JWT minting in FS/local mode; present but unused when OAuth tokens are active |
| `REDIS_URL` | Secret Manager | `redis://{memorystore-ip}:6379` (deferred to Redis implementation) |

**Removed variables:**
- ~~`THOUGHTBOX_TRANSPORT`~~: Server defaults to HTTP (ADR-013)
- ~~`SUPABASE_SERVICE_ROLE_KEY`~~: Not used. App connects as unprivileged client with anon key + user OAuth token. RLS enforces access control at the database level (ADR-AUTH-01).
- ~~`SUPABASE_DB_URL`~~: Not used. App connects via Supabase PostgREST API, not direct Postgres (ADR-DATA-01).

Secret management strategy is deferred to ADR-GCP-02. This spec assumes secrets are available as environment variables at runtime.

---

## Health Check

| Parameter | Value |
|-----------|-------|
| Path | `/health` |
| Protocol | HTTP |
| Port | Container port (from `PORT` env var) |
| Initial delay | 5s |
| Period | 30s |
| Timeout | 3s |
| Failure threshold | 3 |

The existing `/health` endpoint returns 200. For v1, this is sufficient. Deep health checks (Supabase connectivity, Redis connectivity) are deferred to WS-08 (Observability).

---

## Dockerfile Changes

Changes to the existing `Dockerfile`:

1. **Remove `VOLUME` instruction**: Cloud Run containers are stateless. No volume mounts.
2. **Remove `better-sqlite3` copy step**: If SQLite is replaced by Postgres queries, the native binding is no longer needed. If retained as a local cache, the copy step stays.
3. No other changes required.

---

## Deployment Command (Reference)

```bash
gcloud run deploy thoughtbox-mcp \
  --image=REGION-docker.pkg.dev/PROJECT/REPO/thoughtbox-mcp:TAG \
  --region=us-central1 \
  --platform=managed \
  --execution-environment=gen2 \
  --cpu=1 \
  --memory=1Gi \
  --concurrency=10 \
  --min-instances=1 \
  --max-instances=5 \
  --timeout=300 \
  --port=8080 \
  --cpu-boost \
  --session-affinity \
  --set-env-vars="NODE_ENV=production,THOUGHTBOX_STORAGE=supabase" \
  --set-secrets="SUPABASE_URL=thoughtbox-supabase-url:latest,SUPABASE_ANON_KEY=thoughtbox-supabase-anon-key:latest,SUPABASE_JWT_SECRET=thoughtbox-supabase-jwt-secret:latest" \
  --service-account=thoughtbox-mcp@PROJECT.iam.gserviceaccount.com
```

CI/CD automation of this command is deferred to ADR-GCP-03.

---

## Acceptance Criteria

1. **Service deploys and starts**: `gcloud run services describe thoughtbox-mcp --region=us-central1` returns status `Ready`.
2. **Health check passes**: Cloud Run probe at `/health` returns 200 within 3s.
3. **Supabase persistence works**: A thought created via MCP is stored in Supabase Postgres and retrievable after instance restart.
4. **Session affinity works**: Sequential MCP requests with the same session ID hit the same instance (verify via instance logs).
5. **Redis session tracking**: Session metadata appears in Redis after MCP session initialization. Key expires after 1 hour of inactivity.
6. **Cold start under 3s**: New instance serves first request within 3 seconds of being scheduled.
7. **Memory stays under limit**: Under 10 concurrent sessions, memory usage stays below 900 MiB (90% of 1 GiB limit).
8. **Graceful shutdown**: On SIGTERM, active sessions are closed and in-flight requests complete before container exits.
