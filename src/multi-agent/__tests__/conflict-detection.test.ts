/**
 * Tests for conflict detection (M5)
 */
import { describe, it, expect } from 'vitest';
import { detectConflicts } from '../conflict-detection.js';
import type { ThoughtData } from '../../persistence/types.js';

function thought(num: number, text: string, opts?: Partial<ThoughtData>): ThoughtData {
  return {
    thought: text,
    thoughtNumber: num,
    totalThoughts: 10,
    nextThoughtNeeded: true,
    timestamp: `2026-01-01T00:0${num}:00.000Z`,
    ...opts,
  };
}

describe('conflict-detection', () => {
  it('T-MA-CON-1: detects direct contradiction: CLAIM: X vs CLAIM: ¬X', () => {
    const thoughts = [
      thought(1, 'CLAIM: API latency caused by db regression'),
      thought(2, 'CLAIM: ¬(API latency caused by db regression)'),
    ];

    const result = detectConflicts(thoughts);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].type).toBe('direct_contradiction');
  });

  it('T-MA-CON-2: detects derivation conflict: A ⊢ P vs B ⊢ ¬P', () => {
    const thoughts = [
      thought(1, 'CLAIM: db query is bottleneck', { agentId: 'agent-a' }),
      thought(2, 'REFUTE: ¬(db query is bottleneck)', { agentId: 'agent-b' }),
    ];

    const result = detectConflicts(thoughts);
    expect(result.conflicts).toHaveLength(1);
  });

  it('T-MA-CON-3: no conflict when claims are unrelated', () => {
    const thoughts = [
      thought(1, 'CLAIM: API latency caused by db regression'),
      thought(2, 'CLAIM: Frontend needs new design system'),
    ];

    const result = detectConflicts(thoughts);
    expect(result.conflicts).toHaveLength(0);
  });

  it('T-MA-CON-4: no conflict when claims agree (same assertion)', () => {
    const thoughts = [
      thought(1, 'CLAIM: caching improves performance'),
      thought(2, 'PREMISE: [S1] caching confirmed effective'),
    ];

    const result = detectConflicts(thoughts);
    expect(result.conflicts).toHaveLength(0);
  });

  it('T-MA-CON-5: detects conflicts across different agentIds', () => {
    const thoughts = [
      thought(1, 'CLAIM: migration should use batch processing', { agentId: 'agent-claude' }),
      thought(2, 'CLAIM: ¬(migration should use batch processing)', { agentId: 'agent-cursor' }),
    ];

    const result = detectConflicts(thoughts);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].agentA).toBe('agent-claude');
    expect(result.conflicts[0].agentB).toBe('agent-cursor');
  });

  it('T-MA-CON-6: detects conflicts across different branchIds', () => {
    const thoughts = [
      thought(1, 'CLAIM: approach A is optimal', {
        branchId: 'agent-a/task-1',
        branchFromThought: 1,
      }),
      thought(2, 'CLAIM: ¬(approach A is optimal)', {
        branchId: 'agent-b/task-1',
        branchFromThought: 1,
      }),
    ];

    const result = detectConflicts(thoughts);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].branchA).toBe('agent-a/task-1');
    expect(result.conflicts[0].branchB).toBe('agent-b/task-1');
  });

  it('T-MA-CON-7: returns conflict details: agents, thoughts, claims', () => {
    const thoughts = [
      thought(5, 'CLAIM: Redis is the right choice', { agentId: 'agent-1', branchId: 'branch-a' }),
      thought(8, 'REFUTE: ¬(Redis is the right choice)', { agentId: 'agent-2', branchId: 'branch-b' }),
    ];

    const result = detectConflicts(thoughts);
    expect(result.conflicts).toHaveLength(1);
    const conflict = result.conflicts[0];
    expect(conflict.agentA).toBe('agent-1');
    expect(conflict.agentB).toBe('agent-2');
    expect(conflict.thoughtNumberA).toBe(5);
    expect(conflict.thoughtNumberB).toBe(8);
    expect(conflict.claimA.content).toContain('Redis');
    expect(conflict.claimB.content).toContain('Redis');
  });

  it('T-MA-CON-8: handles session with zero claims gracefully', () => {
    const thoughts = [
      thought(1, 'Just a regular reasoning step'),
      thought(2, 'Another regular step, no claims'),
    ];

    const result = detectConflicts(thoughts);
    expect(result.conflicts).toHaveLength(0);
    expect(result.totalClaims).toBe(0);
  });
});
