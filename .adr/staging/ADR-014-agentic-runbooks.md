# ADR-014: Agentic Runbooks — Notebook Evolution with MCP Tasks and Persistent Execution

**Status**: Proposed
**Date**: 2026-03-16
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

### Constraints

- **Dual-backend rule** (non-negotiable): `FileSystemStorage` stays for local/self-hosted. `SupabaseStorage` for deployed. Both implement same interfaces. This applies to notebook persistence too.
- **Cloud Run timeout**: 300s request timeout (ADR-GCP-01). Notebooks that exceed this need async execution.
- **MCP Tasks spec**: Experimental in Nov 2025 MCP spec. State machine: `working` -> `input_required` -> `completed`/`failed`/`cancelled`. Tool-level negotiation via `execution.taskSupport`.
- **Stateless containers**: Cloud Run containers are ephemeral. In-memory notebook state does not survive instance restarts or scale-to-zero.
- **Canonical repo safety**: Notebooks never write to the canonical repository. The manifest is the review surface.

### ADR-GCP-01 Reconciliation

ADR-GCP-01 specifies a 300s Cloud Run request timeout. This was configured for MCP request/response patterns, not long-running notebook execution. The MCP Tasks model introduced here bypasses the request timeout for notebooks: the initial `notebook_execute` call returns a task ID within the request timeout, and the actual execution runs as a background process. This is an amendment to ADR-GCP-01's timeout assumptions, not a contradiction — the 300s timeout still applies to all synchronous MCP operations.

## Decision

Evolve the notebook subsystem into agentic runbooks with five foundational architectural decisions:

### 1. Notebook lifecycle: author -> finalize -> graduate

Notebooks gain a `phase` field tracking their lifecycle. `authoring` is the current behavior (add cells, execute, iterate). `finalized` means the notebook has produced a validated manifest and is immutable. `graduated` (future, ADR-017) means the notebook is registered as an MCP server.

Phase transitions are explicit operations (`notebook_finalize`), not implicit. The `authoring` -> `finalized` transition requires all code cells to have `status: "completed"` — the notebook must have been fully executed before it can produce a manifest.

### 2. Manifest as output protocol

A finalized notebook produces a `RunbookManifest`: an ordered list of declarative entries (file creates, modifications, deletions with exact content) and constrained generation tasks (function signature + types + tests, where the LLM generates only the body). The manifest is the review surface — it describes what the codebase should look like, without touching it.

Declarative entries cover structural code (types, schemas, routes, wiring, config). Constrained generation tasks cover business logic where declarative generation is insufficient. The notebook validates constrained tasks by running test cases against a reference implementation before including them in the manifest.

The manifest format is defined in the spec. The manifest application engine (how manifests are applied to the codebase) is deferred to ADR-015.

### 3. Code interaction graph as input protocol

Instead of injecting the full repository into a notebook, inject a lightweight `CodeInteractionGraph`: entry points, dependency nodes, edges (imports/calls/implements/extends), and referenced type definitions. This gives the LLM enough context to generate type-correct code without the noise of the full codebase.

The graph schema is defined in the spec. The graph derivation tooling (how to extract the graph from the codebase using TS compiler API or similar) is deferred to ADR-016.

### 4. MCP Tasks for async execution

Long-running notebook execution uses the MCP Tasks state machine. `notebook_execute` with `async: true` creates a Task in `working` state and returns the task ID. Cell executions report progress. Decision points (where human/LLM input is needed) transition to `input_required`. Completion generates the manifest and transitions to `completed`.

This resolves the Cloud Run 300s timeout constraint: the initial request returns within the timeout, and the Task runs independently.

### 5. Supabase for persistence, filesystem for local

Notebook persistence follows the dual-backend pattern established by ADR-DATA-01. A new `notebooks` table in Supabase stores notebook content (cells as JSONB), phase, interaction graph, manifest, and task state. Locally, notebooks can be exported to `.src.md` files and re-imported. The `notebook_persist` operation explicitly pushes a notebook to Supabase; the `notebook_clone` operation creates a new notebook from a persisted one.

This is not automatic sync — persistence is an explicit action. In-memory notebooks remain the primary working state during authoring.

## Consequences

### Positive

- Notebooks become a structured code generation pipeline with a reviewable output (manifests).
- Long-running notebook execution is possible on Cloud Run via MCP Tasks.
- Solved notebooks persist and become templates for similar problems.
- The code interaction graph provides focused context, reducing LLM hallucination on type signatures and interfaces.
- The canonical codebase is never written to directly by notebooks.
- All five decisions are independently implementable — partial delivery is useful.

### Negative / Tradeoffs

- Notebook complexity increases. The current ~500 lines across 7 files will grow to handle lifecycle, manifests, tasks, persistence, and graph injection.
- MCP Tasks spec is experimental. SDK support may be incomplete. The implementation may need to polyfill task state management.
- The manifest format is novel — there is no prior art for "declarative code manifest with semantic holes." The format will evolve as we learn what works.
- Two persistence backends for notebooks (filesystem + Supabase), matching the dual-backend pattern but adding maintenance surface.
- Code interaction graph quality depends on static analysis tooling that does not yet exist in the project (deferred to ADR-016).

