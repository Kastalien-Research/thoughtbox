# 02 — Catalog and Codebase Operations

> Part of [Project-as-API Spec](./00-index.md)

## The Catalog Plane

### Purpose

The catalog collapses the unbounded search space of a TypeScript codebase into a typed,
navigable surface. The agent reads `tp.catalog.describeModule("knowledge")` and receives a
manifest of that module's public contract — exports, operation signatures, dependencies —
without needing to grep source files or chase import chains.

The catalog is the **primary navigation layer**. An agent that uses it correctly should not
need raw filesystem exploration for modules it has already visited. Discovery queries
(reads/greps before a first edit) should trend down on repeat task types as agents learn to
go to the catalog first.

This is the mechanism by which Project Mode achieves the "greater understanding AND greater
safety" property: the agent's model of the codebase is derived from the actual semantic
model, not from an approximation built through exploration.

### Module Convention

A **module** is a `src/<name>/` directory that contains an `index.ts` barrel exporting the
module's public surface. This matches the existing Thoughtbox project convention exactly:
`src/knowledge/`, `src/hub/`, `src/persistence/`, etc.

Modules without an `index.ts` barrel are not indexed (they are implementation details, not
a public surface). This is intentional: the catalog presents what should be navigated, not
everything that exists.

### ts-morph Indexing

