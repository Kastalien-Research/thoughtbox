/**
 * ADR-011: First-call-only schema embedding tests
 *
 * Verifies that operation schemas are embedded in responses only on the
 * first call per operation per session, and cleaned up on session clear.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GatewayHandler } from '../gateway-handler.js';

function createHandler(): GatewayHandler {
  return new GatewayHandler({
    toolRegistry: {
      getCurrentStage: () => 'STAGE_0_ENTRY',
      advanceToStage: () => {},
    } as any,
    initToolHandler: {
      handle: async () => ({
        content: [{ type: 'text', text: '{"status":"ok"}' }],
      }),
    } as any,
    thoughtHandler: {} as any,
    notebookHandler: {} as any,
    sessionHandler: {} as any,
    mentalModelsHandler: {} as any,
    storage: {} as any,
  });
}

function getResourceBlocks(result: any): any[] {
  return result.content.filter(
    (b: any) => b.type === 'resource'
      && b.resource?.uri?.includes('/operations/')
  );
}

describe('ADR-011: First-call-only schema embedding', () => {
  let handler: GatewayHandler;

  beforeEach(() => {
    handler = createHandler();
  });

  it('first call to an operation includes schema resource block', async () => {
    const result = await handler.handle(
      { operation: 'get_state', args: {} },
      'session-1'
    );

    const resources = getResourceBlocks(result);
    expect(resources.length).toBeGreaterThan(0);
    expect(resources[0].resource.uri).toContain('operations/get_state');
  });

  it('second call to same operation omits schema resource block', async () => {
    await handler.handle(
      { operation: 'get_state', args: {} },
      'session-1'
    );

    const result2 = await handler.handle(
      { operation: 'get_state', args: {} },
      'session-1'
    );

    const resources = getResourceBlocks(result2);
    expect(resources.length).toBe(0);
  });

  it('different operation in same session includes its schema on first call', async () => {
    await handler.handle(
      { operation: 'get_state', args: {} },
      'session-1'
    );

    const result2 = await handler.handle(
      { operation: 'list_sessions', args: {} },
      'session-1'
    );

    const resources = getResourceBlocks(result2);
    expect(resources.length).toBeGreaterThan(0);
    expect(resources[0].resource.uri).toContain('operations/list_sessions');
  });

  it('clearSession removes the session schemas-seen entry', async () => {
    await handler.handle(
      { operation: 'get_state', args: {} },
      'session-1'
    );

    handler.clearSession('session-1');

    const result = await handler.handle(
      { operation: 'get_state', args: {} },
      'session-1'
    );

    const resources = getResourceBlocks(result);
    expect(resources.length).toBeGreaterThan(0);
  });

  it('different sessions track schemas independently', async () => {
    await handler.handle(
      { operation: 'get_state', args: {} },
      'session-1'
    );

    const result = await handler.handle(
      { operation: 'get_state', args: {} },
      'session-2'
    );

    const resources = getResourceBlocks(result);
    expect(resources.length).toBeGreaterThan(0);
  });
});
