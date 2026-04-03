# SPEC-CONNECTION-TRACKING: Connection-Level Sessions

## Status: DRAFT

## Summary

A `connections` table that tracks the lifetime of a single agent-to-server transport session. Today, "session" in Thoughtbox means a reasoning chain (a sequence of thoughts). The user needs a higher-level concept: the connection — the period from when an agent connects to when it disconnects. A connection contains zero or more reasoning sessions (runs) and zero or more tool events. This maps to the user's mental model: "the agent worked from 2am to 4am" is a connection; "the agent reasoned about auth scoping" is a session within that connection.

## Requirements

1. New `connections` table with columns: `id` (UUID), `workspace_id` (FK), `project_id` (FK, nullable until projects exist), `started_at` (timestamptz), `ended_at` (timestamptz, nullable while active), `metadata` (JSONB for client info: agent type, model ID).
2. When a Streamable HTTP or SSE transport connects in `index.ts`, insert a connection row with `started_at = now()`. Store the connection ID in the transport session state.
3. When the transport disconnects (close event), update the connection row with `ended_at = now()`.
4. Existing reasoning sessions (thought chains) gain an optional `connection_id` FK. When a session is created during an active connection, it is automatically linked.
5. Tool events arriving via SPEC-HOOK-CAPTURE are tagged with `connection_id` as an OTLP attribute. The server stores this alongside the event, enabling queries like "show all tool events from connection X."
6. The hierarchy is: workspace → project → connection → (sessions + events). A connection groups everything that happened during one agent work period.
7. Connections with no `ended_at` for more than 2 hours are marked stale by a periodic cleanup (server-side, not a cron job — checked on next request to the workspace).

## Acceptance Criteria

- [ ] Connection row is created when transport connects, with correct workspace_id
- [ ] Connection row is updated with ended_at when transport disconnects
- [ ] Reasoning sessions created during a connection have connection_id set
- [ ] Tool events can be queried by connection_id
- [ ] Stale connections (no ended_at, older than 2 hours) are marked closed on next workspace access
- [ ] Web app can list connections for a workspace with duration, event count, and session count

## Dependencies

- Transport lifecycle hooks in `index.ts` (connect/disconnect events already tracked in sessions Map)
- SPEC-HOOK-CAPTURE for tool event tagging
- Supabase migration for new table and FK additions

## Open Questions

- Should connection tracking work for the hook-only path (no MCP server connection)? The hook sends events via HTTP POST, not a persistent transport. Each POST is stateless. Connection grouping would need a client-generated connection_id passed in every request.
- What metadata should be captured at connection start? Model ID, agent name, and Claude Code version would be useful but may not be available from the transport handshake.
- Should reconnections (same agent, brief disconnect) be merged into one logical connection or tracked separately?
