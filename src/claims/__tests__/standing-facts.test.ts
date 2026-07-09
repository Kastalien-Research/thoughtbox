/**
 * B11 standing-facts shim tests (SPEC-AGX-SUBSTRATE — Principle 3 migration
 * shim): the assumption-registry / session-handoff round-trip through
 * tb.claims. Proves write → read-back → supersede semantics over the real
 * claims handler and InMemoryClaimStorage.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Claim } from '../types.js';
import { createClaimsHandler } from '../claims-handler.js';
import { InMemoryClaimStorage } from '../in-memory-claim-storage.js';
import {
  createStandingFacts,
  decodeFactStatement,
  encodeFactStatement,
  normalizeFactKey,
} from '../standing-facts.js';

const WORKSPACE = 'ws-standing-facts';
const AGENT = 'agent-shim-test';

function setup() {
  const storage = new InMemoryClaimStorage();
  const handler = createClaimsHandler(storage);
  return { facts: createStandingFacts(handler), handler, storage };
}

const LIVE = new Set(['asserted', 'supported']);

/** All fact claims (any status) for one key, via the handler's own query. */
async function factClaims(
  handler: ReturnType<typeof createClaimsHandler>,
  workspaceId: string,
  key: string,
): Promise<Claim[]> {
  const result = (await handler.handle(null, 'query', {
    workspaceId,
    text: `[fact:${key}]`,
  })) as { claims: Claim[] };
  return result.claims.filter(claim => claim.statement.startsWith(`[fact:${key}] `));
}

describe('standing-fact key encoding', () => {
  it('normalizes keys and rejects malformed ones', () => {
    expect(normalizeFactKey('  Local-Edge.Runtime_503 ')).toBe('local-edge.runtime_503');
    expect(() => normalizeFactKey('has spaces')).toThrow(/Invalid standing-fact key/);
    expect(() => normalizeFactKey('-leading-dash')).toThrow(/Invalid standing-fact key/);
    expect(() => normalizeFactKey('')).toThrow(/Invalid standing-fact key/);
  });

  it('round-trips statements through the encoding', () => {
    const encoded = encodeFactStatement('db.pool', 'pool size is 10');
    expect(encoded).toBe('[fact:db.pool] pool size is 10');
    expect(decodeFactStatement(encoded)).toEqual({ key: 'db.pool', statement: 'pool size is 10' });
    expect(decodeFactStatement('an ordinary claim statement')).toBeNull();
  });
});

