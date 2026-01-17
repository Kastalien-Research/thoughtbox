# Thoughtbox Tool

Non-linear reasoning workspace for complex problem-solving.

## Parameters

```javascript
thoughtbox({
  // Required
  thought: "Your reasoning step",
  thoughtNumber: 1,           // Logical position (not chronological)
  totalThoughts: 10,          // Adjustable estimate
  nextThoughtNeeded: true,    // Continue?

  // Optional extensions
  branchFromThought: 5,       // Fork point
  branchId: "option-a",       // Branch name
  isRevision: true,           // Updating previous?
  revisesThought: 3,          // Which to revise
  includeGuide: true          // Get patterns cookbook
})
```

## 7 Thinking Patterns

| Pattern | Direction | Use When | Example |
|---------|-----------|----------|---------|
| **Forward** | 1→N | Exploring, brainstorming | Start at problem, discover solution |
| **Backward** | N→1 | Known goal, planning | Start at success, find prerequisites |
| **Branching** | Fork at N | Comparing options | Explore SQL vs NoSQL in parallel |
| **Revision** | Update N | New info, error found | Correct earlier assumption |
| **Interleaved** | Think↔Act | Tool coordination | Reason → execute → integrate |
| **First Principles** | Break→Rebuild | Challenge assumptions | Reduce to fundamentals, rebuild |
| **Meta-Reflection** | Step back | Every 20-30 thoughts | Assess approach, adjust strategy |

## Pattern Details

### Forward (1→N)
```javascript
thoughtbox({ thought: "Problem: checkout is slow", thoughtNumber: 1, totalThoughts: 6, ... })
thoughtbox({ thought: "Data: 45s average, target 10s", thoughtNumber: 2, ... })
thoughtbox({ thought: "Causes: 3 APIs, 2 DB queries, no cache", thoughtNumber: 3, ... })
// Continue forward...
```

### Backward (N→1)
```javascript
thoughtbox({ thought: "SUCCESS: API handles 10K req/s", thoughtNumber: 10, totalThoughts: 10, ... })
thoughtbox({ thought: "REQUIRES: Load testing passed", thoughtNumber: 9, ... })
thoughtbox({ thought: "REQUIRES: Caching layer", thoughtNumber: 8, ... })
// Work backward to starting point...
```

### Branching
```javascript
thoughtbox({ thought: "Decision point: database choice", thoughtNumber: 5, ... })
thoughtbox({ thought: "PostgreSQL: ACID, relations", branchFromThought: 5, branchId: "sql", ... })
thoughtbox({ thought: "MongoDB: flexible schema", branchFromThought: 5, branchId: "nosql", ... })
thoughtbox({ thought: "SYNTHESIS: Hybrid approach", thoughtNumber: 10, ... })
```

### Revision
```javascript
thoughtbox({ thought: "3 stakeholders identified", thoughtNumber: 4, ... })
// Later discovery...
thoughtbox({ thought: "REVISION: Missed security team", isRevision: true, revisesThought: 4, ... })
```

### Interleaved
```
WHILE task incomplete:
  thoughtbox → reason about next step
  tool_call → execute action
  thoughtbox → integrate results
END
```

### First Principles
```javascript
thoughtbox({ thought: "What IS authentication fundamentally?", thoughtNumber: 1, ... })
thoughtbox({ thought: "Identity: know/have/are", thoughtNumber: 2, ... })
thoughtbox({ thought: "Access: permissions to identity", thoughtNumber: 3, ... })
thoughtbox({ thought: "Rebuild: capability-based tokens", thoughtNumber: 4, ... })
```

### Meta-Reflection
```javascript
// After 25 thoughts...
thoughtbox({ thought: "META: Am I converging or spinning?", thoughtNumber: 26, ... })
thoughtbox({ thought: "ASSESS: sql-branch promising, nosql abandoned", thoughtNumber: 27, ... })
thoughtbox({ thought: "ADJUST: Focus sql-branch, reduce total to 35", thoughtNumber: 28, totalThoughts: 35, ... })
```

## Anti-Patterns

- Sequential rigidity when jumping makes sense
- Over-branching (>5 branches hard to synthesize)
- Revision without forward progress
- Premature convergence

## Cross-References

- Combine with mental models: [MODELS.md](MODELS.md)
- Orchestration patterns: [PATTERNS.md](PATTERNS.md)
- Problem routing: [SELECTION.md](SELECTION.md)
