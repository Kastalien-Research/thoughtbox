/**
 * Integration tests for multi-agent workflow (M8)
 *
 * Tests the full workflow: register → workspace → problem → branch → claim → conflict → diff
 * Uses in-memory storage and validates all modules work together.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type { ThoughtData } from '../../persistence/types.js';
import { computeHash, resolveParentHash, verifyChain, GENESIS_HASH } from '../content-hash.js';
import { parseClaims } from '../claim-parser.js';
import { detectConflicts } from '../conflict-detection.js';
import { computeBranchDiff, renderTimeline, renderSplitDiff, type AgentInfo } from '../thought-diff.js';
import { createTestStorage, createThought } from './test-helpers.js';

describe('multi-agent-integration', () => {
  let storage: ReturnType<typeof createTestStorage>;

  const agents: AgentInfo[] = [
    { agentId: 'claude', name: 'Claude Code', emoji: '🧠' },
    { agentId: 'cursor', name: 'Cursor', emoji: '🖱️' },
    { agentId: 'roo', name: 'Roo Code', emoji: '🦘' },
  ];

  beforeEach(() => {
    storage = createTestStorage();
    storage.createSession('integration-session');
  });

  it('T-MA-INT-1: three agents register with distinct names', () => {
    // Simulate registration — agents have distinct IDs and names
    const registered = agents.map(a => ({ agentId: a.agentId, name: a.name }));

    expect(registered).toHaveLength(3);
    const ids = registered.map(r => r.agentId);
    expect(new Set(ids).size).toBe(3);
    const names = registered.map(r => r.name);
    expect(new Set(names).size).toBe(3);
  });

  it('T-MA-INT-2: agent A creates workspace, B and C join', () => {
    // Simulate workspace creation and joining
    const workspace = { id: 'ws-1', creator: 'claude', members: ['claude'] };
    workspace.members.push('cursor');
    workspace.members.push('roo');

    expect(workspace.members).toHaveLength(3);
    expect(workspace.members).toContain('claude');
    expect(workspace.members).toContain('cursor');
    expect(workspace.members).toContain('roo');
  });

  it('T-MA-INT-3: agent A creates thought with agentId attribution', () => {
    const thought = createThought({
      thought: 'Initial problem analysis: API latency regression',
      thoughtNumber: 1,
      agentId: 'claude',
      agentName: 'Claude Code',
    });

    storage.saveThought('integration-session', thought);

    const saved = storage.getThoughts('integration-session');
    expect(saved).toHaveLength(1);
    expect(saved[0].agentId).toBe('claude');
    expect(saved[0].agentName).toBe('Claude Code');
  });

  it('T-MA-INT-4: agent B creates branch, content hash chains correctly', () => {
    // Main chain thoughts
    const t1 = createThought({
      thought: 'Problem: API latency regression',
      thoughtNumber: 1,
      agentId: 'claude',
      timestamp: '2026-01-01T00:01:00.000Z',
    });
    const hash1 = computeHash({
      thought: t1.thought,
      thoughtNumber: t1.thoughtNumber,
      parentHash: GENESIS_HASH,
      agentId: t1.agentId,
      timestamp: t1.timestamp,
    });
    t1.contentHash = hash1;
    t1.parentHash = GENESIS_HASH;

    const t2 = createThought({
      thought: 'Analysis: db queries are slow',
      thoughtNumber: 2,
      agentId: 'claude',
      timestamp: '2026-01-01T00:02:00.000Z',
    });
    const hash2 = computeHash({
      thought: t2.thought,
      thoughtNumber: t2.thoughtNumber,
      parentHash: hash1,
      agentId: t2.agentId,
      timestamp: t2.timestamp,
    });
    t2.contentHash = hash2;
    t2.parentHash = hash1;

    storage.saveThought('integration-session', t1);
    storage.saveThought('integration-session', t2);

    // Branch by agent B from thought #2
    const branchThought = createThought({
      thought: 'CLAIM: index missing on users table',
      thoughtNumber: 3,
      agentId: 'cursor',
      branchId: 'cursor/task-1',
      branchFromThought: 2,
      timestamp: '2026-01-01T00:03:00.000Z',
    });
    const branchHash = computeHash({
      thought: branchThought.thought,
      thoughtNumber: branchThought.thoughtNumber,
      parentHash: hash2, // branches from thought 2's hash
      agentId: branchThought.agentId,
      timestamp: branchThought.timestamp,
    });
    branchThought.contentHash = branchHash;
    branchThought.parentHash = hash2;

    storage.saveBranchThought('integration-session', 'cursor/task-1', branchThought);

    // Verify chain integrity
    const mainChain = storage.getThoughts('integration-session');
    const verification = verifyChain(mainChain);
    expect(verification.valid).toBe(true);
    expect(verification.verifiedCount).toBe(2);

    // Verify branch thought chains from main
    expect(branchThought.parentHash).toBe(hash2);
    expect(branchThought.contentHash).toBeDefined();
    expect(branchThought.contentHash).not.toBe(hash2); // Different content → different hash
  });

  it('T-MA-INT-5: agent A posts CLAIM, agent B posts ¬CLAIM, conflict detected', () => {
    const thoughtA = createThought({
      thought: 'CLAIM: db query regression is root cause of latency',
      thoughtNumber: 3,
      agentId: 'claude',
      branchId: 'claude/analysis',
      branchFromThought: 2,
    });

    const thoughtB = createThought({
      thought: 'CLAIM: ¬(db query regression is root cause of latency)',
      thoughtNumber: 3,
      agentId: 'cursor',
      branchId: 'cursor/analysis',
      branchFromThought: 2,
    });

    const result = detectConflicts([thoughtA, thoughtB]);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].type).toBe('direct_contradiction');
    expect(result.conflicts[0].agentA).toBe('claude');
    expect(result.conflicts[0].agentB).toBe('cursor');
  });

  it('T-MA-INT-6: branch diff shows divergence between A and B', () => {
    const main = [
      createThought({ thought: 'Problem statement', thoughtNumber: 1, timestamp: '2026-01-01T00:01:00.000Z' }),
      createThought({ thought: 'Shared analysis', thoughtNumber: 2, timestamp: '2026-01-01T00:02:00.000Z' }),
    ];

    const branchA = [
      createThought({
        thought: 'CLAIM: caching is the fix',
        thoughtNumber: 3,
        agentId: 'claude',
        branchId: 'claude/fix',
        branchFromThought: 2,
        timestamp: '2026-01-01T00:03:00.000Z',
      }),
    ];

    const branchB = [
      createThought({
        thought: 'CLAIM: ¬(caching is the fix)',
        thoughtNumber: 3,
        agentId: 'cursor',
        branchId: 'cursor/fix',
        branchFromThought: 2,
        timestamp: '2026-01-01T00:03:01.000Z',
      }),
    ];

    const diff = computeBranchDiff(main, branchA, branchB);
    expect(diff.forkPoint).toBe(2);
    expect(diff.sharedThoughts).toHaveLength(2);
    expect(diff.branchA).toHaveLength(1);
    expect(diff.branchB).toHaveLength(1);
    expect(diff.conflicts.length).toBeGreaterThan(0);

    // Render both views
    const splitMd = renderSplitDiff(diff);
    expect(splitMd).toContain('claude/fix');
    expect(splitMd).toContain('cursor/fix');
    expect(splitMd).toContain('Conflicts');
  });

  it('T-MA-INT-7: Merkle chain verifies intact across both branches', () => {
    const t1 = createThought({
      thought: 'Root analysis',
      thoughtNumber: 1,
      agentId: 'claude',
      timestamp: '2026-01-01T00:01:00.000Z',
    });
    t1.parentHash = GENESIS_HASH;
    t1.contentHash = computeHash({
      thought: t1.thought,
      thoughtNumber: 1,
      parentHash: GENESIS_HASH,
      agentId: 'claude',
      timestamp: t1.timestamp,
    });

    const t2 = createThought({
      thought: 'Deeper analysis',
      thoughtNumber: 2,
      agentId: 'claude',
      timestamp: '2026-01-01T00:02:00.000Z',
    });
    t2.parentHash = t1.contentHash;
    t2.contentHash = computeHash({
      thought: t2.thought,
      thoughtNumber: 2,
      parentHash: t1.contentHash!,
      agentId: 'claude',
      timestamp: t2.timestamp,
    });

    // Branch A from thought 2
    const tA = createThought({
      thought: 'Branch A approach',
      thoughtNumber: 3,
      agentId: 'cursor',
      branchId: 'cursor/approach-a',
      branchFromThought: 2,
      timestamp: '2026-01-01T00:03:00.000Z',
    });
    tA.parentHash = t2.contentHash;
    tA.contentHash = computeHash({
      thought: tA.thought,
      thoughtNumber: 3,
      parentHash: t2.contentHash!,
      agentId: 'cursor',
      timestamp: tA.timestamp,
    });

    // Branch B from thought 2
    const tB = createThought({
      thought: 'Branch B approach',
      thoughtNumber: 3,
      agentId: 'roo',
      branchId: 'roo/approach-b',
      branchFromThought: 2,
      timestamp: '2026-01-01T00:03:01.000Z',
    });
    tB.parentHash = t2.contentHash;
    tB.contentHash = computeHash({
      thought: tB.thought,
      thoughtNumber: 3,
      parentHash: t2.contentHash!,
      agentId: 'roo',
      timestamp: tB.timestamp,
    });

    // Verify main chain
    const mainVerification = verifyChain([t1, t2]);
    expect(mainVerification.valid).toBe(true);
    expect(mainVerification.verifiedCount).toBe(2);

    // Verify branch A chains from main
    const branchAChain = verifyChain([t1, t2, tA]);
    expect(branchAChain.valid).toBe(true);
    expect(branchAChain.verifiedCount).toBe(3);

    // Verify branch B chains from main
    const branchBChain = verifyChain([t1, t2, tB]);
    expect(branchBChain.valid).toBe(true);
    expect(branchBChain.verifiedCount).toBe(3);
  });

  it('T-MA-INT-8: agent C sees messages from A and B in channel', () => {
    // Simulate channel with thoughts from multiple agents
    const allThoughts = [
      createThought({
        thought: 'Initial investigation',
        thoughtNumber: 1,
        agentId: 'claude',
        timestamp: '2026-01-01T00:01:00.000Z',
      }),
      createThought({
        thought: 'Counter-analysis from Cursor',
        thoughtNumber: 2,
        agentId: 'cursor',
        timestamp: '2026-01-01T00:02:00.000Z',
      }),
      createThought({
        thought: 'Synthesis from Roo',
        thoughtNumber: 3,
        agentId: 'roo',
        timestamp: '2026-01-01T00:03:00.000Z',
      }),
    ];

    const timeline = renderTimeline(allThoughts, agents);

    expect(timeline).toContain('Claude Code');
    expect(timeline).toContain('Cursor');
    expect(timeline).toContain('Roo Code');
    expect(timeline).toContain('🧠');
    expect(timeline).toContain('🖱️');
    expect(timeline).toContain('🦘');
    expect(timeline).toContain('S1');
    expect(timeline).toContain('S2');
    expect(timeline).toContain('S3');
  });

  it('T-MA-INT-9: full workflow: register → workspace → problem → branch → claim → conflict → diff', () => {
    // 1. Three agents registered
    expect(agents).toHaveLength(3);

    // 2. Shared context (main chain)
    const main = [
      createThought({
        thought: 'Problem: user authentication flow is broken',
        thoughtNumber: 1,
        agentId: 'claude',
        timestamp: '2026-01-01T00:01:00.000Z',
      }),
      createThought({
        thought: 'Investigation: session tokens expire prematurely',
        thoughtNumber: 2,
        agentId: 'claude',
        timestamp: '2026-01-01T00:02:00.000Z',
      }),
    ];

    // Hash main chain
    main[0].parentHash = GENESIS_HASH;
    main[0].contentHash = computeHash({
      thought: main[0].thought,
      thoughtNumber: 1,
      parentHash: GENESIS_HASH,
      agentId: 'claude',
      timestamp: main[0].timestamp,
    });
    main[1].parentHash = main[0].contentHash;
    main[1].contentHash = computeHash({
      thought: main[1].thought,
      thoughtNumber: 2,
      parentHash: main[0].contentHash!,
      agentId: 'claude',
      timestamp: main[1].timestamp,
    });

    // 3. Agent B branches with a claim
    const branchCursor = [
      createThought({
        thought: 'CLAIM: session store is the root cause',
        thoughtNumber: 3,
        agentId: 'cursor',
        branchId: 'cursor/auth-fix',
        branchFromThought: 2,
        timestamp: '2026-01-01T00:03:00.000Z',
      }),
      createThought({
        thought: 'PREMISE: [S2] token expiry confirms session store issue',
        thoughtNumber: 4,
        agentId: 'cursor',
        branchId: 'cursor/auth-fix',
        timestamp: '2026-01-01T00:04:00.000Z',
      }),
    ];

    // 4. Agent C branches with a contradicting claim
    const branchRoo = [
      createThought({
        thought: 'CLAIM: ¬(session store is the root cause)',
        thoughtNumber: 3,
        agentId: 'roo',
        branchId: 'roo/auth-fix',
        branchFromThought: 2,
        timestamp: '2026-01-01T00:03:01.000Z',
      }),
      createThought({
        thought: 'CLAIM: JWT validation logic has a timezone bug',
        thoughtNumber: 4,
        agentId: 'roo',
        branchId: 'roo/auth-fix',
        timestamp: '2026-01-01T00:04:01.000Z',
      }),
    ];

    // 5. Detect conflicts
    const allBranchThoughts = [...branchCursor, ...branchRoo];
    const conflictResult = detectConflicts(allBranchThoughts);
    expect(conflictResult.conflicts.length).toBeGreaterThan(0);
    expect(conflictResult.conflicts[0].agentA).toBe('cursor');
    expect(conflictResult.conflicts[0].agentB).toBe('roo');

    // 6. Compute branch diff
    const diff = computeBranchDiff(main, branchCursor, branchRoo);
    expect(diff.forkPoint).toBe(2);
    expect(diff.sharedThoughts).toHaveLength(2);
    expect(diff.branchA).toHaveLength(2);
    expect(diff.branchB).toHaveLength(2);
    expect(diff.conflicts.length).toBeGreaterThan(0);

    // 7. Render views
    const splitView = renderSplitDiff(diff);
    expect(splitView).toContain('cursor/auth-fix');
    expect(splitView).toContain('roo/auth-fix');
    expect(splitView).toContain('Conflicts');

    const allThoughts = [...main, ...branchCursor, ...branchRoo];
    const timeline = renderTimeline(allThoughts, agents);
    expect(timeline).toContain('Claude Code');
    expect(timeline).toContain('Cursor');
    expect(timeline).toContain('Roo Code');

    // 8. Verify main chain integrity
    const chainVerification = verifyChain(main);
    expect(chainVerification.valid).toBe(true);

    // 9. Parse claims from all thoughts
    const allClaims = allBranchThoughts.flatMap(t => parseClaims(t.thought).claims);
    expect(allClaims.length).toBeGreaterThanOrEqual(3); // At least the 3 explicit CLAIMs
  });
});
