/**
 * Await-cell ↔ claim binding (SPEC-AGX-SUBSTRATE B6 — claim c4).
 *
 * An `await` cell is a claim subscription plus a predicate over the claim's
 * CURRENT status (spec §5 cell taxonomy): satisfaction marks the cell
 * runnable; it executes nothing. Evaluation is strictly pull-based — the
 * advancer (B8) reads the claim's current state through the narrow
 * AwaitClaimBinding; there are no suspended processes, in-flight retries,
 * or durable timers (Principle 5, claim c4).
 *
 * Satisfaction is recorded as a normal append-only CellExecutionRecord
 * (status "completed", one pass ExpectationRecord documenting the observed
 * claim status), so the existing B5 ordering rules (nextUnsatisfiedCell /
 * deriveInstanceStatus / assertCellExecutable) apply unchanged. An
 * UNSATISFIED await appends NOTHING — the instance stays parked (derived
 * status "in_progress"), visible and resumable, costing nothing.
 *
 * Await evaluations are deliberately EXCLUDED from the fitness ledger:
 * they are coordination state, not a hypothesis-vs-actual outcome (spec §7
 * scopes ledger rows to executed exec/assert cells).
 */

import type { ExpectationRecord } from "../contracts.js";

/**
 * Claim statuses an await cell may wait for. Mirrors ClaimStatus in
 * src/claims/types.ts; duplicated here (identical string literals) so the
 * notebook engine does not import the claims module — the dependency points
 * the other way (src/claims/runbook-binding.ts adapts ClaimStorage to
 * AwaitClaimBinding).
 */
export const AWAIT_CLAIM_STATUSES = [
  "asserted",
  "supported",
  "invalidated",
  "superseded",
] as const;
export type AwaitClaimStatus = (typeof AWAIT_CLAIM_STATUSES)[number];

export function isAwaitClaimStatus(value: unknown): value is AwaitClaimStatus {
  return (
    typeof value === "string" &&
    (AWAIT_CLAIM_STATUSES as readonly string[]).includes(value)
  );
}

/** The predicate an await cell declares over its subscribed claim. */
export interface AwaitCondition {
  claimId: string;
  /** Satisfied when the claim's current status is one of these. */
  until: AwaitClaimStatus[];
}

/**
 * Narrow claim surface the runbook engine needs for B6. Implemented over
 * ClaimStorage by createRunbookClaimBinding (src/claims/runbook-binding.ts);
 * tests may stub it directly.
 */
export interface AwaitClaimBinding {
  /** Current status of a claim, or null when the claim does not exist. */
  getClaimStatus(claimId: string): Promise<AwaitClaimStatus | null>;
  /**
   * Register a claim subscription for a parked runbook cell (idempotent on
   * (claimId, subscriber) — at-least-once advance retries must not fail).
   */
  subscribe(claimId: string, subscriber: string, createdBy: string): Promise<void>;
}

/**
 * Canonical claim_subscriptions.subscriber ref for an awaiting runbook cell
 * (the "runbook:<instanceId>/<cellId>" form documented on ClaimSubscription).
 */
export function awaitCellSubscriber(instanceId: string, cellId: string): string {
  return `runbook:${instanceId}/${cellId}`;
}

/** Pull-based satisfaction check: current status ∈ until. */
export function isAwaitConditionMet(
  condition: Pick<AwaitCondition, "until">,
  status: AwaitClaimStatus | null,
): boolean {
  return status !== null && condition.until.includes(status);
}

export function describeAwaitCondition(condition: AwaitCondition): string {
  return `claim ${condition.claimId} status in [${condition.until.join(", ")}]`;
}

/**
 * ExpectationRecord for an await evaluation. A satisfied evaluation (pass)
 * is persisted inside the await cell's execution record; an unsatisfied one
 * (result "skipped", carrying the parked reason) appears only in run
 * evidence/verdicts — it is never persisted, so the instance's durable
 * record stays free of unsatisfied entries and derives "in_progress".
 */
export function awaitExpectationRecord(
  cellId: string,
  condition: AwaitCondition,
  currentStatus: AwaitClaimStatus | null,
  options?: { unavailableReason?: string },
): ExpectationRecord {
  const expectation = describeAwaitCondition(condition);
  const expected = { source: "claimStatus", claimId: condition.claimId, until: condition.until };
  if (options?.unavailableReason !== undefined) {
    return {
      cellId,
      tier: 1,
      expectation,
      result: "skipped",
      expected,
      error: `instance parked: ${options.unavailableReason}`,
    };
  }
  if (isAwaitConditionMet(condition, currentStatus)) {
    return {
      cellId,
      tier: 1,
      expectation,
      result: "pass",
      expected,
      actual: currentStatus,
    };
  }
  return {
    cellId,
    tier: 1,
    expectation,
    result: "skipped",
    expected,
    ...(currentStatus !== null ? { actual: currentStatus } : {}),
    error:
      `instance parked: awaiting ${expectation}` +
      (currentStatus !== null
        ? ` (current: ${currentStatus})`
        : ` (claim not found)`),
  };
}
