# SPEC: Storage Project Scoping

**ADR**: ADR-013
**Status**: Draft
**Date**: 2026-03-12

## Problem

Storage implementations read `THOUGHTBOX_PROJECT` env var at startup, defaulting to `_default`. The progressive disclosure flow (`bind_root` / `start_new`) determines the actual project at runtime. These two paths disagree: storage initializes before the project is known.

Result: knowledge operations return empty results because they query `_default` while the client bound to `thoughtbox-staging`.

## Target State

After this work:

1. **Storage interfaces include project scoping.** `ThoughtboxStorage` and `KnowledgeStorage` gain `setProject(project: string): Promise<void>`. Any backend (filesystem, Supabase) implements this to scope to a project.
2. **`bind_root` / `start_new` triggers storage scoping.** The progressive disclosure flow calls `setProject()` on both storage layers after determining the project name.
3. **Operations before project scoping return clear errors.** Any call to a storage method that requires a project before `bind_root`/`start_new` returns a descriptive error, not silent empty results.
4. **`THOUGHTBOX_PROJECT` env var is removed.** The `_default` fallback is removed. Project comes from the progressive disclosure flow.
5. **Same interface, any backend.** Filesystem sets a directory path. Supabase sets a tenant/schema. MCP clients see identical behavior regardless of backend.

## Changes

### `ThoughtboxStorage` interface (`src/persistence/types.ts`)

- New method: `setProject(project: string): Promise<void>` -- sets the project scope. Implementations perform backend-specific initialization (directory creation, schema selection, etc.). No-op if already set to the same project. Throws if set to a different project.
- New method: `getProject(): string` -- returns the current project. Throws if not yet scoped.

### `KnowledgeStorage` interface (`src/knowledge/types.ts`)

- New method: `setProject(project: string): Promise<void>` -- same contract as above.

### `FileSystemStorage` (`src/persistence/filesystem-storage.ts`)

- Constructor accepts `basePath` and `partitionGranularity` only. `project` field removed from `FileSystemStorageOptions`.
- `setProject()`: sets the project scope, creates directories, loads sessions. Throws if already scoped to a different project.
- `getProject()`: throws `StorageNotScopedError` if project not yet set.
- All session/thought operations throw `StorageNotScopedError` if `setProject` has not been called.

### `FileSystemKnowledgeStorage` (`src/knowledge/storage.ts`)

- Constructor accepts `basePath` only. `project` field removed from `KnowledgeStorageOptions`.
- `setProject()`: sets project scope, creates directories, opens SQLite, rebuilds index from JSONL.
- `initialize()` folded into `setProject()`.
- All entity/relation/observation operations throw `StorageNotScopedError` if `setProject` has not been called.

### `InMemoryStorage` (`src/persistence/storage.ts`)

- `setProject()`: stores the project name. No filesystem/database work needed.
- `getProject()`: returns the stored project or throws if not set.

### `createStorage()` (`src/index.ts`)

- Remove `THOUGHTBOX_PROJECT` env var read.
- Create storage without a project. Call `initialize()` for base setup (config, legacy migration) but not project-specific work.

### `createMcpServer()` (`src/server-factory.ts`)

- Remove `THOUGHTBOX_PROJECT` env var read.
- Create `FileSystemKnowledgeStorage` without a project. Don't call `initialize()`.
- Pass knowledge storage reference to `InitToolHandler` so it can call `setProject()`.

### `InitToolHandler` (`src/init/tool-handler.ts`)

- `handleBindRoot()` and `handleStartNew()`: after determining the project name, call `storage.setProject(project)` and `knowledgeStorage.setProject(project)`.
- `InitToolHandlerConfig` gains a `knowledgeStorage?: KnowledgeStorage` field (interface, not implementation).
- Error handling: if `setProject` fails, return `isError: true` with the failure reason.

### `docker-compose.yml`

- Remove `THOUGHTBOX_PROJECT: _default`.
- Remove `THOUGHTBOX_TRANSPORT: http` (server defaults to HTTP).

## Acceptance Criteria

1. **Cold start, bind_root flow**: Server starts. Client calls `bind_root` with `file:///path/to/thoughtbox-staging`. Client calls `knowledge_stats`. Response shows entity counts > 0 matching existing data.
2. **Cold start, start_new flow**: Server starts. Client calls `start_new { project: "my-project" }`. Client calls `knowledge_stats`. Response shows entity counts for `my-project` (0 if new, > 0 if existing data).
3. **Operations before scoping**: Client calls `knowledge_stats` before `bind_root` or `start_new`. Response is `isError: true` with message indicating project scope not established.
4. **No `_default` fallback**: `rg "THOUGHTBOX_PROJECT" src/ docker-compose.yml` returns zero results. `rg "_default" src/persistence/filesystem-storage.ts src/knowledge/storage.ts src/index.ts src/server-factory.ts` returns zero results.
5. **Existing data unaffected**: Data at `~/.thoughtbox/projects/thoughtbox-staging/` is read correctly after the change. No migration needed -- only initialization timing changes.
6. **Hub storage unaffected**: Hub operations work before and after `bind_root` -- hub is project-independent.
