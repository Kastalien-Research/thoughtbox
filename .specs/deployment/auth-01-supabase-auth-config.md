# SPEC-AUTH-01: Supabase Auth Configuration and Session Strategy

**ADR**: `.adr/staging/ADR-AUTH-01-supabase-auth-config.md`
**Scope**: OAuth 2.1 Server configuration, JWT validation middleware, RLS policy migration, consent UI contract, dual-backend auth behavior. SaaS platform tables (profiles, workspaces, workspace_memberships, projects) are added alongside the existing product schema.

## Overview

Supabase OAuth 2.1 Server becomes the authentication mechanism for deployed Thoughtbox on Cloud Run. MCP clients authenticate via the standard OAuth 2.1 Authorization Code with PKCE flow. The Cloud Run service validates Supabase-issued tokens via JWKS. RLS policies migrate from custom `project` claim to `auth.uid()` + workspace membership. The filesystem backend retains custom JWTs for local/self-hosted use.

## 1. OAuth 2.1 Server Configuration

### Supabase Dashboard Settings

- **Enable**: Authentication > OAuth Server (beta, free on all plans)
- **Project**: `akjccuoncxlvrrtkvtno`
- **Authorization path**: `/oauth/consent` (points to the consent UI frontend, built in WS-07)
- **Dynamic Client Registration (DCR)**: Enabled. MCP clients self-register automatically. This is the MCP-native pattern -- clients discover endpoints via `/.well-known/oauth-authorization-server/auth/v1` and register without manual intervention.
- **JWT signing algorithm**: ES256 (already active, no migration needed). Asymmetric signing enables third-party token validation via JWKS without sharing the signing secret.

### Endpoints After Enabling

| Endpoint | URL |
|----------|-----|
| Discovery | `https://akjccuoncxlvrrtkvtno.supabase.co/.well-known/oauth-authorization-server/auth/v1` |
| OIDC Discovery | `https://akjccuoncxlvrrtkvtno.supabase.co/auth/v1/.well-known/openid-configuration` |
| Authorization | `https://akjccuoncxlvrrtkvtno.supabase.co/auth/v1/oauth/authorize` |
| Token | `https://akjccuoncxlvrrtkvtno.supabase.co/auth/v1/oauth/token` |
| JWKS | `https://akjccuoncxlvrrtkvtno.supabase.co/auth/v1/.well-known/jwks.json` |

### OAuth Client Registration

For v1, two client types are relevant:

1. **MCP clients** (public, no secret): Register via DCR or manually in dashboard. Token endpoint auth: `none`. Redirect URIs: exact match per client.
2. **Dashboard frontend** (public SPA): Registered manually. Uses Authorization Code + PKCE.

Grant types: `authorization_code` (initial) and `refresh_token` (renewal). `client_credentials` and `password` are not supported by Supabase.

### Scopes

| Scope | Purpose |
|-------|---------|
| `openid` | Enables OIDC, includes ID token |
| `email` | email + email_verified claims |
| `profile` | name, picture |

Default scope when none requested: `email`. Custom scopes are not supported by Supabase OAuth 2.1 as of March 2026.

## 2. JWT Validation Middleware

### Library

`jose` -- zero-dependency, handles JWKS caching natively via `createRemoteJWKSet`.

### Middleware Contract

New file: `src/middleware/auth.ts`

The middleware:

1. Extracts `Authorization: Bearer <token>` from the request header.
2. Validates the token against the Supabase JWKS endpoint using `jwtVerify`.
3. Extracts claims: `sub` (user ID), `client_id` (OAuth client), `role`, `aud`, `iss`, `session_id`, `email`.
4. Attaches the validated claims to the request context for downstream handlers.
5. Returns 401 for missing, invalid, expired, or malformed tokens.

```typescript
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);

async function validateToken(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `${SUPABASE_URL}/auth/v1`,
    audience: 'authenticated',
  });
  return {
    userId: payload.sub,
    clientId: payload.client_id,
    role: payload.role,
    sessionId: payload.session_id,
    email: payload.email,
  };
}
```

### JWKS Caching

`createRemoteJWKSet` caches keys automatically and refetches on key rotation (cache miss). No manual TTL or invalidation logic needed.

### Environment Variables

| Variable | Required In | Purpose |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase mode | Base URL for JWKS endpoint + issuer validation |
| `SUPABASE_ANON_KEY` | Supabase mode | Supabase client initialization |
| `SUPABASE_JWT_SECRET` | FS mode only | Custom JWT signing for local RLS testing |

In Supabase mode, `SUPABASE_JWT_SECRET` is no longer used for token minting. Supabase Auth mints tokens. The secret remains for FS mode's custom JWT approach.

