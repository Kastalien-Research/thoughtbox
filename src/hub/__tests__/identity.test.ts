import { describe, it, expect, beforeEach } from 'vitest';
import { createIdentityManager } from '../identity.js';
import type { HubStorage, AgentIdentity } from '../hub-types.js';

/** In-memory stub for HubStorage agent operations */
function createInMemoryStorage(): HubStorage {
  const agents: AgentIdentity[] = [];

  return {
    async getAgents() { return [...agents]; },
    async saveAgent(agent) { agents.push(agent); },
    async getAgent(agentId) { return agents.find(a => a.agentId === agentId) ?? null; },

    // Stubs — not used by identity module
    async getWorkspace() { return null; },
    async saveWorkspace() {},
    async listWorkspaces() { return []; },
    async getProblem() { return null; },
    async saveProblem() {},
    async listProblems() { return []; },
    async getProposal() { return null; },
    async saveProposal() {},
    async listProposals() { return []; },
    async getConsensusMarker() { return null; },
    async saveConsensusMarker() {},
    async listConsensusMarkers() { return []; },
    async getChannel() { return null; },
    async saveChannel() {},
  };
}

describe('Identity', () => {
  let storage: HubStorage;
  let identity: ReturnType<typeof createIdentityManager>;

  beforeEach(() => {
    storage = createInMemoryStorage();
    identity = createIdentityManager(storage);
  });

  // T-ID-1: Register agent returns server-assigned ID
  it('register returns server-assigned UUID and contributor role', async () => {
    const result = await identity.register({ name: 'research-agent', clientInfo: 'claude-code' });

    expect(result.agentId).toBeDefined();
    expect(result.agentId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(result.name).toBe('research-agent');
    expect(result.role).toBe('contributor');
  });

  // T-ID-2: Register same name twice returns different IDs
  it('register same name twice returns different agentIds', async () => {
    const first = await identity.register({ name: 'alice' });
    const second = await identity.register({ name: 'alice' });

    expect(first.agentId).not.toBe(second.agentId);
  });

  // T-ID-3: whoami returns registered identity
  it('whoami returns registered identity', async () => {
    const registered = await identity.register({ name: 'research-agent' });
    const me = await identity.whoami(registered.agentId);

    expect(me.agentId).toBe(registered.agentId);
    expect(me.name).toBe('research-agent');
    expect(me.role).toBe('contributor');
  });

  // T-ID-4: whoami before registration returns error
  it('whoami before registration throws error', async () => {
    await expect(identity.whoami('nonexistent-id'))
      .rejects.toThrow('Not registered. Call register first.');
  });
});
