/**
 * Merge Evidence Notebook — types for the auto-generated evidence packet
 * attached to every reasoning merge (.specs/product-shape/branches/
 * 001-merge-evidence-notebooks.md, frozen by the merge-evidence design
 * contract).
 *
 * The merge-record shape below is a THIN local declaration of the frozen
 * interface owned by merge-core (`tb.merge.*`). merge-core's state machine
 * calls `generateMergeEvidence(record)` during `pending_evidence` and maps
 * the result onto the merge record: `evidence_notebook_id = notebookId`,
 * `evidence_hash = hash`, `verdict = verdict`; a blocking verdict transitions
 * the record to `blocked` (final), a passing one to `pending_approval`
 * (human-only approval via apps/web).
 */

import { z } from "zod";
import type { Claim, ClaimStorage } from "../claims/types.js";
import type { NotebookHandler } from "../notebook/index.js";

// ---------------------------------------------------------------------------
// Merge record input (frozen interface — thin declaration until merge-core lands)
// ---------------------------------------------------------------------------

/**
 * The subset of the frozen merge-record shape (`id, workspace_id,
 * parent_branch_ids[], base_ref?, ... requested_by`) the evidence generator
 * consumes. Extra fields on the real record are ignored (passthrough).
 */
export const MergeEvidenceRecordSchema = z
  .object({
    id: z.string().min(1),
    workspace_id: z.string().min(1),
    parent_branch_ids: z.array(z.string().min(1)).min(1),
    base_ref: z.string().optional(),
    requested_by: z.string().min(1),
  })
  .passthrough();

export type MergeEvidenceRecordInput = z.infer<typeof MergeEvidenceRecordSchema>;

// ---------------------------------------------------------------------------
// Verdict (EXACT frozen schema — common brief / 001-merge-evidence-notebooks.md)
// ---------------------------------------------------------------------------

export const MergeVerdictSchema = z
  .object({
    decision: z.string(),
    confidence: z.enum(["low", "medium", "high"]),
    mergedBranchIds: z.array(z.string()),
    rejectedBranchIds: z.array(z.string()),
    supersededNodeIds: z.array(z.string()),
    evidenceRefs: z.array(z.string()),
    dissent: z.array(
      z.object({
        branchId: z.string(),
        summary: z.string(),
        reasonNotMerged: z.string(),
      }),
    ),
    conditions: z.array(z.string()),
    reopenTriggers: z.array(z.string()),
  })
  .strict();

export type MergeVerdict = z.infer<typeof MergeVerdictSchema>;

/** Decision values this generator emits. `decision` stays a string in the frozen schema. */
export const MERGE_DECISION = { merge: "merge", block: "block" } as const;

// ---------------------------------------------------------------------------
// Generator dependencies and result
// ---------------------------------------------------------------------------

/** Reference to a validator cell attached to a branch's runbook/notebook. */
export interface BranchValidatorRef {
  notebookId: string;
  cellId: string;
  /** Pin the validator snapshot (Ulysses pattern); mismatch fails the invocation. */
  expectedSnapshotHash?: string;
}

/** A claim extracted from branch prose by the claim-extractor peer (not in the claim graph). */
export interface ExtractedClaim {
  id: string;
  text: string;
}

export interface MergeEvidenceDeps {
  /** Real notebook handler: cells are added and executed through the public surface. */
  notebooks: NotebookHandler;
  /** Claim graph reads (per-branch claim sets + contradicts edges). */
  claims: ClaimStorage;
  /**
   * Override the branch→claims association. Default: a claim belongs to a
   * branch when one of its evidenceRefs is `branch:<branchId>` or starts
   * with `branch:<branchId>/` (see claim-diff.ts).
   */
  claimsForBranch?: (workspaceId: string, branchId: string) => Promise<Claim[]>;
  /**
   * Claim-extractor peer seam: used only when a branch carries NO stored
   * claims and `branchProse` yields text. The deterministic sentence-split
   * peer (src/peer-notebook/peers/claim-extractor.ts) satisfies this shape;
   * wiring the brokered peer is a merge-core/warden join point.
   */
  extractClaims?: (text: string) => Promise<ExtractedClaim[]>;
  /** Prose source per branch for the extraction fallback (e.g. branch thoughts). */
  branchProse?: (workspaceId: string, branchId: string) => Promise<string | undefined>;
  /** Validator cells attached to a branch's runbook instances / notebooks. */
  branchValidators?: (
    workspaceId: string,
    branchId: string,
  ) => Promise<BranchValidatorRef[]>;
}

/** One branch's claim set as captured into the evidence notebook. */
export interface BranchClaimCapture {
  branchId: string;
  /** Where the claims came from. */
  source: "claim-graph" | "claim-extractor" | "none";
  claims: Array<{
    id: string;
    type: string;
    statement: string;
    status: string;
    supersededBy?: string;
  }>;
}

/** Outcome of invoking one branch-attached validator cell at generation time. */
export interface BranchValidatorOutcome {
  branchId: string;
  notebookId: string;
  cellId: string;
  snapshotHash: string;
  hashMatched: boolean;
  pass: boolean;
  reason: string;
}

/**
 * Frozen return contract: `generateMergeEvidence(record) → {notebookId,
 * verdict, hash}`. `details` is additive diagnostics (never required by
 * merge-core).
 */
export interface MergeEvidenceResult {
  notebookId: string;
  verdict: MergeVerdict;
  hash: string;
  details: {
    runId?: string;
    runPass: boolean;
    runReason: string;
    /** Contract coverage reported by the evidence run (0 when the run failed). */
    runContractCoverage: number;
    artifactId?: string;
    evidenceCellIds: string[];
    verdictCellId?: string;
    branchClaims: BranchClaimCapture[];
    validatorOutcomes: BranchValidatorOutcome[];
    crossingContradictionCount: number;
  };
}
