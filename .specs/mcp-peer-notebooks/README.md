# MCP Peer Notebooks

**Status**: Research note / ADR-022 index
**Created**: 2026-04-30
**Current implementation**: Mock control-plane pilot merged in `src/peer-notebook/`

## HDD Artifacts

- ADR: [ADR-022 Brokered MCP Peer Notebook Control Plane](../../.adr/staging/ADR-022.json)
- Spec: [SPEC-CONTROL-PLANE.md](./SPEC-CONTROL-PLANE.md)
- Diagrams: [DIAGRAMS.md](./DIAGRAMS.md)
- Implementation handoff: [NEXT-IMPLEMENTATION-HANDOFF.md](./NEXT-IMPLEMENTATION-HANDOFF.md)
- Tracking issue: `thoughtbox-pnf`
- Mock pilot issue: `thoughtbox-nb5`

## Summary

MCP peer notebooks are a proposed new runtime class for Thoughtbox. They are
not ordinary notebooks with an extra flag. They are manifest-governed,
brokered notebook runtimes that can expose typed MCP tools/resources and can
call approved MCP tools through a control-plane broker.

The goal is to let a coordinated fleet of notebooks perform durable,
auditable work without requiring the primary agent to drive every internal
reasoning step through Thoughtbox. Thoughtbox becomes the control substrate:
workspace auth, peer registry, capability enforcement, invocation routing,
trace persistence, artifact metadata, and web app inspection.

## Current Repo Reality

Confirmed current capabilities:

- Thoughtbox MCP server runs through the Streamable HTTP entrypoint in
  `src/index.ts`.
- Multi-tenant deployed mode is selected with `THOUGHTBOX_STORAGE=supabase`.
  In that mode, each MCP session receives workspace-scoped Supabase storage
  instances.
- `SupabaseStorage` and `SupabaseKnowledgeStorage` exist and are scoped by
  `workspaceId` at instantiation. They currently use service-role Supabase
  clients plus application-level workspace filtering, not the older
  custom-JWT/project-column design from the staging ADR.
- The Next.js web app is the product observability surface. It reads sessions,
  thoughts, OTEL events, and related workspace data from Supabase, and uses
  Supabase Realtime for live thought updates.
- The older `src/observatory/` HTTP/WebSocket/HTML server still exists as a
  local/internal event UI, but for this feature discussion "Observatory" should
  be translated to "the web app" unless a separate local-only path is
  explicitly intended.
- Current notebooks support title, markdown, `package.json`, and JavaScript or
  TypeScript code cells. They can create/list/load notebooks, add/update/list/get
  cells, run cells, install dependencies, validate cells against observed JSON,
  and export `.src.md`.
- Current notebook execution writes files into a temp directory and runs
  commands with `child_process.spawn`: `node`, `npx tsx`, or `pnpm install`.
- Code Mode uses Node `vm` for JavaScript orchestration and explicitly treats it
  as defense-in-depth, not a true security boundary.
- `src/peer-notebook/` now contains the first mock-only control-plane slice:
  manifest draft compilation from `peer.manifest.json`, canonical manifest
  hashing, in-memory peer/manifest/invocation/trace/artifact repositories,
  `peer.invoke({ peerId, tool, args })`, a runtime provider interface, a mock
  `claim-extractor` provider, and broker-proxy allow/deny policy tests.
- Existing specs already point toward related directions:
  - `.specs/thoughtbox-v1-finalstretch/SPEC-NOTEBOOK-RLM.md`
  - `.specs/SPEC-SRC-002-preview-lifecycle.md`
  - `.specs/SPEC-SRC-004-type-safe-environment.md`
  - `.specs/agent-governance-substrate/SPEC-SEVEN-LAYER-ARCHITECTURE.md`
  - `.specs/agent-governance-substrate/SPEC-THOUGHTBOX-SLEEP-TIME.md`

Important non-capabilities today:

- The peer broker is not yet exposed through the Thoughtbox MCP server, so
  external callers cannot invoke `claim-extractor` through a real MCP tool.
- Peer notebook state is still in-memory only; there are no Supabase
  migrations or durable peer/artifact tables yet.
- There is no web app view for peer invocations, peer traces, or peer
  artifacts.
- There is no local-process provider, secure isolated execution boundary, or
  smolvm integration.
- There is no public/direct runtime MCP surface.

## Product Concept

An MCP peer notebook is a durable notebook-owned tool server. It may contain an
agent, deterministic code, an evaluator, a scraper, or a mixed workflow, but
the external contract is owned by the notebook, not by an ephemeral chat agent.

Example peers:

