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
      name: 'alice',
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
      name: 'ws',
      description: 'test',
    });

    // Should fail because no agent is registered (no env vars set)
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toContain('Register first');
  });

  it('T-HTW-4: handle returns correct data for getTask-style operations', async () => {
    const handler = createHubToolHandler({ hubStorage, thoughtStore });

    // Register
    const regResult = await handler.handle({ operation: 'register', name: 'bob' });
    const regData = JSON.parse(regResult.content[0].text);

    // Whoami
    const whoamiResult = await handler.handle({ operation: 'whoami' });
    const whoamiData = JSON.parse(whoamiResult.content[0].text);
    expect(whoamiData.agentId).toBe(regData.agentId);
  });

  it('T-HTW-5: agent identity resolved from env var on first call', async () => {
    const handler = createHubToolHandler({
      hubStorage,
      thoughtStore,
      envAgentId: 'env-agent-123',
      envAgentName: 'env-agent',
    });

    // Should be able to call whoami without explicit register
    const result = await handler.handle({ operation: 'whoami' });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data.agentId).toBe('env-agent-123');
  });

  it('T-HTW-6: register operation works without env vars', async () => {
    const handler = createHubToolHandler({ hubStorage, thoughtStore });
    const result = await handler.handle({
      operation: 'register',
      name: 'carol',
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
      workspaceId: 'ws-1',
      title: 'Test',
      description: 'desc',
    });

    expect(result.isError).toBe(true);
    const data = JSON.parse(result.content[0].text);
    expect(data.error).toContain('Register first');
  });

  it('T-HTW-8: onEvent callback is wired through', async () => {
    const onEvent = vi.fn();
    const handler = createHubToolHandler({ hubStorage, thoughtStore, onEvent });

    // Register + create workspace + create problem
    await handler.handle({ operation: 'register', name: 'dave' });
    const wsResult = await handler.handle({
      operation: 'create_workspace',
      name: 'ws',
      description: 'test',
    });
    const wsData = JSON.parse(wsResult.content[0].text);

    await handler.handle({
      operation: 'create_problem',
      workspaceId: wsData.workspaceId,
      title: 'P1',
      description: 'desc',
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

    const result = await handler.handle({ operation: 'whoami' });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data.name).toBe('Named Agent');
  });

  describe('Connection-scoped identity registry', () => {
    it('T-HTW-11: two agents register in same session, each keeps own identity', async () => {
      const handler = createHubToolHandler({ hubStorage, thoughtStore });
      const sessionId = 'shared-session';

      // Agent A registers
      const regA = await handler.handle(
        { operation: 'register', name: 'auditor' },
        sessionId
      );
      const agentA = JSON.parse(regA.content[0].text);

      // Agent B registers in the same session
      const regB = await handler.handle(
        { operation: 'register', name: 'coordinator' },
        sessionId
      );
      const agentB = JSON.parse(regB.content[0].text);

      expect(agentA.agentId).not.toBe(agentB.agentId);

      // Agent A identifies itself via agentId
      const whoamiA = await handler.handle(
        { operation: 'whoami', agentId: agentA.agentId },
        sessionId
      );
      expect(JSON.parse(whoamiA.content[0].text).agentId).toBe(agentA.agentId);

      // Agent B identifies itself via agentId
      const whoamiB = await handler.handle(
        { operation: 'whoami', agentId: agentB.agentId },
        sessionId
      );
      expect(JSON.parse(whoamiB.content[0].text).agentId).toBe(agentB.agentId);
    });

    it('T-HTW-12: unregistered agentId is rejected', async () => {
      const handler = createHubToolHandler({ hubStorage, thoughtStore });
      const sessionId = 'shared-session';

      await handler.handle(
        { operation: 'register', name: 'legit' },
        sessionId
      );

      const result = await handler.handle(
        { operation: 'whoami', agentId: 'spoofed-id' },
        sessionId
      );

      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.error).toContain('not registered in this session');
    });

    it('T-HTW-13: first register sets session default, omitting agentId uses it', async () => {
      const handler = createHubToolHandler({ hubStorage, thoughtStore });
      const sessionId = 'shared-session';

      const regA = await handler.handle(
        { operation: 'register', name: 'first-agent' },
        sessionId
      );
      const agentA = JSON.parse(regA.content[0].text);

      // Second register should NOT change the default
      await handler.handle(
        { operation: 'register', name: 'second-agent' },
        sessionId
      );

      // Calling without agentId uses the first-registered default
      const whoami = await handler.handle(
        { operation: 'whoami' },
        sessionId
      );
      expect(JSON.parse(whoami.content[0].text).agentId).toBe(agentA.agentId);
    });

    it('T-HTW-14: quick_join registers into identity registry', async () => {
      const handler = createHubToolHandler({ hubStorage, thoughtStore });
      const sessionId = 'shared-session';

      // Coordinator registers and creates workspace
      const regCoord = await handler.handle(
        { operation: 'register', name: 'coordinator' },
        sessionId
      );
      const coord = JSON.parse(regCoord.content[0].text);

      const wsResult = await handler.handle(
        { operation: 'create_workspace', name: 'ws', description: 'test' },
        sessionId
      );
      const ws = JSON.parse(wsResult.content[0].text);

      // Sub-agent quick_joins in the same session
      const joinResult = await handler.handle(
        {
          operation: 'quick_join',
          name: 'auditor',
          workspaceId: ws.workspaceId,
        },
        sessionId
      );
      const joined = JSON.parse(joinResult.content[0].text);

      expect(joined.agentId).not.toBe(coord.agentId);

      // Sub-agent can use its own agentId for subsequent calls
      const whoami = await handler.handle(
        { operation: 'whoami', agentId: joined.agentId },
        sessionId
      );
      expect(JSON.parse(whoami.content[0].text).agentId).toBe(joined.agentId);
    });

    it('T-HTW-15: agentId is stripped from args before forwarding to hub handler', async () => {
      const handler = createHubToolHandler({ hubStorage, thoughtStore });
      const sessionId = 'shared-session';

      const regResult = await handler.handle(
        { operation: 'register', name: 'agent' },
        sessionId
      );
      const agent = JSON.parse(regResult.content[0].text);

      const wsResult = await handler.handle(
        {
          operation: 'create_workspace',
          agentId: agent.agentId,
          name: 'ws',
          description: 'test',
        },
        sessionId
      );

      // Should succeed — agentId stripped, not passed as unexpected arg
      expect(wsResult.isError).toBeFalsy();
      const ws = JSON.parse(wsResult.content[0].text);
      expect(ws.workspaceId).toBeDefined();
    });

    it('T-HTW-16: env-resolved agent is in registry and usable by agentId', async () => {
      const handler = createHubToolHandler({
        hubStorage,
        thoughtStore,
        envAgentId: 'env-123',
        envAgentName: 'env-bot',
      });
      const sessionId = 'shared-session';

      // Sub-agent registers
      const regResult = await handler.handle(
        { operation: 'register', name: 'sub-agent' },
        sessionId
      );
      const subAgent = JSON.parse(regResult.content[0].text);

      // Sub-agent can use its own ID
      const whoamiSub = await handler.handle(
        { operation: 'whoami', agentId: subAgent.agentId },
        sessionId
      );
      expect(JSON.parse(whoamiSub.content[0].text).agentId).toBe(subAgent.agentId);

      // Env agent can also be addressed explicitly
      const whoamiEnv = await handler.handle(
        { operation: 'whoami', agentId: 'env-123' },
        sessionId
      );
      expect(JSON.parse(whoamiEnv.content[0].text).agentId).toBe('env-123');
    });
  });

  it('T-HTW-10: full flow through tool handler', async () => {
    const handler = createHubToolHandler({ hubStorage, thoughtStore });

    // Register
    const regResult = await handler.handle({ operation: 'register', name: 'eve' });
    const reg = JSON.parse(regResult.content[0].text);

    // Create workspace
    const wsResult = await handler.handle({
      operation: 'create_workspace',
      name: 'research',
      description: 'Research workspace',
    });
    const ws = JSON.parse(wsResult.content[0].text);
    expect(ws.workspaceId).toBeDefined();

    // List workspaces
    const listResult = await handler.handle({ operation: 'list_workspaces' });
    const list = JSON.parse(listResult.content[0].text);
    expect(list.workspaces).toBeDefined();
    expect(list.workspaces.length).toBe(1);

    // Create problem
    const probResult = await handler.handle({
      operation: 'create_problem',
      workspaceId: ws.workspaceId,
      title: 'Bug fix',
      description: 'Fix a bug',
    });
    const prob = JSON.parse(probResult.content[0].text);
    expect(prob.problemId).toBeDefined();
  });
});
