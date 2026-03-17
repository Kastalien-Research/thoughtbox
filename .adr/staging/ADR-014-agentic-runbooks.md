# ADR-014: Agentic Runbooks — Notebook Evolution with Effect-TS Execution Kernel

**Status**: Proposed
**Date**: 2026-03-17
**Deciders**: Thoughtbox development team
**Spec**: `.specs/agentic-runbooks.md`

## Context

### Problem

The current notebook subsystem (`src/notebook/`) is an ephemeral scratchpad. Notebooks exist only in-memory for the lifetime of the server process. They have no persistence, no structured output protocol, no async execution model, and no way to reuse a notebook that solved a problem once. This limits notebooks to interactive prototyping — they cannot serve as a substrate for agentic code generation workflows.

The goal is to evolve notebooks into **agentic runbooks**: sandboxed design/test environments where an LLM takes a feature description, designs an implementation in a notebook, validates it, and produces a structured manifest describing what changes the codebase needs. The notebook is a buffer zone between the LLM and the canonical codebase. The codebase is never written to directly.

### Current State

**Notebook architecture** (`src/notebook/`):
- `NotebookStateManager`: in-memory `Map<string, Notebook>` + temp dirs
- `Notebook` type: id, cells (title/markdown/code/package.json), language, timestamps
- Execution: `child_process.spawn` of Node.js/tsx per code cell, 30s timeout
- Encoding: `.src.md` format (markdown with metadata header and code fences)
- Tool surface: `thoughtbox_notebook` with 9 operations (create, list, load, add_cell, update_cell, run_cell, install_deps, list_cells, get_cell, export)
- Templates: single `sequential-feynman` template, embedded at build time

**What works**: The notebook is a functional code execution environment. Cell authoring, execution, and export work. The `.src.md` format is a reasonable serialization.

**What is missing**:
1. **No persistence** — notebooks vanish when the server restarts. On Cloud Run, this means every request starts fresh.
2. **No structured output** — cell outputs are stdout/stderr strings. There is no protocol for a notebook to declare "here is what the codebase should look like after my work."
3. **No async execution** — execution is synchronous within a request. Cloud Run's 300s timeout (ADR-GCP-01) caps notebook execution time.
4. **No reuse** — a notebook that solved a problem cannot be parameterized and reused for similar problems.
5. **No codebase context injection** — the LLM has full Thoughtbox MCP tool access to read the codebase, but there is no lightweight representation of the relevant code slice that can be injected into the notebook for focused generation.

### The Execution Challenge

Notebook execution involves temporary directories, subprocesses, cancellation, partial failure, cleanup, and leaked resources if anything goes wrong. Achieving durable, concurrent, and reliable notebook execution across ephemeral Cloud Run containers requires robust coordination, backpressure, retries, and observability. Building this orchestration ad-hoc is complex and error-prone.

## Decision

Evolve the notebook subsystem into agentic runbooks by cleanly separating the **domain semantics** from the **execution kernel**, utilizing **Effect-TS** as the operating system for execution.

### 1. Separation of Concerns
- **Domain (Thoughtbox)**: Notebook grammar (`.src.md`), manifest format, code-interaction graph schema, and lifecycle semantics (`authoring` -> `finalized`).
- **Execution Kernel (Effect)**: Schema validation, retries, cancellation, resource cleanup, concurrency limits, service wiring, observability, and durable run orchestration.

### 2. @effect/workflow for Durable Run Orchestration
A notebook run is modeled as a workflow instance with a stable identity and explicitly managed state, rather than using ad-hoc async plumbing. 
- `@effect/workflow` provides durable deferred signals (`DurableDeferred`), allowing notebooks to pause execution when human or LLM input is required (`input_required`), and resume later.
- It provides named workflows, activities, retries, compensation handlers, and durable sleep, perfectly mapping to per-cell progress, timeouts, and completion/failure.
- *Caution*: `@effect/workflow` is currently in alpha status. We will hide the workflow engine behind a Thoughtbox-owned interface (`TaskStore`/`NotebookStore`) so the rest of the codebase does not depend on it directly.

### 3. Effect Layers for Service Boundaries
We will use Effect Layers to declare dependencies.
- Interfaces for `NotebookStore`, `TaskStore`, `ManifestCompiler`, `GraphProvider`, and `SandboxExecutor`.
- Implementations (e.g., `FileSystemStorage` vs `SupabaseStorage`) are swapped dynamically via static, dynamic, and scoped Layers with automatic dependency wiring, preserving the dual-backend constraint without smearing choice logic.

### 4. Effect Schema for Protocol Boundaries
The `RunbookManifest`, `CodeInteractionGraph`, notebook lifecycle states, tool payloads, and task updates become validated runtime protocols.
- We will replace loose TypeScript interfaces with Effect Schema declarations.
- This guarantees runtime validation, error assertion, and the ability to generate JSON Schema directly for the MCP tool payloads.

### 5. Scopes for Sandbox Resource Management
Subprocesses (cell execution/package installation), temporary directories, and network connections are tied to **Effect Scopes** using the `acquireRelease` pattern.
- If a notebook is cancelled or a container is interrupted, Effect's fiber interruption model ensures finalizers automatically run, preventing resource leaks.

