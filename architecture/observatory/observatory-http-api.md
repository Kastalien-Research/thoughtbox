# Observatory HTTP API

Server implementation: `src/observatory/server.ts`. Data source: in-memory `sessionStore` from `src/observatory/channels/reasoning.ts`.

## Endpoints
- `GET /` and `GET /observatory`
  - Serves `src/observatory/ui/observatory.html` (via `src/observatory/ui/index.ts`).
- `GET /api/health`
  - Returns `{ status, connections, activeSessions }`.
  - `connections` from `WebSocketServer.getConnectionCount()`.
- `GET /api/sessions?status=<active|completed|abandoned|all>&limit=50&offset=0`
  - Returns `{ sessions }` sliced in-memory; defaults limit 50, offset 0.
- `GET /api/sessions/:sessionId`
  - Returns `{ session, thoughts, branches }` or 404 if missing.
  - `branches` returned as record keyed by `branchId` (not array).
- `POST /api/test/mock-collab-session`
  - Invokes `emitMockCollabSession()` to push mock agent/task/thought events through the emitter. Useful for UI demos; requires websocket channels to forward events (currently only thought events are wired).

## Configuration
- From `src/observatory/config.ts`: `THOUGHTBOX_OBSERVATORY_ENABLED`, `THOUGHTBOX_OBSERVATORY_PORT` (default 1729), `THOUGHTBOX_OBSERVATORY_CORS`, `THOUGHTBOX_OBSERVATORY_PATH` (not applied to WebSocket server), `THOUGHTBOX_OBSERVATORY_MAX_CONN`, `THOUGHTBOX_OBSERVATORY_HTTP_API` (default true, parsed but not enforced in `src/observatory/server.ts`).
- CORS: allows `*` or first matching origin in `config.cors`.

## Notes
- Storage is ephemeral: `sessionStore` is in-memory; list/detail endpoints reflect only current process memory.
- WebSocket server attaches to the same HTTP server; current implementation ignores `config.path` for WS upgrade (always root).
