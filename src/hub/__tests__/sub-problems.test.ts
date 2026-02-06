import { describe, it, expect, beforeEach } from 'vitest';
import { createProblemsManager } from '../problems.js';
import { createWorkspaceManager } from '../workspace.js';
import { createIdentityManager } from '../identity.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';
import type { HubStorage } from '../hub-types.js';

describe('Sub-problems', () => {
  let storage: HubStorage;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;
  let problems: ReturnType<typeof createProblemsManager>;
  let aliceId: string;
  let bobId: string;
  let workspaceId: string;
  let parentProblemId: string;

  beforeEach(async () => {
    storage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();
    const identity = createIdentityManager(storage);
    const workspace = createWorkspaceManager(storage, thoughtStore);
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

    // Seed 5 thoughts
    for (let i = 1; i <= 5; i++) {
      await thoughtStore.saveThought(ws.mainSessionId, {
        thought: `thought ${i}`,
        thoughtNumber: i,
        totalThoughts: 5,
        nextThoughtNeeded: i < 5,
        timestamp: new Date().toISOString(),
      });
    }

    // Create parent problem
    const parent = await problems.createProblem(aliceId, {
      workspaceId,
      title: 'Parent Problem',
      description: 'The parent',
    });
    parentProblemId = parent.problemId;
  });

  // T-SUB-1: Create sub-problem
  it('create sub-problem returns problemId and channelId with parentId set', async () => {
    const result = await problems.createSubProblem(aliceId, {
      workspaceId,
      parentId: parentProblemId,
      title: 'Child Task',
      description: 'A sub-task',
    });

    expect(result.problemId).toBeDefined();
    expect(result.channelId).toBeDefined();

    const child = await storage.getProblem(workspaceId, result.problemId);
    expect(child).not.toBeNull();
    expect(child!.parentId).toBe(parentProblemId);
  });

  // T-SUB-2: Sub-problem appears in list with parentId
  it('sub-problem appears in listProblems with correct parentId', async () => {
    const { problemId: childId } = await problems.createSubProblem(aliceId, {
      workspaceId,
      parentId: parentProblemId,
      title: 'Child Task',
      description: 'A sub-task',
    });

    const result = await problems.listProblems({ workspaceId });
    const child = result.problems.find((p: any) => p.id === childId);

    expect(child).toBeDefined();
    expect(child!.parentId).toBe(parentProblemId);
  });

  // T-SUB-3: Parent not found
  it('create sub-problem with bad parentId throws', async () => {
    await expect(
      problems.createSubProblem(aliceId, {
        workspaceId,
        parentId: 'nonexistent-parent',
        title: 'Orphan',
        description: '...',
      }),
    ).rejects.toThrow(/not found/i);
  });

  // T-SUB-4: Only coordinator creates sub-problems
  it('contributor cannot create sub-problems', async () => {
    await expect(
      problems.createSubProblem(bobId, {
        workspaceId,
        parentId: parentProblemId,
        title: 'Bob tries',
        description: '...',
      }),
    ).rejects.toThrow(/only coordinator/i);
  });
});
