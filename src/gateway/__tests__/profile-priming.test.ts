/**
 * Tests for profile priming bug fix (thoughtbox-308)
 *
 * Profile priming should only be appended to the FIRST thought response
 * per agent session, not to every thought response.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GatewayHandler } from '../gateway-handler.js';
import { ToolRegistry, DisclosureStage } from '../../tool-registry.js';

// Minimal mock types
function createMockToolRegistry(): ToolRegistry {
  let stage = DisclosureStage.STAGE_2_CIPHER_LOADED;
  return {
    getCurrentStage: () => stage,
    advanceToStage: (s: DisclosureStage) => { stage = s; },
  } as any;
}

function createMockThoughtHandler() {
  let callCount = 0;
  return {
    processThought: vi.fn(async () => {
      callCount++;
      return {
        content: [{ type: 'text' as const, text: `Thought ${callCount} processed` }],
        isError: false,
      };
    }),
    getCurrentSessionId: () => 'test-session',
    restoreFromSession: vi.fn(),
  };
}

describe('Profile priming once-per-session', () => {
  let handler: GatewayHandler;
  let mockThoughtHandler: ReturnType<typeof createMockThoughtHandler>;
  let getAgentProfileFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockThoughtHandler = createMockThoughtHandler();
    getAgentProfileFn = vi.fn(async () => 'ARCHITECT');

    handler = new GatewayHandler({
      toolRegistry: createMockToolRegistry(),
      initToolHandler: {} as any,
      thoughtHandler: mockThoughtHandler as any,
      notebookHandler: {} as any,
      sessionHandler: {} as any,
      mentalModelsHandler: {} as any,
      storage: {} as any,
      agentId: 'agent-1',
      agentName: 'Test Agent',
      getAgentProfile: getAgentProfileFn,
    });
  });

  it('includes priming on first thought', async () => {
    const result = await handler.handle(
      { operation: 'thought', args: { thought: 'First thought', nextThoughtNeeded: false } },
      'session-1'
    );

    // Should have text content + profile priming resource
    const hasResource = result.content.some(c => c.type === 'resource');
    expect(hasResource).toBe(true);
  });

  it('does NOT include priming on second thought for same session', async () => {
    // First call — priming included
    await handler.handle(
      { operation: 'thought', args: { thought: 'First thought', nextThoughtNeeded: true } },
      'session-1'
    );

    // Second call — priming should NOT be included
    const result2 = await handler.handle(
      { operation: 'thought', args: { thought: 'Second thought', nextThoughtNeeded: false } },
      'session-1'
    );

    const hasResource = result2.content.some(c => c.type === 'resource');
    expect(hasResource).toBe(false);
  });

  it('includes priming for different sessions independently', async () => {
    // Session 1 first call — priming included
    const r1 = await handler.handle(
      { operation: 'thought', args: { thought: 'S1 first', nextThoughtNeeded: false } },
      'session-1'
    );
    expect(r1.content.some(c => c.type === 'resource')).toBe(true);

    // Session 2 first call — priming also included (different session)
    const r2 = await handler.handle(
      { operation: 'thought', args: { thought: 'S2 first', nextThoughtNeeded: false } },
      'session-2'
    );
    expect(r2.content.some(c => c.type === 'resource')).toBe(true);
  });

  it('does not include priming when no profile is set', async () => {
    getAgentProfileFn.mockResolvedValue(undefined);

    const result = await handler.handle(
      { operation: 'thought', args: { thought: 'No profile', nextThoughtNeeded: false } },
      'session-1'
    );

    const hasResource = result.content.some(c => c.type === 'resource');
    expect(hasResource).toBe(false);
  });
});
