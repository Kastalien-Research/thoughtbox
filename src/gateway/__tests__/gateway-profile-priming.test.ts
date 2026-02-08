/**
 * Gateway Profile Priming Tests — SPEC-HUB-002
 *
 * Verifies that GatewayHandler appends profile priming resource blocks
 * to thought responses when the agent has a registered profile.
 */

import { describe, it, expect, vi } from 'vitest';
import { GatewayHandler, type GatewayHandlerConfig } from '../gateway-handler.js';
import { DisclosureStage } from '../../tool-registry.js';

/** Helper: build a minimal GatewayHandlerConfig with overrides */
function makeConfig(overrides: Partial<GatewayHandlerConfig> = {}): GatewayHandlerConfig {
  return {
    toolRegistry: {
      getCurrentStage: () => DisclosureStage.STAGE_2_CIPHER_LOADED,
      advanceToStage: () => {},
    } as any,
    initToolHandler: {} as any,
    thoughtHandler: {
      processThought: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Thought recorded (1/5)' }],
        isError: false,
      }),
      getCurrentSessionId: () => null,
    } as any,
    notebookHandler: {} as any,
    sessionHandler: {} as any,
    mentalModelsHandler: {} as any,
    storage: {} as any,
    agentId: 'agent-1',
    ...overrides,
  };
}

describe('GatewayHandler — Profile Priming', () => {
  it('T-GP-1: handleThought appends profile resource for profiled agent', async () => {
    const config = makeConfig({
      getAgentProfile: vi.fn().mockResolvedValue('DEBUGGER'),
    });
    const handler = new GatewayHandler(config);

    const result = await handler.handle(
      { operation: 'thought', args: { thought: 'test', nextThoughtNeeded: false } },
      'sess-1',
    );

    expect(result.isError).toBeFalsy();
    // Should have profile priming resource block
    const primingBlock = result.content.find(
      (c: any) => c.type === 'resource' && c.resource?.uri?.startsWith('thoughtbox://profile-priming/')
    ) as any;
    expect(primingBlock).toBeDefined();
    expect(primingBlock.resource.uri).toBe('thoughtbox://profile-priming/DEBUGGER');
  });

  it('T-GP-2: handleThought does NOT append resource for unprofiled agent', async () => {
    const config = makeConfig({
      getAgentProfile: vi.fn().mockResolvedValue(undefined),
    });
    const handler = new GatewayHandler(config);

    const result = await handler.handle(
      { operation: 'thought', args: { thought: 'test', nextThoughtNeeded: false } },
      'sess-1',
    );

    expect(result.isError).toBeFalsy();
    // Should NOT have profile priming resource (may have operation catalog resource)
    const hasPrimingResource = result.content.some(
      (c: any) => c.type === 'resource' && c.resource?.uri?.startsWith('thoughtbox://profile-priming/')
    );
    expect(hasPrimingResource).toBe(false);
  });

  it('T-GP-3: handleThought works when getAgentProfile callback is undefined', async () => {
    // No getAgentProfile in config — backward compatibility
    const config = makeConfig();
    const handler = new GatewayHandler(config);

    const result = await handler.handle(
      { operation: 'thought', args: { thought: 'test', nextThoughtNeeded: false } },
      'sess-1',
    );

    expect(result.isError).toBeFalsy();
    // Should NOT have profile priming resource
    const hasPrimingResource = result.content.some(
      (c: any) => c.type === 'resource' && c.resource?.uri?.startsWith('thoughtbox://profile-priming/')
    );
    expect(hasPrimingResource).toBe(false);
  });

  it('T-GP-4: profile resource has correct annotations', async () => {
    const config = makeConfig({
      getAgentProfile: vi.fn().mockResolvedValue('MANAGER'),
    });
    const handler = new GatewayHandler(config);

    const result = await handler.handle(
      { operation: 'thought', args: { thought: 'test', nextThoughtNeeded: false } },
      'sess-1',
    );

    const resourceBlock = result.content[1] as any;
    expect(resourceBlock.resource.annotations).toEqual({
      audience: ['assistant'],
      priority: 0.8,
    });
  });

  it('T-GP-5: profile resource is appended AFTER thought content', async () => {
    const config = makeConfig({
      getAgentProfile: vi.fn().mockResolvedValue('ARCHITECT'),
    });
    const handler = new GatewayHandler(config);

    const result = await handler.handle(
      { operation: 'thought', args: { thought: 'test', nextThoughtNeeded: false } },
      'sess-1',
    );

    // First block is the thought text, last is the profile resource
    expect(result.content[0].type).toBe('text');
    expect(result.content[result.content.length - 1].type).toBe('resource');
  });

  it('T-GP-6: handleThought error result does NOT get profile appended', async () => {
    const config = makeConfig({
      getAgentProfile: vi.fn().mockResolvedValue('DEBUGGER'),
      thoughtHandler: {
        processThought: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Error: something went wrong' }],
          isError: true,
        }),
        getCurrentSessionId: () => null,
      } as any,
    });
    const handler = new GatewayHandler(config);

    const result = await handler.handle(
      { operation: 'thought', args: { thought: 'test', nextThoughtNeeded: false } },
      'sess-1',
    );

    expect(result.isError).toBe(true);
    // Error results should NOT get profile appended
    expect(result.content.length).toBe(1);
    // Callback should not have been called for error results
    expect(config.getAgentProfile).not.toHaveBeenCalled();
  });
});
