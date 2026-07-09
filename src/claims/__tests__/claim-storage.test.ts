/**
 * ClaimStorage contract suite (SPEC-AGX-SUBSTRATE B1, claim c1).
 *
 * Runs the shared contract against all three backends — InMemoryClaimStorage,
 * SqliteClaimStorage (local durable), and SupabaseClaimStorage (local stack) —
 * then covers backend-specific guarantees: SQLite restart survival and
 * cross-instance concurrency over the same database file; Supabase
 * cross-instance optimistic concurrency, idempotent appends across
 * instances, and tenant isolation. Supabase tests skip gracefully when the
 * local stack is not running (src/__tests__/supabase-test-helpers).
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import * as os from 'node:os';
import * as path from 'node:path';
import { mkdtempSync } from 'node:fs';
import { createClaimsHandler } from '../claims-handler.js';
import { InMemoryClaimStorage } from '../in-memory-claim-storage.js';
import { SqliteClaimStorage } from '../sqlite-claim-storage.js';
import { SupabaseClaimStorage } from '../supabase-claim-storage.js';
import { SupabaseHubStorage } from '../../hub/supabase-hub-storage.js';
import type { Claim, ClaimEdge, ClaimStorage, ClaimSubscription } from '../types.js';
import {
  createServiceClient,
  ensureTestWorkspace,
  isSupabaseAvailable,
  SUPABASE_TEST_URL,
  SUPABASE_TEST_SERVICE_ROLE_KEY,
  TEST_WORKSPACE_ID,
} from '../../__tests__/supabase-test-helpers.js';

const TENANT_B_WORKSPACE_ID = '22222222-2222-4222-a222-222222222222';

function makeClaim(workspaceId: string, overrides: Partial<Claim> = {}): Claim {
  const now = new Date().toISOString();
  return {
    id: `claim-${randomUUID()}`,
    workspaceId,
    type: 'assumption',
    statement: 'the auth service tolerates 30s clock skew',
    status: 'asserted',
    evidenceRefs: [],
    createdBy: 'agent-alice',
    createdAt: now,
    updatedAt: now,
    statusChangedAt: now,
    ...overrides,
  };
}

function makeEdge(
  fromClaim: string,
  toClaim: string,
  kind: ClaimEdge['kind'] = 'depends_on',
): ClaimEdge {
  return {
    fromClaim,
    toClaim,
    kind,
    createdBy: 'agent-alice',
    createdAt: new Date().toISOString(),
  };
}

function makeSubscription(claimId: string, subscriber: string): ClaimSubscription {
  return {
    claimId,
    subscriber,
    createdBy: 'agent-alice',
    createdAt: new Date().toISOString(),
  };
}

interface ContractContext {
  storage: ClaimStorage;
  workspaceId: string;
}

// =============================================================================
// Shared ClaimStorage contract
// =============================================================================

function runClaimStorageContract(
  ctx: () => ContractContext,
  isAvailable: () => boolean,
): void {
  it('round-trips claims including optional and updated fields', async ({ skip }) => {
    if (!isAvailable()) skip();
    const { storage, workspaceId } = ctx();

    const minimal = makeClaim(workspaceId);
    const full = makeClaim(workspaceId, {
      type: 'decision',
      status: 'supported',
      evidenceRefs: ['thought:sess-1/3', 'https://example.test/pr/1'],
      createdBy: 'agent-bob',
    });
    await storage.saveClaim(minimal);
    await storage.saveClaim(full);

    expect(await storage.getClaim(minimal.id)).toEqual(minimal);
    expect(await storage.getClaim(full.id)).toEqual(full);
    expect(await storage.getClaim('claim-missing')).toBeNull();

    const fetched = await storage.getClaim(full.id);
    fetched!.status = 'superseded';
    fetched!.supersededBy = minimal.id;
    fetched!.updatedAt = new Date().toISOString();
    await storage.saveClaim(fetched!);

    const reloaded = await storage.getClaim(full.id);
    expect(reloaded!.status).toBe('superseded');
    expect(reloaded!.supersededBy).toBe(minimal.id);
  });

  it('getClaims batch-fetches by id, preserving input order and skipping missing ids', async ({ skip }) => {
    if (!isAvailable()) skip();
    const { storage, workspaceId } = ctx();

    const first = makeClaim(workspaceId, { statement: 'first claim' });
    const second = makeClaim(workspaceId, { statement: 'second claim' });
    const third = makeClaim(workspaceId, { statement: 'third claim' });
    await storage.saveClaim(first);
    await storage.saveClaim(second);
    await storage.saveClaim(third);

    expect(await storage.getClaims([])).toEqual([]);
    expect(await storage.getClaims([third.id, 'claim-missing', first.id])).toEqual([
      third,
      first,
    ]);

    // Instances read through getClaims carry CAS versions like getClaim.
    const [view] = await storage.getClaims([second.id]);
    view!.status = 'supported';
    view!.updatedAt = new Date().toISOString();
    await storage.saveClaim(view!);
    expect((await storage.getClaim(second.id))!.status).toBe('supported');
  });

  it('supersedeClaim atomically inserts the replacement and flips the original', async ({ skip }) => {
    if (!isAvailable()) skip();
    const { storage, workspaceId } = ctx();

    const original = makeClaim(workspaceId, { statement: '30s clock skew tolerated' });
    await storage.saveClaim(original);

    const view = await storage.getClaim(original.id);
    const replacement = makeClaim(workspaceId, {
      statement: '5s clock skew tolerated (measured)',
    });
    view!.status = 'superseded';
    view!.supersededBy = replacement.id;
    view!.updatedAt = new Date().toISOString();
    await storage.supersedeClaim(view!, replacement);

    // Replacement exists as a fresh asserted claim; original points at it.
    // On Supabase this is exactly the path the immediate superseded_by FK
    // would reject if the two writes were not one transaction.
    const reloadedOriginal = await storage.getClaim(original.id);
    expect(reloadedOriginal!.status).toBe('superseded');
    expect(reloadedOriginal!.supersededBy).toBe(replacement.id);
    const reloadedReplacement = await storage.getClaim(replacement.id);
    expect(reloadedReplacement!.status).toBe('asserted');
    expect(reloadedReplacement!.statement).toBe('5s clock skew tolerated (measured)');
  });

  it('rejects stale saves (optimistic concurrency on the claim aggregate)', async ({ skip }) => {
    if (!isAvailable()) skip();
    const { storage, workspaceId } = ctx();

    const claim = makeClaim(workspaceId);
    await storage.saveClaim(claim);

    const viewA = await storage.getClaim(claim.id);
    const viewB = await storage.getClaim(claim.id);

    viewA!.status = 'supported';
    viewA!.updatedAt = new Date().toISOString();
    await storage.saveClaim(viewA!);

    viewB!.status = 'invalidated';
    viewB!.updatedAt = new Date().toISOString();
    await expect(storage.saveClaim(viewB!)).rejects.toThrow(/concurrent update/);

    expect((await storage.getClaim(claim.id))!.status).toBe('supported');
  });

  it('queries claims by type, status, agent, and text', async ({ skip }) => {
    if (!isAvailable()) skip();
    const { storage, workspaceId } = ctx();

    const assumption = makeClaim(workspaceId, {
      statement: 'Redis survives container restarts',
    });
    const decision = makeClaim(workspaceId, {
      type: 'decision',
      status: 'supported',
      statement: 'use Supabase for persistence',
      createdBy: 'agent-bob',
    });
    await storage.saveClaim(assumption);
    await storage.saveClaim(decision);

    expect(await storage.queryClaims({ workspaceId })).toHaveLength(2);
    expect(await storage.queryClaims({ workspaceId, type: 'decision' })).toEqual([decision]);
    expect(await storage.queryClaims({ workspaceId, status: 'asserted' })).toEqual([
      assumption,
    ]);
    expect(await storage.queryClaims({ workspaceId, createdBy: 'agent-bob' })).toEqual([
      decision,
    ]);
    expect(await storage.queryClaims({ workspaceId, text: 'SUPABASE' })).toEqual([decision]);
    expect(await storage.queryClaims({ workspaceId, text: 'no-such-text' })).toEqual([]);
    expect(
      await storage.queryClaims({ workspaceId: 'other-workspace-id' }),
    ).toEqual([]);
  });

  it('claimsChangedSince returns status changes strictly after the cutoff', async ({ skip }) => {
    if (!isAvailable()) skip();
    const { storage, workspaceId } = ctx();

    const t1 = '2026-06-12T01:00:00.000Z';
    const t2 = '2026-06-12T02:00:00.000Z';
    const t3 = '2026-06-12T03:00:00.000Z';
    const early = makeClaim(workspaceId, {
      statement: 'early transition',
      statusChangedAt: t1,
    });
    const boundary = makeClaim(workspaceId, {
      statement: 'exactly at the cutoff',
      status: 'supported',
      statusChangedAt: t2,
    });
    const late = makeClaim(workspaceId, {
      statement: 'late transition',
      status: 'invalidated',
      statusChangedAt: t3,
    });
    await storage.saveClaim(early);
    await storage.saveClaim(boundary);
    await storage.saveClaim(late);

    // Strictly after: the claim exactly at the cutoff is excluded.
    expect(await storage.claimsChangedSince(t2)).toEqual([late]);
    // Ordered by statusChangedAt ascending.
    expect(await storage.claimsChangedSince(t1)).toEqual([boundary, late]);
    expect(await storage.claimsChangedSince(t3)).toEqual([]);
    // Optional hub-workspace narrowing.
    expect(await storage.claimsChangedSince(t1, workspaceId)).toEqual([boundary, late]);
    expect(await storage.claimsChangedSince(t1, 'ws-other')).toEqual([]);
  });

  it('adds and lists edges; addEdge is idempotent and validates endpoints', async ({ skip }) => {
    if (!isAvailable()) skip();
    const { storage, workspaceId } = ctx();

    const base = makeClaim(workspaceId);
    const dependent = makeClaim(workspaceId, { statement: 'dependent claim' });
    const derived = makeClaim(workspaceId, { statement: 'derived claim' });
    await storage.saveClaim(base);
    await storage.saveClaim(dependent);
    await storage.saveClaim(derived);

    const dependsEdge = makeEdge(dependent.id, base.id, 'depends_on');
    const derivesEdge = makeEdge(derived.id, base.id, 'derives_from');
    await storage.addEdge(dependsEdge);
    await storage.addEdge(dependsEdge); // idempotent retry
    await storage.addEdge(derivesEdge);

    expect(await storage.listEdges({ toClaim: base.id })).toHaveLength(2);
    expect(await storage.listEdges({ toClaim: base.id, kind: 'depends_on' })).toEqual([
      dependsEdge,
    ]);
    expect(await storage.listEdges({ fromClaim: derived.id })).toEqual([derivesEdge]);
    expect(
      await storage.listEdges({ toClaims: [base.id], kind: 'derives_from' }),
    ).toEqual([derivesEdge]);
    expect(await storage.listEdges({ toClaims: [] })).toEqual([]);

    await expect(
      storage.addEdge(makeEdge(dependent.id, 'claim-missing')),
    ).rejects.toThrow();
  });

  it('manages subscriptions: idempotent add, list, remove', async ({ skip }) => {
    if (!isAvailable()) skip();
    const { storage, workspaceId } = ctx();

    const claim = makeClaim(workspaceId);
    await storage.saveClaim(claim);

    const agentSub = makeSubscription(claim.id, 'agent-bob');
    const cellSub = makeSubscription(claim.id, 'runbook:inst-1/cell-3');
    await storage.addSubscription(agentSub);
    await storage.addSubscription(agentSub); // idempotent retry
    await storage.addSubscription(cellSub);

    const listed = await storage.listSubscriptions(claim.id);
    expect(listed).toHaveLength(2);
    expect(new Set(listed.map(sub => sub.subscriber))).toEqual(
      new Set(['agent-bob', 'runbook:inst-1/cell-3']),
    );

    await storage.removeSubscription(claim.id, 'agent-bob');
    expect(await storage.listSubscriptions(claim.id)).toEqual([cellSub]);

    // Removing a non-existent subscription is a no-op
    await storage.removeSubscription(claim.id, 'agent-never-subscribed');
    expect(await storage.listSubscriptions(claim.id)).toEqual([cellSub]);

    await expect(
      storage.addSubscription(makeSubscription('claim-missing', 'agent-bob')),
    ).rejects.toThrow();
  });
}

// =============================================================================
// Contract: InMemoryClaimStorage
// =============================================================================

describe('ClaimStorage contract — InMemoryClaimStorage', () => {
  let context: ContractContext;

  beforeEach(() => {
    context = {
      storage: new InMemoryClaimStorage(),
      workspaceId: `ws-${randomUUID()}`,
    };
  });

  runClaimStorageContract(() => context, () => true);
});

// =============================================================================
// Contract: SqliteClaimStorage (local durable backend)
// =============================================================================

function freshClaimDbPath(): string {
  return path.join(mkdtempSync(path.join(os.tmpdir(), 'tb-claims-')), 'claims.db');
}

describe('ClaimStorage contract — SqliteClaimStorage', () => {
  let context: ContractContext;

  beforeEach(() => {
    context = {
      storage: new SqliteClaimStorage(freshClaimDbPath()),
      workspaceId: `ws-${randomUUID()}`,
    };
  });

  runClaimStorageContract(() => context, () => true);
});

describe('SqliteClaimStorage — restart survival and cross-instance behavior', () => {
  let dbPath: string;
  let workspaceId: string;

  beforeEach(() => {
    dbPath = freshClaimDbPath();
    workspaceId = `ws-${randomUUID()}`;
  });

  it('claims, edges, and subscriptions survive a restart (new storage on the same file)', async () => {
    const before = new SqliteClaimStorage(dbPath);
    const base = makeClaim(workspaceId, { statement: 'restart-durable claim' });
    const dependent = makeClaim(workspaceId, { statement: 'dependent claim' });
    await before.saveClaim(base);
    await before.saveClaim(dependent);
    await before.addEdge(makeEdge(dependent.id, base.id));
    // The B6 await-cell subscription shape: a parked runbook cell's durable
    // subscription row must survive the server restarting mid-await.
    const awaitSubscriber = `runbook:rbi-${randomUUID()}/wait1`;
    await before.addSubscription(makeSubscription(base.id, awaitSubscriber));
    before.close();

    const after = new SqliteClaimStorage(dbPath);
    expect(await after.getClaim(base.id)).toEqual(base);
    expect(await after.queryClaims({ workspaceId })).toHaveLength(2);
    expect(await after.listEdges({ toClaim: base.id })).toHaveLength(1);
    expect(
      (await after.listSubscriptions(base.id)).map(sub => sub.subscriber),
    ).toEqual([awaitSubscriber]);

    // The reloaded claim carries a live CAS version: status transitions
    // continue where they left off.
    const reloaded = await after.getClaim(base.id);
    reloaded!.status = 'supported';
    reloaded!.statusChangedAt = new Date().toISOString();
    reloaded!.updatedAt = reloaded!.statusChangedAt;
    await after.saveClaim(reloaded!);
    expect((await after.getClaim(base.id))!.status).toBe('supported');
  });

  it('stale save from a second instance over the same file fails fast', async () => {
    const writerA = new SqliteClaimStorage(dbPath);
    const writerB = new SqliteClaimStorage(dbPath);

    const claim = makeClaim(workspaceId);
    await writerA.saveClaim(claim);

    const viewA = await writerA.getClaim(claim.id);
    const viewB = await writerB.getClaim(claim.id);

    viewA!.status = 'supported';
    viewA!.updatedAt = new Date().toISOString();
    await writerA.saveClaim(viewA!);

    viewB!.status = 'invalidated';
    viewB!.updatedAt = new Date().toISOString();
    await expect(writerB.saveClaim(viewB!)).rejects.toThrow(/concurrent update/);
    expect((await writerA.getClaim(claim.id))!.status).toBe('supported');
  });

  it('supersede losing a cross-instance CAS race leaves no orphaned replacement', async () => {
    const storageA = new SqliteClaimStorage(dbPath);
    const storageB = new SqliteClaimStorage(dbPath);

    const claim = makeClaim(workspaceId);
    await storageA.saveClaim(claim);

    // Same interposition as the Supabase race test: as soon as the supersede
    // running through instance A reads the claim, instance B wins the
    // version race with a concurrent status update.
    let injectRace = true;
    const racingStorage: ClaimStorage = {
      getClaim: async claimId => {
        const result = await storageA.getClaim(claimId);
        if (injectRace) {
          injectRace = false;
          const viewB = await storageB.getClaim(claimId);
          viewB!.status = 'supported';
          viewB!.evidenceRefs = ['ref-from-racing-instance'];
          viewB!.updatedAt = new Date().toISOString();
          await storageB.saveClaim(viewB!);
        }
        return result;
      },
      getClaims: ids => storageA.getClaims(ids),
      saveClaim: candidate => storageA.saveClaim(candidate),
      supersedeClaim: (original, replacement) => storageA.supersedeClaim(original, replacement),
      queryClaims: query => storageA.queryClaims(query),
      addEdge: edge => storageA.addEdge(edge),
      listEdges: filter => storageA.listEdges(filter),
      addSubscription: subscription => storageA.addSubscription(subscription),
      removeSubscription: (id, subscriber) => storageA.removeSubscription(id, subscriber),
      listSubscriptions: id => storageA.listSubscriptions(id),
    };
    const racingHandler = createClaimsHandler(racingStorage);

    await expect(
      racingHandler.handle('agent-alice', 'supersede', {
        claimId: claim.id,
        statement: 'replacement that must not be orphaned',
      }),
    ).rejects.toThrow(/concurrent update/);

    // The lost race committed nothing: only the original row exists, with
    // the racing instance's update intact and no superseded_by pointer.
    const rows = await storageB.queryClaims({ workspaceId });
    expect(rows.map(row => row.id)).toEqual([claim.id]);
    expect(rows[0]!.status).toBe('supported');
    expect(rows[0]!.supersededBy).toBeUndefined();
  });

  it('edge and subscription appends from two instances are idempotent and all retained', async () => {
    const writerA = new SqliteClaimStorage(dbPath);
    const writerB = new SqliteClaimStorage(dbPath);

    const base = makeClaim(workspaceId);
    await writerA.saveClaim(base);
    const dependent = makeClaim(workspaceId, { statement: 'dependent' });
    await writerA.saveClaim(dependent);

    const edge = makeEdge(dependent.id, base.id);
    await writerA.addEdge(edge);
    await writerB.addEdge(edge); // at-least-once retry through another instance
    await writerA.addSubscription(makeSubscription(base.id, 'agent-a'));
    await writerB.addSubscription(makeSubscription(base.id, 'agent-b'));

    const reader = new SqliteClaimStorage(dbPath);
    expect(await reader.listEdges({ toClaim: base.id })).toHaveLength(1);
    expect(await reader.listSubscriptions(base.id)).toHaveLength(2);
  });
});

// =============================================================================
// Contract: SupabaseClaimStorage (local stack)
// =============================================================================

function makeSupabaseClaimStorage(tenantWorkspaceId: string): SupabaseClaimStorage {
  return new SupabaseClaimStorage({
    supabaseUrl: SUPABASE_TEST_URL,
    serviceRoleKey: SUPABASE_TEST_SERVICE_ROLE_KEY,
    tenantWorkspaceId,
  });
}

async function cleanupClaimTables(): Promise<void> {
  const client = createServiceClient();
  // claims cascades to claim_edges and claim_subscriptions, but
  // superseded_by self-references use ON DELETE SET NULL, so a plain bulk
  // delete is safe; hub_workspaces cleanup cascades the claims too.
  await client.from('claims').delete().neq('id', '');
  await client.from('hub_workspaces').delete().neq('id', '');
  await client.from('hub_agents').delete().neq('agent_id', '');
}

/** Claims FK to hub_workspaces: create the coordination space first. */
async function createHubWorkspace(tenantWorkspaceId: string): Promise<string> {
  const hubStorage = new SupabaseHubStorage({
    supabaseUrl: SUPABASE_TEST_URL,
    serviceRoleKey: SUPABASE_TEST_SERVICE_ROLE_KEY,
    tenantWorkspaceId,
  });
  const now = new Date().toISOString();
  const agentId = `agent-${randomUUID()}`;
  await hubStorage.saveAgent({
    agentId,
    name: 'claims-contract',
    role: 'coordinator',
    registeredAt: now,
  });
  const workspaceId = randomUUID();
  await hubStorage.saveWorkspace({
    id: workspaceId,
    name: 'claims contract workspace',
    description: 'claim graph contract tests',
    createdBy: agentId,
    mainSessionId: randomUUID(),
    agents: [],
    createdAt: now,
    updatedAt: now,
  });
  return workspaceId;
}

