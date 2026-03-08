/**
 * AUDIT-002: manifest-generator unit tests
 * Tests generateAuditData() aggregation logic directly.
 */
import { describe, it, expect } from 'vitest';
import { generateAuditData } from '../manifest-generator.js';
import type { ThoughtData } from '../../persistence/types.js';

function thought(
  overrides: Partial<ThoughtData> & {
    thoughtNumber: number;
    thoughtType: ThoughtData['thoughtType'];
  }
): ThoughtData {
  return {
    thought: `Thought ${overrides.thoughtNumber}`,
    totalThoughts: 10,
    nextThoughtNeeded: true,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe('generateAuditData', () => {
  it('counts thoughts by type', () => {
    const thoughts = [
      thought({
        thoughtNumber: 1,
        thoughtType: 'reasoning',
      }),
      thought({
        thoughtNumber: 2,
        thoughtType: 'decision_frame',
        confidence: 'high',
        options: [{ label: 'A', selected: true }],
      }),
      thought({
        thoughtNumber: 3,
        thoughtType: 'action_report',
        actionResult: {
          success: true,
          reversible: 'yes',
          tool: 'x',
          target: 'y',
        },
      }),
      thought({
        thoughtNumber: 4,
        thoughtType: 'reasoning',
      }),
    ];
    const result = generateAuditData('sess-1', thoughts);
    expect(result.thoughtCounts.total).toBe(4);
    expect(result.thoughtCounts.reasoning).toBe(2);
    expect(result.thoughtCounts.decision_frame).toBe(1);
    expect(result.thoughtCounts.action_report).toBe(1);
  });

  it('aggregates decision confidence levels', () => {
    const thoughts = [
      thought({
        thoughtNumber: 1,
        thoughtType: 'decision_frame',
        confidence: 'high',
        options: [{ label: 'A', selected: true }],
      }),
      thought({
        thoughtNumber: 2,
        thoughtType: 'decision_frame',
        confidence: 'low',
        options: [{ label: 'B', selected: true }],
      }),
      thought({
        thoughtNumber: 3,
        thoughtType: 'decision_frame',
        confidence: 'low',
        options: [{ label: 'C', selected: true }],
      }),
    ];
    const result = generateAuditData('sess-1', thoughts);
    expect(result.decisions.total).toBe(3);
    expect(result.decisions.byConfidence.high).toBe(1);
    expect(result.decisions.byConfidence.low).toBe(2);
    expect(result.decisions.byConfidence.medium).toBe(0);
  });

  it('aggregates action results', () => {
    const thoughts = [
      thought({
        thoughtNumber: 1,
        thoughtType: 'action_report',
        actionResult: {
          success: true,
          reversible: 'yes',
          tool: 'a',
          target: 'b',
        },
      }),
      thought({
        thoughtNumber: 2,
        thoughtType: 'action_report',
        actionResult: {
          success: false,
          reversible: 'no',
          tool: 'c',
          target: 'd',
        },
      }),
      thought({
        thoughtNumber: 3,
        thoughtType: 'action_report',
        actionResult: {
          success: true,
          reversible: 'partial',
          tool: 'e',
          target: 'f',
        },
      }),
    ];
    const result = generateAuditData('sess-1', thoughts);
    expect(result.actions.total).toBe(3);
    expect(result.actions.successful).toBe(2);
    expect(result.actions.failed).toBe(1);
    expect(result.actions.reversible).toBe(1);
    expect(result.actions.irreversible).toBe(1);
    expect(result.actions.partiallyReversible).toBe(1);
  });

  it('detects decision without action gaps', () => {
    const thoughts = [
      thought({
        thoughtNumber: 1,
        thoughtType: 'decision_frame',
        confidence: 'high',
        options: [{ label: 'A', selected: true }],
      }),
      thought({ thoughtNumber: 2, thoughtType: 'reasoning' }),
      thought({ thoughtNumber: 3, thoughtType: 'reasoning' }),
      thought({ thoughtNumber: 4, thoughtType: 'reasoning' }),
      thought({ thoughtNumber: 5, thoughtType: 'reasoning' }),
      thought({ thoughtNumber: 6, thoughtType: 'reasoning' }),
      thought({ thoughtNumber: 7, thoughtType: 'reasoning' }),
    ];
    const result = generateAuditData('sess-1', thoughts);
    expect(
      result.gaps.some(
        (g) =>
          g.type === 'decision_without_action' &&
          g.thoughtNumber === 1
      )
    ).toBe(true);
  });

  it('does not flag decision followed by action within 5', () => {
    const thoughts = [
      thought({
        thoughtNumber: 1,
        thoughtType: 'decision_frame',
        confidence: 'high',
        options: [{ label: 'A', selected: true }],
      }),
      thought({ thoughtNumber: 2, thoughtType: 'reasoning' }),
      thought({
        thoughtNumber: 3,
        thoughtType: 'action_report',
        actionResult: {
          success: true,
          reversible: 'yes',
          tool: 'x',
          target: 'y',
        },
      }),
    ];
    const result = generateAuditData('sess-1', thoughts);
    expect(
      result.gaps.filter(
        (g) => g.type === 'decision_without_action'
      )
    ).toHaveLength(0);
  });

  it('detects critique overrides', () => {
    const thoughts = [
      thought({
        thoughtNumber: 1,
        thoughtType: 'reasoning',
        critique: {
          text: 'Consider edge cases for authentication flow',
          model: 'test',
          timestamp: new Date().toISOString(),
        },
      }),
      thought({ thoughtNumber: 2, thoughtType: 'reasoning' }),
    ];
    thoughts[1].thought =
      'Moving on to the database schema design';
    const result = generateAuditData('sess-1', thoughts);
    expect(result.critiques.generated).toBe(1);
    expect(result.critiques.overridden).toBe(1);
    expect(
      result.gaps.some((g) => g.type === 'critique_override')
    ).toBe(true);
  });

  it('counts assumption flips', () => {
    const thoughts = [
      thought({
        thoughtNumber: 1,
        thoughtType: 'assumption_update',
        assumptionChange: {
          text: 'DB is fast',
          oldStatus: 'believed',
          newStatus: 'refuted',
        },
      }),
      thought({
        thoughtNumber: 2,
        thoughtType: 'assumption_update',
        assumptionChange: {
          text: 'API is stable',
          oldStatus: 'uncertain',
          newStatus: 'believed',
        },
      }),
    ];
    const result = generateAuditData('sess-1', thoughts);
    expect(result.assumptions.totalUpdates).toBe(2);
    expect(result.assumptions.flips).toBe(1);
    expect(result.assumptions.currentlyRefuted).toBe(1);
  });
});
