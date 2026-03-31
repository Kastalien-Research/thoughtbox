# Workspace Isolation Audit — 2026-03-29

Systematic audit of every code path where workspace A's data could
leak to workspace B. Covers all HTTP entry points, storage classes,
session management, and RLS policies.

## Critical: Unauthenticated Endpoints

Two endpoints have **no authentication and no workspace validation**.
Any client that can reach the port gets full access.

### `/hub/api` — unauthenticated, no workspace scoping

**File:** `src/index.ts:528-552`

```
app.post("/hub/api", async (req, res) => {
  const { operation, agentId, ...args } = req.body;
  const result = await sharedHubHandler.handle(agentId ?? null, operation, args);
  res.json(result);
});
```

No auth check. Client-provided `workspaceId` in the body is trusted.
An attacker can `list_problems`, `quick_join`, `create_problem`,
`post_message`, `create_proposal`, and `merge_proposal` on any
workspace by ID.

### `/hub/events` — unauthenticated, workspace via query param

**File:** `src/index.ts:506-522`

```
app.get("/hub/events", (req, res) => {
  const workspaceId = (req.query.workspace_id as string) || "*";
  const client: SseClient = { res, workspaceId };
  sseClients.add(client);
});
```

No auth check. `?workspace_id=*` subscribes to all workspaces.
Events include problem creation, status changes, proposals, consensus.

### Fix required before production

Both endpoints need the same auth pattern as `/mcp`:
1. Extract Bearer token from Authorization header
2. Resolve to workspaceId (OAuth JWT or tbx_* API key)
3. Reject if no auth and multi-tenant mode
4. Scope operations to authenticated workspaceId

## Verified: Correctly Isolated

### `/mcp` endpoint

**File:** `src/index.ts:282-410`

- Auth: OAuth JWT or tbx_* API key → workspaceId
- Session reuse: validates `entry.workspaceId !== workspaceId` (403)
- New sessions: storage scoped via `factory.getStorage(workspaceId)`

### OTLP routes

**File:** `src/otel/routes.ts:84-110`

- Auth: `resolveOtlpAuth()` → workspaceId from API key
- Storage: `OtelStorage` queries filter by workspace_id

### Supabase storage classes

**Files:** `src/persistence/supabase-storage.ts`,
`src/knowledge/supabase-storage.ts`

- workspaceId locked at constructor time
- Every query includes `.eq('workspace_id', this.workspaceId)`
- Every insert includes `workspace_id: this.workspaceId`
- Service role key bypasses RLS but workspace scoping is at the
  application layer, not the RLS layer

### Protocol handler

**File:** `src/protocol/handler.ts`

- workspaceId set via `setProject()` before any queries
- All SELECT/INSERT statements filter by workspace_id

### Observability gateway

**File:** `src/observability/gateway-handler.ts`

- Constructor receives workspaceId
- All OTEL queries pass `this.workspaceId`

### RLS policies

**Files:** `supabase/migrations/20260320191032_remote_schema.sql`,
`supabase/migrations/20260322153858_*.sql`

- `workspace_member_access` policies on sessions, thoughts, api_keys,
  entities, relations, observations
- Defense-in-depth: applies to authenticated users via `auth.uid()`
- Service role key bypasses (intentional — backend uses service role)

### OAuth tables

- RLS enabled, no policies → only service_role can access
- Correct: these tables are admin-only

## Acceptable Risk: Local/Singleton Mode

**File:** `src/index.ts:245-280`

Singleton server calls `factory.getStorage()` without workspaceId.
For FileSystem and InMemory storage, there's no workspace isolation.
All requests share the same storage.

This is intentional for local dev. It's dangerous if deployed to a
multi-user environment, but `isMultiTenant` is false in this path,
so it only activates when `THOUGHTBOX_STORAGE != supabase`.

## Summary

| Entry Point | Auth | Workspace Scoped | Status |
|-------------|------|-------------------|--------|
| `POST /mcp` | OAuth/API key | Yes | OK |
| `POST /hub/api` | **None** | **No** | BROKEN |
| `GET /hub/events` | **None** | **No** | BROKEN |
| `POST /v1/logs` (OTLP) | API key | Yes | OK |
| `GET /health` | None | N/A | OK |
| `GET /info` | None | N/A | OK |

## Action Items

1. Add auth to `/hub/api` and `/hub/events` before any production
   deployment with real users
2. The singleton mode concern is documented and acceptable for local
   dev — add a startup warning if `HOST=0.0.0.0` and not multi-tenant
