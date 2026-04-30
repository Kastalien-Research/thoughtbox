# MCP Peer Notebooks Control Plane

**Status**: Decision-complete staging spec for ADR-022
**Date**: 2026-04-30
**Branch**: `feat/mcp-peer-notebook-control-plane`
**Tracking**: `thoughtbox-pnf`

## Summary

MCP Peer Notebooks are brokered, manifest-governed notebook runtimes. The
control plane lives in the Cloud Run MCP API, owns peer authority, persists
state in Supabase, and presents inspection data through the Next.js web app.
Peer execution runs elsewhere through a runtime provider.

This spec is documentation-only. It does not add runtime code, migrations, or
web app routes.

## Non-Goals

- Do not implement peer runtime code.
- Do not add Supabase migrations.
- Do not build web app screens.
- Do not make Cloud Run host KVM, smolvm, or other privileged execution.
- Do not require the v0 runtime to expose public direct MCP.
- Do not use legacy `src/observatory` as the deployed product surface.

## Current Constraints

- The deployed substrate is Cloud Run MCP API, Supabase-backed storage, and the
  Next.js web app.
- Existing notebooks are ordinary JS/TS notebooks executed through subprocesses.
  They are useful execution artifacts but are not secure sandboxes.
- Supabase storage in the current deployed mode is workspace-scoped by
  application logic and service-role clients.
- Older notes that say "Observatory" should be translated to "the web app" for
  deployed/product planning unless a local-only tool is explicitly named.

## Core Invariants

1. A peer notebook is a governed runtime identity, not a notebook flag.
2. Ordinary notebooks remain subprocess scratchpads unless explicitly graduated.
3. Runtime code cannot activate or expand its own manifest.
4. The canonical manifest is a control-plane record with a version and hash.
5. Inbound invocation always enters through the broker facade.
6. Outbound Thoughtbox/MCP calls always exit through the broker proxy.
7. There is no implicit peer-to-peer mesh.
8. The broker validates workspace, caller, active manifest, tool schema,
   budgets, and outbound policy before runtime dispatch.
9. Cloud Run hosts the API/control plane, not KVM or smolvm execution.
10. smolvm, if used, belongs behind the runtime provider contract in a separate
    execution plane.
11. Observable work is mandatory: invocations, trace events, artifact metadata,
    manifest hashes, and terminal statuses.
12. Runtime state may be cached or snapshotted, but it is not the governance
    source of truth.

## Control-Plane Responsibilities

The broker is a Thoughtbox-owned control-plane module exposed through the Cloud
Run MCP API. External callers call the broker, not peer runtimes.

Broker facade:

```ts
peer.invoke({ peerId, tool, args })
```

The broker is responsible for:

- Resolving caller identity and workspace from the MCP request context.
- Resolving `peerId` to a workspace-scoped peer registry row.
- Loading the active manifest hash from control-plane state.
- Validating the requested tool against the active manifest.
- Validating `args` against the tool input schema before dispatch.
- Enforcing duration, tool-call, artifact-size, runtime, concurrency, network,
  secret, filesystem, and outbound `mayCall` budgets.
- Creating the `peer_invocations` row before runtime dispatch.
- Issuing a scoped token and broker proxy URL for outbound calls.
- Routing execution to the selected runtime provider.
- Recording broker decisions, runtime lifecycle, outbound calls, denied calls,
  result summaries, and artifact writes as trace events.
- Persisting artifact metadata in Postgres and full payloads in Supabase
  Storage.
- Updating terminal invocation status: `completed`, `failed`, `denied`,
  `timeout`, or `cancelled`.
- Serving a web-app read model from Supabase rows.

## Manifest Source And Lifecycle

Peer authors may keep a draft manifest inside the notebook as a JSON cell or
file named:

```text
peer.manifest.json
```

The compiler treats `peer.manifest.json` as data. It parses JSON and never
executes notebook code while extracting, validating, or hashing the manifest.

Rules:

- A notebook may have zero or one `peer.manifest.json` draft source.
- More than one matching draft source is a compile error.
- A malformed JSON draft is a compile error.
- Runtime-generated manifests are not accepted in v0.
- The compiler canonicalizes validated JSON and computes `manifest_hash`.
- The compiled manifest is written to `peer_manifests` with `status='draft'`.
- Draft manifests cannot be used for invocation.
- Explicit approval transitions a draft to an approved/active manifest.
- The broker only dispatches against the active manifest hash.
- Notebook edits after activation do not change capabilities until the control
  plane compiles a new draft and it is explicitly approved.

Lifecycle:

```text
notebook draft block
  -> control-plane compile
  -> peer_manifests.status = 'draft'
  -> explicit approval
  -> peer_manifests.status = 'active'
  -> peer_notebooks.active_manifest_id updated
  -> active manifest hash used by broker
```

Minimum v0 manifest fields:

- `schemaVersion`
- `peerId`
- `notebookId` or source notebook reference
- `runtime.provider`
- `runtime` budgets such as CPU, memory, and timeout
- `exposes.tools[]` with `name`, `description`, `inputSchema`, and
  `outputSchema`
