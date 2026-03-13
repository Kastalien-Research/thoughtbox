# ADR-DATA-01: Supabase Product Schema for Deployed Storage Backend

**Status**: Accepted
**Date**: 2026-03-13
**Deciders**: Thoughtbox development team
**Initiative**: `.specs/deployment/v1-initiative.md` (WS-01)

## Context

### Problem

Thoughtbox runs on Google Cloud Run where containers are stateless (ADR-GCP-01). The current storage backends -- `FileSystemStorage` for sessions/thoughts and `FileSystemKnowledgeStorage` for the knowledge graph -- write to the local filesystem, which is ephemeral on Cloud Run. Deployed instances need a persistent backend.

### Current State

Two storage interfaces exist with filesystem-only implementations:

- **`ThoughtboxStorage`** (`src/persistence/types.ts`): manages sessions (id, title, tags, timestamps), thoughts (~25 fields including thought content, type, revision/branch pointers, agent attribution, Merkle chain hashes, critique metadata), and ThoughtNode linked-list structure (prev, next[], revisesNode, branchOrigin).
- **`KnowledgeStorage`** (`src/knowledge/types.ts`): manages entities (5 types: Insight, Concept, Workflow, Decision, Agent), relations (9 types), and observations with temporal validity. Uses SQLite with FTS5 for full-text search on observation content.

ADR-013 added `setProject()` to both interfaces, decoupling project scoping from filesystem paths. This prepared the abstraction layer for non-filesystem backends.

### Constraints from Research (Phase 1)

Seven hypotheses were approved during Phase 1 research:

- **H1**: Product schema is mechanically derivable from TypeScript interfaces -- Session has 10 fields, ThoughtData has ~25, ThoughtNode has 7 structural pointers, Entity has 15 fields, Relation has 7, Observation has 9.
- **H2**: `THOUGHTBOX_STORAGE` env var is the integration point -- adding `supabase` as a third option in `createStorage()` at `src/index.ts:49`.
- **H3**: SQLite schema translates directly to Postgres -- entities/relations/observations tables map 1:1, FTS5 becomes tsvector/GIN.
- **H4**: ThoughtNode linked-list maps to self-referential columns -- `prev`/`next[]` are derived from ordered rows, not stored as pointers.
- **H5**: `setProject()` signs a custom JWT with the project ID to enforce RLS, instead of separating schemas or relying on `SET LOCAL` which does not persist across stateless REST requests.
- **H6**: `rebuildIndexFromJsonl()` is a no-op for Supabase -- Postgres is both source of truth and query engine.
- **H7**: Raw SQL migrations via Supabase CLI, no ORM.

### Scope Boundary

This ADR covers **product data only**: sessions, thoughts, and knowledge graph (entities, relations, observations). SaaS platform concerns (user accounts, billing, API keys, subscription tiers) are out of scope and belong to a future WS-02 ADR.

## Decision

Define a Postgres schema with five tables (`sessions`, `thoughts`, `entities`, `relations`, `observations`) derived from the TypeScript interfaces. Implement `SupabaseStorage` and `SupabaseKnowledgeStorage` classes that plug into the existing interface contracts alongside the filesystem implementations. Use a `project` column with RLS for multi-project isolation. Manage schema with raw SQL migrations via Supabase CLI.

### Why this approach

**Dual backend, not replacement.** The filesystem backend serves local/self-hosted use. The Supabase backend serves Cloud Run deployment. Both implement identical interfaces. The `createStorage()` factory selects the backend via `THOUGHTBOX_STORAGE` env var. This preserves the zero-dependency local development experience while enabling production deployment.

**Column-based project isolation with Custom JWTs, not schema-per-project.** Separate schemas per project would require dynamic schema creation, complicate migrations, and prevent cross-project queries if ever needed. A `project` column with RLS is simpler, standard, and aligns with ADR-013's `setProject()` contract. Because Supabase uses PostgREST (a stateless HTTP API), `SET LOCAL` commands do not persist between requests. To solve this and enforce RLS strictly, `setProject()` will mint a short-lived custom JWT containing the `project` ID and the `authenticated` role, signed by the `SUPABASE_JWT_SECRET`. This provides true database-level tenant isolation natively over the REST API without bypassing RLS via the `service_role` key.