## 3. RLS Policy Migration

### Current State (ADR-DATA-01)

All five product tables use project-claim RLS:

```sql
CREATE POLICY project_isolation ON sessions
  FOR ALL USING (project = (auth.jwt() ->> 'project'));
```

This works with custom JWTs containing `{ role: 'authenticated', project: '<name>' }`. OAuth tokens from Supabase contain `sub` (user UUID) and `client_id` but no `project` claim. These tokens will be rejected by the current policies.

### Target State

RLS policies check `auth.uid()` against `workspace_memberships` to determine which projects the user can access. The `project` column stays on all tables. The enforcement mechanism changes from "JWT contains the project name" to "user is a member of a workspace that owns this project."

### New Tables Required

Four tables from the v1 data model must exist before the RLS rewrite. These are ADDED alongside the existing 5 product tables (sessions, thoughts, entities, relations, observations).

#### profiles

```sql
CREATE TABLE profiles (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  default_workspace_id UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_own ON profiles
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

#### workspaces

```sql
CREATE TABLE workspaces (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'archived')),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- workspace_member policy deferred until workspace_memberships table exists

CREATE TRIGGER trigger_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

#### workspace_memberships

```sql
CREATE TABLE workspace_memberships (
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role               TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'member')),
  invited_by_user_id UUID REFERENCES auth.users(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

ALTER TABLE workspace_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY memberships_own ON workspace_memberships
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY memberships_workspace_admin ON workspace_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = workspace_memberships.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- Now safe to create workspace policy referencing workspace_memberships
CREATE POLICY workspaces_member ON workspaces
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = workspaces.id
        AND wm.user_id = auth.uid()
    )
  );
```

#### projects

Links the logical `project` name on product tables to workspace ownership:

