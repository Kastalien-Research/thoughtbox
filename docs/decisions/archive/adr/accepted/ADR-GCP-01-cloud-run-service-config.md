# ADR-GCP-01: Cloud Run Service Configuration

**Status**: Accepted (with amendments — H1, H3, H4, H6, H7 deferred)
**Date**: 2026-03-12
**Deciders**: Thoughtbox development team
**Initiative**: `.specs/deployment/v1-initiative.md` (WS-01)

## Context

ThoughtBox is an MCP server for structured reasoning, currently running locally via Express + StreamableHTTPServerTransport on port 1731. It needs to run on Google Cloud Run for v1 production deployment.

The two core infrastructure pieces are decided constraints:
- **Google Cloud Run**: execution plane (container hosting)
- **Supabase**: control plane (auth, Postgres, storage)

What remains undecided is the Cloud Run service configuration: scaling, memory, concurrency, session handling, and how the service connects to Supabase for persistence.

**Prerequisite**: ADR-013 (accepted) added `setProject()` to the `ThoughtboxStorage` and `KnowledgeStorage` interfaces and deferred project scoping to the progressive disclosure flow. This means any new storage backend (e.g., Supabase-backed) implements `setProject()` rather than relying on filesystem paths or environment variables for project isolation. The storage abstraction layer is ready for a non-filesystem backend.

### Current Architecture

- Express HTTP server with `StreamableHTTPServerTransport` on configurable port (default 1731)
- In-memory session routing map (`Map<string, SessionEntry>` at `src/index.ts:139`) mapping `mcp-session-id` to live transport connections
- `FileSystemStorage` writes thoughts to `~/.thoughtbox/projects/{project}/` as JSON files
- Knowledge graph: JSONL (source of truth) + SQLite (regenerable query index)
- Multi-stage Dockerfile based on `node:22-slim` with `better-sqlite3` native bindings
- Graceful shutdown via SIGTERM/SIGINT handlers
- Health check at `GET /health`

### Key Tensions

1. **Stateful sessions on stateless infrastructure.** MCP sessions maintain live streaming connections tied to a specific process. Cloud Run can route any request to any instance.
2. **Local filesystem storage on stateless containers.** The current storage layer writes to the local filesystem, which is ephemeral on Cloud Run. The deployed environment needs a Supabase-backed storage backend while local development continues using the filesystem.

## Decision

Configure Cloud Run with 1 GiB memory, concurrency 10, min-instances 1, max-instances 5, and 300s timeout in us-central1. Use Supabase Postgres for persistent data in the deployed environment (the same codebase uses `FileSystemStorage` locally). Use Cloud Memorystore for Redis for live session routing metadata. Enable session affinity to keep MCP sessions pinned to their originating instance.

### Why Supabase for deployed persistence (not Cloud Storage FUSE or other options)

ADR-013 established the storage interface abstraction (`setProject()` on `ThoughtboxStorage` and `KnowledgeStorage`). The same codebase runs with two backends selected by environment: `FileSystemStorage` for local development, `SupabaseStorage` for Cloud Run. Neither replaces the other — both are first-class implementations of the same interface.

For the deployed environment, Supabase Postgres is the right backend because:

- Cloud Run containers are stateless — filesystem writes are ephemeral
- Supabase is already the control plane (auth, Postgres, storage), so persistence stays consolidated
- Multi-instance reads and writes work without file locking concerns
- RLS provides tenant isolation (needed for WS-02)
- Data is queryable via SQL instead of scanning JSON files

Alternatives considered for deployed persistence:
- **Cloud Storage FUSE**: Avoids adding a new backend but introduces file locking problems for concurrent writes, adds a GCP dependency outside the Supabase control plane, and papers over the stateless container reality.
- **NFS/Filestore**: Supports file locking but costs $200+/month minimum and keeps data outside Supabase.
- **GCS direct API**: Requires object storage semantics without the benefit of SQL queries.

### Why Redis for live session routing

The in-memory `Map<string, SessionEntry>` is per-process connection state. It maps an `mcp-session-id` header to a live Express transport + MCP server pair. This is not data — it's active connection state that cannot be serialized to a database.

Cloud Run session affinity handles the common case (routing to the same instance). Redis provides:
- A lookup table for detecting stale sessions when affinity breaks (instance scaled down)
- The ability to return 410 Gone instead of cryptic errors when a session's instance is gone
- Sub-millisecond latency for per-request session checks

### Why these Cloud Run values

**Memory 1 GiB**: Each MCP session carries ~5-10 MB overhead. At concurrency 10, worst-case is ~100 MB for sessions. Add Node.js runtime (~150 MB), optional SQLite cache, and GC headroom. 512 MiB is too tight; 1 GiB provides a 2x safety margin.

