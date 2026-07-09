/**
 * B11 standing-facts shim tests (SPEC-AGX-SUBSTRATE — Principle 3 migration
 * shim): the assumption-registry / session-handoff round-trip through
 * tb.claims. Proves write → read-back → supersede semantics over the real
 * claims handler and InMemoryClaimStorage.
 */

import { describe, expect, it } from 'vitest';
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
  return { facts: createStandingFacts(handler), storage };
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
