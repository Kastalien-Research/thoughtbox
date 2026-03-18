---
name: workflows-review
description: Verify implementation claims by dispatching review agents. Stage 5 of the development workflow.
argument-hint: [summary paths or review scope]
user-invocable: true
---

Review the implementation: $ARGUMENTS

## Purpose

You are executing Stage 5 (Review) of the development workflow. Implementation is complete and sub-agent summaries exist on disk. Your job is to dispatch review agents that verify claims, check for regressions, and assess quality. You do NOT fix issues — that's Stage 6's job.

## Pre-Conditions

Before starting, verify:
1. `.workflow/state.json` exists and `currentStage` is `"review"`
2. Implementation summaries exist (check `stages.implementation.artifacts.summaries` in state)
3. Read each summary to build the claims list

If pre-conditions are not met, report what's missing and halt.

## Process

### Step 1: Collect Claims

Read all sub-agent summaries from `.adr/staging/*-summary-*.md`. Extract:
- Every claim from each summary's `### Claims` section
- Every test command from `### Tests` section
- Every hypothesis alignment statement from `### Hypothesis Alignment`
- Every risk from `### Risks` section

### Step 2: Dispatch Review Agents

Dispatch specialized review agents in parallel. Each gets the full claims list and the relevant source files.

**Required reviews** (always run these):

1. **Claim Verification** — Use a `general-purpose` agent to:
   - Run every test command listed in summaries
   - Verify each claim by reading the implementation
   - Flag claims that are unsupported or contradicted

2. **Type Safety** — Use the `compound-engineering:review:kieran-typescript-reviewer` agent (or dispatch via Agent tool with instructions to check types):
   - Run `npm run build` or `tsc --noEmit`
   - Check for type errors, unsafe casts, any-typed escape hatches

3. **Pattern Consistency** — Use `compound-engineering:review:pattern-recognition-specialist` agent:
   - Check that new code follows existing codebase patterns
   - Flag naming inconsistencies, structural deviations

**Conditional reviews** (run when relevant):

4. **Security** — If changes touch auth, input handling, or external APIs:
   - Use `compound-engineering:review:security-sentinel` agent

5. **Performance** — If changes touch hot paths, data structures, or queries:
   - Use `compound-engineering:review:performance-oracle` agent

6. **Simplicity** — If changes add new abstractions or utilities:
   - Use `compound-engineering:review:code-simplicity-reviewer` agent

### Step 3: Collect Findings

Each review agent returns findings. Classify each finding:

| Severity | Meaning | Blocks? |
|----------|---------|---------|
| **blocking** | Claim is false, test fails, or security issue | Yes |
| **warning** | Quality concern, pattern deviation, missing edge case | No (but should fix) |
| **info** | Style suggestion, minor improvement | No |

### Step 4: Assess Hypothesis Alignment

Cross-reference the implementation's hypothesis alignment statements against the review results:
- Do the review findings support or undermine the ADR hypotheses?
- Are there hypotheses with no evidence either way? Flag as inconclusive.

### Step 5: Produce Review Report

Write the review report to `.workflow/review-report.md`:

```markdown
# Review Report: <title>

**Workflow**: <id>
**Reviewed**: <ISO timestamp>
**Summaries reviewed**: N

## Verdict: PASS / FAIL

## Findings

### Blocking (must fix before merge)
1. [finding with file:line reference]

### Warnings (should fix)
1. [finding with file:line reference]

### Info
1. [observation]

## Claim Verification
| # | Claim | Status | Evidence |
|---|-------|--------|----------|
| 1 | "..." | VERIFIED / FAILED / UNVERIFIABLE | [detail] |

## Hypothesis Check
| Hypothesis | Implementation Says | Review Says | Aligned? |
|-----------|-------------------|-------------|----------|
| H1 "..." | SUPPORTS | SUPPORTS | Yes |

## Test Results
- Tests run: N
- Tests passed: N
- Tests failed: N
- Commands: [list]
```

### Step 6: Record and Handoff

1. **Update workflow state** (`.workflow/state.json`):
   - Set `stages.review.status` to `"completed"`
   - Set `stages.review.completedAt` to current ISO timestamp
   - Set `stages.review.artifacts.findings` to the findings list
   - If verdict is PASS: set `currentStage` to `"compound"` (skip revision)
   - If verdict is FAIL: set `currentStage` to `"revision"`
   - Update `updatedAt`

2. **Present the handoff**:
   ```
   REVIEW COMPLETE
   ================

   Verdict: PASS / FAIL
   Blocking findings: N
   Warnings: N
   Claims verified: N/N

   Next: Stage 6 - Revision (/workflow-revision)  [if FAIL]
   Next: Stage 7 - Compound (/workflows-compound)  [if PASS]
   ```

## Operational Rules

1. **Review agents are read-only**: They analyze and report. They do NOT fix code.
2. **All claims must be checked**: Don't skip claims just because they seem obvious.
3. **Test commands must actually run**: Don't trust the summary's "N passing" — verify it.
4. **Findings need evidence**: Every finding must reference specific file:line locations.

## Anti-Patterns

- Do NOT fix code during review — that's revision's job
- Do NOT skip claim verification — the entire point is trust-but-verify
- Do NOT mark a failing test as "info" severity — test failures are always blocking
- Do NOT auto-pass reviews — even if everything looks good, run the checks
- Do NOT review your own implementation — review agents must be separate from implementation agents
