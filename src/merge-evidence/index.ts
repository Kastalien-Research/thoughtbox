/**
 * Merge Evidence Notebook — auto-generated, replayable evidence packet for
 * reasoning merges (SPEC-MERGE-EVIDENCE).
 *
 * Public surface for merge-core:
 *   generateMergeEvidence(record, deps) → { notebookId, verdict, hash }
 *   createMergeEvidenceGenerator(deps)  → bound generator
 *
 * Claim-level branch diff (internal read utility; tb registration is a
 * warden request — see .specs/merge-evidence.md):
 *   diffBranchClaims / crossingContradictions / claimsForBranch / branchRef
 */

export {
  MergeEvidenceGenerationError,
  createMergeEvidenceGenerator,
  generateMergeEvidence,
} from "./generate.js";
export {
  branchRef,
  claimBelongsToBranch,
  claimsForBranch,
  crossingContradictions,
  diffBranchClaims,
  type BranchClaimDiff,
  type ContradictingPair,
  type SupersededEntry,
} from "./claim-diff.js";
export {
  computeMergeEvidenceHash,
  type MergeEvidenceRunSummary,
  type MergeEvidenceSnapshot,
} from "./hash.js";
export {
  MERGE_DECISION,
  MergeEvidenceRecordSchema,
  MergeVerdictSchema,
  type BranchClaimCapture,
  type BranchValidatorOutcome,
  type BranchValidatorRef,
  type ExtractedClaim,
  type MergeEvidenceDeps,
  type MergeEvidenceRecordInput,
  type MergeEvidenceResult,
  type MergeVerdict,
} from "./types.js";
