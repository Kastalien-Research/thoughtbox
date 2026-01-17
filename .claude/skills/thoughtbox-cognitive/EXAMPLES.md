# Workflow Examples

Executable demonstrations of tool orchestration.

## Example 1: Debugging Root Cause

**Path:** [MODELS.md](MODELS.md) (five-whys) → [THOUGHTBOX.md](THOUGHTBOX.md) (backward) → [NOTEBOOK.md](NOTEBOOK.md) (validate)

```javascript
// 1. Get framework
mental_models({ operation: "get_model", args: { model: "five-whys" } })

// 2. Backward thinking from failure
thoughtbox({ thought: "FAILURE: 15% login errors", thoughtNumber: 5, totalThoughts: 5, nextThoughtNeeded: true })
thoughtbox({ thought: "WHY: JWT validation fails", thoughtNumber: 4, ... })
thoughtbox({ thought: "WHY: Pods have different secrets", thoughtNumber: 3, ... })
thoughtbox({ thought: "WHY: Secret rotated without restart", thoughtNumber: 2, ... })
thoughtbox({ thought: "ROOT: No secret reload mechanism", thoughtNumber: 1, nextThoughtNeeded: false })

// 3. Validate with notebook
notebook({ operation: "create", args: { title: "JWT Debug", language: "typescript" }})
notebook({ operation: "add_cell", args: { notebookId: "...", cellType: "code", content: "// Prove hypothesis", filename: "validate.ts" }})
notebook({ operation: "run_cell", args: { notebookId: "...", cellId: "..." }})
```

## Example 2: Architecture Decision

**Path:** [MODELS.md](MODELS.md) (pre-mortem) → [THOUGHTBOX.md](THOUGHTBOX.md) (backward + branch) → [MODELS.md](MODELS.md) (trade-off)

```javascript
// 1. Pre-mortem risk analysis
mental_models({ operation: "get_model", args: { model: "pre-mortem" } })

// 2. Backward from success
thoughtbox({ thought: "SUCCESS: 100K writes/sec, <100ms latency", thoughtNumber: 8, totalThoughts: 8, ... })

// 3. Branch for options
thoughtbox({ thought: "TimescaleDB: SQL, compression", branchFromThought: 4, branchId: "timescale", ... })
thoughtbox({ thought: "ClickHouse: Fast OLAP, complex ops", branchFromThought: 4, branchId: "clickhouse", ... })

// 4. Trade-off analysis
mental_models({ operation: "get_model", args: { model: "trade-off-matrix" } })

// 5. Synthesize
thoughtbox({ thought: "DECISION: Timescale Cloud - balances all factors", thoughtNumber: 8, nextThoughtNeeded: false })
```

## Example 3: Deep Learning (Feynman)

**Path:** [NOTEBOOK.md](NOTEBOOK.md) (template) → [THOUGHTBOX.md](THOUGHTBOX.md) (refinement) → [NOTEBOOK.md](NOTEBOOK.md) (validate)

```javascript
// 1. Create Feynman notebook
notebook({ operation: "create", args: { title: "React Server Components", language: "typescript", template: "sequential-feynman" }})

// 2. Reason about gaps
thoughtbox({ thought: "Gap: missing serialization boundary concept", thoughtNumber: 1, totalThoughts: 3, ... })
thoughtbox({ thought: "Add: server→client data must be JSON-serializable", thoughtNumber: 2, ... })
thoughtbox({ thought: "Validated: explanation accurate", thoughtNumber: 3, nextThoughtNeeded: false })

// 3. Executable validation
notebook({ operation: "add_cell", args: { notebookId: "...", cellType: "code", content: "// RSC demo", filename: "rsc.ts" }})
notebook({ operation: "run_cell", args: { notebookId: "...", cellId: "..." }})
```

## Example 4: Interleaved Research

**Path:** [PATTERNS.md](PATTERNS.md) (interleaved) → [THOUGHTBOX.md](THOUGHTBOX.md) (5-phase)

```javascript
// Phase 1: Inventory
thoughtbox({ thought: "INVENTORY: search, fetch, thoughtbox, notebook available", thoughtNumber: 1, totalThoughts: 10, ... })
thoughtbox({ thought: "SUFFICIENT: Can research and validate", thoughtNumber: 2, ... })

// Phase 2: Strategy (backward)
thoughtbox({ thought: "GOAL: Comprehensive migration guide", thoughtNumber: 6, ... })
thoughtbox({ thought: "REQUIRES: Best practices + official docs", thoughtNumber: 5, ... })

// Phase 3: Execute loop
thoughtbox({ thought: "EXECUTE: Searching...", thoughtNumber: 7, ... })
// [Execute search]
thoughtbox({ thought: "INTEGRATE: Found 5 patterns", thoughtNumber: 8, ... })

// Phase 4: Finalize
thoughtbox({ thought: "COMPLETE: Guide validated", thoughtNumber: 10, nextThoughtNeeded: false })
```

## Example 5: First Principles

**Path:** [MODELS.md](MODELS.md) (assumption-surfacing) → [THOUGHTBOX.md](THOUGHTBOX.md) (first principles)

```javascript
// 1. Surface assumptions
mental_models({ operation: "get_model", args: { model: "assumption-surfacing" } })

// 2. Break to fundamentals
thoughtbox({ thought: "What IS authentication? Identity + access control", thoughtNumber: 1, totalThoughts: 6, ... })
thoughtbox({ thought: "Identity: know/have/are", thoughtNumber: 2, ... })
thoughtbox({ thought: "Access: permissions to identity", thoughtNumber: 3, ... })

// 3. Rebuild
thoughtbox({ thought: "From fundamentals: verification + permission", thoughtNumber: 4, ... })
thoughtbox({ thought: "Novel: capability-based tokens", thoughtNumber: 5, ... })
thoughtbox({ thought: "SYNTHESIS: Macaroon-style auth", thoughtNumber: 6, nextThoughtNeeded: false })
```

## Example 6: Meta-Reflection

**Path:** [THOUGHTBOX.md](THOUGHTBOX.md) (meta-reflection pattern)

```javascript
// After 25 thoughts...
thoughtbox({ thought: "META: Converging or spinning?", thoughtNumber: 26, totalThoughts: 40, ... })
thoughtbox({ thought: "ASSESS: sql-branch promising, nosql abandoned", thoughtNumber: 27, ... })
thoughtbox({ thought: "ADJUST: Focus sql-branch, reduce to 35", thoughtNumber: 28, totalThoughts: 35, ... })
```

## Example 7: Knowledge Graph Init

**Path:** [MODELS.md](MODELS.md) (get_capability_graph)

```javascript
// Get structured capability graph
mental_models({ operation: "get_capability_graph" })

// Returns entities + relations for:
// memory_create_entities(entities)
// memory_create_relations(relations)
// Makes Thoughtbox capabilities salient in knowledge graph
```

## Path Summary

| Task | Shortest Path |
|------|---------------|
| Debug | models(five-whys) → thoughtbox(backward) |
| Design | models(pre-mortem) → thoughtbox(branch) → models(trade-off) |
| Learn | notebook(feynman) → thoughtbox(refine) → notebook(run) |
| Research | thoughtbox(interleaved 5-phase) |
| Innovate | models(assumptions) → thoughtbox(first-principles) |
| Course-correct | thoughtbox(meta-reflection) |
