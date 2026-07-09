/**
 * InMemoryClaimStorage — volatile claim graph storage for tests and
 * THOUGHTBOX_STORAGE=memory (SPEC-AGX-SUBSTRATE B1). Durable local mode
 * uses SqliteClaimStorage; deployed mode uses SupabaseClaimStorage.
 *
 * Mirrors SupabaseClaimStorage semantics: structural copies on read/write
 * (no shared references), optimistic concurrency on the claim aggregate,
 * idempotent edge/subscription appends, and no hard deletes of claims.
 */

import type {
  Claim,
  ClaimEdge,
  ClaimEdgeFilter,
  ClaimQuery,
  ClaimStorage,
  ClaimSubscription,
} from './types.js';

function edgeKey(edge: Pick<ClaimEdge, 'fromClaim' | 'toClaim' | 'kind'>): string {
  return `${edge.fromClaim}\u0000${edge.toClaim}\u0000${edge.kind}`;
}

function subscriptionKey(claimId: string, subscriber: string): string {
  return `${claimId}\u0000${subscriber}`;
}

function copyClaim(claim: Claim): Claim {
  return { ...claim, evidenceRefs: [...claim.evidenceRefs] };
}

export class InMemoryClaimStorage implements ClaimStorage {
  private claims = new Map<string, Claim>();
  private claimVersions = new Map<string, number>();
  private edges = new Map<string, ClaimEdge>();
  private subscriptions = new Map<string, ClaimSubscription>();
  /** Versions of claim instances read through this storage (optimistic CAS). */
  private readVersions = new WeakMap<object, number>();

  async getClaim(claimId: string): Promise<Claim | null> {
    const stored = this.claims.get(claimId);
    if (!stored) return null;
    const claim = copyClaim(stored);
    this.readVersions.set(claim, this.claimVersions.get(claimId) ?? 1);
    return claim;
  }

  async getClaims(claimIds: string[]): Promise<Claim[]> {
    const matches: Claim[] = [];
    for (const claimId of claimIds) {
      const stored = this.claims.get(claimId);
      if (!stored) continue;
      const claim = copyClaim(stored);
      this.readVersions.set(claim, this.claimVersions.get(claimId) ?? 1);
      matches.push(claim);
    }
    return matches;
  }

  async saveClaim(claim: Claim): Promise<void> {
    const expected = this.readVersions.get(claim);
    const current = this.claimVersions.get(claim.id);
    if (expected === undefined) {
      if (current !== undefined) {
        throw new Error(
          `InMemoryClaimStorage.saveClaim failed: claim ${claim.id} already exists`,
        );
      }
      this.claims.set(claim.id, copyClaim(claim));
      this.claimVersions.set(claim.id, 1);
      this.readVersions.set(claim, 1);
      return;
    }
    if (current !== expected) {
      throw new Error(
        `InMemoryClaimStorage.saveClaim failed: concurrent update detected for claim ${claim.id}; reload and retry`,
      );
    }
    this.claims.set(claim.id, copyClaim(claim));
    this.claimVersions.set(claim.id, expected + 1);
    this.readVersions.set(claim, expected + 1);
  }

  async supersedeClaim(original: Claim, replacement: Claim): Promise<void> {
    // Validate everything before mutating, then apply both writes with no
    // await between them: single-threaded JS makes the apply atomic, so a
    // rejected supersede leaves storage untouched.
    if (this.claimVersions.has(replacement.id)) {
      throw new Error(
        `InMemoryClaimStorage.supersedeClaim failed: replacement ${replacement.id} already exists`,
      );
    }
    const expected = this.readVersions.get(original);
    const current = this.claimVersions.get(original.id);
    if (expected === undefined || current === undefined) {
      throw new Error(
        `InMemoryClaimStorage.supersedeClaim failed: original ${original.id} was not read through this storage; reload and retry`,
      );
    }
    if (current !== expected) {
      throw new Error(
        `InMemoryClaimStorage.supersedeClaim failed: concurrent update detected for claim ${original.id}; reload and retry`,
      );
    }
    this.claims.set(replacement.id, copyClaim(replacement));
    this.claimVersions.set(replacement.id, 1);
    this.readVersions.set(replacement, 1);
    this.claims.set(original.id, copyClaim(original));
    this.claimVersions.set(original.id, expected + 1);
    this.readVersions.set(original, expected + 1);
  }

