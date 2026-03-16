---
name: workflow-tournament
description: Execute an implementation by dispatching multiple sub-agents to parallel Git worktrees. Each builds the entire feature independently, and the best implementation is selected and merged.
argument-hint: [number of agents/worktrees]
user-invocable: true
---

Execute a tournament-style parallel implementation: $ARGUMENTS

## Purpose

You are executing a parallelized "tournament" implementation workflow. Instead of decomposing a feature into smaller tasks for individual agents, you will create multiple isolated Git worktrees. You will dispatch one sub-agent to each worktree to build the *entire* feature independently. Once all sub-agents finish, you will review their implementations, select the best one along with the user, and merge it back into the primary feature branch.

This approach maximizes exploration of different implementation strategies and keeps the canonical codebase cleanly isolated until a winner is chosen.

## Pre-Conditions

Before starting, verify:
1. You are on a tracked feature branch (e.g., `feat/X` or `fix/Y`).
2. The working directory is clean (`git status`).
3. You know how many parallel worktrees to create (default to 5 if not specified in $ARGUMENTS, max 10).

## Process

### Step 1: Setup Parallel Worktrees

For each of the N sub-agents (e.g., from `1` to `N`):
1. **Create a unique branch** for the sub-agent based on the current feature branch:
   ```bash
   git branch <current-branch>-agent-<N>
   ```
2. **Add a Git worktree** inside a `.worktrees/` directory (ensure `.worktrees` is in `.gitignore`):
   ```bash
   mkdir -p .worktrees
   git worktree add .worktrees/agent-<N> <current-branch>-agent-<N>
   ```
3. **Initialize the workspace**: Navigate into the worktree and install dependencies:
   ```bash
   cd .worktrees/agent-<N>
   pnpm install
   # Copy any necessary environment files (e.g., cp ../../.env ./)
   ```

### Step 2: Dispatch Sub-Agents

Dispatch a sub-agent to each initialized worktree concurrently.

For each sub-agent:
1. **Provide context**: Give them the complete specification/ADR for the feature they need to build.
2. **Set the working directory**: Ensure the sub-agent operates *strictly* within its assigned worktree (`.worktrees/agent-<N>`).
3. **Set the objective**: Instruct the sub-agent to implement the *entire* feature, ensuring all tests pass within their worktree.
4. **Define output**: Require a structured summary of their implementation approach, trade-offs made, and test results.

### Step 3: Await and Collect

Wait for all sub-agents to complete their implementations. If a sub-agent fails or times out, note the failure but do not halt the overall process. 

Collect the summaries, the final `git log`, and `git diff` from each worktree. Ensure each sub-agent commits their work to their respective `<current-branch>-agent-<N>` branch.

### Step 4: Deterministic Evaluation (Binary Gates)

Before evaluating the elegance or architecture of any implementation, apply a strict first-pass deterministic filter. This should filter out ~80% of the unviable options automatically.

For each sub-agent's worktree, determine if they pass the following binary gates:
1. **Tests**: Do `pnpm test` (or the project's test command) pass entirely?
2. **Build**: Does the project build successfully (`pnpm run build`)?
3. **Typecheck**: Do the TypeScript types compile cleanly (`pnpm run typecheck` or equivalent)?
4. **Linter**: Does the linter pass without errors?

**Disqualify any sub-agent that fails these deterministic gates.** Only implementations that pass the objective binary gates are allowed to move on to the final subjective review.

### Step 5: Review and Selection ("Best Of")

Review the implementations from the remaining *successful* sub-agents. Evaluate them based on:
1. **Code Quality**: Is the code clean, readable, and idiomatic?
2. **Simplicity/Elegance**: Which implementation adds the least unnecessary complexity?
3. **Performance/Security**: Are there any obvious flaws in the chosen approach?

**CRITICAL RULE: The human is the final decider by default.** 
While you must present your analysis and recommend a winner based on the criteria above, you **MUST NOT** merge any branch until the human explicitly reviews the options and approves a winner.

1. Present a clear summary of each agent's approach to the user.
2. Recommend the best option.
3. **Wait for user confirmation.**

### Step 6: Merge and Cleanup

1. **Merge the winner**: Merge the winning sub-agent's branch into the primary feature branch.
   ```bash
   git merge <current-branch>-agent-<WINNER_N>
   ```
2. **Resolve any conflicts** (though there shouldn't be any if the primary branch hasn't moved).
3. **Run quality gates**: Run the full test suite and linters on the merged canonical codebase to ensure stability.
4. **Clean up worktrees**: Remove all the temporary git worktrees and delete the sub-agent branches.
   ```bash
   git worktree remove .worktrees/agent-* --force
   git branch -D <current-branch>-agent-1 ...
   ```

## Output Format

Present your final summary to the user:

```markdown
## Tournament Implementation Complete

### Selected Winner: Agent <N>
- **Reasoning**: [Why this implementation was chosen over the others]

### Participants
- Agent 1: [Status/Brief Summary]
- Agent 2: [Status/Brief Summary]
...

### Next Steps
- The winning code has been merged into `<current-branch>`.
- Worktrees have been cleaned up.
- Ready for final review and push.
```
