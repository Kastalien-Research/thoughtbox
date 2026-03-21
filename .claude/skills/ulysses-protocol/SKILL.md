---
name: ulysses-protocol
description: A surprise-gated debugging protocol for autonomous agents engaged in long-horizon or indeterminate tasks. Use this when facing a complex bug where the path to resolution is unclear and requires rigorous hypothesis testing and state management.
argument-hint: <init|plan|outcome|reflect|status> [args]
user-invocable: true
allowed-tools: Bash, Read, Glob, Grep, Write, mcp__thoughtbox__thoughtbox_gateway
---

# Ulysses Protocol

Structured framework for autonomous debugging that prevents hallucinated progress and model debt. Forces pre-committed recovery actions, rigorous surprise assessment, and falsifiable hypotheses.

**Dual-state architecture**: Local state machine (`scripts/ulysses.sh`) for fast transitions + Thoughtbox session for durable reasoning trace.

## Commands

Parse the first word of $ARGUMENTS to determine the command:

### `init` — Start a protocol session

1. Initialize local state:
   ```bash
   bash .claude/skills/ulysses-protocol/scripts/ulysses.sh init
   ```
2. Start a Thoughtbox session for the debugging trace:
   ```
   thoughtbox_gateway { operation: "start_new", args: { task: "ulysses-debug", aspect: "protocol-session" } }
   thoughtbox_gateway { operation: "cipher" }
   ```
3. Record initial context snapshot:
   ```
   thoughtbox_gateway { operation: "thought", args: {
     thought: "<describe the bug/problem being debugged>",
     nextThoughtNeeded: true,
     thoughtType: "context_snapshot",
     contextData: { toolsAvailable: [...], constraints: [...] }
   }}
   ```
4. Report: "Ulysses Protocol initialized. S=0 (PLAN). Record your first plan."

### `plan` — Record primary + recovery steps (S=0 or S=1)

Parse remaining $ARGUMENTS for: `<primary step>` `<recovery step>` `[--irreversible]`

1. Record locally:
   ```bash
   bash .claude/skills/ulysses-protocol/scripts/ulysses.sh plan "<primary>" "<recovery>" [--irreversible]
   ```
2. Record as a decision_frame thought in Thoughtbox:
   ```
   thoughtbox_gateway { operation: "thought", args: {
     thought: "PLAN: <primary step description>",
     nextThoughtNeeded: true,
     thoughtType: "decision_frame",
     confidence: "medium",
     options: [
       { label: "<primary step>", selected: true, reason: "Highest expected information gain" },
       { label: "<recovery step>", selected: false, reason: "Pre-committed recovery if primary surprises" }
     ]
   }}
   ```
3. If `--irreversible`: record rollback info as a belief_snapshot before proceeding.

### `outcome` — Assess step result

Parse: `<expected|unexpected-favorable|unexpected-unfavorable>` `[--severity 1|2]` `[--details "..."]`

1. Record locally:
   ```bash
   bash .claude/skills/ulysses-protocol/scripts/ulysses.sh outcome <assessment> [--severity N] [--details "..."]
   ```
2. Record as action_report in Thoughtbox:
   ```
   thoughtbox_gateway { operation: "thought", args: {
     thought: "OUTCOME: <assessment>. <details>",
     nextThoughtNeeded: true,
     thoughtType: "action_report",
     actionResult: {
       success: <true if expected>,
       reversible: "<yes|no|partial>",
       tool: "<what tool/action was used>",
       target: "<what was acted on>",
       sideEffects: [<any observed side effects>]
     }
   }}
   ```
3. On state transition:
   - **S=0 (checkpoint)**: Record belief_snapshot with current known-good state
   - **S=1 (recovery)**: Remind agent to execute pre-committed recovery step
   - **S=2 (reflect)**: Print "REFLECT required. Run `/ulysses-protocol reflect`"

### `reflect` — Form hypothesis with falsification criteria (S=2)

Parse: `<hypothesis statement>` `<falsification criteria>`

1. Record locally:
   ```bash
   bash .claude/skills/ulysses-protocol/scripts/ulysses.sh reflect "<hypothesis>" "<falsification>"
   ```
2. Record as assumption_update in Thoughtbox:
   ```
   thoughtbox_gateway { operation: "thought", args: {
     thought: "HYPOTHESIS: <statement>\nFALSIFICATION: <criteria>",
     nextThoughtNeeded: true,
     thoughtType: "assumption_update",
     assumptionChange: {
       text: "<hypothesis statement>",
       oldStatus: "uncertain",
       newStatus: "believed",
       trigger: "<surprise that triggered reflection>"
     }
   }}
   ```
