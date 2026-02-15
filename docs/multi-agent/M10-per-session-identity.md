# M10: Per-Session Agent Identity

## Problem

The hub domain layer (M1–M9) supports multi-agent collaboration — every function takes `agentId` as a parameter, workspaces track per-agent membership, problems have per-agent assignment. But the **wiring layer** collapses all clients to a single identity, making it impossible for multiple agents to connect to one server and collaborate.

Three specific gaps:

### Gap 1: `hub-tool-handler.ts` — shared `resolvedAgentId` closure

```typescript
// src/hub/hub-tool-handler.ts, line 45
let resolvedAgentId: string | null | undefined = undefined;
```

This is a single variable in a closure. When Agent A registers, ALL subsequent calls from ANY client use Agent A's ID. There's no per-session tracking.

### Gap 2: `server-factory.ts` — single `GatewayHandler` instance

```typescript
// src/server-factory.ts, line 348
let gatewayHandler: GatewayHandler | null = null;
```

One GatewayHandler serves all MCP sessions. Its `agentId`/`agentName` fields (from env vars) are the same for everyone.

### Gap 3: Env vars are process-scoped

`THOUGHTBOX_AGENT_ID` / `THOUGHTBOX_AGENT_NAME` are set once per process. Three clients on one server = three clones of the same identity.

## What Needs to Change

The MCP session ID (`sessionId`) is already threaded through `createMcpServer()` — it's passed to `ThoughtHandler`, `EventEmitter`, `InitToolHandler`, etc. The hub layer just doesn't use it.

### Design: Per-Session Identity Map

Replace the single `resolvedAgentId` with a `Map<string, string>` keyed by MCP session ID:

```
hub-tool-handler.ts:
  resolvedAgentIds: Map<mcpSessionId, agentId>

  On 'register': store mapping for THIS session
  On any other op: look up agentId for THIS session
  Fallback: env var identity for sessions that haven't registered
```

### Design: Per-Session GatewayHandler (or per-session identity override)

Either:
- Create a GatewayHandler per MCP session (heavier but clean isolation)
- Or pass the MCP session ID into the gateway tool callback and let GatewayHandler resolve identity per-session

The second approach is lighter. The gateway tool callback in server-factory.ts already has access to `sessionId` from the closure.

### Design: Registration as Session Binding

When an agent calls `register`, it binds their agentId to the current MCP session. All subsequent calls on that session use that identity. This replaces the env var mechanism for multi-session scenarios while remaining backward-compatible (single-agent servers still work via env vars).

## Files to Modify

| File | Change |
|------|--------|
| `src/hub/hub-tool-handler.ts` | `resolvedAgentId` → `Map<string, string>`, add `mcpSessionId` parameter, per-session identity resolution |
| `src/server-factory.ts` | Pass `sessionId` to hub tool handler, thread session ID through gateway handler |
| `src/gateway/gateway-handler.ts` | Accept per-call session context for identity resolution (or per-session instances) |
| `src/hub/hub-tool-handler.ts` (interface) | `HubToolHandlerOptions` gains `mcpSessionId?: string` |

## Files to Read First

Before writing any code, read these to understand the current wiring:

1. `src/hub/hub-tool-handler.ts` — the handler that bridges MCP ↔ hub domain
2. `src/hub/hub-handler.ts` — the dispatcher that takes `agentId` and routes ops
3. `src/server-factory.ts` lines 348–406 (gateway), 464–584 (hub tool registration)
4. `src/gateway/gateway-handler.ts` lines 157–203 (config/constructor), 415–466 (handleThought with agentId injection)
5. `src/hub/agent-identity.ts` — current identity resolution logic

## Tests to Write

| ID | Test |
|----|------|
| T-MA-SES-1 | Two sessions register different agents, each gets own identity |
| T-MA-SES-2 | Session A's calls use Session A's agentId, not Session B's |
| T-MA-SES-3 | Unregistered session falls back to env var identity |
| T-MA-SES-4 | Session that registers overrides env var identity for that session |
| T-MA-SES-5 | Hub operations (claim_problem, post_message) use correct per-session agentId |
| T-MA-SES-6 | GatewayHandler injects correct agentId per session into processThought |
| T-MA-SES-7 | Two sessions post thoughts — each attributed to correct agent |

## Acceptance Criteria

After this change, three Claude Code instances connecting to one Thoughtbox server via SSE/streamable HTTP can:

1. Each register with a unique name → get unique agentId
2. Create/join the same workspace
3. Claim different problems → get per-agent branches
4. Post thoughts → each attributed to the correct agent
5. Post conflicting claims → conflict detection correctly identifies which agent said what

## Existing Test Counts (must not regress)

- 75 multi-agent tests (9 files)
- 117 hub tests (23 files)
- Build must stay clean (`npm run build`)

## Branch

Work on `feat/multi-agent-tdd` (current branch).
