# Observatory Wiring Issues

Obvious implementation gaps discovered while mapping the UI to server behavior.

## Contract Mismatches
- `session:snapshot` branches shape: server sends `branches` as a record (`Record<string, Branch>` from `sessionStore.getBranches()` and `SessionSnapshotPayloadSchema`), but UI treats it as an array and calls `.forEach` (`src/observatory/ui/observatory.html` snapshot handler). Result: branch list remains empty for snapshots.
- `thought:revised`: emitted by `src/thought-handler.ts` and broadcast on `reasoning:<sessionId>`, but UI has no handler; revisions are invisible.

## Missing Broadcasts
- Agent lifecycle (`agent:spawned|active|idle|completed`) and task lifecycle (`task:created|updated|completed`) events are emitted (e.g., `src/observatory/test-collab-events.ts`) and listened for in the UI, but no channel forwards them to WebSocket subscribers. UI task board and agent bar never update from live data.
- Improvement events (`improvement:event`) are emitted by `src/observatory/improvement-tracker.ts` but never surfaced via channels; currently unused by UI.

## Configuration Gaps
- `THOUGHTBOX_OBSERVATORY_PATH` is parsed and logged but not applied to the WebSocket server. `src/observatory/ws-server.ts` attaches at the HTTP root, while the UI also assumes root. If a non-root path is configured, it will be ignored.
- `THOUGHTBOX_OBSERVATORY_HTTP_API` is parsed but not enforced; REST endpoints remain enabled regardless of the flag.

## UX/State Gaps
- `session:ended` events are logged in the UI but not reflected in session state (sessions stay “active” in the list).
