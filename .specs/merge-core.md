---
spec_id: SPEC-MERGE-CORE
title: Merge Core — Collapse to Certainty (state machine, tb surface, approval API)
status: active
date: 2026-07-06
branch: feat/merge-evidence-core
claims:
  - id: c1
    statement: >-
      tb.merge.request creates a merge commit record that follows the fixed
      state machine request -> pending_evidence -> (verdict pass)
      pending_approval -> approved, or (verdict fail) pending_evidence ->
      blocked. approved and blocked are terminal; the only transition out of
      a terminal state is approved -> superseded, driven by the approval of
      a later merge commit. No other transition is accepted by any storage
      backend.
    type: behavioral
    behavioral: true
    required_evidence: >-
      Vitest state-machine suite (src/merge/__tests__) exercising every
      legal transition and rejecting every illegal one at both the handler
      and storage layers.
  - id: c2
    statement: >-
      A merge whose evidence carries no executable evidence references
      (verdict.evidenceRefs is empty — prose-only evidence) is legal, but
      the state machine clamps verdict.confidence to 'low' before
      persisting, regardless of the confidence the generator claimed.
    type: behavioral
    behavioral: true
    required_evidence: >-
      Test where the generator returns confidence 'high' with empty
      evidenceRefs and the persisted verdict has confidence 'low'.
  - id: c3
    statement: >-
      A failed evidence notebook blocks the merge: a verdict with decision
      "block", a generator crash, or a schema-invalid verdict transitions
      the record to status 'blocked' (terminal, immutable) with decided_at
      stamped. There is no 'contested' state in v1; recovery is a new merge
      request.
    type: behavioral
    behavioral: true
    required_evidence: >-
      Tests for decision "block", generator throw, and schema-invalid
      verdict, each ending in status 'blocked'.
  - id: c4
    statement: >-
      Approval is human-only. The only mutation that can set status
      'approved' is POST /api/merge/[id]/approve in apps/web, behind an
      authenticated Supabase user session with 'owner' membership in the
      merge's tenant workspace. The tb.merge.* surface exposes no approval
      operation and the merge domain handler has no approve code path.
    type: governance
    behavioral: true
    required_evidence: >-
      apps/web route tests (401/403/404/409/200 paths) plus absence of any
      approve operation in src/merge/operations.ts and the merge handler
      switch.
  - id: c5
    statement: >-
      Terminal records are immutable through the API: approving a blocked
      merge fails, re-approving an approved merge fails, and any transition
      whose compare-and-swap status guard misses fails without writing.
    type: behavioral
    behavioral: true
    required_evidence: >-
      Storage CAS tests and route 409 tests covering blocked-approve,
      double-approve, and stale transitions.
  - id: c6
    statement: >-
      Supersession never rewrites history. A new merge request may set
      baseRef to "merge:<priorMergeId>"; when that new merge commit is
      approved and the referenced commit is itself 'approved' at that
      moment, the referenced commit transitions approved -> superseded with
      superseded_by pointing at the new commit. No other field of the prior
      record changes; no record is ever deleted or edited in place.
    type: behavioral
    behavioral: true
    required_evidence: >-
      Test approving merge B with baseRef merge:<A> and asserting A becomes
      status 'superseded' with superseded_by=B.id and all other fields
      byte-identical.
  - id: c7
    statement: >-
      Merge evidence is auto-generated at request time through the
      MergeEvidenceGenerator seam, whose exact signature matches the
      SPEC-MERGE-EVIDENCE generator (snake_case wire record in,
      {notebookId, verdict, hash} out). Agents never hand-author merge
      evidence: the tb surface accepts no notebook id, verdict, or hash on
      request.
    type: implementation
    behavioral: false
    required_evidence: >-
      tb.merge.request input schema rejects evidence fields; seam in
      src/merge/evidence-generator.ts; wire-shape test asserting the
      generator receives the snake_case record.
  - id: c8
    statement: >-
      Merge commit storage is dual-backend: InMemoryMergeCommitStorage
      (local/tests) and SupabaseMergeCommitStorage over public.merge_commits
      implement the same MergeCommitStorage contract, including insert-only
      creation and status-guarded (CAS) transitions.
    type: implementation
    behavioral: false
    required_evidence: >-
      src/merge/in-memory-merge-storage.ts, src/merge/supabase-merge-storage.ts,
      and the supabase migration adding public.merge_commits.
  - id: c9
    statement: >-
      tb.merge.request, tb.merge.status, tb.merge.list, and
      tb.merge.claimDiff are registered in the Code Mode surface
      (execute-tool dispatcher, TB SDK types, search catalog); request,
      status, and list are callable end-to-end locally with the stub
      generator, and claimDiff dispatches to the claim-diff seam.
    type: implementation
    behavioral: true
    required_evidence: >-
      Code Mode end-to-end vitest driving tb.merge.* through
      thoughtbox_execute with an in-memory harness.
