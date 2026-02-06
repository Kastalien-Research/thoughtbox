/**
 * Tests for agent identity resolution from environment variables
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resolveAgentId } from '../agent-identity.js';
import { createInMemoryHubStorage } from './test-helpers.js';
import type { HubStorage } from '../hub-types.js';

describe('Agent Identity Resolution', () => {
  let storage: HubStorage;

  beforeEach(() => {
    storage = createInMemoryHubStorage();
  });

  it('T-AID-1: resolveAgentId with THOUGHTBOX_AGENT_ID returns that ID', async () => {
    // Pre-register an agent with this ID
    await storage.saveAgent({
      agentId: 'fixed-uuid-123',
      name: 'test-agent',
      role: 'contributor',
      registeredAt: new Date().toISOString(),
    });

    const result = await resolveAgentId(storage, 'fixed-uuid-123', undefined);
    expect(result).toBe('fixed-uuid-123');
  });

  it('T-AID-2: resolveAgentId with THOUGHTBOX_AGENT_ID auto-registers if not in storage', async () => {
    const result = await resolveAgentId(storage, 'new-uuid-456', undefined);
    expect(result).toBe('new-uuid-456');

    // Verify agent was saved to storage
    const agent = await storage.getAgent('new-uuid-456');
    expect(agent).not.toBeNull();
    expect(agent!.agentId).toBe('new-uuid-456');
  });

  it('T-AID-3: resolveAgentId with THOUGHTBOX_AGENT_NAME looks up by name', async () => {
    // Pre-register an agent with this name
    await storage.saveAgent({
      agentId: 'existing-uuid',
      name: 'Research Agent',
      role: 'contributor',
      registeredAt: new Date().toISOString(),
    });

    const result = await resolveAgentId(storage, undefined, 'Research Agent');
    expect(result).toBe('existing-uuid');
  });

  it('T-AID-4: resolveAgentId with THOUGHTBOX_AGENT_NAME creates new agent if name not found', async () => {
    const result = await resolveAgentId(storage, undefined, 'New Agent');
    expect(result).not.toBeNull();

    // Verify agent was created with the given name
    const agents = await storage.getAgents();
    const found = agents.find(a => a.name === 'New Agent');
    expect(found).toBeDefined();
    expect(found!.agentId).toBe(result);
  });

  it('T-AID-5: resolveAgentId with both env vars prefers ID over NAME', async () => {
    await storage.saveAgent({
      agentId: 'id-agent',
      name: 'ID Agent',
      role: 'contributor',
      registeredAt: new Date().toISOString(),
    });
    await storage.saveAgent({
      agentId: 'name-agent',
      name: 'Name Agent',
      role: 'contributor',
      registeredAt: new Date().toISOString(),
    });

    const result = await resolveAgentId(storage, 'id-agent', 'Name Agent');
    expect(result).toBe('id-agent');
  });

  it('T-AID-6: resolveAgentId with neither returns null (register required)', async () => {
    const result = await resolveAgentId(storage, undefined, undefined);
    expect(result).toBeNull();
  });
});
