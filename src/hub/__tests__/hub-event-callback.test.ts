/**
 * Tests for hub-handler onEvent callback
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHubHandler } from '../hub-handler.js';
import type { HubEvent } from '../hub-handler.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';

describe('Hub Event Callback', () => {
  let storage: ReturnType<typeof createInMemoryHubStorage>;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;

  beforeEach(() => {
    storage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();
  });

  it('T-HEC-1: createHubHandler accepts onEvent callback', () => {
    const onEvent = vi.fn();
    const handler = createHubHandler(storage, thoughtStore, onEvent);
    expect(handler).toBeDefined();
    expect(handler.handle).toBeDefined();
  });

  it('T-HEC-2: problem_created fires onEvent after successful create_problem', async () => {
    const onEvent = vi.fn();
    const handler = createHubHandler(storage, thoughtStore, onEvent);

    // Register + create workspace + join
    const reg = await handler.handle(null, 'register', { name: 'alice' }) as any;
    const ws = await handler.handle(reg.agentId, 'create_workspace', {
      name: 'ws', description: 'test',
    }) as any;

    // Create problem
    await handler.handle(reg.agentId, 'create_problem', {
      workspaceId: ws.workspaceId,
      title: 'Test problem',
      description: 'A test problem',
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'problem_created',
        workspaceId: ws.workspaceId,
      })
    );
  });

  it('T-HEC-3: message_posted fires onEvent after successful post_message', async () => {
    const onEvent = vi.fn();
    const handler = createHubHandler(storage, thoughtStore, onEvent);

    const reg = await handler.handle(null, 'register', { name: 'alice' }) as any;
    const ws = await handler.handle(reg.agentId, 'create_workspace', {
      name: 'ws', description: 'test',
    }) as any;
    const problem = await handler.handle(reg.agentId, 'create_problem', {
      workspaceId: ws.workspaceId,
      title: 'Test problem',
      description: 'A test problem',
    }) as any;

    // Reset to clear the problem_created event
    onEvent.mockClear();

    await handler.handle(reg.agentId, 'post_message', {
      workspaceId: ws.workspaceId,
      problemId: problem.problemId,
      content: 'Hello!',
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'message_posted',
        workspaceId: ws.workspaceId,
        data: expect.objectContaining({ problemId: problem.problemId }),
      })
    );
  });

  it('T-HEC-4: onEvent not called when operation fails', async () => {
    const onEvent = vi.fn();
    const handler = createHubHandler(storage, thoughtStore, onEvent);

    // Try to create problem without being registered — should fail
    await expect(
      handler.handle('unknown-agent', 'create_problem', {
        workspaceId: 'ws-1',
        title: 'Test',
        description: 'desc',
      })
    ).rejects.toThrow();

    expect(onEvent).not.toHaveBeenCalled();
  });
});