- `mayCall.mcpTools[]`
- `network.enabled` and optional `network.allowHosts[]`
- `filesystem.mounts[]`
- `secrets.bindings[]`
- `persistence`
- `budgets`

## Invocation Flow

1. Caller invokes `peer.invoke({ peerId, tool, args })`.
2. Broker authenticates workspace and caller.
3. Broker loads `peer_notebooks` and the active `peer_manifests` row.
4. Broker verifies the manifest hash and peer status.
5. Broker validates the requested tool and args against the active manifest.
6. Broker evaluates budgets and outbound policy before runtime dispatch.
7. Broker creates a `peer_invocations` row with `status='queued'`, then marks it
   `running` when the runtime provider accepts the invocation.
8. Broker creates scoped broker-proxy credentials for the invocation.
9. Broker calls the selected runtime provider.
10. Runtime executes only the broker-selected operation.
11. Runtime reads inputs and calls tools only through the broker proxy.
12. Broker proxy allows or denies each outbound call before target execution.
13. Broker records trace events for decisions, lifecycle, outbound calls,
    denials, results, and artifacts.
14. Runtime returns a schema-valid typed result plus artifact references.
15. Broker persists artifact metadata and payloads.
16. Broker updates invocation terminal status and result/error summary.
17. Web app reads Supabase rows for inspection.

Denied outbound calls must be visible as `peer_trace_events` even when the
overall invocation continues.

## Runtime Provider Contract

The v0 runtime provider is provider-neutral RPC. It may wrap a local subprocess,
a mock runtime, an HTTP worker, or a future smolvm execution plane.

Required methods:

```ts
describe()

invoke({
  invocationId,
  tool,
  args,
  brokerProxyUrl,
  scopedToken,
  budgets
})

cancel({ invocationId })

snapshot/export({ invocationId })

heartbeat({ peerRuntimeId, invocationId })
```

Runtime obligations:

- Refuse to invoke if the broker-supplied manifest hash does not match the
  runtime's prepared manifest.
- Execute only the broker-selected tool.
- Use `brokerProxyUrl` and `scopedToken` for all Thoughtbox/MCP outbound calls.
- Return typed results that satisfy the manifest output schema.
- Return artifact references rather than embedding large payloads in results.
- Emit structured progress where supported, or allow the provider to capture
  lifecycle events.
- Treat subprocess notebook execution as unsafe unless the selected provider
  supplies a real isolation boundary.

Runtime providers:

- `mock`: deterministic contract tests and web-app fixtures.
- `local-process`: integration development only; not a security boundary.
- `smolvm`: deferred provider in a separate execution plane.

## Broker Proxy Contract

The broker proxy is the only outbound path for peer Thoughtbox/MCP access.

On each outbound request, it validates:

- Scoped token.
- Invocation id.
- Workspace id.
- Active manifest hash.
- Requested target tool/resource.
- `mayCall` allowlist.
- Remaining budgets.
- Network and host policy where applicable.

Outcomes:

- `allowed`: call is forwarded and traced.
- `denied`: call is not forwarded, denial is traced, and a structured denial is
  returned to the runtime.
- `budget_exceeded`: call is not forwarded, budget event is traced, and the
  invocation may be failed or cancelled according to policy.

## Supabase Table Contract

These are table contracts for the later migration spec. Column names are
decision targets, not an implementation in this docs unit.

### `peer_notebooks`

