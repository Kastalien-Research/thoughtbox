/**
 * M10: Per-Session Agent Identity — isolation tests
 *
 * Verifies that HubToolHandler correctly isolates agent identity per MCP session,
 * so multiple concurrent sessions sharing one handler instance cannot see each
 * other's registered identity.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createHubToolHandler, type HubToolHandler } from '../hub-tool-handler.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';
import type { HubStorage } from '../hub-types.js';

describe('HubToolHandler — Per-Session Identity Isolation', () => {
  let hubStorage: HubStorage;
  let handler: HubToolHandler;

  beforeEach(() => {
    hubStorage = createInMemoryHubStorage();
    const thoughtStore = createInMemoryThoughtStore();
    handler = createHubToolHandler({
      hubStorage,
      thoughtStore,
      // No env vars — forces explicit registration per session
    });
  });

  it('two sessions registering different names get distinct agentIds', async () => {
    // Session A registers as "Alpha"
    const regA = await handler.handle(
      { operation: 'register', args: { name: 'Alpha' } },
      'session-aaa',
    );
    const dataA = JSON.parse(regA.content[0].text);
    expect(dataA.agentId).toBeDefined();
    expect(dataA.name).toBe('Alpha');

    // Session B registers as "Beta"
    const regB = await handler.handle(
      { operation: 'register', args: { name: 'Beta' } },
      'session-bbb',
    );
    const dataB = JSON.parse(regB.content[0].text);
    expect(dataB.agentId).toBeDefined();
    expect(dataB.name).toBe('Beta');

    // Distinct IDs
    expect(dataA.agentId).not.toBe(dataB.agentId);
  });

  it('whoami returns session-specific identity after registration', async () => {
    // Register in two sessions
    await handler.handle(
      { operation: 'register', args: { name: 'Alpha' } },
      'session-aaa',
    );
    await handler.handle(
      { operation: 'register', args: { name: 'Beta' } },
      'session-bbb',
    );

    // whoami in session A should return Alpha
    const whoamiA = await handler.handle(
      { operation: 'whoami' },
      'session-aaa',
    );
    const dataA = JSON.parse(whoamiA.content[0].text);
    expect(dataA.name).toBe('Alpha');

    // whoami in session B should return Beta
    const whoamiB = await handler.handle(
      { operation: 'whoami' },
      'session-bbb',
    );
    const dataB = JSON.parse(whoamiB.content[0].text);
    expect(dataB.name).toBe('Beta');

    // Verify distinct agent IDs
    expect(dataA.agentId).not.toBe(dataB.agentId);
  });

  it('session without registration returns register-required error', async () => {
    // Register only in session A
    await handler.handle(
      { operation: 'register', args: { name: 'Alpha' } },
      'session-aaa',
    );

    // Session B has not registered — whoami should fail
    const whoamiB = await handler.handle(
      { operation: 'whoami' },
      'session-bbb',
    );
    expect(whoamiB.isError).toBe(true);
    const errData = JSON.parse(whoamiB.content[0].text);
    expect(errData.error).toMatch(/register/i);
  });

  it('no session ID falls back to __default__ key', async () => {
    // Register without explicit session ID
    const reg = await handler.handle(
      { operation: 'register', args: { name: 'Default' } },
    );
    const data = JSON.parse(reg.content[0].text);
    expect(data.agentId).toBeDefined();

    // whoami without session ID uses same __default__ key
    const whoami = await handler.handle({ operation: 'whoami' });
    const whoamiData = JSON.parse(whoami.content[0].text);
    expect(whoamiData.agentId).toBe(data.agentId);
    expect(whoamiData.name).toBe('Default');
  });

  it('session identity does not leak to default key', async () => {
    // Register as Alpha in session-aaa
    await handler.handle(
      { operation: 'register', args: { name: 'Alpha' } },
      'session-aaa',
    );

    // whoami without session ID should fail (no default registration)
    const whoami = await handler.handle({ operation: 'whoami' });
    expect(whoami.isError).toBe(true);
  });

  it('three sessions collaborate with correct attribution', async () => {
    // Register three agents in three sessions
    const regAlpha = await handler.handle(
      { operation: 'register', args: { name: 'Alpha' } },
      'sess-1',
    );
    const regBeta = await handler.handle(
      { operation: 'register', args: { name: 'Beta' } },
      'sess-2',
    );
    const regGamma = await handler.handle(
      { operation: 'register', args: { name: 'Gamma' } },
      'sess-3',
    );

    const alphaId = JSON.parse(regAlpha.content[0].text).agentId;
    const betaId = JSON.parse(regBeta.content[0].text).agentId;
    const gammaId = JSON.parse(regGamma.content[0].text).agentId;

    // Alpha creates workspace
    const wsResult = await handler.handle(
      { operation: 'create_workspace', args: { name: 'M10-test', description: 'Testing per-session isolation' } },
      'sess-1',
    );
    const wsId = JSON.parse(wsResult.content[0].text).workspaceId;

    // Beta and Gamma join
    await handler.handle(
      { operation: 'join_workspace', args: { workspaceId: wsId } },
      'sess-2',
    );
    await handler.handle(
      { operation: 'join_workspace', args: { workspaceId: wsId } },
      'sess-3',
    );

    // Alpha creates a problem
    const probResult = await handler.handle(
      { operation: 'create_problem', args: { workspaceId: wsId, title: 'Test attribution', description: 'Verify each agent message is attributed correctly' } },
      'sess-1',
    );
    const probId = JSON.parse(probResult.content[0].text).problemId;

    // Each agent posts a message
    await handler.handle(
      { operation: 'post_message', args: { workspaceId: wsId, problemId: probId, content: 'Message from Alpha' } },
      'sess-1',
    );
    await handler.handle(
      { operation: 'post_message', args: { workspaceId: wsId, problemId: probId, content: 'Message from Beta' } },
      'sess-2',
    );
    await handler.handle(
      { operation: 'post_message', args: { workspaceId: wsId, problemId: probId, content: 'Message from Gamma' } },
      'sess-3',
    );

    // Read channel from any session — all messages should be attributed correctly
    const channelResult = await handler.handle(
      { operation: 'read_channel', args: { workspaceId: wsId, problemId: probId } },
      'sess-1',
    );
    const channelData = JSON.parse(channelResult.content[0].text);
    const messages = channelData.messages;

    expect(messages).toHaveLength(3);

    // Verify each message is attributed to the correct agent
    const alphaMsg = messages.find((m: any) => m.content === 'Message from Alpha');
    const betaMsg = messages.find((m: any) => m.content === 'Message from Beta');
    const gammaMsg = messages.find((m: any) => m.content === 'Message from Gamma');

    expect(alphaMsg.agentId).toBe(alphaId);
    expect(betaMsg.agentId).toBe(betaId);
    expect(gammaMsg.agentId).toBe(gammaId);

    // Verify workspace shows 3 members
    const wsStatus = await handler.handle(
      { operation: 'workspace_status', args: { workspaceId: wsId } },
      'sess-1',
    );
    const statusData = JSON.parse(wsStatus.content[0].text);
    expect(statusData.agents).toHaveLength(3);

    // Verify distinct agent IDs in agents list
    const memberIds = statusData.agents.map((m: any) => m.agentId);
    expect(new Set(memberIds).size).toBe(3);
    expect(memberIds).toContain(alphaId);
    expect(memberIds).toContain(betaId);
    expect(memberIds).toContain(gammaId);
  });
});
