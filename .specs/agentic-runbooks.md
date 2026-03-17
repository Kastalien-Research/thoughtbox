# SPEC: Agentic Runbooks — Notebook Evolution

**ADR**: ADR-014-agentic-runbooks
**Status**: Draft
**Date**: 2026-03-16

## Overview

Evolve the notebook subsystem (`src/notebook/`) from ephemeral scratchpads into agentic runbooks: sandboxed design/test environments that produce declarative manifests describing codebase changes, support long-running execution via Effect-TS and `@effect/workflow`, persist in Supabase, and graduate into reusable templates and MCP tool surfaces. The execution kernel employs Effect for scopes, layers, schema validation, and durable coordination.

## Scope

### In scope (ADR-014)

- Notebook lifecycle: author, finalize, graduate
- Manifest as output protocol (structural format based on Effect Schema, not full application engine)
- Code interaction graph as input protocol (schema, not derivation tooling)
- Effect-TS Integration (`@effect/workflow`) for async durable notebook execution mapped to MCP Tasks
- Supabase persistence schema for notebooks
- New tool operations on `thoughtbox_notebook`

### Deferred to follow-on ADRs

- **ADR-015**: Manifest application engine (exact schema validation, codebase write logic)
- **ADR-016**: Code interaction graph derivation (static analysis, TS compiler API integration)
- **ADR-017**: Notebook-as-MCP-server (tool registration, schema generation from finalized notebooks)
- **ADR-018**: Notebook template system (parameterization, versioning, template marketplace)

## Data Structures

### Notebook Schema Changes

The existing `Notebook` type (`src/notebook/types.ts`) gains new fields. Existing fields are unchanged.

```typescript
/** Notebook lifecycle phase */
type NotebookPhase = "authoring" | "finalized" | "graduated";

/**
 * Extended notebook metadata.
 * Added fields; existing NotebookSchema fields unchanged.
 */
interface RunbookMetadata {
  /** Current lifecycle phase */
  phase: NotebookPhase;

  /**
   * Code interaction graph injected at creation.
   * Null for notebooks not bound to a codebase feature.
   */
  interactionGraph: CodeInteractionGraph | null;

  /**
   * MCP Task ID / Effect Workflow ID when executing asynchronously.
   * Null when not executing.
   */
  taskId: string | null;

  /**
   * Manifest produced by finalization.
   * Null until finalized.
   */
  manifest: RunbookManifest | null;

  /**
   * Template this notebook was cloned from, if any.
   */
  sourceTemplateId: string | null;

  /**
   * Supabase persistence ID.
   * Null for local-only notebooks.
   */
  persistenceId: string | null;
}
```

### Code Interaction Graph

A lightweight representation of the dependency/interaction structure for a code slice. Injected into the notebook at creation time. The LLM uses this to generate correct type definitions without full repo access.

```typescript
interface CodeInteractionGraph {
  /** Human-readable description of the feature slice */
  description: string;

  /** Entry points into the slice (files + exported symbols) */
  entryPoints: GraphNode[];

  /** All nodes in the slice */
  nodes: GraphNode[];

  /** Edges representing dependencies between nodes */
  edges: GraphEdge[];

  /** Type definitions referenced by nodes in the slice */
  typeDefinitions: TypeDefinitionRef[];

  /** Generation metadata */
  generatedAt: string;
  generatedFrom: string;
}

interface GraphNode {
  /** Absolute file path */
  filePath: string;

  /** Exported symbol name */
  symbol: string;

  /** Symbol kind */
  kind: "function" | "class" | "interface" | "type"
      | "const" | "enum" | "module";

  /** Function/method signature (if applicable) */
  signature?: string;

  /** JSDoc or first-line comment */
  docstring?: string;
}

interface GraphEdge {
  /** Source node (filePath:symbol) */
  from: string;

  /** Target node (filePath:symbol) */
  to: string;

  /** Relationship type */
  type: "imports" | "calls" | "implements" | "extends"
      | "references_type" | "instantiates";
}

interface TypeDefinitionRef {
  /** Absolute file path where the type is defined */
  filePath: string;

  /** Type name */
  name: string;

  /** Full type definition source text */
  source: string;
}
```