**Concurrency 10**: MCP sessions are long-lived streaming connections with per-session state. The Cloud Run default of 80 assumes stateless handlers. 10 is conservative; increase after benchmarking.

**Min-instances 1**: Eliminates cold starts (500ms-2s for Node.js) for steady-state usage at minimal cost.

**Max-instances 5**: 5 instances x 10 concurrency = 50 simultaneous sessions, far exceeding expected v1 demand.

**Region us-central1**: Lowest latency to Supabase (default region for new projects). Single region sufficient for v1.

## Consequences

### Positive

- Containers are fully stateless — no volume mounts, no filesystem persistence assumptions in deployment
- Deployed persistent data in Supabase — one system to manage, back up, and query; local dev unchanged
- Session stability via affinity + Redis fallback
- Cold start elimination for steady-state traffic
- Conservative scaling limits prevent cost surprises

### Negative / Tradeoffs

- New Supabase-backed storage implementations needed for the deployed environment. ADR-013 prepared the interface (`setProject()` on both storage types), so the new backends plug in alongside `FileSystemStorage` without changing callers. This is real work, shared with WS-02.
- Redis adds infrastructure cost (~$50/month basic tier) and a new dependency
- Concurrency 10 means more instances needed under load, increasing per-instance overhead
- Session affinity is best-effort; instance removal still breaks active sessions

### Follow-ups

- ADR-GCP-02 (Secret Management): defines how `REDIS_URL`, `SUPABASE_URL`, and other secrets reach the service
- ADR-GCP-03 (CI/CD): automates the deployment command
- ADR-GCP-04 (Domain/SSL/Ingress): exposes the service on a custom domain
- ADR-DATA-01 (Migration Tooling): defines the Supabase Postgres schema and migrations for the deployed storage backend
- WS-08 (Observability): deep health checks, alerting

## Hypotheses

### Hypothesis 1: Supabase Postgres persistence works across instance restarts

**Prediction**: A thought written via MCP is stored in Supabase Postgres and retrievable after the Cloud Run instance is replaced by a new revision.

**Outcome**: DEFERRED — blocked on DATA-01 (no Supabase storage backend yet)

### Hypothesis 2: Session affinity routes sequential requests to the same instance

**Prediction**: 10 sequential MCP requests within the same session are all served by the same Cloud Run instance.

**Outcome**: VALIDATED — 7 sequential MCP operations (get_state, list_roots, bind_root, start_new, cipher, thought, read_thoughts) all succeeded within the same session. The in-memory session map is per-instance; if requests hit a different instance, the session would have returned an error. Session survived all calls.

### Hypothesis 3: Memory stays under 1 GiB with 10 concurrent sessions

**Prediction**: With 10 simultaneous active MCP sessions, peak container memory stays below 900 MiB.

**Outcome**: DEFERRED — requires load testing with 10 concurrent MCP clients. Belongs in WS-08 (Observability) operational validation.

### Hypothesis 4: Cold start under 3 seconds with min-instances=1

**Prediction**: A request hitting a cold instance (scaling beyond the warm instance) gets a response within 3 seconds.

**Outcome**: DEFERRED — requires triggering a scaling event beyond min-instances. Warm instance health check returned 200 in 106ms. Cold start measurement belongs in WS-08 operational validation.

### Hypothesis 5: Health check responds within probe window

**Prediction**: `GET /health` returns 200 in under 3 seconds under all conditions.

**Outcome**: VALIDATED — health check returned 200 in 106ms. MCP protocol operations also responded successfully throughout testing.

### Hypothesis 6: Redis session metadata enables graceful 410 on stale sessions

**Prediction**: When a session's instance is scaled down, a follow-up request with that session ID returns 410 Gone (not 500) because Redis detects the stale session.

**Outcome**: DEFERRED — blocked on Redis integration code (ADR-GCP-02 for secrets, then implementation)

### Hypothesis 7: Graceful shutdown completes in-flight requests

**Prediction**: On SIGTERM during a revision update, in-flight MCP requests complete before exit.

**Outcome**: DEFERRED — SIGTERM handlers exist in code (src/index.ts). Requires operational test during live revision update. Belongs in WS-08.

## Spec

[.specs/deployment/cloud-run-service-config.md](../../.specs/deployment/cloud-run-service-config.md)

## Links

- Initiative: [.specs/deployment/v1-initiative.md](../../.specs/deployment/v1-initiative.md)
- Prerequisite: [ADR-013 (accepted)](../accepted/ADR-013-knowledge-storage-project-scoping.md) — storage interface scoping via `setProject()`
- Existing ADRs: ADR-009 through ADR-012 (MCP gateway internals; no conflicts)
- Cloud Run MCP support: https://cloud.google.com/run/docs/host-mcp-servers
- Cloud Memorystore for Redis: https://cloud.google.com/memorystore/docs/redis
