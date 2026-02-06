/**
 * Tests for identity resilience (M7)
 * Validates existing agent-identity.ts code against multi-agent scenarios.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveAgentId } from '../../hub/agent-identity.js';
import { createInMemoryHubStorage } from '../../hub/__tests__/test-helpers.js';
import type { HubStorage } from '../../hub/hub-types.js';

describe('identity-resilience', () => {
  let storage: HubStorage;

  beforeEach(() => {
    storage = createInMemoryHubStorage();
  });

  it('T-MA-IDR-1: resolveAgentId with both ID and NAME auto-registers, returns same ID', async () => {
    const id = 'agent-uuid-001';
    const name = 'Claude Code';

    const result = await resolveAgentId(storage, id, name);
    expect(result).toBe(id);

    // Verify agent was registered
    const agent = await storage.getAgent(id);
    expect(agent).not.toBeNull();
    expect(agent!.name).toBe(name);
  });

  it('T-MA-IDR-2: resolveAgentId with only NAME finds existing agent on reconnect', async () => {
    // First call: create agent by name
    const firstId = await resolveAgentId(storage, undefined, 'Cursor');
    expect(firstId).not.toBeNull();

    // Second call: find by name (simulating reconnect)
    const secondId = await resolveAgentId(storage, undefined, 'Cursor');
    expect(secondId).toBe(firstId);
  });

  it('T-MA-IDR-3: resolveAgentId with only NAME creates new agent if not found', async () => {
    const result = await resolveAgentId(storage, undefined, 'Roo Code');
    expect(result).not.toBeNull();
    expect(typeof result).toBe('string');

    // Verify the agent was saved
    const agents = await storage.getAgents();
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe('Roo Code');
  });

  it('T-MA-IDR-4: resolveAgentId with ID but no NAME throws error', async () => {
    await expect(
      resolveAgentId(storage, 'some-uuid', undefined)
    ).rejects.toThrow('THOUGHTBOX_AGENT_NAME');
  });

  it('T-MA-IDR-5: resolveAgentId with neither returns null', async () => {
    const result = await resolveAgentId(storage, undefined, undefined);
    expect(result).toBeNull();
  });

  it('T-MA-IDR-6: two sequential calls with same NAME return same agentId (stable)', async () => {
    const first = await resolveAgentId(storage, undefined, 'Stable Agent');
    const second = await resolveAgentId(storage, undefined, 'Stable Agent');

    expect(first).toBe(second);
    expect(first).not.toBeNull();
  });
});