**Derived linked-list, not stored pointers.** The ThoughtNode linked-list (`prev`, `next[]`) is an in-memory optimization. Storing these as FK columns would create circular dependencies and complicate inserts. Instead, the ordered `thought_number` column within a session and branch provides the same traversal capability via window functions (`LAG`/`LEAD`). Branch and revision pointers (`branch_from_thought`, `revises_thought`) are stored as integer columns referencing thought numbers within the same session.

**JSONB for polymorphic fields.** ThoughtData has 7 optional type-specific fields (`options`, `actionResult`, `beliefs`, `assumptionChange`, `contextData`, `progressData`, `critique`) with varying shapes. JSONB preserves the TypeScript structure without schema explosion while remaining queryable.

**tsvector/GIN for full-text search.** The SQLite FTS5 virtual table on observations translates to a generated tsvector column with GIN index. This provides equivalent full-text search capability with Postgres-native syntax.

**Raw SQL migrations.** No ORM exists in the codebase (H7). The existing SQLite schema is raw SQL. Supabase CLI migration workflow (`supabase migration new`, `supabase db push`) is the standard approach.

### Alternatives considered

- **Cloud Storage FUSE**: Rejected in ADR-GCP-01. File locking on concurrent writes, data outside Supabase control plane.
- **Drizzle ORM**: Would add a dependency for schema management. The project has no ORM. Raw SQL is more transparent for the 5-table schema.
- **Separate schemas per project**: Operational complexity (dynamic DDL, migration per schema) without proportional benefit.

## Consequences

### Positive

- Cloud Run containers are fully stateless -- all product data persists in Supabase Postgres.
- Local development and self-hosted deployments are unchanged -- `FileSystemStorage` remains the default.
- Schema is mechanically derived from TypeScript interfaces -- column names, types, and constraints have a clear source.
- RLS provides project isolation natively at the database level leveraging JWT claims (`auth.jwt() ->> 'project'`), enforced securely over REST without relying on the `service_role` key bypassing policy checks.
- Full-text search on knowledge graph observations works in both backends (FTS5 locally, tsvector in Supabase).
- Two new dependencies (`@supabase/supabase-js` and `jsonwebtoken`) -- no ORM, no schema generator.

### Negative / Tradeoffs

- Two storage implementations to maintain. Feature additions to the storage interfaces require changes in both backends. Mitigated by the interface contract and shared test suites.
- ThoughtNode reconstruction from ordered rows adds query complexity compared to the in-memory linked-list. Window functions handle this but are harder to debug than Map lookups.
- JSONB columns for polymorphic thought fields are not schema-enforced at the database level. Invalid JSON shapes would pass Postgres validation. Mitigated by TypeScript types at the application layer.
- `thought_count` and `branch_count` on `sessions` are denormalized. Must be kept in sync via application logic (same as current filesystem implementation).

### Follow-ups

