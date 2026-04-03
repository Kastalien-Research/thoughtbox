# SPEC-NOTEBOOK-RLM: Notebook as Recursive Language Model REPL

## Status: DRAFT

## Summary

Extend the existing Thoughtbox notebook module to serve as the RLM REPL described in Zhang, Kraska & Khattab (arXiv 2512.24601v2). Instead of building a standalone `rlm_repl` tool (as SPEC-RLM-001 proposes), converge on the notebook as the execution substrate. Notebooks already have cells (storage), execution (runCell), JavaScript/TypeScript support, and the Srcbook-derived .src.md format. What they lack is variable-addressed storage, recursive self-invocation (`sub_call`), and budget enforcement. This spec adds those three capabilities, turning the notebook into a general-purpose recursive reasoning REPL that can also serve as the project model gateway described in SPEC-PROJECT-MODEL.

## Motivation

SPEC-RLM-001 designs a new `rlm_repl` tool with its own session state, variable storage, sandboxed execution, and sub_call implementation. But notebooks already provide 80% of this:

| RLM Primitive | Notebook Equivalent | Gap |
|---|---|---|
| `store(name, value)` | `addCell` / `updateCell` | Cells are code/prose, not key-value. Need variable-addressed cells. |
| `peek(name)` | `getCell` | Returns cell metadata, not just the value. Need a lightweight read. |
| `execute(code)` | `runCell` | Runs via `child_process.spawn`, not `vm.createContext()`. Different sandbox model but same outcome — code executes, output captured. |
| `sub_call(prompt)` | Not present | Need recursive LLM invocation. Thoughtbox supports sampling. |
| `vars()` / `list_vars` | `listCells` | Works as-is. |
| `FINAL(result)` | `export` | Notebook export to .src.md is the result artifact. |

Building RLM as a notebook extension avoids duplicating the execution engine, cell management, dependency installation, and .src.md serialization. It also means RLM sessions produce notebook artifacts that can be exported, shared, and re-run — unlike the ephemeral in-memory state of SPEC-RLM-001.

## Requirements

### Phase 1: Variable-Addressed Cells

1. Add a new cell type `variable` with schema: `{ id, type: "variable", name: string, value: string, size: number }`.
2. Notebook operations gain `store_var` and `peek_var` that create/read variable cells by name.
3. `peek_var` supports `start`/`end` character offsets for slicing large values without loading full content into context.
4. Variable cells are included in notebook export (.src.md) as fenced blocks with `<!-- var:name -->` markers.
5. Budget enforcement: max 100 variable cells per notebook, max 1M total characters across all variable cells, max 100K characters per individual variable.

### Phase 2: Recursive Self-Invocation

6. Code cells gain access to a `sub_call(prompt, opts?)` global when executed. This function invokes the LLM via the Anthropic Messages API (dynamic import of `@anthropic-ai/sdk`).
7. `sub_call` options: `model` (default: `claude-sonnet-4-5-20250929`), `maxTokens` (default: 4096), `system` (optional system prompt), `temperature` (default: 0).
8. Inside `sub_call`, the spawned model has NO access to the notebook or its variables. It receives only the prompt string. This is the context isolation property from the RLM paper — sub-calls start fresh.
9. Execution budget: max 50 sub_calls per notebook, max 100K total tokens, tracked per notebook. `status` operation reports budget remaining.
10. If `@anthropic-ai/sdk` is not installed, `sub_call()` returns a clear error message. All other notebook operations work without the SDK.
11. Additionally, if MCP sampling is available (client supports `sampling/createMessage`), prefer that over direct API calls. This allows the notebook to use the user's own model configuration without a separate API key.

### Phase 3: REPL Globals and Ergonomics

12. Code cells are injected with REPL convenience globals: `store(name, value)`, `peek(name, start?, end?)`, `vars()`, `print(...args)`, `FINAL(result)`, `FINAL_VAR(varName)`. These delegate to the notebook's own state manager.
13. `FINAL(result)` sets a notebook-level result field and prevents further code cell execution. The result is surfaced in the notebook metadata and export.
14. `print()` output is captured in cell stdout (already works via console.log capture).
15. `llm_query(prompt, opts?)` is an alias for `sub_call()` (paper compatibility).