### Runbook Manifest

The output protocol. A manifest describes what changes need to be made to the codebase. Two kinds of entries: declarative (structural, deterministic) and constrained generation tasks (where the LLM must generate a function body given exact constraints).

```typescript
interface RunbookManifest {
  /** Schema version for forward compatibility */
  version: "1.0";

  /** Human-readable summary of what this manifest does */
  description: string;

  /** Notebook ID that produced this manifest */
  sourceNotebookId: string;

  /** Ordered list of changes to apply */
  entries: ManifestEntry[];

  /** Validation results from notebook execution */
  validation: ManifestValidation;
}

type ManifestEntry =
  | DeclarativeEntry
  | ConstrainedGenerationTask;

/**
 * A deterministic structural change.
 * Same input always produces the same output.
 */
interface DeclarativeEntry {
  kind: "declarative";

  /** Target file (absolute path) */
  filePath: string;

  /** What to do */
  action: "create" | "modify" | "delete";

  /**
   * For create/modify: content or patch.
   * "full" provides complete file content.
   * "patch" provides a unified diff.
   */
  content:
    | { type: "full"; source: string }
    | { type: "patch"; diff: string };

  /** Human-readable explanation */
  rationale: string;

  /** Category for grouping related changes */
  category: "type" | "schema" | "route" | "wiring"
          | "config" | "test" | "migration";
}

/**
 * A task where the LLM must generate a function body
 * given exact constraints. The notebook has validated that
 * the constraints are sufficient and the tests pass with
 * a reference implementation.
 */
interface ConstrainedGenerationTask {
  kind: "constrained_generation";

  /** Target file */
  filePath: string;

  /** Function signature (exact, including generics) */
  signature: string;

  /** Parameter types (full definitions) */
  parameterTypes: TypeDefinitionRef[];

  /** Return type (full definition) */
  returnType: TypeDefinitionRef;

  /** Test cases that the generated body must pass */
  testCases: TestCase[];

  /** Additional context for the LLM */
  context: string;

  /** Human-readable explanation */
  rationale: string;
}

interface TestCase {
  /** Test description */
  description: string;

  /** Test source code (executable) */
  source: string;

  /** Expected outcome */
  expectation: "passes" | "throws";
}

interface ManifestValidation {
  /** Did all declarative entries pass type checking? */
  typeCheckPassed: boolean;

  /**
   * Did all constrained generation tasks have
   * a passing reference implementation?
   */
  referenceImplsPassed: boolean;

  /** Validation timestamp */
  validatedAt: string;

  /** Errors encountered during validation */
  errors: string[];
}
```

### MCP Tasks State Mapping via Effect Workflows

Notebook execution maps to the MCP Tasks state machine, powered under the hood by an Effect-TS Workflow execution. Each cell execution is a progress step within the workflow. Decision points (where the LLM or human must choose a path) utilize `DurableDeferred` to pause the workflow and map to `input_required`.

```
notebook_execute called
  |
  v
Effect Workflow created / Task mapped (state: working)
  |
  v
For each cell:
  - Report progress (cell N of M)
  - Execute cell within an Effect Scope
  - If cell is a decision point:
      Transition to input_required
      Await DurableDeferred signal
      Transition back to working
  - If cell fails:
      Run finalizers (interrupt Scope)
      Transition to failed
      Return error
  |
  v
All cells complete
  - Generate manifest
  - Transition to completed
  - Return manifest
```

Task state transitions:

| Trigger | From | To |
|---|---|---|
| notebook_execute called | (none) | working |
| Cell execution starts | working | working (progress update) |
| Decision point reached | working | input_required |
| Decision provided | input_required | working |
| All cells complete | working | completed |
| Cell execution fails | working | failed |
| User cancels | any | cancelled |