- `research-notebook`: consumes approved search/source tools; exposes
  `extract_claims`, `summarize_corpus`, `rank_sources`.
- `eval-notebook`: consumes benchmark/proctor tools; exposes `run_eval`,
  `score_candidate`, `compare_runs`.
- `implementation-notebook`: consumes repo/build/test tools; exposes
  `apply_patch_candidate`, `run_test_plan`.
- `review-notebook`: consumes diffs and eval outputs; exposes
  `review_findings`, `risk_summary`.
- `memory-notebook`: consumes Thoughtbox knowledge/session tools; exposes
  `retrieve_context`, `write_learning`, `detect_drift`.

The top-level agent, scheduler, or workflow invokes these peers through typed
MCP contracts. It does not need to micromanage every internal step.

## Core Invariants

1. Not every notebook is a peer notebook.
2. Every peer notebook has an explicit capability manifest.
3. Canonical manifests live outside the notebook runtime.
4. Runtime code cannot grant itself new capabilities.
5. All inbound calls go through a Thoughtbox-owned broker facade.
6. All outbound MCP calls from a peer go through a broker proxy.
7. There is no implicit full mesh between peer runtimes.
8. Externally meaningful state is captured as artifacts, traces, registry
   metadata, and exported notebook state.
9. Notebook runtime state may be persistent, but it is not the source of truth
   for governance.
10. Reasoning is optional; observable work is mandatory.

## Proposed Architecture

```text
User / Agent / Scheduler
        |
        v
Thoughtbox MCP API / Broker on Cloud Run
  workspace auth
  peer registry
  manifest enforcement
  brokered MCP invocation
  trace + artifact metadata writes to Supabase
        |
        v
Peer Runtime Execution Plane
  local mock provider for tests
  smolvm provider on GCE/GKE nested-virt workers
        |
        v
Peer Notebook Runtime
  notebook files
  internal MCP server/client adapter
  manifest projection
  artifact writer
        |
        v
Next.js Web App
  peer registry views
  invocation trace graph
  artifact/result inspection
  live updates via Supabase Realtime where useful
```

Cloud Run remains the API/control plane. It should not host KVM-backed
microVMs. If smolvm is used, it belongs in a separate execution plane on
infrastructure that exposes the required virtualization support, such as
Compute Engine nested virtualization or a compatible GKE Standard node pool.

## Broker Surfaces

External callers should not connect directly to a peer runtime's internal MCP
server. They should call a Thoughtbox-owned facade:

```ts
await tb.peer.invoke({
  peerId: "research-notebook",
  tool: "extract_claims",
  args: { corpusArtifactId: "artifact_123" }
})
```

The broker resolves the peer, checks workspace access, checks the manifest,
routes to the runtime provider, records the trace, stores artifact metadata,
and returns a typed result.

Internally, a peer runtime may still implement an MCP server and use an MCP
client proxy. The point is that the externally visible authority remains in
Thoughtbox.

## Minimal Manifest Shape

```json
{
  "schemaVersion": "peer-notebook.v0",
  "peerId": "research-notebook",
  "notebookId": "nb_123",
  "runtime": {
    "provider": "local|smolvm",
    "image": "node:22-alpine",
    "cpus": 2,
    "memoryMiB": 2048,
    "timeoutMs": 120000
  },
  "exposes": {
    "tools": [
      {
        "name": "extract_claims",
        "description": "Extract atomic claims from a corpus artifact",
        "inputSchema": {
          "type": "object",
          "properties": {
            "corpusArtifactId": { "type": "string" }
          },
          "required": ["corpusArtifactId"]
        },
        "outputSchema": {
          "type": "object",
          "properties": {
            "claimsArtifactId": { "type": "string" },
            "claimCount": { "type": "number" }
          },
          "required": ["claimsArtifactId", "claimCount"]
        }
      }
    ],
    "resources": [],
    "prompts": []
  },
  "mayCall": {
    "mcpTools": [
      "thoughtbox.knowledge.queryGraph",
      "thoughtbox.session.get",
      "artifact.get"
    ]
  },
  "network": {
    "enabled": true,
    "allowHosts": ["registry.npmjs.org"]
  },
  "filesystem": {
    "mounts": [
      {
        "name": "workspace",
        "mode": "rw",
        "target": "/workspace"
      }
    ]
  },
  "secrets": {
    "bindings": []
  },
  "persistence": {
    "snapshot": "manual",
    "exportNotebookOnInvoke": true,
    "retainArtifactsDays": 30
  },
  "budgets": {
    "maxDurationMs": 120000,
    "maxToolCalls": 10,
    "maxArtifactBytes": 10000000
  }
}
```

