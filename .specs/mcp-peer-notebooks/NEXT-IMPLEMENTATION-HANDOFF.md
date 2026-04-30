# MCP Peer Notebooks Implementation Handoff

**Status**: Next implementation handoff after mock claim-extractor pilot
**Date**: 2026-04-30
**Governing ADR/spec**: ADR-022 and `SPEC-CONTROL-PLANE.md`
**Completed slice**: `src/peer-notebook/` mock control-plane pilot
**Completed issue**: `thoughtbox-nb5`

## Where We Are

The first implementation slice is merged on `main`.

It added `src/peer-notebook/` with:

- `peer.manifest.json` draft compilation as data, with Zod validation.
- Stable canonical JSON hashing as `sha256:<hex>`.
- Domain types for peer notebooks, manifests, invocations, traces, artifacts,
  provider contracts, and broker errors.
- In-memory repositories for the pilot control-plane records.
- Broker facade shape: `peer.invoke({ peerId, tool, args })`.
- Runtime provider interface and mock `claim-extractor` provider.
- Broker-proxy allow/deny behavior for outbound calls.
- Focused tests for invalid args, inactive manifests, active manifest hash use,
  allowed artifact reads, denied outbound tracing, timeout handling, canonical
  hashing, and `claims.json` artifact output.

What it does **not** do yet:

- It does not register a Thoughtbox MCP tool.
- It does not create a real `claim-extractor` peer at server startup.
- It does not persist peer state in Supabase.
- It does not add web app pages.
- It does not add local-process, smolvm, or public/direct runtime MCP.

## Next Move

Implement the smallest MCP-facing pilot surface for the merged mock broker.

The goal is to let an agent call the mock `claim-extractor` through the
Thoughtbox MCP server, while still keeping persistence in-memory and execution
mock-only. This proves the broker is reachable through the product control
plane before adding Supabase migrations or real runtime execution.

## Recommended Next Slice

1. Create a new branch from `main`, likely:

   ```bash
   git checkout main
   git pull --ff-only
   git checkout -b feat/peer-notebook-mcp-surface
   ```

2. Create and claim a Beads issue for the MCP surface slice.

3. Add a peer notebook MCP tool surface. Prefer a new tool rather than
   overloading `thoughtbox_notebook`, for example:

   ```ts
   thoughtbox_peer_notebook({
     operation: "peer_invoke" | "peer_artifact_seed" | "peer_get_invocation" | "peer_list_trace_events" | "peer_get_artifact",
     ...
   })
   ```

   Keep the public operation names plain and stable. Do not expose direct
   runtime MCP.

4. Add a `PeerNotebookHandler` or equivalent wrapper around the existing
   `src/peer-notebook/` broker:

   - bootstraps a deterministic in-memory `claim-extractor` peer and active
     manifest for the current workspace/session;
   - seeds text artifacts for testing/manual invocation;
   - calls `peer.invoke({ peerId, tool, args })`;
   - returns invocation id, manifest hash, typed result, and artifact refs;
   - exposes read helpers for invocation, trace events, and artifacts from the
     in-memory repository.

5. Wire the new tool through `src/server-factory.ts` so it participates in the
   same workspace/project resolution path as the other tools.

6. Add tests proving:

   - the MCP tool is registered by the server factory;
   - `peer_artifact_seed` creates an input text artifact in the current
     workspace;
   - `peer_invoke` can invoke `claim-extractor.extract_claims` through the MCP
     handler and returns a `claims.json` artifact reference;
   - invalid args still fail before runtime dispatch;
   - denied outbound calls remain visible via `peer_list_trace_events`;
   - no local-process or smolvm provider is used.

## Defer

- Supabase migrations and RLS.
- Web app routes/pages.
- Local subprocess notebook runtime provider.
- smolvm execution plane.
- Public/direct runtime MCP.
- Capability inheritance or notebook forking semantics.

## Watchouts

- Cloud Run remains API/control plane only.
- The MCP tool should call the broker facade, not a runtime provider directly.
- The mock provider stays deterministic and test-only.
- Runtime code cannot activate or expand its manifest.
- Denied outbound calls must be trace-visible.
- Use "web app" for deployed product surfaces, not "Observatory".
- Do not introduce tracked Beads credential files.

## Prompt For The Next Implementation Chat

```text
We are in the Thoughtbox repo. Continue MCP Peer Notebooks after the merged
mock claim-extractor control-plane pilot.

First read:
- AGENTS.md
- .specs/mcp-peer-notebooks/README.md
- .specs/mcp-peer-notebooks/SPEC-CONTROL-PLANE.md
- .specs/mcp-peer-notebooks/NEXT-IMPLEMENTATION-HANDOFF.md
- .adr/staging/ADR-022.json
- src/peer-notebook/
- src/server-factory.ts

Important context:
- The first mock-only control-plane slice is already merged under
  src/peer-notebook/.
- ADR-022 and SPEC-CONTROL-PLANE.md remain governing docs.
- Cloud Run remains API/control plane only. Do not host KVM/smolvm execution.
- Current notebooks use subprocess execution and are not secure sandboxes.
- Use "web app," not "Observatory," for deployed/product surfaces.
- Do not introduce tracked Beads credential files.

Task:
Create a new branch from main, create/claim a Beads issue, then implement the
smallest MCP-facing pilot surface for the existing mock peer broker.

Implementation target:
- Add a Thoughtbox MCP tool surface for peer notebooks, preferably a new
  thoughtbox_peer_notebook tool rather than overloading thoughtbox_notebook.
- Support minimal operations:
  - peer_artifact_seed: create an in-memory text artifact for the current
    workspace/session.
  - peer_invoke: call peer.invoke({ peerId, tool, args }) through the broker.
  - peer_get_invocation: read invocation state.
  - peer_list_trace_events: read trace events for an invocation.
  - peer_get_artifact: read artifact metadata/preview/content from memory.
- Add a handler that bootstraps a deterministic in-memory active
  claim-extractor peer manifest using the existing compilePeerManifestDraft()
  and mock runtime provider.
- Wire the new tool through src/server-factory.ts so it uses normal workspace
  resolution.
- Keep persistence in-memory for this slice.
- Keep execution mock-only.

Tests:
- tool registration is visible through the server factory;
- peer_artifact_seed creates an input text artifact;
- peer_invoke invokes claim-extractor.extract_claims and returns a claims.json
  artifact reference;
- invalid args are rejected before runtime dispatch;
- denied outbound calls are visible via peer_list_trace_events;
- local-process and smolvm providers are not used.

Run:
- pnpm exec vitest run src/peer-notebook src/server-factory.ts
- pnpm check:types
- pnpm check:lint
- pnpm build:local

Defer:
- Supabase migrations
- web app pages
- local-process provider
- smolvm provider
- public/direct runtime MCP
```
