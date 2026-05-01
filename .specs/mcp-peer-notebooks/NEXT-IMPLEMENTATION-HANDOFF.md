# MCP Peer Notebooks Implementation Handoff

**Status**: ADR-022 Part 2/5 implementation handoff
**Date**: 2026-04-30
**Governing ADR/spec**: ADR-022 and `SPEC-CONTROL-PLANE.md`
**Merged pilot branch**: `feat/peer-notebook-mcp-surface`
**Implemented units**:

- ADR-022 Part 1/5 Durable Control Plane (`thoughtbox-y4x`)
- ADR-022 Part 2/5 Manifest Lifecycle And Notebook Graduation (`thoughtbox-g5t`)

**Next unit**: ADR-022 Part 3/5 Web App Inspection Surface (`thoughtbox-2ot`)

## Merged Baseline

The baseline includes the MCP-facing peer notebook surface:

- Public MCP tool: `thoughtbox_peer_notebook`.
- Supported operations:
  - `peer_artifact_seed`
  - `peer_invoke`
  - `peer_get_invocation`
  - `peer_list_trace_events`
  - `peer_get_artifact`
- Deterministic active `claim-extractor` peer per workspace.
- Manifest compilation/hashing from a static `peer.manifest.json` source.
- In-memory peer, manifest, invocation, trace, and artifact repository for
  local/test use.
- Supabase peer, manifest, invocation, trace, and artifact repository for
  hosted workspace-scoped mode.
- Private `peer-artifacts` Supabase Storage bucket for artifact payloads.
- Mock-only runtime through `MockPeerRuntimeProvider`, retained as a contract
  fixture rather than a production runtime.
- Broker proxy allow/deny behavior, including denied outbound trace events.
- MCP client coverage through `createMcpServer` and `InMemoryTransport`.
- Discovery surface through `thoughtbox://peer-notebook/pilot` and Code Mode
  search catalog public-tool metadata.
- Structured MCP error payloads preserving `PeerNotebookError.code` and
  `details`.
- Trace listing now rejects unknown invocation ids with `invocation_not_found`.
- Workspace bootstrap is serialized per workspace.
- Hosted `createMcpServer` construction selects `SupabasePeerNotebookRepository`
  when a non-default workspace is resolved from `workspaceId` or
  `THOUGHTBOX_PROJECT`, and `SUPABASE_URL` plus
  `SUPABASE_SERVICE_ROLE_KEY` are present; otherwise it preserves in-memory
  behavior.
- Durable artifact list/read paths return repository-contract peer slugs rather
  than Supabase UUID foreign keys.
- Supabase artifact writes validate invocation workspace/peer ownership before
  uploading payloads to Storage.

## Delivery Guard

Future work must use `.claude/skills/peer-notebook-delivery-guard/SKILL.md`.

Hard rule:

> Mocks are contract fixtures, not final substitutes.

Every remaining unit must list each mock, in-memory store, stubbed provider, or
local-only stand-in it touches and state whether that component was replaced,
narrowed to test/non-production use, or deferred with a Beads follow-up.

## Remaining Large Units

1. **Manifest Lifecycle And Notebook Graduation** (`thoughtbox-g5t`)
   - Compile `peer.manifest.json` from actual notebook sources.
   - Store drafts, approve/activate/retire manifests, and enforce active hash.
   - Prove notebook edits do not silently change active capabilities.

2. **Web App Inspection Surface** (`thoughtbox-2ot`)
   - Peer registry/detail.
   - Invocation list/detail.
   - Trace timeline with denied outbound calls.
   - Artifact preview from durable rows, not mock/local state.

3. **Real Runtime Provider Path** (`thoughtbox-s7f`)
   - Development-only `local-process` provider behind the runtime contract.
   - Contract parity with mock provider.
   - Explicit non-production isolation labeling.

4. **Production Isolation And Policy Hardening** (`thoughtbox-vdw`)
   - smolvm or equivalent isolated provider.
   - Enforced network, filesystem, secrets, outbound budget, and denial policy.
   - Mock/local-process cannot satisfy production acceptance.

## Part 1/5 Durable Control Plane Outcome

Implemented:

- Migration `supabase/migrations/20260430010000_create_peer_notebook_control_plane.sql`.
- `SupabasePeerNotebookRepository` behind the existing repository contract.
- Artifact metadata in `peer_artifacts`; payloads in private Supabase Storage
  bucket `peer-artifacts`.
- Workspace-scoped hosted wiring in `createMcpServer`.
- Supabase integration tests for durable seed -> invoke -> trace -> artifact
  readback, workspace isolation, invalid args before dispatch, denied outbound
  trace persistence, unknown trace invocation handling, atomic concurrent trace
  sequence allocation, hosted env-derived Supabase activation, peer slug
  read-model consistency, and pre-upload artifact scope validation. These tests
  skip when local Supabase does not have the new peer schema applied.
- Follow-up Beads issues filed:
  - `thoughtbox-kyc`: Add peer artifact retention enforcement.
  - `thoughtbox-a9f`: Add authenticated RLS coverage for peer notebook
    control-plane tables.

Spec-convention adjustments made in `SPEC-CONTROL-PLANE.md`:

- `peer_artifacts.invocation_id` and `peer_artifacts.peer_id` are nullable for
  seeded input artifacts.
- Artifact kind includes `text` for `peer_artifact_seed`.
- `peer_invocations.manifest_hash` is denormalized for the MCP read model.
- `storage_bucket='peer-artifacts'`; `storage_path` stores the object path
  inside that bucket.

## Part 2/5 Manifest Lifecycle Outcome

Implemented:

- Internal `PeerManifestLifecycleService` for notebook-derived manifest
  compilation and approval/activation. The public `thoughtbox_peer_notebook`
  MCP operation set is unchanged.
- v0 filename-cell adapter that extracts cells/files named
  `peer.manifest.json` into neutral `ManifestDraftSource` records without
  executing notebook code. This adapter is intentionally replaceable by a future
  first-class manifest cell type.
- Draft persistence through the existing peer notebook repository contract.
- Repository lifecycle methods for listing peer manifests and explicit
  approve+activate.
- Supabase migration
  `supabase/migrations/20260430020000_add_peer_manifest_activation_rpc.sql`
  with `approve_and_activate_peer_manifest(...)` to retire the prior active
  manifest, mark the target active with `approved_by`/`approved_at`, and update
  `peer_notebooks.active_manifest_id` atomically.
- In-memory lifecycle parity for local/test use.
- Tests proving malformed JSON rejection, duplicate source rejection, stable
  canonical hashes, draft invocation denial, explicit activation, active hash
  persistence on invocation, draft capability expansion denial, and prior active
  retirement.

Important decisions:

- Approval authority is modeled as workspace-admin/control-plane authority. The
  internal API requires a concrete `approvedBy` actor string and persists it for
  audit; it does not add a web UI or end-user permission model.
- The static `claim-extractor` bootstrap remains a pilot fallback only and does
  not satisfy notebook-derived lifecycle acceptance.

## Next Scope Lock

The next implementation unit is **Web App Inspection Surface**.

Do:

- Build peer registry/detail and invocation inspection views in the Next.js web
  app.
- Read peer, manifest, invocation, trace, and artifact state from durable
  Supabase rows.
- Show denied outbound calls in the trace timeline.
- Use artifact metadata/previews for list/detail views without unbounded payload
  downloads.
- Preserve the broker/runtime/lifecycle contracts unless ADR/spec changes are
  explicit.

Do not:

- Implement `local-process`.
- Implement smolvm or production isolation.
- Add direct/public runtime MCP.
- Read mock/local peer state for production web acceptance.
