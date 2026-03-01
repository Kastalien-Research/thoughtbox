---
name: workflows-work
description: Execute the implementation plan by dispatching sub-agents for each task. Stage 4 of the development workflow.
argument-hint: [plan path or task selection]
user-invocable: true
---

Execute the implementation plan: $ARGUMENTS

## Purpose

You are executing Stage 4 (Implementation) of the development workflow. A plan exists from Stage 3 with decomposed tasks. Your job is to dispatch sub-agents for each task, collect their structured summaries, and persist everything to disk.

## Pre-Conditions

Before starting, verify:
1. `.workflow/state.json` exists and `currentStage` is `"implementation"`
2. Plan file exists (check `stages.planning.artifacts.plan` in state, usually `.workflow/plan.md`)
3. Beads exist for each task (created during planning)

If pre-conditions are not met, report what's missing and halt.

## Process

### Step 1: Read the Plan

Read `.workflow/plan.md` and the spec/ADR it references. Build the task execution order from the dependency graph.

### Step 2: Dispatch Sub-Agents

For each task in dependency order:

1. **Update the task's bead** to `in_progress`:
   ```bash
   bd update <bead-id> --status=in_progress
   ```

2. **Dispatch a sub-agent** (use the Agent tool with `subagent_type: "general-purpose"`) with:
   - The task definition from the plan (files, acceptance criteria, notes)
   - The relevant spec sections
   - The ADR hypotheses this task should support/test
   - Instructions to return the structured summary format (see below)

3. **Parallelize independent tasks**: If tasks have no dependency between them, dispatch their sub-agents concurrently using parallel Agent tool calls.

4. **Persist the summary** immediately upon receipt:
   ```
   .adr/staging/<NNN>-<name>-summary-<bead-id>.md
   ```

5. **Verify acceptance criteria**: Check each criterion from the plan against the sub-agent's summary. If any fail, note them for review.

### Sub-Agent Summary Format

Each sub-agent MUST return this format:

```markdown
## Sub-Agent Work Summary

### Task
- Bead: <bead-id>
- Branch: <current branch>
- Spec: <spec path>

### Changes
- Files modified: [list]
- Files created: [list]
- Lines: +N / -N

### Claims
1. "[specific testable claim]"
   - Verifiable by: [test or command]

### Hypothesis Alignment
- H1 "<text>": SUPPORTS / REFUTES / NO EVIDENCE -- [evidence]

### Tests
- Tests written: N
- Tests passing: N/N
- Commands: `[exact command]`

### Known Gaps
- [anything deferred or uncertain]

### Risks
- [anything that could break other parts]
```

### Step 3: Run Tests

After all sub-agents complete, run the full test suite:

```bash
npm test
```

If tests fail, note which tasks' changes caused the failure.

### Step 4: Verify Completeness

Check off each task from the plan:
- All acceptance criteria met?
- All summaries persisted to disk?
- All beads updated?
- Tests passing?

### Step 5: Record and Handoff

1. **Update workflow state** (`.workflow/state.json`):
   - Set `stages.implementation.status` to `"completed"`
   - Set `stages.implementation.completedAt` to current ISO timestamp
   - Set `stages.implementation.artifacts.summaries` to list of summary file paths
   - Set `stages.implementation.artifacts.issues` to list of bead IDs
   - Set `currentStage` to `"review"`
   - Update `updatedAt`

2. **Present the handoff**:
   ```
   IMPLEMENTATION COMPLETE
   ========================

   Tasks completed: N/N
   Summaries: [list of paths]
   Tests: N passing, N failing

   Next: Stage 5 - Review (/workflows-review)
   ```

## Operational Rules

1. **1 bead = 1 sub-agent = 1 commit**: Each sub-agent works on exactly one task. Commits happen AFTER review (Stage 5), not during implementation.
2. **Summaries to disk immediately**: If the orchestrator crashes, summaries on disk survive. This is your recovery mechanism.
3. **Do NOT commit during implementation**: Code changes remain uncommitted until review validates them.
4. **Do NOT implement tasks yourself**: Always dispatch sub-agents. Protect your context window.

## Anti-Patterns

- Do NOT start implementing without reading the plan first
- Do NOT skip persisting summaries — this is the crash recovery mechanism
- Do NOT commit code during implementation — commits come after review
- Do NOT dispatch a sub-agent without its task definition and spec context
- Do NOT ignore test failures — note them for review even if individual tasks pass