### 6. Primitives for Coordination and Backpressure
Execution load on the Cloud Run instances will be managed using Effect primitives:
- **Queues** for typed in-memory pending notebook work with built-in back-pressure.
- **Semaphores** to enforce concurrency limits on expensive sections like execution, dependency installation, or manifest validation.
- **Schedules** for typed, composable retry policies on transient operational failures (e.g., graph extractor flakes, repo read errors).

## Consequences

### Positive
- **Robust Resource Management**: Scopes guarantee rigorous cleanup of stray subprocesses and temp directories.
- **Reliability and Observability**: Retry policies, queuing, backpressure, metrics, and tracing become first-class constructs natively supported by the execution framework.
- **Clear Separation**: Thoughtbox focuses on product definitions (DSL, manifest), delegating execution heavy-lifting (retries, timeouts, pause/resume) to Effect.
- **Durable Execution**: Realizes the ability to pause complex multistep operations and pick them back up across Cloud Run instance boundaries via `@effect/workflow`.
- **Type-safe DI**: Clean dependency injection through Layers simplifies the dual-backend (file vs Supabase) constraints.

### Negative / Tradeoffs
- **Learning Curve**: Effect-TS introduces a paradigm shift (fibers, layers, generators) that increases cognitive overhead for contributors.
- **Alpha Status Dependency**: `@effect/workflow` is officially alpha and subject to API changes. We mitigate this by abstracting it, but the integration risk remains.
- **Rewrite Overhead**: Significant refactoring is required to move `src/notebook/` from raw Promises and `child_process` to Effect-native constructs.

### Follow-on ADRs Required

| ADR | Subject | Dependency |
|---|---|---|
| ADR-015 | Manifest application engine | ADR-014 (manifest format) |
| ADR-016 | Code interaction graph derivation | ADR-014 (graph schema) |
| ADR-017 | Notebook-as-MCP-server | ADR-014 (graduation phase) |
| ADR-018 | Notebook template system | ADR-014 (persistence, clone) |

### ADR Amendments
- **ADR-GCP-01**: Amend to note that the 300s request timeout does not apply to background operations mapped to Effect Workflows.

## Hypotheses

### Hypothesis 1: Effect Execution Kernel Prevents Resource Leaks
Effect's scoped acquisition and interruption models guarantee that notebook executions interrupted prematurely (e.g., Cloud Run scale-down, timeout, manual cancellation) clean up temporary directories and subprocesses.
**Prediction**: Zero orphaned `node` processes or leaking temp folders after cancelling a long-running compile cell.
**Validation**: Spawn 10 concurrent heavy notebooks, forcefully interrupt the fibers, and inspect OS processes/local filesystem for leaks.
**Outcome**: PENDING

### Hypothesis 2: @effect/workflow enables durable pause and resume
Durable deferred signals allow a notebook workflow to wait for an LLM input indefinitely without consuming active compute, perfectly matching the MCP Tasks `input_required` state.
**Prediction**: A notebook can execute a cell, pause for input, survive a container restart, and resume exactly where it left off once the signal is provided.
**Validation**: Run a notebook workflow to a pause point, kill the Node process, restart the server, send the resume signal, and verify it completes successfully.
**Outcome**: PENDING

### Hypothesis 3: Schema generation is 1:1 with MCP tools
Effect Schema can act as the single source of truth for runtime validation and MCP tool payload schemas.
**Prediction**: We can derive valid JSON Schema directly from the Effect Schemas defining the RunbookManifest and CodeInteractionGraph to serve as the JSON RPC payload definition.
**Validation**: Replace manual JSON Schema generation in `thoughtbox_notebook` tool definition and verify payload parsing still accepts valid inputs and rejects invalid ones.
**Outcome**: PENDING

### Hypothesis 4: Constrained generation outperforms unconstrained
Where declarative generation fails, the notebook reduces the LLM task to constrained code generation: exact signature, types, and test cases provided, LLM generates only the body. Notebook validates before including in output.
**Prediction**: LLM given constrained task produces correct implementation that passes provided tests with higher reliability than unconstrained generation.
**Validation**: Compare success rate of constrained vs unconstrained generation for 5 function implementations.
**Outcome**: PENDING

### Hypothesis 5: Persisted notebooks serve as reusable templates
Completed notebooks persisted in Supabase or FS serve as reusable templates.
**Prediction**: Template notebook parameterized with new operation name and types produces a valid manifest for the new operation.
**Validation**: Clone persisted notebook with new parameters. Verify output manifest is structurally valid and type-checks.
**Outcome**: PENDING

## Links
- Spec: `.specs/agentic-runbooks.md`
- Effect-TS docs: https://effect.website
- ADR-GCP-01: `.adr/accepted/ADR-GCP-01-cloud-run-service-config.md`
- ADR-DATA-01: `.adr/staging/ADR-DATA-01-supabase-product-schema.md`
- MCP Tasks spec: MCP specification (Nov 2025), `execution.taskSupport` negotiation
