# Thoughtbox Gateway Tool (Always-On Router)

## Problem
- Claude Code over streamable HTTP rarely refreshes `tools/list` mid-turn and ignores `tools/list_changed`.
- Progressive disclosure via enable/disable causes “tool visible but not callable” failures after `init` and `cipher`.
- We need a way to keep progressive staging logic while avoiding reliance on mid-turn tool discovery.

## Approach
Introduce a single always-enabled tool `thoughtbox_gateway` that routes to existing handlers (init, cipher, thoughtbox, notebook, session) and enforces stages internally. This removes client dependence on fresh tool lists while preserving session/state behavior.

## Operations (proposed)
- `get_state`, `list_sessions`, `navigate`, `load_context`, `start_new`, `list_roots`, `bind_root` (init operations)
- `cipher` (returns notation, advances to Stage 2)
- `thought` (proxy to thoughtbox)
- `notebook` (proxy to notebook)
- `session` (proxy to session tool)

Input schema (sketch):
```json
{
  "operation": "get_state" | "list_sessions" | "navigate" | "load_context" | "start_new" | "list_roots" | "bind_root" | "cipher" | "thought" | "notebook" | "session",
  "args": { ... } // passthrough per operation
}
```

## Stage Mapping

| Operation | Required Stage | Advances To |
|-----------|---------------|-------------|
| `get_state`, `list_sessions`, `navigate` | STAGE_0_ENTRY | - |
| `load_context`, `start_new`, `list_roots`, `bind_root` | STAGE_0_ENTRY | STAGE_1_INIT_COMPLETE |
| `cipher` | STAGE_1_INIT_COMPLETE | STAGE_2_CIPHER_LOADED |
| `thought`, `notebook` | STAGE_2_CIPHER_LOADED | - |
| `session` | STAGE_1_INIT_COMPLETE | - |

## Routing / Stage Enforcement
- Gateway is always registered and enabled.
- Uses `ToolRegistry.getCurrentStage()` and existing `StateManager`.
- For init_*: call `initToolHandler.handle(...)` with mapped `operation`.
- For `cipher`: require stage >= init_complete; advance to STAGE_2; reuse existing cipher response (turn-boundary text).
- For `thought`: require stage >= cipher_loaded; call `thoughtHandler.processThought(...)`.
- For `notebook`: require stage >= cipher_loaded; call `notebookHandler.processTool(...)`.
- For `session`: require stage >= init_complete; call `sessionHandler.processTool(...)`.
- If stage too low: return a clear error (e.g., “Init not complete. Use init_start_new or init_load_context first, then retry.”).

## Sessions & State
- No new storage. Reuse existing `storage`, `StateManager`, and per-session mcpSessionId.
- Stage transitions remain in `ToolRegistry`; gateway just checks/gates instead of enabling/disabling tools.

## Notifications / Delays
- Keep current fan-out of `sendToolListChanged()` and delay around `cipher` (harmless if ignored by client).
- Turn-boundary guidance remains in responses (stop, ask user to send a message, then call next op).

## Error Messaging
- Gateway returns specific guidance when calls are made too early or when the client sees “No such tool available…” (retry after short wait / next turn).

## Benefits
- Avoids client-side stale tool list for critical transitions.
- Preserves progressive disclosure semantics and session behavior.
- Minimizes surface area: reuses existing handlers; only adds one routing tool.

## Open Questions
- Should we expose additional ops (e.g., mental_models, export) once stage 3/domain is active?
- Do we keep per-op tools registered for non-gateway clients, or rely solely on the gateway?
- How much delay to keep after `cipher` when using gateway (possible to shorten)? 