### Follow-on ADRs Required

| ADR | Subject | Dependency |
|---|---|---|
| ADR-015 | Manifest application engine | ADR-014 (manifest format) |
| ADR-016 | Code interaction graph derivation | ADR-014 (graph schema) |
| ADR-017 | Notebook-as-MCP-server | ADR-014 (graduation phase) |
| ADR-018 | Notebook template system | ADR-014 (persistence, clone) |

### ADR Amendments

- **ADR-GCP-01**: Amend to note that the 300s request timeout does not apply to MCP Task-based async operations. The timeout governs the initial request/response; background task execution is unbounded (subject to Cloud Run instance lifetime and billing).

## Hypotheses

### Hypothesis 1: Code interaction graph injection enables type-correct generation

A lightweight code interaction graph for a feature's relevant slice can be derived and injected into a notebook, sufficient for generating correct type definitions and interface declarations without full repo access.

**Prediction**: Notebook with injected interaction graph produces type-correct declarations that compile against the real codebase types.

**Validation**: Derive interaction graph for an existing feature (e.g., the gateway operation pattern: handler + type cast + schema declaration). Inject into notebook. Generate types in notebook cells. Run `tsc --noEmit` against real codebase with generated types.

**Outcome**: PENDING

### Hypothesis 2: Notebook produces valid declarative manifest

A notebook can produce a structured declarative manifest that, when applied to the codebase, generates correct structural code (types, routes, schema, wiring). Same input, same output.

**Prediction**: Manifest applied to codebase produces code that passes type checking and matches expected structure.

**Validation**: Design manifest format. Generate manifest from notebook for a known feature (e.g., adding a new gateway operation). Apply manifest entries to codebase. Verify with `tsc --noEmit` and existing tests.

**Outcome**: PENDING

### Hypothesis 3: Constrained generation outperforms unconstrained

Where declarative generation fails, the notebook reduces the LLM task to constrained code generation: exact signature, types, and test cases provided, LLM generates only the body. Notebook validates before including in output.

**Prediction**: LLM given constrained task (signature + types + tests) produces correct implementation that passes provided tests, with higher reliability than unconstrained generation.

**Validation**: Compare success rate of constrained vs unconstrained generation for 5 representative function implementations. Measure: compilation success, test pass rate, manual review score.

**Outcome**: PENDING

### Hypothesis 4: Persisted notebooks serve as reusable templates

Completed notebooks persisted in Supabase serve as reusable templates. A notebook that added a gateway operation becomes the template for the next gateway operation.

**Prediction**: Template notebook parameterized with new operation name and types produces a valid manifest for the new operation.

**Validation**: Create notebook for one gateway operation. Persist. Clone with new parameters (operation name, types). Verify output manifest is structurally valid and type-checks.

**Outcome**: PENDING

### Hypothesis 5: Cloud Run handles concurrent notebook execution at marginal cost

Cloud Run can spin up N notebooks concurrently at marginal cost. Multiple approaches explored in parallel with results compared.

**Prediction**: 50 concurrent notebooks cost under $1 in compute for a 10-minute exploration session.

**Validation**: Deploy and measure: spin up 50 notebooks on Cloud Run, each running a 3-cell exploration, measure Cloud Run billing and memory usage.

**Outcome**: PENDING

### Hypothesis 6: MCP Tasks state machine maps to notebook execution

Long-running notebook execution maps to MCP Tasks state machine, with `input_required` for decision points where LLM or human needs to choose.

**Prediction**: Notebook execution as a Task correctly transitions through `working` -> `input_required` -> `working` -> `completed`, with progress reported per-cell.

**Validation**: Implement task-augmented `notebook_execute`. Run 5-cell notebook with one decision point. Verify state transitions match MCP Tasks spec. Measure: correct state at each transition, progress updates received by client.

**Outcome**: PENDING

## Links

- Spec: `.specs/agentic-runbooks.md`
- Current notebook code: `src/notebook/` (types.ts, state.ts, execution.ts, tool.ts, operations.ts, encoding.ts, index.ts)
- ADR-GCP-01: `.adr/accepted/ADR-GCP-01-cloud-run-service-config.md` (300s timeout, Cloud Run config)
- ADR-DATA-01: `.adr/staging/ADR-DATA-01-supabase-product-schema.md` (Supabase schema pattern, RLS, dual-backend)
- ADR-013: `.adr/accepted/ADR-013-knowledge-storage-project-scoping.md` (setProject() interface)
- MCP Tasks spec: MCP specification (Nov 2025), `execution.taskSupport` negotiation
- Persistence interfaces: `src/persistence/types.ts` (ThoughtboxStorage), `src/knowledge/types.ts` (KnowledgeStorage)