```sql
CREATE TABLE projects (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  slug               TEXT NOT NULL,
  description        TEXT,
  status             TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived')),
  created_by_user_id UUID REFERENCES auth.users(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_member ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      WHERE wm.workspace_id = projects.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### RLS Policy Rewrite for Product Tables

```sql
-- Helper function: does current user have workspace membership for this project?
CREATE OR REPLACE FUNCTION user_can_access_project(project_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM projects p
    JOIN workspace_memberships wm ON wm.workspace_id = p.workspace_id
    WHERE p.name = project_name
      AND wm.user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Replace project_isolation on all 5 product tables
DROP POLICY IF EXISTS project_isolation ON sessions;
CREATE POLICY user_project_access ON sessions
  FOR ALL USING (user_can_access_project(project))
  WITH CHECK (user_can_access_project(project));

DROP POLICY IF EXISTS project_isolation ON thoughts;
CREATE POLICY user_project_access ON thoughts
  FOR ALL USING (user_can_access_project(project))
  WITH CHECK (user_can_access_project(project));

DROP POLICY IF EXISTS project_isolation ON entities;
CREATE POLICY user_project_access ON entities
  FOR ALL USING (user_can_access_project(project))
  WITH CHECK (user_can_access_project(project));

DROP POLICY IF EXISTS project_isolation ON relations;
CREATE POLICY user_project_access ON relations
  FOR ALL USING (user_can_access_project(project))
  WITH CHECK (user_can_access_project(project));

DROP POLICY IF EXISTS project_isolation ON observations;
CREATE POLICY user_project_access ON observations
  FOR ALL USING (user_can_access_project(project))
  WITH CHECK (user_can_access_project(project));
```

### Why SECURITY DEFINER on the helper function

The helper reads `workspace_memberships` and `projects`, which have their own RLS. Without `SECURITY DEFINER`, a circular dependency occurs: checking product table RLS requires reading membership tables, which requires checking membership RLS. `SECURITY DEFINER` runs the function as the definer (superuser), bypassing recursion. Safety: the function always filters by `auth.uid()`.

### Service role bypass policies

Existing `service_role_bypass` policies on all 5 product tables remain unchanged.

## 4. Consent UI Contract

The consent UI is a **separate frontend deliverable** (WS-07). This spec defines only the server-side contract.

### Authorization Path

When an MCP client initiates the OAuth flow, Supabase redirects to `{authorization_path}?authorization_id={id}`. The consent UI must:

1. Call `supabase.auth.oauth.getAuthorizationDetails(authorization_id)` to load client info and scopes.
2. Display: client name, requested scopes, approve/deny buttons.
3. On approve: call `supabase.auth.oauth.approveAuthorization(authorization_id)` -- returns `redirect_to` URL.
4. On deny: call `supabase.auth.oauth.denyAuthorization(authorization_id)` -- returns `redirect_to` URL.
5. Redirect the user to the returned URL.

### Grant Management

Users revoke OAuth grants via the dashboard:

- `supabase.auth.oauth.getUserGrants()` -- list authorized apps
- `supabase.auth.oauth.revokeGrant(clientId)` -- revoke (invalidates sessions + refresh tokens)

## 5. Dual-Backend Auth Behavior

### Filesystem Mode (THOUGHTBOX_STORAGE=fs)

- No auth middleware. Requests are unauthenticated.
- `setProject()` continues to mint custom JWTs with `{ role: 'authenticated', project: '<name>' }` signed by `SUPABASE_JWT_SECRET` (current ADR-DATA-01 behavior).
- The FS backend itself does not use Supabase. Custom JWTs exist only for local Supabase integration testing.

### Supabase Mode (THOUGHTBOX_STORAGE=supabase)

- Auth middleware validates every request via JWKS.
- `setProject()` no longer mints custom JWTs. The middleware extracts `auth.uid()` from the OAuth token. Project access is determined by workspace membership in the database.
- Unauthenticated requests receive 401.
- The Supabase client is initialized with the user's OAuth token (passed through from middleware), not a self-minted JWT.

### Code Path

```
Request arrives at /mcp
  |
  +--> THOUGHTBOX_STORAGE=fs?
  |      Yes: skip auth, proceed to handler
  |      setProject() -> mint custom JWT -> RLS via project claim
  |
  +--> THOUGHTBOX_STORAGE=supabase?
         Yes: middleware validates Bearer token via JWKS
         Extract { userId, clientId } from token
         Handler receives authenticated context
         setProject() uses user's OAuth token for Supabase client
         RLS via auth.uid() + workspace_memberships
```

## 6. Changes to Existing Code

### src/persistence/supabase-storage.ts

`SupabaseStorageConfig` gains optional `userToken?: string`. When provided, `refreshClient()` uses the user's OAuth token instead of minting a custom JWT. When absent (local testing), current custom JWT behavior remains.

### src/knowledge/supabase-storage.ts

Same change. `SupabaseKnowledgeStorageConfig` gains optional `userToken?: string`.

### src/index.ts

The HTTP server's `/mcp` handler gains conditional auth middleware:

1. Check `THOUGHTBOX_STORAGE` -- if not `supabase`, skip auth.
2. Validate Bearer token via JWKS.
3. Pass validated claims and raw token to `createMcpServer()` via new `authContext` option.

### MCP Handlers

Zero changes. Auth is pure middleware. Handlers use `StateManager` for project scoping. The `bind_root`/`start_new` flow determines the project name. `setProject()` receives it. RLS enforces it.

## 7. New Dependencies

| Package | Purpose |
|---------|---------|
| `jose` | JWT validation via JWKS (zero dependencies) |

`jsonwebtoken` (existing dependency) remains for FS mode custom JWT minting.

## 8. Migration File

Single migration: `supabase/migrations/YYYYMMDDHHMMSS_auth_workspace_tables.sql`

Creates `profiles`, `workspaces`, `workspace_memberships`, `projects` tables with RLS. Creates `user_can_access_project()` helper function. Drops old `project_isolation` policies and creates new `user_project_access` policies on all 5 product tables. Service role bypass policies untouched.

Prerequisite: ADR-DATA-01 product schema migration must have run first.

## Acceptance Criteria

1. OAuth 2.1 endpoints respond. Discovery returns valid JSON with all endpoint URLs. JWKS returns at least one RS256 key.
2. `jose` middleware validates real Supabase OAuth tokens, extracts `sub` and `client_id`, rejects invalid/expired tokens with 401.
3. OAuth tokens (no `project` claim) fail against old `project_isolation` RLS policies on all 5 product tables.
4. After migration, user with workspace membership can read/write rows for projects in that workspace. Cannot access projects in other workspaces.
5. Cross-workspace isolation: User A (member of W1 only) cannot see W2's project data. User B (member of W1 and W2) sees both.
6. After RS256 migration, tokens validate via JWKS public key only. No shared secret needed.
7. `THOUGHTBOX_STORAGE=fs` requests proceed without auth. `THOUGHTBOX_STORAGE=supabase` rejects unauthenticated requests with 401.
8. All existing MCP handler tests pass without modification.
9. Consent UI contract: authorization path configured, SDK methods callable from frontend.
10. New tables (`profiles`, `workspaces`, `workspace_memberships`, `projects`) created with correct columns, constraints, and RLS.
11. `FileSystemStorage` and `FileSystemKnowledgeStorage` unchanged. All existing tests pass.
