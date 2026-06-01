# Models And Persistence Map

## Reasoning Sessions And Thoughts

Canonical candidates:

- Domain/storage types: `src/persistence/types.ts`.
- Runtime validator and transition surface: `src/thought-handler.ts`.
- Filesystem storage: `src/persistence/filesystem-storage.ts`.
- Supabase storage: `src/persistence/supabase-storage.ts`.
- SQL truth: Supabase migrations for `sessions`, `thoughts`, and `runs`.

Competing models:

- `ThoughtData` exists in persistence types and a handler-local shape.
- Observatory has its own Zod `Thought`, `Session`, and `Branch` schemas.
- Web has separate raw DB and view-model types under
  `apps/web/src/lib/session`.

Hotspots:

- `ThoughtData` is not a discriminated union.
- `action_receipt` is supported by handler/persistence/SQL but was reported as
  missing from the public thought tool input enum.
- Session completion state is not tied to `completedAt`.
- Runs have TypeScript/SQL drift around `workspaceId`.

## Protocol Enforcement

Canonical candidates:

- Types: `src/protocol/types.ts`.
- Durable handler: `src/protocol/handler.ts`.
- In-memory handler: `src/protocol/in-memory-handler.ts`.
- Tools: `src/protocol/theseus-tool.ts`, `src/protocol/ulysses-tool.ts`.
- Operations catalog: `src/protocol/operations.ts`.
- SQL: protocol tables and checks in Supabase migrations.

Current shape:

- Theseus operations: `init`, `visa`, `checkpoint`, `outcome`, `status`,
  `complete`.
- Ulysses operations: `init`, `plan`, `outcome`, `bind_final_validator`,
  `reflect`, `status`, `complete`.
- Ulysses validators are wired to notebook validator service from
  `server-factory.ts`.

Hotspots:

- `ProtocolSession.status` is not discriminated by `protocol`.
- `state_json` is untyped.
- File evidence points to possible `workspace_id` SQL/type mismatch, but live DB
  was not checked.

## Notebook Substrate

Competing live models:

- Legacy Zod model: `src/notebook/types.ts`.
- Newer Effect model: `src/notebook/engine/domain.ts`.
- Runtime: `src/notebook/engine/runtime.ts`.
- Handler/tool: `src/notebook/index.ts`, `src/notebook/tool.ts`.

Effect model strengths:

- Explicit notebook modes: `runbook`, `simulation`, `eval`, `failure_capsule`,
  `adr_evidence`, `skill_certification`, `scenario_factory`, `system_audit`.
- Explicit run-state union for queued/running/input_required/completed/failed/
  cancelled.
- Typed output variants by notebook mode.

Hotspot:
Both Zod and Effect models are live enough to matter; cleanup should choose one
owner per slice rather than editing both reflexively.

## Peer Notebook Control Plane

Canonical candidates:

- Domain records: `src/peer-notebook/types.ts`.
- Repository contract: `src/peer-notebook/repositories.ts`.
- In-memory repo: `src/peer-notebook/repositories.ts`.
- Supabase repo: `src/peer-notebook/supabase-repository.ts`.
- SQL truth:
  `supabase/migrations/20260430010000_create_peer_notebook_control_plane.sql`.

Current implementation:

- Durable tables exist for peer notebooks, manifests, invocations, trace events,
  and artifacts.
- Hosted repository writes peer artifacts to Supabase Storage.
- Local/test repository stores artifacts in memory.
- Runtime provider currently returns only `mock`.

Hotspots:

- `PeerNotebookRecord.status` and `activeManifestId` can be incoherent.
- `PeerInvocationRecord.status`, timestamps, result, and error can be
  incoherent.
- Generated DB types do not include peer notebook tables.

## Hub Collaboration

Canonical candidates:

- In-process domain model: `src/hub/hub-types.ts`.
- Filesystem storage: `src/hub/hub-storage-fs.ts`.
- Operation catalog: `src/hub/operations.ts`.
- Tool schema/handler: `src/hub/hub-tool-schema.ts`,
  `src/hub/hub-tool-handler.ts`.

Separate substrate:

- SQL `hub_tasks`, `hub_workers`, and `hub_events` exist in migrations, but they
  do not appear to be the same model as `src/hub` workspaces/problems/proposals.

Hotspots:

- Hub is implemented but not exposed through current public MCP tools.
- `ReviewVerdict` and hub tool schema reportedly disagree (`comment` vs
  `reject`).

## Knowledge Graph

Canonical candidates:

- Domain types: `src/knowledge/types.ts`.
- Filesystem JSONL plus SQLite index: `src/knowledge/storage.ts`.
- Supabase repository: `src/knowledge/supabase-storage.ts`.
- SQL truth: knowledge tables and workspace scoping migrations.

Hotspot:
Filesystem and Supabase modes are both real and should be treated as distinct
persistence adapters over a shared conceptual graph, not as proof of one
canonical storage path.

## Generated Supabase Types Drift

`src/database.types.ts` appears stale against migrations. Missing or suspicious
areas include:

- `branches`
- OAuth client/code/token tables
- `peer_notebooks`
- `peer_manifests`
- `peer_invocations`
- `peer_trace_events`
- `peer_artifacts`
- constrained enum-like columns typed as plain `string`

Cleanup implication:
Before any DB-facing cleanup, regenerate or verify DB types against live
Supabase. File-based migration evidence is not enough to prove current deployed
schema.
