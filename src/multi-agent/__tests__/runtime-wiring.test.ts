/**
 * Tests for M9 — Runtime wiring: env vars → GatewayHandler, extended cipher delivery, auto-branch
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GatewayHandler, type GatewayHandlerConfig } from '../../gateway/gateway-handler.js';
import { ToolRegistry, DisclosureStage } from '../../tool-registry.js';
import { THOUGHTBOX_CIPHER } from '../../resources/thoughtbox-cipher-content.js';
import { createHubHandler } from '../../hub/hub-handler.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from '../../hub/__tests__/test-helpers.js';

// ---------------------------------------------------------------------------
// Helpers: minimal stubs for GatewayHandler dependencies
// ---------------------------------------------------------------------------

function createMinimalGatewayConfig(overrides?: Partial<GatewayHandlerConfig>): GatewayHandlerConfig {
  const toolRegistry = new ToolRegistry();
  // Advance to Stage 1 so cipher is callable
  toolRegistry.advanceToStage(DisclosureStage.STAGE_1_INIT_COMPLETE);

  return {
    toolRegistry,
    initToolHandler: {} as any,
    thoughtHandler: {
      processThought: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"thoughtNumber":1}' }],
      }),
      getCurrentSessionId: vi.fn().mockReturnValue(null),
    } as any,
    notebookHandler: {} as any,
    sessionHandler: {} as any,
    mentalModelsHandler: {} as any,
    storage: {
      getThoughts: vi.fn().mockResolvedValue([]),
      getSession: vi.fn().mockResolvedValue(null),
    } as any,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// A1/A2: GatewayHandler — env vars + cipher extension
// ---------------------------------------------------------------------------

describe('runtime-wiring: GatewayHandler', () => {
  it('T-MA-WIR-1: GatewayHandler constructed with agentId injects it into processThought', async () => {
    const processThought = vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: '{"thoughtNumber":1}' }],
    });

    const config = createMinimalGatewayConfig({
      agentId: 'agent-42',
      agentName: 'Test Agent',
      thoughtHandler: {
        processThought,
        getCurrentSessionId: vi.fn().mockReturnValue(null),
      } as any,
    });
    // Need stage 2 for thought operation
    config.toolRegistry.advanceToStage(DisclosureStage.STAGE_2_CIPHER_LOADED);

    const handler = new GatewayHandler(config);
    await handler.handle({
      operation: 'thought',
      args: { thought: 'test thought', nextThoughtNeeded: false },
    });

    expect(processThought).toHaveBeenCalledOnce();
    const callArgs = processThought.mock.calls[0][0];
    expect(callArgs.agentId).toBe('agent-42');
    expect(callArgs.agentName).toBe('Test Agent');
  });

  it('T-MA-WIR-2: GatewayHandler constructed without agentId still works (backward compat)', async () => {
    const processThought = vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: '{"thoughtNumber":1}' }],
    });

    const config = createMinimalGatewayConfig({
      thoughtHandler: {
        processThought,
        getCurrentSessionId: vi.fn().mockReturnValue(null),
      } as any,
    });
    config.toolRegistry.advanceToStage(DisclosureStage.STAGE_2_CIPHER_LOADED);

    const handler = new GatewayHandler(config);
    const result = await handler.handle({
      operation: 'thought',
      args: { thought: 'test thought', nextThoughtNeeded: false },
    });

    expect(result.isError).toBeFalsy();
    expect(processThought).toHaveBeenCalledOnce();
    const callArgs = processThought.mock.calls[0][0];
    expect(callArgs.agentId).toBeUndefined();
    expect(callArgs.agentName).toBeUndefined();
  });

  it('T-MA-WIR-3: handleCipher returns content containing ⊢ (turnstile) from logic extension', async () => {
    const config = createMinimalGatewayConfig();
    const handler = new GatewayHandler(config);

    const result = await handler.handle({ operation: 'cipher' });

    expect(result.isError).toBeFalsy();
    const text = result.content[0].type === 'text' ? result.content[0].text : '';
    expect(text).toContain('⊢');
  });

  it('T-MA-WIR-4: handleCipher returns content containing CLAIM: prefix from logic extension', async () => {
    const config = createMinimalGatewayConfig();
    const handler = new GatewayHandler(config);

    const result = await handler.handle({ operation: 'cipher' });

    const text = result.content[0].type === 'text' ? result.content[0].text : '';
    expect(text).toContain('CLAIM:');
    expect(text).toContain('PREMISE:');
    expect(text).toContain('REFUTE:');
  });

  it('T-MA-WIR-5: handleCipher still contains base cipher content (H/E/C markers)', async () => {
    const config = createMinimalGatewayConfig();
    const handler = new GatewayHandler(config);

    const result = await handler.handle({ operation: 'cipher' });

    const text = result.content[0].type === 'text' ? result.content[0].text : '';
    // Base cipher markers must be present
    for (const marker of ['H', 'E', 'C', 'Q', 'R', 'P', 'O', 'A', 'X']) {
      expect(text).toContain(`| \`${marker}\` |`);
    }
    // Logic extension symbols must also be present
    expect(text).toContain('⊨');
  });
});

// ---------------------------------------------------------------------------
// A3: Hub claim_problem auto-branch
// ---------------------------------------------------------------------------

describe('runtime-wiring: hub claim_problem auto-branch', () => {
  let hubStorage: ReturnType<typeof createInMemoryHubStorage>;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;
  let agentId: string;
  let workspaceId: string;
  let problemId: string;

  beforeEach(async () => {
    hubStorage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();

    const hubHandler = createHubHandler(hubStorage, thoughtStore);

    // Register agent
    const regResult = await hubHandler.handle(null, 'register', { name: 'Claude Alpha' }) as { agentId: string };
    agentId = regResult.agentId;

    // Create workspace
    const wsResult = await hubHandler.handle(agentId, 'create_workspace', {
      name: 'Test Workspace',
      description: 'For testing auto-branch',
    }) as { workspaceId: string };
    workspaceId = wsResult.workspaceId;

    // Create a problem
    const probResult = await hubHandler.handle(agentId, 'create_problem', {
      workspaceId,
      title: 'Test Problem',
      description: 'A problem to claim',
    }) as { problemId: string };
    problemId = probResult.problemId;
  });

  it('T-MA-WIR-6: claim_problem auto-generates branchId when not provided', async () => {
    const hubHandler = createHubHandler(hubStorage, thoughtStore);

    const result = await hubHandler.handle(agentId, 'claim_problem', {
      workspaceId,
      problemId,
      // No branchId provided — should auto-generate
    }) as { problem: any; branchId: string };

    expect(result.branchId).toBeDefined();
    expect(result.branchId).toContain('/');
    expect(result.branchId).toContain(problemId);
  });

  it('T-MA-WIR-7: claim_problem uses provided branchId when given (no override)', async () => {
    const hubHandler = createHubHandler(hubStorage, thoughtStore);

    const result = await hubHandler.handle(agentId, 'claim_problem', {
      workspaceId,
      problemId,
      branchId: 'my-custom-branch',
    }) as { problem: any; branchId: string };

    expect(result.branchId).toBe('my-custom-branch');
  });

  it('T-MA-WIR-8: auto-generated branchId follows agent-{slug}/{problemId} convention', async () => {
    const hubHandler = createHubHandler(hubStorage, thoughtStore);

    const result = await hubHandler.handle(agentId, 'claim_problem', {
      workspaceId,
      problemId,
    }) as { problem: any; branchId: string };

    // Agent name is 'Claude Alpha' → slug should be 'claude-alpha'
    expect(result.branchId).toBe(`claude-alpha/${problemId}`);
  });
});
