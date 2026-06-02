# Kickoff Prompt: ADR-022 Part 2/5 Manifest Lifecycle And Notebook Graduation

Use this prompt to start the next implementation session.

```markdown
We are in the Thoughtbox repo on `main`.

Goal: implement ADR-022 Part 2/5, **Manifest Lifecycle And Notebook
Graduation**, tracked by Tracker reference `thoughtbox-g5t`.

Step 0: Source-of-truth preflight

Before implementation, use `.codex/skills/source-of-truth-preflight/SKILL.md`.

Produce the preflight report before editing code. In particular:

- identify all live notebook models
- decide which notebook model is canonical for Part 2
- classify legacy notebook shapes as legacy-live or adapter-only
- map each acceptance criterion to a type/schema/parser/repository command/RPC/broker guard/test
- list illegal lifecycle states and whether they are impossible by type or rejected at a boundary
- justify any new type/service/schema against existing notebook engine/domain code

Default assumption to validate: `src/notebook/engine/domain.ts` is the canonical notebook domain model for new lifecycle work. Do not build Part 2 on `src/notebook/types.ts` unless the preflight explicitly justifies it as an adapter boundary.


First read:

- `AGENTS.md`
- `.claude/skills/peer-notebook-delivery-guard/SKILL.md`
- `.adr/staging/ADR-022.json`
- `.specs/mcp-peer-notebooks/README.md`
- `.specs/mcp-peer-notebooks/SPEC-CONTROL-PLANE.md`
- `.specs/mcp-peer-notebooks/NEXT-IMPLEMENTATION-HANDOFF.md`
- `src/peer-notebook/`
- `src/notebook/`
- `src/server-factory.ts`
- `supabase/migrations/20260430010000_create_peer_notebook_control_plane.sql`
- existing notebook storage/export patterns and tests

Use the `peer-notebook-delivery-guard` skill. Classification:

- Unit: Manifest Lifecycle And Notebook Graduation.
- ADR claims advanced: c2; supports c1 and c5; proves h2.
- Spec sections touched: Manifest Source And Lifecycle, Invocation Flow,
  Supabase Table Contract, Smallest Viable Pilot.
- Production capability expected: notebook-authored `peer.manifest.json`
  drafts are parsed as data, stored durably, explicitly approved/activated,
  retired/rejected where applicable, and enforced by active manifest hash during
  invocation.
- Mocks/in-memory components involved:
  - `InMemoryPeerNotebookRepository`: local/test contract path only.
  - `MockPeerRuntimeProvider`: runtime contract fixture only.
  - static `claim-extractor` bootstrap manifest: should no longer satisfy
    notebook-derived manifest graduation acceptance.
- Explicit non-goals: web app pages, `local-process`, smolvm, production
  isolation, direct/public runtime MCP, runtime-provider expansion.
- Tracker reference: `thoughtbox-g5t`.

Scope:

1. Add a notebook-derived manifest lifecycle behind the existing peer notebook
   contracts:
   - locate a `peer.manifest.json` file or cell in an actual notebook source
   - parse it as data without executing notebook code
   - reject malformed JSON
   - reject duplicate manifest sources
   - canonicalize and hash the validated manifest
   - persist draft manifests

2. Add explicit control-plane transitions:
   - draft -> approved/active
   - active -> retired when superseded, if that matches the existing schema
   - rejected draft path if the current repository patterns support it
   - update `peer_notebooks.active_manifest_id` only on explicit activation

3. Enforce active-manifest behavior:
   - draft manifests cannot be invoked
   - unapproved capability expansion cannot be invoked
   - notebook edits after activation do not silently change active capabilities
   - invocation records keep the active manifest id/hash used for dispatch

4. Preserve the current public MCP surface unless the ADR/spec is explicitly
   updated:
   - `peer_artifact_seed`
   - `peer_invoke`
   - `peer_get_invocation`
   - `peer_list_trace_events`
   - `peer_get_artifact`

5. Add only the smallest admin/control-plane surface needed for the lifecycle
   acceptance. Prefer repository/handler APIs and tests first. Do not build web
   app pages in this unit.

6. Keep `MockPeerRuntimeProvider` as a contract fixture only. Do not represent
   it as a production runtime implementation.

Acceptance criteria:

- Manifest compilation from notebook source never executes notebook code.
- A valid `peer.manifest.json` draft is persisted with stable canonical hash.
- Equivalent JSON produces the same hash.
- Malformed JSON rejects with a structured manifest compile error.
- Duplicate manifest sources reject.
- Draft manifests cannot be invoked.
- Approval/activation updates `peer_notebooks.active_manifest_id`.
- Invocation loads and persists the active manifest hash, not the latest draft.
- Editing a notebook manifest after activation does not change active
  invocation behavior until recompiled and explicitly activated.
- Capability expansion in a draft is denied before runtime dispatch.
- Workspace scoping is represented in schema/repository tests.
- Supabase repository and in-memory repository have equivalent lifecycle
  contract tests where feasible.
- Existing durable seed -> invoke -> trace -> artifact flow remains green.
- Invalid args still reject before runtime dispatch.
- Denied outbound call still records `denied_outbound_call` and does not reach
  a target.

Mock accountability gate:

| Component | Real Capability It Stands In For | Current Scope | Required Outcome |
| --- | --- | --- | --- |
| `InMemoryPeerNotebookRepository` | durable manifest lifecycle persistence | test/local only | lifecycle parity tests, not production acceptance |
| `MockPeerRuntimeProvider` | runtime execution provider | test/pilot only | retained as contract fixture; not production runtime |
| static `claim-extractor` bootstrap manifest | notebook-derived manifest graduation | pilot bootstrap only | narrowed or replaced so Part 2 acceptance uses notebook-derived manifests |

Do not:

- Build Next.js pages.
- Implement `local-process`.
- Implement smolvm or production isolation.
- Add direct peer runtime MCP.
- Let the static bootstrapped manifest satisfy notebook-derived manifest
  graduation acceptance.
- Treat notebook subprocess execution as a secure boundary.

Run:

- focused peer notebook manifest/repository/broker tests
- Supabase-backed manifest lifecycle tests or local reset checks, following
  existing project conventions
- existing peer notebook MCP flow tests
- `pnpm check:types`
- `pnpm check:lint`
- `pnpm build:local`

Before finishing:

- Update `.specs/mcp-peer-notebooks/NEXT-IMPLEMENTATION-HANDOFF.md`.
- Update README/spec/ADR if implementation changes the documented contract.
- Complete the peer-notebook-delivery-guard report.
- File Tracker references for any deferred approval UI, RLS, manifest permission,
  notebook export/versioning, or runtime-provider follow-up discovered during
  implementation.
- Close `thoughtbox-g5t` only if notebook-derived manifest lifecycle acceptance
  is genuinely met.
```
