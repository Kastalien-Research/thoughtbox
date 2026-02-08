/**
 * Tests for proactive conflict surfacing via channels
 *
 * When a new thought is recorded and the agent is in a workspace,
 * the system checks for conflicts with other agents' recent thoughts
 * and auto-posts a system message to the relevant channel.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createHubHandler } from '../hub-handler.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';
import type { ChannelMessage } from '../hub-types.js';

describe('postSystemMessage', () => {
  let storage: ReturnType<typeof createInMemoryHubStorage>;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;
  let handler: ReturnType<typeof createHubHandler>;
  let workspaceId: string;
  let coordId: string;
  let problemId: string;

  beforeEach(async () => {
    storage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();
    handler = createHubHandler(storage, thoughtStore);

    // Setup workspace with a problem
    const coord = await handler.handle(null, 'register', { name: 'Coordinator' }) as any;
    coordId = coord.agentId;
    const ws = await handler.handle(coordId, 'create_workspace', {
      name: 'Conflict Workspace',
      description: 'For conflict testing',
    }) as any;
    workspaceId = ws.workspaceId;

    const problem = await handler.handle(coordId, 'create_problem', {
      workspaceId,
      title: 'Investigate issue',
      description: 'Root cause analysis needed',
    }) as any;
    problemId = problem.problemId;
  });

  it('posts a system message to channel', async () => {
    // Post a system message using the new post_system_message operation
    await handler.handle(coordId, 'post_system_message', {
      workspaceId,
      problemId,
      content: '[CONFLICT DETECTED] Agent A claims X, Agent B refutes X',
    });

    // Read channel and verify message is there
    const channel = await handler.handle(coordId, 'read_channel', {
      workspaceId,
      problemId,
    }) as any;

    expect(channel.messages.length).toBe(1);
    expect(channel.messages[0].content).toContain('CONFLICT DETECTED');
    expect(channel.messages[0].agentId).toBe('system');
  });

  it('system messages appear alongside regular messages', async () => {
    // Regular message
    await handler.handle(coordId, 'post_message', {
      workspaceId,
      problemId,
      content: 'Starting investigation',
    });

    // System message
    await handler.handle(coordId, 'post_system_message', {
      workspaceId,
      problemId,
      content: '[CONFLICT] Contradiction detected between agents',
    });

    const channel = await handler.handle(coordId, 'read_channel', {
      workspaceId,
      problemId,
    }) as any;

    expect(channel.messages.length).toBe(2);
    expect(channel.messages[0].agentId).toBe(coordId);
    expect(channel.messages[1].agentId).toBe('system');
  });

  it('requires workspace membership for system messages', async () => {
    const outsider = await handler.handle(null, 'register', { name: 'Outsider' }) as any;

    await expect(
      handler.handle(outsider.agentId, 'post_system_message', {
        workspaceId,
        problemId,
        content: 'Should fail',
      })
    ).rejects.toThrow();
  });
});
