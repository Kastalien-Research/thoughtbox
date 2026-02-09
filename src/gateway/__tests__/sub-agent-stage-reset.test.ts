/**
 * Tests for sub-agent stage reset fix (thoughtbox-twu)
 *
 * Verifies that each MCP session gets its own disclosure stage,
 * preventing sub-agents from inheriting the parent's advanced stage.
 */

import { describe, it, expect, vi } from 'vitest';
import { GatewayHandler, type GatewayHandlerConfig } from '../gateway-handler.js';
import { DisclosureStage } from '../../tool-registry.js';

// =============================================================================
// Test Helpers
// =============================================================================

function makeConfig(overrides: Partial<GatewayHandlerConfig> = {}): GatewayHandlerConfig {
  return {
    toolRegistry: {
      getCurrentStage: () => DisclosureStage.STAGE_0_ENTRY,
      advanceToStage: () => {},
    } as any,
    initToolHandler: {
      handle: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Init complete' }],
        isError: false,
      }),
    } as any,
    thoughtHandler: {
      processThought: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Thought processed' }],
        isError: false,
      }),
      getCurrentSessionId: () => 'test-session',
    } as any,
    notebookHandler: {} as any,
    sessionHandler: {} as any,
    mentalModelsHandler: {} as any,
    storage: {} as any,
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('Sub-agent stage reset (thoughtbox-twu)', () => {
  it('new MCP session starts at Stage 0 regardless of global stage', async () => {
    const config = makeConfig({
      // Global ToolRegistry already at Stage 2 (parent advanced it)
      toolRegistry: {
        getCurrentStage: () => DisclosureStage.STAGE_2_CIPHER_LOADED,
        advanceToStage: () => {},
      } as any,
    });
    const handler = new GatewayHandler(config);

    // Sub-agent's MCP session tries to call 'thought' (requires Stage 2)
    // Without fix: would succeed because global is at Stage 2
    // With fix: should fail because 'sub-agent-session' starts at Stage 0
    const result = await handler.handle(
      { operation: 'thought', args: { thought: 'test', nextThoughtNeeded: false } },
      'sub-agent-session'
    );

    expect(result.isError).toBe(true);
    const errorText = result.content[0].type === 'text' ? (result.content[0] as any).text : '';
    const errorData = JSON.parse(errorText);
    expect(errorData.currentStage).toBe(DisclosureStage.STAGE_0_ENTRY);
    expect(errorData.requiredStage).toBe(DisclosureStage.STAGE_2_CIPHER_LOADED);
  });

  it('parent session at Stage 2 does not affect sub-agent session', async () => {
    const config = makeConfig();
    const handler = new GatewayHandler(config);

    // Advance parent session to Stage 2
    handler.setSessionStage('parent-session', DisclosureStage.STAGE_2_CIPHER_LOADED);

    // Parent can call thought
    const parentResult = await handler.handle(
      { operation: 'thought', args: { thought: 'parent thought', nextThoughtNeeded: false } },
      'parent-session'
    );
    expect(parentResult.isError).toBeFalsy();

    // Sub-agent at Stage 0 cannot call thought
    const subResult = await handler.handle(
      { operation: 'thought', args: { thought: 'sub thought', nextThoughtNeeded: false } },
      'sub-agent-session'
    );
    expect(subResult.isError).toBe(true);
  });

  it('sub-agent can progress through stages independently', async () => {
    const config = makeConfig();
    const handler = new GatewayHandler(config);

    // Advance parent to Stage 2
    handler.setSessionStage('parent-session', DisclosureStage.STAGE_2_CIPHER_LOADED);

    // Sub-agent starts at Stage 0 — can call Stage 0 operations
    const getStateResult = await handler.handle(
      { operation: 'get_state' },
      'sub-agent-session'
    );
    expect(getStateResult.isError).toBeFalsy();

    // Sub-agent calls start_new — advances to Stage 1
    const startResult = await handler.handle(
      { operation: 'start_new', args: { project: 'test' } },
      'sub-agent-session'
    );
    expect(startResult.isError).toBeFalsy();

    // Sub-agent can now call cipher (Stage 1 required)
    const cipherResult = await handler.handle(
      { operation: 'cipher' },
      'sub-agent-session'
    );
    expect(cipherResult.isError).toBeFalsy();

    // Sub-agent can now call thought (Stage 2 required, after cipher advances to Stage 2)
    const thoughtResult = await handler.handle(
      { operation: 'thought', args: { thought: 'sub-agent reasoning', nextThoughtNeeded: false } },
      'sub-agent-session'
    );
    expect(thoughtResult.isError).toBeFalsy();
  });

  it('no mcpSessionId falls back to global ToolRegistry stage (backward compat)', async () => {
    const config = makeConfig({
      toolRegistry: {
        getCurrentStage: () => DisclosureStage.STAGE_2_CIPHER_LOADED,
        advanceToStage: () => {},
      } as any,
    });
    const handler = new GatewayHandler(config);

    // No session ID — uses global stage (Stage 2)
    const result = await handler.handle(
      { operation: 'thought', args: { thought: 'test', nextThoughtNeeded: false } },
    );
    expect(result.isError).toBeFalsy();
  });

  it('clearSession removes per-session stage', async () => {
    const config = makeConfig();
    const handler = new GatewayHandler(config);

    // Set session to Stage 2
    handler.setSessionStage('test-session', DisclosureStage.STAGE_2_CIPHER_LOADED);

    // Can call thought
    const before = await handler.handle(
      { operation: 'thought', args: { thought: 'test', nextThoughtNeeded: false } },
      'test-session'
    );
    expect(before.isError).toBeFalsy();

    // Clear session
    handler.clearSession('test-session');

    // Session is now back at Stage 0
    const after = await handler.handle(
      { operation: 'thought', args: { thought: 'test', nextThoughtNeeded: false } },
      'test-session'
    );
    expect(after.isError).toBe(true);
  });

  it('multiple sub-agents have independent stage progression', async () => {
    const config = makeConfig();
    const handler = new GatewayHandler(config);

    // Sub-agent A advances to Stage 1
    handler.setSessionStage('sub-a', DisclosureStage.STAGE_1_INIT_COMPLETE);

    // Sub-agent B is still at Stage 0
    // Sub-agent A can call cipher (Stage 1)
    const cipherA = await handler.handle({ operation: 'cipher' }, 'sub-a');
    expect(cipherA.isError).toBeFalsy();

    // Sub-agent B cannot call cipher (still at Stage 0)
    const cipherB = await handler.handle({ operation: 'cipher' }, 'sub-b');
    expect(cipherB.isError).toBe(true);
  });

  it('stage error message tells sub-agent to start progressive disclosure', async () => {
    const config = makeConfig();
    const handler = new GatewayHandler(config);

    const result = await handler.handle(
      { operation: 'thought', args: { thought: 'test', nextThoughtNeeded: false } },
      'new-sub-agent'
    );

    expect(result.isError).toBe(true);
    const errorText = result.content[0].type === 'text' ? (result.content[0] as any).text : '';
    const errorData = JSON.parse(errorText);

    // Error should suggest starting the init workflow
    expect(errorData.suggestion).toContain('start_new');
    expect(errorData.availableOperations).toContain('get_state');
  });
});