### Supabase Persistence Schema

Notebooks persisted in Supabase follow the dual-backend pattern. `FileSystemStorage` stores notebooks as `.src.md` files locally. `SupabaseStorage` stores them in Postgres.

```sql
CREATE TABLE notebooks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  project     TEXT NOT NULL,

  -- Notebook content
  title       TEXT NOT NULL,
  language    TEXT NOT NULL CHECK (language IN ('javascript', 'typescript')),
  phase       TEXT NOT NULL DEFAULT 'authoring'
              CHECK (phase IN ('authoring', 'finalized', 'graduated')),
  cells       JSONB NOT NULL DEFAULT '[]',
  tsconfig    JSONB,

  -- Runbook extensions
  interaction_graph JSONB,
  manifest          JSONB,
  source_template_id UUID REFERENCES notebooks(id),

  -- MCP Task tracking
  task_id     TEXT,
  task_state  TEXT CHECK (
    task_state IS NULL
    OR task_state IN ('working', 'input_required',
                      'completed', 'failed', 'cancelled')
  ),

  -- Metadata
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: project isolation (same pattern as ADR-DATA-01)
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY notebooks_project_isolation ON notebooks
  USING (project = auth.jwt() ->> 'project');

-- Index for listing notebooks by project
CREATE INDEX idx_notebooks_project_phase
  ON notebooks (project, phase, updated_at DESC);

-- Index for template lookups
CREATE INDEX idx_notebooks_source_template
  ON notebooks (source_template_id)
  WHERE source_template_id IS NOT NULL;
```

## API Surface

### New Tool Operations

Added to `thoughtbox_notebook` tool. Existing operations unchanged.

#### `notebook_finalize`

Transition a notebook from `authoring` to `finalized`. Validates all code cells have been executed, generates the manifest from cell outputs.

```typescript
{
  operation: "notebook_finalize",
  notebookId: string,
}
// Returns: { manifest: RunbookManifest, phase: "finalized" }
```

**Preconditions**:
- Notebook must be in `authoring` phase
- All code cells must have `status: "completed"`

**Effects**:
- Parses code cell outputs to extract manifest entries
- Validates manifest (type check declarative entries, verify constrained generation test coverage)
- Sets `phase: "finalized"`, attaches manifest
- Persists to Supabase if persistence is configured

#### `notebook_execute`

Execute all cells in sequence as an MCP Task. Returns a task ID for polling.

```typescript
{
  operation: "notebook_execute",
  notebookId: string,
  async: boolean,  // true = return task ID, false = execute synchronously
}
// Sync return: { execution: ExecutionResult[], manifest?: RunbookManifest }
// Async return: { taskId: string, state: "working" }
```

When `async: true`, the execution runs as an Effect Workflow mapped to an MCP Task. The client polls via `tasks/get` to check progress. Each cell execution reports progress. Decision points pause the task, using a `DurableDeferred` wait, and set `state: "input_required"`.

**Cloud Run timeout handling**: Synchronous execution is bounded by the 300s Cloud Run request timeout (ADR-GCP-01). For notebooks that may exceed this, `async: true` is required. The Workflow runs on a background worker that is not request-bound, safely coordinated by Effect.

#### `notebook_inject_graph`

Inject a code interaction graph into a notebook. The graph provides the LLM with the dependency context needed to generate correct code.

```typescript
{
  operation: "notebook_inject_graph",
  notebookId: string,
  graph: CodeInteractionGraph,
}
// Returns: { success: true, nodeCount: number, edgeCount: number }
```

#### `notebook_persist`

Persist a notebook to Supabase. Required for template reuse and cross-session access.

```typescript
{
  operation: "notebook_persist",
  notebookId: string,
}
// Returns: { persistenceId: string, phase: NotebookPhase }
```

#### `notebook_clone`

