/**
 * SupabaseHubStorage integration tests (SPEC-V1-INITIATIVE Phase 4.3, c11).
 *
 * Runs the HubStorage contract against both backends (filesystem and local
 * Supabase), then covers Supabase-specific guarantees: concurrent append
 * safety across instances (c11), optimistic concurrency on aggregates, and
 * tenant isolation. Supabase tests skip gracefully when the local stack is
 * not running (see src/__tests__/supabase-test-helpers.ts).
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createFileSystemHubStorage } from '../hub-storage-fs.js';
import { SupabaseHubStorage } from '../supabase-hub-storage.js';
import type {
  HubStorage,
  AgentIdentity,
  Workspace,
  Problem,
  Proposal,
  Review,
  ConsensusMarker,
  Channel,
  ChannelMessage,
} from '../hub-types.js';
import {
  createServiceClient,
  ensureTestWorkspace,
  isSupabaseAvailable,
  SUPABASE_TEST_URL,
  SUPABASE_TEST_SERVICE_ROLE_KEY,
  TEST_WORKSPACE_ID,
} from '../../__tests__/supabase-test-helpers.js';

const TENANT_B_WORKSPACE_ID = '22222222-2222-4222-a222-222222222222';

function makeAgent(name: string): AgentIdentity {
  return {
    agentId: `agent-${name}-${randomUUID()}`,
    name,
    role: 'coordinator',
    profile: 'MANAGER',
    clientInfo: 'vitest',
    registeredAt: new Date().toISOString(),
  };
}

function makeWorkspace(createdBy: string): Workspace {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    name: 'contract workspace',
    description: 'storage contract',
    createdBy,
    mainSessionId: randomUUID(),
    agents: [
      {
        agentId: createdBy,
        role: 'coordinator',
        joinedAt: now,
        status: 'online',
        lastSeenAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

function makeProblem(workspaceId: string, createdBy: string): Problem {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    workspaceId,
    title: 'contract problem',
    description: 'round-trip me',
    createdBy,
    status: 'open',
    comments: [],
    createdAt: now,
    updatedAt: now,
  };
}

function makeProposal(workspaceId: string, createdBy: string): Proposal {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    workspaceId,
    title: 'contract proposal',
    description: 'merge me',
    createdBy,
    sourceBranch: 'branch-1',
    status: 'open',
    reviews: [],
    createdAt: now,
    updatedAt: now,
  };
}

function makeReview(proposalId: string, reviewerId: string): Review {
  return {
    id: randomUUID(),
    proposalId,
    reviewerId,
    verdict: 'approve',
    reasoning: 'looks good',
    thoughtRefs: [3, 5],
    createdAt: new Date().toISOString(),
  };
}

function makeMarker(workspaceId: string, agentId: string): ConsensusMarker {
  return {
    id: randomUUID(),
    workspaceId,
    name: 'design locked',
    description: 'agreed on schema',
    thoughtRef: 12,
    agreedBy: [agentId],
    createdAt: new Date().toISOString(),
  };
}

function makeMessage(agentId: string, content: string, timestamp: string): ChannelMessage {
  return {
    id: randomUUID(),
    agentId,
    content,
    timestamp,
    ref: { sessionId: 'sess-1', thoughtNumber: 4 },
  };
}

async function cleanupHubTables(): Promise<void> {
  const client = createServiceClient();
  // hub_workspaces cascades to problems, proposals, reviews, markers,
  // endorsements, channels, and messages.
  await client.from('hub_workspaces').delete().neq('id', '');
  await client.from('hub_agents').delete().neq('agent_id', '');
}

async function ensureTenantBWorkspace(): Promise<string> {
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
  return TENANT_B_WORKSPACE_ID;
}

function makeSupabaseHubStorage(tenantWorkspaceId: string): SupabaseHubStorage {
  return new SupabaseHubStorage({
    supabaseUrl: SUPABASE_TEST_URL,
    serviceRoleKey: SUPABASE_TEST_SERVICE_ROLE_KEY,
    tenantWorkspaceId,
  });
}

// =============================================================================
// Shared HubStorage contract
// =============================================================================

function runHubStorageContract(
  getStorage: () => HubStorage,
  isAvailable: () => boolean,
): void {
  it('round-trips agents (including updates and optional fields)', async ({ skip }) => {
    if (!isAvailable()) skip();
    const storage = getStorage();

    const alice = makeAgent('alice');
    const minimal: AgentIdentity = {
      agentId: `agent-min-${randomUUID()}`,
      name: 'minimal',
      role: 'contributor',
      registeredAt: new Date().toISOString(),
    };
    await storage.saveAgent(alice);
    await storage.saveAgent(minimal);

    expect(await storage.getAgent(alice.agentId)).toEqual(alice);
    expect(await storage.getAgent(minimal.agentId)).toEqual(minimal);
    expect(await storage.getAgent('missing-agent')).toBeNull();
    expect(await storage.getAgents()).toEqual(
      expect.arrayContaining([alice, minimal]),
    );

    await storage.saveAgent({ ...alice, name: 'alice-renamed' });
    expect((await storage.getAgent(alice.agentId))!.name).toBe('alice-renamed');
  });

  it('round-trips workspaces and supports read-modify-write updates', async ({ skip }) => {
    if (!isAvailable()) skip();
    const storage = getStorage();

    const alice = makeAgent('alice');
    await storage.saveAgent(alice);
    const workspace = makeWorkspace(alice.agentId);
    await storage.saveWorkspace(workspace);

    expect(await storage.getWorkspace(workspace.id)).toEqual(workspace);
    expect(await storage.getWorkspace('missing-ws')).toBeNull();
    expect(await storage.listWorkspaces()).toEqual([workspace]);

    const fetched = await storage.getWorkspace(workspace.id);
    const now = new Date().toISOString();
    fetched!.agents.push({
      agentId: 'agent-bob',
      role: 'contributor',
      joinedAt: now,
      status: 'online',
      lastSeenAt: now,
    });
    fetched!.updatedAt = now;
    await storage.saveWorkspace(fetched!);

    const reloaded = await storage.getWorkspace(workspace.id);
    expect(reloaded!.agents).toHaveLength(2);
    expect(reloaded!.agents[1]!.agentId).toBe('agent-bob');
  });

  it('round-trips problems with optional fields and comments', async ({ skip }) => {
    if (!isAvailable()) skip();
    const storage = getStorage();

    const alice = makeAgent('alice');
    await storage.saveAgent(alice);
    const workspace = makeWorkspace(alice.agentId);
    await storage.saveWorkspace(workspace);

    const parent = makeProblem(workspace.id, alice.agentId);
    await storage.saveProblem(parent);

    const full: Problem = {
      ...makeProblem(workspace.id, alice.agentId),
      assignedTo: alice.agentId,
      status: 'in-progress',
      branchId: 'branch-x',
      branchFromThought: 9,
      resolution: 'pending',
      dependsOn: [parent.id],
      parentId: parent.id,
      comments: [
        {
          id: randomUUID(),
          agentId: alice.agentId,
          content: 'a comment',
          createdAt: new Date().toISOString(),
        },
      ],
    };
    await storage.saveProblem(full);

    expect(await storage.getProblem(workspace.id, parent.id)).toEqual(parent);
    expect(await storage.getProblem(workspace.id, full.id)).toEqual(full);
    expect(await storage.getProblem(workspace.id, 'missing')).toBeNull();
    expect(await storage.listProblems(workspace.id)).toEqual(
      expect.arrayContaining([parent, full]),
    );

    const fetched = await storage.getProblem(workspace.id, full.id);
    fetched!.status = 'resolved';
    fetched!.resolution = 'done';
    fetched!.updatedAt = new Date().toISOString();
    await storage.saveProblem(fetched!);
    expect((await storage.getProblem(workspace.id, full.id))!.status).toBe('resolved');
  });

  it('round-trips proposals; appendReview retains reviews and sets reviewing', async ({ skip }) => {
    if (!isAvailable()) skip();
    const storage = getStorage();

    const alice = makeAgent('alice');
    await storage.saveAgent(alice);
    const workspace = makeWorkspace(alice.agentId);
    await storage.saveWorkspace(workspace);

    const proposal = makeProposal(workspace.id, alice.agentId);
    await storage.saveProposal(proposal);
    expect(await storage.getProposal(workspace.id, proposal.id)).toEqual(proposal);
    expect(await storage.getProposal(workspace.id, 'missing')).toBeNull();

    const review = makeReview(proposal.id, 'agent-bob');
    await storage.appendReview(workspace.id, proposal.id, review);

    const reviewed = await storage.getProposal(workspace.id, proposal.id);
    expect(reviewed!.reviews).toEqual([review]);
    expect(reviewed!.status).toBe('reviewing');

    reviewed!.status = 'merged';
    reviewed!.mergeThoughtNumber = 7;
    reviewed!.updatedAt = new Date().toISOString();
    await storage.saveProposal(reviewed!);

    const merged = await storage.getProposal(workspace.id, proposal.id);
    expect(merged!.status).toBe('merged');
    expect(merged!.mergeThoughtNumber).toBe(7);
    expect(merged!.reviews).toEqual([review]);
    expect(await storage.listProposals(workspace.id)).toEqual([merged]);
  });

  it('appendReview is idempotent on review id (at-least-once retry)', async ({ skip }) => {
    if (!isAvailable()) skip();
    const storage = getStorage();

    const alice = makeAgent('alice');
    await storage.saveAgent(alice);
    const workspace = makeWorkspace(alice.agentId);
    await storage.saveWorkspace(workspace);
    const proposal = makeProposal(workspace.id, alice.agentId);
    await storage.saveProposal(proposal);

    const review = makeReview(proposal.id, 'agent-bob');
    await storage.appendReview(workspace.id, proposal.id, review);
    await storage.appendReview(workspace.id, proposal.id, review);

    const reviewed = await storage.getProposal(workspace.id, proposal.id);
    expect(reviewed!.reviews).toEqual([review]);
    expect(reviewed!.status).toBe('reviewing');
  });

  it('round-trips consensus markers; appendEndorsement is idempotent', async ({ skip }) => {
    if (!isAvailable()) skip();
    const storage = getStorage();

    const alice = makeAgent('alice');
    await storage.saveAgent(alice);
    const workspace = makeWorkspace(alice.agentId);
    await storage.saveWorkspace(workspace);

    const marker = makeMarker(workspace.id, alice.agentId);
    await storage.saveConsensusMarker(marker);
    expect(await storage.getConsensusMarker(workspace.id, marker.id)).toEqual(marker);
    expect(await storage.getConsensusMarker(workspace.id, 'missing')).toBeNull();

    await storage.appendEndorsement(workspace.id, marker.id, 'agent-bob');
    await storage.appendEndorsement(workspace.id, marker.id, 'agent-bob');

    const endorsed = await storage.getConsensusMarker(workspace.id, marker.id);
    expect(endorsed!.agreedBy).toHaveLength(2);
    expect(endorsed!.agreedBy).toEqual(
      expect.arrayContaining([alice.agentId, 'agent-bob']),
    );
    expect(await storage.listConsensusMarkers(workspace.id)).toEqual([endorsed]);
  });

  it('round-trips channels; appendMessage preserves order and counts', async ({ skip }) => {
    if (!isAvailable()) skip();
    const storage = getStorage();

    const alice = makeAgent('alice');
    await storage.saveAgent(alice);
    const workspace = makeWorkspace(alice.agentId);
    await storage.saveWorkspace(workspace);
    const problem = makeProblem(workspace.id, alice.agentId);
    await storage.saveProblem(problem);

    const channel: Channel = {
      id: problem.id,
      workspaceId: workspace.id,
      problemId: problem.id,
      messages: [],
    };
    await storage.saveChannel(channel);
    expect(await storage.getChannel(workspace.id, problem.id)).toEqual(channel);
    expect(await storage.getChannel(workspace.id, 'missing')).toBeNull();

    const base = Date.now();
    const first = makeMessage(alice.agentId, 'first', new Date(base).toISOString());
    const second = makeMessage(alice.agentId, 'second', new Date(base + 1000).toISOString());
    expect(await storage.appendMessage(workspace.id, problem.id, first)).toBe(1);
    expect(await storage.appendMessage(workspace.id, problem.id, second)).toBe(2);

    const reloaded = await storage.getChannel(workspace.id, problem.id);
    expect(reloaded!.messages).toEqual([first, second]);

    await expect(
      storage.appendMessage(workspace.id, 'missing-problem', first),
    ).rejects.toThrow(/Channel not found/);
  });
}

// =============================================================================
// Contract: FileSystemHubStorage
// =============================================================================

describe('HubStorage contract — FileSystemHubStorage', () => {
  let dataDir: string;
  let storage: HubStorage;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'hub-fs-contract-'));
    storage = createFileSystemHubStorage(dataDir);
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  runHubStorageContract(() => storage, () => true);
});

// =============================================================================
// Contract: SupabaseHubStorage (local stack)
// =============================================================================

describe('HubStorage contract — SupabaseHubStorage', () => {
  let available = false;
  let storage: HubStorage;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
  });

  beforeEach(async () => {
    if (!available) return;
    await cleanupHubTables();
    await ensureTestWorkspace();
    storage = makeSupabaseHubStorage(TEST_WORKSPACE_ID);
  });

  runHubStorageContract(() => storage, () => available);
});

// =============================================================================
// Supabase-specific guarantees
// =============================================================================

describe('SupabaseHubStorage — concurrent appends (c11)', () => {
  let available = false;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
  });

  beforeEach(async () => {
    if (!available) return;
    await cleanupHubTables();
    await ensureTestWorkspace();
  });

  it('two instances appending concurrently lose no messages or reviews', async ({ skip }) => {
    if (!available) skip();
    // Two storage instances simulate two Cloud Run server instances.
    const writerA = makeSupabaseHubStorage(TEST_WORKSPACE_ID);
    const writerB = makeSupabaseHubStorage(TEST_WORKSPACE_ID);

    const alice = makeAgent('alice');
    await writerA.saveAgent(alice);
    const workspace = makeWorkspace(alice.agentId);
    await writerA.saveWorkspace(workspace);
    const problem = makeProblem(workspace.id, alice.agentId);
    await writerA.saveProblem(problem);
    await writerA.saveChannel({
      id: problem.id,
      workspaceId: workspace.id,
      problemId: problem.id,
      messages: [],
    });
    const proposal = makeProposal(workspace.id, alice.agentId);
    await writerA.saveProposal(proposal);

    const messages = Array.from({ length: 10 }, (_, i) =>
      makeMessage(i % 2 === 0 ? 'agent-a' : 'agent-b', `msg-${i}`, new Date().toISOString()),
    );
    const reviews = Array.from({ length: 4 }, (_, i) =>
      makeReview(proposal.id, `reviewer-${i}`),
    );

    await Promise.all([
      ...messages.map((message, i) =>
        (i % 2 === 0 ? writerA : writerB).appendMessage(workspace.id, problem.id, message),
      ),
      ...reviews.map((review, i) =>
        (i % 2 === 0 ? writerA : writerB).appendReview(workspace.id, proposal.id, review),
      ),
    ]);

    // Verify via a fresh instance (no shared in-process state).
    const reader = makeSupabaseHubStorage(TEST_WORKSPACE_ID);
    const channel = await reader.getChannel(workspace.id, problem.id);
    expect(channel!.messages).toHaveLength(10);
    expect(new Set(channel!.messages.map(m => m.id))).toEqual(
      new Set(messages.map(m => m.id)),
    );

    const reviewed = await reader.getProposal(workspace.id, proposal.id);
    expect(reviewed!.reviews).toHaveLength(4);
    expect(new Set(reviewed!.reviews.map(r => r.id))).toEqual(
      new Set(reviews.map(r => r.id)),
    );
    expect(reviewed!.status).toBe('reviewing');
  });

  it('concurrent endorsements from two instances are all retained', async ({ skip }) => {
    if (!available) skip();
    const writerA = makeSupabaseHubStorage(TEST_WORKSPACE_ID);
    const writerB = makeSupabaseHubStorage(TEST_WORKSPACE_ID);

    const alice = makeAgent('alice');
    await writerA.saveAgent(alice);
    const workspace = makeWorkspace(alice.agentId);
    await writerA.saveWorkspace(workspace);
    const marker = makeMarker(workspace.id, alice.agentId);
    await writerA.saveConsensusMarker(marker);

    await Promise.all([
      writerA.appendEndorsement(workspace.id, marker.id, 'agent-a1'),
      writerA.appendEndorsement(workspace.id, marker.id, 'agent-a2'),
      writerB.appendEndorsement(workspace.id, marker.id, 'agent-b1'),
      writerB.appendEndorsement(workspace.id, marker.id, 'agent-b2'),
    ]);

    const reader = makeSupabaseHubStorage(TEST_WORKSPACE_ID);
    const endorsed = await reader.getConsensusMarker(workspace.id, marker.id);
    expect(endorsed!.agreedBy).toHaveLength(5);
    expect(endorsed!.agreedBy).toEqual(
      expect.arrayContaining([alice.agentId, 'agent-a1', 'agent-a2', 'agent-b1', 'agent-b2']),
    );
  });

  it('stale aggregate save fails fast instead of silently overwriting', async ({ skip }) => {
    if (!available) skip();
    const writerA = makeSupabaseHubStorage(TEST_WORKSPACE_ID);
    const writerB = makeSupabaseHubStorage(TEST_WORKSPACE_ID);

    const alice = makeAgent('alice');
    await writerA.saveAgent(alice);
    const workspace = makeWorkspace(alice.agentId);
    await writerA.saveWorkspace(workspace);

    const viewA = await writerA.getWorkspace(workspace.id);
    const viewB = await writerB.getWorkspace(workspace.id);

    viewA!.name = 'renamed by A';
    await writerA.saveWorkspace(viewA!);

    viewB!.name = 'renamed by B';
    await expect(writerB.saveWorkspace(viewB!)).rejects.toThrow(/concurrent update/);

    expect((await writerA.getWorkspace(workspace.id))!.name).toBe('renamed by A');
  });
});

describe('SupabaseHubStorage — tenant isolation', () => {
  let available = false;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
  });

  beforeEach(async () => {
    if (!available) return;
    await cleanupHubTables();
    await ensureTestWorkspace();
    await ensureTenantBWorkspace();
  });

  it('hub state is invisible across tenant workspaces', async ({ skip }) => {
    if (!available) skip();
    const tenantA = makeSupabaseHubStorage(TEST_WORKSPACE_ID);
    const tenantB = makeSupabaseHubStorage(TENANT_B_WORKSPACE_ID);

    const alice = makeAgent('alice');
    await tenantA.saveAgent(alice);
    const workspaceA = makeWorkspace(alice.agentId);
    await tenantA.saveWorkspace(workspaceA);
    const problemA = makeProblem(workspaceA.id, alice.agentId);
    await tenantA.saveProblem(problemA);
    await tenantA.saveChannel({
      id: problemA.id,
      workspaceId: workspaceA.id,
      problemId: problemA.id,
      messages: [],
    });

    expect(await tenantB.listWorkspaces()).toEqual([]);
    expect(await tenantB.getWorkspace(workspaceA.id)).toBeNull();
    expect(await tenantB.listProblems(workspaceA.id)).toEqual([]);
    expect(await tenantB.getProblem(workspaceA.id, problemA.id)).toBeNull();
    expect(await tenantB.getChannel(workspaceA.id, problemA.id)).toBeNull();

    const bob = makeAgent('bob');
    await tenantB.saveAgent(bob);
    const workspaceB = makeWorkspace(bob.agentId);
    await tenantB.saveWorkspace(workspaceB);

    expect((await tenantA.listWorkspaces()).map(ws => ws.id)).toEqual([workspaceA.id]);
    expect((await tenantB.listWorkspaces()).map(ws => ws.id)).toEqual([workspaceB.id]);
  });
});