The catalog is built using [ts-morph](https://ts-morph.com/) against the project's
`tsconfig.json`. The indexer:

1. Loads the project from `tsconfig.json` at the repo root.
2. Enumerates `src/*/index.ts` files.
3. For each `index.ts`, extracts:
   - All named exports: name, kind, and signature (for functions/classes).
   - Re-exports are resolved to their source symbol.
4. For each module, checks for `src/<name>/operations.ts`. If present, imports
   `*_OPERATIONS` arrays (following the existing naming convention: `SESSION_OPERATIONS`,
   `KNOWLEDGE_OPERATIONS`, etc.) and includes them as `operations` in the manifest.
5. Builds the inter-module dependency graph: for each module's source files, collects
   which other `src/<name>/` directories they import from.

**What is NOT indexed:**
- `src/__tests__/` and any `__tests__/` directories — test code is not part of the public surface.
- `src/database.types.ts` and generated files — surfaced separately if needed.
- `node_modules/` — never.

### Startup and Invalidation

The catalog is built once at server startup and held in memory. Build time for a
TypeScript project of this size (150 source files) is expected to be under 5 seconds on
first load.

A `chokidar` file watcher watches `src/**/*.ts`. On any change, the catalog is rebuilt
asynchronously in the background. During rebuild, the previous catalog remains available.
A `catalogVersion` counter increments on each successful rebuild so callers can detect
staleness if needed.

**Catalog build is non-blocking**: the MCP server starts serving before the catalog is
ready. Catalog queries while the index is building return a `{ building: true }` response
that instructs the agent to retry after a short delay (suggested: 2 seconds).

### `ModuleManifest` — Full Shape

```typescript
interface ModuleManifest {
  name: string;           // e.g. "knowledge"
  path: string;           // e.g. "src/knowledge/"
  indexFile: string;      // e.g. "src/knowledge/index.ts"
  catalogVersion: number; // increments on each rebuild

  exports: ExportEntry[];

  /**
   * Derived from src/<name>/operations.ts if it exists and exports a
   * *_OPERATIONS array following the existing project convention.
   */
  operations?: OperationEntry[];

  /** Other src/<name>/ modules this module imports from. */
  dependsOn: string[];

  /** src/<name>/ modules that import from this module. */
  dependents: string[];

  /**
   * Source files in this module (excluding index.ts and test files).
   * Useful for targeted reads when the agent needs to go deeper than the public surface.
   */
  sourceFiles: string[];
}
```

---

## Codebase Operations

### `tp.codebase.read(path)`

Reads a file and returns its content as a string. Path is relative to project root.

- No scope restriction on reads — the agent can read any file.
- Returns an error if the file does not exist.
- Large files (>100KB) return the content truncated at 100KB with a `[truncated]` marker.
  The agent should use `tp.codebase.search()` to find the relevant region instead.

**Tracing**: reads are logged as `project_read` events on the active session trace. This
enables retrospective analysis of which files an agent consulted before making a change.

### `tp.codebase.edit(path, { oldText, newText })`

Applies a targeted replacement. Semantics mirror the existing `edit` tool in pi/Claude Code:

- `oldText` must match **exactly one** occurrence in the file. If zero or multiple
  occurrences are found, the edit fails with a descriptive error.
- `newText` replaces that exact occurrence.
- The edit is scope-checked (see below) before being applied.
- On success, the file is written to disk and the edit is logged as a `project_edit` event
  on the active session trace, including: path, a hash of `oldText`, a hash of `newText`,
  and the session ID.

**Failure modes:**
```
BLACKLISTED       path matches a blacklist entry; use tp.project.requestScopeChange() first
NOT_FOUND         oldText not found in file
AMBIGUOUS         oldText matches multiple locations
FILE_NOT_FOUND    path does not exist (use tp.codebase.write() for new files)
```

### `tp.codebase.write(path, content)`

Creates a new file or completely overwrites an existing one. Scope-checked before write.

Intended for: new file creation, generated files, complete rewrites. For targeted changes
to existing files, `edit()` is preferred because it produces a diff-like trace and fails
fast on stale context.

Logged as a `project_write` event on the active session trace.

### `tp.codebase.search(query, opts?)`

Runs `ripgrep` (`rg`) under the hood. Returns matched file/line/column/context triples.

```typescript
opts?: {
  glob?: string;        // e.g. "src/**/*.ts" (default: all files not in .gitignore)
  caseSensitive?: boolean;  // default: false
  maxResults?: number;  // default: 50
}
```

ripgrep is assumed to be available in the server's PATH. If not found at startup, a
warning is logged and `search()` returns a `{ error: "ripgrep not available" }` result
rather than crashing.

Search results are **not** scope-restricted — the agent can search across all files.
Scope restriction applies only to writes.

### `tp.codebase.listFiles(pattern?)`

Lists files matching a glob pattern relative to the project root. Respects `.gitignore`.
Default pattern: `**/*` (all tracked files).

This is the fallback navigation path. The catalog (`tp.catalog`) is the preferred
navigation layer; `listFiles()` is for edge cases where the agent needs the raw filesystem
view (e.g., inspecting generated files, checking what was recently modified).

---

## Scope Enforcement for Writes

Before any write operation (`edit`, `write`), the path is checked against the scope:

```
function isBlacklisted(path: string, blacklist: string[]): boolean {
  return blacklist.some(entry =>
    path === entry || path.startsWith(entry.endsWith('/') ? entry : entry + '/')
  );
}
```

If `isBlacklisted` returns true:
- The write is not applied.
- The tool returns a `BLACKLISTED` error with the matching entry.
- A `project_blocked_write` event is logged on the active session trace (for auditability).

The agent's path to unblocking a write is:
1. Call `tp.project.requestScopeChange({ action: "remove", path, reason })`.
2. Wait for elicitation response.
3. If approved, retry the write (the server updates its in-memory blacklist immediately
   on approval; the config file is also updated for persistence).

---

## Trace Event Schema

All project operations append events to the active session. The event shape:

```typescript
interface ProjectTraceEvent {
  kind: "project_read" | "project_edit" | "project_write" | "project_blocked_write"
      | "project_cli_exec" | "project_scope_change_requested" | "project_scope_change_result";
  sessionId: string;
  ts: string;         // ISO-8601
  path?: string;
  cli?: string;
  args?: string[];
  oldTextHash?: string;   // SHA-256 prefix (8 chars)
  newTextHash?: string;
  exitCode?: number;
  approved?: boolean;
  durationMs: number;
}
```

These events are stored on the session record and surfaced through `tp.observability`
queries (specifically via the existing `session_info` and `session_timeline` operations
once they are extended to include project events).
