# Orchestration Patterns

How to combine tools for complex workflows.

## Pattern 1: Ground → Reason → Validate

**Use when:** Need framework-guided analysis with executable proof.

```javascript
// 1. Ground in mental model
mental_models({ operation: "get_model", args: { model: "decomposition" } })

// 2. Reason with thoughtbox
thoughtbox({ thought: "Decomposing auth system into: identity, session, permission", thoughtNumber: 1, ... })
thoughtbox({ thought: "Identity subsystem: OAuth providers + local accounts", thoughtNumber: 2, ... })
thoughtbox({ thought: "Session: JWT with refresh tokens", thoughtNumber: 3, ... })

// 3. Validate with notebook
notebook({ operation: "create", args: { title: "Auth Validation", language: "typescript" }})
notebook({ operation: "add_cell", args: { notebookId: "...", cellType: "code", content: "// Test JWT flow", filename: "jwt-test.ts" }})
notebook({ operation: "run_cell", args: { notebookId: "...", cellId: "..." }})
```

## Pattern 2: Backward Planning

**Use when:** Known goal, need to find path.

```javascript
// Start at success state
thoughtbox({ thought: "SUCCESS: System handles 10K req/s, <100ms latency", thoughtNumber: 10, totalThoughts: 10, ... })

// Work backward through requirements
thoughtbox({ thought: "REQUIRES: Load testing passed, autoscaling verified", thoughtNumber: 9, ... })
thoughtbox({ thought: "REQUIRES: Caching layer operational", thoughtNumber: 8, ... })
thoughtbox({ thought: "REQUIRES: Database optimized", thoughtNumber: 7, ... })

// Continue to starting point
thoughtbox({ thought: "START: Current system at 1K req/s, 500ms latency", thoughtNumber: 1, nextThoughtNeeded: false })
```

## Pattern 3: Parallel Exploration

**Use when:** Multiple viable options, need comparison.

```javascript
// Establish decision point
thoughtbox({ thought: "Decision: Database selection for time-series data", thoughtNumber: 5, ... })

// Branch A
thoughtbox({ thought: "TimescaleDB: SQL interface, compression, self-managed", branchFromThought: 5, branchId: "timescale", ... })
thoughtbox({ thought: "TimescaleDB: Pros - familiar SQL, good compression", branchFromThought: 5, branchId: "timescale", ... })

// Branch B
thoughtbox({ thought: "ClickHouse: Column-oriented, fast analytics", branchFromThought: 5, branchId: "clickhouse", ... })
thoughtbox({ thought: "ClickHouse: Pros - speed, cons - complex ops", branchFromThought: 5, branchId: "clickhouse", ... })

// Synthesize using trade-off matrix
mental_models({ operation: "get_model", args: { model: "trade-off-matrix" } })
thoughtbox({ thought: "SYNTHESIS: TimescaleDB Cloud balances performance, cost, operability", thoughtNumber: 10, nextThoughtNeeded: false })
```

## Pattern 4: Interleaved Reasoning

**Use when:** Tool-coordinated tasks requiring adaptive execution.

```javascript
// Phase 1: Inventory
thoughtbox({ thought: "INVENTORY: Available tools - search, fetch, thoughtbox, notebook", thoughtNumber: 1, totalThoughts: 10, ... })
thoughtbox({ thought: "SUFFICIENT: Can research and validate", thoughtNumber: 2, ... })

// Phase 2: Strategy (backward)
thoughtbox({ thought: "GOAL: Comprehensive migration guide", thoughtNumber: 6, ... })
thoughtbox({ thought: "REQUIRES: Best practices + official docs", thoughtNumber: 5, ... })

// Phase 3: Execute loop
thoughtbox({ thought: "EXECUTE: Searching best practices...", thoughtNumber: 7, ... })
// [Execute external tool]
thoughtbox({ thought: "INTEGRATE: Found 5 patterns, documenting...", thoughtNumber: 8, ... })

// Phase 4: Finalize
thoughtbox({ thought: "COMPLETE: Guide validated against docs", thoughtNumber: 10, nextThoughtNeeded: false })
```

**Interleaved Modes** (access via `thoughtbox://interleaved/{mode}`):

| Mode | When | Required Capabilities |
|------|------|----------------------|
| research | Info gathering, synthesis | thoughtbox, search |
| analysis | Pattern recognition, interpretation | thoughtbox |
| development | Code implementation, debugging | thoughtbox, code, execution |

## Pattern 5: Deep Learning (Feynman)

**Use when:** Need to truly understand a complex topic.

```javascript
// 1. Create Feynman notebook
notebook({ operation: "create", args: { title: "React Server Components", language: "typescript", template: "sequential-feynman" }})

// 2. Reason about gaps
thoughtbox({ thought: "Analyzing explanation for gaps: missing serialization boundary", thoughtNumber: 1, totalThoughts: 3, ... })
thoughtbox({ thought: "Adding: server→client data must be JSON-serializable", thoughtNumber: 2, ... })

// 3. Validate with code
notebook({ operation: "add_cell", args: { notebookId: "...", cellType: "code", content: "// RSC demo", filename: "rsc.ts" }})
notebook({ operation: "run_cell", args: { notebookId: "...", cellId: "..." }})

// 4. Complete
thoughtbox({ thought: "Validated: explanation accurate", thoughtNumber: 3, nextThoughtNeeded: false })
```

## Pattern 6: Risk-Driven Design

**Use when:** High-stakes decisions requiring failure analysis.

```javascript
// 1. Pre-mortem analysis
mental_models({ operation: "get_model", args: { model: "pre-mortem" } })

// 2. Imagine failure
thoughtbox({ thought: "FAILURE: System crashed under Black Friday load", thoughtNumber: 1, ... })

// 3. Work backward to causes
thoughtbox({ thought: "CAUSE: Database connection pool exhausted", thoughtNumber: 2, ... })
thoughtbox({ thought: "CAUSE: No circuit breaker on payment API", thoughtNumber: 3, ... })

// 4. Invert to solutions
mental_models({ operation: "get_model", args: { model: "inversion" } })
thoughtbox({ thought: "PREVENT: Connection pooling with overflow queue", thoughtNumber: 4, ... })
thoughtbox({ thought: "PREVENT: Circuit breaker + fallback payment flow", thoughtNumber: 5, ... })
```

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| Tool hopping | Switching tools without purpose | Complete thought sequence first |
| Over-orchestration | 3+ tools when 1 suffices | Start simple, add tools as needed |
| Skipping synthesis | Branches without convergence | Always end with synthesis thought |
| Ignoring validation | Reasoning without proof | Use notebook to verify |

## Cross-References

- Thoughtbox patterns: [THOUGHTBOX.md](THOUGHTBOX.md)
- Mental model selection: [MODELS.md](MODELS.md)
- Problem routing: [SELECTION.md](SELECTION.md)
- Examples: [EXAMPLES.md](EXAMPLES.md)