- ADR-GCP-02 (Secret Management): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_JWT_SECRET` must reach Cloud Run securely.
- WS-02 (SaaS Platform): User accounts, billing, API keys schema -- builds on top of the product schema defined here.
- Data migration tooling: Script to import existing filesystem data (JSONL, JSON thought files) into Supabase for initial deployment.

## Hypotheses

### Hypothesis 1: Supabase schema supports full ThoughtboxStorage interface

**Prediction**: All 18 methods of `ThoughtboxStorage` pass against the Supabase backend with identical behavior to `InMemoryStorage`.

**Validation**: Run the existing `InMemoryStorage` test suite against `SupabaseStorage`. **Crucially, these must be integration tests against a real local database spun up via `supabase start`. Module-level mocking of `@supabase/supabase-js` is forbidden** because it cannot validate database-level guarantees. All tests pass.

**Outcome**: PENDING

### Hypothesis 2: ThoughtNode linked-list reconstruction produces correct traversal

**Prediction**: `toLinkedExport()` on `SupabaseStorage` produces a `SessionExport` with identical `prev`/`next[]` pointers as `InMemoryStorage` for the same thought sequence (including branches and revisions).

**Validation**: Create a session against the local real database with 5 main-chain thoughts, 2 branch thoughts, and 1 revision. Export from both backends. Assert structural equality of the node graph.

**Outcome**: PENDING

### Hypothesis 3: RLS enforces project isolation with Custom JWTs

**Prediction**: With a custom JWT encoding `project = 'project-A'`, queries against all five tables return zero rows that belong to `project-B`.

**Validation**: Insert rows for both projects into the local test database. Initialize a Supabase client with a JWT containing the payload `{ role: 'authenticated', project: 'project-A' }` signed by the JWT Secret. Run `SELECT count(*) FROM sessions WHERE project = 'project-B'` -- expect 0. Repeat for all tables. This validates the actual RLS policies, proving mocks are insufficient.

**Outcome**: PENDING

### Hypothesis 4: tsvector FTS returns equivalent results to FTS5

**Prediction**: A search for "orchestrator pattern" against observations returns the same entity matches as the SQLite FTS5 implementation.

**Validation**: Insert 10 observations with known content into the local test database. Search with `plainto_tsquery('english', 'orchestrator pattern')`. Compare results to `observations_fts MATCH 'orchestrator pattern'` from SQLite.

**Outcome**: PENDING

### Hypothesis 5: UNIQUE constraint handles branch_id NULL correctly

**Prediction**: The `UNIQUE NULLS NOT DISTINCT(session_id, thought_number, branch_id)` constraint on `thoughts` strictly enforces uniqueness across main-chain thoughts and branches. Because PostgreSQL 15+ supports `NULLS NOT DISTINCT`, replacing the default behavior where NULL values are considered distinct, we can prevent identical main-chain thoughts.

**Validation**: Insert two thoughts into the local test database: `(session-1, 1, NULL)` and `(session-1, 1, 'alt-1')`. Both succeed. Insert `(session-1, 1, NULL)` again -- the real database fails with a unique violation.

**Outcome**: PENDING

### Hypothesis 6: createStorage() correctly wires both storage layers

**Prediction**: Setting `THOUGHTBOX_STORAGE=supabase` causes `createStorage()` to return a `StorageBundle` with `SupabaseStorage` as `storage` and `SupabaseKnowledgeStorage` created and initialized.

**Validation**: Unit test: set env var, call `createStorage()`, assert `storage instanceof SupabaseStorage`. Integration test: call `setProject()`, `createSession()`, `createEntity()` -- both storage layers operate against Supabase.

**Outcome**: PENDING

### Hypothesis 7: Denormalized counts stay consistent under concurrent writes

**Prediction**: `thought_count` and `branch_count` on `sessions` remain accurate after 20 concurrent thought writes to the same session, thanks to database-level triggers.

**Validation**: Run 20 parallel `saveThought()` calls against the local test database. Assert `sessions.thought_count = 20`. A mocked client cannot test this, as the trigger lives in PostgreSQL.

**Outcome**: PENDING

## Spec

[.specs/deployment/data-01-supabase-product-schema.md](../../.specs/deployment/data-01-supabase-product-schema.md)

## Links

- **Prerequisite**: [ADR-013 (accepted)](../accepted/ADR-013-knowledge-storage-project-scoping.md) -- `setProject()` on storage interfaces
- **Prerequisite**: [ADR-GCP-01 (accepted)](../accepted/ADR-GCP-01-cloud-run-service-config.md) -- Cloud Run config, Supabase decision
- **Initiative**: `.specs/deployment/v1-initiative.md`
- **Bead**: tb-l2y (HDD ADR-DATA-01 Migration tooling)
- **Source files**:
  - `src/persistence/types.ts` -- `ThoughtboxStorage` interface, `Session`, `ThoughtData`, `ThoughtNode`
  - `src/knowledge/types.ts` -- `KnowledgeStorage` interface, `Entity`, `Relation`, `Observation`
  - `src/persistence/filesystem-storage.ts` -- `FileSystemStorage` implementation
  - `src/knowledge/storage.ts` -- `FileSystemKnowledgeStorage` with SQLite schema
  - `src/persistence/storage.ts` -- `InMemoryStorage`, `LinkedThoughtStore`
  - `src/index.ts` -- `createStorage()` factory
