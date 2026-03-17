# ADR-AUTH-02: Static API Key Authentication

**Status**: Accepted
**Date**: 2026-03-16
**Deciders**: glassBead
**Supersedes**: ADR-AUTH-01 (Supabase OAuth 2.1 with JWKS)
**Initiative**: `.specs/deployment/v1-initiative.md` (WS-03)

## Context

### Problem

AUTH-01 implemented Supabase OAuth 2.1 with JWKS token validation for the deployed MCP server. This introduced:

- Short-lived tokens (1-hour expiry) requiring constant refresh
- Dependency on Supabase Auth email delivery and redirect URL configuration
- Per-session storage instances bound to user OAuth tokens
- Workspace/membership tables that nothing uses (scope creep from WS-02)

The MCP server already mints its own project-scoped JWTs for Supabase RLS via `SupabaseStorage.refreshClient()`. The OAuth layer was redundant — it validated tokens at the HTTP boundary, then the server created its own tokens for database access anyway.

For the current deployment (2-3 users), OAuth added complexity without value. See `.specs/deployment/auth-01-review.md` for the full post-mortem.

### Decision Drivers

- Users need to connect without tokens expiring every hour
- No workspace/membership infrastructure exists to support per-user OAuth isolation
- Project-scoped RLS (`project_isolation` policy) already handles data separation
- Demo-critical timeline — simplicity over ceremony

## Decision

Replace OAuth token validation with a static API key check.

### How it works

1. Set `THOUGHTBOX_API_KEY` env var on Cloud Run
2. Clients provide the key via `Authorization: Bearer <key>` header (preferred) or `?key=<key>` query param
3. If the env var is not set, auth is disabled (local dev, FS mode)
4. The server uses shared `SupabaseStorage` instances that mint project-scoped JWTs internally
5. Data isolation is enforced by RLS `project_isolation` policy: `project = (auth.jwt() ->> 'project')`

### What was removed

- `src/middleware/auth.ts` — JWKS/JWT validation helpers
- `src/__tests__/auth-middleware.test.ts` — tests for removed middleware
- Per-session `SupabaseStorage`/`SupabaseKnowledgeStorage` instantiation
- `jose` dependency (still in package.json but no longer imported at runtime)

### What was kept

- `project_isolation` RLS policies on all product tables
- `SupabaseStorage.refreshClient()` minting project-scoped JWTs
- Dual-backend support (FS mode unaffected)
- Workspace/membership tables (inert scaffolding, no policy enforcement on product tables)

## Consequences

### Positive

- No token expiry — API key is static until rotated
- No dependency on Supabase Auth email delivery or redirect URLs
- Simpler connection: URL + key, no OAuth flow
- 69 fewer lines of code in `src/index.ts`

### Negative

- No per-user identity at the MCP layer — all users with the key share access
- API key rotation requires redeploying env var and updating all clients
- Query param key delivery exposes the key in access logs (mitigated: header is preferred)

### Known gap: shared storage race condition

The shared `SupabaseStorage` instance has a mutable `this.project` field. If two concurrent sessions call `setProject()` with different values, the last write wins and the other session queries under the wrong project scope. This is not a regression (the pre-AUTH-01 code had the same architecture) but it becomes relevant with multiple users.

Fix: create per-session `SupabaseStorage` instances scoped by project name (not by user token). This is independent of the auth mechanism.

## Related

- `.specs/deployment/auth-01-review.md` — post-mortem on AUTH-01
- `.adr/superseded/ADR-AUTH-01-supabase-auth-config.md` — the decision this replaces
- PR #166 — implementation
- `tb-c26` — RLS: scope by workspace_id (deferred)
- `tb-1ay` — ADR-GCP-02: Secret management (move credentials to Secret Manager)
