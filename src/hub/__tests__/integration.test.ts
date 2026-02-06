import { describe, it, expect, beforeEach } from 'vitest';
import { createHubHandler } from '../hub-handler.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';
import { tagThought } from '../attribution.js';
import type { HubStorage } from '../hub-types.js';

describe('Integration — Full Multi-Agent Workflow', () => {
  let handler: ReturnType<typeof createHubHandler>;
  let storage: HubStorage;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;

  beforeEach(() => {
    storage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();
    handler = createHubHandler(storage, thoughtStore);
  });

  // T-INT-1: Full multi-agent collaboration workflow
  it('full multi-agent collaboration workflow', async () => {
    // Step 1 — Register agents
    const alice = await handler.handle(null, 'register', { name: 'alice' }) as any;
    const bob = await handler.handle(null, 'register', { name: 'bob' }) as any;
    expect(alice.agentId).not.toBe(bob.agentId);

    // Step 2 — Create workspace
    const ws = await handler.handle(alice.agentId, 'create_workspace', {
      name: 'arch-review',
      description: 'Architecture review workspace',
    }) as any;
    expect(ws.workspaceId).toBeDefined();
    expect(ws.mainSessionId).toBeDefined();

    // Step 3 — Alice writes initial reasoning
    await thoughtStore.saveThought(ws.mainSessionId, {
      thought: 'Problem: evaluate caching strategy',
      thoughtNumber: 1,
      totalThoughts: 2,
      nextThoughtNeeded: true,
      timestamp: new Date().toISOString(),
    });
    await thoughtStore.saveThought(ws.mainSessionId, {
      thought: 'Decomposing into sub-problems',
      thoughtNumber: 2,
      totalThoughts: 2,
      nextThoughtNeeded: false,
      timestamp: new Date().toISOString(),
    });

    // Step 4 — Alice creates problem
    const problem = await handler.handle(alice.agentId, 'create_problem', {
      workspaceId: ws.workspaceId,
      title: 'Analyze Redis vs Memcached',
      description: 'Compare caching strategies',
    }) as any;
    expect(problem.problemId).toBeDefined();

    // Step 5 — Bob joins and claims
    await handler.handle(bob.agentId, 'join_workspace', { workspaceId: ws.workspaceId });
    const claim = await handler.handle(bob.agentId, 'claim_problem', {
      workspaceId: ws.workspaceId,
      problemId: problem.problemId,
      branchId: 'redis-analysis',
    }) as any;
    expect(claim.problem.status).toBe('in-progress');
    expect(claim.branchFromThought).toBe(2);

    // Step 6 — Bob reasons on branch
    const branchThoughts = [
      'Redis supports data structures...',
      'Memcached is simpler but...',
      'Conclusion: Redis for this use case',
    ];
    for (let i = 0; i < branchThoughts.length; i++) {
      const thought = tagThought(
        {
          thought: branchThoughts[i],
          thoughtNumber: i + 1,
          totalThoughts: 3,
          nextThoughtNeeded: i < 2,
          branchId: 'redis-analysis',
          branchFromThought: 2,
          timestamp: new Date().toISOString(),
        },
        bob.agentId,
        'bob',
      );
      await thoughtStore.saveBranchThought(ws.mainSessionId, 'redis-analysis', thought);
    }

    // Step 7 — Bob creates proposal
    const proposal = await handler.handle(bob.agentId, 'create_proposal', {
      workspaceId: ws.workspaceId,
      title: 'Redis recommendation',
      description: 'Recommending Redis based on analysis',
      sourceBranch: 'redis-analysis',
      problemId: problem.problemId,
    }) as any;
    const storedProposal = await storage.getProposal(ws.workspaceId, proposal.proposalId);
    expect(storedProposal!.status).toBe('open');

    // Step 8 — Alice reviews
    await handler.handle(alice.agentId, 'review_proposal', {
      workspaceId: ws.workspaceId,
      proposalId: proposal.proposalId,
      verdict: 'approve',
      reasoning: 'Thorough analysis',
    });
    const reviewedProposal = await storage.getProposal(ws.workspaceId, proposal.proposalId);
    expect(reviewedProposal!.reviews).toHaveLength(1);

    // Step 9 — Alice merges
    const mergeResult = await handler.handle(alice.agentId, 'merge_proposal', {
      workspaceId: ws.workspaceId,
      proposalId: proposal.proposalId,
      mergeMessage: 'Accepted: Redis for caching layer',
    }) as any;
    expect(mergeResult.mergeThoughtNumber).toBe(3);
    const mergeThought = await thoughtStore.getThought(ws.mainSessionId, 3);
    expect(mergeThought!.thought).toBe('Accepted: Redis for caching layer');
    expect((mergeThought as any).agentId).toBe(alice.agentId);

    // Step 10 — Verify state
    const resolvedProblem = await storage.getProblem(ws.workspaceId, problem.problemId);
    expect(resolvedProblem!.status).toBe('resolved');
    const mergedProposal = await storage.getProposal(ws.workspaceId, proposal.proposalId);
    expect(mergedProposal!.status).toBe('merged');
    const branch = await thoughtStore.getBranch(ws.mainSessionId, 'redis-analysis');
    expect(branch).toHaveLength(3);

    // Step 11 — Alice marks consensus, bob endorses
    const marker = await handler.handle(alice.agentId, 'mark_consensus', {
      workspaceId: ws.workspaceId,
      name: 'caching-decision',
      description: 'Redis selected',
      thoughtRef: 3,
    }) as any;
    await handler.handle(bob.agentId, 'endorse_consensus', {
      workspaceId: ws.workspaceId,
      consensusId: marker.consensusId,
    });
    const endorsedMarker = await storage.getConsensusMarker(ws.workspaceId, marker.consensusId);
    expect(endorsedMarker!.agreedBy).toContain(alice.agentId);
    expect(endorsedMarker!.agreedBy).toContain(bob.agentId);
  });
});