async function ensureTenantBWorkspace(): Promise<void> {
  const client = createServiceClient();
  const { data: users } = await client.auth.admin.listUsers();
  const testUser = users?.users?.find(u => u.email === 'test@test.local');
  if (!testUser) throw new Error('Test user missing; run ensureTestWorkspace first');
  const { error } = await client.from('workspaces').upsert(
    {
      id: TENANT_B_WORKSPACE_ID,
      name: 'Test Workspace B',
      slug: 'test-workspace-b',
      owner_user_id: testUser.id,
      status: 'active',
      plan_id: 'free',
    },
    { onConflict: 'id' },
  );
  if (error) throw new Error(`Failed to create tenant B workspace: ${error.message}`);
}

describe('ClaimStorage contract — SupabaseClaimStorage', () => {
  let available = false;
  let context: ContractContext;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
  });

  beforeEach(async () => {
    if (!available) return;
    await cleanupClaimTables();
    await ensureTestWorkspace();
    context = {
      storage: makeSupabaseClaimStorage(TEST_WORKSPACE_ID),
      workspaceId: await createHubWorkspace(TEST_WORKSPACE_ID),
    };
  });

  runClaimStorageContract(() => context, () => available);
});

// =============================================================================
// Supabase-specific guarantees
// =============================================================================

