---
name: loop-status
description: View the unified loop controller state — which loops are active, what phase they're in, recent cross-loop knowledge flow, and pending actions.
argument-hint: [optional: specific loop name]
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

Show loop controller status: $ARGUMENTS

## Workflow

### Phase 1: Gather Loop State (Observe)

Check each execution layer:

**Interactive Layer**:
1. Current session info from `.claude/state/` files
2. Recent session handoffs from `.sessions/handoff-*.json` (last 3)
3. Active beads: `bd list --status=in_progress`

**AgentOps (Daily) Layer**:
1. Check for recent AgentOps runs: look for `agentops/runs/` artifacts
2. Check GitHub issues created by AgentOps: `gh issue list --label=agentops --limit 5`
3. Check pending proposals awaiting approval

**SIL (Weekly) Layer**:
1. Read `dgm-specs/implementation-status.json` for spec implementation status
2. Check for recent SIL PRs: `gh pr list --label=self-improvement --limit 5`
3. Check `.dgm/fitness.json` for pattern evolution state

**Cross-Loop State**:
1. Read loop controller state from `.eval/loop-state.json` (if exists)
2. Check for pending cross-loop knowledge transfers

### Phase 2: Synthesize Status (Orient)

For each layer, determine:
- **Phase**: What stage of its OODA cycle is it in?
- **Health**: Is it running normally, stalled, or errored?
- **Output**: What has it produced recently?
- **Input needed**: What does it need from other layers?

### Phase 3: Present Status (Act)

```
## Loop Controller Status

### Interactive Layer (Fast Loop)
- Phase: {Observe|Orient|Decide|Act}
- Active session: {session_id or "none"}
- Recent handoffs: {N} in last 7 days
- Active beads: {N}
- Knowledge produced: {N} new patterns/observations

### AgentOps Layer (Daily Loop)
- Phase: {idle|discovering|proposing|implementing}
- Last run: {timestamp}
- Pending proposals: {N}
- Approved for implementation: {N}
- Health: {OK|STALE (no run in >48h)|ERROR}

### SIL Layer (Weekly Loop)
- Phase: {idle|discovery|filter|experiment|evaluate}
- Last cycle: {timestamp}
- Specs implemented: {N}/{total}
- Pending experiments: {N}
- Health: {OK|STALE (no cycle in >14d)|ERROR}

### Pattern Evolution (DGM)
- Total patterns: {N}
- HOT: {N} | WARM: {N} | COLD: {N}
- Last evolution: {timestamp}
- Niche grid coverage: {N}% ({filled}/{total} cells)

### Cross-Loop Flow
- Interactive → AgentOps: {N} learnings routed (last 7d)
- AgentOps → SIL: {N} proposals fed into SIL (last 7d)
- SIL → Interactive: {N} patterns promoted to MEMORY.md (last 7d)

### Attention Needed
- {actionable items that need human decision}
```

## Notes

- If a layer's state files don't exist, report as "Not yet initialized"
- Staleness thresholds: AgentOps >48h, SIL >14d, DGM evolution >30d
- Cross-loop flow tracking requires the unified loop controller (Phase 2)
- Until Phase 2, report available data and note what's not yet connected