links:
  - .specs/merge-evidence.md
  - .specs/product-shape/PRODUCT-INTENT-AND-DIVERGENCE.md
  - .specs/product-shape/branches/001-merge-evidence-notebooks.md
  - .specs/agentic-runbooks.md
  - src/merge/
  - apps/web/src/app/api/merge/
---

# SPEC-MERGE-CORE: Merge Core — Collapse to Certainty

A **merge** in Thoughtbox is a finalized reasoning decision: a collapse to
certainty across competing branches. This spec defines the merge core: the
merge commit record, its state machine, the tb surface (`tb.merge.*`), the
human-only approval API, and the seams to the evidence generator.

The evidence generator itself (notebook assembly, executable evidence
cells, verdict derivation, evidence hashing, claim diff) is owned by
**SPEC-MERGE-EVIDENCE** (`.specs/merge-evidence.md`, module
`src/merge-evidence/`, PR #413). This spec does not duplicate it; it fixes
the enforcement semantics on the consuming side and the exact join points.

This is the top layer over claims + notebooks + hub. It is **not** a git
metaphor retrofitted onto the thought journal: the object of a merge is a
decision with replayable evidence, and the enforcement points (forced-low
confidence, evidence blocking, human-only approval, immutable history) are
what make the record trustworthy to a human auditor.

## Design contract (owner-approved, binding)

1. **Approval is HUMAN-ONLY.** Agents request merges; only the
   authenticated workspace owner approves, via the apps/web surface. No
   agent, peer, or validator auto-approval in v1.
2. **Prose-only merges are legal** but `confidence` is **forced to `low`**
   when the evidence notebook has no passing executable evidence cells.
3. **A failed evidence notebook BLOCKS the merge** (status `blocked`,
   immutable record). There is no "contested" state in v1.
4. **Evidence notebooks are AUTO-GENERATED** from the system template at
   merge-request time. Agents never hand-author merge evidence.
5. **Merge commits are immutable history**; supersede/revert happens via
   new commits on top, never rewrites.

## Data model

### Merge commit record

Storage-layer shape (snake_case = Postgres column names; the TS domain
type in `src/merge/types.ts` is camelCase, with `toMergeCommitWire()`
producing the snake_case wire form the evidence generator consumes):

| Field | Type | Notes |
|---|---|---|
| `id` | text PK | `merge-<uuid>` |
| `workspace_id` | text | Hub workspace (coordination space), like claims |
| `tenant_workspace_id` | uuid | SaaS workspace (`public.workspaces`) for tenant isolation; Supabase backend only |
| `parent_branch_ids` | jsonb string[] | Candidate branch heads being collapsed |
| `base_ref` | text, nullable | Base node / prior checkpoint. The prefix `merge:<id>` references a prior merge commit and arms supersession (see below) |
| `evidence_notebook_id` | text, nullable | Auto-generated evidence notebook; null only while `pending_evidence` (and on generator-crash blocks) |
| `evidence_hash` | text, nullable | Canonical SHA-256 of the evidence notebook snapshot (SPEC-MERGE-EVIDENCE c5) |
| `verdict` | jsonb, nullable | Structured merge verdict (schema below); null while `pending_evidence` and on generator-crash / invalid-verdict blocks |
| `status` | text | `pending_evidence \| blocked \| pending_approval \| approved \| superseded` |
| `requested_by` | text | Hub agentId of the requesting agent |
| `approved_by` | uuid, nullable | Human user id (`auth.users`); set only by the approval API |
| `created_at` | timestamptz | |
| `decided_at` | timestamptz, nullable | Stamped on entering a terminal decision (`approved` or `blocked`) |
| `superseded_by` | text, nullable | Set when a later approved merge supersedes this one |

### Verdict schema (frozen)

```json
{
  "decision": "string",
  "confidence": "low|medium|high",
  "mergedBranchIds": ["branch-id"],
  "rejectedBranchIds": ["branch-id"],
  "supersededNodeIds": ["node-id"],
  "evidenceRefs": ["artifact-or-cell-ref"],
  "dissent": [{ "branchId": "...", "summary": "...", "reasonNotMerged": "..." }],
  "conditions": ["string"],
  "reopenTriggers": ["string"]
}
```

All fields are required. The state machine re-validates the generator's
verdict against this schema (Zod, `src/merge/types.ts`); a schema-invalid
verdict is treated as failed evidence and blocks the merge (c3). The
system generator emits `decision` values `"merge"` and `"block"`
(SPEC-MERGE-EVIDENCE `MERGE_DECISION`).

## State machine

```
request ──> pending_evidence ──(decision != "block")──> pending_approval ──(human approves)──> approved
                    │                                                                              │
                    └──(decision "block" / crash / invalid verdict)──> blocked                     └──(later merge approved on top)──> superseded
```

Legal transitions — the complete set, enforced by
`assertMergeTransition(from, to)` in `src/merge/types.ts`, which every
storage backend calls inside its CAS transition:

| From | To | Actor |
|---|---|---|
| `pending_evidence` | `pending_approval` | system (evidence pass) |
| `pending_evidence` | `blocked` | system (evidence fail) |
| `pending_approval` | `approved` | human via apps/web only |
| `approved` | `superseded` | system, during approval of a superseding merge |

Everything else is illegal, including any transition out of `blocked` and
any second transition out of `approved` other than `superseded`.

Terminal semantics:

- `blocked` — final. Recovery is a **new** merge request; the blocked
  record is permanent evidence that the merge attempt failed.
- `approved` — final decision. It may later become `superseded` (pointer
  update + status flip only) but is never edited, re-decided, or deleted.
- `superseded` — final. `superseded_by` names the replacement.
- `pending_approval` has no rejection path in v1: the operator simply
  never approves. (Explicit human rejection is an open question below.)

Enforcement is layered:

1. **Handler** (`src/merge/merge-handler.ts`) only issues legal
   transitions.
2. **Storage CAS** — `transitionMergeCommit(id, expectedStatus, patch)`
   writes only if the record's current status equals `expectedStatus`
   (compare-and-swap; Postgres `UPDATE ... WHERE status = $expected`,
   in-memory equivalent). A missed guard throws and writes nothing (c5).
3. **Transition table** — both storage backends reject (from, to) pairs
   outside the table above, so even a buggy caller cannot mutate a
   terminal record.

## Evidence generation (join with SPEC-MERGE-EVIDENCE)

### Generator seam

`src/merge/evidence-generator.ts` fixes the seam the state machine calls
during `pending_evidence`. Its signature matches the real generator
(`src/merge-evidence/generate.ts`, SPEC-MERGE-EVIDENCE c2) exactly:

```ts
// Wire form: the frozen snake_case record subset the generator consumes.
type MergeCommitWire = {
  id: string; workspace_id: string; parent_branch_ids: string[];
  base_ref?: string; requested_by: string; /* + passthrough fields */
};

interface MergeEvidenceResult {
  notebookId: string;      // auto-generated evidence notebook
  verdict: MergeVerdict;   // frozen schema; re-validated by the handler
  hash: string;            // canonical sha256 of the evidence snapshot
  details?: unknown;       // additive diagnostics — never required here
}

interface MergeEvidenceGenerator {
  generateMergeEvidence(record: MergeCommitWire): Promise<MergeEvidenceResult>;
}
```

**The swap is a one-line join for the warden** (both branches merged):

```ts
// server-factory wiring — replaces createStubMergeEvidenceGenerator():
import { createMergeEvidenceGenerator } from "./merge-evidence/generate.js";
const evidenceGenerator = createMergeEvidenceGenerator({ notebooks: notebookHandler, claims: claimStorage });
```

The handler treats generator output adversarially (fail-safe defaults):

- generator **throws** → `blocked`, no verdict, `decided_at` stamped;
- `verdict` fails schema validation → `blocked` (notebook id + hash still
  recorded — the failure is auditable evidence);
- `verdict.decision === "block"` → `blocked`, with the blocking verdict
  persisted;
- `verdict.evidenceRefs` empty (prose-only) → confidence clamped to `low`
  (c2). The real generator already forces this (SPEC-MERGE-EVIDENCE c4);
  the clamp here is enforcement, not trust.

Until the branches are integrated, the wired implementation is
`createStubMergeEvidenceGenerator()` — a deterministic prose-only
generator returning `decision: "merge"` with empty `evidenceRefs`, so
every stub merge reaches `pending_approval` at forced-low confidence.

### Claim diff seam (`tb.merge.claimDiff`)

SPEC-MERGE-EVIDENCE c6 ships `diffBranchClaims`
(`src/merge-evidence/claim-diff.ts`) but could not register it (this spec
owns the tb.merge.* registration block). The read op is registered here
behind a seam:

```ts
// MergeHandlerOptions.claimDiff — warden join (both branches merged):
import { claimsForBranch, diffBranchClaims } from "./merge-evidence/claim-diff.js";
const claimDiff = async ({ workspaceId, branchA, branchB }) => {
  const [claimsA, claimsB, edges] = await Promise.all([
    claimsForBranch(claimStorage, workspaceId, branchA),
    claimsForBranch(claimStorage, workspaceId, branchB),
    claimStorage.listEdges({ kind: "contradicts" }),
  ]);
  return diffBranchClaims({ branchA, claimsA, branchB, claimsB, contradictsEdges: edges });
};
```

`tb.merge.claimDiff({ workspaceId, branchA, branchB })` is read-only and
returns the `BranchClaimDiff` shape (added / removed / shared /
superseded / contradicting). When the seam is not wired, it returns a
clear error naming this join point.

## Code Mode surface (`tb.merge.*`)

Registered in `src/code-mode/execute-tool.ts` (dispatcher),
`src/code-mode/sdk-types.ts` (SDK types), and
`src/code-mode/search-index.ts` (catalog). Identity rides the shared hub
session registry: `tb.merge.request` requires a registered agent identity
(first `tb.hub.register`/`quickJoin` of the session, or explicit
`agentId`); `status`, `list`, and `claimDiff` are reads.

- `tb.merge.request({ workspaceId, branchIds, baseRef? })` — creates the
  record (`pending_evidence`), runs evidence generation synchronously, and
  returns the record in its post-evidence state (`pending_approval` or
  `blocked`). `baseRef` of the form `merge:<id>` must reference an
  existing merge commit in the same workspace.
- `tb.merge.status({ mergeId })` — returns the record.
- `tb.merge.list({ workspaceId, status? })` — records for a hub workspace,
  ordered `created_at` ascending then id.
- `tb.merge.claimDiff({ workspaceId, branchA, branchB })` — claim-level
  branch diff (seam above).

There is **no** `tb.merge.approve`, by design (c4).

## Approval API (apps/web — the only approval surface)

Both routes run under the authenticated Supabase session client (RLS
applies) in `apps/web/src/app/api/merge/`.

### `GET /api/merge?workspaceSlug=<slug>&status=<status?>`

Lists merge commits for the caller's workspace (any membership role).
`status` is optional (e.g. `pending_approval` for the review inbox).

- `200` → `{ "merges": MergeCommitRow[] }` — raw snake_case rows as in
  the data-model table above.
- `400` missing/invalid `workspaceSlug` or `status` → `{ "error": string }`
- `401` unauthenticated → `{ "error": string }`
- `404` workspace not found or caller is not a member → `{ "error": string }`

### `POST /api/merge/[id]/approve`

Human approval. Requires `owner` role in the merge's tenant workspace.

Behavior:

1. `401` when unauthenticated.
2. `404` when the merge commit is not visible to the caller.
3. `403` when the caller is not an `owner` of the tenant workspace.
4. CAS update `pending_approval -> approved`, setting `approved_by` (the
   user id) and `decided_at`. When the guard misses: `409` with
   `{ "error": string, "status": <currentStatus> }` (covers approving
   blocked records and double-approval, c5).
5. Supersession (c6): when the approved record's `base_ref` is
   `merge:<priorId>` and that prior record is currently `approved`, CAS it
   `approved -> superseded` with `superseded_by = <newly approved id>`.
   If the prior record is not `approved` at this moment, no supersession
   occurs (best-effort, recorded in the response).
6. `200` → `{ "merge": MergeCommitRow, "superseded": string | null }`.

## Storage backends (c8)

- `InMemoryMergeCommitStorage` (`src/merge/in-memory-merge-storage.ts`) —
  tests/local; structural copies on read/write, insert-only `create`,
  CAS transitions, transition-table enforcement.
- `SupabaseMergeCommitStorage` (`src/merge/supabase-merge-storage.ts`) —
  `public.merge_commits`, tenant-scoped by `tenant_workspace_id` exactly
  like `SupabaseClaimStorage`. CAS via
  `UPDATE ... WHERE id = ? AND tenant_workspace_id = ? AND status = ?`.
  Uses locally declared row types (not the generated `Database` type)
  until the gated migration lands and types are regenerated.
- Migration: `supabase/migrations/20260706000000_add_merge_commits_table.sql`
  — held in a separate final commit, gated on the DB-parity ruling. RLS:
  service_role full access; workspace-membership SELECT; workspace-owner
  UPDATE (the approval path for the authenticated web client).

## Non-goals / open questions (v1)

- No explicit human "reject" action for `pending_approval` (candidate for
  v1.1; today the operator just never approves and later merges make the
  request moot).
- No retry operation for `blocked` evidence generation — issue a new
  request.
- No conflict detection between concurrently `pending_approval` merges
  over overlapping branches.
- The notebook mode, template, cell contracts, hash recomputation, and
  claim-extraction fallbacks are specified by SPEC-MERGE-EVIDENCE, not
  here.