Clone a persisted notebook as a new notebook, optionally with parameter substitution. The core mechanism for template reuse.

```typescript
{
  operation: "notebook_clone",
  sourceNotebookId: string,  // Must be persisted
  title: string,
  substitutions?: Record<string, string>,
}
// Returns: { notebook: { id, title, phase: "authoring", sourceTemplateId } }
```

#### `notebook_get_manifest`

Retrieve the manifest from a finalized notebook.

```typescript
{
  operation: "notebook_get_manifest",
  notebookId: string,
}
// Returns: { manifest: RunbookManifest } or error if not finalized
```

## Notebook Lifecycle

```
  CREATE (with optional interaction graph)
    |
    v
  AUTHORING
    |  - Add/edit cells
    |  - Execute cells iteratively
    |  - Inject interaction graph
    |  - LLM designs implementation in cells
    |
    v
  FINALIZE
    |  - All code cells must be "completed"
    |  - Manifest generated from cell outputs
    |  - Validation run (type check, test coverage)
    |
    v
  FINALIZED
    |  - Manifest is immutable
    |  - Can be persisted to Supabase
    |  - Can be cloned as template
    |
    v
  GRADUATE (future: ADR-017)
    |  - Register as MCP server
    |  - Expose as callable tool
```

### Phase Transitions

| From | To | Trigger | Preconditions |
|---|---|---|---|
| (none) | authoring | `notebook_create` | None |
| authoring | finalized | `notebook_finalize` | All code cells completed |
| finalized | graduated | (ADR-017) | Manifest valid, persistence configured |
| authoring | authoring | Any cell operation | None |
| finalized | authoring | (reopen, future) | Explicit user request |

## Acceptance Criteria

### H1: Code interaction graph injection

- [ ] `notebook_inject_graph` accepts a `CodeInteractionGraph` and attaches it to the notebook
- [ ] Notebook cells can reference type definitions from the graph
- [ ] Generated types from the graph compile against the real codebase (`tsc --noEmit`)

### H2: Manifest generation

- [ ] `notebook_finalize` produces a `RunbookManifest` with declarative entries
- [ ] Declarative entries contain valid file paths, content, and categories
- [ ] Manifest passes structural validation (all required fields present, valid enums)

### H3: Constrained generation tasks

- [ ] Manifest can contain `ConstrainedGenerationTask` entries
- [ ] Each task includes signature, types, and test cases
- [ ] Test cases are executable and a reference implementation passes them

### H4: Persistence and templates

- [ ] `notebook_persist` stores notebook in Supabase `notebooks` table
- [ ] `notebook_clone` creates a new notebook from a persisted one
- [ ] Substitutions in clone replace text across all cell content

### H5: Concurrent notebooks on Cloud Run

- [ ] Multiple notebooks can execute concurrently on the same Cloud Run instance
- [ ] `NotebookStateManager` handles concurrent access without data corruption
- [ ] 50 concurrent notebooks do not exceed Cloud Run memory limits (1 GiB)

### H6: MCP Tasks & Effect Workflow integration

- [ ] `notebook_execute` with `async: true` returns a task ID representing an Effect Workflow ID
- [ ] Workflow transitions through `working` -> `completed` for simple notebooks
- [ ] Workflow transitions through `working` -> `input_required` -> `working` -> `completed` for notebooks with decision points, using `DurableDeferred`
- [ ] Effect Scopes correctly clean up child temp dirs and subprocesses on task cancellation
- [ ] Progress reported per-cell during execution

## Non-Goals

- This spec does not define how manifests are *applied* to the codebase (ADR-015)
- This spec does not define how interaction graphs are *derived* from the codebase (ADR-016)
- This spec does not define how notebooks become MCP servers (ADR-017)
- This spec does not define template parameterization syntax or versioning (ADR-018)
- This spec does not replace CI/CD or testing infrastructure
- Notebooks never write directly to the canonical repository
