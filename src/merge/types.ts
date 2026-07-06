/**
 * Merge-evidence domain types and storage contract (SPEC-MERGE-CORE).
 *
 * A merge commit is a finalized reasoning decision — a "collapse to
 * certainty" across competing branches — bound to an auto-generated,
 * replayable evidence notebook and a structured verdict. Merge commits are
 * immutable history: supersede/revert happens via new commits on top,
 * never rewrites (spec c1/c6).
 */

import { z } from 'zod';

export const MERGE_STATUSES = [
  'pending_evidence',
  'blocked',
  'pending_approval',
  'approved',
  'superseded',
] as const;
export type MergeStatus = (typeof MERGE_STATUSES)[number];

export const VERDICT_CONFIDENCES = ['low', 'medium', 'high'] as const;
export type VerdictConfidence = (typeof VERDICT_CONFIDENCES)[number];

/**
 * The complete set of legal status transitions (SPEC-MERGE-CORE c1).
 * `blocked` and `superseded` are fully terminal; `approved` is terminal
 * except for supersession by a later approved merge.
 */
export const MERGE_TRANSITIONS: ReadonlyArray<readonly [MergeStatus, MergeStatus]> = [
  ['pending_evidence', 'pending_approval'],
  ['pending_evidence', 'blocked'],
  ['pending_approval', 'approved'],
  ['approved', 'superseded'],
];

/**
 * Throws unless (from -> to) is in MERGE_TRANSITIONS. Every storage
 * backend calls this inside transitionMergeCommit so that even a buggy
 * caller cannot mutate a terminal record (spec c1/c5 defense in depth).
 */
export function assertMergeTransition(from: MergeStatus, to: MergeStatus): void {
  const legal = MERGE_TRANSITIONS.some(([f, t]) => f === from && t === to);
  if (!legal) {
    throw new Error(
      `Illegal merge transition '${from}' -> '${to}'. ` +
        `Merge commits are immutable history: blocked and approved are terminal ` +
        `(approved may only be superseded by a later approved merge).`,
    );
  }
}

export interface MergeDissent {
  branchId: string;
  summary: string;
  reasonNotMerged: string;
}

/**
 * Structured merge verdict (frozen schema,
 * .specs/product-shape/branches/001-merge-evidence-notebooks.md).
 */
export interface MergeVerdict {
  decision: string;
  confidence: VerdictConfidence;
  mergedBranchIds: string[];
  rejectedBranchIds: string[];
  supersededNodeIds: string[];
  evidenceRefs: string[];
  dissent: MergeDissent[];
  conditions: string[];
  reopenTriggers: string[];
}

/**
 * Zod validator for generator-produced verdicts. The handler validates
 * every verdict before persisting; a schema-invalid verdict is treated as
 * failed evidence and blocks the merge (spec c3).
 */
export const mergeVerdictSchema = z.object({
  decision: z.string().min(1),
  confidence: z.enum(VERDICT_CONFIDENCES),
  mergedBranchIds: z.array(z.string().min(1)),
  rejectedBranchIds: z.array(z.string().min(1)),
  supersededNodeIds: z.array(z.string().min(1)),
  evidenceRefs: z.array(z.string().min(1)),
  dissent: z.array(
    z.object({
      branchId: z.string().min(1),
      summary: z.string().min(1),
      reasonNotMerged: z.string().min(1),
    }),
  ),
  conditions: z.array(z.string().min(1)),
  reopenTriggers: z.array(z.string().min(1)),
});

/** baseRef prefix that references a prior merge commit and arms supersession. */
export const MERGE_BASE_REF_PREFIX = 'merge:';

/**
 * Decision values the system generator emits (SPEC-MERGE-EVIDENCE
 * MERGE_DECISION). `decision` stays a free string in the frozen schema;
 * the state machine keys ONLY on the "block" value.
 */
export const MERGE_DECISION_BLOCK = 'block';