This is a Thoughtbox manifest, not a direct Smolfile schema. Some fields can
compile to smolvm concepts if smolvm is selected as a provider. Verified smolvm
concepts include OCI image selection, opt-in networking, host allowlists,
volumes, init commands, SSH-agent forwarding, and CPU/memory overrides. Other
runtime controls should be verified before promising them.

## Trace Requirements

The trace should be tool-call centered and web-app friendly.

Minimum event:

```json
{
  "traceId": "ptr_...",
  "eventType": "peer_tool_call",
  "timestamp": "2026-04-30T00:00:00.000Z",
  "workspaceId": "ws_...",
  "caller": {
    "type": "agent|scheduler|peer",
    "id": "agent_123"
  },
  "callee": {
    "peerId": "research-notebook",
    "tool": "extract_claims"
  },
  "manifestHash": "sha256:...",
  "argsHash": "sha256:...",
  "resultHash": "sha256:...",
  "status": "completed|failed|denied|timeout",
  "durationMs": 18423,
  "cost": {
    "toolCalls": 3,
    "runtimeMs": 18423
  },
  "artifacts": [
    {
      "artifactId": "artifact_...",
      "name": "research-notebook.src.md",
      "mimeType": "text/markdown"
    },
    {
      "artifactId": "artifact_...",
      "name": "claims.json",
      "mimeType": "application/json"
    }
  ],
  "parentTraceId": null
}
```

For v0, `argsHash` and `resultHash` can be canonical JSON SHA-256. Raw payloads
should live in artifact storage or typed result records, not necessarily inside
the trace row.

## Needed New Domains

Likely MCP/server-side module:

```text
src/peer-notebook/
  types.ts
  manifest.ts
  registry.ts
  broker.ts
  tool.ts
  operations.ts
  trace.ts
  runtime-provider.ts
  runtime-local.ts
  runtime-smolvm.ts
```

Likely runtime package:

```text
runtimes/peer-notebook/
  package.json
  src/server.ts
  src/client-proxy.ts
  src/tools/extract-claims.ts
  Smolfile
```

Likely web app additions:

```text
apps/web/src/app/w/[workspaceSlug]/peers/
apps/web/src/components/peer-notebooks/
apps/web/src/lib/peer-notebooks/
```

Likely Supabase additions:

- `peer_notebooks`
- `peer_manifests`
- `peer_invocations`
- `peer_trace_events`
- `peer_artifacts` plus a payload storage decision

## 2026-04-30 Architecture Refinement

The working model is now: **Cloud Run is the MCP API and peer control plane;
peer execution is a separate runtime plane.** Cloud Run may authenticate,
authorize, route, persist, inspect, and schedule peer work. It must not be
treated as the place where KVM-backed or smolvm execution happens. If smolvm is
used, it belongs behind a runtime-provider interface on infrastructure that
actually supports the required isolation.

This also means "Observatory" in older notes should be translated to **the web
app** for product/deployed planning. The local `src/observatory/` server can
remain a local/internal tool, but the peer-notebook MVP should surface registry,
invocation, trace, and artifact data through the Next.js app querying Supabase.

### Refined Core Invariants

1. A peer notebook is a governed runtime identity, not just a notebook flag.
2. Ordinary notebooks remain untrusted subprocess scratchpads unless explicitly
   graduated.
3. The manifest is the authority boundary; runtime code is never its own
   authority.
4. Canonical manifests live in control-plane state, versioned and hashed outside
   the runtime.
5. Inbound invocation always enters through the broker. No caller talks directly
   to a peer runtime.
6. Outbound MCP/tool/resource access always exits through a broker proxy.
7. The broker decides workspace, manifest version, caller identity, tool
   allowlist, budgets, and runtime provider before dispatch.
8. Runtime state may be resumable or cacheable, but it is not the governance
   source of truth.
9. Observable work is mandatory: invocation rows, trace events, artifact
   metadata, manifest hashes, and status transitions.
10. Reasoning artifacts are optional and policy-controlled; typed outputs and
    operational traces are required.
11. Cloud Run hosts the API/control plane, not KVM/smolvm execution.
12. smolvm must be swappable behind the same provider contract as mock/local
    providers.

### Broker / Control Plane Responsibilities

The broker should be a Thoughtbox-owned server module, likely under
`src/peer-notebook/`, exposed as an MCP toolhost/facade from Cloud Run.

Responsibilities:

