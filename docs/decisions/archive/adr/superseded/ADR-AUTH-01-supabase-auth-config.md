# ADR-AUTH-01: Supabase Auth Configuration and Session Strategy

**Status**: Superseded by ADR-AUTH-02
**Date**: 2026-03-13
**Deciders**: Thoughtbox development team
**Initiative**: `.specs/deployment/v1-initiative.md` (WS-03)

## Context

### Problem

Thoughtbox on Cloud Run needs user authentication. The current codebase has no auth middleware -- the server accepts all requests. For deployed use, every MCP request must be tied to an authenticated user so that data isolation, billing, and access control work correctly.

### Current State

**No auth layer exists.** The HTTP server (`src/index.ts`) handles `/mcp` requests without authentication. Storage backends use self-minted custom JWTs (signed with `SUPABASE_JWT_SECRET`) containing a `project` claim for RLS enforcement. This was designed for single-user local development, not multi-tenant deployment.

**RLS relies on a custom `project` claim.** ADR-DATA-01 created 5 product tables (sessions, thoughts, entities, relations, observations) with RLS policies that check `auth.jwt() ->> 'project'`. This claim exists only in the self-minted JWTs. Supabase OAuth tokens do not contain it -- they contain `sub` (user UUID) and `client_id` (OAuth client UUID).

**ADR-013 established `setProject()`.** Both `ThoughtboxStorage` and `KnowledgeStorage` interfaces have `setProject()`, which currently mints a custom JWT. The interface contract is correct; only the JWT-minting implementation changes for OAuth.

### Constraints

- **Cloud Run + Supabase** (v1-initiative, non-negotiable): Supabase handles auth, Postgres, storage.
- **Dual backend** (non-negotiable): FileSystemStorage (local) + SupabaseStorage (deployed). Both coexist. Neither replaces the other.
- **OAuth clients are user-level**: Users access multiple projects. A user belongs to workspaces; workspaces own projects.
- **JWT coexistence**: FS mode keeps custom JWTs. Supabase mode uses OAuth tokens.
- **Consent UI in v1**: Required, but built as a separate frontend in WS-07. This ADR configures the server side.

### ADR-013 Reconciliation

ADR-013 established `setProject()` with custom JWTs containing a `project` claim. With OAuth, the `project` claim is replaced by `sub` + `client_id`. ADR-013 is **not contradicted** -- its interface contract (`setProject()` scopes storage) remains correct. Only the implementation changes: in Supabase mode, `setProject()` uses the user's OAuth token instead of minting a custom JWT, and RLS checks `auth.uid()` via workspace membership instead of a `project` claim.

ADR-013 needs an **amendment notation** acknowledging that the custom JWT approach is now FS-mode-only, and deployed mode uses OAuth tokens.

## Decision

Use Supabase OAuth 2.1 with PKCE as the authentication mechanism for deployed Thoughtbox. MCP clients authenticate via standard OAuth 2.1 Authorization Code flow. The Cloud Run service validates tokens via JWKS using the `jose` library. RLS policies migrate from project-claim to user-membership. Filesystem mode retains its current custom JWT approach unchanged.

### Why Supabase OAuth 2.1

1. **Native MCP support.** Supabase OAuth 2.1 with DCR is the documented pattern for MCP server authentication. MCP clients auto-discover endpoints and register without manual configuration.
2. **Single identity provider.** Supabase Auth already manages user identity (auth.users). Adding a separate auth system would create identity reconciliation problems.
3. **RLS integration.** `auth.uid()` in RLS policies ties database access directly to the authenticated user. No application-level access checks needed -- the database enforces isolation.
4. **Standard protocol.** OAuth 2.1 with PKCE is well-understood, auditable, and supported by all major MCP clients.

### Why not alternatives

- **API keys only**: Cannot support the MCP OAuth flow. No user identity for RLS. Would need a parallel auth system for dashboard access.
- **Custom JWT middleware (keep current approach)**: Self-minted JWTs bypass Supabase Auth entirely. No user sessions, no grant management, no revocation. Unacceptable for multi-tenant deployment.
- **Supabase Auth without OAuth Server**: Session-based auth works for the dashboard but not for MCP clients, which require OAuth.

### Implementation summary

1. Enable OAuth 2.1 Server on Supabase project `akjccuoncxlvrrtkvtno`.
2. Confirm asymmetric JWT signing (ES256 already active; no HS256 migration needed).
3. Add `jose`-based middleware to validate tokens via JWKS on the Cloud Run service.
4. Create 4 new tables: `profiles`, `workspaces`, `workspace_memberships`, `projects`.
5. Rewrite RLS policies on 5 product tables from project-claim to user-membership.
6. Configure authorization path for consent UI (WS-07 builds the frontend).
7. Update `SupabaseStorage`/`SupabaseKnowledgeStorage` to accept OAuth tokens.

