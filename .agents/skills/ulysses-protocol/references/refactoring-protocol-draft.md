# Refactoring Protocol — Draft Notes

**Status**: Early exploration. Not a spec — a capture of the problem shape and candidate signals.

**Context**: Ulysses Protocol handles debugging, where the terminal condition is clear (bug gone, tests pass). Refactoring lacks that signal. The code works before and after — the question is whether the structure improved, and whether the agent stayed on track getting there.

---

## The Core Problem

Refactoring has a property that debugging doesn't: **the absence of a natural stop signal**. A debugger knows when to stop. A refactorer has to decide.

This creates two failure modes:

1. **Drift** — the refactor expands beyond its original scope, touching modules and interfaces that weren't part of the plan. Each step feels locally justified. The tests still pass. But the change set has lost coherence.

2. **Value decay** — the refactor continues producing changes that are structurally different but not meaningfully better. The agent is moving code around without improving it, often because the original motivation has been satisfied but the agent hasn't recognized it.

Both failures are invisible from inside the loop. That's why they need external gating.

---

## How This Differs from Debugging (Ulysses)

| Property | Debugging (Ulysses) | Refactoring |
|----------|---------------------|-------------|
| Terminal condition | Observable: tests pass, bug gone | Judgment: "good enough" vs. "keep going" |
| Surprise signal | Expected vs. actual outcome | Did the design improve? (subjective) |
| Rollback motivation | "This made it worse" | "This is different but not better" |
| Path dependency | Low — converges on the bug | High — early choices constrain later ones |
| Model risk | Wrong model of the system | Wrong model of what "better" looks like |
| Primary danger | Hallucinated progress | Scope drift and reversibility decay |

---

## Candidate Gating Signals

### 1. Boundary Crossings (concrete, scriptable)

A refactor starts with a declared scope — a module, a package, a set of files. Every time the change set crosses into a new package or touches a file outside the declared scope, that's a **boundary crossing**.

Measurable via `git diff --stat` against a declared file/directory list.

**Why this works**: Boundary crossings are the refactoring analog of surprise. Each one means the agent's model of what needed to change was incomplete. One crossing is normal — dependencies exist. Two crossings in sequence means the scope model is wrong.

### 2. Interface Mutations (concrete, scriptable)

A refactor that changes no public interfaces (function signatures, class APIs, module exports) is contained by definition. The moment a public interface changes, every caller is in the blast radius.

Measurable via AST diff or even simple signature comparison before/after.

**Why this works**: Interface changes are the mechanism by which drift propagates. A private refactor can't drift far. A public interface change is a scope expansion event.

### 3. File Count Delta (concrete, scriptable)

How many files have been touched vs. how many the plan declared? If the plan said 3 and you're at 8, that's measurable drift.

### 4. Value Articulation (requires judgment, not scriptable)

After each step: "Can I state in one sentence what's better now than before this step?" If the answer is vague or refers to future steps ("this sets up..."), value is decaying.

### 5. Coherence Check (requires judgment, not scriptable)

"If I stopped right here, is the codebase in a shippable state?" Every intermediate state of a refactor should pass tests and be deployable. If it's not, the agent has created a debt that forces it to continue — reversibility is decaying.

### 6. Commit Narrative (requires judgment, partially scriptable)

Can you write a one-sentence commit message for the current diff? If you need "and" more than once, the change isn't atomic.

### 7. Reversibility Decay (emergent, not directly measurable)

At the start of a refactor, `git checkout .` undoes everything. As changes accumulate, the cost of abandoning increases. At some point the agent continues not because the refactor is good but because backing out is too expensive. This is the refactoring equivalent of Ulysses's ENVIRONMENT_COMPROMISED state.

---

## Candidate State Machine

Analogous to Ulysses's surprise counter S, a refactoring protocol could use a **boundary counter B**:

```
B = 0  ->  SCOPED      (changes within declared boundary)
B = 1  ->  EXPANDED     (one boundary crossing — justify it)
B = 2  ->  REFLECT      (two crossings — stop, reassess scope, or split)
```

### SCOPED (B = 0)

Agent works within declared scope. After each step:
- Drift check: is the change still within declared files/packages?
- Value check: can you articulate what improved?
- Coherence check: could you ship this right now?

If all three pass, create a checkpoint and continue.

### EXPANDED (B = 1)

A boundary crossing occurred. Agent must:
- Justify the crossing: why does this file/module need to change?
- Update the declared scope to include the new boundary
- Record rollback info for the expansion

If the next step produces another crossing, escalate to REFLECT.

### REFLECT (B = 2)

Two consecutive boundary crossings. The scope model is wrong. Agent must:
- Return to last checkpoint
- Decide: is this still one refactor, or should it be split into multiple?
- If continuing: form a new scope declaration with stated falsification ("if I need to touch module X, this refactor is too big")
- If splitting: create separate issues/branches for each piece

Reset B = 0 and continue with revised scope.

---

## Candidate Hooks

| Event | Hook | What it enforces |
|-------|------|------------------|
| PreToolUse:Edit | Scope check: is target file in declared scope? Warn if not, count as boundary crossing | Drift detection |
| PreToolUse:Write | Same as Edit, plus reversibility warning | Drift + reversibility |
| PostToolUse:Edit | Value prompt: "What improved?" | Value decay detection |
| PostToolUse:Bash(git diff) | File count check against declared scope | Drift measurement |
| B = 2 gate | Block action until reflect | Forces scope reassessment |

---

## Open Questions

1. **Is boundary crossing the right primary signal?** It's concrete and scriptable, but it might be too coarse. A massive change within one file isn't a boundary crossing but could still be drift.

2. **How do you declare scope?** At init, the agent states which files/directories/modules are in scope. But scope discovery is part of refactoring — you often don't know the full scope until you start. The protocol needs to accommodate legitimate scope expansion without treating all expansion as drift.

3. **Where does value assessment come from?** Ulysses assesses surprise comparatively (the surprise register). Could refactoring assess value comparatively? "Is this step's improvement larger or smaller than the previous step's?" Diminishing returns would show up as a downward trend.

4. **What's the relationship to Ulysses?** These could be two modes of one protocol (surprise-gated vs. drift-gated), or two protocols that share infrastructure (Thoughtbox sessions, state scripts, hook patterns). The state machine structure is parallel. The gating signal is different.

5. **Does this need Thoughtbox?** The value articulation and scope justification steps produce reasoning traces that are worth persisting. The boundary crossings and file counts are mechanical. A hybrid — scriptable checks for the concrete signals, Thoughtbox thoughts for the judgment calls — mirrors how Ulysses uses both local state and Thoughtbox sessions.
