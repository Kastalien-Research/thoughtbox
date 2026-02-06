import { describe, it, expect, beforeEach } from 'vitest';
import { createHubHandler } from '../hub-handler.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';

describe('Hub Handler — Terminal State Errors', () => {
  let handler: ReturnType<typeof createHubHandler>;
  let aliceId: string;
  let bobId: string;
  let workspaceId: string;
  let mainSessionId: string;

  beforeEach(async () => {
    const storage = createInMemoryHubStorage();
    const thoughtStore = createInMemoryThoughtStore();
    handler = createHubHandler(storage, thoughtStore);

    const regA = await handler.handle(null, 'register', { name: 'alice' }) as any;
    aliceId = regA.agentId;
    const regB = await handler.handle(null, 'register', { name: 'bob' }) as any;
    bobId = regB.agentId;

    const ws = await handler.handle(aliceId, 'create_workspace', { name: 'ws', description: '...' }) as any;
    workspaceId = ws.workspaceId;
    mainSessionId = ws.mainSessionId;
    await handler.handle(bobId, 'join_workspace', { workspaceId });

    // Add thoughts to main chain
    for (let i = 1; i <= 5; i++) {
      await thoughtStore.saveThought(mainSessionId, {
        thought: `thought ${i}`,
        thoughtNumber: i,
        totalThoughts: 5,
        nextThoughtNeeded: i < 5,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // T-TERM-1: Merge already-merged proposal
  it('merge already-merged proposal throws error', async () => {
    const prob = await handler.handle(aliceId, 'create_problem', {
      workspaceId, title: 'Test', description: '...',
    }) as any;
    const prop = await handler.handle(bobId, 'create_proposal', {
      workspaceId, title: 'Fix', description: '...', sourceBranch: 'fix-branch', problemId: prob.problemId,
    }) as any;
    await handler.handle(aliceId, 'review_proposal', {
      workspaceId, proposalId: prop.proposalId, verdict: 'approve', reasoning: 'good',
    });
    await handler.handle(aliceId, 'merge_proposal', {
      workspaceId, proposalId: prop.proposalId, mergeMessage: 'merged',
    });

    await expect(
      handler.handle(aliceId, 'merge_proposal', {
        workspaceId, proposalId: prop.proposalId, mergeMessage: 'again',
      }),
    ).rejects.toThrow('Proposal already merged');
  });

  // T-TERM-2: Review already-merged proposal
  it('review already-merged proposal throws error', async () => {
    const prob = await handler.handle(aliceId, 'create_problem', {
      workspaceId, title: 'Test', description: '...',
    }) as any;
    const prop = await handler.handle(bobId, 'create_proposal', {
      workspaceId, title: 'Fix', description: '...', sourceBranch: 'fix-branch', problemId: prob.problemId,
    }) as any;
    await handler.handle(aliceId, 'review_proposal', {
      workspaceId, proposalId: prop.proposalId, verdict: 'approve', reasoning: 'good',
    });
    await handler.handle(aliceId, 'merge_proposal', {
      workspaceId, proposalId: prop.proposalId, mergeMessage: 'merged',
    });

    // Register a third agent to attempt review
    const regC = await handler.handle(null, 'register', { name: 'carol' }) as any;
    await handler.handle(regC.agentId, 'join_workspace', { workspaceId });

    await expect(
      handler.handle(regC.agentId, 'review_proposal', {
        workspaceId, proposalId: prop.proposalId, verdict: 'approve', reasoning: 'late',
      }),
    ).rejects.toThrow('Cannot review a merged proposal');
  });

  // T-TERM-3: Claim resolved problem
  it('claim resolved problem throws error', async () => {
    const prob = await handler.handle(aliceId, 'create_problem', {
      workspaceId, title: 'Test', description: '...',
    }) as any;
    await handler.handle(aliceId, 'update_problem', {
      workspaceId, problemId: prob.problemId, status: 'resolved', resolution: 'done',
    });

    await expect(
      handler.handle(bobId, 'claim_problem', {
        workspaceId, problemId: prob.problemId, branchId: 'late-attempt',
      }),
    ).rejects.toThrow('Problem already resolved');
  });

  // T-TERM-4: Claim closed problem
  it('claim closed problem throws error', async () => {
    const prob = await handler.handle(aliceId, 'create_problem', {
      workspaceId, title: 'Test', description: '...',
    }) as any;
    await handler.handle(aliceId, 'update_problem', {
      workspaceId, problemId: prob.problemId, status: 'closed',
    });

    await expect(
      handler.handle(bobId, 'claim_problem', {
        workspaceId, problemId: prob.problemId, branchId: 'late-attempt',
      }),
    ).rejects.toThrow('Problem is closed');
  });
});
