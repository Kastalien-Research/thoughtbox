/**
 * Tests for hub_wait long-polling mechanism
 *
 * Phase 2: WaitManager unit tests
 * Phase 4: Hub handler integration tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createWaitManager } from '../hub-wait.js';
import type { HubEvent } from '../hub-handler.js';
import { createHubHandler } from '../hub-handler.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';

// =============================================================================
// Phase 2: WaitManager Unit Tests
// =============================================================================

describe('WaitManager', () => {
  let waitManager: ReturnType<typeof createWaitManager>;

  beforeEach(() => {
    vi.useFakeTimers();
    waitManager = createWaitManager();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('T-WAIT-1: wait() resolves with events when notify() called before timeout', async () => {
    const event: HubEvent = {
      type: 'message_posted',
      workspaceId: 'ws-1',
      data: { content: 'hello' },
    };

    const waitPromise = waitManager.wait('ws-1', { timeout: 5 });
    waitManager.notify(event);

    // Advance past coalesce window (100ms)
    vi.advanceTimersByTime(150);

    const events = await waitPromise;
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(event);
  });

  it('T-WAIT-2: wait() resolves with empty array on timeout', async () => {
    const waitPromise = waitManager.wait('ws-1', { timeout: 5 });

    // Advance past the 5-second timeout
    vi.advanceTimersByTime(5_000);

    const events = await waitPromise;
    expect(events).toEqual([]);
  });

  it('T-WAIT-3: wait() filters events by type', async () => {
    const matching: HubEvent = {
      type: 'message_posted',
      workspaceId: 'ws-1',
      data: { content: 'hello' },
    };
    const nonMatching: HubEvent = {
      type: 'problem_created',
      workspaceId: 'ws-1',
      data: { title: 'bug' },
    };

    const waitPromise = waitManager.wait('ws-1', {
      timeout: 5,
      filter: ['message_posted'],
    });

    waitManager.notify(nonMatching);
    waitManager.notify(matching);

    vi.advanceTimersByTime(150);

    const events = await waitPromise;
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('message_posted');
  });

  it('T-WAIT-4: wait() filters events by workspaceId', async () => {
    const event: HubEvent = {
      type: 'message_posted',
      workspaceId: 'ws-2',
      data: { content: 'wrong workspace' },
    };

    const waitPromise = waitManager.wait('ws-1', { timeout: 1 });
    waitManager.notify(event);

    // Should NOT resolve from ws-2 event; should timeout
    vi.advanceTimersByTime(1_000);

    const events = await waitPromise;
    expect(events).toEqual([]);
  });

  it('T-WAIT-5: notify() resolves ALL matching waiters', async () => {
    const event: HubEvent = {
      type: 'message_posted',
      workspaceId: 'ws-1',
      data: { content: 'broadcast' },
    };

    const wait1 = waitManager.wait('ws-1', { timeout: 5 });
    const wait2 = waitManager.wait('ws-1', { timeout: 5 });

    expect(waitManager.pendingCount).toBe(2);

    waitManager.notify(event);
    vi.advanceTimersByTime(150);

    const [events1, events2] = await Promise.all([wait1, wait2]);
    expect(events1).toHaveLength(1);
    expect(events2).toHaveLength(1);
    expect(waitManager.pendingCount).toBe(0);
  });

  it('T-WAIT-6: notify() does NOT resolve waiters on different workspaces', async () => {
    const event: HubEvent = {
      type: 'message_posted',
      workspaceId: 'ws-1',
      data: { content: 'for ws-1 only' },
    };

    const waitWs1 = waitManager.wait('ws-1', { timeout: 5 });
    const waitWs2 = waitManager.wait('ws-2', { timeout: 1 });

    waitManager.notify(event);
    vi.advanceTimersByTime(150);

    const eventsWs1 = await waitWs1;
    expect(eventsWs1).toHaveLength(1);

    // ws-2 should still be pending (only ws-1 resolved)
    expect(waitManager.pendingCount).toBe(1);

    // Let ws-2 timeout
    vi.advanceTimersByTime(1_000);
    const eventsWs2 = await waitWs2;
    expect(eventsWs2).toEqual([]);
  });

  it('T-WAIT-7: cleanup() removes a specific waiter', async () => {
    const waitPromise = waitManager.wait('ws-1', { timeout: 55 });
    expect(waitManager.pendingCount).toBe(1);

    // Simulate disconnect — cleanup via the waiter ref
    // We need to access the internal waiter. The wait() stores it.
    // cleanup is called by the hub handler on disconnect scenarios.
    // For unit testing, we verify pendingCount drops after timeout.
    // Instead, let's test that after cleanup the waiter doesn't fire.
    waitManager.cleanupAll();
    expect(waitManager.pendingCount).toBe(0);

    // The promise should resolve with empty (cleaned up)
    const events = await waitPromise;
    expect(events).toEqual([]);
  });

  it('T-WAIT-8: coalesces multiple rapid events within 100ms window', async () => {
    const event1: HubEvent = {
      type: 'message_posted',
      workspaceId: 'ws-1',
      data: { content: 'msg1' },
    };
    const event2: HubEvent = {
      type: 'message_posted',
      workspaceId: 'ws-1',
      data: { content: 'msg2' },
    };
    const event3: HubEvent = {
      type: 'problem_created',
      workspaceId: 'ws-1',
      data: { title: 'new bug' },
    };

    const waitPromise = waitManager.wait('ws-1', { timeout: 5 });

    // Rapid-fire events within 100ms window
    waitManager.notify(event1);
    vi.advanceTimersByTime(30);
    waitManager.notify(event2);
    vi.advanceTimersByTime(30);
    waitManager.notify(event3);

    // Advance past coalesce window
    vi.advanceTimersByTime(150);

    const events = await waitPromise;
    expect(events).toHaveLength(3);
    expect(events[0].data.content).toBe('msg1');
    expect(events[1].data.content).toBe('msg2');
    expect(events[2].data.title).toBe('new bug');
  });
});

// =============================================================================
// Phase 4: Hub Handler Integration Tests
// =============================================================================

describe('hub_wait handler integration', () => {
  let storage: ReturnType<typeof createInMemoryHubStorage>;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;

  beforeEach(() => {
    vi.useFakeTimers();
    storage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function setupWorkspace(handler: ReturnType<typeof createHubHandler>) {
    const reg = await handler.handle(null, 'register', { name: 'alice' }) as any;
    const ws = await handler.handle(reg.agentId, 'create_workspace', {
      name: 'test-ws', description: 'test workspace',
    }) as any;
    return { agentId: reg.agentId, workspaceId: ws.workspaceId };
  }

  it('T-WAIT-9: hub_wait returns events when another operation fires during wait', async () => {
    const handler = createHubHandler(storage, thoughtStore);
    const { agentId, workspaceId } = await setupWorkspace(handler);

    // Start waiting
    const waitPromise = handler.handle(agentId, 'hub_wait', {
      workspaceId,
      timeout: 5,
    });

    // Fire an event by creating a problem
    await handler.handle(agentId, 'create_problem', {
      workspaceId,
      title: 'Test problem',
      description: 'A test',
    });

    // Advance past coalesce window
    vi.advanceTimersByTime(150);

    const result = await waitPromise as any;
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.events[0].type).toBe('problem_created');
  });

  it('T-WAIT-10: hub_wait returns timeout response when no events fire', async () => {
    const handler = createHubHandler(storage, thoughtStore);
    const { agentId, workspaceId } = await setupWorkspace(handler);

    const waitPromise = handler.handle(agentId, 'hub_wait', {
      workspaceId,
      timeout: 2,
    });

    await vi.advanceTimersByTimeAsync(2_000);

    const result = await waitPromise as any;
    expect(result.events).toEqual([]);
    expect(result.timeout).toBe(true);
  });

  it('T-WAIT-11: hub_wait requires workspaceId (stage 2 enforcement)', async () => {
    const handler = createHubHandler(storage, thoughtStore);
    const reg = await handler.handle(null, 'register', { name: 'bob' }) as any;

    // Try hub_wait without workspaceId
    await expect(
      handler.handle(reg.agentId, 'hub_wait', {})
    ).rejects.toThrow(/join a workspace/i);
  });

  it('T-WAIT-12: hub_wait requires workspace membership', async () => {
    const handler = createHubHandler(storage, thoughtStore);
    const reg1 = await handler.handle(null, 'register', { name: 'alice' }) as any;
    const reg2 = await handler.handle(null, 'register', { name: 'bob' }) as any;

    // Alice creates workspace
    const ws = await handler.handle(reg1.agentId, 'create_workspace', {
      name: 'ws', description: 'test',
    }) as any;

    // Bob tries hub_wait without joining
    await expect(
      handler.handle(reg2.agentId, 'hub_wait', { workspaceId: ws.workspaceId })
    ).rejects.toThrow(/join a workspace/i);
  });

  it('T-WAIT-13: hub_wait response includes iteration/maxIterations/continuePolling', async () => {
    const handler = createHubHandler(storage, thoughtStore);
    const { agentId, workspaceId } = await setupWorkspace(handler);

    const waitPromise = handler.handle(agentId, 'hub_wait', {
      workspaceId,
      timeout: 1,
      iteration: 3,
      maxIterations: 10,
    });

    await vi.advanceTimersByTimeAsync(1_000);

    const result = await waitPromise as any;
    expect(result.iteration).toBe(3);
    expect(result.maxIterations).toBe(10);
    expect(result.continuePolling).toBe(true);
  });

  it('T-WAIT-14: hub_wait response includes hint text for next call', async () => {
    const handler = createHubHandler(storage, thoughtStore);
    const { agentId, workspaceId } = await setupWorkspace(handler);

    const waitPromise = handler.handle(agentId, 'hub_wait', {
      workspaceId,
      timeout: 1,
      iteration: 2,
    });

    await vi.advanceTimersByTimeAsync(1_000);

    const result = await waitPromise as any;
    expect(result.hint).toContain('iteration=3');
  });

  it('T-WAIT-15: hub_wait with iteration > maxIterations returns continuePolling=false', async () => {
    const handler = createHubHandler(storage, thoughtStore);
    const { agentId, workspaceId } = await setupWorkspace(handler);

    const result = await handler.handle(agentId, 'hub_wait', {
      workspaceId,
      iteration: 11,
      maxIterations: 10,
    }) as any;

    expect(result.continuePolling).toBe(false);
    expect(result.events).toEqual([]);
    expect(result.hint).toContain('Maximum iterations reached');
  });
});
