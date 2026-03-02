/**
 * AUDIT-002: Query Operations for Audit Filtering
 * Tests thoughtType/confidence filters on read_thoughts and
 * audit_summary analysis type on deep_analysis.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ThoughtHandler } from '../../thought-handler.js';
import { InMemoryStorage } from '../../persistence/index.js';
import { GatewayHandler } from '../gateway-handler.js';
import { ToolRegistry, DisclosureStage } from '../../tool-registry.js';

describe('AUDIT-002: Query Operations', () => {
  let thoughtHandler: ThoughtHandler;
  let storage: InMemoryStorage;
  let gateway: GatewayHandler;
  const mcpSessionId = 'test-session';

  beforeEach(async () => {
    storage = new InMemoryStorage();
    thoughtHandler = new ThoughtHandler(true, storage);
    await thoughtHandler.initialize();

    const toolRegistry = new ToolRegistry();
    gateway = new GatewayHandler({
      toolRegistry,
      initToolHandler: {} as any,
      thoughtHandler,
      notebookHandler: {} as any,
      sessionHandler: {} as any,
      mentalModelsHandler: {} as any,
      storage,
    });
    gateway.setSessionStage(
      mcpSessionId,
      DisclosureStage.STAGE_2_CIPHER_LOADED
    );
  });

  async function submitThought(
    args: Record<string, unknown>
  ) {
    return gateway.handle(
      { operation: 'thought', args },
      mcpSessionId
    );
  }

  async function submitMixedSequence() {
    await submitThought({
      thought: 'Reasoning 1',
      thoughtType: 'reasoning',
      nextThoughtNeeded: true,
    });
    await submitThought({
      thought: 'Decision 1',
      thoughtType: 'decision_frame',
      nextThoughtNeeded: true,
      confidence: 'high',
      options: [{ label: 'A', selected: true }],
    });
    await submitThought({
      thought: 'Action 1',
      thoughtType: 'action_report',
      nextThoughtNeeded: true,
      actionResult: {
        success: true,
        reversible: 'yes',
        tool: 'test',
        target: 'staging',
      },
    });
    await submitThought({
      thought: 'Decision 2',
      thoughtType: 'decision_frame',
      nextThoughtNeeded: true,
      confidence: 'low',
      options: [{ label: 'B', selected: true }],
    });
    await submitThought({
      thought: 'Reasoning 2',
      thoughtType: 'reasoning',
      nextThoughtNeeded: true,
    });
  }

  it('filters read_thoughts by thoughtType', async () => {
    await submitMixedSequence();
    const result = await gateway.handle(
      {
        operation: 'read_thoughts',
        args: { thoughtType: 'decision_frame' },
      },
      mcpSessionId
    );
    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBe(2);
    expect(data.filter.thoughtType).toBe('decision_frame');
    expect(data.totalUnfiltered).toBe(5);
  });

  it('filters read_thoughts by confidence', async () => {
    await submitMixedSequence();
    const result = await gateway.handle(
      {
        operation: 'read_thoughts',
        args: { confidence: 'low' },
      },
      mcpSessionId
    );
    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBe(1);
    expect(data.thoughts[0].confidence).toBe('low');
  });

  it('rejects confidence + non-decision_frame thoughtType', async () => {
    await submitMixedSequence();
    const result = await gateway.handle(
      {
        operation: 'read_thoughts',
        args: {
          thoughtType: 'action_report',
          confidence: 'low',
        },
      },
      mcpSessionId
    );
    expect(result.isError).toBe(true);
    const data = JSON.parse(result.content[0].text);
    expect(data.error).toContain('confidence');
  });

  it('returns empty array when no matches', async () => {
    await submitMixedSequence();
    const result = await gateway.handle(
      {
        operation: 'read_thoughts',
        args: { thoughtType: 'belief_snapshot' },
      },
      mcpSessionId
    );
    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBe(0);
    expect(data.thoughts).toHaveLength(0);
  });

  it('combines thoughtType filter with last parameter', async () => {
    await submitMixedSequence();
    const result = await gateway.handle(
      {
        operation: 'read_thoughts',
        args: { thoughtType: 'reasoning', last: 3 },
      },
      mcpSessionId
    );
    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBeLessThanOrEqual(3);
    for (const t of data.thoughts) {
      expect(t.thoughtType).toBe('reasoning');
    }
  });

  it('includes structured fields in read_thoughts response', async () => {
    await submitThought({
      thought: 'Decision',
      thoughtType: 'decision_frame',
      nextThoughtNeeded: true,
      confidence: 'medium',
      options: [
        { label: 'X', selected: true, reason: 'best' },
      ],
    });
    const result = await gateway.handle(
      {
        operation: 'read_thoughts',
        args: { last: 1 },
      },
      mcpSessionId
    );
    const data = JSON.parse(result.content[0].text);
    expect(data.thoughts[0].confidence).toBe('medium');
    expect(data.thoughts[0].options).toBeDefined();
    expect(data.thoughts[0].options[0].label).toBe('X');
  });

  it('audit_summary via deep_analysis returns correct aggregation', async () => {
    await submitMixedSequence();
    const sessionId = thoughtHandler.getCurrentSessionId()!;

    const result = await gateway.handle(
      {
        operation: 'deep_analysis',
        args: {
          sessionId,
          analysisType: 'audit_summary',
        },
      },
      mcpSessionId
    );
    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.analysisType).toBe('audit_summary');
    expect(data.thoughtCounts.total).toBe(5);
    expect(data.thoughtCounts.decision_frame).toBe(2);
    expect(data.thoughtCounts.action_report).toBe(1);
    expect(data.thoughtCounts.reasoning).toBe(2);
    expect(data.decisions.total).toBe(2);
    expect(data.decisions.byConfidence.high).toBe(1);
    expect(data.decisions.byConfidence.low).toBe(1);
    expect(data.actions.successful).toBe(1);
  });
});
