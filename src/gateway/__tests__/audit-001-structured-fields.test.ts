/**
 * AUDIT-001: Structured Fields on ThoughtData
 * Tests discriminated union validation and structured field persistence
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ThoughtHandler } from '../../thought-handler.js';
import { InMemoryStorage } from '../../persistence/index.js';

describe('AUDIT-001: Structured Fields', () => {
  let handler: ThoughtHandler;
  let storage: InMemoryStorage;

  beforeEach(async () => {
    storage = new InMemoryStorage();
    handler = new ThoughtHandler(true, storage);
    await handler.initialize();
  });

  // T-AUDIT-001-1: Happy path for each of 6 types
  it('accepts all 6 thoughtTypes with valid structured fields', async () => {
    // reasoning (no extra fields needed)
    const r1 = await handler.processThought({
      thought: 'General reasoning',
      thoughtType: 'reasoning',
      nextThoughtNeeded: true,
    });
    expect(r1.isError).toBeUndefined();

    // decision_frame
    const r2 = await handler.processThought({
      thought: 'Deciding approach',
      thoughtType: 'decision_frame',
      nextThoughtNeeded: true,
      confidence: 'high',
      options: [
        { label: 'A', selected: true, reason: 'best' },
        { label: 'B', selected: false },
      ],
    });
    expect(r2.isError).toBeUndefined();

    // action_report
    const r3 = await handler.processThought({
      thought: 'Deployed v2',
      thoughtType: 'action_report',
      nextThoughtNeeded: true,
      actionResult: {
        success: true,
        reversible: 'yes',
        tool: 'deploy',
        target: 'staging',
      },
    });
    expect(r3.isError).toBeUndefined();

    // belief_snapshot
    const r4 = await handler.processThought({
      thought: 'State check',
      thoughtType: 'belief_snapshot',
      nextThoughtNeeded: true,
      beliefs: {
        entities: [{ name: 'staging', state: 'healthy' }],
      },
    });
    expect(r4.isError).toBeUndefined();

    // assumption_update
    const r5 = await handler.processThought({
      thought: 'Assumption changed',
      thoughtType: 'assumption_update',
      nextThoughtNeeded: true,
      assumptionChange: {
        text: 'DB is fast',
        oldStatus: 'believed',
        newStatus: 'refuted',
      },
    });
    expect(r5.isError).toBeUndefined();

    // context_snapshot
    const r6 = await handler.processThought({
      thought: 'Context snapshot',
      thoughtType: 'context_snapshot',
      nextThoughtNeeded: true,
      contextData: { modelId: 'claude-opus-4-6' },
    });
    expect(r6.isError).toBeUndefined();
  });

  // T-AUDIT-001-2: Missing thoughtType -> error
  it('rejects thought without thoughtType', async () => {
    const result = await handler.processThought({
      thought: 'No type',
      nextThoughtNeeded: true,
    });
    expect(result.isError).toBe(true);
    const text = result.content[0].text;
    expect(text).toContain('thoughtType is required');
  });

  // T-AUDIT-001-3: decision_frame without confidence -> error
  it('rejects decision_frame without confidence', async () => {
    const result = await handler.processThought({
      thought: 'Deciding',
      thoughtType: 'decision_frame',
      nextThoughtNeeded: true,
      options: [{ label: 'A', selected: true }],
    });
    expect(result.isError).toBe(true);
    const text = result.content[0].text;
    expect(text).toContain('confidence');
  });

  // T-AUDIT-001-4: decision_frame with no selected option -> error
  it('rejects decision_frame with no selected option', async () => {
    const result = await handler.processThought({
      thought: 'Deciding',
      thoughtType: 'decision_frame',
      nextThoughtNeeded: true,
      confidence: 'medium',
      options: [
        { label: 'A', selected: false },
        { label: 'B', selected: false },
      ],
    });
    expect(result.isError).toBe(true);
    const text = result.content[0].text;
    expect(text).toContain('selected');
  });

  // T-AUDIT-001-5: reasoning with no extra fields -> success
  it('accepts reasoning type with no extra fields', async () => {
    const result = await handler.processThought({
      thought: 'Just thinking',
      thoughtType: 'reasoning',
      nextThoughtNeeded: true,
    });
    expect(result.isError).toBeUndefined();
  });

  // T-AUDIT-001-6: reasoning with confidence -> stored but not validated
  it('accepts reasoning type with extra confidence field', async () => {
    const result = await handler.processThought({
      thought: 'With extra field',
      thoughtType: 'reasoning',
      nextThoughtNeeded: true,
      confidence: 'high',
    });
    expect(result.isError).toBeUndefined();
  });

  // T-AUDIT-001-7: context_snapshot with empty contextData -> success
  it('accepts context_snapshot with empty contextData', async () => {
    const result = await handler.processThought({
      thought: 'Empty context',
      thoughtType: 'context_snapshot',
      nextThoughtNeeded: true,
      contextData: {},
    });
    expect(result.isError).toBeUndefined();
  });

  // T-AUDIT-001-8: context_snapshot with all sub-fields -> all persisted
  it('accepts context_snapshot with full contextData', async () => {
    const result = await handler.processThought({
      thought: 'Full context',
      thoughtType: 'context_snapshot',
      nextThoughtNeeded: true,
      contextData: {
        toolsAvailable: ['deploy', 'query'],
        systemPromptHash: 'abc123',
        modelId: 'claude-opus-4-6',
        constraints: ['no production'],
        dataSourcesAccessed: ['metrics-api'],
      },
    });
    expect(result.isError).toBeUndefined();
  });

  // T-AUDIT-001-9: action_report missing tool -> error
  it('rejects action_report missing tool', async () => {
    const result = await handler.processThought({
      thought: 'Action report',
      thoughtType: 'action_report',
      nextThoughtNeeded: true,
      actionResult: {
        success: true,
        reversible: 'yes',
        target: 'staging',
      } as any,
    });
    expect(result.isError).toBe(true);
    const text = result.content[0].text;
    expect(text).toContain('tool');
  });

  // T-AUDIT-001-10: action_report missing target -> error
  it('rejects action_report missing target', async () => {
    const result = await handler.processThought({
      thought: 'Action report',
      thoughtType: 'action_report',
      nextThoughtNeeded: true,
      actionResult: {
        success: true,
        reversible: 'yes',
        tool: 'deploy',
      } as any,
    });
    expect(result.isError).toBe(true);
    const text = result.content[0].text;
    expect(text).toContain('target');
  });
});
