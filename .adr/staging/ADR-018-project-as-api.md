# ADR-018: Project-as-API — Thoughtbox Project Mode

**Status**: Proposed
**Date**: 2026-04-02
**Branch**: feat/project-as-api
**Owner**: Core MCP Architecture Workstream

## Context

Thoughtbox is valuable to agents that use it, but no agent will use it voluntarily — native
reasoning is always the faster path for any individual task. The only reliable way to make
Thoughtbox a mandatory reasoning surface is to make it the *only available path* to project
operations.

Currently, an agent equipped with Thoughtbox gains reasoning and memory capabilities but can
still write code, run shell commands, and interact with project infrastructure through its
native tools. This means:

1. **No forcing function for Thoughtbox use.** An agent completes coding tasks without ever
   engaging the reasoning surface.
2. **Fragmented provenance.** Code changes, CLI invocations, and reasoning are traced
   separately (OTEL, session storage, shell history). There is no unified record of "why this
   code was written."
3. **Unbounded search space.** An agent navigating a codebase raw explores with greps and
   reads until it builds a mental model from scratch — expensive in tokens and error-prone.

The correct architecture is: **Thoughtbox mediates everything**. An agent equipped only with
`thoughtbox_execute`, `thoughtbox_project_execute`, `thoughtbox_project_search`, and a read
tool can accomplish coding tasks — but every code write, every CLI invocation, and every
infrastructure change flows through Thoughtbox and is attributed to the reasoning session
that authorized it.

The existing `.specs/codebase-as-api.md` design brief establishes the three-plane vision
(Catalog, Knowledge, Trace). This ADR implements **Phase 1**: the Project Mode tool surface,
the ts-morph catalog, the codebase operation proxy, and the CLI dispatch gateway. The
Knowledge plane (PatternCards, DecisionCards, LessonCards) and the learning loop are
explicitly deferred to a follow-on ADR. Work tracking (replacement for the Beads
organizational model) is deferred to ADR-019.

## Decision

We will add a **Project Mode** surface to Thoughtbox consisting of two new MCP tools:

- **`thoughtbox_project_search`** — discovers the project surface: catalog modules, their
  public operation signatures, available CLI commands, and current scope configuration.
  Read-only. Mirrors the role of `thoughtbox_search` for the reasoning surface.

- **`thoughtbox_project_execute`** — executes project operations via a `tp` SDK object in a
  node:vm sandbox. Requires an active Thoughtbox reasoning session (opened via
  `thoughtbox_execute`) for attribution. Mirrors the role of `thoughtbox_execute` for the
  project surface.

### The `tp` SDK Object

The `tp` SDK exposed in `thoughtbox_project_execute` provides four namespaces:

```typescript
interface TP {
  /** TypeScript semantic catalog. Built from ts-morph at server startup. */
  catalog: {
    listModules(): Promise<ModuleManifest[]>;
    describeModule(name: string): Promise<ModuleManifest>;
    dependents(moduleName: string): Promise<string[]>;
  };

  /** Codebase read/write proxy. All writes are scope-checked before execution. */
  codebase: {
    read(path: string): Promise<string>;
    edit(path: string, op: EditOperation): Promise<EditResult>;
    search(query: string, opts?: { glob?: string; maxResults?: number }): Promise<SearchResult[]>;
    listFiles(pattern?: string): Promise<string[]>;
  };

  /** Config-driven CLI dispatch. No arbitrary shell access. */
  cli: {
    exec(cli: string, args: string[]): Promise<CliResult>;
    available(): Promise<CliEntry[]>;
  };

  /** Scope inspection and consent-gated scope change requests. */
  project: {
    scope(): Promise<ScopeConfig>;
    requestScopeChange(request: ScopeChangeRequest): Promise<ScopeChangeResult>;
  };
}
```

### Session Attribution (Mandatory)

`thoughtbox_project_execute` checks for an active session before executing any operation.
The session is opened via `tb.thought()` in `thoughtbox_execute` with `nextThoughtNeeded: true`.
The active session ID is resolved from the server's in-memory session registry (the same
mechanism that tracks the current session for thought numbering).

If no active session exists, `thoughtbox_project_execute` returns an error:

```
No active reasoning session. Open a session with thoughtbox_execute (tb.thought) before
using thoughtbox_project_execute.
```

All project operations are appended to the active session's trace as attributed events.
This eliminates the OTEL gap: code edits, CLI invocations, and scope-change requests
appear in the same session record as the reasoning thoughts that authorized them.

### Catalog — ts-morph Semantic Indexing

The catalog is built from ts-morph at server startup and cached in memory. It is
invalidated and rebuilt when `.ts` source files change (via a file watcher). The catalog
presents the TypeScript semantic model as a navigable surface:

- **Module** = one `src/<name>/` directory with an `index.ts` barrel (directory convention).
- **ModuleManifest** includes: module name, public exports (names and types), inferred
  operation signatures (functions exported from `operations.ts` if present), and
  inter-module dependency edges.
- The catalog is the agent's primary navigation layer, replacing raw filesystem exploration
  for repeat task types.

### CLI Dispatch Table

CLI access is config-driven. The project config file (`thoughtbox.project.json` at the
repo root, or embedded in `.mcp.json` under a `"thoughtbox"` key) declares:

