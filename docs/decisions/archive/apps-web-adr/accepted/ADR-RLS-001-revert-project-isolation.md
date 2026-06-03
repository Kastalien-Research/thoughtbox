# ADR-RLS-001: Revert Product Table RLS to `project_isolation`

**Status**: Accepted
**Date**: 2026-03-16
**Author**: HDD Staging Agent

## Context

### The problem

Migration `20260313100000`, introduced as part of ADR-AUTH-01, replaced the
working `project_isolation` RLS policies on the five product tables
(`sessions`, `thoughts`, `entities`, `relations`, `observations`) with
`user_project_access` policies. The new policies route access through a
`user_can_access_project()` function that queries `workspace_memberships`
via `auth.uid()`.

Nothing in the current system populates workspace or membership rows. The
MCP server does not use `auth.uid()`-based authentication -- it mints custom
JWTs with a `project` claim via `SupabaseStorage.setProject()` and
`refreshClient()`. The result: all authenticated data access to product
tables fails. 33 integration tests are broken.

### What worked before

The original `project_isolation` policies from migration `20260313000000`
used a simple check: `project = (auth.jwt() ->> 'project')`. This matched
the MCP server's JWT minting pattern exactly. Data access worked. Tests
passed.

### Constraints from existing ADRs

- **ADR-013** (setProject two-phase init): Establishes that the MCP server
  uses `setProject()` to configure project scope, which writes a `project`
  claim into the JWT.
- **ADR-GCP-01** (Supabase as control plane): Supabase is the data layer.
  RLS is the access control mechanism.
- **ADR-DATA-01** (product schema): All five product tables have a `project`
  column and a `service_role_bypass` policy for admin access.

### Reconciliation with ADR-AUTH-01

ADR-AUTH-01 assumed that workspace memberships would be auto-provisioned
during user onboarding and that `auth.uid()` would be the primary access
control mechanism. Neither assumption holds today:

1. No membership provisioning flow exists.
2. The MCP server authenticates via custom JWTs with project claims, not
   `auth.uid()`.

ADR-AUTH-01's "rejected alternative" section explicitly noted the custom JWT
approach as a temporary measure. The current situation demonstrates that the
custom JWT approach is the only working approach, and the workspace
membership path is not yet viable.

ADR-AUTH-01 needs amendment to reflect this. This ADR does not amend it
directly -- it restores the working state and documents the rationale.
AUTH-01's workspace membership RLS remains a valid future direction once
membership provisioning exists.

## Decision

Revert the five product tables to `project_isolation` RLS policies. Drop the
`user_project_access` policies and the `user_can_access_project()` function.

This is the correct decision because:

1. **It restores a known-working state.** The `project_isolation` policies
   were tested and functional. The replacement broke all data access.
2. **It matches the MCP server's auth model.** The server mints JWTs with a
   `project` claim. The `project_isolation` policy checks that claim. No
   middleware or membership tables required.
3. **It unblocks the demo path.** The staging environment and integration
   tests depend on working CRUD. This is blocking.
4. **It does not preclude workspace membership RLS later.** The workspace
   tables, membership tables, and their policies are left untouched. When
   membership provisioning is built, a new migration can layer workspace-
   aware policies on top of or alongside project_isolation.

## Consequences

### Enables

- MCP server data access works via custom JWT project claims
- 33 integration tests unblocked
- Demo path (`project: 'demo'`) functional in staging
- Cross-project isolation enforced at the database level

### Defers

- Workspace membership-based RLS (requires membership provisioning first)
- `auth.uid()`-based access control for product tables
- Multi-user workspace collaboration on shared projects

### Tradeoffs

- The `project` claim in the JWT is the sole access control for product
  tables. If a client can mint a JWT with an arbitrary project claim, it can
  access that project's data. This is acceptable because JWT minting is
  server-side only (`SupabaseStorage.refreshClient()` uses the service role
  key).
- Workspace and membership tables remain in the schema but are unused by
  product table RLS. This is dead schema relative to data access, but the
  tables serve the web app's workspace UI and will be needed when membership
  provisioning is built.

## Hypotheses

### Hypothesis 1: Migration SQL correctly drops user_project_access and restores project_isolation on all 5 product tables

**Prediction**: After execution, all 5 tables have a `project_isolation`
policy. No table has a `user_project_access` policy. The
`user_can_access_project()` function does not exist.

**Validation**: Query `pg_policies` and `pg_proc` after execution:
```sql
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public'
  AND policyname IN ('project_isolation', 'user_project_access')
ORDER BY tablename;

SELECT proname FROM pg_proc WHERE proname = 'user_can_access_project';
```
Expected: 5 rows of `project_isolation`, 0 of `user_project_access`, 0 from
`pg_proc`.

**Outcome**: PENDING

### Hypothesis 2: Restored project_isolation policies match MCP server's JWT minting (project claim in JWT)

**Prediction**: A JWT with `{ "project": "demo" }` enables INSERT, SELECT,
UPDATE, DELETE on all 5 tables for `project = 'demo'`. A JWT with
`{ "project": "other" }` returns 0 rows for `demo` data.

**Validation**: Integration test using `SupabaseStorage.setProject('demo')`
followed by CRUD operations. Then `setProject('other')` and verify 0 rows
returned for demo data.

**Outcome**: PENDING

### Hypothesis 3: service_role_bypass policies remain functional alongside restored project_isolation

**Prediction**: A service role client sees all rows on all 5 tables
regardless of project. An authenticated client with a project claim sees
only rows matching that project.

**Validation**: Query with both service_role and authenticated clients.
Service role returns rows across multiple projects; authenticated client
returns only its project's rows.

**Outcome**: PENDING

### Hypothesis 4: 33 integration tests pass after the revert migration is applied

**Prediction**: `pnpm test -- --grep supabase` in `thoughtbox-staging` shows
33 passing tests that were previously failing.

**Validation**:
```bash
cd thoughtbox-staging
pnpm test -- --grep "supabase"
```

**Outcome**: PENDING

### Hypothesis 5: Cross-project isolation holds -- two projects see zero overlap

**Prediction**: Two `SupabaseStorage` instances with different project claims
(`project-a`, `project-b`) see only their own rows. A cross-project INSERT
(JWT says `project-a`, row says `project-b`) is rejected by the WITH CHECK
clause.

**Validation**: Integration test with two `SupabaseStorage` instances scoped
to different projects. Verify zero row overlap and rejected cross-project
writes.

**Outcome**: PENDING

## Spec

Migration SQL and acceptance criteria:
[.specs/deployment/rls-revert-migration.md](../../.specs/deployment/rls-revert-migration.md)

## Links

- **ADR-AUTH-01**: Introduced the `user_project_access` policies this ADR
  reverts. Needs amendment to reflect that workspace membership RLS is
  deferred until provisioning exists.
- **ADR-DATA-01**: Defines the product schema with `project` column and
  `service_role_bypass` policy. This ADR's migration preserves that schema.
- **ADR-013**: Establishes `setProject()` two-phase init pattern. The
  `project_isolation` policies depend on the JWT claim that `setProject()`
  writes.
- **ADR-GCP-01**: Supabase as control plane. RLS is the access control
  mechanism. This ADR restores the working RLS configuration.