3. Check hypothesis count: if 3 consecutive hypotheses pruned, evaluate INSUFFICIENT_INFORMATION terminal state.
4. Report: "S reset to 0. Hypothesis recorded. Ready for next PLAN."

### `status` — Show current protocol state

1. Read local state:
   ```bash
   bash .claude/skills/ulysses-protocol/scripts/ulysses.sh status
   ```
2. Read Thoughtbox session structure:
   ```
   thoughtbox_gateway { operation: "get_structure" }
   ```
3. Display combined status: phase, active step, checkpoint, surprise register, hypothesis chain.

## thoughtType Mapping

| Protocol Event | thoughtType | Why |
|---------------|-------------|-----|
| Initial context | `context_snapshot` | Records tools, constraints, environment |
| Plan (primary + recovery) | `decision_frame` | Structured choice with options |
| Outcome assessment | `action_report` | Records success/failure, reversibility, side effects |
| Checkpoint (good state) | `belief_snapshot` | Captures known-good system state |
| Hypothesis formation | `assumption_update` | Tracks belief transitions with triggers |
| State transition | `progress` | Lightweight status update |
| Hypothesis pruning | `assumption_update` | `newStatus: "refuted"` with downstream refs |

## Protocol Invariants (enforced by hooks)

1. **No action without recovery**: Never execute a step without first recording a pre-committed recovery step.
2. **Falsifiable hypotheses**: All hypotheses during REFLECT must have concrete, observable falsification criteria.
3. **Comparative surprise**: Assess surprise severity by comparing to previous surprises in the session register.
4. **Rollback irreversible steps**: If an irreversible step produces a surprise, rollback MUST be attempted during REFLECT.

## Candidate Slash Commands

| Command | Purpose | When |
|---------|---------|------|
| `/ulysses-protocol init` | Start protocol session | Beginning of debugging task |
| `/ulysses-protocol plan` | Record primary + recovery | Before every action |
| `/ulysses-protocol outcome` | Assess what happened | After every action |
| `/ulysses-protocol reflect` | Form hypothesis | When S=2 |
| `/ulysses-protocol status` | Show state | Any time |

## Candidate Hooks

These enforce the protocol invariants automatically:

| Event | Hook | Invariant Enforced |
|-------|------|--------------------|
| `PreToolUse:Bash` | **Plan gate**: If `.ulysses/session.json` exists and `active_step` is null and S != 2, warn "No plan recorded. Run `/ulysses-protocol plan` before acting." | #1: No action without recovery |
| `PostToolUse:Bash` | **Outcome prompt**: If `.ulysses/session.json` exists and `active_step` is not null, remind "Assess outcome: `/ulysses-protocol outcome <expected\|unexpected-unfavorable>`" | Ensures no outcome goes unassessed |
| `PreToolUse:Bash` | **Reflect gate**: If S=2, block action and say "REFLECT required before further action. Run `/ulysses-protocol reflect`" | #3: S never exceeds 2 without reflection |
| `PreToolUse:Write` | **Reversibility check**: If `.ulysses/session.json` exists, warn "File write is irreversible. Ensure rollback info is in the plan." | #4: Irreversible steps need rollback info |
| `SessionEnd` | **Session reflection**: If `.ulysses/session.json` exists, generate session reflection (step graph, surprise history, hypothesis genealogy) and record as final Thoughtbox thoughts | Terminal state reporting |

## Workflow Integration

### Standalone debugging
```
/ulysses-protocol init "Container won't start on port 1731"
→ [plan] → [act] → [outcome] → repeat until RESOLVED or INSUFFICIENT_INFORMATION
```

### With agent teams (Hub)
```
thoughtbox_hub { operation: "quick_join", args: { name: "Debugger", workspaceId: "...", profile: "DEBUGGER" } }
/ulysses-protocol init "..."
→ Post plans and outcomes to hub channel for team visibility
→ Hypotheses become hub proposals for team review
```

### Terminal states
- **RESOLVED**: Close with session reflection. Record transferable priors as knowledge entities.
- **INSUFFICIENT_INFORMATION**: Articulate what's missing. Create beads issue for the gap.
- **ENVIRONMENT_COMPROMISED**: Flag environment state. Rollback attempt log in session.

## Resource Reference

- **Full specification**: `references/protocol-spec.md` — deep theoretical background (§1-11)
- **State script**: `scripts/ulysses.sh` — local state machine and register history
- **Thoughtbox session**: Durable reasoning trace with structured thought types
