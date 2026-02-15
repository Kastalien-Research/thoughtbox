---
name: workflow-reflection
description: Finalize the workflow by reflecting on the process, moving ADRs, closing issues, and preparing for merge. Stage 8 of the development workflow.
argument-hint: [optional reflection notes]
user-invocable: true
---

Execute the reflection and finalization stage. $ARGUMENTS

## Purpose

You are executing Stage 8 (Reflection) of the development workflow. The implementation is reviewed, revised, and compounded. Your job is to finalize: reflect on what happened, move artifacts to their permanent locations, close tracking issues, and prepare the branch for merge.

## Pre-Conditions

Before starting, verify:
1. `.workflow/state.json` exists and `currentStage` is `"reflection"`
2. Stages 1-7 are all completed or skipped (check state file)
3. All sub-agent work has been committed (no uncommitted implementation changes)

## Process

### Step 1: Agent Structured Reflection

Review the entire workflow by reading the state file and any persisted summaries. Produce a structured reflection:

```
WORKFLOW REFLECTION
====================

Workflow: <id> - <title>
Branch: <branch>
Duration: <startedAt> to now

## What Worked
- [specific things that went well, with evidence]
- [approaches that should be repeated]

## What Didn't Work
- [specific things that went poorly, with evidence]
- [approaches to avoid in future]

## Hypothesis Outcomes
- H1 "<text>": VALIDATED / REFUTED / INCONCLUSIVE
- H2 "<text>": ...

## Revision Iterations
- Total: N/3
- Root causes of revision: [what triggered each iteration]

## Unexpected Discoveries
- [things learned that weren't part of the original plan]
- [codebase behaviors that surprised us]

## Process Improvements
- [suggestions for improving the workflow itself]
```

### Step 2: User Reflection (Optional)

Ask the user if they want to add their own reflection:

```
Would you like to add your own reflection notes?
This is optional but valuable for the compound learning record.
```

If the user provides input, append it to the reflection under a `## Chief Agentic Notes` section.

### Step 3: Move ADR to Permanent Location

Based on the workflow outcome:

**If hypotheses were validated (happy path)**:
1. Move the staging ADR to accepted:
   ```bash
   mv .adr/staging/<NNN>-<name>-adr.md .adr/accepted/<NNN>-<name>.md
   ```
2. Move associated summaries with it:
   ```bash
   mv .adr/staging/<NNN>-<name>-summary-*.md .adr/accepted/
   ```
3. If the spec was in staging, move it to `specs/`
4. If any existing docs in `specs/` or `.adr/accepted/` are now outdated by this work, update them

**If hypotheses were refuted**:
1. Move the staging ADR to rejected:
   ```bash
   mv .adr/staging/<NNN>-<name>-adr.md .adr/rejected/<NNN>-<name>.md
   ```
2. Preserve test insights alongside the rejected ADR
3. Add rejection reason and falsified hypotheses to the ADR file

**If the workflow was abandoned or partially completed**:
1. Leave artifacts in staging with a note about the incomplete state
2. The next workflow that touches this domain will find them during ideation

### Step 4: Close Tracking Issues

1. Close the main workflow bead:
   ```bash
   bd close <beadId> --reason="Workflow completed: <1-line summary>"
   ```
2. Close any sub-beads created during implementation and revision:
   ```bash
   bd list --status=in_progress
   ```
   Close each one that was part of this workflow.
3. Create follow-up beads for any known gaps or deferred items discovered during the workflow.

### Step 5: Prepare for Merge

1. **Ensure all changes are committed**:
   ```bash
   git status
   ```
   If there are uncommitted changes (reflection artifacts, ADR moves), commit them:
   ```bash
   git add <specific files>
   git commit -m "docs: finalize workflow <id> - move ADR, close issues"
   ```

2. **Rebase onto main**:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
   If conflicts arise, resolve them or escalate to user.

3. **Push the branch**:
   ```bash
   git push -u origin <branch>
   ```

4. **Create or update the PR**:
   - If no PR exists, create one
   - If a PR exists, ensure it's up to date
   - The PR description should reference the ADR and include the reflection summary

5. **Merge decision**: Ask the user whether to merge now or leave the PR open for additional review:
   ```
   Branch is pushed and PR is ready.
   Merge now, or leave open for review?
   ```

### Step 6: Delegate Learning Capture

Invoke `/capture-learning` to extract reusable learnings from this workflow session. Pass it the reflection from Step 1 as context.

### Step 7: Update Workflow State

Set the final state:

```json
{
  "stages": {
    "reflection": {
      "status": "completed",
      "completedAt": "<ISO timestamp>"
    }
  },
  "currentStage": "completed",
  "updatedAt": "<ISO timestamp>"
}
```

### Step 8: Final Report

Present the completion summary:

```
WORKFLOW COMPLETE
==================

<title>
Branch: <branch>
Bead: <beadId> (closed)
ADR: <final location>

Stages:
  1. Ideation     [x] <notes excerpt>
  2. Dev-Docs     [x] spec: <path>, adr: <path>
  3. Planning     [x] plan: <path>
  4. Implementation [x] commits: N, summaries: N
  5. Review       [x] findings: N (all resolved)
  6. Revision     [x] iterations: N/3
  7. Compound     [x] learning captured
  8. Reflection   [x] ADR accepted/rejected

Follow-up issues: N created
PR: <url or "merged">
```

## Anti-Patterns

- Do NOT skip the ADR move — artifacts left in staging rot and confuse future workflows
- Do NOT close beads without a reason — the reason is the archaeological record
- Do NOT merge without pushing first — local-only merges are invisible to the team
- Do NOT skip the learning capture — the whole point of reflection is to compound
- Do NOT fabricate reflection — base it on actual evidence from the workflow state and summaries
