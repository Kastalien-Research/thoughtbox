---
spec_id: SPEC-REASONING-CHANNEL-HOSTED
title: "Hosted Reasoning Channel: tenant-scoped protocol-event delivery to the Claude Code channel"
status: draft
date: 2026-06-15
branch: feat/hosted-reasoning-channel
claims:
  - id: c1
    statement: The thoughtbox-claude-code plugin registers the channel as an MCP server and declares it under the plugin `channels` field, so Claude Code launches the stdio channel server and renders its `notifications/claude/channel` events as <channel> blocks
    type: implementation
    behavioral: false
    required_evidence: plugin.json contains an `mcpServers.thoughtbox-channel` entry (command node, args ${CLAUDE_PLUGIN_ROOT}/dist/thoughtbox-channel.js) and a `channels` array whose `server` matches that key; the channel derives base URL and API key from local Claude settings (THOUGHTBOX_URL is an optional override), so the committed dist/thoughtbox-channel.js boots, declares the claude/channel experimental capability, and stays idle instead of exit(1) when unconfigured; /plugin install succeeds
  - id: c2
    statement: In hosted (multi-tenant) mode the server appends the full protocol lifecycle event stream (ulysses_*/theseus_*) to a dedicated tenant-scoped Supabase table — distinct from protocol_history, which only stores a lossy operation-level subset and is never broadcast
    type: implementation
    behavioral: false
    required_evidence: a migration adds a protocol_events table with tenant_workspace_id + workspace-membership RLS following the hub-table pattern; the multi-tenant session branch in src/index.ts passes onProtocolEvent to createMcpServer and that handler writes a row per protocol event; a test confirms rows are written under the emitting workspace
  - id: c3
    statement: A tenant-scoped pull endpoint returns protocol events changed since a cursor, authorized by the caller's API key, and never returns another workspace's events
    type: behavioral
    behavioral: true
    required_evidence: GET /protocol/events (changed_since cursor) resolves the workspace via resolveRequestAuth and filters by tenant_workspace_id; an agentic/integration test shows workspace A's events are returned to A's key and a workspace-B key receives none of A's events (cross-tenant negative control)
  - id: c4
    statement: The channel client selects its transport by configuration — in-process SSE against a local server, HTTP polling of the pull endpoint against a hosted server with session-scoped query parameters when configured — and delivers identical channel notifications either way
    type: implementation
    behavioral: false
    required_evidence: the channel client chooses SSE vs polling from config (URL host inference with an env override, warning on invalid overrides), forwarding session_id when configured and priming before emitting; both transports normalize the workspace-scoped wire shape (top-level workspaceId, session id in data.session_id) into the ThoughtboxEvent sessionId the EventFilter keys on, so a THOUGHTBOX_SESSION filter matches protocol events instead of silently dropping everything, and the filter warns (once) when it drops an event with no session attribution; unit tests cover both transports producing the same pushEvent calls
  - id: c5
    statement: The local-mode reasoning channel keeps working unchanged — the hosted path is additive and does not alter local /events SSE delivery or protocol enforcement
    type: governance
    behavioral: false
    required_evidence: src/index.ts local branch still mounts /events and passes onProtocolEvent; the local channel still consumes SSE; no change to the protocol enforcement surface (/protocol/enforcement); existing protocol/event tests pass
links:
  - .specs/reasoning-channel.md
  - .specs/protocol-runtime-integration.md
  - .specs/agx/SPEC-AGX-SUBSTRATE.md
---

# Hosted Reasoning Channel

## Context

The reasoning-channel vision (`.specs/reasoning-channel.md`) and the protocol
runtime integration (`.specs/protocol-runtime-integration.md`) both assume a
**local** Dockerized Thoughtbox server: protocol lifecycle events flow over an
in-process `/events` SSE surface, and the `thoughtbox-claude-code` plugin's
stdio channel server subscribes to that stream and pushes
`notifications/claude/channel` messages into the Claude Code session.