describe('standing-facts round-trip (B11)', () => {
  it('writes a fact as a typed, workspace-scoped claim and reads it back', async () => {
    const { facts } = setup();

    const written = await facts.write(AGENT, {
      workspaceId: WORKSPACE,
      key: 'edge-runtime-503',
      statement: 'local Supabase edge runtime 503s under docker-compose',
      evidenceRefs: ['src/__tests__/branch-workers.test.ts'],
    });
    expect(written.claim.type).toBe('assumption'); // registry default
    expect(written.claim.workspaceId).toBe(WORKSPACE);
    expect(written.claim.status).toBe('asserted');
    expect(written.claim.createdBy).toBe(AGENT);

    const read = await facts.read(WORKSPACE, 'edge-runtime-503');
    expect(read).not.toBeNull();
    expect(read!.key).toBe('edge-runtime-503');
    expect(read!.statement).toBe('local Supabase edge runtime 503s under docker-compose');
    expect(read!.claim.id).toBe(written.claim.id);
  });

  it('scopes reads to the workspace and to the exact key', async () => {
    const { facts } = setup();
    await facts.write(AGENT, { workspaceId: WORKSPACE, key: 'db', statement: 'primary fact' });
    await facts.write(AGENT, { workspaceId: WORKSPACE, key: 'db-pool', statement: 'pool fact' });
    await facts.write(AGENT, { workspaceId: 'other-ws', key: 'db', statement: 'other workspace' });

    const read = await facts.read(WORKSPACE, 'db');
    expect(read!.statement).toBe('primary fact'); // "db" never matches "[fact:db-pool]"
    expect((await facts.read('other-ws', 'db'))!.statement).toBe('other workspace');
    expect(await facts.read(WORKSPACE, 'missing')).toBeNull();
  });

  it('refuses a duplicate write — revision is an explicit supersede', async () => {
    const { facts } = setup();
    await facts.write(AGENT, { workspaceId: WORKSPACE, key: 'dup', statement: 'v1' });

    await expect(
      facts.write(AGENT, { workspaceId: WORKSPACE, key: 'dup', statement: 'v2' }),
    ).rejects.toThrow(/already exists.*use supersede/);
  });

  it('supersede flips the old claim and the read converges on the replacement', async () => {
    const { facts } = setup();
    const first = await facts.write(AGENT, {
      workspaceId: WORKSPACE,
      key: 'deploy-target',
      statement: 'deploys to Cloud Run via docker push',
      type: 'decision',
    });

    const { previous, current } = await facts.supersede(AGENT, {
      workspaceId: WORKSPACE,
      key: 'deploy-target',
      statement: 'deploys to Cloud Run via Cloud Build triggers',
      type: 'decision',
    });

    // tb.claims supersede semantics, verbatim: old → 'superseded' pointing
    // at the replacement; replacement freshly 'asserted'.
    expect(previous.claim.id).toBe(first.claim.id);
    expect(previous.claim.status).toBe('superseded');
    expect(previous.claim.supersededBy).toBe(current.claim.id);
    expect(previous.statement).toBe('deploys to Cloud Run via docker push');
    expect(current.claim.status).toBe('asserted');
    expect(current.claim.type).toBe('decision');

    const read = await facts.read(WORKSPACE, 'deploy-target');
    expect(read!.claim.id).toBe(current.claim.id);
    expect(read!.statement).toBe('deploys to Cloud Run via Cloud Build triggers');
  });

  it('supersede of a missing fact fails with a pointer to write', async () => {
    const { facts } = setup();
    await expect(
      facts.supersede(AGENT, { workspaceId: WORKSPACE, key: 'ghost', statement: 'x' }),
    ).rejects.toThrow(/No live standing fact "ghost"/);
  });

  it('lists only live facts, superseded history excluded', async () => {
    const { facts } = setup();
    await facts.write(AGENT, { workspaceId: WORKSPACE, key: 'b-fact', statement: 'bee' });
    await facts.write(AGENT, { workspaceId: WORKSPACE, key: 'a-fact', statement: 'ay' });
    await facts.supersede(AGENT, { workspaceId: WORKSPACE, key: 'a-fact', statement: 'ay v2' });

    const listed = await facts.list(WORKSPACE);
    expect(listed.map(fact => [fact.key, fact.statement])).toEqual([
      ['a-fact', 'ay v2'],
      ['b-fact', 'bee'],
    ]);
  });

  it('requires an agent identity for mutations (tb.claims contract)', async () => {
    const { facts } = setup();
    await expect(
      facts.write('', { workspaceId: WORKSPACE, key: 'anon', statement: 'x' }),
    ).rejects.toThrow(/requires an agent identity/);
  });
});

