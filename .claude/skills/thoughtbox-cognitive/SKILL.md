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

---

## Tools Quick Reference

### thoughtbox — Non-Linear Reasoning

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

**7 Thinking Patterns:**

| Pattern | Direction | Use When |
|---------|-----------|----------|
| Forward | 1→N | Exploring, brainstorming, discovery |
| Backward | N→1 | Known goal, planning, working from success |
| Branching | Fork at N | Comparing options, parallel exploration |
| Revision | Update N | New info, error found, refined understanding |
| Interleaved | Think↔Act | Tool-coordinated tasks, adaptive execution |
| First Principles | Break→Rebuild | Challenging assumptions, innovation |
| Meta-Reflection | Step back | Every 20-30 thoughts, assess approach |

### mental_models — Structured Reasoning Schemas

```javascript
mental_models({ operation: "get_model", args: { model: "five-whys" } })
mental_models({ operation: "list_models", args: { tag: "debugging" } })
mental_models({ operation: "list_tags" })
mental_models({ operation: "get_capability_graph" })  // For knowledge graph init
```

**15 Models:**

| Model | Purpose | Tags |
|-------|---------|------|
| rubber-duck | Explain to find issues | debugging, communication |
| five-whys | Drill to root cause | debugging, validation |
| pre-mortem | Imagine failure, work backward | risk-analysis, planning |
| assumption-surfacing | Expose hidden assumptions | validation, planning |
| steelmanning | Strongest opposing view | decision-making, validation |
| trade-off-matrix | Map competing concerns | decision-making, prioritization |
| fermi-estimation | Order-of-magnitude estimates | estimation |
| abstraction-laddering | Move up/down abstraction | architecture, communication |
| decomposition | Break into tractable pieces | planning, architecture |
| adversarial-thinking | Attacker mindset | risk-analysis, validation |
| opportunity-cost | What you give up | decision-making, prioritization |
| constraint-relaxation | Remove constraints, explore, reapply | planning, architecture |
| time-horizon-shifting | Evaluate at 1wk/1yr/10yr | planning, decision-making |
| impact-effort-grid | Plot impact vs effort | prioritization |
| inversion | Avoid failure paths | risk-analysis, planning |

**9 Tags:** debugging, planning, decision-making, risk-analysis, estimation, prioritization, communication, architecture, validation

### notebook — Literate Programming

```javascript
notebook({ operation: "create", args: { title: "...", language: "typescript", template: "sequential-feynman" }})
notebook({ operation: "add_cell", args: { notebookId: "...", cellType: "code", content: "...", filename: "test.ts" }})
notebook({ operation: "run_cell", args: { notebookId: "...", cellId: "..." }})
```

**10 Operations:**

| Operation | Category | Purpose |
|-----------|----------|---------|
| create | management | New notebook (optionally with template) |
| list | management | All active notebooks |
| load | management | Load from .src.md (path or content) |
| export | management | Export to .src.md |
| add_cell | cells | Add title/markdown/code cell |
| update_cell | cells | Update existing cell |
| list_cells | cells | List all cells with metadata |
| get_cell | cells | Cell details including execution results |
| run_cell | execution | Execute code cell, capture output |
| install_deps | execution | Install npm dependencies |

**Sequential Feynman Template** — 4 phases for deep learning:
1. Research & Synthesis
2. Feynman Explanation (simple terms)
3. Refinement Cycles (find gaps, iterate)
4. Expert Re-encoding

---

## Prompts

| Prompt | Purpose |
|--------|---------|
| `list_mcp_assets()` | Overview of all tools, resources, quickstart |
| `interleaved-thinking(task, thoughts_limit, clear_folder)` | IRCoT-style multi-phase execution |

---

## Interleaved Modes

Access via resource: `thoughtbox://interleaved/{mode}`

| Mode | When | Required Capabilities |
|------|------|----------------------|
| research | Literature review, info gathering, synthesis | thoughtbox, retrieval/search |
| analysis | Deep examination, pattern recognition | thoughtbox (retrieval optional) |
| development | Code implementation, debugging | thoughtbox, code access, execution |

**5-Phase Process:** Tooling Inventory → Sufficiency Assessment → Strategy → Execution Loop → Final Answer

---

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

---

## Model Selection Guide

| Problem | Models | Pattern |
|---------|--------|---------|
| Bug unclear | five-whys, rubber-duck | Backward |
| Design decision | pre-mortem, trade-off-matrix | Branch + synthesize |
| Task planning | decomposition, impact-effort-grid | Forward |
| Risk assessment | pre-mortem, adversarial-thinking, inversion | Branch |
| Understanding topic | fermi-estimation, abstraction-laddering | Feynman notebook |

---

## Anti-Patterns

- Sequential rigidity when jumping makes sense
- Over-branching (>5 branches hard to synthesize)
- Revising without forward progress
- Premature convergence before exploring alternatives

---

## MCP Resources (On-Demand Details)

- Patterns cookbook: `thoughtbox({ includeGuide: true, ... })`
- Mental model content: `mental_models({ operation: "get_model", args: { model: "..." } })`
- All models/tags: `mental_models({ operation: "list_models" })` / `list_tags`
- Capability graph: `mental_models({ operation: "get_capability_graph" })`
- Notebook operations: resource `thoughtbox://notebook/operations`
- Interleaved guides: resource `thoughtbox://interleaved/{mode}`
