---
name: distill
description: Extract reusable principles and decision frameworks from accumulated experience. Use after significant work sessions, project milestones, or when you notice recurring patterns worth codifying.
argument-hint: [domain or topic to distill]
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

Distill wisdom from experience in this area: $ARGUMENTS

## Process

### 1. Experience Inventory

Gather evidence of past decisions and outcomes:
- Read recent git history (`git log --oneline -20`)
- Check beads issues (`bd list --status=closed`)
- Review agent memory and learnings
- Check `.claude/rules/` for existing principles
- Look at code patterns in the codebase

### 2. Pattern Extraction

For each significant decision or outcome:
- **What was decided?** (the choice made)
- **What was the context?** (constraints, information available)
- **What happened?** (outcome, downstream effects)
- **Was it the right call?** (with hindsight)

Look for:
- **Success patterns** — conditions that consistently lead to good outcomes
- **Failure patterns** — early warning signs of bad paths
- **Evolution patterns** — how thinking has changed over time

### 3. Principle Abstraction

Distill patterns into principles at the right abstraction level:

| Level | Example |
|---|---|
| **Tactical** | "Always run tests before committing database migrations" |
| **Strategic** | "Prefer reversible changes over irreversible ones" |
| **Philosophical** | "Optimize for time-to-signal, not time-to-completion" |

A good principle is:
- **Actionable** — you can act on it right now
- **Falsifiable** — you can identify situations where it doesn't apply
- **Bounded** — it states when it applies, not just what to do

### 4. Validation

Check each principle against past experience:
- Does it explain observed outcomes?
- Are there counter-examples?
- Under what conditions does it break?

### 5. Storage

Write validated principles to the appropriate location:
- **Project-wide**: `.claude/rules/` as a new or updated rule file
- **Agent-specific**: Agent memory
- **Session-specific**: `MEMORY.md`

Tag with freshness: **HOT** (just validated) | **WARM** (reasonable but not recently tested) | **COLD** (theoretical)

### 6. Output

```
## Distillation: [Domain]

### Evidence Base
- [N decisions/outcomes reviewed]
- [Key sources consulted]

### Principles Extracted

#### [Principle Name]
- **Statement**: [Clear, actionable principle]
- **Level**: tactical | strategic | philosophical
- **Evidence**: [What experience supports this]
- **Boundary**: [When this does NOT apply]
- **Freshness**: HOT | WARM | COLD
- **Stored in**: [where it was written]

### Principles Updated
- [Any existing principles promoted, demoted, or retired]

### Open Questions
- [What we still don't know]
```
