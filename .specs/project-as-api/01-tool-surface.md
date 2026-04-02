# 01 — Tool Surface

> Part of [Project-as-API Spec](./00-index.md)

## The Two New MCP Tools

The Project Mode surface consists of exactly two tools, mirroring the structure of the
reasoning surface (`thoughtbox_search` / `thoughtbox_execute`):

| Reasoning surface | Project surface | Role |
|---|---|---|
| `thoughtbox_search` | `thoughtbox_project_search` | Discovery / read-only catalog queries |
| `thoughtbox_execute` | `thoughtbox_project_execute` | Operations / writes |

The separation is intentional and enforced:
- **Governance**: project operations and reasoning operations have distinct provenance.
- **Agent usability**: the agent's search space for discovery queries is scoped to the
  correct surface (catalog modules vs. reasoning operations/prompts/resources).
- **Context economics**: the tool description for each surface fits within a single
  context window entry without the other surface's noise.

---

## `thoughtbox_project_search`

**Read-only.** Accepts a JavaScript async arrow function that receives a `catalog` object.
The sandbox is frozen — no writes, no CLI access.

### Input Schema

```typescript
{
  code: string  // async arrow fn receiving `catalog`, returns filtered results
}
```

### The `catalog` Object (Project Search Surface)

```typescript
interface ProjectSearchCatalog {
  /** ts-morph derived module map. Primary navigation surface. */
  modules: Record<string, {
    name: string;
    path: string;                        // e.g. "src/knowledge/"
    exports: Array<{
      name: string;
      kind: "function" | "class" | "type" | "interface" | "const";
      signature?: string;
    }>;
    operations?: Array<{                 // from operations.ts if present
      name: string;
      title: string;
      description: string;
      category: string;
    }>;
    dependsOn: string[];                 // other module names this module imports
    dependents: string[];                // modules that import this one
  }>;

  /** Declared CLI entries from project config. */
  cli: Array<{
    name: string;         // e.g. "git", "gcloud", "supabase", "gh"
    description?: string;
  }>;

  /** Current scope configuration. */
  scope: {
    blacklist: string[];
    workingDir: string;
  };
}
```

### Example Usage

```js
// List all modules
async () => Object.keys(catalog.modules)

// Find modules that depend on "persistence"
async () => Object.entries(catalog.modules)
  .filter(([_, m]) => m.dependsOn.includes("persistence"))
  .map(([name]) => name)

// Find all exported functions in "knowledge" module
async () => catalog.modules.knowledge.exports
  .filter(e => e.kind === "function")
```

---

## `thoughtbox_project_execute`

**Requires an active reasoning session.** Accepts a JavaScript async arrow function that
receives the `tp` SDK object. The sandbox has access to `tp` and `console` only.

### Input Schema

```typescript
{
  code: string  // async arrow fn using the `tp` SDK object
}
```

### Session Attribution Protocol

Before executing the provided code, `thoughtbox_project_execute` resolves the active
session from the server's **session registry** — the same in-memory registry that the
thought handler uses to track the current session ID and thought number.

**Resolution order:**
1. Check `sessionRegistry.activeSessionId` (set when `tb.thought()` is called with
   `nextThoughtNeeded: true`).
2. If no active session: return error immediately, do not execute the code.
3. If active session found: pass `sessionId` into the sandbox as a closed-over value.
   All `tp.*` operations that produce trace events include this `sessionId`.

**Error response when no session:**
```json
{
  "error": "No active reasoning session. Call tb.thought() in thoughtbox_execute to open a session before using thoughtbox_project_execute.",
  "code": "NO_ACTIVE_SESSION"
}
```

### The `tp` SDK Object

Full TypeScript interface:

