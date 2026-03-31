---
name: workflow-revision
description: Iterate on implementation fixes surfaced by review until all claims are verified. Stage 6 of the development workflow.
argument-hint: [review findings summary or path]
user-invocable: true
---

Execute revision based on review findings: $ARGUMENTS

## Purpose

You are executing Stage 6 (Revision) of the development workflow. Review found issues with the implementation. Your job is to dispatch sub-agents to fix them, then re-run review until it passes — or escalate after 3 iterations.

## Pre-Conditions

Before starting, verify:
1. `.workflow/state.json` exists and `currentStage` is `"revision"`
2. Review findings exist (either passed as argument or in `stages.review.artifacts.findings`)
3. The working tree has uncommitted changes from implementation (since commits happen post-review)

## Process

### Step 1: Classify Review Findings

Read the review findings and classify each into:

| Category | Action | Example |
|----------|--------|---------|
| **Claim failure** | Re-dispatch sub-agent for the specific claim | "Function X does not handle case Y" |
| **Test gap** | Add missing test coverage | "No test for edge case Z" |
| **Spec divergence** | Fix code OR update spec (with justification) | "Implementation differs from spec section 3.2" |
| **ADR conflict** | Flag for user decision | "This contradicts accepted ADR-005" |
| **Style/quality** | Fix inline (no sub-agent needed) | "Missing error handling on line 42" |

### Step 2: Dispatch Fixes

For each finding that requires a sub-agent:

1. Dispatch a sub-agent with:
   - The specific finding to address
   - The relevant spec section
   - The file(s) to modify
   - Instructions to return the structured summary format (from the conductor skill)
3. Persist the returned summary to disk immediately

For findings that can be fixed inline (style/quality):
- Make the fix directly
- Note it in the revision log

For ADR conflicts:
- Present to the user with the four ADR reconciliation dispositions:
  1. **STILL VALID** — false positive, ADR reasoning holds
  2. **NEEDS AMENDMENT** — core decision correct, context needs updating
  3. **SUPERSEDED** — another ADR has replaced this one
  4. **INVALIDATED** — reasoning no longer holds, no replacement
- Wait for user decision before proceeding

### Step 3: Handle Spec Updates

If any finding reveals that the spec was wrong (not the implementation), update the spec:

- If the spec assumption was based on incomplete knowledge of the codebase: update the spec to match reality. This is expected and not a failure.
- If the spec's intent was correct but the approach was wrong: update the spec with the revised approach and note what changed.
- If the ADR's reasoning is affected: escalate to user. Do not silently update the ADR.

Spec updates go in the same commit as the code fix.

### Step 4: Re-Run Review

After all fixes are applied:

1. Increment `stages.revision.iterations` in the state file
2. Dispatch `/workflows-review` on the fixed code
3. Evaluate the review results:

**If review passes** (all claims verified, no blocking findings):
- Update state: set `stages.revision.status` to `"completed"`, `currentStage` to `"compound"`

- Hand off to the conductor

**If review still has findings**:
- Check iteration count against `maxIterations` (default: 3)
- If under max: loop back to Step 1 with the new findings
- If at max: proceed to Step 5 (Escalation)

### Step 5: Escalation (Max Iterations Reached)

If 3 revision iterations have not resolved all findings:

```
REVISION ESCALATION
====================

Iterations completed: 3/3
Remaining findings: N

Unresolved:
1. [finding]: Attempted [approach], result: [what happened]
2. [finding]: Attempted [approach], result: [what happened]

Options:
A. Accept current state (acknowledge known gaps, proceed to Compound)
B. Re-enter at Planning stage (re-plan the approach)
C. Re-enter at Dev-Docs stage (revise spec/ADR)
D. Abandon workflow (delete branch)

Recommendation: [A/B/C/D] because [reason]
```

Wait for user decision. Update state accordingly.

### State Updates

Throughout this stage, keep the state file current:

```json
{
  "stages": {
    "revision": {
      "status": "in_progress",
      "iterations": 1,
      "maxIterations": 3,
      "findings": [
        { "id": 1, "category": "claim_failure", "description": "...", "status": "fixed|open|escalated" }
      ]
    }
  }
}
```

## Operational Rules

- Each fix gets its own sub-agent (1 fix = 1 commit after review passes)
- Do NOT commit during revision — commits happen only after review validates the final state
- If a fix introduces new issues, those count against the iteration budget
- Inline style fixes do not consume an iteration
- Always persist sub-agent summaries to disk before proceeding

## Anti-Patterns

- Do NOT skip review after making fixes — the whole point is verification
- Do NOT increase `maxIterations` beyond 3 without user approval
- Do NOT fix findings by deleting the test or weakening the claim
- Do NOT modify the ADR without user approval (specs are fair game, ADRs are not)