- Resolve caller workspace/auth from the existing MCP request context.
- Resolve peer by workspace and stable peer slug/id.
- Select active manifest version and verify its hash.
- Validate invocation args against the exposed tool schema before runtime start.
- Enforce `mayCall`, network, secret, filesystem, duration, tool-call,
  artifact-size, and concurrency budgets.
- Create the invocation row before dispatch and update terminal status after
  completion, denial, timeout, failure, or cancellation.
- Route work to a runtime provider: `mock`, `local-process`, and later a
  smolvm-backed execution plane.
- Issue scoped broker-proxy credentials for outbound peer calls.
- Record trace events for broker decisions, runtime lifecycle, outbound tool
  calls, denied calls, and produced artifacts.
- Store artifact metadata in Postgres and artifact payloads in the selected
  payload backend.
- Provide a web-app query shape that does not depend on legacy
  `src/observatory`.

### Peer Runtime Contract

For v0, do not require public MCP exposure from the runtime. A small
provider-neutral runtime RPC is enough and can later wrap an internal MCP
server/client adapter.

Minimum contract:

- `describe()` returns runtime build info and the manifest hash the runtime
  believes it is serving.
- `invoke({ invocationId, tool, args, brokerProxyUrl, scopedToken, budgets })`
  executes one exposed operation.
- `cancel({ invocationId })` performs best-effort cancellation.
- `snapshot/export({ invocationId })` returns `.src.md` and declared artifact
  refs where enabled.
- `heartbeat({ peerRuntimeId, invocationId })` reports liveness/progress.

Runtime obligations:

- Refuse to start if its manifest hash does not match the broker-supplied
  manifest.
- Never accept arbitrary tool calls except the broker-selected exposed
  operation.
- Use the broker proxy for all Thoughtbox/MCP outbound calls.
- Return only schema-valid typed results plus artifact references.
- Emit structured progress/trace events or allow the provider to capture them.
- Treat notebook subprocess execution as unsafe unless the selected provider
  supplies a real isolation boundary.

### Supabase Data Model Sketch

Use workspace-scoped tables consistent with the existing Supabase product schema
and web app query model.

`peer_notebooks`

- `id uuid`
- `workspace_id uuid`
- `slug text`
- `display_name text`
- `description text`
- `source_notebook_ref jsonb`
- `status text`: `draft|active|disabled|archived`
- `active_manifest_id uuid null`
- timestamps
- unique `(workspace_id, slug)`

`peer_manifests`

- `id uuid`
- `workspace_id uuid`
- `peer_id uuid`
- `version int`
- `schema_version text`
- `manifest jsonb`
- `manifest_hash text`
- `status text`: `draft|approved|active|retired|rejected`
- `created_by`, `approved_by`, `approved_at`
- unique `(peer_id, version)`
- unique `(peer_id, manifest_hash)`

`peer_invocations`

- `id uuid`
- `workspace_id uuid`
- `peer_id uuid`
- `manifest_id uuid`
- `caller_type text`
- `caller_id text null`
- `parent_invocation_id uuid null`
- `tool_name text`
- `args_hash text`
- `result_hash text null`
- `status text`: `queued|running|completed|failed|denied|timeout|cancelled`
- `started_at`, `completed_at`, `duration_ms`
- `runtime_provider text`
- `runtime_instance_id text null`
- `error jsonb null`
- `result jsonb null` for small typed results only

`peer_trace_events`

- `id uuid`
- `workspace_id uuid`
- `invocation_id uuid`
- `seq bigint`
- `event_type text`
- `severity text`
- `timestamp_at timestamptz`
- `body text null`
- `attrs jsonb`
- index `(workspace_id, invocation_id, seq)`

`peer_artifacts`

- `id uuid`
- `workspace_id uuid`
- `invocation_id uuid`
- `peer_id uuid`
- `kind text`: `notebook_export|json|log|dataset|report|binary`
- `name text`
- `mime_type text`
- `byte_size bigint`
- `sha256 text`
- `storage_backend text`
- `storage_path text`
- `preview jsonb null`
- `retention_expires_at timestamptz null`

Artifact payloads should not live in trace rows. Small previews may live in
`peer_artifacts.preview`; full payload storage is a separate HDD decision
between Supabase Storage, Postgres JSONB for small artifacts, GCS, or a hybrid.

### Web App Surface

Add a workspace-level "Peers" section to the Next.js app. Minimum views:

- Peer registry: peer name, status, active manifest version/hash, last
  invocation, failure rate.
- Peer detail: manifest summary, exposed tools, `mayCall` allowlist, budgets,
  runtime provider.
- Invocation list: filter by peer, tool, status, date, and caller.
- Invocation detail: trace timeline, args/result hashes, denied outbound calls,
  runtime lifecycle, artifacts.
