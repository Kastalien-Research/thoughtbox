---
spec_id: SPEC-CONTROL-PLANE
title: MCP Peer Notebooks Control Plane
status: active
date: 2026-04-30
branch: feat/mcp-peer-notebook-control-plane
claims:
  - id: c1
    statement: The peer broker is the sole externally visible authority for peer invocation and validates workspace, active manifest, tool schema, budgets, and outbound allowlists before runtime dispatch
    type: governance
    behavioral: false
    required_evidence: SPEC-CONTROL-PLANE.md defines peer.invoke and the invocation flow with all listed checks before runtime provider invocation. Outbound governance is exercised against real targets by the v1-initiative Phase 5.2 slice. createBrokerProxyTargets (src/peer-notebook/proxy-targets.ts) registers thoughtbox.knowledge.queryGraph and thoughtbox.session.get against the real knowledge and session handlers, threaded from src/server-factory.ts through PeerNotebookHandler.proxyTargetDeps; the mayCall allowlist remains the only gate and absent handlers raise target_unavailable through the broker error path. Evidence is src/peer-notebook/__tests__/proxy-targets.test.ts (allowed calls return real handler data with an outbound_call_allowed trace, unlisted targets are denied with a denied_outbound_call trace, absent handlers fail the invocation with target_unavailable)
  - id: c2
    statement: Peer notebook manifests are externalized control-plane records compiled from peer.manifest.json, parsed as data without executing notebook code, and activated only by explicit approval
    type: governance
    behavioral: false
    required_evidence: Implemented by the thoughtbox-g5t lifecycle slice. peer_manifest_create persists drafts; peer_manifest_approve activates and retires the previous active manifest; peer_manifest_reject finalizes drafts; the broker rejects non-active manifests naming their status. Evidence is src/peer-notebook/__tests__/manifest-lifecycle.test.ts plus the durable lifecycle test in src/peer-notebook/__tests__/supabase-repository.test.ts. The built-in claim-extractor bootstrap is the documented platform-owned exception (PLATFORM_BUILTIN_BOOTSTRAP_MANIFEST_STATUS in src/peer-notebook/handler.ts). Notebook graduation (v1-initiative Phase 5.4) compiles the manifest from a real notebook's peer.manifest.json code cell as pure data - graduateNotebook in src/peer-notebook/handler.ts parses cell text with the same zod compile path, never executing notebook code, always persisting status draft, and rejecting unregistered runtime providers/entries at graduation. Evidence is src/peer-notebook/__tests__/notebook-graduation.test.ts plus the durable graduation test in src/peer-notebook/__tests__/supabase-repository.test.ts
  - id: c3
    statement: Cloud Run remains the MCP API/control plane; peer execution runs in a separate execution plane behind a runtime provider contract
    type: governance
    behavioral: false
    required_evidence: Non-goals and invariants exclude KVM/smolvm execution from Cloud Run and place smolvm behind the runtime provider boundary. The v1-initiative Phase 5.3 slice (thoughtbox-s7f) delivers the first real provider behind that boundary - LocalProcessRuntimeProvider (src/peer-notebook/local-process-runtime-provider.ts) executes peer invocations in a spawned child process, declares developmentOnly true with isolation "none" in describe(), and production wiring registers only local-process (PeerNotebookHandler.getRuntimeProviderNames). Local-process is process separation for development, never a production isolation claim; production isolation remains the deferred smolvm unit (thoughtbox-vdw)
  - id: c4
    statement: The v0 runtime contract is a simple provider RPC, not a requirement that every runtime expose public MCP directly
    type: implementation
    behavioral: false
    required_evidence: Runtime Provider Contract section defines describe, invoke, cancel, snapshot/export, and heartbeat as v0 RPC. Two providers implement the contract - the test-only MockPeerRuntimeProvider fixture (excluded from the package barrel, imported only by tests) and the development-only LocalProcessRuntimeProvider. The shared contract suite src/peer-notebook/__tests__/runtime-provider-contract.test.ts runs the same end-to-end claim-extractor invocation, lifecycle, and allow/deny trace assertions against both, plus local-process budget-timeout and cancel kill tests (SPEC-V1-INITIATIVE c14 evidence)
  - id: c5
    statement: The peer data model is Supabase-backed with peer notebooks, manifests, invocations, trace events, and artifact metadata in Postgres, while full artifact payloads live in Supabase Storage
    type: implementation
    behavioral: false
    required_evidence: Supabase Table Contract and Artifact Payload Strategy sections define tables and hybrid storage
  - id: c6
    statement: The deployed product inspection surface is the Next.js web app reading Supabase peer rows, not the legacy src/observatory server
    type: governance
    behavioral: false
    required_evidence: DIAGRAMS.md and spec define the web app read model without depending on src/observatory
