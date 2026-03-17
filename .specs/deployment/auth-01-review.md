# AUTH-01 Implementation Review

**Date**: 2026-03-15
**Reviewer**: Human + Claude (post-merge code review of PR #165)
**Branch**: `feat/auth-01-supabase-oauth`
**Key commits**: `ae1fda5` (initial impl), `e3d61b1` (Cloud Run fixes), `f59b4ed`–`3bbdb8c` (PR review fixes)

## Summary

AUTH-01 delivered working auth middleware but also pulled in data model and RLS work that belongs to WS-02 (Data Layer). The workspace/membership tables and RLS policy rewrite were sourced from a ChatGPT scratch document (`chatgpt-data-model.md`) that was treated as authoritative spec. That document was exploratory — useful for tracking intent, not a decided data model.

The result: auth middleware works, but the RLS rewrite broke 33 integration tests and introduced a known security flaw (project name collisions across workspaces).

---

## What was scoped (v1-initiative.md)

**WS-03 (Auth & Identity)**: "Supabase Auth configuration, JWT validation on the Cloud Run service, API key issuance/validation scheme."

**ADR-AUTH-01** per the initiative: "Supabase Auth configuration and session strategy."

Neither mentions workspace tables, membership models, or RLS policy rewrites. Those belong to:

- **WS-02 (Data Layer)**, specifically ADR-DATA-02: "RLS policy design per table"

---

## What was actually delivered

### In scope (working correctly)

| Deliverable | Files | Status |
|-------------|-------|--------|
| JWT validation middleware (JWKS, ES256) | `src/middleware/auth.ts` | Validated (7 unit tests) |
| Conditional auth enforcement (Supabase mode only) | `src/index.ts` | Validated (3 unit tests) |
| `userToken` passthrough to storage classes | `src/persistence/supabase-storage.ts`, `src/knowledge/supabase-storage.ts` | Working |
| Per-session storage isolation (PR review fix) | `src/index.ts` | Fixed in `f59b4ed` |
| `jose` dependency for JWKS validation | `package.json` | Pinned to 6.2.1 |
| Query param token warning | `src/index.ts` | Added in `3bbdb8c` |
| Dual-backend auth path (FS skips, Supabase enforces) | `src/index.ts` | Working |
| Existing handlers unchanged | All handler files | Confirmed (434 tests pass) |

### Out of scope (pulled from WS-02)

| Deliverable | Files | Status | Problem |
|-------------|-------|--------|---------|
| `profiles` table | `20260313100000_auth_workspace_tables.sql` | Created | Nothing uses it |
| `workspaces` table | Same migration | Created | Nothing uses it |
| `workspace_memberships` table | Same migration | Created | Nothing uses it |
| `projects` table | Same migration | Created | Nothing uses it |
| `user_can_access_project()` function | Same migration | Created | Name collision flaw (tb-c26) |
| RLS rewrite: `project_isolation` → `user_project_access` | Same migration | **Broken** | Breaks 33 integration tests |
| RLS policy fixes for workspace/membership tables | `20260315000000_fix_rls_auth_policies.sql` | Created (PR review) | Fixing policies on tables that shouldn't exist yet |

---

## How the scope creep happened

1. `chatgpt-data-model.md` in `.specs/deployment/raw-materials/` defined a full SaaS data model (workspaces, memberships, plans, subscriptions). This was scratch work for brainstorming, not a decided architecture.

2. SPEC-AUTH-01 included it in scope: *"SaaS platform tables (profiles, workspaces, workspace_memberships, projects) are added alongside the existing product schema."* The spec treated the scratch doc as the data model source.

3. ADR-AUTH-01 accepted the spec and committed to 4 new tables + RLS rewrite as part of auth work.

4. The implementing agent executed faithfully against the spec. The spec was wrong about scope, not the implementation.

5. The ADR's own hypothesis validation (H3, H4) tested the membership-based RLS in isolation and confirmed it works — but against test fixtures that create workspace/membership rows. The existing integration tests don't create these fixtures, so they break.

---

## Current state of the database

### Local Supabase (Docker Desktop)

Three migrations applied:
- `20260313000000_create_product_schema.sql` — product tables with original `project_isolation` RLS
- `20260313100000_auth_workspace_tables.sql` — workspace/membership tables + RLS rewrite (overwrites `project_isolation`)
- `20260315000000_fix_rls_auth_policies.sql` — granular CRUD policies on workspace/membership tables

The original `project_isolation` policies no longer exist. The `user_project_access` policies require workspace membership rows that the integration tests don't create.

### Hosted Supabase (`akjccuoncxlvrrtkvtno`)

Cloud Run env vars reference this project. Migration state unknown — needs verification.

### Cloud Run (`thoughtbox-mcp`)

Deployed with `THOUGHTBOX_STORAGE=supabase`. Supabase credentials set as **plaintext env vars** (not Secret Manager). This is tracked as tb-1ay (ADR-GCP-02).

---

## Known issues

### 33 broken integration tests

- `src/persistence/__tests__/supabase-storage.test.ts` — all tests fail with RLS violation
- `src/knowledge/__tests__/supabase-knowledge-storage.test.ts` — all tests fail with RLS violation
- `src/__tests__/supabase-rls.test.ts` — all tests fail with RLS violation

Root cause: Tests mint custom JWTs with `{ role: 'authenticated', project: '<name>' }`. The old `project_isolation` policy checked this claim directly. The new `user_project_access` policy calls `user_can_access_project()` which checks `workspace_memberships` via `auth.uid()`. The custom JWTs have no `sub` claim, so `auth.uid()` returns null, and the membership lookup fails.

These tests passed before commit `ae1fda5`.

### Project name collision (tb-c26)

`user_can_access_project()` matches by `projects.name`, not by workspace-scoped ID. Two workspaces with identically-named projects would grant cross-workspace access. Product tables don't have `workspace_id` — adding it is a data model change that belongs in WS-02.

### `SUPABASE_JWT_SECRET` on Cloud Run

The value on Cloud Run (`09f12343-984e-44ef-af6a-50ddef778305`) is the JWKS key ID, not the HS256 signing secret. This value is used by `SupabaseStorage.refreshClient()` to mint custom JWTs when no `userToken` is provided. If this path is ever hit in production, the minted JWT would be signed with the wrong key and fail RLS. In practice, the per-session storage fix (`f59b4ed`) always provides `userToken` in Supabase mode, so this path shouldn't execute — but it's a latent bug.

---

## Options

### Option A: Revert the RLS rewrite, keep auth middleware

Restore `project_isolation` policies on product tables. Keep the workspace/membership tables as empty scaffolding (no policy enforcement on product tables). Keep all auth middleware. Tests pass again.

The tables can be properly integrated when WS-02 / ADR-DATA-02 decides the data model. The RLS rewrite happens then, with tests updated as part of the same work.

**What you keep**: Auth middleware, token validation, per-session storage, jose, dual-backend behavior.
**What you revert**: Product table RLS rewrite only. Tables stay.

### Option B: Fix the tests to work with membership-based RLS

Update `supabase-test-helpers.ts` to create workspace + membership rows before each test. The membership-based RLS becomes the new baseline.

**Risk**: Locks in a data model (workspaces, memberships, projects) that came from scratch work and hasn't been through WS-02's HDD process. If the data model changes, both the migration and the test fixtures need rework.

### Option C: Revert the entire second migration

Drop the 4 tables entirely. Restore `project_isolation`. The workspace/membership model starts fresh in WS-02.

**Risk**: If the hosted Supabase already has these tables with data, the revert migration needs to be carefully sequenced.

---

## Recommendation

**Option A.** The auth middleware is the actual AUTH-01 deliverable and it works. The data model belongs in WS-02 and should go through HDD before being committed to. Reverting the RLS rewrite is low-risk (one migration) and unblocks the test suite immediately. The tables can stay as scaffolding — they're inert without policy enforcement on product tables.

---

## Related beads

- **tb-c26**: RLS: scope `user_can_access_project` by `workspace_id` (P2, open)
- **tb-1ay**: ADR-GCP-02 Secret management strategy (open)
- **tb-9m0**: ADR-GCP-03 CI/CD pipeline (open)