```json
{
  "cli": {
    "allowed": ["git", "gcloud", "supabase", "gh"],
    "workingDir": ".",
    "env": {}
  },
  "scope": {
    "blacklist": [
      ".adr/", ".specs/", ".claude/", "AGENTS.md", "CLAUDE.md", "CONTRIBUTING.md"
    ]
  }
}
```

The dispatch table validates:
1. The requested CLI is in `allowed`.
2. No shell metacharacters in args (args are passed as an array, never interpolated into a shell string).
3. The command does not resolve to a path outside the declared working directory.

### Scope Model — Blacklist with Elicitation-Gated Changes

All paths are writable by default. The blacklist declares paths the agent cannot write to
without explicit user consent. Sensible defaults cover governance artifacts.

When `tp.codebase.edit()` targets a blacklisted path, the call is blocked with an
explanatory error listing the path and the blacklist entry that matched.

When `tp.project.requestScopeChange()` is called (agent requests removal of a blacklist
entry or addition of a new one), the server sends an MCP `elicitation/create` request using
**form-mode** (spec: https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation#form-mode-elicitation-requests):

```json
{
  "message": "Agent requests scope change",
  "requestedSchema": {
    "type": "object",
    "properties": {
      "approved": { "type": "boolean", "title": "Approve this scope change?" },
      "note": { "type": "string", "title": "Optional note" }
    },
    "required": ["approved"]
  }
}
```

The request blocks until the human responds. If the client does not support elicitation
(returns `MethodNotFound`), the scope change is rejected and the agent receives an error
explaining that scope changes require a client that supports MCP elicitation.

## Decision Summary

| Dimension | Decision |
|---|---|
| New MCP tools | `thoughtbox_project_search`, `thoughtbox_project_execute` |
| SDK object | `tp` (project), parallel to `tb` (reasoning) |
| Session attribution | Mandatory — project execute requires active `tb` session |
| Catalog technology | ts-morph semantic indexing, cached at startup with file-watcher invalidation |
| CLI gateway | Dispatch table with allowlist; args passed as array (no shell interpolation) |
| Project config | `thoughtbox.project.json` at repo root (or `"thoughtbox"` key in `.mcp.json`) |
| Scope model | Blacklist-based; MCP form-mode elicitation for scope changes |
| Phase 1 scope | Tool surface + catalog + codebase ops + CLI dispatch + scope consent |
| Deferred | PatternCards, DecisionCards, LessonCards, learning loop (separate ADR) |
| Deferred | Work tracking / Beads replacement — ADR-019; Linear used in interim |

## Consequences

- Adds 2 MCP tools: `thoughtbox_project_search` and `thoughtbox_project_execute`.
- `src/code-mode/__tests__/server-surface.test.ts` currently hard-asserts exactly 2 tools
  (`thoughtbox_execute`, `thoughtbox_search`). This must be updated to assert 4.
- A new `src/code-mode/project/` module is introduced, containing the project execute tool,
  the `tp` SDK builder, the ts-morph catalog, the CLI dispatcher, and the scope enforcer.
- `thoughtbox.project.json` is a new project-level config format. It must be documented and
  a JSON Schema provided for editor validation.
- ts-morph is added as a production dependency (~30MB, startup overhead for initial index
  build; acceptable given the server-startup model).
- The server-factory must wire the two new tools and pass the active session registry to the
  project execute tool.
- OTEL gap is eliminated by design rather than by instrumentation: when project ops are
  required to be inside a session, the fragmentation cannot occur.
- The "exactly 2 tools" design philosophy becomes "2 reasoning tools + 2 project tools" —
  this should be stated explicitly in the server instructions so agents understand the
  separation.

## Hypotheses

### Hypothesis 1: Session attribution eliminates OTEL fragmentation
**Prediction**: After implementation, all code edits and CLI invocations in a project session
appear in the same Thoughtbox session record as the reasoning thoughts that authorized them.
Zero orphaned OTEL spans for project operations initiated through `thoughtbox_project_execute`.

### Hypothesis 2: ts-morph catalog reduces discovery token cost
**Prediction**: An agent using `tp.catalog.describeModule()` as its primary navigation tool
makes ≤50% of the read/grep calls that an equivalent agent makes without the catalog, for a
repeat task type on a known module.

### Hypothesis 3: MCP form-mode elicitation is supported by all three target clients
**Prediction**: Form-mode elicitation requests from `thoughtbox_project_execute` surface
correctly (as interactive prompts, not errors) in Claude Code, Cursor, and Codex without
additional configuration.

### Hypothesis 4: CLI dispatch table is sufficient for V1 project operations
**Prediction**: An agent can complete a full project cycle — navigate catalog, read code,
edit code, run tests, commit via `git` — without needing any invocation outside the
dispatch table's declared allowlist.

### Hypothesis 5: Blacklist defaults require no user modification for a standard TypeScript project
**Prediction**: The default blacklist (`.adr/`, `.specs/`, `.claude/`, `AGENTS.md`,
`CLAUDE.md`, `CONTRIBUTING.md`) covers all governance artifacts an agent should not touch
without human review, and does not block any path an agent legitimately needs to write during
a normal coding task.

## Spec

**Spec**: [Project-as-API](/.specs/project-as-api/00-index.md)

## Links

- Design brief: `.specs/codebase-as-api.md`
- Phase 2 (Knowledge cards + learning loop): to be filed
- Work tracking (Beads replacement, Linear interim): ADR-019 to be filed
- MCP elicitation spec: https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation#form-mode-elicitation-requests
