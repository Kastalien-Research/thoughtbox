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

Add a server-backed enforcement surface on the Thoughtbox server for Claude hooks. The route is mounted in BOTH local (single-tenant) and hosted (multi-tenant, `THOUGHTBOX_STORAGE=supabase`) modes.

- Route: `POST /protocol/enforcement`
- Purpose: return a workspace-scoped enforcement decision for a pending local mutation
- Auth (hosted mode): requests MUST carry `Authorization: Bearer <tbx_* API key or OAuth JWT>` (or `?key=`). The enforcement workspace is resolved from the credentials; any `workspaceId` in the body is ignored. Unauthenticated or invalid-key requests get 401. Local mode requires no auth and honors a body `workspaceId` when present.
- Request body:
  - `mutation: boolean`
  - `targetPath?: string`
  - `workspaceId?: string` (advisory, local mode only; hosted mode derives it from credentials)
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
- Hosted mode resolves protocol state (`protocol_sessions`, `protocol_scope`) directly from Supabase per authenticated workspace. Enforcement does NOT require a live in-process protocol handler, so decisions hold across container restarts and apply regardless of which instance served the MCP session.
- Local mode consults every live MCP session's protocol handler and aggregates blocked-wins: a block from ANY active protocol session is returned, so a second concurrent session cannot mask an enforcement decision.

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

- The shipped enforcement client is the plugin PreToolUse hook `plugins/thoughtbox-claude-code/scripts/protocol_gate.sh` (matcher: `Edit|Write|NotebookEdit`).
- Endpoint resolution order: `THOUGHTBOX_URL` env → `OTEL_EXPORTER_OTLP_ENDPOINT` env → the `thoughtbox init` config in `.claude/settings.local.json` (`env.OTEL_EXPORTER_OTLP_ENDPOINT`, else the base of `mcpServers.thoughtbox.url`). There is NO hardcoded default endpoint.
- API key resolution order: `THOUGHTBOX_API_KEY` env → `OTEL_EXPORTER_OTLP_HEADERS` env (`Authorization=Bearer <key>`) → the same fields in `.claude/settings.local.json` (including `?key=` on the MCP URL). When a key resolves, the hook sends `Authorization: Bearer <key>`.
- Availability posture: fail OPEN, never silently. Unreachable, unconfigured, or auth-rejected enforcement exits 1 (non-blocking) with a visible stderr warning stating protocol gates are NOT enforced for the action. Blocked decisions exit 2 with the reason.
- Remove Ulysses-specific local surprise counting and reflect sentinels from the active runtime path.

### Claude skills

- Rewrite the Ulysses and Theseus skills to instruct direct Thoughtbox protocol-tool usage instead of local bash state machines.
- Keep legacy shell helpers out of the default workflow.

## Acceptance Criteria

- An explicit Ulysses run can reach `S=2`, and the local hook blocks mutating actions until `reflect` is recorded through Thoughtbox.
- An explicit Theseus run blocks test-file edits and out-of-scope writes until a visa is recorded through Thoughtbox.
- The hook enforcement path works against the Dockerized local Thoughtbox server without relying on local Node wrappers.
- The hook enforcement path works against a hosted multi-tenant server (`THOUGHTBOX_STORAGE=supabase`): an authenticated `POST /protocol/enforcement` returns the decision for the API key's workspace, and a mutation during that workspace's active Ulysses `S=2` (or Theseus out-of-scope) state is blocked at the hook with no live MCP session required.
- When enforcement is unreachable or unconfigured, the hook fails open with a visible warning — never silently.
- Protocol completion still bridges summaries to Thoughtbox knowledge storage.
- Ulysses reflections and Theseus audit failures produce reusable knowledge artifacts.
- Helper-agent participation does not supersede or corrupt the coordinator-owned active protocol session.
