---
spec_id: SPEC-MERGE-EVIDENCE
title: Merge Evidence Notebooks — auto-generated evidence packets for reasoning merges
status: draft
date: 2026-07-06
branch: feat/merge-evidence-notebook
claims:
  - id: c1
    statement: merge_evidence is an implemented notebook mode — notebook_start_run executes its cells through the real subprocess path and derives a verdict (retagged MergeEvidenceRunResult); all other non-runbook modes still reject start_run.
    type: behavioral
    behavioral: true
    required_evidence: engine.test.ts visibility + rejection tests green; merge-evidence generation tests exercise start_run in merge_evidence mode.
  - id: c2
    statement: generateMergeEvidence(record) assembles the evidence notebook from the merge-evidence system template at merge-request time (agents never hand-author it) and returns {notebookId, verdict, hash} where verdict validates against the frozen verdict schema.
    type: behavioral
    behavioral: true
    required_evidence: src/merge-evidence/__tests__/generate.test.ts — two-branch claim fixture produces a persisted notebook, replaying cells, and a MergeVerdictSchema-valid verdict.
  - id: c3
    statement: Any failing executable evidence cell (failing outcome contract, crossing contradiction, or failing branch validator) yields a blocking verdict (decision "block", all parent branches rejected).
    type: behavioral
    behavioral: true
    required_evidence: generate.test.ts contradiction-block and failing-validator tests.
  - id: c4
    statement: When the evidence notebook has no passing executable evidence cells (prose-only merge — input capture does not count as evidence), the verdict is still produced with confidence FORCED to "low".
    type: behavioral
    behavioral: true
    required_evidence: generate.test.ts empty-evidence test (decision merge, confidence low, prose-only condition).
  - id: c5
    statement: The evidence hash is a canonical sha256 (contract-hashing machinery, hashJson) over the persisted snapshot (exported .src.md, compiled contract hashes, verdict, run summary); recomputation over the persisted state reproduces it and any tampering changes it.
    type: behavioral
    behavioral: true
    required_evidence: generate.test.ts hash recomputation + tamper assertions.
  - id: c6
    statement: A claim-level branch diff (added/removed/shared/superseded/contradicting via typed contradicts edges) exists as an internal function feeding the evidence cells; it is not registered as a tb op in this unit (code-mode registration is a warden request).
    type: implementation
    behavioral: false
    required_evidence: src/merge-evidence/claim-diff.ts + diffBranchClaims unit tests.
---

# SPEC: Merge Evidence Notebooks

Blueprint: `.specs/product-shape/branches/001-merge-evidence-notebooks.md` (exploratory branch, now partially graduated). Owner-approved design contract (2026-07-06 rebuild-night brief) is BINDING:

- Approval is HUMAN-ONLY; agents request merges, the workspace owner approves via apps/web.
- Prose-only merges are legal but `confidence` is FORCED to `low` when no passing executable evidence cells exist.
- A failed evidence notebook BLOCKS the merge (no "contested" state in v1).
- Evidence notebooks are AUTO-GENERATED from the system template at merge-request time.
- Merge commits are immutable; supersede/revert via new commits.

## Section: Evidence Generator (owner: merge-evidence)

**Module**: `src/merge-evidence/` — `generateMergeEvidence(record, deps) → { notebookId, verdict, hash, details }` (frozen triple + additive diagnostics), `createMergeEvidenceGenerator(deps)` for a bound generator.

**Notebook mode**: `merge_evidence`, IMPLEMENTED in the mode registry (`src/notebook/engine/registry.ts`); `notebook_start_run` shares the runbook execution body (ordered cells, B5 gate, tier-1 contracts, tier-2 validators) and retags the output `MergeEvidenceRunResult`. System template: `templates/merge-evidence-template.src.md` (`merge-evidence`).

**Generated cells** (order (a)(b)(d)(c), verdict (e) appended after the run so validator evidence is collected before the contradiction gate halts):

| Cell | Content | Contract |
|---|---|---|
| (a) input capture | merge id, workspace, parent branch heads, base ref, requester | emitted inputs eq the merge record |
| (b) claim extraction | per-branch claim sets (claim graph via the `branch:<branchId>` evidenceRef convention, or the claim-extractor peer seam for prose-only branches) + pairwise diffs | totalClaims eq generation-time count; structural schema |
| (d) validator invocation | branch-attached validator cells run through ValidatorService (snapshot-hash verified) with the branch claim set as observed data | allPassed eq true |
| (c) contradiction scan | RECOMPUTES crossings of `contradicts` edges between branch claim sets from baked inputs | crossingCount eq 0 |
| (e) verdict | frozen-schema verdict JSON, emitted by a real executed cell | — (verdict validated by zod in the generator) |

**Verdict derivation**: evidence run fails or does not complete ⇒ `decision: "block"` (confidence `high` when deterministic evidence failed, `low` when the run could not complete); run passes ⇒ `decision: "merge"` with confidence `low` (no evidence cells) / `medium` (claim evidence) / `high` (validators passed). `dissent[]` names branches implicated by crossings/failing validators; `supersededNodeIds` from the diff; `reopenTriggers` from active claim ids (capped at 20).

**Evidence hash**: `computeMergeEvidenceHash` over `{ schemaVersion, mergeId, srcmd, contractHashes[], verdict, run }` using `hashJson` (canonicalize → sha256 — the same machinery outcome contracts are compiled/verified with, B4a). Exported `.src.md` encoding is deterministic (sources only), so recomputation over the persisted artifact + stored verdict verifies `evidence_hash`.

**Branch association convention (v1)**: a claim belongs to a branch when an evidenceRef is `branch:<branchId>` (or prefixed `branch:<branchId>/`); override via `deps.claimsForBranch`.

## Section: Merge state machine (owner: merge-core) — NOT LANDED YET

merge-core's spec section had not landed when this unit merged. Join points built against the frozen brief contract:

- Merge record: `id, workspace_id, parent_branch_ids[], base_ref?, evidence_notebook_id, evidence_hash, verdict, status ∈ {pending_evidence, blocked, pending_approval, approved, superseded}, requested_by, approved_by?, created_at, decided_at?, superseded_by?`.
- During `pending_evidence`, merge-core calls `generateMergeEvidence(record)` and maps `notebookId → evidence_notebook_id`, `hash → evidence_hash`, `verdict → verdict`; `decision === "block"` ⇒ `blocked` (final), otherwise ⇒ `pending_approval` (human approval via `POST /api/merge/[id]/approve`).
- Dependency wiring: `MergeEvidenceDeps` needs the process-wide `NotebookHandler` and `ClaimStorage`; optional seams — `branchValidators` (branch → runbook validator cells), `branchProse` + `extractClaims` (brokered claim-extractor peer).

## Warden requests (registration hotspots not touched by this unit)

- Expose the claim-level branch diff as a read op (suggested `tb.merge.claimDiff` inside merge-core's tb.merge.* block, or `tb.claims.diff`): `src/code-mode/execute-tool.ts`, `src/code-mode/sdk-types.ts`, `src/code-mode/search-index.ts` are owned by other agents tonight.
