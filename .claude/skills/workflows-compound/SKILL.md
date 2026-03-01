---
name: workflows-compound
description: Capture learnings from the workflow into reusable documentation. Stage 7 of the development workflow.
argument-hint: [optional focus area]
user-invocable: true
---

Capture learnings from the current workflow: $ARGUMENTS

## Purpose

You are executing Stage 7 (Compound) of the development workflow. Implementation is reviewed and revised. Your job is to extract reusable learnings from this workflow and persist them so future workflows benefit. You are NOT writing code — you are documenting what was learned.

## Pre-Conditions

Before starting, verify:
1. `.workflow/state.json` exists and `currentStage` is `"compound"`
2. Review has passed (check `stages.review.status` is `"completed"`)
3. If revision happened, it's also completed

If pre-conditions are not met, report what's missing and halt.

## Process

### Step 1: Gather Evidence

Read all workflow artifacts:
1. **Workflow state**: `.workflow/state.json` — timeline, iterations, stage notes
2. **Sub-agent summaries**: `.adr/staging/*-summary-*.md` — what was built
3. **Review report**: `.workflow/review-report.md` — what was found
4. **Spec and ADR**: The original design documents
5. **Git log**: What actually changed

```bash
git log --oneline --since="$(jq -r .startedAt .workflow/state.json)" -- .
```

### Step 2: Extract Learnings

Identify three categories of learnings:

**Solutions** — Reusable patterns for solving specific problems:
- What problem was solved?
- What approach worked?
- What approach was tried and didn't work?
- What would you do differently next time?

**Discoveries** — Things learned about the codebase or domain:
- Unexpected behaviors encountered
- Undocumented constraints discovered
- Performance characteristics measured

**Process** — What worked or didn't in the workflow itself:
- Which stages were smooth vs. painful?
- Where did revision loops happen and why?
- What spec assumptions were wrong?

### Step 3: Write Solution Document

If a reusable solution was produced, write it to `docs/solutions/`:

```markdown
# <Problem Title>

## Problem
[What problem this solves, in 2-3 sentences]

## Solution
[The approach that worked, with code references]

## Context
- Workflow: <id>
- ADR: <path>
- Date: <ISO date>

## Key Decisions
- [Decision 1]: [Why this choice was made]
- [Decision 2]: [Why this choice was made]

## What Didn't Work
- [Approach that was tried and abandoned, with brief explanation]

## Related
- [Links to specs, ADRs, or other solutions]
```

### Step 4: Update Agent Memory

If significant patterns or discoveries should persist across sessions:

1. Check existing memory files for related entries
2. Update or add entries as appropriate
3. Include fitness tags (HOT/WARM/COLD) per the DGM calibration rules

### Step 5: Record and Handoff

1. **Update workflow state** (`.workflow/state.json`):
   - Set `stages.compound.status` to `"completed"`
   - Set `stages.compound.completedAt` to current ISO timestamp
   - Set `stages.compound.artifacts.solution` to the solution doc path (if created)
   - Set `currentStage` to `"reflection"`
   - Update `updatedAt`

2. **Present the handoff**:
   ```
   COMPOUND COMPLETE
   ==================

   Solutions captured: N
   Discoveries: N
   Process notes: N
   Solution doc: <path or "none — no reusable pattern identified">

   Next: Stage 8 - Reflection (/workflow-reflection)
   ```

## What Makes a Good Learning

A learning is worth capturing if it meets ANY of these:
- It would save >30 minutes if encountered again
- It contradicts documentation or common assumptions
- It reveals a non-obvious interaction between components
- It's a pattern that applies beyond this specific feature

A learning is NOT worth capturing if:
- It's specific to this feature with no broader applicability
- It's already documented in the codebase or specs
- It's a trivial fix that anyone would find quickly

## Anti-Patterns

- Do NOT capture every detail — focus on what's reusable
- Do NOT write vague learnings like "testing is important" — be specific
- Do NOT skip this stage because "nothing interesting happened" — every workflow teaches something
- Do NOT write code — this is a documentation stage
- Do NOT create solution docs for trivial changes — only for patterns worth reusing
