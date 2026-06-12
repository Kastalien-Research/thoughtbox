/**
 * Claims domain handler (SPEC-AGX-SUBSTRATE B2) — routes tb.claims.*
 * operations over a ClaimStorage with Zod-validated inputs.
 *
 * Status transitions are append-history-style: invalidate and supersede
 * change status (and set the superseded_by pointer) but never destroy the
 * claim. There are no hard deletes in v0.
 */

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  CLAIM_EDGE_KINDS,
  CLAIM_STATUSES,
  CLAIM_TYPES,
  type Claim,
  type ClaimStorage,
} from './types.js';

const MAX_AFFECTED_DEPTH = 20;
const DEFAULT_AFFECTED_DEPTH = 10;

const assertSchema = z.object({
  workspaceId: z.string().min(1),
  type: z.enum(CLAIM_TYPES),
  statement: z.string().min(1),
  evidenceRefs: z.array(z.string().min(1)).optional(),
});

const supportSchema = z.object({
  claimId: z.string().min(1),
  evidenceRefs: z.array(z.string().min(1)).min(1),
});

const invalidateSchema = z.object({
  claimId: z.string().min(1),
});

const supersedeSchema = z.object({
  claimId: z.string().min(1),
  statement: z.string().min(1),
  type: z.enum(CLAIM_TYPES).optional(),
  evidenceRefs: z.array(z.string().min(1)).optional(),
});

const linkSchema = z.object({
  fromClaimId: z.string().min(1),
  toClaimId: z.string().min(1),
  kind: z.enum(CLAIM_EDGE_KINDS),
});

const subscribeSchema = z.object({
  claimId: z.string().min(1),
  subscriber: z.string().min(1).optional(),
});

const querySchema = z.object({
  workspaceId: z.string().min(1),
  type: z.enum(CLAIM_TYPES).optional(),
  status: z.enum(CLAIM_STATUSES).optional(),
  createdBy: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
});

const affectedSchema = z.object({
  claimId: z.string().min(1),
  maxDepth: z.number().int().min(1).max(MAX_AFFECTED_DEPTH).optional(),
});

export interface AffectedClaim {
  claim: Claim;
  /** Edge distance from the queried claim (direct dependents are depth 1). */
  depth: number;
}

export interface ClaimsHandler {
  handle(
    agentId: string | null,
    operation: string,
    args: Record<string, unknown>,
  ): Promise<unknown>;
}

const MUTATING_OPERATIONS = new Set([
  'assert',
  'support',
  'invalidate',
  'supersede',
  'link',
  'subscribe',
  'unsubscribe',
]);

