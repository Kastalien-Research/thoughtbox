/**
 * Tests for workspace_digest hub operation
 *
 * workspace_digest returns a summary of reasoning state across all agents:
 * - Agent metadata and status
 * - Pending proposals and review status
 * - Problem summary
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createHubHandler } from '../hub-handler.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';

describe('workspace_digest operation', () => {
  let storage: ReturnType<typeof createInMemoryHubStorage>;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;
  let handler: ReturnType<typeof createHubHandler>;
  let workspaceId: string;
  let coordId: string;

  beforeEach(async () => {
    storage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();
    handler = createHubHandler(storage, thoughtStore);

    // Create coordinator and workspace
    const coord = await handler.handle(null, 'register', { name: 'Coordinator' }) as any;
    coordId = coord.agentId;
    const ws = await handler.handle(coordId, 'create_workspace', {
      name: 'Digest Workspace',
      description: 'For digest testing',
    }) as any;
    workspaceId = ws.workspaceId;
  });

  it('returns digest for workspace with single agent', async () => {
    const result = await handler.handle(coordId, 'workspace_digest', {
      workspaceId,
    }) as any;

    expect(result).toBeDefined();
    expect(result.workspaceId).toBe(workspaceId);
    expect(result.agents).toBeDefined();
    expect(Array.isArray(result.agents)).toBe(true);
    expect(result.agents.length).toBe(1);
    expect(result.agents[0].agentId).toBe(coordId);
  });

  it('includes multiple agents after they join', async () => {
    // Add two more agents
    const join1 = await handler.handle(null, 'quick_join', {
      name: 'Architect',
      workspaceId,
    }) as any;
    const join2 = await handler.handle(null, 'quick_join', {
      name: 'Debugger',
      workspaceId,
    }) as any;

    const result = await handler.handle(coordId, 'workspace_digest', {
      workspaceId,
    }) as any;

    expect(result.agents.length).toBe(3);
    const agentNames = result.agents.map((a: any) => a.name);
    expect(agentNames).toContain('Coordinator');
    expect(agentNames).toContain('Architect');
    expect(agentNames).toContain('Debugger');
  });

  it('includes pending proposals', async () => {
    // Create a problem and proposal
    const problem = await handler.handle(coordId, 'create_problem', {
      workspaceId,
      title: 'Test Problem',
      description: 'Needs work',
    }) as any;

    await handler.handle(coordId, 'claim_problem', {
      workspaceId,
      problemId: problem.problemId,
      branchId: 'coord/test',
    });

    await handler.handle(coordId, 'create_proposal', {
      workspaceId,
      title: 'Fix proposal',
      description: 'Proposed fix',
      sourceBranch: 'coord/test',
      problemId: problem.problemId,
    });

    const result = await handler.handle(coordId, 'workspace_digest', {
      workspaceId,
    }) as any;

    expect(result.pendingProposals).toBeDefined();
    expect(result.pendingProposals.length).toBe(1);
    expect(result.pendingProposals[0].title).toBe('Fix proposal');
  });

  it('includes problem summary', async () => {
    await handler.handle(coordId, 'create_problem', {
      workspaceId,
      title: 'Open Problem',
      description: 'Not started',
    });

    const result = await handler.handle(coordId, 'workspace_digest', {
      workspaceId,
    }) as any;

    expect(result.problemSummary).toBeDefined();
    expect(result.problemSummary.open).toBe(1);
  });

  it('requires workspace membership', async () => {
    const outsider = await handler.handle(null, 'register', { name: 'Outsider' }) as any;

    await expect(
      handler.handle(outsider.agentId, 'workspace_digest', { workspaceId })
    ).rejects.toThrow();
  });
});
