# Workflow Examples

Concise demonstrations of tool orchestration.

## Example 1: Debugging Root Cause

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
notebook({ operation: "add_cell", args: { notebookId: "...", cellType: "code", content: "// Simulation proving hypothesis", filename: "validate.ts" }})
notebook({ operation: "run_cell", args: { notebookId: "...", cellId: "..." }})
```

## Example 2: Architecture Decision

```javascript
// 1. Pre-mortem risk analysis
mental_models({ operation: "get_model", args: { model: "pre-mortem" } })

// 2. Backward from success
thoughtbox({ thought: "SUCCESS: 100K writes/sec, <100ms latency", thoughtNumber: 8, totalThoughts: 8, ... })

// 3. Branch for options
thoughtbox({ thought: "TimescaleDB: SQL, compression, self-managed", branchFromThought: 4, branchId: "timescale", ... })
thoughtbox({ thought: "ClickHouse: Fast OLAP, complex ops", branchFromThought: 4, branchId: "clickhouse", ... })

// 4. Trade-off analysis
mental_models({ operation: "get_model", args: { model: "trade-off-matrix" } })

// 5. Synthesize
thoughtbox({ thought: "DECISION: Timescale Cloud - balances performance, cost, operability", thoughtNumber: 8, nextThoughtNeeded: false })
```

## Example 3: Deep Learning (Sequential Feynman)

```javascript
// 1. Create Feynman notebook with template
notebook({ operation: "create", args: { title: "React Server Components", language: "typescript", template: "sequential-feynman" }})

// 2. Use thoughtbox for refinement analysis
thoughtbox({ thought: "Analyzing explanation for gaps: missing serialization boundary concept", thoughtNumber: 1, totalThoughts: 3, ... })
thoughtbox({ thought: "Adding: data crossing server→client must be JSON-serializable", thoughtNumber: 2, ... })
thoughtbox({ thought: "Validation complete, explanation accurate", thoughtNumber: 3, nextThoughtNeeded: false })

// 3. Add executable validation
notebook({ operation: "add_cell", args: { notebookId: "...", cellType: "code", content: "// Code demonstrating RSC behavior", filename: "rsc-demo.ts" }})
notebook({ operation: "run_cell", args: { notebookId: "...", cellId: "..." }})
```

## Example 4: Interleaved Research

```javascript
// Phase 1: Inventory tools (thought 1-2)
thoughtbox({ thought: "INVENTORY: search_web, fetch_docs, thoughtbox, notebook available", thoughtNumber: 1, totalThoughts: 10, ... })
thoughtbox({ thought: "SUFFICIENT: Can research and validate", thoughtNumber: 2, ... })

// Phase 2: Strategy (backward planning)
thoughtbox({ thought: "GOAL: Comprehensive migration guide", thoughtNumber: 6, ... })
thoughtbox({ thought: "REQUIRES: Best practices + official docs", thoughtNumber: 5, ... })

// Phase 3: Execute loop
thoughtbox({ thought: "EXECUTE: Searching best practices...", thoughtNumber: 7, ... })
// [Execute search tool]
thoughtbox({ thought: "INTEGRATE: Found 5 key patterns, documenting...", thoughtNumber: 8, ... })

// Phase 4: Finalize
thoughtbox({ thought: "COMPLETE: Guide ready, validated against docs", thoughtNumber: 10, nextThoughtNeeded: false })
```

## Example 5: First Principles Innovation

```javascript
// 1. Challenge assumptions
mental_models({ operation: "get_model", args: { model: "assumption-surfacing" } })

// 2. Break down to fundamentals
thoughtbox({ thought: "What IS auth? Identity verification + access control", thoughtNumber: 1, totalThoughts: 6, ... })
thoughtbox({ thought: "Identity: something you know/have/are", thoughtNumber: 2, ... })
thoughtbox({ thought: "Access: permissions mapped to verified identity", thoughtNumber: 3, ... })

// 3. Rebuild from first principles
thoughtbox({ thought: "From fundamentals: need verification + permission systems", thoughtNumber: 4, ... })
thoughtbox({ thought: "Novel approach: capability-based tokens, not role-based", thoughtNumber: 5, ... })
thoughtbox({ thought: "SYNTHESIS: Macaroon-style auth tokens", thoughtNumber: 6, nextThoughtNeeded: false })
```

## Example 6: Meta-Reflection

```javascript
// After 25 thoughts of complex analysis...
thoughtbox({ thought: "META-REFLECT: Am I converging or spinning? Review branches...", thoughtNumber: 26, totalThoughts: 40, ... })
thoughtbox({ thought: "ASSESSMENT: 3 branches explored, sql-branch most promising, nosql abandoned", thoughtNumber: 27, ... })
thoughtbox({ thought: "ADJUST: Reduce totalThoughts to 35, focus on sql-branch refinement", thoughtNumber: 28, totalThoughts: 35, ... })
```

## Example 7: Knowledge Graph Initialization

```javascript
// 1. Get structured capability graph
mental_models({ operation: "get_capability_graph" })

// 2. Returns entities and relations ready for memory tools
// Use with memory_create_entities and memory_create_relations
// Makes all Thoughtbox capabilities salient in knowledge graph
```
