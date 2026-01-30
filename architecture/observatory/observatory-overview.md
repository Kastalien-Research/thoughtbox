# Observatory Overview

## Purpose
Real-time observability for reasoning sessions via WebSocket streaming and a self-contained HTML UI. Observability follows a fire-and-forget pattern so failures never block reasoning.

## Key Components
- Emitter layer: `src/observatory/emitter.ts` (`thoughtEmitter`) exposes synchronous `emit*` helpers; listeners errors are swallowed.
- Event origins: `src/thought-handler.ts` emits session and thought lifecycle; `src/observatory/improvement-tracker.ts` emits SIL events; `src/observatory/test-collab-events.ts` emits mock agent/task events.
- Channels: `src/observatory/channels/reasoning.ts` (topic `reasoning:<sessionId>`) bridges emitter events to WebSocket broadcasts and maintains the in-memory `sessionStore`; `src/observatory/channels/observatory.ts` (topic `observatory`) reads from `sessionStore` for discovery/listing.
- WebSocket transport: `src/observatory/ws-server.ts` routes `[topic, event, payload]`, manages subscriptions, and broadcasts.
- HTTP server: `src/observatory/server.ts` serves the UI, health, sessions list/detail, and a mock-collab trigger endpoint; attaches the WebSocket server.
- UI: `src/observatory/ui/observatory.html` connects over WebSocket, renders sessions, graphs, tasks, and agent activity; `src/observatory/ui/index.ts` exposes the HTML string.
- Configuration: `src/observatory/config.ts` loads env flags (enable, port, cors, path, maxConnections, httpApi); `src/index.ts` `maybeStartObservatory()` boots the server when enabled.

## Message Model
- Format: JSON array `[topic, event, payload]`.
- Topics: `observatory` (global discovery) and `reasoning:<sessionId>` (per-session stream).
- Snapshot-on-join: `reasoning` channel sends `session:snapshot` with session, thoughts, branches when subscribed.
- Dual broadcast: `thought:added` goes to both `reasoning:<sessionId>` and `observatory` for fast first-paint before subscription completes.

## Data Schemas
- Core types: `ThoughtSchema`, `SessionSchema`, `BranchSchema` in `src/observatory/schemas/thought.ts`.
- Event payloads: `SessionSnapshotPayloadSchema`, `ThoughtAddedPayloadSchema`, etc. in `src/observatory/schemas/events.ts`.

## Startup Path
`src/index.ts` → `maybeStartObservatory()` → `createObservatoryServer(config)` → register channels → start HTTP + WebSocket → serve UI at `/` or `/observatory` and WS at `ws://<host>:<port>` (path currently fixed at root).
