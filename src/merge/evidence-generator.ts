/**
 * Merge evidence generator seam (SPEC-MERGE-CORE c7) — the integration
 * point between the merge state machine and the notebook-backed evidence
 * engine (SPEC-MERGE-EVIDENCE, src/merge-evidence/generate.ts).
 *
 * Evidence notebooks are AUTO-GENERATED from the system template at
 * merge-request time; agents never hand-author merge evidence. The seam's
 * signature matches the real generator exactly:
 *
 *   generateMergeEvidence(wireRecord) -> { notebookId, verdict, hash }
 *
 * where wireRecord is the frozen snake_case record subset
 * (MergeCommitWire) and the result may carry additive diagnostics
 * (`details`) that merge-core never requires. The one-line swap for the
 * warden once both branches land:
 *
 *   import { createMergeEvidenceGenerator } from "../merge-evidence/generate.js";
 *   const evidenceGenerator = createMergeEvidenceGenerator({ notebooks, claims });
 *
 * The merge handler treats generator output adversarially (fail-safe):
 * - a throw or a schema-invalid verdict blocks the merge (SPEC-MERGE-CORE c3);
 * - verdict.decision === "block" blocks the merge (c3);
 * - empty verdict.evidenceRefs (prose-only) clamps confidence to 'low'
 *   (c2), regardless of the confidence the generator claimed.
 */

import { createHash } from 'node:crypto';
import type { MergeCommitWire, MergeVerdict } from './types.js';

export interface MergeEvidenceResult {
  /** Id of the auto-generated evidence notebook. */
  notebookId: string;
  /** Structured verdict (mergeVerdictSchema); re-validated by the handler. */
  verdict: MergeVerdict;
  /** Canonical SHA-256 hex of the evidence notebook snapshot. */
  hash: string;
  /** Additive diagnostics (SPEC-MERGE-EVIDENCE); never required by merge-core. */
  details?: unknown;
}

export interface MergeEvidenceGenerator {
  generateMergeEvidence(record: MergeCommitWire): Promise<MergeEvidenceResult>;
}

/**
 * Deterministic prose-only stub (SPEC-MERGE-CORE c9 local path).
 * Produces no executable evidence (empty evidenceRefs), so every
 * stub-backed merge reaches pending_approval with confidence clamped to
 * 'low'. Replaced by SPEC-MERGE-EVIDENCE's createMergeEvidenceGenerator
 * at integration (see module doc).
 */
export function createStubMergeEvidenceGenerator(): MergeEvidenceGenerator {
  return {
    async generateMergeEvidence(record: MergeCommitWire): Promise<MergeEvidenceResult> {
      const verdict: MergeVerdict = {
        decision: 'merge',
        confidence: 'low',
        mergedBranchIds: [...record.parent_branch_ids],
        rejectedBranchIds: [],
        supersededNodeIds: [],
        evidenceRefs: [],
        dissent: [],
        conditions: [
          `Prose-only stub verdict for branches [${record.parent_branch_ids.join(', ')}] ` +
            `in workspace ${record.workspace_id}: no executable evidence was run; ` +
            `a human must weigh the branches directly.`,
        ],
        reopenTriggers: ['Real evidence generator produces a contradicting verdict.'],
      };
      const hash = createHash('sha256')
        .update(JSON.stringify({ mergeId: record.id, verdict }))
        .digest('hex');
      return {
        notebookId: `stub-evidence-${record.id}`,
        verdict,
        hash,
      };
    },
  };
}
