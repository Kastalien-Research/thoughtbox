import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThoughtTool } from '../../thought/tool.js';
import { InitTool } from '../../init/tool.js';
import { THOUGHTBOX_CIPHER } from '../../resources/thoughtbox-cipher-content.js';
import { getExtendedCipher } from '../../multi-agent/cipher-extension.js';
import { createHubHandler } from '../../hub/hub-handler.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from '../../hub/__tests__/test-helpers.js';

// ---------------------------------------------------------------------------
// A1/A2: Explicit Tools — config injection + cipher extension
// ---------------------------------------------------------------------------

describe('runtime-wiring: Explicit Tools', () => {
  it('T-MA-WIR-1: ThoughtTool constructed with config agentId injects it into processThought', async () => {
    const processThought = vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: '{"thoughtNumber":1}' }],
    });

    const handler = {
      processThought,
      getCurrentSessionId: vi.fn().mockReturnValue(null),
    } as any;

    const tool = new ThoughtTool(handler, {
      agentId: 'agent-42',
      agentName: 'Test Agent',
    });

    await tool.handle({
      thought: 'test thought', nextThoughtNeeded: false, thoughtType: 'reasoning'
    } as any);

    expect(processThought).toHaveBeenCalledOnce();
    const callArgs = processThought.mock.calls[0][0];
    expect(callArgs.agentId).toBe('agent-42');
    expect(callArgs.agentName).toBe('Test Agent');
  });

  it('T-MA-WIR-2: ThoughtTool constructed without config still works (backward compat)', async () => {
    const processThought = vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: '{"thoughtNumber":1}' }],
    });

    const handler = {
      processThought,
      getCurrentSessionId: vi.fn().mockReturnValue(null),
    } as any;

    const tool = new ThoughtTool(handler);
    const result = await tool.handle({
      thought: 'test thought', nextThoughtNeeded: false, thoughtType: 'reasoning'
    } as any);

    expect(result).toBeDefined();
    expect(processThought).toHaveBeenCalledOnce();
    const callArgs = processThought.mock.calls[0][0];
    expect(callArgs.agentId).toBeUndefined();
    expect(callArgs.agentName).toBeUndefined();
  });

  it('T-MA-WIR-3: handleCipher returns content containing ⊢ (turnstile) from logic extension', async () => {
    const cipherHandler = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: getExtendedCipher(THOUGHTBOX_CIPHER) }] });
    const tool = new InitTool({} as any, cipherHandler);

    const result = await tool.handle({ operation: 'cipher' });

    expect(result.isError).toBeFalsy();
    const text = result.content[0].type === 'text' ? result.content[0].text : '';
    expect(text).toContain('⊢');
  });

  it('T-MA-WIR-4: handleCipher returns content containing CLAIM: prefix from logic extension', async () => {
    const cipherHandler = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: getExtendedCipher(THOUGHTBOX_CIPHER) }] });
    const tool = new InitTool({} as any, cipherHandler);

    const result = await tool.handle({ operation: 'cipher' });

    const text = result.content[0].type === 'text' ? result.content[0].text : '';
    expect(text).toContain('CLAIM:');
    expect(text).toContain('PREMISE:');
    expect(text).toContain('REFUTE:');
  });

  it('T-MA-WIR-5: handleCipher still contains base cipher content (H/E/C markers)', async () => {
    const cipherHandler = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: getExtendedCipher(THOUGHTBOX_CIPHER) }] });
    const tool = new InitTool({} as any, cipherHandler);

    const result = await tool.handle({ operation: 'cipher' });

    const text = result.content[0].type === 'text' ? result.content[0].text : '';
    // Base cipher markers must be present
    for (const marker of ['H', 'E', 'C', 'Q', 'R', 'P', 'X']) {
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
      // No branchId provided -- should auto-generate
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

    // Agent name is 'Claude Alpha' -> slug should be 'claude-alpha'
    expect(result.branchId).toBe(`claude-alpha/${problemId}`);
  });
});