links:
  - docs/decisions/archive/adr/staging/ADR-022.json
  - .specs/mcp-peer-notebooks/DIAGRAMS.md
---

# MCP Peer Notebooks Control Plane


MCP Peer Notebooks are brokered, manifest-governed notebook runtimes. The
control plane lives in the Cloud Run MCP API, owns peer authority, persists
state in Supabase, and presents inspection data through the Next.js web app.
Peer execution runs elsewhere through a runtime provider.

This spec started as the decision-complete ADR-022 staging spec and now also
records implementation notes for delivered slices. It still governs the
control-plane contract; code, migrations, and web app routes land in separate
implementation units.

Implementation note: the `thoughtbox-39o` follow-on slice adds the first
MCP-facing pilot surface, `thoughtbox_peer_notebook`, for the existing in-memory
mock `claim-extractor` broker. It proves broker reachability through the MCP
server without changing the deferred Supabase, web app, local-process, smolvm,
or public/direct runtime MCP scope.

Implementation note: the `thoughtbox-y4x` durable control-plane slice adds the
Supabase migration and `SupabasePeerNotebookRepository` behind the existing
repository contract. Hosted workspace-scoped server construction selects this
repository when an effective non-default workspace id is available from
`workspaceId` or `THOUGHTBOX_PROJECT`, and `SUPABASE_URL` plus
`SUPABASE_SERVICE_ROLE_KEY` are present; local tests keep the in-memory
repository. The runtime provider remains the mock contract fixture for this
slice.

Implementation note: the `thoughtbox-g5t` manifest lifecycle slice implements
the draft-to-active transitions on the `thoughtbox_peer_notebook` surface:
`peer_manifest_create` compiles `peer.manifest.json` content into a
`status='draft'` record (registering the peer if new), `peer_manifest_approve`
transitions draft to active, sets `approved_at`, updates
`peer_notebooks.active_manifest_id`, and retires the previously active
manifest, `peer_manifest_reject` transitions draft to rejected, and
`peer_manifest_list` reads versions and statuses. Both repositories persist
transitions through the shared contract (`listManifests` added; no schema
change — the existing `peer_manifests.status` and `approved_at` columns carry
the lifecycle). The broker names the offending status when rejecting
non-active manifests. The built-in `claim-extractor` bootstrap is the single
documented exception that ships active out of the box
(`PLATFORM_BUILTIN_BOOTSTRAP_MANIFEST_STATUS` in `src/peer-notebook/handler.ts`);
approval is a plain operation in v1 (single-operator trust model, no roles).
Notebook-source graduation (compiling drafts from real notebook cells) is
delivered by the v1-initiative Phase 5.4 slice (see implementation note below).

Implementation note: the v1-initiative Phase 5.2 slice populates the broker
proxy target map with real outbound handlers. `createBrokerProxyTargets`
(`src/peer-notebook/proxy-targets.ts`) registers
`thoughtbox.knowledge.queryGraph` (knowledge handler `query_graph`) and
`thoughtbox.session.get` (session handler `get`), threaded from the server
factory through `PeerNotebookHandler.proxyTargetDeps`. Targets are optional
dependencies: when a backing handler is absent (for example, knowledge storage
failed to initialize), the target raises a `target_unavailable` error through
the broker's existing invocation error path instead of crashing. The `mayCall`
allowlist and allow/deny trace machinery are unchanged and remain the only
gate; the built-in claim-extractor manifest still allows only `artifact.get`.