/**
 * Wire form of the merge record — the frozen snake_case subset the
 * evidence generator consumes (SPEC-MERGE-EVIDENCE's
 * MergeEvidenceRecordSchema is a passthrough superset of this).
 */
export interface MergeCommitWire {
  id: string;
  workspace_id: string;
  parent_branch_ids: string[];
  base_ref?: string;
  requested_by: string;
  status: MergeStatus;
  created_at: string;
}

/** Map the camelCase domain record onto the generator's wire shape. */
export function toMergeCommitWire(record: MergeCommit): MergeCommitWire {
  return {
    id: record.id,
    workspace_id: record.workspaceId,
    parent_branch_ids: [...record.parentBranchIds],
    ...(record.baseRef !== undefined ? { base_ref: record.baseRef } : {}),
    requested_by: record.requestedBy,
    status: record.status,
    created_at: record.createdAt,
  };
}

export interface MergeCommit {
  id: string;
  /** Hub workspace (coordination space) the merge belongs to, like claims. */
  workspaceId: string;
  /** Candidate branch heads being collapsed. */
  parentBranchIds: string[];
  /**
   * Base node or prior checkpoint. `merge:<id>` references a prior merge
   * commit; when this record is approved and the referenced commit is
   * still approved, the referenced commit is superseded (spec c6).
   */
  baseRef?: string;
  /** Auto-generated evidence notebook; unset only while pending_evidence. */
  evidenceNotebookId?: string;
  /** SHA-256 hex of the evidence notebook snapshot. */
  evidenceHash?: string;
  /** Structured verdict; unset while pending_evidence and on generator-crash blocks. */
  verdict?: MergeVerdict;
  status: MergeStatus;
  /** Hub agentId of the requesting agent. */
  requestedBy: string;
  /** Human user id (auth.users). Set ONLY by the apps/web approval route (spec c4). */
  approvedBy?: string;
  createdAt: string;
  /** Stamped on entering a terminal decision (approved or blocked). */
  decidedAt?: string;
  /** Set when a later approved merge superseded this one. */
  supersededBy?: string;
}

export interface MergeCommitQuery {
  workspaceId: string;
  status?: MergeStatus;
}

/**
 * Fields a transition may set. `status` is the CAS target; everything
 * else is applied together with the status flip. Fields never in a patch
 * (id, workspaceId, parentBranchIds, baseRef, requestedBy, createdAt) are
 * immutable for the record's lifetime.
 */
export interface MergeCommitPatch {
  status: MergeStatus;
  evidenceNotebookId?: string;
  evidenceHash?: string;
  verdict?: MergeVerdict;
  approvedBy?: string;
  decidedAt?: string;
  supersededBy?: string;
}

/**
 * Storage contract for merge commits (SPEC-MERGE-CORE c8).
 * Implemented by SupabaseMergeCommitStorage (deployed) and
 * InMemoryMergeCommitStorage (tests/local).
 *
 * Semantics every implementation must honor:
 * - `createMergeCommit` is insert-only: re-creating an existing id throws.
 * - `transitionMergeCommit` is a compare-and-swap on status: it writes the
 *   patch only if the record's current status equals `expectedStatus`, and
 *   throws without writing otherwise. It also calls assertMergeTransition
 *   so illegal (from, to) pairs are rejected regardless of caller.
 * - Merge commits are never hard-deleted or edited outside transitions.
 */
export interface MergeCommitStorage {
  createMergeCommit(record: MergeCommit): Promise<void>;
  getMergeCommit(id: string): Promise<MergeCommit | null>;
  /** Ordered created_at ascending, then id. */
  listMergeCommits(query: MergeCommitQuery): Promise<MergeCommit[]>;
  transitionMergeCommit(
    id: string,
    expectedStatus: MergeStatus,
    patch: MergeCommitPatch,
  ): Promise<MergeCommit>;
}