describe('keyed uniqueness under concurrency (reconcile-based)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('concurrent duplicate writes: one winner, one already-exists rejection, one live fact', async () => {
    // The winner tiebreak on equal-millisecond createdAt is the (random)
    // claim id, so repeat the race to exercise both tiebreak outcomes.
    for (let round = 0; round < 25; round++) {
      const { facts, handler } = setup();

      const results = await Promise.allSettled([
        facts.write('agent-a', { workspaceId: WORKSPACE, key: 'race', statement: 'from a' }),
        facts.write('agent-b', { workspaceId: WORKSPACE, key: 'race', statement: 'from b' }),
      ]);

      // Exactly one caller wins; the other gets write's create-only error.
      const fulfilled = results.filter(
        (result): result is PromiseFulfilledResult<{ claim: Claim }> =>
          result.status === 'fulfilled',
      );
      const rejected = results.filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0]!.reason as Error).message).toMatch(/already exists.*use supersede/);

      // Both asserts landed (claims are never hard-deleted), exactly one is
      // still live, and it is the deterministic winner: oldest by
      // (createdAt, claim id ascending).
      const all = await factClaims(handler, WORKSPACE, 'race');
      expect(all).toHaveLength(2);
      const live = all.filter(claim => LIVE.has(claim.status));
      expect(live).toHaveLength(1);
      const expectedWinner = [...all].sort(
        (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
      )[0]!;
      expect(live[0]!.id).toBe(expectedWinner.id);
      expect(fulfilled[0]!.value.claim.id).toBe(expectedWinner.id);

      // Readers agree: read returns the winner, list has exactly one entry.
      const read = await facts.read(WORKSPACE, 'race');
      expect(read!.claim.id).toBe(expectedWinner.id);
      const listed = await facts.list(WORKSPACE);
      expect(listed.filter(fact => fact.key === 'race')).toHaveLength(1);
    }
  });

  it('read heals duplicate live facts seeded by bypassing the shim (oldest wins)', async () => {
    const { facts, handler } = setup();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-09T00:00:00.000Z'));
    const older = (await handler.handle(AGENT, 'assert', {
      workspaceId: WORKSPACE,
      type: 'assumption',
      statement: '[fact:dup-heal] older statement',
    })) as Claim;
    vi.setSystemTime(new Date('2026-07-09T00:00:01.000Z'));
    const newer = (await handler.handle(AGENT, 'assert', {
      workspaceId: WORKSPACE,
      type: 'assumption',
      statement: '[fact:dup-heal] newer statement',
    })) as Claim;
    vi.useRealTimers();

    // Both live: the duplicate writes bypassed the shim entirely.
    const before = await factClaims(handler, WORKSPACE, 'dup-heal');
    expect(before.filter(claim => LIVE.has(claim.status))).toHaveLength(2);

    // read converges on the oldest claim and retires the loser durably.
    const read = await facts.read(WORKSPACE, 'dup-heal');
    expect(read!.claim.id).toBe(older.id);
    expect(read!.statement).toBe('older statement');

    const after = await factClaims(handler, WORKSPACE, 'dup-heal');
    const live = after.filter(claim => LIVE.has(claim.status));
    expect(live).toHaveLength(1);
    expect(live[0]!.id).toBe(older.id);
    expect(after.find(claim => claim.id === newer.id)!.status).toBe('invalidated');
  });

  it('list heals duplicates and never returns two facts with the same key', async () => {
    const { facts, handler } = setup();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-09T00:00:00.000Z'));
    const older = (await handler.handle(AGENT, 'assert', {
      workspaceId: WORKSPACE,
      type: 'observation',
      statement: '[fact:dup-list] keep me',
    })) as Claim;
    vi.setSystemTime(new Date('2026-07-09T00:00:01.000Z'));
    await handler.handle(AGENT, 'assert', {
      workspaceId: WORKSPACE,
      type: 'observation',
      statement: '[fact:dup-list] drop me',
    });
    vi.useRealTimers();
    await facts.write(AGENT, { workspaceId: WORKSPACE, key: 'untouched', statement: 'fine' });

    const listed = await facts.list(WORKSPACE);
    expect(listed.map(fact => [fact.key, fact.statement])).toEqual([
      ['dup-list', 'keep me'],
      ['untouched', 'fine'],
    ]);
    expect(listed.find(fact => fact.key === 'dup-list')!.claim.id).toBe(older.id);

    // The heal is persistent, not per-call filtering: one live claim remains.
    const live = (await factClaims(handler, WORKSPACE, 'dup-list')).filter(claim =>
      LIVE.has(claim.status),
    );
    expect(live).toHaveLength(1);
    expect(live[0]!.id).toBe(older.id);
  });

  it('supersede heals duplicates first, so the replacement outranks stale losers', async () => {
    const { facts, handler } = setup();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-09T00:00:00.000Z'));
    await handler.handle(AGENT, 'assert', {
      workspaceId: WORKSPACE,
      type: 'assumption',
      statement: '[fact:dup-supersede] v1 winner',
    });
    vi.setSystemTime(new Date('2026-07-09T00:00:01.000Z'));
    await handler.handle(AGENT, 'assert', {
      workspaceId: WORKSPACE,
      type: 'assumption',
      statement: '[fact:dup-supersede] v1 duplicate',
    });
    vi.useRealTimers();

    const { current } = await facts.supersede(AGENT, {
      workspaceId: WORKSPACE,
      key: 'dup-supersede',
      statement: 'v2',
    });

    // Without the pre-supersede heal, the newer duplicate would stay live
    // and outrank the replacement (older createdAt) at the next reconcile.
    const read = await facts.read(WORKSPACE, 'dup-supersede');
    expect(read!.claim.id).toBe(current.claim.id);
    expect(read!.statement).toBe('v2');
    const live = (await factClaims(handler, WORKSPACE, 'dup-supersede')).filter(claim =>
      LIVE.has(claim.status),
    );
    expect(live).toHaveLength(1);
    expect(live[0]!.id).toBe(current.claim.id);
  });
});
