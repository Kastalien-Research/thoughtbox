---
name: ulc-loop
description: Start a Unified Loop Controller session via Ralph Wiggum. Autonomously works through backlog, dispatches agents, and explores via QD when idle.
argument-hint: "[--budget N] [--max-iterations N]"
user-invocable: true
allowed-tools: Read, Bash, Write
---

# ULC Loop

Start an autonomous improvement loop powered by Ralph Wiggum.

## Setup

Parse arguments from: $ARGUMENTS

Defaults:
- `--budget`: 5 (USD)
- `--max-iterations`: 20

## Workflow

### Step 1: Pre-flight Checks

1. Verify Ralph Wiggum plugin is installed:
   ```bash
   ls .claude/plugins/cache/claude-code-plugins/ralph-wiggum/ 2>/dev/null || echo "NOT INSTALLED"
   ```
   If not installed, tell the user to run: `claude plugin install ralph-wiggum@claude-code-plugins`

2. Check for existing Ralph loop:
   ```bash
   cat .claude/ralph-loop.local.md 2>/dev/null && echo "ACTIVE" || echo "INACTIVE"
   ```
   If ACTIVE, warn: "A Ralph loop is already running. Run `/cancel-ralph` first."

3. Check git state is clean:
   ```bash
   git status --porcelain
   ```
   If dirty, warn and suggest committing first.

### Step 2: Read the ULC Prompt

Read the ULC decision procedure from `.claude/skills/ulc-loop/ulc-prompt.md`.

### Step 3: Initialize ULC State

Create the initial ULC state file if it doesn't exist:

```bash
cat > .claude/ulc-state.local.json << 'EOF'
{
  "iteration": 0,
  "cumulative_cost_usd": 0,
  "budget_usd": <BUDGET>,
  "actions": [],
  "exploration_misses": 0,
  "started_at": "<ISO timestamp>"
}
EOF
```

Replace `<BUDGET>` with the parsed budget value.

### Step 4: Create Ralph State File

Write `.claude/ralph-loop.local.md` with YAML frontmatter and the ULC prompt as the body:

```
---
active: true
iteration: 1
max_iterations: <MAX_ITERATIONS>
completion_promise: "BUDGET EXHAUSTED OR ALL WORK COMPLETE"
started_at: "<ISO timestamp>"
---

<contents of ulc-prompt.md>
```

### Step 5: Confirm and Start

Output:
```
ULC Loop activated via Ralph Wiggum.

Budget: $<budget> USD
Max iterations: <max_iterations>
Completion promise: "BUDGET EXHAUSTED OR ALL WORK COMPLETE"

The loop will:
1. Check beads backlog for ready work
2. Dispatch sub-agents for substantial tasks
3. Explore via QD when backlog is empty
4. Stop when budget is exhausted or all work is complete

State file: .claude/ulc-state.local.json
Ralph state: .claude/ralph-loop.local.md

Starting first OODA cycle...
```

Then immediately begin executing the ULC prompt — perform the first OODA cycle (Observe → Orient → Decide → Act).

## Notes

- The ULC prompt is re-fed by Ralph's stop hook on each iteration
- Inter-iteration continuity is via `.claude/ulc-state.local.json` and git
- Sub-agents are dispatched via Task tool with `subagent_type: "general-purpose"`
- Cost tracking is approximate — the agent estimates based on model and turns
- The loop does NOT push to remote — human reviews and pushes
