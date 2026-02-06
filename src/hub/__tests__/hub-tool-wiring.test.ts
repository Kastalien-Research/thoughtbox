/**
 * Tests for hub tool wiring — connecting hub domain to MCP server
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHubToolHandler } from '../hub-tool-handler.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';
import type { HubStorage } from '../hub-types.js';

describe('Hub Tool Wiring', () => {
  let hubStorage: HubStorage;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;

  beforeEach(() => {
    hubStorage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();
  });

  it('T-HTW-1: createHubToolHandler returns a handler with handle method', () => {
    const handler = createHubToolHandler({ hubStorage, thoughtStore });
    expect(handler).toBeDefined();
    expect(handler.handle).toBeDefined();
    expect(typeof handler.handle).toBe('function');
  });

  it('T-HTW-2: handle dispatches to hub-handler and returns result', async () => {
    const handler = createHubToolHandler({ hubStorage, thoughtStore });
    const result = await handler.handle({
      operation: 'register',
      args: { name: 'alice' },
    });

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    expect(result.isError).toBeFalsy();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.agentId).toBeDefined();
    expect(parsed.name).toBe('alice');
  });

  it('T-HTW-3: handle returns error result on handler failure', async () => {
    const handler = createHubToolHandler({ hubStorage, thoughtStore });
    const result = await handler.handle({
      operation: 'create_workspace',
      args: { name: 'ws', description: 'test' },
    });

    // Should fail because no agent is registered (no env vars set)
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toContain('Register first');
  });

  it('T-HTW-4: handle returns correct data for getTask-style operations', async () => {
    const handler = createHubToolHandler({ hubStorage, thoughtStore });

    // Register
    const regResult = await handler.handle({ operation: 'register', args: { name: 'bob' } });
    const regData = JSON.parse(regResult.content[0].text);

    // Whoami
    const whoamiResult = await handler.handle({ operation: 'whoami', args: {} });
    const whoamiData = JSON.parse(whoamiResult.content[0].text);
    expect(whoamiData.agentId).toBe(regData.agentId);
  });

  it('T-HTW-5: agent identity resolved from env var on first call', async () => {
    const handler = createHubToolHandler({
      hubStorage,
      thoughtStore,
      envAgentId: 'env-agent-123',
    });

    // Should be able to call whoami without explicit register
    const result = await handler.handle({ operation: 'whoami', args: {} });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data.agentId).toBe('env-agent-123');
  });

  it('T-HTW-6: register operation works without env vars', async () => {
    const handler = createHubToolHandler({ hubStorage, thoughtStore });
    const result = await handler.handle({
      operation: 'register',
      args: { name: 'carol' },
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data.name).toBe('carol');
    expect(data.agentId).toBeDefined();
  });

  it('T-HTW-7: progressive disclosure errors propagate correctly', async () => {
    const handler = createHubToolHandler({ hubStorage, thoughtStore });

    // Try workspace op without register
    const result = await handler.handle({
      operation: 'create_problem',
      args: { workspaceId: 'ws-1', title: 'Test', description: 'desc' },
    });

    expect(result.isError).toBe(true);
    const data = JSON.parse(result.content[0].text);
    expect(data.error).toContain('Register first');
  });

  it('T-HTW-8: onEvent callback is wired through', async () => {
    const onEvent = vi.fn();
    const handler = createHubToolHandler({ hubStorage, thoughtStore, onEvent });

    // Register + create workspace + create problem
    await handler.handle({ operation: 'register', args: { name: 'dave' } });
    const wsResult = await handler.handle({
      operation: 'create_workspace',
      args: { name: 'ws', description: 'test' },
    });
    const wsData = JSON.parse(wsResult.content[0].text);

    await handler.handle({
      operation: 'create_problem',
      args: { workspaceId: wsData.workspaceId, title: 'P1', description: 'desc' },
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'problem_created' })
    );
  });

  it('T-HTW-9: agent name env var resolves identity on first call', async () => {
    const handler = createHubToolHandler({
      hubStorage,
      thoughtStore,
      envAgentName: 'Named Agent',
    });

    const result = await handler.handle({ operation: 'whoami', args: {} });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data.name).toBe('Named Agent');
  });

  it('T-HTW-10: full flow through tool handler', async () => {
    const handler = createHubToolHandler({ hubStorage, thoughtStore });

    // Register
    const regResult = await handler.handle({ operation: 'register', args: { name: 'eve' } });
    const reg = JSON.parse(regResult.content[0].text);

    // Create workspace
    const wsResult = await handler.handle({
      operation: 'create_workspace',
      args: { name: 'research', description: 'Research workspace' },
    });
    const ws = JSON.parse(wsResult.content[0].text);
    expect(ws.workspaceId).toBeDefined();

    // List workspaces
    const listResult = await handler.handle({ operation: 'list_workspaces', args: {} });
    const list = JSON.parse(listResult.content[0].text);
    expect(list.workspaces).toBeDefined();
    expect(list.workspaces.length).toBe(1);

    // Create problem
    const probResult = await handler.handle({
      operation: 'create_problem',
      args: { workspaceId: ws.workspaceId, title: 'Bug fix', description: 'Fix a bug' },
    });
    const prob = JSON.parse(probResult.content[0].text);
    expect(prob.problemId).toBeDefined();
  });
});