Two gaps block the hosted (Cloud Run, multi-tenant) deployment:

1. **The plugin never launches the channel.** The `channels` entry was removed
   (`aed34f4`) when the compiled artifact was missing; the artifact now ships
   but nothing re-registers it, and the old block never supplied `THOUGHTBOX_URL`
   so the channel would `process.exit(1)` at startup.
2. **Hosted mode produces nothing to subscribe to.** In `src/index.ts` the
   multi-tenant session branch never passes `onProtocolEvent`/`onHubEvent`, and
   `/events` is mounted local-mode only. In-process SSE also cannot span Cloud
   Run replicas: the channel's SSE connection pins to one replica while the
   emitting session may run on another.

## Decision

Deliver hosted protocol events **pull-based**, mirroring the B3 claim-graph
philosophy ("agents pull: `verify` is the cheap staleness check, `changed_since`
the digest", `SPEC-AGX-SUBSTRATE` §11.1). Push/Realtime delivery is deferred to
B6/B8 (the reactive substrate) so the realtime transport is defined once, there.

- **Local mode**: in-process `/events` SSE; channel subscribes via SSE.
  **Amended 2026-07-09 (additive):** default local mode (fs) ALSO appends the
  same stream to a durable SQLite log (`SqliteProtocolEventStorage`,
  `<dataDir>/protocol-events.db`) and serves the identical pull contract at
  `GET /protocol/events` (no auth, matching the unauthenticated local SSE
  surface), so event history survives restarts and the polling transport works
  locally. SSE delivery is unchanged; `THOUGHTBOX_STORAGE=memory` keeps the
  SSE-only volatile posture.
- **Hosted mode**: protocol events persist to a tenant-scoped `protocol_events`
  table; the channel polls a tenant-scoped pull endpoint; tenant isolation is by
  construction (API key → workspace → filtered query), not by realtime RLS.

## Out of scope

- Realtime/push delivery in hosted mode (B6/B8).
- The broader watcher ecosystem, reply tools, and thought-level events from
  `reasoning-channel.md` (that remains a separate, future expansion).
- Hub events over the hosted channel (this spec covers protocol events only;
  hub events follow the same pattern later if needed).

## Components

1. **Plugin wiring** (c1) — register `mcpServers.thoughtbox-channel` + a
   `channels` entry in `plugin.json` whose `server` matches the mcpServers key;
   the channel derives URL+key from local Claude settings (no hardcoded env);
   ship the dist artifact (already committed).
2. **Server persistence** (c2) — `protocol_events` migration (tenant-scoped +
   RLS, claims/hub-table pattern); wire `onProtocolEvent` in the multi-tenant
   branch to append each event. A dedicated table, **not** `protocol_history`:
   that table is the session-keyed audit log with an operation-level
   `event_type` (plan/outcome/reflect/checkpoint/+2 validator) constrained by a
   CHECK — a lossy subset missing init/visa/complete and the ulysses/theseus
   prefix. `protocol_events` mirrors the full nine-type `ThoughtboxEvent`
   taxonomy the channel emits, so hosted pull equals local SSE byte-for-byte.
3. **Pull endpoint** (c3) — `GET /protocol/events?changed_since=<cursor>`,
   authorized by API key, filtered by `tenant_workspace_id`. An optional
   `session_id` query param (the one the plugin polling client already
   forwards) narrows the pull to one reasoning session server-side;
   absent, behavior is unchanged.
4. **Channel client transport selection** (c4) — SSE (local) vs polling (hosted),
   chosen by config; identical `pushEvent` behavior.
5. **Tests** (c2/c3/c4/c5) — persistence, cross-tenant negative control, both
   transports, local-mode regression.

## Acceptance

A hosted user who has run `thoughtbox init` and installed the plugin sees
ulysses/theseus protocol events surfaced as `<channel source="thoughtbox-channel">`
blocks in their Claude Code session, scoped to their workspace, with no local
Thoughtbox server running — while a local self-hosted user keeps the existing SSE
behavior unchanged.