### Phase 4: Code Mode SDK Integration

16. The `tb.notebook.*` SDK in Code Mode gains: `tb.notebook.storeVar(notebookId, name, value)`, `tb.notebook.peekVar(notebookId, name, start?, end?)`, `tb.notebook.runWithREPL(notebookId, cellId)` (executes with REPL globals injected).
17. The notebook module appears in the Code Mode catalog with the RLM operations listed.
18. An `rlm-session` prompt template teaches the agent the REPL pattern (adapted from Appendix C of the paper), referencing notebook operations instead of a standalone tool.

## Acceptance Criteria

- [ ] `store_var` creates a variable cell, `peek_var` reads it back
- [ ] `peek_var` with start/end returns correct substring slice
- [ ] Budget enforcement rejects variables exceeding size limits
- [ ] `sub_call()` inside a code cell invokes the Anthropic API and returns text
- [ ] `sub_call()` budget tracking prevents exceeding token/call limits
- [ ] `sub_call()` returns clear error when SDK is not installed
- [ ] REPL globals (`store`, `peek`, `vars`, `FINAL`) work inside executed code cells
- [ ] `FINAL(result)` sets notebook result and prevents further execution
- [ ] Notebook with variable cells exports to .src.md and re-imports correctly
- [ ] Code Mode SDK exposes `storeVar`, `peekVar`, `runWithREPL`
- [ ] `npx tsc --noEmit` passes
- [ ] Existing notebook tests continue to pass (no regression)

## Relationship to SPEC-RLM-001

This spec **supersedes** SPEC-RLM-001. The standalone `rlm_repl` tool described there is not needed. The notebook module absorbs its functionality with less code, more durability (notebooks persist as .src.md files), and better integration with the rest of Thoughtbox (sessions, knowledge graph, Code Mode SDK).

The RLM REPL becomes a mode of using notebooks, not a separate tool. This follows the Code Mode philosophy: fewer tools, more expressive composition through JavaScript.

## Relationship to SPEC-PROJECT-MODEL

When the project model (SPEC-PROJECT-MODEL) stores the module graph in the knowledge graph, notebooks with REPL globals can query it. A code cell can `peek("project_graph")` and then `sub_call("Given this module graph, what's the blast radius of changing addObservation?")`. The notebook becomes both the reasoning environment and the project-aware gateway — the agent works within a notebook that understands the codebase structure.

## Dependencies

- Existing notebook module (`src/notebook/`)
- `@anthropic-ai/sdk` (optional, for sub_call — already a devDependency)
- MCP sampling support (optional, preferred over direct API when available)
- Knowledge graph (for project model queries — optional, additive)

## Open Questions

1. **Execution model**: Current notebooks use `child_process.spawn` (real Node.js process). SPEC-RLM-001 uses `vm.createContext()` (in-process sandbox). Spawn is heavier but provides true isolation. vm is lighter but has known escape vectors. Which model for REPL globals injection?
2. **Persistence**: SPEC-RLM-001 is explicitly ephemeral. Notebooks persist as .src.md. Is persistence an advantage (you can resume an RLM session) or a liability (stale variables)?
3. **sub_call model routing**: Should sub_call default to the cheapest capable model (Haiku for simple extraction, Sonnet for reasoning) or always use one model? The paper uses a single model but cost optimization matters in practice.
4. **Notebook-as-gateway scope**: If notebooks become the gateway for codebase interaction (SPEC-PROJECT-MODEL + SPEC-BLAST-RADIUS), does the execution model need to change? Currently cells run in the server's temp directory. Gateway operations would need access to the user's project files, which live on the client side, not the server.

## References

- Zhang, Kraska & Khattab. "Recursive Language Models." ICML 2026. arXiv:2512.24601v2.
- SPEC-RLM-001: `.specs/SPEC-RLM-001-recursive-language-model-repl.md` (superseded)
- Srcbook: The open-source notebook format this implementation descends from.
- SPEC-PROJECT-MODEL: `.specs/thoughtbox-v1-finalstretch/SPEC-PROJECT-MODEL.md`
