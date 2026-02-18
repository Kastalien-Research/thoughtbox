---
name: capture-learning
description: Capture significant learnings from the current work session. Structures insights for future sessions and updates agent memory.
argument-hint: [optional topic or context]
user-invocable: true
---

Reflect on the current session and capture learnings. Context: $ARGUMENTS

## Process

### 1. Reflect
- What was the main problem being solved?
- What non-obvious insights emerged?
- What patterns are reusable in future work?
- What failed and why?

### 2. Structure the Learning

Format each learning as:

```
### [Date]: [Title]
- **Issue**: [The problem encountered]
- **Solution**: [What worked]
- **Pattern**: [The reusable principle extracted]
- **Files**: [Key file references, if applicable]
- **Freshness**: HOT (actively relevant) | WARM (occasionally relevant) | COLD (reference only)
```

### 3. Store

Write the learning to the appropriate location:
- **Agent-specific patterns**: Update the relevant agent's project memory
- **Project-wide rules**: Add to `.claude/rules/` as a new file or append to an existing one
- **Debugging insights**: Add to auto-memory `MEMORY.md`

### 4. Calibrate

Check existing learnings for staleness:
- Are any HOT items now WARM or COLD?
- Are any previous learnings contradicted by what we learned today?
- Remove or update anything that's no longer accurate.
