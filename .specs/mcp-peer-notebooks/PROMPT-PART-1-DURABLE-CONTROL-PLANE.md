# Kickoff Prompt: ADR-022 Part 1/5 Durable Control Plane

Use this prompt to start the next implementation session.

```markdown
We are in the Thoughtbox repo on `main`.

Goal: implement ADR-022 Part 1/5, **Durable Control Plane**, tracked by user-selected tracker
issue `thoughtbox-y4x`.

First read:

- `AGENTS.md`
- `.claude/skills/peer-notebook-delivery-guard/SKILL.md`
- `.adr/staging/ADR-022.json`
- `.specs/mcp-peer-notebooks/README.md`
- `.specs/mcp-peer-notebooks/SPEC-CONTROL-PLANE.md`
- `.specs/mcp-peer-notebooks/NEXT-IMPLEMENTATION-HANDOFF.md`
- `src/peer-notebook/`
- `src/server-factory.ts`
- existing Supabase storage/migration patterns:
  - `supabase/migrations/`
  - `src/persistence/`
  - `src/knowledge/`
  - any current workspace-scoped Supabase repositories

Use the `peer-notebook-delivery-guard` skill. Classification:

- Unit: Durable Control Plane.
- ADR claims advanced: c1, c5; supports h1 and prepares h3.
- Spec sections touched: Supabase Table Contract, Artifact Payload Strategy,
  Invocation Flow, Broker Proxy Contract.
- Production capability expected: durable control-plane rows and artifact
  metadata/payload handling for the existing brokered mock peer pilot.
- Mocks/in-memory components involved: `InMemoryPeerNotebookRepository`,
  `MockPeerRuntimeProvider`.
- Explicit non-goals: web app pages, manifest graduation from real notebooks,
  `local-process`, smolvm, direct/public runtime MCP.
- Tracker reference: `thoughtbox-y4x`.

Scope:

1. Add Supabase migrations for peer notebook control-plane persistence:
   - `peer_notebooks`
   - `peer_manifests`
   - `peer_invocations`
   - `peer_trace_events`
   - `peer_artifacts`
   - storage bucket/path strategy for peer artifacts, if supported by existing
     migration conventions

2. Add a Supabase-backed implementation behind the existing peer notebook
   repository contract.

3. Wire hosted/Supabase mode so `thoughtbox_peer_notebook` uses durable peer
   notebook storage when workspace-scoped Supabase storage is available, while
   preserving in-memory behavior for local tests.

4. Keep `MockPeerRuntimeProvider` as a contract fixture only. Do not represent
   it as a production runtime implementation.

5. Preserve the current public MCP surface:
   - `peer_artifact_seed`
   - `peer_invoke`
   - `peer_get_invocation`
   - `peer_list_trace_events`
   - `peer_get_artifact`

6. Prove durable acceptance:
   - Seed an artifact.
   - Invoke `claim-extractor.extract_claims`.
   - Persist invocation row.
   - Persist allowed and denied trace events.
   - Persist output artifact metadata and payload/preview according to the v0
     artifact strategy.
   - Read invocation, trace events, and artifact back through
     `thoughtbox_peer_notebook`.

Mock accountability gate:

| Component | Real Capability It Stands In For | Current Scope | Required Outcome |
| --- | --- | --- | --- |
| `InMemoryPeerNotebookRepository` | durable peer notebook control-plane persistence | test/local only | replaced for Supabase mode by real repository |
| `MockPeerRuntimeProvider` | runtime execution provider | test/pilot only | retained as contract fixture; not production runtime |

Do not:

- Build Next.js pages.
- Implement notebook-derived manifest approval lifecycle.
- Implement `local-process`.
- Implement smolvm or production isolation.
- Add direct peer runtime MCP.
- Let in-memory repository satisfy Part 1 acceptance.

Acceptance criteria:

- Supabase migrations match `SPEC-CONTROL-PLANE.md` unless an explicit spec note
  explains a repo-convention adjustment.
- Workspace scoping is represented in schema and tests.
- Supabase repository passes contract tests equivalent to in-memory behavior.
- The MCP client flow can seed -> invoke -> list traces -> read artifact with
  durable storage in Supabase-backed mode.
- Invalid args still reject before runtime dispatch.
- Unknown trace invocation still returns `invocation_not_found`.
- Denied outbound call still records `denied_outbound_call` and does not reach
  a target.
- `MockPeerRuntimeProvider` remains test/pilot-only in docs and code comments.

Run:

- focused peer notebook tests
- relevant Supabase/migration tests or local reset/diff checks, depending on
  existing project conventions
- `pnpm check:types`
- `pnpm check:lint`
- `pnpm build:local`

Before finishing:

- Update `.specs/mcp-peer-notebooks/NEXT-IMPLEMENTATION-HANDOFF.md`.
- Update README/spec/ADR if implementation changes the documented contract.
- Complete the peer-notebook-delivery-guard report.
- File Tracker references for any deferred artifact payload, RLS, retention, or web
  app follow-up discovered during implementation.
- Close `thoughtbox-y4x` only if durable control-plane acceptance is genuinely
  met.
```
