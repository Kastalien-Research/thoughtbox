import { describe, it, expect, beforeEach } from 'vitest';
import { createWorkspaceManager } from '../workspace.js';
import { createIdentityManager } from '../identity.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';
import type { HubStorage } from '../hub-types.js';

describe('Workspace', () => {
  let storage: HubStorage;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;
  let identity: ReturnType<typeof createIdentityManager>;
  let workspace: ReturnType<typeof createWorkspaceManager>;

  beforeEach(() => {
    storage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();
    identity = createIdentityManager(storage);
    workspace = createWorkspaceManager(storage, thoughtStore);
  });

  // T-WS-1: Create workspace assigns coordinator role
  it('create workspace assigns coordinator role', async () => {
    const alice = await identity.register({ name: 'alice' });
    const result = await workspace.createWorkspace(alice.agentId, {
      name: 'arch-review',
      description: 'Review architecture',
    });

    expect(result.workspaceId).toBeDefined();
    expect(result.mainSessionId).toBeDefined();

    const ws = await storage.getWorkspace(result.workspaceId);
    expect(ws).not.toBeNull();
    expect(ws!.agents[0].agentId).toBe(alice.agentId);
    expect(ws!.agents[0].role).toBe('coordinator');
  });

  // T-WS-2: Create workspace with existing session reuses it
  it('create workspace with existing session reuses it', async () => {
    const alice = await identity.register({ name: 'alice' });

    // Create session with 3 thoughts
    const existingSessionId = 'existing-session';
    await thoughtStore.createSession(existingSessionId);
    for (let i = 1; i <= 3; i++) {
      await thoughtStore.saveThought(existingSessionId, {
        thought: `thought ${i}`,
        thoughtNumber: i,
        totalThoughts: 3,
        nextThoughtNeeded: i < 3,
        timestamp: new Date().toISOString(),
      });
    }

    const result = await workspace.createWorkspace(alice.agentId, {
      name: 'review',
      description: '...',
      sessionId: existingSessionId,
    });

    expect(result.mainSessionId).toBe(existingSessionId);
    const thoughts = await thoughtStore.getThoughts(existingSessionId);
    expect(thoughts).toHaveLength(3);
  });

  // T-WS-3: Join workspace adds contributor
  it('join workspace adds contributor', async () => {
    const alice = await identity.register({ name: 'alice' });
    const bob = await identity.register({ name: 'bob' });

    const { workspaceId } = await workspace.createWorkspace(alice.agentId, {
      name: 'review',
      description: '...',
    });

    const joinResult = await workspace.joinWorkspace(bob.agentId, { workspaceId });
    expect(joinResult.workspace).toBeDefined();

    const ws = await storage.getWorkspace(workspaceId);
    const bobAgent = ws!.agents.find(a => a.agentId === bob.agentId);
    expect(bobAgent).toBeDefined();
    expect(bobAgent!.role).toBe('contributor');
  });

  // T-WS-4: Join workspace returns current problems and proposals
  it('join workspace returns current problems and proposals', async () => {
    const alice = await identity.register({ name: 'alice' });
    const bob = await identity.register({ name: 'bob' });

    const { workspaceId } = await workspace.createWorkspace(alice.agentId, {
      name: 'review',
      description: '...',
    });

    // Add 2 problems and 1 proposal directly to storage
    await storage.saveProblem({
      id: 'p1', workspaceId, title: 'Problem 1', description: '...', createdBy: alice.agentId,
      status: 'open', comments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    await storage.saveProblem({
      id: 'p2', workspaceId, title: 'Problem 2', description: '...', createdBy: alice.agentId,
      status: 'open', comments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    await storage.saveProposal({
      id: 'pp1', workspaceId, title: 'Proposal 1', description: '...', createdBy: alice.agentId,
      sourceBranch: 'branch-1', status: 'open', reviews: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });

    const result = await workspace.joinWorkspace(bob.agentId, { workspaceId });
    expect(result.problems).toHaveLength(2);
    expect(result.proposals).toHaveLength(1);
  });

  // T-WS-5: list_workspaces returns all workspaces
  it('list workspaces returns all workspaces', async () => {
    const alice = await identity.register({ name: 'alice' });

    await workspace.createWorkspace(alice.agentId, { name: 'ws-1', description: '...' });
    await workspace.createWorkspace(alice.agentId, { name: 'ws-2', description: '...' });

    const result = await workspace.listWorkspaces();
    expect(result.workspaces).toHaveLength(2);
    expect(result.workspaces[0]).toHaveProperty('id');
    expect(result.workspaces[0]).toHaveProperty('name');
    expect(result.workspaces[0]).toHaveProperty('agentCount');
    expect(result.workspaces[0]).toHaveProperty('problemCount');
  });

  // T-WS-6: workspace_status returns agent presence
  it('workspace status returns agent presence', async () => {
    const alice = await identity.register({ name: 'alice' });
    const bob = await identity.register({ name: 'bob' });

    const { workspaceId } = await workspace.createWorkspace(alice.agentId, {
      name: 'review',
      description: '...',
    });
    await workspace.joinWorkspace(bob.agentId, { workspaceId });

    // Set bob's status to offline
    const ws = await storage.getWorkspace(workspaceId);
    const bobAgent = ws!.agents.find(a => a.agentId === bob.agentId)!;
    bobAgent.status = 'offline';
    await storage.saveWorkspace(ws!);

    const status = await workspace.workspaceStatus({ workspaceId });
    expect(status.agents).toBeDefined();

    const aliceStatus = status.agents.find((a: any) => a.agentId === alice.agentId);
    const bobStatus = status.agents.find((a: any) => a.agentId === bob.agentId);
    expect(aliceStatus!.status).toBe('online');
    expect(bobStatus!.status).toBe('offline');
  });
});
