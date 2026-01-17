# Problem → Solution Routing

Quick decision guide: what tool/model/pattern for your problem.

## By Problem Type

### Debugging

| Symptom | Model | Pattern | Tool Flow |
|---------|-------|---------|-----------|
| Bug unclear | five-whys | Backward | models → thoughtbox |
| Need to explain issue | rubber-duck | Forward | thoughtbox only |
| Root cause unknown | five-whys + inversion | Backward | models → thoughtbox |

### Architecture

| Need | Model | Pattern | Tool Flow |
|------|-------|---------|-----------|
| System design | decomposition | Forward | models → thoughtbox → notebook |
| Compare options | trade-off-matrix | Parallel Exploration | models → thoughtbox (branch) |
| Risk assessment | pre-mortem, adversarial-thinking | Backward | models → thoughtbox |
| Abstraction level | abstraction-laddering | Forward | models → thoughtbox |

### Planning

| Need | Model | Pattern | Tool Flow |
|------|-------|---------|-----------|
| Task breakdown | decomposition | Forward | models → thoughtbox |
| Prioritization | impact-effort-grid | Forward | models → thoughtbox |
| Known goal | — | Backward | thoughtbox only |
| Time evaluation | time-horizon-shifting | Forward | models → thoughtbox |

### Decision-Making

| Need | Model | Pattern | Tool Flow |
|------|-------|---------|-----------|
| Choose between options | trade-off-matrix | Parallel Exploration | models → thoughtbox |
| Challenge decision | steelmanning | Forward | models → thoughtbox |
| Hidden costs | opportunity-cost | Forward | models → thoughtbox |
| Constraint stuck | constraint-relaxation | Forward | models → thoughtbox |

### Learning

| Need | Model | Pattern | Tool Flow |
|------|-------|---------|-----------|
| Understand topic | abstraction-laddering | Deep Learning (Feynman) | models → notebook |
| Estimate unknown | fermi-estimation | Forward | models → thoughtbox |
| Validate understanding | — | Ground → Reason → Validate | thoughtbox → notebook |

### Research

| Need | Model | Pattern | Tool Flow |
|------|-------|---------|-----------|
| Gather & synthesize | — | Interleaved (research mode) | thoughtbox ↔ external tools |
| Analyze patterns | — | Interleaved (analysis mode) | thoughtbox only |
| Implement & test | — | Interleaved (development mode) | thoughtbox ↔ code ↔ notebook |

## Quick Lookup

### "I need to..."

| Action | Start Here |
|--------|------------|
| Debug something | `five-whys` → backward thinking |
| Design a system | `decomposition` → forward thinking |
| Compare options | `trade-off-matrix` → branching |
| Find risks | `pre-mortem` → backward thinking |
| Learn a topic | `sequential-feynman` template |
| Plan a project | backward thinking from goal |
| Make a decision | `steelmanning` → `trade-off-matrix` |
| Estimate something | `fermi-estimation` |
| Prioritize tasks | `impact-effort-grid` |

### By Thinking Direction

| Direction | When | Models |
|-----------|------|--------|
| Forward (1→N) | Exploring, brainstorming | decomposition, fermi-estimation, abstraction-laddering |
| Backward (N→1) | Known goal, debugging | five-whys, pre-mortem, inversion |
| Branching | Comparing options | trade-off-matrix, steelmanning |
| Interleaved | Tool coordination | — (pattern, not model) |

## Minimal Paths

### Shortest path for common tasks:

**Debug a bug:**
```
five-whys → backward thoughtbox → done
```

**Design decision:**
```
pre-mortem → backward thoughtbox → branch options → trade-off-matrix → synthesize
```

**Learn a concept:**
```
sequential-feynman notebook → thoughtbox refinement → run validation code
```

**Plan a project:**
```
backward thoughtbox from goal → decomposition → impact-effort-grid
```

**Research task:**
```
interleaved mode (research) → inventory → strategy → execute loop → finalize
```

## Cross-References

- Tool details: [THOUGHTBOX.md](THOUGHTBOX.md), [MODELS.md](MODELS.md), [NOTEBOOK.md](NOTEBOOK.md)
- Orchestration patterns: [PATTERNS.md](PATTERNS.md)
- Concrete examples: [EXAMPLES.md](EXAMPLES.md)
