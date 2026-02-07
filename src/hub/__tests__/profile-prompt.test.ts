/**
 * Profile Prompt Tests — SPEC-HUB-002 Module 4
 *
 * Tests the get_profile_prompt hub operation which returns the full prompt
 * content for a profile, including mental model contents.
 */

import { describe, it, expect } from 'vitest';
import { createHubHandler } from '../hub-handler.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';

describe('profile-prompt', () => {
  function setup() {
    const storage = createInMemoryHubStorage();
    const thoughtStore = createInMemoryThoughtStore();
    const handler = createHubHandler(storage, thoughtStore);
    return { storage, thoughtStore, handler };
  }

  async function registerAgent(handler: any, name: string) {
    const result = await handler.handle(null, 'register', { name }) as { agentId: string };
    return result.agentId;
  }

  // T-PP-1: get_profile_prompt returns MANAGER prompt with model contents
  it('get_profile_prompt returns MANAGER prompt with model contents', async () => {
    const { handler } = setup();
    const agentId = await registerAgent(handler, 'TestAgent');

    const result = await handler.handle(agentId, 'get_profile_prompt', { profile: 'MANAGER' }) as any;

    expect(result.prompt).toBeDefined();
    expect(result.prompt).toContain('MANAGER');
    expect(result.prompt).toContain('Decomposition');
    expect(result.prompt).toContain('Pre-mortem');
    expect(result.prompt).toContain('Five Whys');
    expect(result.modelNames).toBeDefined();
    expect(result.modelNames).toContain('decomposition');
    expect(result.modelNames).toContain('pre-mortem');
    expect(result.modelNames).toContain('five-whys');
  });

  // T-PP-2: get_profile_prompt returns ARCHITECT prompt
  it('get_profile_prompt returns ARCHITECT prompt', async () => {
    const { handler } = setup();
    const agentId = await registerAgent(handler, 'TestAgent');

    const result = await handler.handle(agentId, 'get_profile_prompt', { profile: 'ARCHITECT' }) as any;

    expect(result.prompt).toContain('ARCHITECT');
    expect(result.modelNames).toContain('decomposition');
    expect(result.modelNames).toContain('trade-off-matrix');
    expect(result.modelNames).toContain('abstraction-laddering');
  });

  // T-PP-3: get_profile_prompt for unknown profile returns error with available profiles
  it('get_profile_prompt for unknown profile returns error', async () => {
    const { handler } = setup();
    const agentId = await registerAgent(handler, 'TestAgent');

    await expect(
      handler.handle(agentId, 'get_profile_prompt', { profile: 'NONEXISTENT' })
    ).rejects.toThrow(/unknown profile/i);
  });

  // T-PP-4: Response includes model names metadata
  it('response includes model names metadata', async () => {
    const { handler } = setup();
    const agentId = await registerAgent(handler, 'TestAgent');

    const result = await handler.handle(agentId, 'get_profile_prompt', { profile: 'SECURITY' }) as any;

    expect(result.modelNames).toEqual(['adversarial-thinking', 'pre-mortem']);
  });

  // T-PP-5: Missing profile arg returns helpful error
  it('missing profile arg returns helpful error', async () => {
    const { handler } = setup();
    const agentId = await registerAgent(handler, 'TestAgent');

    await expect(
      handler.handle(agentId, 'get_profile_prompt', {})
    ).rejects.toThrow(/profile.*required/i);
  });
});