- `id uuid primary key`
- `workspace_id uuid not null`
- `slug text not null`
- `display_name text not null`
- `description text null`
- `source_notebook_ref jsonb not null`
- `status text not null`: `draft|active|disabled|archived`
- `active_manifest_id uuid null`
- `created_by text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- unique `(workspace_id, slug)`

### `peer_manifests`

- `id uuid primary key`
- `workspace_id uuid not null`
- `peer_id uuid not null`
- `version int not null`
- `schema_version text not null`
- `manifest jsonb not null`
- `manifest_hash text not null`
- `status text not null`: `draft|approved|active|retired|rejected`
- `compiled_from jsonb not null`
- `created_by text null`
- `approved_by text null`
- `approved_at timestamptz null`
- `created_at timestamptz not null`
- unique `(peer_id, version)`
- unique `(peer_id, manifest_hash)`

### `peer_invocations`

- `id uuid primary key`
- `workspace_id uuid not null`
- `peer_id uuid not null`
- `manifest_id uuid not null`
- `caller_type text not null`: `agent|scheduler|peer|user|system`
- `caller_id text null`
- `parent_invocation_id uuid null`
- `tool_name text not null`
- `args_hash text not null`
- `result_hash text null`
- `status text not null`: `queued|running|completed|failed|denied|timeout|cancelled`
- `started_at timestamptz null`
- `completed_at timestamptz null`
- `duration_ms int null`
- `runtime_provider text not null`
- `runtime_instance_id text null`
- `error jsonb null`
- `result jsonb null`
- `created_at timestamptz not null`

### `peer_trace_events`

- `id uuid primary key`
- `workspace_id uuid not null`
- `invocation_id uuid not null`
- `seq bigint not null`
- `event_type text not null`
- `severity text not null`: `debug|info|warn|error`
- `timestamp_at timestamptz not null`
- `body text null`
- `attrs jsonb not null default '{}'`
- unique `(invocation_id, seq)`
- index `(workspace_id, invocation_id, seq)`

### `peer_artifacts`

- `id uuid primary key`
- `workspace_id uuid not null`
- `invocation_id uuid not null`
- `peer_id uuid not null`
- `kind text not null`: `notebook_export|json|log|dataset|report|binary`
- `name text not null`
- `mime_type text not null`
- `byte_size bigint not null`
- `sha256 text not null`
- `storage_backend text not null`: `supabase_storage`
- `storage_bucket text not null`
- `storage_path text not null`
- `preview jsonb null`
- `retention_expires_at timestamptz null`
- `created_at timestamptz not null`

Access model:

- Rows are workspace-scoped.
- The Cloud Run API writes rows through existing Supabase service-role storage
  patterns.
- Web app reads must be constrained to the active workspace membership model.
- Exact RLS/index implementation belongs in the later Supabase migration spec.

## Artifact Payload Strategy

Use hybrid Supabase artifacts for v0:

- Postgres stores artifact identity, metadata, hashes, storage paths, retention,
  and small previews.
- Supabase Storage stores full payloads.
- Trace rows store artifact references, not full payloads.
- Typed invocation results may include small summaries and artifact ids.

Storage path shape:

```text
peer-artifacts/{workspace_id}/{peer_id}/{invocation_id}/{artifact_id}/{name}
```

Recommended preview cap for the migration spec: store a bounded JSON/text
preview, not arbitrary full payloads.

## Web App Read Model

The Next.js web app is the deployed product inspection surface. It reads
Supabase peer rows and must not depend on legacy `src/observatory`.

Minimum views:

- Peer registry: slug, display name, status, active manifest version/hash, last
  invocation, recent failure rate.
- Peer detail: manifest summary, exposed tools, `mayCall` allowlist, budgets,
  runtime provider, source notebook reference.
- Invocation list: peer, tool, status, caller, date filters.
- Invocation detail: args hash, result hash, status, runtime lifecycle,
  trace timeline, denied outbound calls, artifacts.
- Artifact viewer: JSON/text/markdown previews and `.src.md` notebook exports.

Realtime updates are optional for the pilot. If used, they should follow the
existing workspace-scoped Supabase Realtime pattern.

## Smallest Viable Pilot

Pilot peer: `claim-extractor`

Exposed tool:

```ts
extract_claims({ textArtifactId })
```

Expected flow:

1. Input text exists as a peer artifact or broker-readable artifact.
2. Broker validates workspace, active manifest, tool schema, and budgets.
3. Broker invokes a mock/local runtime provider.
4. Runtime reads the input artifact through the broker proxy.
5. Runtime writes `claims.json`.
6. Broker persists `claims.json` in Supabase Storage and metadata in
   `peer_artifacts`.
7. Broker records trace events for invocation start, input artifact read,
   denied outbound call attempt, output artifact write, and terminal status.
8. Web app shows the invocation, denial event, and `claims.json` preview.

Acceptance criteria:

- `claim-extractor` has one active approved manifest.
- `extract_claims({ textArtifactId })` rejects invalid args before runtime
  dispatch.
- The runtime can read exactly one allowed input artifact through the broker
  proxy.
- The runtime writes `claims.json` and returns an artifact id.
- A call not listed in `mayCall` is denied before target execution.
- The denied call is stored as a trace event.
- The web app can render peer, invocation, trace, and artifact rows from
  Supabase without `src/observatory`.
- No smolvm or KVM execution is required for the pilot.

## Deferred ADR/Spec Work

Before implementation, these need explicit HDD follow-up or migration specs:

- Supabase migration details: RLS, indexes, enum strategy, retention jobs, and
  backfill/cleanup.
- Runtime provider implementation: mock/local provider mechanics,
  cancellation, heartbeats, result validation, and broker-proxy errors.
- Security/isolation: smolvm provider design, execution-plane infrastructure,
  network defaults, host allowlists, secrets, filesystem mounts, and snapshot
  export safety.
- Web app implementation: route design, query hooks, realtime use, artifact
  preview limits, and empty/error states.
- Manifest schema versioning: canonical JSON rules, hash format, validation
  errors, approval permissions, and retirement semantics.
- Fork/capability inheritance: whether forked notebooks inherit equal-or-lesser
  capabilities and how approval works.
- Public runtime MCP: whether a future runtime must expose internal MCP and how
  that maps to the broker RPC.

## Validation Plan

- Run `pnpm validate:pr --branch feat/mcp-peer-notebook-control-plane` after
  adding the PR description JSON.
- Do not run `pnpm check:types` unless TypeScript files are touched.
- Manually review README links to this spec, the ADR, and diagrams.
- Re-check these invariants:
  - Runtime code cannot activate or expand its own manifest.
  - Broker denies unauthorized outbound calls before target execution.
  - Cloud Run never hosts KVM or smolvm execution.
  - The web app reads Supabase peer rows, not legacy `src/observatory`.
