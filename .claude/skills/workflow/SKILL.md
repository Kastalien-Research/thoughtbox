---
name: workflow
description: Orchestrate the full development lifecycle from ideation through merge. Sequences 8 stages with gates, dispatches to stage skills, and maintains workflow state.
argument-hint: [idea or feature description]
user-invocable: true
---

Orchestrate the development workflow for: $ARGUMENTS

## Overview

You are the **workflow conductor**. You sequence 8 stages, enforce gates between them, dispatch to stage skills, and maintain a state file. You do NOT perform stage-specific work yourself — you delegate to the appropriate skill or sub-agent at each stage.

## Stages and Dispatch

| # | Stage | Skill/Command | Gate (must pass before advancing) |
|---|-------|--------------|-----------------------------------|
| 1 | Ideation | `/workflow-ideation` | User confirms proceed (question 3d is not "confident no") |
| 2 | Dev-Time Docs | `/hdd --phases=1-2` | Spec exists in `specs/`, ADR exists in `.adr/staging/` |
| 3 | Planning | `/workflows-plan` | Plan file exists and user has approved it |
| 4 | Implementation | `/workflows-work` | All sub-agent summaries persisted to disk, all tests pass |
| 5 | Review | `/workflows-review` | All claims verified, no blocking findings |
| 6 | Revision | `/workflow-revision` | Review passes OR max iterations reached + user accepts |
| 7 | Compound | `/workflows-compound` | Learning captured |
| 8 | Reflection | `/workflow-reflection` | ADR moved, issues closed, branch merged or marked ready |

## Initialization

When invoked, first check for an existing workflow state:

```bash
cat .workflow/state.json 2>/dev/null
```

**If state exists and is not completed**: Resume from `currentStage`. Show the dashboard and ask the user whether to continue or restart.

**If no state exists**: Initialize a new workflow:

1. Generate a short ID: `workflow-$(date +%s | tail -c 5)`
2. Create a bead for the workflow if one doesn't exist
3. Create or confirm the feature branch (per AGENTS.md branch rules)
4. Write the initial state file (see State Schema below)
5. Begin at Stage 1: Ideation

## State Schema

Write to `.workflow/state.json`:

```json
{
  "id": "workflow-<short-id>",
  "title": "<feature name from $ARGUMENTS>",
  "branch": "<type>/<branch-name>",
  "beadId": "<bead-id>",
  "startedAt": "<ISO timestamp>",
  "updatedAt": "<ISO timestamp>",
  "currentStage": "ideation",
  "stages": {
    "ideation": { "status": "pending", "completedAt": null, "notes": "" },
    "dev-docs": { "status": "pending", "artifacts": { "spec": null, "adr": null } },
    "planning": { "status": "pending", "artifacts": { "plan": null } },
    "implementation": { "status": "pending", "artifacts": { "summaries": [], "issues": [] } },
    "review": { "status": "pending", "artifacts": { "findings": [] } },
    "revision": { "status": "pending", "iterations": 0, "maxIterations": 3 },
    "compound": { "status": "pending", "artifacts": { "solution": null } },
    "reflection": { "status": "pending" }
  }
}
```

## Stage Execution Protocol

For each stage:

1. **Update state**: Set `currentStage` and stage status to `"in_progress"`, update `updatedAt`
2. **Show dashboard** (see Dashboard section below)
3. **Dispatch**: Invoke the stage skill/command
4. **Check gate**: Verify the gate conditions for the current stage
5. **Record artifacts**: Update the stage's `artifacts` in state with file paths
6. **Advance**: Set stage status to `"completed"` with `completedAt`, move `currentStage` to next stage
7. **Loop**: Return to step 1 for the next stage

### Gate Enforcement

If a gate condition is not met after the stage skill returns:

- Tell the user which gate conditions failed and why
- Ask whether to retry the stage or skip (with acknowledgment of risk)
- Do NOT silently advance past a failed gate

### Stage Transitions with Special Logic

**Stage 4 → 5 (Implementation → Review)**: Before dispatching review, run the between-stage check:
```bash
git fetch origin && git log origin/main --oneline -5
```
If `main` has advanced, classify the conflict (no overlap / mechanical / semantic) before proceeding.

