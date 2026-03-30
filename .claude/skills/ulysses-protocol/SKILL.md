---
name: ulysses-protocol
description: Thoughtbox-first Ulysses workflow for surprise-gated debugging. Use this when debugging gets uncertain and you need explicit plan, outcome, and reflection discipline without relying on local shell state.
argument-hint: <init|plan|outcome|reflect|status|complete> [args]
user-invocable: true
allowed-tools: Read, Glob, Grep, Task, Agent, mcp__thoughtbox__thoughtbox_gateway, mcp__thoughtbox__thoughtbox_ulysses
---

# Ulysses Protocol

Ulysses is a Thoughtbox-owned debugging protocol.

The invariants live in `thoughtbox_ulysses`.
The durable trace lives in Thoughtbox thoughts and knowledge.
Claude Code hooks only enforce the current server state.

Do not use `.ulysses/` files or `scripts/ulysses.sh` as authoritative state.

## Runtime Contract

1. Protocol entry is explicit-only in v1.
2. Before the first protocol tool call, ensure Thoughtbox session context exists:
   - `thoughtbox_gateway { operation: "start_new", args: { task: "<debug task>", aspect: "ulysses-protocol" } }`
   - `thoughtbox_gateway { operation: "cipher" }`
3. Then call `thoughtbox_ulysses` for every protocol transition.
4. Hooks may block mutating work when the server reports `S=2`; read-only inspection remains allowed.
5. Helper agents may gather evidence after `reflect`, but only the coordinator calls `thoughtbox_ulysses`.

## Commands

### `init`

Required inputs:
- Problem statement
- Optional constraints

Call:
```json
thoughtbox_ulysses {
  "operation": "init",
  "problem": "<problem>",
  "constraints": ["<optional constraint>"]
}
```

Then record a structured Thoughtbox thought summarizing the debugging context.

### `plan`

Required inputs:
- Primary action
- Recovery action
- Optional `irreversible`

Call:
```json
thoughtbox_ulysses {
  "operation": "plan",
  "primary": "<primary action>",
  "recovery": "<recovery action>",
  "irreversible": false
}
```

Do not act before `plan` is recorded.

### `outcome`

Required inputs:
- `expected`, `unexpected-favorable`, or `unexpected-unfavorable`
- Optional severity/details

Call:
```json
thoughtbox_ulysses {
  "operation": "outcome",
  "assessment": "unexpected-unfavorable",
  "severity": 1,
  "details": "<what happened>"
}
```

If the returned state reaches `S=2`, stop mutating work and move to `reflect`.

### `reflect`

Required inputs:
- Falsifiable hypothesis
- Falsification criteria

Call:
```json
thoughtbox_ulysses {
  "operation": "reflect",
  "hypothesis": "<hypothesis>",
  "falsification": "<what would disprove it>"
}
```

After `reflect`, you may optionally launch debugger or researcher agents to test competing explanations. They return evidence only. The coordinator records the next `plan` or `outcome`.

### `status`

Call:
```json
thoughtbox_ulysses {
  "operation": "status"
}
```

Use the returned server state as the only source of truth.

### `complete`

Call:
```json
thoughtbox_ulysses {
  "operation": "complete",
  "terminalState": "resolved",
  "summary": "<transferable learning>"
}
```

Completion should yield both protocol closure and a reusable knowledge artifact in Thoughtbox.

## Invariants

1. No action without a recorded primary step and recovery step.
2. Surprises accumulate on the server, not in local files.
3. `reflect` is mandatory at `S=2`.
4. Hypotheses must be falsifiable.
5. Knowledge capture is part of completion, not an optional afterthought.

## Subagent Use

Use subagents only after `reflect` when more evidence would help.

Good uses:
- Reproduce a hypothesis independently
- Compare two candidate explanations
- Gather targeted code or log evidence

Bad uses:
- Letting a subagent call `thoughtbox_ulysses`
- Letting a hook spawn subagents automatically
- Treating subagents as owners of protocol state

## References

- Authoritative MCP tool: `thoughtbox_ulysses`
- Durable context and thought trace: `thoughtbox_gateway`
- Protocol implementation: `src/protocol/ulysses-tool.ts`
- Specification reference: `references/protocol-spec.md`
