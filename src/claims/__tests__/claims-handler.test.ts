/**
 * Claims domain handler tests (SPEC-AGX-SUBSTRATE B2): operation routing,
 * Zod validation, append-history status transitions, edge linking, the
 * affected traversal (including cycles and depth caps), and the
 * subscription registry. Runs over InMemoryClaimStorage.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClaimsHandler, type ClaimsHandler } from '../claims-handler.js';
import { InMemoryClaimStorage } from '../in-memory-claim-storage.js';
import type { Claim } from '../types.js';
import { thoughtEmitter, type ThoughtEmitterEvents } from '../../events/index.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const WS = 'ws-test';
const ALICE = 'agent-alice';
const BOB = 'agent-bob';

describe('ClaimsHandler', () => {
  let storage: InMemoryClaimStorage;
  let handler: ClaimsHandler;

  beforeEach(() => {
    storage = new InMemoryClaimStorage();
    handler = createClaimsHandler(storage);
  });

  async function assertClaim(statement = 'a test assumption', agentId = ALICE): Promise<Claim> {
    return (await handler.handle(agentId, 'assert', {
      workspaceId: WS,
      type: 'assumption',
      statement,
    })) as Claim;
  }

  describe('assert', () => {
    it('creates an asserted claim with provenance', async () => {
      const claim = await assertClaim();
      expect(claim.id).toMatch(/^claim-/);
      expect(claim.status).toBe('asserted');
      expect(claim.createdBy).toBe(ALICE);
      expect(claim.evidenceRefs).toEqual([]);
      expect(await storage.getClaim(claim.id)).toEqual(claim);
    });

    it('accepts initial evidence refs', async () => {
      const claim = (await handler.handle(ALICE, 'assert', {
        workspaceId: WS,
        type: 'observation',
        statement: 'tests pass on main',
        evidenceRefs: ['ci:run/123'],
      })) as Claim;
      expect(claim.type).toBe('observation');
      expect(claim.evidenceRefs).toEqual(['ci:run/123']);
    });

    it('rejects invalid type and empty statement', async () => {
      await expect(
        handler.handle(ALICE, 'assert', { workspaceId: WS, type: 'vibe', statement: 'x' }),
      ).rejects.toThrow();
      await expect(
        handler.handle(ALICE, 'assert', { workspaceId: WS, type: 'decision', statement: '' }),
      ).rejects.toThrow();
    });

    it('rejects mutations without an agent identity', async () => {
      await expect(
        handler.handle(null, 'assert', {
          workspaceId: WS,
          type: 'assumption',
          statement: 'no identity',
        }),
      ).rejects.toThrow(/requires an agent identity/);
    });
  });

  describe('status transitions (append-history)', () => {
    it('support appends evidence and marks the claim supported', async () => {
      const claim = await assertClaim();
      const supported = (await handler.handle(BOB, 'support', {
        claimId: claim.id,
        evidenceRefs: ['thought:sess-1/4'],
      })) as Claim;
      expect(supported.status).toBe('supported');
      expect(supported.evidenceRefs).toEqual(['thought:sess-1/4']);

      const again = (await handler.handle(BOB, 'support', {
        claimId: claim.id,
        evidenceRefs: ['thought:sess-1/9'],
      })) as Claim;
      expect(again.evidenceRefs).toEqual(['thought:sess-1/4', 'thought:sess-1/9']);
    });

    it('support requires at least one evidence ref', async () => {
      const claim = await assertClaim();
      await expect(
        handler.handle(BOB, 'support', { claimId: claim.id, evidenceRefs: [] }),
      ).rejects.toThrow();
    });

    it('invalidate preserves the claim row (no hard delete)', async () => {
      const claim = await assertClaim();
      const invalidated = (await handler.handle(BOB, 'invalidate', {
        claimId: claim.id,
      })) as Claim;
      expect(invalidated.status).toBe('invalidated');

      const stored = await storage.getClaim(claim.id);
      expect(stored).not.toBeNull();
      expect(stored!.statement).toBe(claim.statement);
    });

    it('invalidate is idempotent', async () => {
      const claim = await assertClaim();
      await handler.handle(BOB, 'invalidate', { claimId: claim.id });
      const second = (await handler.handle(BOB, 'invalidate', { claimId: claim.id })) as Claim;
      expect(second.status).toBe('invalidated');
    });

    it('support is rejected on invalidated and superseded claims', async () => {
      const dead = await assertClaim('will be invalidated');
      await handler.handle(BOB, 'invalidate', { claimId: dead.id });
      await expect(
        handler.handle(BOB, 'support', { claimId: dead.id, evidenceRefs: ['x'] }),
      ).rejects.toThrow(/Cannot support/);

      const old = await assertClaim('will be superseded');
      await handler.handle(BOB, 'supersede', { claimId: old.id, statement: 'replacement' });
      await expect(
        handler.handle(BOB, 'support', { claimId: old.id, evidenceRefs: ['x'] }),
      ).rejects.toThrow(/Cannot support/);
    });

    it('supersede creates a replacement and sets the superseded_by pointer', async () => {
      const old = await assertClaim('30s clock skew tolerated');
      const result = (await handler.handle(BOB, 'supersede', {
        claimId: old.id,
        statement: '5s clock skew tolerated (measured)',
      })) as { superseded: Claim; replacement: Claim };

      expect(result.superseded.id).toBe(old.id);
      expect(result.superseded.status).toBe('superseded');
      expect(result.superseded.supersededBy).toBe(result.replacement.id);
      expect(result.replacement.status).toBe('asserted');
      expect(result.replacement.type).toBe(old.type); // inherited
      expect(result.replacement.workspaceId).toBe(WS);
      expect(result.replacement.createdBy).toBe(BOB);

      // Both rows persist — append-history, not replacement-by-deletion.
      expect(await storage.getClaim(old.id)).not.toBeNull();
      expect(await storage.getClaim(result.replacement.id)).not.toBeNull();
    });

    it('supersede and invalidate are rejected on already-superseded claims', async () => {
      const old = await assertClaim();
      await handler.handle(BOB, 'supersede', { claimId: old.id, statement: 'v2' });
      await expect(
        handler.handle(BOB, 'supersede', { claimId: old.id, statement: 'v3' }),
      ).rejects.toThrow(/already superseded/);
      await expect(
        handler.handle(BOB, 'invalidate', { claimId: old.id }),
      ).rejects.toThrow(/already superseded/);
    });

    it('operations on missing claims fail with a clear error', async () => {
      await expect(
        handler.handle(BOB, 'invalidate', { claimId: 'claim-missing' }),
      ).rejects.toThrow(/Claim not found/);
    });
  });

  describe('link', () => {
    it('creates typed edges between claims', async () => {
      const base = await assertClaim('base');
      const dependent = await assertClaim('dependent');
      const edge = (await handler.handle(ALICE, 'link', {
        fromClaimId: dependent.id,
        toClaimId: base.id,
        kind: 'depends_on',
      })) as { fromClaim: string; toClaim: string; kind: string };
      expect(edge.fromClaim).toBe(dependent.id);
      expect(edge.toClaim).toBe(base.id);
      expect(await storage.listEdges({ toClaim: base.id })).toHaveLength(1);
    });

    it('rejects self-links, cross-workspace links, and missing claims', async () => {
      const claim = await assertClaim();
      await expect(
        handler.handle(ALICE, 'link', {
          fromClaimId: claim.id,
          toClaimId: claim.id,
          kind: 'depends_on',
        }),
      ).rejects.toThrow(/itself/);

      const other = (await handler.handle(ALICE, 'assert', {
        workspaceId: 'ws-other',
        type: 'decision',
        statement: 'in another workspace',
      })) as Claim;
      await expect(
        handler.handle(ALICE, 'link', {
          fromClaimId: claim.id,
          toClaimId: other.id,
          kind: 'depends_on',
        }),
      ).rejects.toThrow(/across workspaces/);

      await expect(
        handler.handle(ALICE, 'link', {
          fromClaimId: claim.id,
          toClaimId: 'claim-missing',
          kind: 'contradicts',
        }),
      ).rejects.toThrow(/Claim not found/);
    });
  });

  describe('subscriptions', () => {
    it('subscribe defaults to the acting agent; unsubscribe removes it', async () => {
      const claim = await assertClaim();
      const subscription = (await handler.handle(BOB, 'subscribe', {
        claimId: claim.id,
      })) as { subscriber: string };
      expect(subscription.subscriber).toBe(BOB);
      expect(await storage.listSubscriptions(claim.id)).toHaveLength(1);

      await handler.handle(BOB, 'unsubscribe', { claimId: claim.id });
      expect(await storage.listSubscriptions(claim.id)).toEqual([]);
    });

    it('accepts runbook cell refs as explicit subscribers', async () => {
      const claim = await assertClaim();
      await handler.handle(BOB, 'subscribe', {
        claimId: claim.id,
        subscriber: 'runbook:inst-1/cell-3',
      });
      const listed = await storage.listSubscriptions(claim.id);
      expect(listed).toHaveLength(1);
      expect(listed[0]!.subscriber).toBe('runbook:inst-1/cell-3');
      expect(listed[0]!.createdBy).toBe(BOB);
    });

    it('subscribe rejects missing claims', async () => {
      await expect(
        handler.handle(BOB, 'subscribe', { claimId: 'claim-missing' }),
      ).rejects.toThrow(/Claim not found/);
    });
  });

  describe('query', () => {
    it('filters by type, status, agent, and text without an identity', async () => {
      await assertClaim('alpha statement');
      const decision = (await handler.handle(BOB, 'assert', {
        workspaceId: WS,
        type: 'decision',
        statement: 'beta statement',
      })) as Claim;
      await handler.handle(BOB, 'support', {
        claimId: decision.id,
        evidenceRefs: ['ref-1'],
      });

      // query is read-only: works with a null identity
      const all = (await handler.handle(null, 'query', { workspaceId: WS })) as {
        claims: Claim[];
        count: number;
      };
      expect(all.count).toBe(2);

      const supported = (await handler.handle(null, 'query', {
        workspaceId: WS,
        status: 'supported',
      })) as { claims: Claim[] };
      expect(supported.claims.map(c => c.id)).toEqual([decision.id]);

      const byText = (await handler.handle(null, 'query', {
        workspaceId: WS,
        text: 'ALPHA',
      })) as { count: number };
      expect(byText.count).toBe(1);

      const byAgent = (await handler.handle(null, 'query', {
        workspaceId: WS,
        createdBy: BOB,
      })) as { claims: Claim[] };
      expect(byAgent.claims.map(c => c.id)).toEqual([decision.id]);
    });
  });

  describe('affected (transitive dependents)', () => {
    async function linkDependsOn(from: Claim, to: Claim): Promise<void> {
      await handler.handle(ALICE, 'link', {
        fromClaimId: from.id,
        toClaimId: to.id,
        kind: 'depends_on',
      });
    }

    it('returns transitive dependents with depths', async () => {
      const base = await assertClaim('base');
      const direct = await assertClaim('direct dependent');
      const transitive = await assertClaim('transitive dependent');
      const unrelated = await assertClaim('unrelated');
      await linkDependsOn(direct, base);
      await linkDependsOn(transitive, direct);

      const result = (await handler.handle(null, 'affected', { claimId: base.id })) as {
        affected: Array<{ claim: Claim; depth: number }>;
        count: number;
        truncated: boolean;
      };
      expect(result.count).toBe(2);
      expect(result.truncated).toBe(false);
      const byId = new Map(result.affected.map(entry => [entry.claim.id, entry.depth]));
      expect(byId.get(direct.id)).toBe(1);
      expect(byId.get(transitive.id)).toBe(2);
      expect(byId.has(unrelated.id)).toBe(false);
    });

    it('ignores non-depends_on edges', async () => {
      const base = await assertClaim('base');
      const derived = await assertClaim('derived');
      await handler.handle(ALICE, 'link', {
        fromClaimId: derived.id,
        toClaimId: base.id,
        kind: 'derives_from',
      });
      const result = (await handler.handle(null, 'affected', { claimId: base.id })) as {
        count: number;
      };
      expect(result.count).toBe(0);
    });

    it('is cycle-safe: mutual dependencies terminate and visit each node once', async () => {
      const a = await assertClaim('claim a');
      const b = await assertClaim('claim b');
      const c = await assertClaim('claim c');
      await linkDependsOn(b, a);
      await linkDependsOn(c, b);
      await linkDependsOn(a, c); // closes the cycle a -> c -> b -> a

      const result = (await handler.handle(null, 'affected', { claimId: a.id })) as {
        affected: Array<{ claim: Claim; depth: number }>;
        count: number;
      };
      // b (depth 1) and c (depth 2); a itself is never re-reported.
      expect(result.count).toBe(2);
      expect(new Set(result.affected.map(entry => entry.claim.id))).toEqual(
        new Set([b.id, c.id]),
      );
    });

    it('caps traversal depth and reports truncation', async () => {
      const chain = [await assertClaim('link 0')];
      for (let i = 1; i <= 4; i++) {
        const claim = await assertClaim(`link ${i}`);
        await linkDependsOn(claim, chain[i - 1]!);
        chain.push(claim);
      }
      const result = (await handler.handle(null, 'affected', {
        claimId: chain[0]!.id,
        maxDepth: 2,
      })) as { count: number; truncated: boolean };
      expect(result.count).toBe(2);
      expect(result.truncated).toBe(true);

      await expect(
        handler.handle(null, 'affected', { claimId: chain[0]!.id, maxDepth: 99 }),
      ).rejects.toThrow();
    });

    it('rejects missing claims', async () => {
      await expect(
        handler.handle(null, 'affected', { claimId: 'claim-missing' }),
      ).rejects.toThrow(/Claim not found/);
    });
  });

  describe('staleness primitives (B3)', () => {
    it('verify reports current status per id and found:false for missing ids', async () => {
      const alive = await assertClaim('still standing');
      const dead = await assertClaim('will be invalidated');
      await handler.handle(BOB, 'invalidate', { claimId: dead.id });
      const replaced = await assertClaim('will be superseded');
      const { replacement } = (await handler.handle(BOB, 'supersede', {
        claimId: replaced.id,
        statement: 'the replacement',
      })) as { replacement: Claim };

      // verify is read-only: works with a null identity
      const result = (await handler.handle(null, 'verify', {
        ids: [alive.id, dead.id, replaced.id, 'claim-missing'],
      })) as { results: Array<Record<string, unknown>>; count: number };

      expect(result.count).toBe(4);
      expect(result.results).toEqual([
        {
          claimId: alive.id,
          found: true,
          status: 'asserted',
          statusChangedAt: alive.statusChangedAt,
        },
        {
          claimId: dead.id,
          found: true,
          status: 'invalidated',
          statusChangedAt: expect.any(String),
        },
        {
          claimId: replaced.id,
          found: true,
          status: 'superseded',
          statusChangedAt: expect.any(String),
          supersededBy: replacement.id,
        },
        { claimId: 'claim-missing', found: false },
      ]);
    });

    it('verify rejects an empty id list', async () => {
      await expect(handler.handle(null, 'verify', { ids: [] })).rejects.toThrow();
    });

    it('statusChangedAt moves on transitions but not on evidence-only appends', async () => {
      const claim = await assertClaim();
      expect(claim.statusChangedAt).toBe(claim.createdAt);

      await sleep(15);
      const supported = (await handler.handle(BOB, 'support', {
        claimId: claim.id,
        evidenceRefs: ['ref-1'],
      })) as Claim;
      expect(supported.statusChangedAt > claim.statusChangedAt).toBe(true);

      await sleep(15);
      const appended = (await handler.handle(BOB, 'support', {
        claimId: claim.id,
        evidenceRefs: ['ref-2'],
      })) as Claim;
      // Evidence append without a status transition: updatedAt moves,
      // statusChangedAt does not.
      expect(appended.statusChangedAt).toBe(supported.statusChangedAt);
      expect(appended.updatedAt > supported.updatedAt).toBe(true);
    });

    it('changed_since returns transitions strictly after the cutoff', async () => {
      const untouched = await assertClaim('asserted before the cutoff');
      const invalidated = await assertClaim('invalidated after the cutoff');
      await sleep(15);
      const cutoff = new Date().toISOString();
      await sleep(15);
      await handler.handle(BOB, 'invalidate', { claimId: invalidated.id });

      const digest = (await handler.handle(null, 'changed_since', {
        since: cutoff,
      })) as { claims: Claim[]; count: number; since: string };
      expect(digest.since).toBe(cutoff);
      expect(digest.count).toBe(1);
      expect(digest.claims[0]!.id).toBe(invalidated.id);
      expect(digest.claims[0]!.status).toBe('invalidated');

      const everything = (await handler.handle(null, 'changed_since', {
        since: '1970-01-01T00:00:00Z',
        workspaceId: WS,
      })) as { claims: Claim[] };
      expect(new Set(everything.claims.map(c => c.id))).toEqual(
        new Set([untouched.id, invalidated.id]),
      );

      const otherWorkspace = (await handler.handle(null, 'changed_since', {
        since: '1970-01-01T00:00:00Z',
        workspaceId: 'ws-other',
      })) as { count: number };
      expect(otherWorkspace.count).toBe(0);
    });

    it('changed_since rejects a non-timestamp since', async () => {
      await expect(
        handler.handle(null, 'changed_since', { since: 'yesterday-ish' }),
      ).rejects.toThrow(/ISO 8601/);
    });
  });

  describe('claim:status emission (B3 in-process propagation)', () => {
    let events: Array<ThoughtEmitterEvents['claim:status']>;
    const listener = (event: ThoughtEmitterEvents['claim:status']): void => {
      events.push(event);
    };

    beforeEach(() => {
      events = [];
      thoughtEmitter.on('claim:status', listener);
    });

    afterEach(() => {
      thoughtEmitter.off('claim:status', listener);
    });

    it('invalidate emits old → new status with actor and workspace', async () => {
      const claim = await assertClaim();
      expect(events).toEqual([]); // creation is not a transition

      await handler.handle(BOB, 'invalidate', { claimId: claim.id });
      expect(events).toEqual([
        {
          claimId: claim.id,
          oldStatus: 'asserted',
          newStatus: 'invalidated',
          actor: BOB,
          workspaceId: WS,
        },
      ]);

      // Idempotent re-invalidation does not re-emit.
      await handler.handle(BOB, 'invalidate', { claimId: claim.id });
      expect(events).toHaveLength(1);
    });

    it('support emits only on the asserted → supported transition', async () => {
      const claim = await assertClaim();
      await handler.handle(BOB, 'support', { claimId: claim.id, evidenceRefs: ['ref-1'] });
      expect(events).toEqual([
        {
          claimId: claim.id,
          oldStatus: 'asserted',
          newStatus: 'supported',
          actor: BOB,
          workspaceId: WS,
        },
      ]);

      // Evidence append without a transition stays silent.
      await handler.handle(BOB, 'support', { claimId: claim.id, evidenceRefs: ['ref-2'] });
      expect(events).toHaveLength(1);
    });

    it('supersede emits one event, for the superseded claim only', async () => {
      const old = await assertClaim('the old way');
      await handler.handle(BOB, 'supersede', { claimId: old.id, statement: 'the new way' });
      expect(events).toEqual([
        {
          claimId: old.id,
          oldStatus: 'asserted',
          newStatus: 'superseded',
          actor: BOB,
          workspaceId: WS,
        },
      ]);
    });
  });

  it('rejects unknown operations', async () => {
    await expect(handler.handle(ALICE, 'destroy', {})).rejects.toThrow(
      /Unknown claims operation/,
    );
  });
});