export function createClaimsHandler(storage: ClaimStorage): ClaimsHandler {
  async function requireClaim(claimId: string): Promise<Claim> {
    const claim = await storage.getClaim(claimId);
    if (!claim) throw new Error(`Claim not found: ${claimId}`);
    return claim;
  }

  async function assertClaim(agentId: string, args: Record<string, unknown>): Promise<Claim> {
    const input = assertSchema.parse(args);
    const now = new Date().toISOString();
    const claim: Claim = {
      id: `claim-${randomUUID()}`,
      workspaceId: input.workspaceId,
      type: input.type,
      statement: input.statement,
      status: 'asserted',
      evidenceRefs: input.evidenceRefs ?? [],
      createdBy: agentId,
      createdAt: now,
      updatedAt: now,
    };
    await storage.saveClaim(claim);
    return claim;
  }

  async function support(args: Record<string, unknown>): Promise<Claim> {
    const input = supportSchema.parse(args);
    const claim = await requireClaim(input.claimId);
    if (claim.status === 'invalidated' || claim.status === 'superseded') {
      throw new Error(
        `Cannot support claim ${claim.id}: status is '${claim.status}'. ` +
          `Assert a new claim (or supersede) instead of reviving it.`,
      );
    }
    claim.evidenceRefs = [...claim.evidenceRefs, ...input.evidenceRefs];
    claim.status = 'supported';
    claim.updatedAt = new Date().toISOString();
    await storage.saveClaim(claim);
    return claim;
  }

  async function invalidate(args: Record<string, unknown>): Promise<Claim> {
    const input = invalidateSchema.parse(args);
    const claim = await requireClaim(input.claimId);
    if (claim.status === 'superseded') {
      throw new Error(
        `Cannot invalidate claim ${claim.id}: already superseded by ${claim.supersededBy}.`,
      );
    }
    if (claim.status === 'invalidated') return claim;
    claim.status = 'invalidated';
    claim.updatedAt = new Date().toISOString();
    await storage.saveClaim(claim);
    return claim;
  }

  async function supersede(
    agentId: string,
    args: Record<string, unknown>,
  ): Promise<{ superseded: Claim; replacement: Claim }> {
    const input = supersedeSchema.parse(args);
    const claim = await requireClaim(input.claimId);
    if (claim.status === 'superseded') {
      throw new Error(
        `Cannot supersede claim ${claim.id}: already superseded by ${claim.supersededBy}.`,
      );
    }
    const previousStatus = claim.status;
    const previousUpdatedAt = claim.updatedAt;
    const now = new Date().toISOString();
    const replacement: Claim = {
      id: `claim-${randomUUID()}`,
      workspaceId: claim.workspaceId,
      type: input.type ?? claim.type,
      statement: input.statement,
      status: 'asserted',
      evidenceRefs: input.evidenceRefs ?? [],
      createdBy: agentId,
      createdAt: now,
      updatedAt: now,
    };
    // CAS the original first: when a concurrent update wins the version
    // race (the realistic failure), nothing has been written yet, so a lost
    // race can never orphan an unreachable "asserted" replacement. Only
    // after the original commits as superseded is the replacement inserted;
    // if that insert fails (infrastructure-level), roll the original back
    // so its superseded_by pointer never dangles at a missing claim.
    claim.status = 'superseded';
    claim.supersededBy = replacement.id;
    claim.updatedAt = now;
    await storage.saveClaim(claim);
    try {
      await storage.saveClaim(replacement);
    } catch (insertError) {
      claim.status = previousStatus;
      delete claim.supersededBy;
      claim.updatedAt = previousUpdatedAt;
      try {
        await storage.saveClaim(claim);
      } catch (rollbackError) {
        const insertMessage =
          insertError instanceof Error ? insertError.message : String(insertError);
        const rollbackMessage =
          rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
        throw new Error(
          `Supersede of ${claim.id} failed inserting replacement ${replacement.id} ` +
            `(${insertMessage}) and the rollback also failed (${rollbackMessage}). ` +
            `Claim ${claim.id} is superseded with a dangling superseded_by pointer ` +
            `to ${replacement.id}; once storage recovers, repair it by asserting the ` +
            `replacement statement as a new claim and invalidating ${claim.id}.`,
        );
      }
      throw insertError;
    }
    return { superseded: claim, replacement };
  }

  async function link(agentId: string, args: Record<string, unknown>): Promise<unknown> {
    const input = linkSchema.parse(args);
    if (input.fromClaimId === input.toClaimId) {
      throw new Error('Cannot link a claim to itself');
    }
    const from = await requireClaim(input.fromClaimId);
    const to = await requireClaim(input.toClaimId);
    if (from.workspaceId !== to.workspaceId) {
      throw new Error(
        `Cannot link claims across workspaces (${from.workspaceId} vs ${to.workspaceId})`,
      );
    }
    const edge = {
      fromClaim: input.fromClaimId,
      toClaim: input.toClaimId,
      kind: input.kind,
      createdBy: agentId,
      createdAt: new Date().toISOString(),
    };
    await storage.addEdge(edge);
    return edge;
  }

  async function subscribe(agentId: string, args: Record<string, unknown>): Promise<unknown> {
    const input = subscribeSchema.parse(args);
    await requireClaim(input.claimId);
    const subscription = {
      claimId: input.claimId,
      subscriber: input.subscriber ?? agentId,
      createdBy: agentId,
      createdAt: new Date().toISOString(),
    };
    await storage.addSubscription(subscription);
    return subscription;
  }

  async function unsubscribe(agentId: string, args: Record<string, unknown>): Promise<unknown> {
    const input = subscribeSchema.parse(args);
    const subscriber = input.subscriber ?? agentId;
    await storage.removeSubscription(input.claimId, subscriber);
    return { claimId: input.claimId, subscriber, removed: true };
  }

  async function query(args: Record<string, unknown>): Promise<unknown> {
    const input = querySchema.parse(args);
    const claims = await storage.queryClaims(input);
    return { claims, count: claims.length };
  }

  /**
   * Transitive dependents of a claim: breadth-first traversal of reverse
   * `depends_on` edges (X depends_on Y means X is affected when Y moves).
   * Cycle-safe via a visited set; depth-capped (default 10, max 20).
   */
  async function affected(args: Record<string, unknown>): Promise<unknown> {
    const input = affectedSchema.parse(args);
    await requireClaim(input.claimId);
    const maxDepth = input.maxDepth ?? DEFAULT_AFFECTED_DEPTH;
    const visited = new Set<string>([input.claimId]);
    const results: AffectedClaim[] = [];
    let frontier = [input.claimId];
    let depth = 0;
    while (frontier.length > 0 && depth < maxDepth) {
      depth += 1;
      const edges = await storage.listEdges({ toClaims: frontier, kind: 'depends_on' });
      const next: string[] = [];
      for (const edge of edges) {
        if (visited.has(edge.fromClaim)) continue;
        visited.add(edge.fromClaim);
        next.push(edge.fromClaim);
      }
      const claims = await storage.getClaims(next);
      for (const claim of claims) {
        results.push({ claim, depth });
      }
      frontier = next;
    }
    return {
      claimId: input.claimId,
      affected: results,
      count: results.length,
      maxDepth,
      truncated: frontier.length > 0 && depth >= maxDepth,
    };
  }

  return {
    async handle(agentId, operation, args) {
      if (MUTATING_OPERATIONS.has(operation) && !agentId) {
        throw new Error(
          `tb.claims.${operation} requires an agent identity. ` +
            'Call tb.hub.register (or tb.hub.quickJoin) first, or pass agentId explicitly.',
        );
      }
      switch (operation) {
        case 'assert':
          return assertClaim(agentId!, args);
        case 'support':
          return support(args);
        case 'invalidate':
          return invalidate(args);
        case 'supersede':
          return supersede(agentId!, args);
        case 'link':
          return link(agentId!, args);
        case 'subscribe':
          return subscribe(agentId!, args);
        case 'unsubscribe':
          return unsubscribe(agentId!, args);
        case 'query':
          return query(args);
        case 'affected':
          return affected(args);
        default:
          throw new Error(`Unknown claims operation: ${operation}`);
      }
    },
  };
}