  async queryClaims(query: ClaimQuery): Promise<Claim[]> {
    const text = query.text?.toLowerCase();
    const matches: Claim[] = [];
    for (const stored of this.claims.values()) {
      if (stored.workspaceId !== query.workspaceId) continue;
      if (query.type && stored.type !== query.type) continue;
      if (query.status && stored.status !== query.status) continue;
      if (query.createdBy && stored.createdBy !== query.createdBy) continue;
      if (text && !stored.statement.toLowerCase().includes(text)) continue;
      const claim = copyClaim(stored);
      this.readVersions.set(claim, this.claimVersions.get(stored.id) ?? 1);
      matches.push(claim);
    }
    matches.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
    return matches;
  }

  async claimsChangedSince(since: string, workspaceId?: string): Promise<Claim[]> {
    const cutoff = new Date(since).toISOString();
    const matches: Claim[] = [];
    for (const stored of this.claims.values()) {
      if (workspaceId && stored.workspaceId !== workspaceId) continue;
      if (stored.statusChangedAt <= cutoff) continue;
      const claim = copyClaim(stored);
      this.readVersions.set(claim, this.claimVersions.get(stored.id) ?? 1);
      matches.push(claim);
    }
    matches.sort(
      (a, b) =>
        a.statusChangedAt.localeCompare(b.statusChangedAt) || a.id.localeCompare(b.id),
    );
    return matches;
  }

  async addEdge(edge: ClaimEdge): Promise<void> {
    for (const endpoint of [edge.fromClaim, edge.toClaim]) {
      if (!this.claims.has(endpoint)) {
        throw new Error(`InMemoryClaimStorage.addEdge failed: claim not found: ${endpoint}`);
      }
    }
    const key = edgeKey(edge);
    if (this.edges.has(key)) return;
    this.edges.set(key, { ...edge });
  }

  async listEdges(filter: ClaimEdgeFilter): Promise<ClaimEdge[]> {
    const matches: ClaimEdge[] = [];
    for (const edge of this.edges.values()) {
      if (filter.fromClaim && edge.fromClaim !== filter.fromClaim) continue;
      if (filter.toClaim && edge.toClaim !== filter.toClaim) continue;
      if (filter.toClaims && !filter.toClaims.includes(edge.toClaim)) continue;
      if (filter.kind && edge.kind !== filter.kind) continue;
      matches.push({ ...edge });
    }
    matches.sort(
      (a, b) => a.createdAt.localeCompare(b.createdAt) || edgeKey(a).localeCompare(edgeKey(b)),
    );
    return matches;
  }

  async addSubscription(subscription: ClaimSubscription): Promise<void> {
    if (!this.claims.has(subscription.claimId)) {
      throw new Error(
        `InMemoryClaimStorage.addSubscription failed: claim not found: ${subscription.claimId}`,
      );
    }
    const key = subscriptionKey(subscription.claimId, subscription.subscriber);
    if (this.subscriptions.has(key)) return;
    this.subscriptions.set(key, { ...subscription });
  }

  async removeSubscription(claimId: string, subscriber: string): Promise<void> {
    this.subscriptions.delete(subscriptionKey(claimId, subscriber));
  }

  async listSubscriptions(claimId: string): Promise<ClaimSubscription[]> {
    const matches: ClaimSubscription[] = [];
    for (const subscription of this.subscriptions.values()) {
      if (subscription.claimId !== claimId) continue;
      matches.push({ ...subscription });
    }
    matches.sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.subscriber.localeCompare(b.subscriber),
    );
    return matches;
  }
}