```typescript
interface TP {
  /**
   * TypeScript semantic catalog.
   * Built from ts-morph at server startup; invalidated on .ts file change.
   */
  catalog: {
    /** All modules derived from src/<name>/ directories with index.ts barrels. */
    listModules(): Promise<ModuleManifest[]>;

    /** Full manifest for one module: exports, operations, deps, dependents. */
    describeModule(name: string): Promise<ModuleManifest>;

    /** Which modules import the named module. */
    dependents(moduleName: string): Promise<string[]>;
  };

  /**
   * Codebase read/write proxy.
   * Reads are always permitted. Writes are scope-checked before execution.
   */
  codebase: {
    /** Read file contents. Path relative to project root. */
    read(path: string): Promise<string>;

    /**
     * Apply an edit to a file.
     * oldText must match exactly (unique occurrence). newText replaces it.
     * Fails fast if oldText is not found or matches multiple locations.
     */
    edit(path: string, op: { oldText: string; newText: string }): Promise<EditResult>;

    /**
     * Write a file completely (creates or overwrites).
     * Only for new files or full rewrites; prefer edit() for targeted changes.
     */
    write(path: string, content: string): Promise<WriteResult>;

    /** ripgrep-backed search. Returns file:line:match triples. */
    search(query: string, opts?: {
      glob?: string;
      caseSensitive?: boolean;
      maxResults?: number;
    }): Promise<SearchResult[]>;

    /** List files matching a glob pattern relative to project root. */
    listFiles(pattern?: string): Promise<string[]>;
  };

  /**
   * Config-driven CLI dispatch.
   * Only CLIs declared in thoughtbox.project.json are accessible.
   * Args are passed as an array — never shell-interpolated.
   */
  cli: {
    /**
     * Execute a declared CLI with the provided args array.
     * Returns stdout, stderr, and exit code.
     */
    exec(cli: string, args: string[]): Promise<CliResult>;

    /** List CLIs available in the current project config. */
    available(): Promise<CliEntry[]>;
  };

  /**
   * Scope inspection and consent-gated modification.
   */
  project: {
    /** Current blacklist and working directory. */
    scope(): Promise<ScopeConfig>;

    /**
     * Request a scope change (add/remove blacklist entry).
     * Triggers MCP form-mode elicitation. Blocks until human responds.
     * Rejects if client does not support elicitation.
     */
    requestScopeChange(request: {
      action: "add" | "remove";
      path: string;
      reason: string;
    }): Promise<{ approved: boolean; note?: string }>;
  };
}
```

### Supporting Types

```typescript
interface ModuleManifest {
  name: string;
  path: string;
  exports: ExportEntry[];
  operations?: OperationEntry[];
  dependsOn: string[];
  dependents: string[];
}

interface ExportEntry {
  name: string;
  kind: "function" | "class" | "type" | "interface" | "const" | "enum";
  signature?: string;   // e.g. "(deps: Deps) => Handler"
  isDefault: boolean;
}

interface OperationEntry {
  name: string;
  title: string;
  description: string;
  category: string;
}

interface EditResult {
  path: string;
  applied: boolean;
  error?: string;
}

interface WriteResult {
  path: string;
  written: boolean;
  error?: string;
}

interface SearchResult {
  file: string;
  line: number;
  column: number;
  match: string;
  context?: string;
}

interface CliResult {
  cli: string;
  args: string[];
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

interface CliEntry {
  name: string;
  description?: string;
}

interface ScopeConfig {
  blacklist: string[];
  workingDir: string;
}
```

### Example Usage

```js
// Describe a module, then read a file
async () => {
  const manifest = await tp.catalog.describeModule("knowledge");
  console.log(manifest.exports.map(e => e.name));
  const handler = await tp.codebase.read("src/knowledge/handler.ts");
  return { manifest, handlerLength: handler.length };
}

// Edit a file
async () => {
  return await tp.codebase.edit("src/knowledge/handler.ts", {
    oldText: "const MAX_ENTITIES = 100;",
    newText: "const MAX_ENTITIES = 500;",
  });
}

// Run git status
async () => {
  return await tp.cli.exec("git", ["status", "--short"]);
}

// Request scope change
async () => {
  const result = await tp.project.requestScopeChange({
    action: "remove",
    path: "CONTRIBUTING.md",
    reason: "Need to update contribution guidelines as part of this task.",
  });
  return result;
}
```

---

## Server Wiring

The server factory (`src/server-factory.ts`) must:

1. Instantiate the ts-morph catalog index at startup.
2. Instantiate the CLI dispatcher from project config.
3. Instantiate the scope enforcer from project config.
4. Pass the active session registry reference to `ProjectExecuteTool`.
5. Register `thoughtbox_project_search` and `thoughtbox_project_execute` on the MCP server.

The server instructions string must be updated to explain the 2+2 tool model:
- `thoughtbox_search` / `thoughtbox_execute` — reasoning, memory, protocol
- `thoughtbox_project_search` / `thoughtbox_project_execute` — codebase, infrastructure, CLI

The server-surface test (`src/code-mode/__tests__/server-surface.test.ts`) must be updated
to assert 4 tools: `thoughtbox_execute`, `thoughtbox_project_execute`,
`thoughtbox_project_search`, `thoughtbox_search`.