describe('SupabaseClaimStorage — cross-instance behavior', () => {
  let available = false;
  let workspaceId: string;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
  });

  beforeEach(async () => {
    if (!available) return;
    await cleanupClaimTables();
    await ensureTestWorkspace();
    workspaceId = await createHubWorkspace(TEST_WORKSPACE_ID);
  });

  it('stale save from a second instance fails fast', async ({ skip }) => {
    if (!available) skip();
    const writerA = makeSupabaseClaimStorage(TEST_WORKSPACE_ID);
    const writerB = makeSupabaseClaimStorage(TEST_WORKSPACE_ID);

    const claim = makeClaim(workspaceId);
    await writerA.saveClaim(claim);

    const viewA = await writerA.getClaim(claim.id);
    const viewB = await writerB.getClaim(claim.id);

    viewA!.status = 'supported';
    await writerA.saveClaim(viewA!);

    viewB!.status = 'invalidated';
    await expect(writerB.saveClaim(viewB!)).rejects.toThrow(/concurrent update/);
    expect((await writerA.getClaim(claim.id))!.status).toBe('supported');
  });

  it('supersede losing a cross-instance CAS race leaves no orphaned replacement', async ({ skip }) => {
    if (!available) skip();
    const storageA = makeSupabaseClaimStorage(TEST_WORKSPACE_ID);
    const storageB = makeSupabaseClaimStorage(TEST_WORKSPACE_ID);

    const claim = makeClaim(workspaceId);
    await storageA.saveClaim(claim);

    // Interpose on storage A's getClaim: as soon as the supersede running
    // through instance A reads the claim, instance B wins the version race
    // with a concurrent status update.
    let injectRace = true;
    const racingStorage: ClaimStorage = {
      getClaim: async claimId => {
        const result = await storageA.getClaim(claimId);
        if (injectRace) {
          injectRace = false;
          const viewB = await storageB.getClaim(claimId);
          viewB!.status = 'supported';
          viewB!.evidenceRefs = ['ref-from-racing-instance'];
          viewB!.updatedAt = new Date().toISOString();
          await storageB.saveClaim(viewB!);
        }
        return result;
      },
      getClaims: ids => storageA.getClaims(ids),
      saveClaim: candidate => storageA.saveClaim(candidate),
      supersedeClaim: (original, replacement) => storageA.supersedeClaim(original, replacement),
      queryClaims: query => storageA.queryClaims(query),
      addEdge: edge => storageA.addEdge(edge),
      listEdges: filter => storageA.listEdges(filter),
      addSubscription: subscription => storageA.addSubscription(subscription),
      removeSubscription: (id, subscriber) => storageA.removeSubscription(id, subscriber),
      listSubscriptions: id => storageA.listSubscriptions(id),
    };
    const racingHandler = createClaimsHandler(racingStorage);

    await expect(
      racingHandler.handle('agent-alice', 'supersede', {
        claimId: claim.id,
        statement: 'replacement that must not be orphaned',
      }),
    ).rejects.toThrow(/concurrent update/);

    // The lost race committed nothing: only the original row exists, with
    // the racing instance's update intact and no superseded_by pointer.
    const rows = await storageB.queryClaims({ workspaceId });
    expect(rows.map(row => row.id)).toEqual([claim.id]);
    expect(rows[0]!.status).toBe('supported');
    expect(rows[0]!.supersededBy).toBeUndefined();
  });

  it('concurrent edge and subscription appends from two instances are all retained', async ({ skip }) => {
    if (!available) skip();
    const writerA = makeSupabaseClaimStorage(TEST_WORKSPACE_ID);
    const writerB = makeSupabaseClaimStorage(TEST_WORKSPACE_ID);

    const base = makeClaim(workspaceId);
    await writerA.saveClaim(base);
    const dependents = await Promise.all(
      Array.from({ length: 4 }, async (_, i) => {
        const claim = makeClaim(workspaceId, { statement: `dependent ${i}` });
        await writerA.saveClaim(claim);
        return claim;
      }),
    );

    await Promise.all([
      ...dependents.map((claim, i) =>
        (i % 2 === 0 ? writerA : writerB).addEdge(makeEdge(claim.id, base.id)),
      ),
      ...dependents.map((claim, i) =>
        (i % 2 === 0 ? writerA : writerB).addSubscription(
          makeSubscription(base.id, `agent-${i}`),
        ),
      ),
    ]);

    const reader = makeSupabaseClaimStorage(TEST_WORKSPACE_ID);
    expect(await reader.listEdges({ toClaim: base.id })).toHaveLength(4);
    expect(await reader.listSubscriptions(base.id)).toHaveLength(4);
  });
});

