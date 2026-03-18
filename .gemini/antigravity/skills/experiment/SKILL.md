---
name: experiment
description: Run parallel experiments across git worktrees. Define competing approaches to the same problem, dispatch sub-agents to implement each in isolation, then compare results. Use when you have 2-5 alternatives and want to test all of them before committing to one.
argument-hint: [source document or description of alternatives to test]
user-invocable: true
---

Run a parallel experiment: $ARGUMENTS

## Purpose

Test multiple competing approaches to the same problem simultaneously. Each approach gets its own git worktree and sub-agent. Results are compared at the end so the best approach can be merged.

This is NOT for parallelizing parts of one plan (use `/workflows-work` for that). This is for when you genuinely don't know which approach is best and want to try all of them.

## Process

### Phase 1: Define Tracks (orchestrator does this)

Parse the input (a gap analysis, a list of alternatives, a brainstorm, or a user description) and produce a track list:

```
TRACK DEFINITION
================
Base branch: <current branch or specified base>

Track A: <name>
  Branch: exp/<slug-a>
  Approach: <1-2 sentence description>
  Files touched: <predicted file list>
  Effort: low | medium | high

Track B: <name>
  Branch: exp/<slug-b>
  ...

[up to 5 tracks]
```

**Conflict check**: If two tracks modify the same files in incompatible ways, flag this to the user before proceeding. Parallel experiments must be independent.

Present the track list to the user and wait for confirmation before proceeding.

### Phase 2: Create Worktrees

For each track, create a worktree branching from the base:

```bash
# From the repo root
git worktree add ../<repo-name>-exp-<slug> -b exp/<slug>
```

Worktree naming convention: `../<repo-name>-exp-<slug>` (sibling to the main repo directory).

Verify all worktrees were created:
```bash
git worktree list
```

### Phase 3: Dispatch Sub-Agents (parallel)

Dispatch one sub-agent per track using the Agent tool. All independent tracks run in parallel.

Each sub-agent receives:

1. **Working directory**: The worktree path (CRITICAL — sub-agent must `cd` here)
2. **Track definition**: What to implement and why
3. **Source context**: Relevant file contents from the base branch (read before dispatching)
4. **Acceptance criteria**: What "done" looks like for this track
5. **Instructions**:
   - Work ONLY in your assigned worktree directory
   - Write tests for your changes
   - Run tests and report results
   - Commit your work to the worktree's branch
   - Return the structured summary (see format below)

### Sub-Agent Prompt Template

```
You are implementing Track [X]: [name]

WORKING DIRECTORY: [worktree path]
BRANCH: exp/[slug]

## What to implement
[approach description]

## Files to modify
[file list with current contents provided inline]

## Acceptance criteria
[specific, testable criteria]

## Rules
1. Work ONLY in [worktree path] — never touch the main repo
2. Write tests first, then implement
3. Run tests: [test command]
4. Commit when tests pass:
   git add [files]
   git commit -m "exp([slug]): [description]"
5. Return the structured summary below

## Return Format
[see Sub-Agent Summary Format]
```

### Sub-Agent Summary Format

Each sub-agent MUST return:

```markdown
## Experiment Track: [name]

### Result
- Branch: exp/[slug]
- Status: COMPLETE | PARTIAL | FAILED
- Tests: N passing, N failing

### What was built
[2-3 sentences describing the implementation]

### What works well
[Strengths of this approach]

### What doesn't work well
[Weaknesses, rough edges, things that felt wrong]

### Demo readiness
[How well does this serve the original use case?]
Score: 1-5 (1=unusable, 5=demo-ready)

### Files changed
[list with +/- line counts]
```

### Phase 4: Compare Results

After all sub-agents complete, produce a comparison:

```
EXPERIMENT RESULTS
==================
Question: [original problem being solved]
Base branch: [base]
Tracks tested: [N]

| Criterion        | Track A          | Track B          | Track C          |
|------------------|------------------|------------------|------------------|
| Tests passing    | Y/N              | Y/N              | Y/N              |
| Demo readiness   | [score]/5        | [score]/5        | [score]/5        |
| Code changes     | +N/-N lines      | +N/-N lines      | +N/-N lines      |
| Complexity added  | low/med/high     | low/med/high     | low/med/high     |
| Strengths        | [key strength]   | [key strength]   | [key strength]   |
| Weaknesses       | [key weakness]   | [key weakness]   | [key weakness]   |

RECOMMENDATION: Track [X] because [reason]

NEXT STEPS:
- To adopt Track X: git merge exp/<slug> into <base branch>
- To clean up: git worktree remove ../<repo>-exp-<slug> (for each)
- To inspect: cd ../<repo>-exp-<slug> && git log --oneline
```

Present the comparison and recommendation. Do NOT merge or clean up worktrees — let the user decide.

### Phase 5: Cleanup (only on user request)

When the user picks a winner:

```bash
# Merge the winner
git merge exp/<winning-slug>

# Remove all experiment worktrees
git worktree remove ../<repo>-exp-<slug-a>
git worktree remove ../<repo>-exp-<slug-b>
git worktree remove ../<repo>-exp-<slug-c>

# Delete experiment branches
git branch -d exp/<slug-a> exp/<slug-b> exp/<slug-c>
```

## Operational Rules

1. **Orchestrator never implements**: You dispatch sub-agents. You read source files to provide context. You do NOT write code yourself.
2. **Worktrees are siblings**: Always create worktrees as siblings to the repo (`../`), never inside it.
3. **Confirm before creating**: Present the track list and get user approval before creating worktrees.
4. **Independent tracks only**: If tracks would conflict on the same files, split differently or run sequentially.
5. **No premature merging**: Present results and let the user choose. The user may want to inspect, combine, or discard.
6. **Clean branch names**: Always use `exp/` prefix for experiment branches. Never timestamps or UUIDs.

## Anti-Patterns

- Do NOT create more than 5 tracks — if there are more alternatives, group them
- Do NOT run experiments for trivial choices (if one option is obviously better, just do it)
- Do NOT let sub-agents work outside their assigned worktree
- Do NOT merge without user approval
- Do NOT leave worktrees around after the experiment concludes — remind the user to clean up
