# Observatory UI Bindings

UI code: `src/observatory/ui/observatory.html` (inline JS).

## Connection State
- `connected` / `disconnected` (client lifecycle) → status badge, auto-subscribe to `observatory`.

## Session Discovery (topic `observatory`)
- `observatory:subscribed` → log only.
- `observatory:sessions:active` (payload `{ sessions }`) → render session tabs; auto-select first session.
- `observatory:session:started` (payload `{ session }`) → append session, immediately subscribe to `reasoning:<id>` to avoid missed thoughts; auto-select when no active session.
- `observatory:session:ended` → log only (UI does not mark ended).
- `observatory:thought:added` (payload `{ sessionId, thought, parentId }`) → if no active session, set active, subscribe to `reasoning:<id>`, insert first thought, render graph.

## Session Stream (topic `reasoning:<sessionId>`)
- `subscribed` → log only.
- `session:snapshot` (payload `{ session, thoughts, branches }`) → clear state, load thoughts/branches, render graph. **UI treats `branches` as an array; server sends record.**
- `thought:added` (payload `{ thought, parentId, agentId?, agentRole?, taskId? }`) → set `parentId` on thought, track arrival order, add to graph; update agent attribution if `agentRole`; render.
- `thought:branched` (payload `{ thought, parentId, branchId, fromThoughtNumber }`) → set branch fields, register branch label, add node, render.
- `thought:revised` → no handler; revisions are ignored by UI.
- `session:ended` → log only; no UI state change.
- `error` → log only.

## Detail Panel
- Trigger: clicking a node → sets `state.selectedNodeId`, switches to detail view, renders MCP-style payload (thought, number, totals, branch metadata).
- Back button / Escape → return to graph view.

## Branch Navigation
- Trigger: clicking stub nodes (branch labels) → `viewContext.mode = 'branch'`, sets `activeBranchId`, renders only that branch; back button resets to main.

## Agent Activity Bar
- Expected events: `agent:spawned`, `agent:active`, `agent:idle`, `agent:completed`.
- Effects: maintain `state.agents`, update status/lastActivity, rerender agent bar.
- Note: UI listens, but no channel emits these events.

## Task Board
- Expected events: `task:created`, `task:updated`, `task:completed`.
- Effects: update `state.tasks` and render task cards/progress.
- Note: UI listens, but no channel emits these events.