describe('SupabaseClaimStorage — tenant isolation', () => {
  let available = false;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
  });

  beforeEach(async () => {
    if (!available) return;
    await cleanupClaimTables();
    await ensureTestWorkspace();
    await ensureTenantBWorkspace();
  });

  it('claims, edges, and subscriptions are invisible across tenants', async ({ skip }) => {
    if (!available) skip();
    const tenantA = makeSupabaseClaimStorage(TEST_WORKSPACE_ID);
    const tenantB = makeSupabaseClaimStorage(TENANT_B_WORKSPACE_ID);

    const workspaceA = await createHubWorkspace(TEST_WORKSPACE_ID);
    const workspaceB = await createHubWorkspace(TENANT_B_WORKSPACE_ID);

    const claimA1 = makeClaim(workspaceA);
    const claimA2 = makeClaim(workspaceA, { statement: 'second claim in tenant A' });
    await tenantA.saveClaim(claimA1);
    await tenantA.saveClaim(claimA2);
    await tenantA.addEdge(makeEdge(claimA2.id, claimA1.id));
    await tenantA.addSubscription(makeSubscription(claimA1.id, 'agent-a'));

    // Tenant B sees nothing of tenant A's graph, even with exact ids.
    expect(await tenantB.getClaim(claimA1.id)).toBeNull();
    expect(await tenantB.getClaims([claimA1.id, claimA2.id])).toEqual([]);
    expect(await tenantB.queryClaims({ workspaceId: workspaceA })).toEqual([]);
    expect(await tenantB.listEdges({ toClaim: claimA1.id })).toEqual([]);
    expect(await tenantB.listSubscriptions(claimA1.id)).toEqual([]);

    // And tenant B's own writes stay invisible to tenant A.
    const claimB = makeClaim(workspaceB, { statement: 'tenant B claim' });
    await tenantB.saveClaim(claimB);
    expect(await tenantA.getClaim(claimB.id)).toBeNull();
    expect(await tenantA.queryClaims({ workspaceId: workspaceB })).toEqual([]);

    expect((await tenantA.queryClaims({ workspaceId: workspaceA })).map(c => c.id)).toEqual(
      expect.arrayContaining([claimA1.id, claimA2.id]),
    );
    expect((await tenantB.queryClaims({ workspaceId: workspaceB })).map(c => c.id)).toEqual([
      claimB.id,
    ]);
  });
});
