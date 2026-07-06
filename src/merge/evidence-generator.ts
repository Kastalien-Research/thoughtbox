/**
 * Merge evidence generator contract (SPEC-MERGE-EVIDENCE c7) — the
 * integration point between the merge state machine and the notebook-backed
 * evidence engine.
 *
 * Evidence notebooks are AUTO-GENERATED from the system template at
 * merge-request time; agents never hand-author merge evidence. The real
 * generator (notebook run with claim extraction, contradiction scan, and
 * validator cells) is a drop-in implementation of MergeEvidenceGenerator.
 * Until it lands, createStubMergeEvidenceGenerator() provides a
 * deterministic prose-only generator so the state machine is exercisable
 * standalone.
 *
 * The merge handler treats generator output adversarially (fail-safe):
 * - a throw, a schema-invalid verdict, or evidenceFailed !== false blocks
 *   the merge (spec c3);
 * - hasPassingExecutableEvidence !== true clamps verdict.confidence to
 *   'low' (spec c2), regardless of the confidence the generator claimed.
 */

import { createHash } from 'node:crypto';
import type { MergeCommit, MergeVerdict } from './types.js';

export interface MergeEvidenceResult {
  /** Id of the auto-generated evidence notebook. */
  notebookId: string;
  /** Structured verdict (mergeVerdictSchema); re-validated by the handler. */
  verdict: MergeVerdict;
  /** SHA-256 hex of the evidence notebook snapshot. */
  hash: string;
  /**
   * True when the evidence notebook run failed (any executable evidence
   * cell failed). A failed evidence notebook BLOCKS the merge.
   */
  evidenceFailed: boolean;
  /**
   * True only when at least one executable evidence cell ran and passed.
   * False means prose-only evidence: legal, but confidence is forced low.
   */
  hasPassingExecutableEvidence: boolean;
}

export interface MergeEvidenceGenerator {
  generateMergeEvidence(record: MergeCommit): Promise<MergeEvidenceResult>;
}

/**
 * Deterministic prose-only stub (SPEC-MERGE-EVIDENCE c9 local path).
 * Produces no executable evidence, so every stub-backed merge reaches
 * pending_approval with confidence clamped to 'low'.
 */
export function createStubMergeEvidenceGenerator(): MergeEvidenceGenerator {
  return {
    async generateMergeEvidence(record: MergeCommit): Promise<MergeEvidenceResult> {
      const verdict: MergeVerdict = {
        decision:
          `Prose-only stub verdict: collapse branches ` +
          `[${record.parentBranchIds.join(', ')}] in workspace ${record.workspaceId}. ` +
          `No executable evidence was run; a human must weigh the branches directly.`,
        confidence: 'low',
        mergedBranchIds: [...record.parentBranchIds],
        rejectedBranchIds: [],
        supersededNodeIds: [],
        evidenceRefs: [],
        dissent: [],
        conditions: ['Replace stub evidence with a real merge-evidence notebook run.'],
        reopenTriggers: ['Real evidence generator produces a contradicting verdict.'],
      };
      const hash = createHash('sha256')
        .update(JSON.stringify({ mergeId: record.id, verdict }))
        .digest('hex');
      return {
        notebookId: `stub-evidence-${record.id}`,
        verdict,
        hash,
        evidenceFailed: false,
        hasPassingExecutableEvidence: false,
      };
    },
  };
}
