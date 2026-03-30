# SPEC: Thoughtbox-First Protocol Runtime Integration

**ADR**: `.adr/staging/ADR-016-thoughtbox-first-protocol-runtime-integration.md`
**Date**: 2026-03-29

## Summary

This spec moves Ulysses and Theseus to a Thoughtbox-first runtime model.

- `thoughtbox_ulysses` and `thoughtbox_theseus` remain the only authoritative protocol APIs.
- Claude-side skills become explicit invoke adapters that bootstrap Thoughtbox and call those APIs.
- Claude-side hooks become deterministic enforcement clients. They never own protocol state and never spawn subagents.
- Local development uses the Dockerized Thoughtbox HTTP server at `http://localhost:1731/mcp`. No new local Node daemons are introduced.

## Behavioral Contract

### Authority

- Thoughtbox owns protocol state, transitions, and enforcement truth.
- Local `.ulysses/` and `.theseus/` directories are not authoritative and must not drive protocol behavior.
- Local git checkpointing, reset, and rollback behaviors are not part of the canonical protocol runtime.

### Triggering

- Entry is explicit-only in v1.
- Users invoke `ulysses-protocol` or `theseus-protocol` directly.
- Auto-suggest and auto-enter are out of scope.

### Ownership

- Only the coordinator agent advances protocol state through `init`, `plan`, `outcome`, `reflect`, `visa`, `checkpoint`, `status`, and `complete`.
- Helper agents may gather evidence, test hypotheses, or render audit verdicts, but they do not mutate protocol state.

### Knowledge Yield

- Protocol transitions must emit structured Thoughtbox thoughts at `init`, `plan`/`visa`, `outcome`/`checkpoint`, `reflect`, and `complete`.
- Terminal summaries must bridge into the knowledge graph.
- Ulysses reflections and high-value Theseus failures must also produce reusable knowledge artifacts.

## Public Interfaces

### Protocol tools

The authoritative protocol tools remain:

- `thoughtbox_ulysses { init | plan | outcome | reflect | status | complete }`
- `thoughtbox_theseus { init | visa | checkpoint | outcome | status | complete }`

### Hook-facing enforcement API

Add a server-backed enforcement surface on the Dockerized Thoughtbox server for Claude hooks.

- Route: `POST /protocol/enforcement`
- Purpose: return a workspace-scoped enforcement decision for a pending local mutation
- Request body:
  - `mutation: boolean`
  - `targetPath?: string`
- Response body:
  - `enforce: boolean`
  - `blocked?: boolean`
  - `reason?: string`
  - `protocol?: "ulysses" | "theseus"`
  - `session_id?: string`
  - `required_action?: "reflect" | "visa"`

Behavior:

- Ulysses blocks mutating work when the active session is at `S=2`, returning `required_action: "reflect"`.
- Theseus blocks test-file edits and out-of-scope writes, returning `required_action: "visa"` for scope expansion.
- Read-only actions are never blocked by this surface.

### Claude-side invoke surfaces

The Claude-facing workflows stay explicit:

- `ulysses-protocol { init | plan | outcome | reflect | status | complete }`
- `theseus-protocol { init | visa | checkpoint | outcome | status | complete }`

These workflows become thin adapters that:

- ensure a Thoughtbox reasoning session exists
- ensure cipher is loaded when needed
- call the authoritative protocol tool
- render the next required action from server state

## Implementation Changes

### Thoughtbox server

- Extend protocol enforcement logic to cover Ulysses reflection gating and Theseus scope/test gating from one entrypoint.
- Reuse the same protocol handler instance for both MCP tool operations and the hook-facing enforcement route so local mode cannot drift.
- Keep in-memory and Supabase-backed protocol runtimes behaviorally aligned.

### Claude hooks

- Collapse protocol enforcement into `.claude/hooks/pre_tool_use.sh`.
- Remove Ulysses-specific local surprise counting and reflect sentinels from the active runtime path.
- Resolve the local Thoughtbox base URL from `.mcp.json`, defaulting to `http://localhost:1731/mcp`.

### Claude skills

- Rewrite the Ulysses and Theseus skills to instruct direct Thoughtbox protocol-tool usage instead of local bash state machines.
- Keep legacy shell helpers out of the default workflow.

## Acceptance Criteria

- An explicit Ulysses run can reach `S=2`, and the local hook blocks mutating actions until `reflect` is recorded through Thoughtbox.
- An explicit Theseus run blocks test-file edits and out-of-scope writes until a visa is recorded through Thoughtbox.
- The hook enforcement path works against the Dockerized local Thoughtbox server without relying on local Node wrappers.
- Protocol completion still bridges summaries to Thoughtbox knowledge storage.
- Ulysses reflections and Theseus audit failures produce reusable knowledge artifacts.
- Helper-agent participation does not supersede or corrupt the coordinator-owned active protocol session.
