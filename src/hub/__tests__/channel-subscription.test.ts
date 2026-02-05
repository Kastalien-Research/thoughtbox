import { describe, it, expect, beforeEach } from 'vitest';
import { createChannelsManager } from '../channels.js';
import { createProblemsManager } from '../problems.js';
import { createWorkspaceManager } from '../workspace.js';
import { createIdentityManager } from '../identity.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';
import type { HubStorage } from '../hub-types.js';

describe('Channel Subscriptions', () => {
  let storage: HubStorage;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;
  let identity: ReturnType<typeof createIdentityManager>;
  let workspace: ReturnType<typeof createWorkspaceManager>;
  let problems: ReturnType<typeof createProblemsManager>;
  let channels: ReturnType<typeof createChannelsManager>;
  let aliceId: string;
  let bobId: string;
  let workspaceId: string;
  let problemId: string;

  beforeEach(async () => {
    storage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();
    identity = createIdentityManager(storage);
    workspace = createWorkspaceManager(storage, thoughtStore);
    problems = createProblemsManager(storage, thoughtStore);
    channels = createChannelsManager(storage);

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

    for (let i = 1; i <= 5; i++) {
      await thoughtStore.saveThought(ws.mainSessionId, {
        thought: `thought ${i}`,
        thoughtNumber: i,
        totalThoughts: 5,
        nextThoughtNeeded: i < 5,
        timestamp: new Date().toISOString(),
      });
    }

    const p = await problems.createProblem(aliceId, {
      workspaceId,
      title: 'Analyze caching',
      description: '...',
    });
    problemId = p.problemId;
  });

  // T-CHSUB-1: Subscribe to channel, post message, receive notification
  it('subscriber receives notification when message is posted', async () => {
    const uri = channels.getChannelResourceUri(workspaceId, problemId);
    const notifications: string[] = [];

    channels.subscribe(uri, (notifiedUri) => {
      notifications.push(notifiedUri);
    });

    await channels.postMessage(bobId, {
      workspaceId,
      problemId,
      content: 'update',
    });

    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toBe(uri);
  });

  // T-CHSUB-2: Read channel after notification returns new messages
  it('read channel after notification returns newly posted message', async () => {
    const uri = channels.getChannelResourceUri(workspaceId, problemId);
    let notified = false;

    channels.subscribe(uri, () => {
      notified = true;
    });

    await channels.postMessage(bobId, {
      workspaceId,
      problemId,
      content: 'new insight',
    });

    expect(notified).toBe(true);

    const result = await channels.readChannel({ workspaceId, problemId });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].agentId).toBe(bobId);
    expect(result.messages[0].content).toBe('new insight');
    expect(result.messages[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  // T-CHSUB-3: Multiple subscribers all receive notification
  it('multiple subscribers all receive notification', async () => {
    const uri = channels.getChannelResourceUri(workspaceId, problemId);
    const notificationsA: string[] = [];
    const notificationsB: string[] = [];

    channels.subscribe(uri, (notifiedUri) => {
      notificationsA.push(notifiedUri);
    });
    channels.subscribe(uri, (notifiedUri) => {
      notificationsB.push(notifiedUri);
    });

    await channels.postMessage(aliceId, {
      workspaceId,
      problemId,
      content: 'broadcast',
    });

    expect(notificationsA).toHaveLength(1);
    expect(notificationsB).toHaveLength(1);
  });

  // T-CHSUB-4: Unsubscribed client does not receive notification
  it('unsubscribed client does not receive notification', async () => {
    const uri = channels.getChannelResourceUri(workspaceId, problemId);
    const notificationsA: string[] = [];
    const notificationsB: string[] = [];

    const unsubA = channels.subscribe(uri, (notifiedUri) => {
      notificationsA.push(notifiedUri);
    });
    channels.subscribe(uri, (notifiedUri) => {
      notificationsB.push(notifiedUri);
    });

    // Unsubscribe client A
    unsubA();

    await channels.postMessage(bobId, {
      workspaceId,
      problemId,
      content: 'after unsub',
    });

    expect(notificationsA).toHaveLength(0);
    expect(notificationsB).toHaveLength(1);
  });
});