**Stage 5 → 6 (Review → Revision)**: Only enter Revision if review found issues. If review is clean, skip directly to Stage 7 (Compound).

**Stage 6 → 5 (Revision loop)**: Revision dispatches back to Review. This loop continues until review passes or `maxIterations` (3) is reached.

## Sub-Agent Structured Output Format

When dispatching implementation sub-agents (Stage 4), each must return its summary in this format. Persist each summary to disk immediately upon receipt:

```markdown
## Sub-Agent Work Summary

### Task
- Bead: beads-XXX
- Branch: <current branch>
- Spec: specs/<spec-file>.md
- ADR: .adr/staging/<adr-file>.md (if applicable)

### Changes
- Files modified: [list with paths]
- Files created: [list with paths]
- Files deleted: [list with paths]
- Lines: +N / -N

### Claims
Specific, testable statements about what the implementation does.
Review sub-agents verify these claims rather than reading all the code.

1. "[Function/module X] handles [case Y] by [doing Z]"
   - Verifiable by: [test name or command]
2. "[Component A] now [behaves in way B] when [condition C]"
   - Verifiable by: [test name or command]

### Hypothesis Alignment
For each ADR hypothesis that this unit of work touches:

- H1 "[hypothesis text]": [SUPPORTS | REFUTES | NO EVIDENCE] -- [brief evidence]
- H2 "...": ...

### Tests
- Tests written: N
- Tests passing: N/N
- Commands: `[exact test command to reproduce]`
- Coverage: [files/functions covered by tests]

### Known Gaps
- [anything not completed, deferred, or uncertain]
- [any divergence from spec with justification]

### Accepted ADR Conflicts
- [any previously accepted ADR whose reasoning is contradicted or undermined by this work]
- [leave empty if none found]

### Risks
- [anything that could break other parts of the system]
- [any assumptions made that should be verified]
```

Save summaries to: `.adr/staging/<NNN>-<name>-summary-<bead-id>.md`

## Operational Rules

1. **1 bead = 1 sub-agent = 1 commit**: Each sub-agent's unit of work is exactly one commit, made after review validates the work — not during implementation.
2. **Summaries to disk**: Persist sub-agent summaries immediately. Without this, orchestrator crashes lose all work.
3. **Orchestrators delegate**: You do NOT read implementation code or write production code. You dispatch sub-agents and validate their summaries.
4. **Atomic commits**: The commit includes both code changes AND any spec updates in the same commit.
5. **Conventional commits**: All commits follow `<type>[scope]: <description>` format.

## Dashboard

After each stage transition, render this dashboard:

```
WORKFLOW: <title>
Branch: <branch> | Bead: <beadId>
Started: <startedAt>

Stage                 Status        Artifacts
-------               ------        ---------
1. Ideation           [status]      [notes excerpt]
2. Dev-Time Docs      [status]      spec: [path], adr: [path]
3. Planning           [status]      plan: [path]
4. Implementation     [status]      summaries: N, issues: N
5. Review             [status]      findings: N
6. Revision           [status]      iterations: N/3
7. Compound           [status]      [solution path]
8. Reflection         [status]

Current: Stage N - <stage name>
Next action: <what to do next>
```

Status symbols: `[ ]` pending, `[~]` in_progress, `[x]` completed, `[-]` skipped

## Completion

When Stage 8 (Reflection) completes:
1. Set all stage statuses to reflect final state
2. Update `updatedAt`
3. Report the final dashboard
4. The state file remains for archaeological reference but is gitignored

## Error Recovery

If you are resuming a workflow after a crash or context loss:
1. Read `.workflow/state.json` to determine where you were
2. Check for persisted summaries: `ls .adr/staging/*-summary-*.md`
3. Check working tree: `git status`
4. Determine which recovery case applies (see WMD incident response) and resume accordingly

## Reference

The rationale, failure modes, and detailed process descriptions that inform this workflow are documented in `docs/WORKFLOW-MASTER-DESCRIPTION.md`. Consult it when you need to understand WHY a rule exists, not just WHAT the rule is.
