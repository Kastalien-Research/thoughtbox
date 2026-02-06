import { describe, it, expect, beforeEach } from 'vitest';
import { createConsensusManager } from '../consensus.js';
import { createWorkspaceManager } from '../workspace.js';
import { createIdentityManager } from '../identity.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';
import type { HubStorage } from '../hub-types.js';

describe('Consensus', () => {
  let storage: HubStorage;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;
  let identity: ReturnType<typeof createIdentityManager>;
  let workspace: ReturnType<typeof createWorkspaceManager>;
  let consensus: ReturnType<typeof createConsensusManager>;
  let aliceId: string;
  let bobId: string;
  let workspaceId: string;

  beforeEach(async () => {
    storage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();
    identity = createIdentityManager(storage);
    workspace = createWorkspaceManager(storage, thoughtStore);
    consensus = createConsensusManager(storage);

    const alice = await identity.register({ name: 'alice' });
    aliceId = alice.agentId;
    const bob = await identity.register({ name: 'bob' });
    bobId = bob.agentId;

    const ws = await workspace.createWorkspace(aliceId, {
      name: 'test-ws',
      description: '...',
    });
    workspaceId = ws.workspaceId;
    await workspace.joinWorkspace(bobId, { workspaceId });

    // Add 10 thoughts to main chain
    for (let i = 1; i <= 10; i++) {
      await thoughtStore.saveThought(ws.mainSessionId, {
        thought: `thought ${i}`,
        thoughtNumber: i,
        totalThoughts: 10,
        nextThoughtNeeded: i < 10,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // T-CON-1: Mark consensus (coordinator)
  it('mark consensus as coordinator returns consensusId with agreedBy', async () => {
    const result = await consensus.markConsensus(aliceId, {
      workspaceId,
      name: 'v1-decision',
      description: 'Agreed on Redis',
      thoughtRef: 10,
    });

    expect(result.consensusId).toBeDefined();
    const marker = await storage.getConsensusMarker(workspaceId, result.consensusId);
    expect(marker).not.toBeNull();
    expect(marker!.agreedBy).toContain(aliceId);
    expect(marker!.name).toBe('v1-decision');
    expect(marker!.thoughtRef).toBe(10);
  });

  // T-CON-2: Mark consensus (contributor) fails
  it('mark consensus as contributor throws error', async () => {
    await expect(
      consensus.markConsensus(bobId, {
        workspaceId,
        name: 'bad',
        description: '...',
        thoughtRef: 5,
      }),
    ).rejects.toThrow('Only coordinator can mark consensus');
  });

  // T-CON-3: Endorse consensus adds agent
  it('endorse consensus adds agent to agreedBy', async () => {
    const { consensusId } = await consensus.markConsensus(aliceId, {
      workspaceId,
      name: 'decision',
      description: '...',
      thoughtRef: 5,
    });

    const result = await consensus.endorseConsensus(bobId, { workspaceId, consensusId });

    expect(result.marker.agreedBy).toContain(aliceId);
    expect(result.marker.agreedBy).toContain(bobId);
  });

  // T-CON-4: Double endorsement is idempotent
  it('double endorsement does not duplicate agent', async () => {
    const { consensusId } = await consensus.markConsensus(aliceId, {
      workspaceId,
      name: 'decision',
      description: '...',
      thoughtRef: 5,
    });

    await consensus.endorseConsensus(bobId, { workspaceId, consensusId });
    await consensus.endorseConsensus(bobId, { workspaceId, consensusId });

    const marker = await storage.getConsensusMarker(workspaceId, consensusId);
    const bobCount = marker!.agreedBy.filter(id => id === bobId).length;
    expect(bobCount).toBe(1);
  });

  // T-CON-5: List consensus returns all markers
  it('list consensus returns all markers', async () => {
    await consensus.markConsensus(aliceId, {
      workspaceId,
      name: 'decision-1',
      description: '...',
      thoughtRef: 3,
    });
    await consensus.markConsensus(aliceId, {
      workspaceId,
      name: 'decision-2',
      description: '...',
      thoughtRef: 7,
    });

    const result = await consensus.listConsensus({ workspaceId });
    expect(result.markers).toHaveLength(2);
    result.markers.forEach((m: any) => {
      expect(m.id).toBeDefined();
      expect(m.name).toBeDefined();
      expect(m.thoughtRef).toBeDefined();
      expect(m.agreedBy).toBeDefined();
    });
  });
});