- Artifact viewer: inline JSON/text/markdown previews plus `.src.md` notebook
  export inspection.
- Live updates via Supabase Realtime where useful, mirroring the current
  workspace-scoped thought subscription pattern.

### Smallest Viable Pilot

Pilot one peer, one manifest, one operation, one allowed outbound call, one
artifact, and one web-app inspection path.

Candidate peer: `claim-extractor`

```text
peer.extract_claims({ textArtifactId })
  -> broker validates workspace, manifest, args, and budget
  -> mock/local provider invokes peer runtime
  -> peer reads one input artifact through broker proxy
  -> peer writes claims.json artifact
  -> broker records invocation, trace events, denied-call behavior, and artifact metadata
  -> web app renders invocation detail and artifact preview
```

Success condition: an unlisted outbound call is denied before execution,
recorded as a trace event, and visible in the web app.

smolvm is deliberately not part of the first pilot. It becomes meaningful only
after broker invariants, manifest enforcement, trace persistence, artifact
metadata, and web-app inspection all work with a mock/local provider.

### HDD Work Required Before Implementation

This feature should not jump straight from this research note to code. Required
ADR/spec units:

1. Brokered Peer Notebook Architecture: authority boundaries, manifest
   lifecycle, invocation routing, and provider abstraction.
2. Supabase Peer Data Model: tables, RLS, indexes, retention, and artifact
   payload storage decision.
3. Runtime Provider Contract: mock/local/smolvm boundary, cancellation,
   heartbeat, result validation, and broker proxy semantics.
4. Web App Peer Observability: routes, query model, realtime scope, and artifact
   preview contract.
5. Security/Isolation Decision: current notebooks are subprocess runtimes, not
   secure sandboxes; smolvm requires a separate execution plane.
6. Pilot Spec: exact `claim-extractor` flow, acceptance criteria, and validation
   tests.

## Suggested Pilot

Do not start with a fleet. Start with one peer, one exposed operation, one
allowed outbound tool, one trace, and one durable artifact.

Pilot flow:

```text
Thoughtbox invokes peer.extract_claims()
  -> broker checks workspace auth and manifest
  -> broker starts/resumes runtime through local mock provider
  -> peer executes deterministic notebook workflow
  -> peer calls one approved outbound MCP-like tool through broker proxy
  -> broker records invocation trace
  -> peer returns typed result
  -> Thoughtbox stores artifact metadata and exported .src.md
  -> web app displays invocation, trace, result, and artifacts
```

Provider sequence:

1. Local mock provider for schema, broker, trace, and web app work.
2. Local process provider only if helpful for integration testing.
3. smolvm provider after the broker invariants are already enforced.

## HDD Candidate Hypotheses

If this moves from research note to implementation, stage a proper ADR/spec
pair with hypotheses like:

- **H1**: A brokered peer invocation can enforce a manifest allowlist before any
  runtime code is invoked.
- **H2**: A peer runtime can expose one typed operation and return a typed
  result plus artifact references without direct external MCP exposure.
- **H3**: A peer runtime can make one approved outbound tool call only through
  the broker proxy, with denied calls recorded as trace events.
- **H4**: The web app can render peer invocations from Supabase trace/artifact
  rows without depending on the local `src/observatory` server.
- **H5**: A smolvm-backed provider can execute the same peer runtime contract
  with network disabled by default and explicit host allowlists.

## Open Questions

- Artifact payload location: resolved for v0 by ADR-022. Store metadata and
  previews in Postgres, and full payloads in Supabase Storage.
- Manifest authoring: resolved for v0 by ADR-022. Authors may embed a
  `peer.manifest.json` draft in the notebook; the control plane parses it as
  data, stores a draft manifest, and requires explicit approval before use.
- Fork inheritance: deferred. Equal-or-lesser capability inheritance needs a
  separate HDD decision before implementation.
- Notebook version versus manifest version: partially resolved. The active
  manifest hash controls peer capabilities. `.src.md` exports and runtime
  snapshots are artifacts; their exact version relation is deferred to the
  runtime/provider spec.
- Runtime MCP requirement: resolved for v0 by ADR-022. Use a simple runtime
  provider RPC first; public/direct runtime MCP is deferred.
- MVP web app views: resolved for the pilot by ADR-022. Build registry, peer
  detail, invocation list/detail, trace timeline, and artifact preview from
  Supabase rows.
- smolvm contract: deferred behind the runtime provider boundary. The pilot
  proves broker invariants with mock/local providers before smolvm work.
