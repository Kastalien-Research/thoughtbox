# MCP Peer Notebooks Implementation Handoff

**Status**: Post-merge handoff for ADR-022 remaining implementation
**Date**: 2026-04-30
**Governing ADR/spec**: ADR-022 and `SPEC-CONTROL-PLANE.md`
**Merged pilot branch**: `feat/peer-notebook-mcp-surface`
**Next unit**: ADR-022 Part 1/5 Durable Control Plane (`thoughtbox-y4x`)
**Kickoff prompt**: `PROMPT-PART-1-DURABLE-CONTROL-PLANE.md`

## Merged Baseline

The merged baseline on `main` includes the first MCP-facing mock peer notebook
surface:

- Public MCP tool: `thoughtbox_peer_notebook`.
- Supported operations:
  - `peer_artifact_seed`
  - `peer_invoke`
  - `peer_get_invocation`
  - `peer_list_trace_events`
  - `peer_get_artifact`
- Deterministic active `claim-extractor` peer per workspace.
- Manifest compilation/hashing from a static `peer.manifest.json` source.
- In-memory peer, manifest, invocation, trace, and artifact repository.
- Mock-only runtime through `MockPeerRuntimeProvider`.
- Broker proxy allow/deny behavior, including denied outbound trace events.
- MCP client coverage through `createMcpServer` and `InMemoryTransport`.
- Discovery surface through `thoughtbox://peer-notebook/pilot` and Code Mode
  search catalog public-tool metadata.
- Structured MCP error payloads preserving `PeerNotebookError.code` and
  `details`.
- Trace listing now rejects unknown invocation ids with `invocation_not_found`.
- Workspace bootstrap is serialized per workspace.

## Delivery Guard

Future work must use `.claude/skills/peer-notebook-delivery-guard/SKILL.md`.

Hard rule:

> Mocks are contract fixtures, not final substitutes.

Every remaining unit must list each mock, in-memory store, stubbed provider, or
local-only stand-in it touches and state whether that component was replaced,
narrowed to test/non-production use, or deferred with a Beads follow-up.

## Remaining Large Units

1. **Durable Control Plane** (`thoughtbox-y4x`)
   - Supabase migrations and repository implementation.
   - Durable peer notebooks, manifests, invocations, trace events, and artifacts.
   - Supabase Storage payload path or explicit bounded payload strategy.
   - Workspace-scoped durable seed -> invoke -> trace -> artifact acceptance.
   - Runtime may remain mock-only, but persistence cannot remain in-memory.

2. **Manifest Lifecycle And Notebook Graduation** (`thoughtbox-g5t`)
   - Compile `peer.manifest.json` from actual notebook sources.
   - Store drafts, approve/activate/retire manifests, and enforce active hash.
   - Prove notebook edits do not silently change active capabilities.

3. **Web App Inspection Surface** (`thoughtbox-2ot`)
   - Peer registry/detail.
   - Invocation list/detail.
   - Trace timeline with denied outbound calls.
   - Artifact preview from durable rows, not mock/local state.

4. **Real Runtime Provider Path** (`thoughtbox-s7f`)
   - Development-only `local-process` provider behind the runtime contract.
   - Contract parity with mock provider.
   - Explicit non-production isolation labeling.

5. **Production Isolation And Policy Hardening** (`thoughtbox-vdw`)
   - smolvm or equivalent isolated provider.
   - Enforced network, filesystem, secrets, outbound budget, and denial policy.
   - Mock/local-process cannot satisfy production acceptance.

## Part 1/5 Scope Lock

The next implementation unit is **Durable Control Plane**.

Do:

- Add Supabase-backed persistence behind the peer notebook repository contract.
- Add migrations for the ADR-022 table contract, adjusted only where current
  repo conventions require it.
- Preserve the broker facade and runtime provider boundary.
- Keep the mock runtime provider as a test/pilot fixture.
- Prove durable seed -> invoke -> trace -> artifact state.

Do not:

- Build web app pages.
- Implement `local-process`.
- Implement smolvm or production isolation.
- Add direct/public runtime MCP.
- Treat in-memory repository or mock runtime as final production behavior.

## Open Risks For Part 1/5

- Supabase table contract names may need small adaptation to match existing
  workspace scoping conventions.
- Artifact payload storage needs a bounded v0 choice: full Supabase Storage
  write if practical, or explicit metadata/preview-first behavior with a
  follow-up issue for full payload persistence.
- Repository tests must not pass solely against in-memory fixtures.
- The broker currently bootstraps a static `claim-extractor` manifest; Part 1
  should persist that active pilot state durably without claiming full notebook
  graduation.
