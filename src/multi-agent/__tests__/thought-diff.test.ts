/**
 * Tests for thought diff and rendering (M6)
 */
import { describe, it, expect } from 'vitest';
import { computeBranchDiff, renderTimeline, renderSplitDiff, type AgentInfo } from '../thought-diff.js';
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

describe('thought-diff', () => {
  const mainChain = [
    thought(1, 'Problem statement'),
    thought(2, 'Initial analysis'),
    thought(3, 'Key finding'),
  ];

  const branchA = [
    thought(4, 'CLAIM: approach A is best', {
      branchFromThought: 3, branchId: 'approach-a', agentId: 'agent-a',
    }),
    thought(5, 'More analysis on A', {
      branchId: 'approach-a', agentId: 'agent-a',
    }),
  ];

  const branchB = [
    thought(4, 'CLAIM: ¬(approach A is best)', {
      branchFromThought: 3, branchId: 'approach-b', agentId: 'agent-b',
    }),
    thought(5, 'Analysis for approach B', {
      branchId: 'approach-b', agentId: 'agent-b',
    }),
  ];

  it('T-MA-DIF-1: identifies shared thoughts (before fork point)', () => {
    const diff = computeBranchDiff(mainChain, branchA, branchB);
    expect(diff.sharedThoughts).toHaveLength(3);
    expect(diff.sharedThoughts.map(t => t.thoughtNumber)).toEqual([1, 2, 3]);
  });

  it('T-MA-DIF-2: identifies divergent thoughts (unique to each branch)', () => {
    const diff = computeBranchDiff(mainChain, branchA, branchB);
    expect(diff.branchA).toHaveLength(2);
    expect(diff.branchB).toHaveLength(2);
    expect(diff.branchA[0].branchId).toBe('approach-a');
    expect(diff.branchB[0].branchId).toBe('approach-b');
  });

  it('T-MA-DIF-3: identifies fork point thought number', () => {
    const diff = computeBranchDiff(mainChain, branchA, branchB);
    expect(diff.forkPoint).toBe(3);
  });

  it('T-MA-DIF-4: handles branches with different lengths', () => {
    const shortBranch = [
      thought(4, 'Only one thought on B', {
        branchFromThought: 3, branchId: 'short', agentId: 'agent-b',
      }),
    ];

    const diff = computeBranchDiff(mainChain, branchA, shortBranch);
    expect(diff.branchA).toHaveLength(2);
    expect(diff.branchB).toHaveLength(1);
  });

  it('T-MA-DIF-5: handles branch with no shared thoughts (fork at 1)', () => {
    const earlyBranch = [
      thought(2, 'Branch from start', {
        branchFromThought: 1, branchId: 'early', agentId: 'agent-a',
      }),
    ];
    const lateBranch = [
      thought(2, 'Also from start', {
        branchFromThought: 1, branchId: 'late', agentId: 'agent-b',
      }),
    ];

    const diff = computeBranchDiff(mainChain, earlyBranch, lateBranch);
    expect(diff.forkPoint).toBe(1);
    expect(diff.sharedThoughts).toHaveLength(1); // Only thought #1
  });

  it('T-MA-DIF-6: includes agent attribution per side when present', () => {
    const diff = computeBranchDiff(mainChain, branchA, branchB);
    expect(diff.branchA[0].agentId).toBe('agent-a');
    expect(diff.branchB[0].agentId).toBe('agent-b');
  });

  it('T-MA-DIF-7: produces claim comparison using claim-parser', () => {
    const diff = computeBranchDiff(mainChain, branchA, branchB);
    // branchA has CLAIM: approach A is best
    // branchB has CLAIM: ¬(approach A is best)
    // These should conflict
    expect(diff.conflicts.length).toBeGreaterThan(0);
    expect(diff.conflicts[0].type).toBe('direct_contradiction');
  });

  it('T-MA-DIF-8: renderTimeline produces chronological markdown with agent attribution', () => {
    const agents: AgentInfo[] = [
      { agentId: 'agent-a', name: 'Claude', emoji: '🧠' },
      { agentId: 'agent-b', name: 'Cursor', emoji: '🖱️' },
    ];

    const allThoughts = [
      thought(1, 'Shared analysis', { agentId: 'agent-a' }),
      thought(2, 'Branch A view', { agentId: 'agent-a', branchId: 'a' }),
      thought(3, 'Branch B view', { agentId: 'agent-b', branchId: 'b' }),
    ];

    const md = renderTimeline(allThoughts, agents);

    expect(md).toContain('# Reasoning Timeline');
    expect(md).toContain('**Claude**');
    expect(md).toContain('**Cursor**');
    expect(md).toContain('🧠');
    expect(md).toContain('🖱️');
    expect(md).toContain('S1');
    expect(md).toContain('S2');
    expect(md).toContain('S3');
  });

  it('T-MA-DIF-9: renderSplitDiff produces side-by-side markdown with fork point and conflicts', () => {
    const diff = computeBranchDiff(mainChain, branchA, branchB);
    const md = renderSplitDiff(diff);

    expect(md).toContain('# Branch Diff');
    expect(md).toContain('Fork point');
    expect(md).toContain('#3');
    expect(md).toContain('approach-a');
    expect(md).toContain('approach-b');
    expect(md).toContain('Conflicts');
  });

  it('T-MA-DIF-10: renderTimeline handles single-agent session (degenerates to linear view)', () => {
    const agents: AgentInfo[] = [
      { agentId: 'solo', name: 'Solo Agent' },
    ];

    const singleAgentThoughts = [
      thought(1, 'Step one', { agentId: 'solo' }),
      thought(2, 'Step two', { agentId: 'solo' }),
      thought(3, 'Step three', { agentId: 'solo' }),
    ];

    const md = renderTimeline(singleAgentThoughts, agents);

    expect(md).toContain('# Reasoning Timeline');
    expect(md).toContain('**Solo Agent**');
    expect(md).toContain('S1');
    expect(md).toContain('S2');
    expect(md).toContain('S3');
    // Should not have any branch labels
    expect(md).not.toContain('[branch:');
  });
});
