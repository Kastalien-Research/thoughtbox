---
name: theseus-protocol
description: Thoughtbox-first Theseus workflow for behavior-preserving refactors. Use this when structure changes but behavior must stay fixed and scope drift needs hard boundaries.
argument-hint: <init|visa|checkpoint|outcome|status|complete> [args]
user-invocable: true
allowed-tools: Read, Glob, Grep, Task, Agent, mcp__thoughtbox__thoughtbox_gateway, mcp__thoughtbox__thoughtbox_theseus
---

# Theseus Protocol

Theseus is a Thoughtbox-owned refactoring protocol.

`thoughtbox_theseus` owns scope, visa state, audit state, and terminal status.
Claude Code hooks only ask Thoughtbox whether a write should be blocked.

Do not use `.theseus/` files or `scripts/theseus.sh` as authoritative state.
Do not rely on implicit `git reset --hard` recovery in the active workflow.

## Runtime Contract

1. Protocol entry is explicit-only in v1.
2. Before the first protocol tool call, ensure Thoughtbox session context exists:
   - `thoughtbox_gateway { operation: "start_new", args: { task: "<refactor task>", aspect: "theseus-protocol" } }`
   - `thoughtbox_gateway { operation: "cipher" }`
3. Then call `thoughtbox_theseus` for every protocol transition.
4. Hooks consult Thoughtbox before mutating file operations.
5. Hooks do not spawn agents or mutate protocol state.
6. Helper agents may audit or gather evidence, but only the coordinator calls `thoughtbox_theseus`.

## Commands

### `init`

Required inputs:
- Declared scope
- Optional refactor description

Call:
```json
thoughtbox_theseus {
  "operation": "init",
  "scope": ["src/module-a.ts", "src/module-b/"],
  "description": "<refactor goal>"
}
```

After `init`, test files are write-locked and out-of-scope writes require a visa.

### `visa`

Required inputs:
- Out-of-scope file path
- Justification

Call:
```json
thoughtbox_theseus {
  "operation": "visa",
  "filePath": "src/dependency.ts",
  "justification": "<why the scope must expand>",
  "antiPatternAcknowledged": true
}
```

This is the only supported way to expand scope in the active workflow.

### `checkpoint`

Required inputs:
- Diff hash or equivalent checkpoint identity
- Atomic narrative
- Cassandra verdict

Call:
```json
thoughtbox_theseus {
  "operation": "checkpoint",
  "diffHash": "<diff hash>",
  "commitMessage": "<atomic narrative>",
  "approved": true,
  "feedback": "<optional audit rationale>"
}
```

Before `checkpoint`, you may optionally run a reviewer or judge agent to produce the Cassandra-style audit. That agent returns only a verdict and rationale. The coordinator records the outcome with `thoughtbox_theseus`.

### `outcome`

Required inputs:
- Whether validation passed
- Optional details

Call:
```json
thoughtbox_theseus {
  "operation": "outcome",
  "testsPassed": false,
  "details": "<what failed>"
}
```

The protocol records whether the refactor remains in a valid state. Recovery requirements are described by protocol state, not hidden local git resets.

### `status`

Call:
```json
thoughtbox_theseus {
  "operation": "status"
}
```

Use the returned state as the only source of truth for scope, visas, and audit history.

### `complete`

Call:
```json
thoughtbox_theseus {
  "operation": "complete",
  "terminalState": "complete",
  "summary": "<what structural yield was achieved>"
}
```

Completion should yield protocol closure plus reusable knowledge about successes, audit failures, or scope exhaustion.

## Invariants

1. Scope is explicit and server-owned.
2. Test files are never modified during the refactor.
3. Out-of-scope writes require a visa.
4. Checkpoints are explicit and auditable.
5. Audit evidence may come from helper agents, but state transitions belong to the coordinator.
6. Knowledge capture includes failures, not just successful refactors.

## Subagent Use

Use subagents only at explicit checkpoint phases.

Good uses:
- Cassandra-style audit before `checkpoint`
- Independent diff review for premature abstraction
- Focused evidence gathering around a requested visa

Bad uses:
- Hook-triggered subagents
- Letting a helper agent call `thoughtbox_theseus`
- Treating git rollback behavior as the protocol itself

## References

- Authoritative MCP tool: `thoughtbox_theseus`
- Durable context and thought trace: `thoughtbox_gateway`
- Protocol implementation: `src/protocol/theseus-tool.ts`
- Enforcement design reference: `references/theseus-gate.md`
