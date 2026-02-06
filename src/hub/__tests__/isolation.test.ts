import { describe, it, expect, beforeEach } from 'vitest';
import { createHubHandler } from '../hub-handler.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';

describe('Hub Handler — Cross-Workspace Isolation', () => {
  let handler: ReturnType<typeof createHubHandler>;
  let aliceId: string;
  let bobId: string;
  let workspaceAId: string;
  let workspaceBId: string;
  let problemBId: string;

  beforeEach(async () => {
    const storage = createInMemoryHubStorage();
    const thoughtStore = createInMemoryThoughtStore();
    handler = createHubHandler(storage, thoughtStore);

    const regA = await handler.handle(null, 'register', { name: 'alice' }) as any;
    aliceId = regA.agentId;
    const regB = await handler.handle(null, 'register', { name: 'bob' }) as any;
    bobId = regB.agentId;

    // Alice creates workspace A
    const wsA = await handler.handle(aliceId, 'create_workspace', { name: 'ws-a', description: 'A' }) as any;
    workspaceAId = wsA.workspaceId;

    // Bob creates workspace B
    const wsB = await handler.handle(bobId, 'create_workspace', { name: 'ws-b', description: 'B' }) as any;
    workspaceBId = wsB.workspaceId;

    // Create problems in each workspace
    await handler.handle(aliceId, 'create_problem', { workspaceId: workspaceAId, title: 'A-P1', description: '...' });
    await handler.handle(aliceId, 'create_problem', { workspaceId: workspaceAId, title: 'A-P2', description: '...' });
    const pB = await handler.handle(bobId, 'create_problem', { workspaceId: workspaceBId, title: 'B-P1', description: '...' }) as any;
    problemBId = pB.problemId;
  });

  // T-ISO-1: Agent in workspace A cannot list workspace B's problems
  it('agent cannot list problems in workspace they are not a member of', async () => {
    await expect(
      handler.handle(aliceId, 'list_problems', { workspaceId: workspaceBId }),
    ).rejects.toThrow('Not a member of this workspace');
  });

  // T-ISO-2: Agent in workspace A cannot claim workspace B's problem
  it('agent cannot claim problem in workspace they are not a member of', async () => {
    await expect(
      handler.handle(aliceId, 'claim_problem', { workspaceId: workspaceBId, problemId: problemBId, branchId: 'x' }),
    ).rejects.toThrow('Not a member of this workspace');
  });

  // T-ISO-3: Agent in workspace A cannot post to workspace B's channel
  it('agent cannot post to channel in workspace they are not a member of', async () => {
    await expect(
      handler.handle(aliceId, 'post_message', { workspaceId: workspaceBId, problemId: problemBId, content: 'hello' }),
    ).rejects.toThrow('Not a member of this workspace');
  });

  // T-ISO-4: Agent can be member of multiple workspaces
  it('agent can be member of multiple workspaces with no cross-contamination', async () => {
    // Alice joins workspace B
    await handler.handle(aliceId, 'join_workspace', { workspaceId: workspaceBId });

    const problemsA = await handler.handle(aliceId, 'list_problems', { workspaceId: workspaceAId }) as any;
    const problemsB = await handler.handle(aliceId, 'list_problems', { workspaceId: workspaceBId }) as any;

    expect(problemsA.problems).toHaveLength(2);
    expect(problemsB.problems).toHaveLength(1);
    expect(problemsA.problems[0].workspaceId).toBe(workspaceAId);
    expect(problemsB.problems[0].workspaceId).toBe(workspaceBId);
  });
});
