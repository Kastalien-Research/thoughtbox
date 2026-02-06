import { describe, it, expect, beforeEach } from 'vitest';
import { createProblemsManager } from '../problems.js';
import { createWorkspaceManager } from '../workspace.js';
import { createIdentityManager } from '../identity.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';
import type { HubStorage } from '../hub-types.js';

describe('Problems', () => {
  let storage: HubStorage;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;
  let identity: ReturnType<typeof createIdentityManager>;
  let workspace: ReturnType<typeof createWorkspaceManager>;
  let problems: ReturnType<typeof createProblemsManager>;
  let aliceId: string;
  let bobId: string;
  let workspaceId: string;

  beforeEach(async () => {
    storage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();
    identity = createIdentityManager(storage);
    workspace = createWorkspaceManager(storage, thoughtStore);
    problems = createProblemsManager(storage, thoughtStore);

    const alice = await identity.register({ name: 'alice' });
    aliceId = alice.agentId;
    const bob = await identity.register({ name: 'bob' });
    bobId = bob.agentId;

    const ws = await workspace.createWorkspace(aliceId, {
      name: 'test-ws',
      description: '...',
    });
    workspaceId = ws.workspaceId;
    await workspace.joinWorkspace(bobId, { workspaceId });

    // Add 5 thoughts to main chain for branch point tests
    for (let i = 1; i <= 5; i++) {
      await thoughtStore.saveThought(ws.mainSessionId, {
        thought: `thought ${i}`,
        thoughtNumber: i,
        totalThoughts: 5,
        nextThoughtNeeded: i < 5,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // T-PR-1: Create problem (coordinator)
  it('create problem as coordinator returns problemId and channelId', async () => {
    const result = await problems.createProblem(aliceId, {
      workspaceId,
      title: 'Analyze caching',
      description: '...',
    });

    expect(result.problemId).toBeDefined();
    expect(result.channelId).toBeDefined();

    const problem = await storage.getProblem(workspaceId, result.problemId);
    expect(problem).not.toBeNull();
    expect(problem!.status).toBe('open');
    expect(problem!.createdBy).toBe(aliceId);

    // Channel should be created
    const channel = await storage.getChannel(workspaceId, result.problemId);
    expect(channel).not.toBeNull();
  });

  // T-PR-2: Create problem (contributor) fails
  it('create problem as contributor throws error', async () => {
    await expect(
      problems.createProblem(bobId, {
        workspaceId,
        title: '...',
        description: '...',
      }),
    ).rejects.toThrow('Only coordinator can create problems');
  });

  // T-PR-3: Claim problem assigns agent and creates branch point
  it('claim problem assigns agent and records branch point', async () => {
    const { problemId } = await problems.createProblem(aliceId, {
      workspaceId,
      title: 'Test',
      description: '...',
    });

    const result = await problems.claimProblem(bobId, {
      workspaceId,
      problemId,
      branchId: 'caching-analysis',
    });

    expect(result.problem.assignedTo).toBe(bobId);
    expect(result.problem.status).toBe('in-progress');
    expect(result.problem.branchId).toBe('caching-analysis');
    expect(result.branchFromThought).toBe(5);
  });

  // T-PR-4: Claim already-claimed problem fails
  it('claim already-claimed problem throws error', async () => {
    const { problemId } = await problems.createProblem(aliceId, {
      workspaceId,
      title: 'Test',
      description: '...',
    });

    await problems.claimProblem(bobId, { workspaceId, problemId, branchId: 'branch-1' });

    // Register a third agent
    const carol = await identity.register({ name: 'carol' });
    await workspace.joinWorkspace(carol.agentId, { workspaceId });

    await expect(
      problems.claimProblem(carol.agentId, { workspaceId, problemId, branchId: 'my-branch' }),
    ).rejects.toThrow(/already claimed/i);
  });

  // T-PR-5: Update problem status
  it('update problem status and resolution', async () => {
    const { problemId } = await problems.createProblem(aliceId, {
      workspaceId,
      title: 'Test',
      description: '...',
    });

    const result = await problems.updateProblem(aliceId, {
      workspaceId,
      problemId,
      status: 'resolved',
      resolution: 'Found the issue',
    });

    expect(result.problem.status).toBe('resolved');
    expect(result.problem.resolution).toBe('Found the issue');
  });

  // T-PR-6: Add comment to problem
  it('add comment to problem', async () => {
    const { problemId } = await problems.createProblem(aliceId, {
      workspaceId,
      title: 'Test',
      description: '...',
    });

    const result = await problems.updateProblem(bobId, {
      workspaceId,
      problemId,
      comment: 'Have you checked the logs?',
    });

    expect(result.problem.comments).toHaveLength(1);
    expect(result.problem.comments[0].content).toBe('Have you checked the logs?');
    expect(result.problem.comments[0].agentId).toBe(bobId);
  });

  // T-PR-7: List problems with status filter
  it('list problems with status filter', async () => {
    await problems.createProblem(aliceId, { workspaceId, title: 'P1', description: '...' });
    await problems.createProblem(aliceId, { workspaceId, title: 'P2', description: '...' });
    const { problemId: p3Id } = await problems.createProblem(aliceId, {
      workspaceId,
      title: 'P3',
      description: '...',
    });

    // Claim one to make it in-progress
    await problems.claimProblem(bobId, { workspaceId, problemId: p3Id, branchId: 'branch-3' });

    const result = await problems.listProblems({ workspaceId, status: 'open' });
    expect(result.problems).toHaveLength(2);
    result.problems.forEach((p: any) => expect(p.status).toBe('open'));
  });
});