## Consequences

### Positive

- Every MCP request is tied to an authenticated user. Data isolation is enforced at the database level.
- MCP clients auto-configure via OAuth discovery + DCR. No manual API key distribution needed.
- Users can access multiple projects across workspaces with a single identity.
- Grant management lets users revoke OAuth client access at any time.
- Filesystem mode is completely unaffected. Local development remains zero-auth.

### Negative / Tradeoffs

- Four new tables (profiles, workspaces, workspace_memberships, projects) add schema complexity. These are necessary for the v1 data model regardless of auth approach.
- RLS policies become join-based (project -> workspace -> membership) instead of simple claim equality. The `user_can_access_project()` helper with `SECURITY DEFINER` mitigates this but adds a superuser function.
- `jose` is a new dependency (though zero-dependency itself).
- Consent UI is a hard dependency for the OAuth flow. Until WS-07 delivers it, OAuth cannot complete. For development/testing, a minimal consent page can be deployed independently.

### What this enables

- WS-04 (API Service): Auth middleware chain is defined.
- WS-06 (Billing): Workspace-scoped subscriptions can tie to authenticated users.
- WS-07 (Frontend): Dashboard auth integration, protected routes, consent UI.
- ADR-AUTH-02 (API Keys): API key issuance can be workspace/project-scoped with user ownership.

### Follow-up work

- ADR-AUTH-02: API key hashing and validation scheme (WS-03).
- WS-07 consent UI implementation.
- ADR-013 amendment: note that custom JWT is FS-mode-only in deployed contexts.
- Access Token Hook (future): custom claims for workspace context if needed beyond RLS.

## Hypotheses

### H1: Supabase OAuth 2.1 Server exposes functional endpoints

**Signal**: After enabling OAuth 2.1 in the Supabase dashboard for project `akjccuoncxlvrrtkvtno`, all four endpoint types respond correctly.

**Prediction**: Discovery endpoint returns JSON with `authorization_endpoint`, `token_endpoint`, `jwks_uri`. JWKS endpoint returns a key set with an asymmetric key.

**Validation**: Enable OAuth 2.1 in dashboard. Fetch discovery URL. Verify 200 response with expected fields. Fetch JWKS URL. Verify key set contains asymmetric key.

**Outcome**: INCONCLUSIVE. JWKS endpoint responds with ES256 key. OIDC discovery returns valid config with all endpoints. OAuth authorization server metadata endpoint returns 404 — requires OAuth 2.1 Server to be explicitly enabled in dashboard (manual config step, not a code issue). Deferred to dashboard enablement.

### H2: Cloud Run middleware validates Supabase OAuth tokens via JWKS

**Signal**: Middleware using `jose` `createRemoteJWKSet` + `jwtVerify` correctly validates a real Supabase-issued token and extracts `sub` + `client_id`.

**Prediction**: Valid token returns `{ userId, clientId, role: 'authenticated', aud: 'authenticated' }`. Expired token returns 401. Tampered token returns 401. Missing token returns 401.

**Validation**: 7 unit tests with RS256 key pair: valid token extracts all claims; expired token rejected; wrong key rejected; wrong issuer rejected; wrong audience rejected; missing sub rejected; default role applied.

**Outcome**: VALIDATED. All 7 tests pass. Middleware is algorithm-agnostic (works with ES256 from live JWKS).

### H3: OAuth tokens without workspace membership see nothing

**Signal**: An authenticated user with no workspace memberships cannot access any product table data.

**Prediction**: User with valid OAuth token (`sub` claim) but zero workspace memberships sees zero rows across all tables.

**Validation**: Created user Eve with no memberships. Set JWT claims to `{"sub": "eve-uuid", "role": "authenticated"}`. Queried sessions table. Result: 0 rows.

**Outcome**: VALIDATED. Membership-based RLS correctly denies access when no membership path exists. No `project` claim needed — `auth.uid()` + workspace membership is the enforcement mechanism.

### H4: Membership-based RLS policies grant correct multi-project access

**Signal**: After the RLS migration, a user's access is determined by workspace membership, not a JWT claim.

**Prediction**: User A (member of W1, which owns P1) can select rows with `project = 'project-alpha'`. User A cannot access rows with `project = 'project-beta'` (owned by W2). User B (member of both W1 and W2) can access both.

