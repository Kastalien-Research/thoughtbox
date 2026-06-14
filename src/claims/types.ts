/**
 * Claim graph domain types and storage contract (SPEC-AGX-SUBSTRATE B1).
 *
 * A claim is a typed assertion with provenance, status, dependency edges,
 * and explicit subscriptions — the unit of shared agent state structured
 * enough to compute "affected parties" (spec §4 data model v0).
 */

export const CLAIM_TYPES = [
  'assumption',
  'decision',
  'observation',
  'requirement',
  'outcome',
] as const;
export type ClaimType = (typeof CLAIM_TYPES)[number];

export const CLAIM_STATUSES = [
  'asserted',
  'supported',
  'invalidated',
  'superseded',
] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const CLAIM_EDGE_KINDS = ['depends_on', 'derives_from', 'contradicts'] as const;
export type ClaimEdgeKind = (typeof CLAIM_EDGE_KINDS)[number];

export interface Claim {
  id: string;
  /** Hub workspace (coordination space) the claim belongs to. */
  workspaceId: string;
  type: ClaimType;
  statement: string;
  status: ClaimStatus;
  evidenceRefs: string[];
  /** Hub agentId of the asserting agent. */
  createdBy: string;
  /** Set when status is 'superseded'; points at the replacement claim. */
  supersededBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimEdge {
  fromClaim: string;
  toClaim: string;
  kind: ClaimEdgeKind;
  createdBy: string;
  createdAt: string;
}

export interface ClaimSubscription {
  claimId: string;
  /** Hub agentId or a runbook cell ref (e.g. "runbook:<instanceId>/<cellId>"). */
  subscriber: string;
  createdBy: string;
  createdAt: string;
}

export interface ClaimQuery {
  workspaceId: string;
  type?: ClaimType;
  status?: ClaimStatus;
  createdBy?: string;
  /** Case-insensitive substring match on the statement. */
  text?: string;
}

export interface ClaimEdgeFilter {
  fromClaim?: string;
  toClaim?: string;
  /** Batch form of toClaim for level-wise reverse traversal. */
  toClaims?: string[];
  kind?: ClaimEdgeKind;
}

/**
 * Storage contract for the claim graph. Implemented by
 * SupabaseClaimStorage (deployed) and InMemoryClaimStorage (tests/local).
 * A FileSystemClaimStorage is deliberately deferred until the H1/H2
 * experiments pass (spec §11.5).
 *
 * Semantics every implementation must honor:
 * - `saveClaim` inserts on first save of an instance and performs an
 *   optimistic compare-and-swap update on re-save of a claim read through
 *   the same instance; a stale save throws instead of silently
 *   overwriting.
 * - Claims are never hard-deleted: invalidate/supersede are status
 *   updates that preserve the row (append-history style).
 * - `addEdge` and `addSubscription` are idempotent on their natural keys
 *   (at-least-once retries must not fail or duplicate).
 */
export interface ClaimStorage {
  getClaim(claimId: string): Promise<Claim | null>;
  /**
   * Batch form of getClaim for level-wise graph traversal: one query per
   * call. Returns found claims in `claimIds` order; missing ids are
   * skipped. Returned instances carry CAS read versions like getClaim.
   */
  getClaims(claimIds: string[]): Promise<Claim[]>;
  saveClaim(claim: Claim): Promise<void>;
  /**
   * Atomically supersede `original` with `replacement`: insert the
   * replacement and flip the original to 'superseded' (its `supersededBy`
   * already pointing at `replacement.id`) in a single all-or-nothing step.
   * `original` is CAS'd on its read version — a stale original (a lost
   * concurrency race) throws with a 'concurrent update' message and writes
   * nothing. A failure leaves neither the replacement inserted nor the
   * original modified; there is no partially-applied state to compensate.
   * The handler keeps the two writes in storage because claims.superseded_by
   * is an immediate FK: only the storage layer can satisfy it within one
   * transaction.
   */
  supersedeClaim(original: Claim, replacement: Claim): Promise<void>;
  queryClaims(query: ClaimQuery): Promise<Claim[]>;

  addEdge(edge: ClaimEdge): Promise<void>;
  listEdges(filter: ClaimEdgeFilter): Promise<ClaimEdge[]>;

  addSubscription(subscription: ClaimSubscription): Promise<void>;
  removeSubscription(claimId: string, subscriber: string): Promise<void>;
  listSubscriptions(claimId: string): Promise<ClaimSubscription[]>;
}
