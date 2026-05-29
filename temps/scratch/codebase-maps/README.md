# Thoughtbox Codebase Maps

Created: 2026-05-26

Purpose: working maps of the checkout as it is implemented now. These are scratch
orientation artifacts, not product documentation and not cleanup decisions.

## Source Of Truth Preflight

Unit:
Map the current Thoughtbox staging checkout so cleanup can distinguish live
systems, cooked-but-incomplete systems, stale docs, and dead or orphaned code.

Non-goals:
No cleanup implementation, no branch rewrite, no dependency changes, no
deployment verification, and no claim that docs/specs are correct unless source
or tests support them.

Canonical model:
There is no single canonical model. The live codebase has multiple strata:

- MCP runtime and public tool surface:
  `src/index.ts`, `src/server-factory.ts`, `src/code-mode/*`,
  `src/peer-notebook/tool.ts`.
- Reasoning sessions/thoughts:
  `src/persistence/types.ts`, `src/thought-handler.ts`,
  `src/persistence/*`, and Supabase migrations.
- Protocol enforcement:
  `src/protocol/types.ts`, `src/protocol/handler.ts`,
  `src/protocol/in-memory-handler.ts`, `src/protocol/*-tool.ts`.
- Notebook substrate:
  legacy Zod model in `src/notebook/types.ts`, newer Effect model in
  `src/notebook/engine/domain.ts`, and runtime in
  `src/notebook/engine/runtime.ts`.
- Hub collaboration:
  `src/hub/*`, with a separate SQL `hub_tasks/hub_workers/hub_events`
  substrate that does not match the filesystem hub model one-to-one.
- Web app:
  `apps/web/src/app/*`, `apps/web/src/lib/*`,
  `apps/web/src/components/*`.
- Supabase product/runtime schema:
  `supabase/migrations/*`, `src/database.types.ts`,
  `apps/web/src/lib/supabase/database.types.ts`.

Legacy/competing models:

- Direct old MCP tool definitions still exist behind Code Mode, but are not
  public tools.
- Hub has mature operation/schema/handler code but no current `tb.hub` path.
- Notebook Zod and Effect domains both matter.
- Filesystem and Supabase persistence coexist for sessions and knowledge.
- Observatory has its own Zod session/thought/branch view model.

Control-plane models:

- Peer notebook control plane: `src/peer-notebook/*` plus
  `supabase/migrations/20260430010000_create_peer_notebook_control_plane.sql`.
- Branch workers and OTEL tables live mostly in Supabase-facing code.
- Code Mode catalog is an agent-facing control plane, not the domain model
  itself.

Adapters needed:

- Code Mode `tb` facade adapts direct tools into `thoughtbox_execute`.
- Supabase repositories adapt SQL rows into TypeScript domain records.
- Observatory/web view models adapt DB records into product UI shapes.
- Peer notebook repository adapts memory and Supabase-backed storage.

Illegal states currently representable:

- `ThoughtData` is a flat record keyed by `thoughtType`; metadata for one
  thought type can appear on another.
- `Session.status === "completed"` does not require `completedAt` in TypeScript.
- `Run.workspaceId` is optional in TypeScript while SQL makes it required.
- `ProtocolSession.status` is not discriminated by protocol.
- `ProtocolSession.state_json` is `Record<string, unknown>`.
- Peer notebook status fields are independent from correlated fields such as
  `activeManifestId`, `startedAt`, `completedAt`, `result`, and `error`.

Acceptance-to-enforcement map:

- Actual public MCP tools: enforced by `server-factory.ts` registration and
  `src/code-mode/__tests__/server-surface.test.ts`.
- Code Mode catalog: enforced by `src/code-mode/search-index.ts` and tests.
- Protocol event type DB parity: enforced only when
  `scripts/check-event-type-parity.ts` can reach Supabase.
- Peer notebook durable tables: enforced by migration and repository tests, but
  generated DB types are stale.
- Web auth/API key/billing surfaces: implemented in app routes and actions, but
  app README is stale and root tests do not include web tests.

New types/services proposed:
None.

Reuse decision:
These maps point at existing owners rather than proposing new abstractions.

Surprises:

- The live public MCP surface is 3 tools, not 2.
- README/docs still claim old direct tools or old route names in multiple places.
- `thoughtbox_operations` appears documented/tested but not registered.
- `thoughtbox://gateway/operations` appears listed but likely lacks a read
  handler.
- `src/database.types.ts` is missing live migration tables.
- `apps/web` is much more real than its README claims.

Proceed / pause:
Proceed with cleanup planning only after choosing which stratum is authoritative
for the next cleanup slice.

## Map Files

- `runtime-and-tool-surface.md`: entrypoints, public MCP surface, Code Mode,
  peer notebook, and orphaned tool surfaces.
- `models-and-persistence.md`: domain models, competing models, SQL/type drift,
  and illegal-state hotspots.
- `web-docs-tests-cleanup.md`: web app, specs/ADRs, tests/scripts, and cleanup
  candidates.

## Current Working-Tree Context

Observed branch: `fix/ulysses-fixes`.

The worktree was already dirty before map creation. Existing modified/untracked
files included `.gitignore`, `package.json`, `research-workflows/workflows.db`,
`.agents/`, `.codex/`, GitHub workflows, peer-notebook Part 2 prompt, event type
check script, and Supabase snippets. These maps do not classify that existing
work as ours.
