/**
 * Tests for quick_join hub operation
 *
 * quick_join combines register + join_workspace in a single call
 * to reduce bootstrap friction for Agent Teams teammates.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createHubHandler } from '../hub-handler.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';

describe('quick_join operation', () => {
  let storage: ReturnType<typeof createInMemoryHubStorage>;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;
  let handler: ReturnType<typeof createHubHandler>;
  let workspaceId: string;

  beforeEach(async () => {
    storage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();
    handler = createHubHandler(storage, thoughtStore);

    // Create a coordinator and workspace
    const coord = await handler.handle(null, 'register', { name: 'Coordinator' });
    const coordId = (coord as any).agentId;
    const ws = await handler.handle(coordId, 'create_workspace', {
      name: 'Test Workspace',
      description: 'For quick_join testing',
    });
    workspaceId = (ws as any).workspaceId;
  });

  it('registers and joins workspace in one call', async () => {
    const result = await handler.handle(null, 'quick_join', {
      name: 'Architect-1',
      workspaceId,
    }) as any;

    expect(result.agentId).toBeDefined();
    expect(result.name).toBe('Architect-1');
    expect(result.workspace).toBeDefined();
    expect(result.workspace.id).toBe(workspaceId);
  });

  it('includes problems and proposals in response', async () => {
    const result = await handler.handle(null, 'quick_join', {
      name: 'Debugger-1',
      workspaceId,
    }) as any;

    expect(result.problems).toBeDefined();
    expect(Array.isArray(result.problems)).toBe(true);
    expect(result.proposals).toBeDefined();
    expect(Array.isArray(result.proposals)).toBe(true);
  });

  it('sets profile when provided', async () => {
    const result = await handler.handle(null, 'quick_join', {
      name: 'Arch',
      workspaceId,
      profile: 'ARCHITECT',
    }) as any;

    expect(result.agentId).toBeDefined();

    // Verify profile was set via whoami
    const whoami = await handler.handle(result.agentId, 'whoami', {}) as any;
    expect(whoami.profile).toBe('ARCHITECT');
  });

  it('rejects invalid profiles', async () => {
    await expect(
      handler.handle(null, 'quick_join', {
        name: 'Bad',
        workspaceId,
        profile: 'INVALID',
      })
    ).rejects.toThrow(/Invalid profile/);
  });

  it('rejects when workspace does not exist', async () => {
    await expect(
      handler.handle(null, 'quick_join', {
        name: 'Lost',
        workspaceId: 'nonexistent-ws',
      })
    ).rejects.toThrow(/Workspace not found/);
  });

  it('agent appears in workspace member list', async () => {
    const result = await handler.handle(null, 'quick_join', {
      name: 'Member',
      workspaceId,
    }) as any;

    const status = await handler.handle(result.agentId, 'workspace_status', {
      workspaceId,
    }) as any;

    const memberIds = status.agents.map((a: any) => a.agentId);
    expect(memberIds).toContain(result.agentId);
  });

  it('requires name argument', async () => {
    await expect(
      handler.handle(null, 'quick_join', { workspaceId })
    ).rejects.toThrow();
  });

  it('requires workspaceId argument', async () => {
    await expect(
      handler.handle(null, 'quick_join', { name: 'NoWS' })
    ).rejects.toThrow();
  });
});
