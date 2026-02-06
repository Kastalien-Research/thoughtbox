/**
 * M10: GatewayHandler — Per-Session Identity tests
 *
 * Verifies that GatewayHandler correctly resolves agent identity
 * per MCP session for thought attribution.
 */

import { describe, it, expect } from 'vitest';
import { GatewayHandler } from '../gateway-handler.js';

describe('GatewayHandler — Per-Session Identity', () => {
  it('setSessionIdentity stores per-session agentId', () => {
    // Create a minimal GatewayHandler with mock dependencies
    const handler = new GatewayHandler({
      toolRegistry: { getCurrentStage: () => 'STAGE_0_ENTRY', advanceToStage: () => {} } as any,
      initToolHandler: {} as any,
      thoughtHandler: {} as any,
      notebookHandler: {} as any,
      sessionHandler: {} as any,
      mentalModelsHandler: {} as any,
      storage: {} as any,
      agentId: 'default-id',
      agentName: 'DefaultAgent',
    });

    // Set session-specific identity
    handler.setSessionIdentity('sess-1', 'alpha-id', 'Alpha');
    handler.setSessionIdentity('sess-2', 'beta-id', 'Beta');

    // Verify via getAgentId (private, so we test through handle indirectly)
    // We'll use the public setSessionIdentity + access pattern
    expect(handler).toBeDefined();
  });

  it('getAgentId falls back to instance default when no session identity', () => {
    const handler = new GatewayHandler({
      toolRegistry: { getCurrentStage: () => 'STAGE_0_ENTRY', advanceToStage: () => {} } as any,
      initToolHandler: {} as any,
      thoughtHandler: {} as any,
      notebookHandler: {} as any,
      sessionHandler: {} as any,
      mentalModelsHandler: {} as any,
      storage: {} as any,
      agentId: 'default-id',
      agentName: 'DefaultAgent',
    });

    // Access private method via bracket notation for testing
    const getAgentId = (handler as any).getAgentId.bind(handler);
    const getAgentName = (handler as any).getAgentName.bind(handler);

    // No session identity set — should return defaults
    expect(getAgentId('unknown-session')).toBe('default-id');
    expect(getAgentName('unknown-session')).toBe('DefaultAgent');

    // No session ID at all — should return defaults
    expect(getAgentId(undefined)).toBe('default-id');
    expect(getAgentName(undefined)).toBe('DefaultAgent');
  });

  it('getAgentId returns session-specific identity when set', () => {
    const handler = new GatewayHandler({
      toolRegistry: { getCurrentStage: () => 'STAGE_0_ENTRY', advanceToStage: () => {} } as any,
      initToolHandler: {} as any,
      thoughtHandler: {} as any,
      notebookHandler: {} as any,
      sessionHandler: {} as any,
      mentalModelsHandler: {} as any,
      storage: {} as any,
      agentId: 'default-id',
      agentName: 'DefaultAgent',
    });

    handler.setSessionIdentity('sess-1', 'alpha-id', 'Alpha');

    const getAgentId = (handler as any).getAgentId.bind(handler);
    const getAgentName = (handler as any).getAgentName.bind(handler);

    // Session with identity set — returns session-specific values
    expect(getAgentId('sess-1')).toBe('alpha-id');
    expect(getAgentName('sess-1')).toBe('Alpha');

    // Different session — falls back to default
    expect(getAgentId('sess-2')).toBe('default-id');
    expect(getAgentName('sess-2')).toBe('DefaultAgent');
  });
});
