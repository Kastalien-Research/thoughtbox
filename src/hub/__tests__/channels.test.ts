import { describe, it, expect, beforeEach } from 'vitest';
import { createChannelsManager } from '../channels.js';
import { createProblemsManager } from '../problems.js';
import { createWorkspaceManager } from '../workspace.js';
import { createIdentityManager } from '../identity.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';
import type { HubStorage } from '../hub-types.js';

describe('Channels', () => {
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

    // Add thoughts for branch point
    for (let i = 1; i <= 5; i++) {
      await thoughtStore.saveThought(ws.mainSessionId, {
        thought: `thought ${i}`,
        thoughtNumber: i,
        totalThoughts: 5,
        nextThoughtNeeded: i < 5,
        timestamp: new Date().toISOString(),
      });
    }

    // Create a problem (which creates a channel)
    const p = await problems.createProblem(aliceId, {
      workspaceId,
      title: 'Analyze caching',
      description: '...',
    });
    problemId = p.problemId;
  });

  // T-CH-1: Channel created when problem is created
  it('channel exists after problem creation with empty messages', async () => {
    const channel = await storage.getChannel(workspaceId, problemId);
    expect(channel).not.toBeNull();
    expect(channel!.messages).toEqual([]);
  });

  // T-CH-2: Post message to channel
  it('post message adds message with agentId, content, and timestamp', async () => {
    const result = await channels.postMessage(bobId, {
      workspaceId,
      problemId,
      content: 'Starting analysis',
    });

    expect(result.messageId).toBeDefined();
    expect(result.channelMessageCount).toBe(1);

    const channel = await storage.getChannel(workspaceId, problemId);
    expect(channel!.messages).toHaveLength(1);
    expect(channel!.messages[0].agentId).toBe(bobId);
    expect(channel!.messages[0].content).toBe('Starting analysis');
    expect(channel!.messages[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  // T-CH-3: Read channel returns all messages
  it('read channel returns all messages in chronological order', async () => {
    await channels.postMessage(aliceId, { workspaceId, problemId, content: 'msg 1' });
    await channels.postMessage(bobId, { workspaceId, problemId, content: 'msg 2' });
    await channels.postMessage(aliceId, { workspaceId, problemId, content: 'msg 3' });

    const result = await channels.readChannel({ workspaceId, problemId });
    expect(result.messages).toHaveLength(3);
    expect(result.messages[0].content).toBe('msg 1');
    expect(result.messages[1].content).toBe('msg 2');
    expect(result.messages[2].content).toBe('msg 3');
  });

  // T-CH-4: Read channel with since filter
  it('read channel with since filter returns only newer messages', async () => {
    await channels.postMessage(aliceId, { workspaceId, problemId, content: 'msg 1' });

    // Read to get the timestamp of the first message
    const afterFirst = await channels.readChannel({ workspaceId, problemId });
    const t1 = afterFirst.messages[0].timestamp;

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 5));

    await channels.postMessage(bobId, { workspaceId, problemId, content: 'msg 2' });
    await channels.postMessage(aliceId, { workspaceId, problemId, content: 'msg 3' });

    const result = await channels.readChannel({ workspaceId, problemId, since: t1 });
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].content).toBe('msg 2');
    expect(result.messages[1].content).toBe('msg 3');
  });

  // T-CH-5: Channel exposed as MCP resource
  it('channel resource URI follows expected format', async () => {
    const uri = channels.getChannelResourceUri(workspaceId, problemId);
    expect(uri).toBe(`thoughtbox://hub/${workspaceId}/channels/${problemId}`);
  });
});