Implementation note: the v1-initiative Phase 5.3 slice (`thoughtbox-s7f`)
delivers the development-only `local-process` runtime provider
(`src/peer-notebook/local-process-runtime-provider.ts`). The provider executes
the peer tool invocation in a spawned child process: the claim-extractor entry
is a standalone script (`src/peer-notebook/peers/claim-extractor.ts`) that
reads `{ invocationId, tool, args, artifactContent }` JSON on stdin and writes
`{ result, artifacts }` JSON to stdout, porting the mock's deterministic
claim-extraction logic so both providers produce identical output. Manifests
gain an optional `runtime.entry` field naming an executable entry; the
provider resolves entries from a fixed script registry, so manifests can never
point at arbitrary filesystem paths. Broker-proxied outbound calls (the
`artifact.get` input fetch and the pilot denied probe) happen in the provider
before spawning, preserving allow/deny trace semantics; in-child broker calls
are out of scope for v1. The manifest budget (`budgets.maxDurationMs`) is
enforced on the child via SIGTERM escalating to SIGKILL, and `cancel()` kills
the child the same way. Production wiring registers only `local-process`;
`MockPeerRuntimeProvider` is now a test-only fixture removed from the package
barrel. Existing workspaces whose platform-owned claim-extractor manifest was
bootstrapped with `provider: "mock"` are reconciled in place at bootstrap
(platform builtin record only). `local-process` is process separation for
development, never production isolation - that remains the smolvm unit
(`thoughtbox-vdw`).

Implementation note: the v1-initiative Phase 5.4 slice completes the
`thoughtbox-g5t` unit with notebook graduation. `peer_graduate_notebook`
(`graduateNotebook` in `src/peer-notebook/handler.ts`) takes a `notebookId`,
reads the notebook through a read-only `PeerGraduationNotebookSource` lookup
(the `NotebookHandler` in production wiring), and compiles the manifest from
the notebook's draft cell. The cell convention is the least-new-concept
mapping of this spec's "JSON cell or file named `peer.manifest.json`" rule
onto the existing notebook model: the manifest lives in a **code cell whose
`filename` is exactly `peer.manifest.json`**, and the cell's source TEXT is
parsed as JSON through the same `compilePeerManifestDraft` zod path used by
`peer_manifest_create` (`compiledFrom.sourceType = "cell"`). Graduation never
executes notebook code - no eval, no module import, no cell run. Graduated
manifests are ALWAYS `status='draft'` (the platform-builtin direct-to-active
exception does not apply); 5.1 approval governs activation. Graduation
validates the runtime binding up front: the declared `runtime.provider` must
be the registered provider, and providers with a fixed entry registry
(`RuntimeProvider.resolvesEntry`, implemented by `local-process`) must resolve
`runtime.entry` at graduation - an unregistered entry is rejected with a clear
error instead of failing at first invoke. The manifest's `notebookId` must
match the graduating notebook. `mayCall` allowlists are accepted as declared,
bounded by schema validation. Re-graduating a notebook creates a new draft
version and supersedes the prior pending cell-sourced draft for that peer
(retired, no longer approvable), mirroring 5.1's retire-on-approve
supersession; operator-created file drafts are untouched, and the
duplicate-hash rejection still applies. Evidence:
`src/peer-notebook/__tests__/notebook-graduation.test.ts` (graduate -> draft
blocked at invoke -> approve -> end-to-end local-process invoke of the
registered claim-extractor entry, supersession, malformed JSON, missing
manifest cell, schema violation, unregistered entry, missing entry, wrong
provider, notebookId mismatch, unknown notebook) and the durable graduation
test in `src/peer-notebook/__tests__/supabase-repository.test.ts`.

## Non-Goals

- Do not implement peer runtime code in this control-plane persistence slice.
- Do not add Supabase migrations outside the ADR-022 peer control-plane schema.
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

In the implemented notebook model (`src/notebook/types.ts`), the draft source
is a code cell whose `filename` is exactly `peer.manifest.json`; graduation
(`peer_graduate_notebook`) parses the cell's source text as JSON without
running any cell.

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
- `runtime.entry` (optional executable entry name; required by providers that
  resolve scripts from a fixed registry, such as `local-process`. Manifests
  name an entry, never a filesystem path.)
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

- `mock`: test-only contract fixture; never registered in production wiring.
- `local-process` (delivered, default): child-process execution for
  integration development only; process separation, not a security boundary.
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
- `manifest_hash text not null`: denormalized active manifest hash for the
  MCP read model
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
- `invocation_id uuid null`: nullable for seeded/imported input artifacts that
  exist before a peer invocation
- `peer_id uuid null`: nullable for unowned seeded input artifacts
- `kind text not null`: `notebook_export|json|text|log|dataset|report|binary`
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

Supabase convention adjustment: the storage bucket is named `peer-artifacts`.
`peer_artifacts.storage_path` stores the object path inside that bucket:

```text
{workspace_id}/{peer_id|unowned}/{invocation_id|seeded}/{artifact_id}/{name}
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