/**
 * Thought Diff — Structural Branch Diff + Human-Legible Views
 *
 * Thought-level diffs between branches (NOT character/line-level).
 * Includes rendering functions for human-readable output.
 *
 * @module src/multi-agent/thought-diff
 */

import type { ThoughtData } from '../persistence/types.js';
import { parseClaims, type ExtractedClaim } from './claim-parser.js';
import { detectConflicts, type Conflict } from './conflict-detection.js';

/**
 * Structural diff between two branches.
 */
export interface BranchDiff {
  /** Thought number where branches diverge */
  forkPoint: number;
  /** Thoughts shared before the fork (on main chain) */
  sharedThoughts: ThoughtData[];
  /** Thoughts unique to branch A */
  branchA: ThoughtData[];
  /** Thoughts unique to branch B */
  branchB: ThoughtData[];
  /** Detected conflicts between the branches */
  conflicts: Conflict[];
}

/**
 * Compute a structural diff between two thought branches.
 *
 * @param mainChain - The main chain thoughts (shared context)
 * @param branchAThoughts - Thoughts from branch A
 * @param branchBThoughts - Thoughts from branch B
 * @returns Structural diff result
 */
export function computeBranchDiff(
  mainChain: ThoughtData[],
  branchAThoughts: ThoughtData[],
  branchBThoughts: ThoughtData[]
): BranchDiff {
  // Determine fork point from branch metadata
  const forkPointA = branchAThoughts[0]?.branchFromThought ?? 1;
  const forkPointB = branchBThoughts[0]?.branchFromThought ?? 1;
  const forkPoint = Math.min(forkPointA, forkPointB);

  // Shared thoughts: main chain up to fork point
  const sharedThoughts = mainChain.filter(t => t.thoughtNumber <= forkPoint);

  // Detect conflicts between branch A and branch B
  const allBranchThoughts = [...branchAThoughts, ...branchBThoughts];
  const { conflicts } = detectConflicts(allBranchThoughts);

  return {
    forkPoint,
    sharedThoughts,
    branchA: branchAThoughts,
    branchB: branchBThoughts,
    conflicts,
  };
}

/**
 * Agent info for timeline rendering.
 */
export interface AgentInfo {
  agentId: string;
  name: string;
  emoji?: string;
}

/**
 * Render a chronological timeline of thoughts across all agent planes.
 *
 * @param thoughts - All thoughts (mixed agents)
 * @param agents - Agent metadata for labeling
 * @returns Markdown timeline
 */
export function renderTimeline(
  thoughts: ThoughtData[],
  agents: AgentInfo[]
): string {
  const agentMap = new Map(agents.map(a => [a.agentId, a]));

  // Sort by timestamp
  const sorted = [...thoughts].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );

  const lines: string[] = ['# Reasoning Timeline', ''];

  for (const thought of sorted) {
    const agent = thought.agentId ? agentMap.get(thought.agentId) : null;
    const agentLabel = agent
      ? `${agent.emoji ?? '🤖'} **${agent.name}**`
      : '📝 **Anonymous**';

    const branchLabel = thought.branchId ? ` [branch: ${thought.branchId}]` : '';
    const time = thought.timestamp.split('T')[1]?.split('.')[0] ?? '';

    lines.push(`### S${thought.thoughtNumber} — ${agentLabel}${branchLabel}`);
    lines.push(`> ${time}`);
    lines.push('');
    lines.push(thought.thought);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Render a side-by-side split diff of two branches.
 *
 * @param diff - The branch diff to render
 * @returns Markdown split view
 */
export function renderSplitDiff(diff: BranchDiff): string {
  const lines: string[] = ['# Branch Diff', ''];

  // Fork point
  lines.push(`**Fork point**: Thought #${diff.forkPoint}`);
  lines.push(`**Shared context**: ${diff.sharedThoughts.length} thoughts`);
  lines.push('');

  // Shared context summary
  if (diff.sharedThoughts.length > 0) {
    lines.push('## Shared Context (before fork)');
    lines.push('');
    for (const thought of diff.sharedThoughts) {
      lines.push(`- **S${thought.thoughtNumber}**: ${thought.thought.slice(0, 80)}${thought.thought.length > 80 ? '...' : ''}`);
    }
    lines.push('');
  }

  // Branch A
  const branchAId = diff.branchA[0]?.branchId ?? 'Branch A';
  const branchBId = diff.branchB[0]?.branchId ?? 'Branch B';
  const agentA = diff.branchA[0]?.agentId;
  const agentB = diff.branchB[0]?.agentId;

  lines.push(`## ${branchAId}${agentA ? ` (${agentA})` : ''}`);
  lines.push('');
  for (const thought of diff.branchA) {
    lines.push(`- **S${thought.thoughtNumber}**: ${thought.thought}`);
  }
  lines.push('');

  lines.push(`## ${branchBId}${agentB ? ` (${agentB})` : ''}`);
  lines.push('');
  for (const thought of diff.branchB) {
    lines.push(`- **S${thought.thoughtNumber}**: ${thought.thought}`);
  }
  lines.push('');

  // Conflicts
  if (diff.conflicts.length > 0) {
    lines.push('## ⚠️ Conflicts');
    lines.push('');
    for (const conflict of diff.conflicts) {
      lines.push(`- **${conflict.type}**: "${conflict.claimA.raw}" vs "${conflict.claimB.raw}"`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
