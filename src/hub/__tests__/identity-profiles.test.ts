/**
 * Identity Profiles Tests — SPEC-HUB-002 Module 3
 *
 * Tests that identity module register/whoami/getAgent correctly handle
 * the optional profile field, with backward compatibility.
 */

import { describe, it, expect } from 'vitest';
import { createIdentityManager } from '../identity.js';
import { createInMemoryHubStorage } from './test-helpers.js';

describe('identity-profiles', () => {
  // T-IP-1: register with valid profile stores profile
  it('register with valid profile stores profile', async () => {
    const storage = createInMemoryHubStorage();
    const identity = createIdentityManager(storage);

    const result = await identity.register({ name: 'TestAgent', profile: 'COORDINATOR' });

    expect(result.agentId).toBeDefined();
    expect(result.name).toBe('TestAgent');

    // Verify profile was stored
    const agent = await storage.getAgent(result.agentId);
    expect(agent).not.toBeNull();
    expect(agent!.profile).toBe('COORDINATOR');
  });

  // T-IP-2: register without profile works unchanged (backward compat)
  it('register without profile works unchanged', async () => {
    const storage = createInMemoryHubStorage();
    const identity = createIdentityManager(storage);

    const result = await identity.register({ name: 'PlainAgent' });

    expect(result.agentId).toBeDefined();
    expect(result.name).toBe('PlainAgent');

    const agent = await storage.getAgent(result.agentId);
    expect(agent).not.toBeNull();
    expect(agent!.profile).toBeUndefined();
  });

  // T-IP-3: register with invalid profile throws error
  it('register with invalid profile throws error', async () => {
    const storage = createInMemoryHubStorage();
    const identity = createIdentityManager(storage);

    await expect(
      identity.register({ name: 'BadAgent', profile: 'NONEXISTENT' })
    ).rejects.toThrow(/invalid profile/i);
  });

  // T-IP-4: whoami returns profile + mentalModels when profiled
  it('whoami returns profile and mentalModels when profiled', async () => {
    const storage = createInMemoryHubStorage();
    const identity = createIdentityManager(storage);

    const { agentId } = await identity.register({ name: 'Debugger', profile: 'DEBUGGER' });
    const info = await identity.whoami(agentId);

    expect(info.profile).toBe('DEBUGGER');
    expect(info.mentalModels).toBeDefined();
    expect(info.mentalModels).toContain('five-whys');
    expect(info.mentalModels).toContain('rubber-duck');
    expect(info.mentalModels).toContain('assumption-surfacing');
  });

  // T-IP-5: whoami returns no profile when not set (backward compat)
  it('whoami returns no profile when not set', async () => {
    const storage = createInMemoryHubStorage();
    const identity = createIdentityManager(storage);

    const { agentId } = await identity.register({ name: 'NoProfile' });
    const info = await identity.whoami(agentId);

    expect(info.profile).toBeUndefined();
    expect(info.mentalModels).toBeUndefined();
  });

  // T-IP-6: getAgent preserves profile through storage round-trip
  it('getAgent preserves profile through storage round-trip', async () => {
    const storage = createInMemoryHubStorage();
    const identity = createIdentityManager(storage);

    const { agentId } = await identity.register({ name: 'Architect', profile: 'ARCHITECT' });
    const agent = await identity.getAgent(agentId);

    expect(agent).not.toBeNull();
    expect(agent!.profile).toBe('ARCHITECT');
    expect(agent!.name).toBe('Architect');
  });

  // T-IP-7: register with manager: true stores the flag
  it('register with manager: true stores the flag', async () => {
    const storage = createInMemoryHubStorage();
    const identity = createIdentityManager(storage);

    const { agentId } = await identity.register({ name: 'LeadArch', profile: 'ARCHITECT', manager: true });
    const agent = await storage.getAgent(agentId);

    expect(agent).not.toBeNull();
    expect(agent!.profile).toBe('ARCHITECT');
    expect(agent!.manager).toBe(true);
  });

  // T-IP-8: whoami returns manager flag when set
  it('whoami returns manager flag when set', async () => {
    const storage = createInMemoryHubStorage();
    const identity = createIdentityManager(storage);

    const { agentId } = await identity.register({ name: 'LeadDebug', profile: 'DEBUGGER', manager: true });
    const info = await identity.whoami(agentId);

    expect(info.profile).toBe('DEBUGGER');
    expect(info.manager).toBe(true);
    expect(info.mentalModels).toContain('five-whys');
  });

  // T-IP-9: register without manager flag — backward compat
  it('register without manager flag keeps it undefined', async () => {
    const storage = createInMemoryHubStorage();
    const identity = createIdentityManager(storage);

    const { agentId } = await identity.register({ name: 'PlainAgent2' });
    const agent = await storage.getAgent(agentId);
    const info = await identity.whoami(agentId);

    expect(agent!.manager).toBeUndefined();
    expect(info.manager).toBeUndefined();
  });
});
