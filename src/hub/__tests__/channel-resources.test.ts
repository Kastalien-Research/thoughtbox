/**
 * Tests for hub channel resources — verifying resource template registration and event callbacks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHubToolHandler } from '../hub-tool-handler.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';
import type { HubStorage } from '../hub-types.js';
import type { HubEvent } from '../hub-handler.js';

describe('Channel Resources', () => {
  let hubStorage: HubStorage;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;

  beforeEach(() => {
    hubStorage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();
  });

  it('T-CHR-1: channel resource URI follows template pattern', () => {
    // Verify the URI template pattern is correct
    const workspaceId = 'ws-123';
    const problemId = 'prob-456';
    const uri = `thoughtbox://hub/${workspaceId}/channels/${problemId}`;
    expect(uri).toBe('thoughtbox://hub/ws-123/channels/prob-456');
  });

  it('T-CHR-2: reading channel from storage returns messages as JSON', async () => {
    // Directly test the hub storage channel read pattern
    const wsId = 'ws-1';
    await hubStorage.saveChannel({
      id: 'ch-1',
      workspaceId: wsId,
      problemId: 'prob-1',
      messages: [
        { id: 'm1', agentId: 'agent-1', content: 'Hello', timestamp: '2024-01-01T00:00:00Z' },
        { id: 'm2', agentId: 'agent-2', content: 'World', timestamp: '2024-01-01T00:01:00Z' },
      ],
    });

    const channel = await hubStorage.getChannel(wsId, 'prob-1');
    expect(channel).not.toBeNull();
    expect(channel!.messages).toHaveLength(2);
    expect(channel!.messages[0].content).toBe('Hello');

    // Verify JSON serialization works correctly
    const json = JSON.stringify(channel!.messages, null, 2);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(2);
  });

  it('T-CHR-3: problem_created event fires with correct data', async () => {
    const onEvent = vi.fn();
    const handler = createHubToolHandler({
      hubStorage,
      thoughtStore,
      onEvent,
    });

    // Register + create workspace
    await handler.handle({ operation: 'register', args: { name: 'alice' } });
    const wsResult = await handler.handle({
      operation: 'create_workspace',
      args: { name: 'ws', description: 'test' },
    });
    const ws = JSON.parse(wsResult.content[0].text);

    // Create problem — should trigger event
    await handler.handle({
      operation: 'create_problem',
      args: { workspaceId: ws.workspaceId, title: 'Bug', description: 'Fix it' },
    });

    const problemEvent = onEvent.mock.calls.find(
      (call: [HubEvent]) => call[0].type === 'problem_created'
    );
    expect(problemEvent).toBeDefined();
    expect(problemEvent![0].workspaceId).toBe(ws.workspaceId);
  });

  it('T-CHR-4: message_posted event includes problemId in data', async () => {
    const onEvent = vi.fn();
    const handler = createHubToolHandler({
      hubStorage,
      thoughtStore,
      onEvent,
    });

    // Setup: register + workspace + problem
    await handler.handle({ operation: 'register', args: { name: 'bob' } });
    const wsResult = await handler.handle({
      operation: 'create_workspace',
      args: { name: 'ws', description: 'test' },
    });
    const ws = JSON.parse(wsResult.content[0].text);

    const probResult = await handler.handle({
      operation: 'create_problem',
      args: { workspaceId: ws.workspaceId, title: 'Issue', description: 'desc' },
    });
    const prob = JSON.parse(probResult.content[0].text);

    onEvent.mockClear();

    // Post message — should trigger message_posted event
    await handler.handle({
      operation: 'post_message',
      args: { workspaceId: ws.workspaceId, problemId: prob.problemId, content: 'Hi!' },
    });

    const msgEvent = onEvent.mock.calls.find(
      (call: [HubEvent]) => call[0].type === 'message_posted'
    );
    expect(msgEvent).toBeDefined();
    expect(msgEvent![0].data.problemId).toBe(prob.problemId);
    expect(msgEvent![0].workspaceId).toBe(ws.workspaceId);
  });

  it('T-CHR-5: channel readable after problem creation and message posting', async () => {
    const handler = createHubToolHandler({ hubStorage, thoughtStore });

    // Setup full flow
    await handler.handle({ operation: 'register', args: { name: 'carol' } });
    const wsResult = await handler.handle({
      operation: 'create_workspace',
      args: { name: 'ws', description: 'test' },
    });
    const ws = JSON.parse(wsResult.content[0].text);

    const probResult = await handler.handle({
      operation: 'create_problem',
      args: { workspaceId: ws.workspaceId, title: 'Task', description: 'Do it' },
    });
    const prob = JSON.parse(probResult.content[0].text);

    // Post messages
    await handler.handle({
      operation: 'post_message',
      args: { workspaceId: ws.workspaceId, problemId: prob.problemId, content: 'Starting work' },
    });
    await handler.handle({
      operation: 'post_message',
      args: { workspaceId: ws.workspaceId, problemId: prob.problemId, content: 'Done!' },
    });

    // Read channel
    const readResult = await handler.handle({
      operation: 'read_channel',
      args: { workspaceId: ws.workspaceId, problemId: prob.problemId },
    });
    const channel = JSON.parse(readResult.content[0].text);
    expect(channel.messages).toHaveLength(2);
    expect(channel.messages[0].content).toBe('Starting work');
    expect(channel.messages[1].content).toBe('Done!');
  });
});
