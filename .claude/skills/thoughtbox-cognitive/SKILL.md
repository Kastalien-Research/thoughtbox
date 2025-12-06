---
name: thoughtbox-cognitive
description: Cognitive enhancement toolkit combining non-linear reasoning, mental models, and literate programming. Use for complex analysis, system design, debugging, and deep learning workflows.
---

# Thoughtbox Cognitive Skill

Orchestrate the three Thoughtbox MCP tools for structured reasoning.

## When to Use

- **Complex problems** → decomposition + branching
- **Debugging** → five-whys + backward thinking
- **Architecture decisions** → pre-mortem + trade-off matrix
- **Deep learning** → Sequential Feynman notebook template
- **Research tasks** → interleaved reasoning loops

## Tools Quick Reference

### thoughtbox
```javascript
thoughtbox({
  thought: "...",
  thoughtNumber: 1,
  totalThoughts: 10,
  nextThoughtNeeded: true,
  // Extensions:
  branchFromThought: 5, branchId: "option-a",  // Branch
  isRevision: true, revisesThought: 3,          // Revise
  includeGuide: true                            // Get patterns cookbook
})
```

### mental_models
```javascript
mental_models({ operation: "list_models", args: { tag: "debugging" } })
mental_models({ operation: "get_model", args: { model: "five-whys" } })
```

### notebook
```javascript
notebook({ operation: "create", args: { title: "...", language: "typescript", template: "sequential-feynman" }})
notebook({ operation: "add_cell", args: { notebookId: "...", cellType: "code", content: "...", filename: "test.ts" }})
notebook({ operation: "run_cell", args: { notebookId: "...", cellId: "..." }})
```

## Orchestration Patterns

### Pattern 1: Ground → Reason → Validate
```javascript
// 1. Get framework
mental_models({ operation: "get_model", args: { model: "decomposition" } })
// 2. Apply with structured thinking
thoughtbox({ thought: "Decomposing: ...", thoughtNumber: 1, ... })
// 3. Validate with code
notebook({ operation: "create", ... })
```

### Pattern 2: Backward Planning
```javascript
// Start at goal (thought N), work back to start (thought 1)
thoughtbox({ thought: "SUCCESS: System handles 10K req/s", thoughtNumber: 10, totalThoughts: 10, ... })
thoughtbox({ thought: "REQUIRES: Caching layer", thoughtNumber: 9, ... })
// Continue backward...
```

### Pattern 3: Parallel Exploration
```javascript
// Branch from decision point
thoughtbox({ thought: "Option A: SQL", branchFromThought: 5, branchId: "sql", ... })
thoughtbox({ thought: "Option B: NoSQL", branchFromThought: 5, branchId: "nosql", ... })
// Synthesize
thoughtbox({ thought: "SYNTHESIS: Hybrid approach", thoughtNumber: 10, ... })
```

### Pattern 4: Interleaved Reasoning
```
WHILE task incomplete:
  thoughtbox → reason about next step
  tool_call → execute action
  thoughtbox → integrate results
END
```

## Model Selection

| Problem | Models | Pattern |
|---------|--------|---------|
| Bug unclear | five-whys, rubber-duck | Backward |
| Design decision | pre-mortem, trade-off-matrix | Branch + synthesize |
| Task planning | decomposition, impact-effort-grid | Forward |
| Risk assessment | pre-mortem, adversarial-thinking, inversion | Branch |
| Understanding topic | fermi-estimation, abstraction-laddering | Feynman notebook |

## Thinking Pattern Selection

| Pattern | Use When |
|---------|----------|
| Forward (1→N) | Exploring, brainstorming |
| Backward (N→1) | Known goal, planning |
| Branching | Comparing options |
| Revision | New information |
| Interleaved | Tool-coordinated tasks |

## Anti-Patterns

- Sequential rigidity when jumping makes sense
- Over-branching (>5 branches hard to synthesize)
- Revising without forward progress
- Premature convergence before exploring alternatives

## MCP Resources

Access detailed content directly from MCP:
- Patterns cookbook: `thoughtbox({ includeGuide: true, ... })`
- Mental model details: `mental_models({ operation: "get_model", args: { model: "..." } })`
- All models: `mental_models({ operation: "list_models" })`
- Notebook operations: resource `thoughtbox://notebook/operations`
