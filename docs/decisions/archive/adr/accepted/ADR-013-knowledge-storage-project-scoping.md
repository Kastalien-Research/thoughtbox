# ADR-013: Storage Project Scoping

**Status**: Accepted
**Date**: 2026-03-12
**Deciders**: Thoughtbox development team

## Context

### Why project isolation exists

Thoughtbox isolates context per project so that an agent working in `thoughtbox-staging` sees only `thoughtbox-staging` sessions and knowledge, not data from other projects. The project boundary is determined at runtime by the progressive disclosure flow: `get_state` -> `bind_root` (or `start_new`) -> work begins. `bind_root` extracts the project name from the client's MCP root URI (e.g., `file:///path/to/thoughtbox-staging` -> project `thoughtbox-staging`).

### The bug

Both storage interfaces -- `ThoughtboxStorage` (sessions, thoughts) and `KnowledgeStorage` (knowledge graph) -- have a single implementation today (`FileSystemStorage`, `FileSystemKnowledgeStorage`). Both read the `THOUGHTBOX_PROJECT` environment variable at server startup, falling back to `_default`. This bypasses the progressive disclosure flow:

1. Server starts, storage initializes scoped to `_default`.
2. Client connects, calls `bind_root` -> `StateManager` knows the project is `thoughtbox-staging`.
3. Client calls knowledge operations -> handler queries `_default` -> returns empty results because the data lives under `thoughtbox-staging`.

Result: 35K lines of knowledge graph data at `~/.thoughtbox/projects/thoughtbox-staging/memory/graph.jsonl` are invisible to the running server.

### Same code, any backend

`ThoughtboxStorage` and `KnowledgeStorage` are interfaces. Today the only implementations are filesystem-based (local development). For GCP deployment (ADR-GCP-01), Supabase-backed implementations will exist. The fix must be at the interface level so that both backends work identically:

- Filesystem: `setProject()` sets the directory path
- Supabase: `setProject()` sets the tenant/schema scope
- From the MCP client's perspective, behavior is identical

## Decision

Add `setProject(project: string): Promise<void>` to `ThoughtboxStorage` and `KnowledgeStorage` interfaces. Remove `THOUGHTBOX_PROJECT` env var.

Concretely:

- `ThoughtboxStorage` and `KnowledgeStorage` interfaces gain `setProject(project: string)` -- project scoping is part of the storage contract, not an implementation detail.
- Storage constructors accept a base location only (filesystem path or connection config). No project at construction time.
- `InitToolHandler.handleBindRoot()` and `handleStartNew()` call `setProject()` on both storage layers after the progressive disclosure flow determines the project name.
- Operations called before `setProject()` return explicit errors ("project scope not established") instead of silently querying the wrong project.
- `THOUGHTBOX_PROJECT` is removed from `docker-compose.yml`, `src/index.ts`, and `src/server-factory.ts`.
- `THOUGHTBOX_TRANSPORT` is also removed from `docker-compose.yml` -- the server defaults to HTTP; the env var is unnecessary.

## Consequences

### Positive

- Storage operations return correct data for the bound project instead of empty results from `_default`.
- Project scoping is driven by the progressive disclosure flow -- the same code path that determines the project also scopes the storage.
- Removing `THOUGHTBOX_PROJECT` eliminates a configuration surface that contradicts the runtime behavior.
- Clear error messages when operations are called before project scoping, instead of silent wrong results.
- `setProject()` on the interface means any future backend (Supabase, etc.) gets project scoping automatically -- no separate wiring needed.

### Negative

- Operations called before `bind_root`/`start_new` that previously returned empty results from `_default` will now return errors. This is intentional -- the progressive disclosure flow is not optional.
- `setProject()` adds a lifecycle method to storage interfaces. Storage instances are not "ready to use" after construction. Callers must be aware of the two-phase initialization.
- Existing `_default` project data at `~/.thoughtbox/projects/_default/` becomes accessible only by explicitly binding to `_default` as the project name. No migration needed -- clients using `bind_root` already get the correct project.

### Neutral

- Hub storage (`HubStorage`) is unaffected -- it operates at the base directory level, not per-project.
- The storage directory/schema structure under each project is unchanged.

## Hypotheses

### H1: Deferred initialization eliminates the data mismatch

**Signal**: After `bind_root` to `thoughtbox-staging`, `knowledge_stats` returns entity counts > 0 from the existing dataset.

**Observation**: Currently returns 0 entities because storage is scoped to `_default`.

**Falsification**: If `knowledge_stats` still returns 0 after implementation, `setProject()` is not propagating to the knowledge handler.

**Test plan**: Start server. Call `bind_root` with `file:///path/to/thoughtbox-staging`. Call `knowledge_stats`. Assert entity counts > 0.

### H2: THOUGHTBOX_PROJECT removal has no negative effect

**Signal**: After removing `THOUGHTBOX_PROJECT`, the normal flow (`bind_root` -> work) continues to function identically.

**Observation**: `THOUGHTBOX_PROJECT` is currently read but its value is always overridden by `bind_root` in the state manager. The env var only affects storage initialization, which this ADR moves to the progressive disclosure flow.

**Falsification**: If any code path depends on `THOUGHTBOX_PROJECT` outside of storage initialization, removing it would break that path. A `rg "THOUGHTBOX_PROJECT"` search should confirm no other consumers exist.

**Test plan**: Remove the env var. Restart. Run `bind_root` -> `start_new` -> `thought` -> `knowledge_stats`. Verify all operations succeed.

## Spec

`.specs/knowledge-storage-project-scoping.md`

## Links

- `src/persistence/types.ts` -- `ThoughtboxStorage` interface
- `src/knowledge/types.ts` -- `KnowledgeStorage` interface
- `src/init/tool-handler.ts` -- `handleBindRoot()` and `handleStartNew()` determine project name
- `src/init/state-manager.ts` -- `StateManager` stores project per session
- `docker-compose.yml` -- `THOUGHTBOX_PROJECT: _default` (to be removed)
- `.adr/accepted/ADR-GCP-01-cloud-run-service-config.md` -- Supabase backend will implement the same `setProject()` interface
