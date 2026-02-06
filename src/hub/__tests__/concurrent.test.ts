import { describe, it, expect, beforeEach } from 'vitest';
import { createHubHandler } from '../hub-handler.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';

describe('Concurrent Access', () => {
  let handler: ReturnType<typeof createHubHandler>;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;
  let aliceId: string;
  let bobId: string;
  let workspaceId: string;
  let mainSessionId: string;

  beforeEach(async () => {
    const storage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();
    handler = createHubHandler(storage, thoughtStore);

    const regA = await handler.handle(null, 'register', { name: 'alice' }) as any;
    aliceId = regA.agentId;
    const regB = await handler.handle(null, 'register', { name: 'bob' }) as any;
    bobId = regB.agentId;

    const ws = await handler.handle(aliceId, 'create_workspace', { name: 'ws', description: '...' }) as any;
    workspaceId = ws.workspaceId;
    mainSessionId = ws.mainSessionId;
    await handler.handle(bobId, 'join_workspace', { workspaceId });

    // Write 2 initial thoughts
    for (let i = 1; i <= 2; i++) {
      await thoughtStore.saveThought(mainSessionId, {
        thought: `thought ${i}`,
        thoughtNumber: i,
        totalThoughts: 2,
        nextThoughtNeeded: i < 2,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // T-CONC-1: Two agents write thoughts simultaneously
  it('two agents write thoughts simultaneously without duplicate numbers', async () => {
    await Promise.all([
      thoughtStore.saveThought(mainSessionId, {
        thought: 'alice thought',
        thoughtNumber: 3,
        totalThoughts: 4,
        nextThoughtNeeded: true,
        timestamp: new Date().toISOString(),
      }),
      thoughtStore.saveThought(mainSessionId, {
        thought: 'bob thought',
        thoughtNumber: 4,
        totalThoughts: 4,
        nextThoughtNeeded: false,
        timestamp: new Date().toISOString(),
      }),
    ]);

    const thoughts = await thoughtStore.getThoughts(mainSessionId);
    expect(thoughts).toHaveLength(4);

    // All thought numbers should be unique
    const numbers = thoughts.map((t: any) => t.thoughtNumber);
    const uniqueNumbers = new Set(numbers);
    expect(uniqueNumbers.size).toBe(4);
  });

  // T-CONC-2: Two agents claim different problems simultaneously
  it('two agents claim different problems simultaneously', async () => {
    // Create 2 problems
    const p1 = await handler.handle(aliceId, 'create_problem', {
      workspaceId,
      title: 'Problem 1',
      description: '...',
    }) as any;
    const p2 = await handler.handle(aliceId, 'create_problem', {
      workspaceId,
      title: 'Problem 2',
      description: '...',
    }) as any;

    await Promise.all([
      handler.handle(aliceId, 'claim_problem', {
        workspaceId,
        problemId: p1.problemId,
        branchId: 'alice-branch',
      }),
      handler.handle(bobId, 'claim_problem', {
        workspaceId,
        problemId: p2.problemId,
        branchId: 'bob-branch',
      }),
    ]);

    const prob1 = await handler.handle(aliceId, 'list_problems', { workspaceId, status: 'in-progress' }) as any;
    expect(prob1.problems).toHaveLength(2);

    const p1Data = prob1.problems.find((p: any) => p.title === 'Problem 1');
    const p2Data = prob1.problems.find((p: any) => p.title === 'Problem 2');
    expect(p1Data.assignedTo).toBe(aliceId);
    expect(p2Data.assignedTo).toBe(bobId);
  });
});
