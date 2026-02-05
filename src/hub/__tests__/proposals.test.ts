import { describe, it, expect, beforeEach } from 'vitest';
import { createProposalsManager } from '../proposals.js';
import { createProblemsManager } from '../problems.js';
import { createWorkspaceManager } from '../workspace.js';
import { createIdentityManager } from '../identity.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';
import type { HubStorage } from '../hub-types.js';

describe('Proposals', () => {
  let storage: HubStorage;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;
  let identity: ReturnType<typeof createIdentityManager>;
  let workspace: ReturnType<typeof createWorkspaceManager>;
  let problems: ReturnType<typeof createProblemsManager>;
  let proposals: ReturnType<typeof createProposalsManager>;
  let aliceId: string;
  let bobId: string;
  let workspaceId: string;
  let mainSessionId: string;
  let problemId: string;

  beforeEach(async () => {
    storage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();
    identity = createIdentityManager(storage);
    workspace = createWorkspaceManager(storage, thoughtStore);
    problems = createProblemsManager(storage, thoughtStore);
    proposals = createProposalsManager(storage, thoughtStore);

    const alice = await identity.register({ name: 'alice' });
    aliceId = alice.agentId;
    const bob = await identity.register({ name: 'bob' });
    bobId = bob.agentId;

    const ws = await workspace.createWorkspace(aliceId, { name: 'test-ws', description: '...' });
    workspaceId = ws.workspaceId;
    mainSessionId = ws.mainSessionId;
    await workspace.joinWorkspace(bobId, { workspaceId });

    // Write 2 thoughts on main chain
    for (let i = 1; i <= 2; i++) {
      await thoughtStore.saveThought(mainSessionId, {
        thought: `thought ${i}`, thoughtNumber: i, totalThoughts: 2,
        nextThoughtNeeded: i < 2, timestamp: new Date().toISOString(),
      });
    }

    // Alice creates a problem, bob claims it
    const p = await problems.createProblem(aliceId, { workspaceId, title: 'Analyze Redis', description: '...' });
    problemId = p.problemId;
    await problems.claimProblem(bobId, { workspaceId, problemId, branchId: 'caching-analysis' });

    // Bob writes 3 thoughts on branch
    for (let i = 1; i <= 3; i++) {
      await thoughtStore.saveBranchThought(mainSessionId, 'caching-analysis', {
        thought: `branch thought ${i}`, thoughtNumber: i, totalThoughts: 3,
        nextThoughtNeeded: i < 3, branchId: 'caching-analysis', branchFromThought: 2,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // T-PP-1: Create proposal
  it('create proposal returns proposalId with open status', async () => {
    const result = await proposals.createProposal(bobId, {
      workspaceId, title: 'Redis caching strategy', description: '...',
      sourceBranch: 'caching-analysis', problemId,
    });

    expect(result.proposalId).toBeDefined();
    const proposal = await storage.getProposal(workspaceId, result.proposalId);
    expect(proposal!.status).toBe('open');
    expect(proposal!.createdBy).toBe(bobId);
    expect(proposal!.sourceBranch).toBe('caching-analysis');
  });

  // T-PP-2: Review proposal — approve
  it('review proposal with approve sets reviewing status', async () => {
    const { proposalId } = await proposals.createProposal(bobId, {
      workspaceId, title: 'Redis', description: '...', sourceBranch: 'caching-analysis', problemId,
    });

    const result = await proposals.reviewProposal(aliceId, {
      workspaceId, proposalId, verdict: 'approve', reasoning: 'Solid analysis',
    });

    expect(result.review.verdict).toBe('approve');
    expect(result.review.reviewerId).toBe(aliceId);
    expect(result.proposalStatus).toBe('reviewing');
  });

  // T-PP-3: Review proposal — request changes
  it('review proposal with request-changes', async () => {
    const { proposalId } = await proposals.createProposal(bobId, {
      workspaceId, title: 'Redis', description: '...', sourceBranch: 'caching-analysis', problemId,
    });

    const result = await proposals.reviewProposal(aliceId, {
      workspaceId, proposalId, verdict: 'request-changes', reasoning: 'Missing cost analysis',
    });

    expect(result.review.verdict).toBe('request-changes');
    expect(result.proposalStatus).toBe('reviewing');
  });

  // T-PP-4: Self-review is rejected
  it('self-review throws error', async () => {
    const { proposalId } = await proposals.createProposal(bobId, {
      workspaceId, title: 'Redis', description: '...', sourceBranch: 'caching-analysis', problemId,
    });

    await expect(
      proposals.reviewProposal(bobId, {
        workspaceId, proposalId, verdict: 'approve', reasoning: '...',
      }),
    ).rejects.toThrow('Cannot review your own proposal');
  });

  // T-PP-5: Merge proposal creates merge thought on main chain
  it('merge proposal creates merge thought on main chain', async () => {
    const { proposalId } = await proposals.createProposal(bobId, {
      workspaceId, title: 'Redis', description: '...', sourceBranch: 'caching-analysis', problemId,
    });

    await proposals.reviewProposal(aliceId, {
      workspaceId, proposalId, verdict: 'approve', reasoning: 'Good',
    });

    const result = await proposals.mergeProposal(aliceId, {
      workspaceId, proposalId, mergeMessage: 'Accepted: Redis is the right caching layer',
    });

    expect(result.mergeThoughtNumber).toBe(3); // Main chain had 2, merge is 3
    expect(result.proposal.status).toBe('merged');

    // Check merge thought exists on main chain
    const mergeThought = await thoughtStore.getThought(mainSessionId, 3);
    expect(mergeThought).not.toBeNull();
    expect(mergeThought!.thought).toBe('Accepted: Redis is the right caching layer');

    // Linked problem should be resolved
    const problem = await storage.getProblem(workspaceId, problemId);
    expect(problem!.status).toBe('resolved');
  });

  // T-PP-6: Merge without approval fails
  it('merge without approval throws error', async () => {
    const { proposalId } = await proposals.createProposal(bobId, {
      workspaceId, title: 'Redis', description: '...', sourceBranch: 'caching-analysis', problemId,
    });

    await expect(
      proposals.mergeProposal(aliceId, { workspaceId, proposalId, mergeMessage: '...' }),
    ).rejects.toThrow('Proposal has no approvals');
  });

  // T-PP-7: Merge by non-coordinator fails
  it('merge by non-coordinator throws error', async () => {
    const { proposalId } = await proposals.createProposal(bobId, {
      workspaceId, title: 'Redis', description: '...', sourceBranch: 'caching-analysis', problemId,
    });

    await proposals.reviewProposal(aliceId, {
      workspaceId, proposalId, verdict: 'approve', reasoning: 'Good',
    });

    await expect(
      proposals.mergeProposal(bobId, { workspaceId, proposalId, mergeMessage: '...' }),
    ).rejects.toThrow('Only coordinator can merge proposals');
  });

  // T-PP-8: Branch thoughts preserved after merge
  it('branch thoughts preserved after merge', async () => {
    const { proposalId } = await proposals.createProposal(bobId, {
      workspaceId, title: 'Redis', description: '...', sourceBranch: 'caching-analysis', problemId,
    });

    await proposals.reviewProposal(aliceId, {
      workspaceId, proposalId, verdict: 'approve', reasoning: 'Good',
    });

    await proposals.mergeProposal(aliceId, {
      workspaceId, proposalId, mergeMessage: 'Accepted',
    });

    const branchThoughts = await thoughtStore.getBranch(mainSessionId, 'caching-analysis');
    expect(branchThoughts).toHaveLength(3);
  });

  // T-PP-9: List proposals with status filter
  it('list proposals with status filter', async () => {
    await proposals.createProposal(bobId, {
      workspaceId, title: 'P1', description: '...', sourceBranch: 'caching-analysis',
    });

    // Create a second proposal and merge it
    const { proposalId: p2 } = await proposals.createProposal(bobId, {
      workspaceId, title: 'P2', description: '...', sourceBranch: 'caching-analysis',
    });
    await proposals.reviewProposal(aliceId, {
      workspaceId, proposalId: p2, verdict: 'approve', reasoning: 'ok',
    });
    await proposals.mergeProposal(aliceId, {
      workspaceId, proposalId: p2, mergeMessage: 'merged',
    });

    // Create a third proposal in reviewing
    const { proposalId: p3 } = await proposals.createProposal(bobId, {
      workspaceId, title: 'P3', description: '...', sourceBranch: 'caching-analysis',
    });
    await proposals.reviewProposal(aliceId, {
      workspaceId, proposalId: p3, verdict: 'comment', reasoning: 'hmm',
    });

    const result = await proposals.listProposals({ workspaceId, status: 'open' });
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].status).toBe('open');
  });

  // T-PP-10: List proposals without filter returns all
  it('list proposals without filter returns all', async () => {
    await proposals.createProposal(bobId, {
      workspaceId, title: 'P1', description: '...', sourceBranch: 'caching-analysis',
    });
    await proposals.createProposal(bobId, {
      workspaceId, title: 'P2', description: '...', sourceBranch: 'caching-analysis',
    });
    await proposals.createProposal(bobId, {
      workspaceId, title: 'P3', description: '...', sourceBranch: 'caching-analysis',
    });

    const result = await proposals.listProposals({ workspaceId });
    expect(result.proposals).toHaveLength(3);
  });
});
