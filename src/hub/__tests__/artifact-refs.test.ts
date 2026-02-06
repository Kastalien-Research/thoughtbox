import { describe, it, expect, beforeEach } from 'vitest';
import { createChannelsManager } from '../channels.js';
import { createProblemsManager } from '../problems.js';
import { createWorkspaceManager } from '../workspace.js';
import { createIdentityManager } from '../identity.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';
import type { HubStorage } from '../hub-types.js';

describe('Artifact refs', () => {
  let storage: HubStorage;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;
  let channels: ReturnType<typeof createChannelsManager>;
  let aliceId: string;
  let workspaceId: string;
  let problemId: string;

  beforeEach(async () => {
    storage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();
    const identity = createIdentityManager(storage);
    const workspace = createWorkspaceManager(storage, thoughtStore);
    const problems = createProblemsManager(storage, thoughtStore);
    channels = createChannelsManager(storage);

    const alice = await identity.register({ name: 'alice' });
    aliceId = alice.agentId;

    const ws = await workspace.createWorkspace(aliceId, {
      name: 'test-ws',
      description: '...',
    });
    workspaceId = ws.workspaceId;

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

    // Create a problem (which also creates a channel)
    const p = await problems.createProblem(aliceId, {
      workspaceId,
      title: 'Test Problem',
      description: '...',
    });
    problemId = p.problemId;
  });

  // T-REF-1: Post message with ref
  it('post message with ref stores the ref', async () => {
    const result = await channels.postMessage(aliceId, {
      workspaceId,
      problemId,
      content: 'See thought 3 for details',
      ref: { sessionId: 'session-123', thoughtNumber: 3 },
    });

    expect(result.messageId).toBeDefined();

    const { messages } = await channels.readChannel({ workspaceId, problemId });
    const msg = messages.find(m => m.id === result.messageId);
    expect(msg).toBeDefined();
    expect(msg!.ref).toEqual({ sessionId: 'session-123', thoughtNumber: 3 });
  });

  // T-REF-2: Post message without ref
  it('post message without ref has undefined ref', async () => {
    await channels.postMessage(aliceId, {
      workspaceId,
      problemId,
      content: 'Just a plain message',
    });

    const { messages } = await channels.readChannel({ workspaceId, problemId });
    expect(messages[0].ref).toBeUndefined();
  });

  // T-REF-3: Read channel preserves ref
  it('read channel preserves ref through round-trip', async () => {
    const ref = { sessionId: 'sess-abc', thoughtNumber: 7, branchId: 'alt-branch' };
    await channels.postMessage(aliceId, {
      workspaceId,
      problemId,
      content: 'With full ref',
      ref,
    });

    const { messages } = await channels.readChannel({ workspaceId, problemId });
    expect(messages[0].ref).toEqual(ref);
  });
});
