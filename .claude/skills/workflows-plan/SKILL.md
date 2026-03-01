---
name: workflows-plan
description: Transform spec and ADR into an implementation plan with task decomposition and sub-agent assignment. Stage 3 of the development workflow.
argument-hint: [spec path or feature description]
user-invocable: true
---

Create an implementation plan for: $ARGUMENTS

## Purpose

You are executing Stage 3 (Planning) of the development workflow. The spec and ADR exist from Stage 2. Your job is to decompose the work into sub-agent-sized tasks, identify dependencies, and produce a plan file that Stage 4 can execute.

## Pre-Conditions

Before starting, verify:
1. `.workflow/state.json` exists and `currentStage` is `"planning"`
2. A spec exists (check `stages.dev-docs.artifacts.spec` in state)
3. An ADR exists in `.adr/staging/` (check `stages.dev-docs.artifacts.adr` in state)

If pre-conditions are not met, report what's missing and halt.

## Process

### Step 1: Gather Context

Read the spec and ADR from Stage 2, then investigate the codebase:

1. **Read the spec**: Understand what needs to be built
2. **Read the ADR**: Understand the hypotheses and constraints
3. **Map the affected code**: Use Glob/Grep to find files that will need changes
4. **Check for prior learnings**: Search agent memory and compound learnings for relevant patterns
5. **Check existing tests**: Identify test files that will need updates

### Step 2: Decompose into Tasks

Break the implementation into discrete, sub-agent-sized units of work. Each task must be:

- **Atomic**: One task = one logical change = one commit
- **Testable**: Each task has clear acceptance criteria
- **Ordered**: Dependencies between tasks are explicit

For each task, define:

```markdown
### Task N: <title>

**Files**: [list of files to create/modify]
**Depends on**: [task numbers, or "none"]
**Acceptance criteria**:
- [ ] [specific, verifiable condition]
- [ ] [specific, verifiable condition]

**Notes**: [implementation hints, gotchas from codebase investigation]
```

### Step 3: Identify Risks

For each task, flag:
- Files with high churn or complexity
- Areas where the spec's assumptions may not hold
- External dependencies or integration points
- Tests that may need significant rework

### Step 4: Write the Plan File

Write the plan to `.workflow/plan.md`:

```markdown
# Implementation Plan: <title>

**Workflow**: <id>
**Spec**: <spec path>
**ADR**: <adr path>
**Branch**: <branch>
**Created**: <ISO timestamp>

## Overview

[1-2 paragraph summary of what's being built and the approach]

## Task Breakdown

[Task definitions from Step 2]

## Dependency Graph

[Simple text diagram showing task ordering]

## Risks

[From Step 3]

## Estimated Scope

- Tasks: N
- Files affected: N
- New files: N
- Tests to write: N
```

### Step 5: Get User Approval

Present the plan summary and ask the user to approve:

```
PLAN READY FOR REVIEW
======================

<title>
Tasks: N | Files: N | Risks: N flagged

[task list with 1-line summaries]

Approve this plan? (The conductor will dispatch /workflows-work to execute it)
```

Wait for user approval before proceeding.

### Step 6: Record and Handoff

After user approves:

1. **Create beads** for each task:
   ```bash
   bd create --title="<task title>" --type=task --priority=2
   ```
   Set up dependencies between them:
   ```bash
   bd dep add <child-bead> <parent-bead>
   ```

2. **Update workflow state** (`.workflow/state.json`):
   - Set `stages.planning.status` to `"completed"`
   - Set `stages.planning.completedAt` to current ISO timestamp
   - Set `stages.planning.artifacts.plan` to `.workflow/plan.md`
   - Set `currentStage` to `"implementation"`
   - Update `updatedAt`

3. **Present the handoff**:
   ```
   PLANNING COMPLETE
   ==================

   Plan: .workflow/plan.md
   Tasks: N (beads created)
   Dependencies: [summary]

   Next: Stage 4 - Implementation (/workflows-work)
   ```

## Anti-Patterns

- Do NOT start implementing during planning — that's Stage 4's job
- Do NOT create tasks smaller than one meaningful commit
- Do NOT create tasks larger than one sub-agent can handle in a single session
- Do NOT skip codebase investigation — plans based on assumptions fail
- Do NOT ignore the ADR's hypotheses — the plan must be designed to test them