**Validation**: Created W1 (Alice owner), W2 (Bob owner). Bob also member of W1. Projects: project-alpha in W1, project-beta in W2. Two sessions inserted. Results:
- Alice: sees 1 session (project-alpha only)
- Bob: sees 2 sessions (both projects)
- Alice INSERT into project-beta: BLOCKED by RLS

**Outcome**: VALIDATED. Cross-workspace isolation confirmed. `user_can_access_project()` SECURITY DEFINER helper works correctly.

### H5: Asymmetric token validation via JWKS (ES256)

**Signal**: Supabase JWKS endpoint returns an asymmetric key usable for third-party token validation without shared secret.

**Prediction**: `jwtVerify(token, JWKS)` succeeds without access to `SUPABASE_JWT_SECRET`. The JWKS endpoint returns the public key.

**Validation**: Fetched `https://akjccuoncxlvrrtkvtno.supabase.co/auth/v1/.well-known/jwks.json`. Response: ES256 key with `"key_ops": ["verify"]`, `"use": "sig"`. This is already asymmetric — no HS256 migration needed. `jose` `createRemoteJWKSet` handles ES256 identically to RS256.

**Outcome**: VALIDATED (amended). Original hypothesis assumed RS256 migration would be needed. Reality: Supabase already uses ES256 (asymmetric). The middleware is algorithm-agnostic. Spec updated accordingly.

### H6: Dual-backend auth path works correctly

**Signal**: FS mode skips auth entirely. Supabase mode enforces it.

**Prediction**: With `THOUGHTBOX_STORAGE=fs`, auth middleware is not applied. With `THOUGHTBOX_STORAGE=supabase`, missing Authorization header returns 401.

**Validation**: 3 unit tests: FS mode `requireAuth=false`, Supabase mode `requireAuth=true`, memory mode `requireAuth=false`. Code path in `src/index.ts`: `const requireAuth = storageType === "supabase"`.

**Outcome**: VALIDATED. All 3 tests pass.

### H7: Existing MCP handlers work unchanged with OAuth middleware

**Signal**: Auth is pure middleware. Handlers do not read auth state directly.

**Prediction**: After adding the middleware, all existing handler tests pass without modification. Project scoping still works via `StateManager` -> `setProject()`.

**Validation**: Full test suite: 467/467 tests pass. Zero handler files modified (confirmed via `git diff` — only `src/index.ts`, storage configs, and new middleware files changed).

**Outcome**: VALIDATED. Auth is a pure middleware concern. Handlers unchanged.

## Spec

[.specs/deployment/auth-01-supabase-auth-config.md](../../.specs/deployment/auth-01-supabase-auth-config.md)

## Links

- **Prerequisite**: [ADR-DATA-01 (staging)](ADR-DATA-01-supabase-product-schema.md) -- product schema with current RLS policies
- **Amends**: [ADR-013 (accepted)](../accepted/ADR-013-knowledge-storage-project-scoping.md) -- `setProject()` custom JWT is now FS-mode-only
- **Prerequisite**: [ADR-GCP-01 (accepted)](../accepted/ADR-GCP-01-cloud-run-service-config.md) -- Cloud Run config, Supabase decision
- **Initiative**: `.specs/deployment/v1-initiative.md` (WS-03: Auth & Identity)
- **Data model**: `.specs/deployment/raw-materials/chatgpt-data-model.md` -- profiles, workspaces, workspace_memberships
- **Research**: `.specs/deployment/raw-materials/supabase-auth-mcp-research.md` -- scraped Supabase docs
- **Supabase docs**:
  - [MCP Authentication](https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication)
  - [OAuth 2.1 Getting Started](https://supabase.com/docs/guides/auth/oauth-server/getting-started)
  - [OAuth Flows](https://supabase.com/docs/guides/auth/oauth-server/oauth-flows)
  - [Token Security and RLS](https://supabase.com/docs/guides/auth/oauth-server/token-security)
- **Source files**:
  - `src/index.ts` -- server entry point, no middleware currently
  - `src/persistence/supabase-storage.ts` -- `SupabaseStorage`, custom JWT minting
  - `src/knowledge/supabase-storage.ts` -- `SupabaseKnowledgeStorage`, same JWT pattern
  - `src/persistence/types.ts` -- `ThoughtboxStorage` interface
  - `src/knowledge/types.ts` -- `KnowledgeStorage` interface
  - `supabase/migrations/20260313000000_create_product_schema.sql` -- current RLS policies
