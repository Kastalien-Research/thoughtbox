/**
 * Tests for content hash / Merkle chain (M2)
 */
import { describe, it, expect } from 'vitest';
import { computeHash, verifyChain, resolveParentHash, GENESIS_HASH } from '../content-hash.js';
import type { ThoughtData } from '../../persistence/types.js';
import { createThoughtSequence } from './test-helpers.js';

describe('content-hash', () => {
  it('T-MA-HASH-1: computeHash returns consistent SHA-256 for same inputs', () => {
    const input = {
      thought: 'Test thought',
      thoughtNumber: 1,
      parentHash: GENESIS_HASH,
      agentId: 'agent-1',
      timestamp: '2026-01-01T00:00:00.000Z',
    };

    const hash1 = computeHash(input);
    const hash2 = computeHash(input);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex
  });

  it('T-MA-HASH-2: computeHash changes when any input field changes', () => {
    const base = {
      thought: 'Test thought',
      thoughtNumber: 1,
      parentHash: GENESIS_HASH,
      agentId: 'agent-1',
      timestamp: '2026-01-01T00:00:00.000Z',
    };

    const baseline = computeHash(base);

    // Change thought
    expect(computeHash({ ...base, thought: 'Different' })).not.toBe(baseline);
    // Change thoughtNumber
    expect(computeHash({ ...base, thoughtNumber: 2 })).not.toBe(baseline);
    // Change parentHash
    expect(computeHash({ ...base, parentHash: 'abc123' })).not.toBe(baseline);
    // Change agentId
    expect(computeHash({ ...base, agentId: 'agent-2' })).not.toBe(baseline);
    // Change timestamp
    expect(computeHash({ ...base, timestamp: '2026-01-02T00:00:00.000Z' })).not.toBe(baseline);
  });

  it('T-MA-HASH-3: first thought gets parentHash = "genesis"', () => {
    const thoughts: ThoughtData[] = [{
      thought: 'First', thoughtNumber: 1, totalThoughts: 1,
      nextThoughtNeeded: false, timestamp: '2026-01-01T00:00:00.000Z',
    }];

    const parentHash = resolveParentHash(thoughts, thoughts[0]);
    expect(parentHash).toBe(GENESIS_HASH);
  });

  it('T-MA-HASH-4: second thought gets parentHash = first thought\'s contentHash', () => {
    const firstHash = computeHash({
      thought: 'First', thoughtNumber: 1, parentHash: GENESIS_HASH,
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    const thoughts: ThoughtData[] = [
      {
        thought: 'First', thoughtNumber: 1, totalThoughts: 2,
        nextThoughtNeeded: true, timestamp: '2026-01-01T00:00:00.000Z',
        contentHash: firstHash, parentHash: GENESIS_HASH,
      },
      {
        thought: 'Second', thoughtNumber: 2, totalThoughts: 2,
        nextThoughtNeeded: false, timestamp: '2026-01-01T00:01:00.000Z',
      },
    ];

    const parentHash = resolveParentHash(thoughts, thoughts[1]);
    expect(parentHash).toBe(firstHash);
  });

  it('T-MA-HASH-5: branch thought gets parentHash = branch-from thought\'s contentHash', () => {
    const mainHash = computeHash({
      thought: 'Main chain', thoughtNumber: 3, parentHash: 'prev-hash',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    const thoughts: ThoughtData[] = [
      {
        thought: 'Main chain', thoughtNumber: 3, totalThoughts: 5,
        nextThoughtNeeded: true, timestamp: '2026-01-01T00:00:00.000Z',
        contentHash: mainHash,
      },
      {
        thought: 'Branch thought', thoughtNumber: 4, totalThoughts: 5,
        nextThoughtNeeded: true, timestamp: '2026-01-01T00:01:00.000Z',
        branchFromThought: 3, branchId: 'alt-1',
      },
    ];

    const parentHash = resolveParentHash(thoughts, thoughts[1]);
    expect(parentHash).toBe(mainHash);
  });

  it('T-MA-HASH-6: hash includes agentId in computation', () => {
    const base = {
      thought: 'Same thought',
      thoughtNumber: 1,
      parentHash: GENESIS_HASH,
      timestamp: '2026-01-01T00:00:00.000Z',
    };

    const withAgent = computeHash({ ...base, agentId: 'agent-x' });
    const withoutAgent = computeHash(base);

    expect(withAgent).not.toBe(withoutAgent);
  });

  it('T-MA-HASH-7: verifyChain validates intact chain of 5 thoughts', () => {
    const thoughts: ThoughtData[] = [];
    const ts = (i: number) => `2026-01-01T00:0${i}:00.000Z`;

    for (let i = 1; i <= 5; i++) {
      const parentHash = i === 1
        ? GENESIS_HASH
        : thoughts[i - 2].contentHash!;

      const hash = computeHash({
        thought: `Thought ${i}`,
        thoughtNumber: i,
        parentHash,
        agentId: 'agent-1',
        timestamp: ts(i),
      });

      thoughts.push({
        thought: `Thought ${i}`,
        thoughtNumber: i,
        totalThoughts: 5,
        nextThoughtNeeded: i < 5,
        timestamp: ts(i),
        agentId: 'agent-1',
        contentHash: hash,
        parentHash,
      });
    }

    const result = verifyChain(thoughts);
    expect(result.valid).toBe(true);
    expect(result.verifiedCount).toBe(5);
    expect(result.errors).toHaveLength(0);
  });

  it('T-MA-HASH-8: verifyChain detects tampered content', () => {
    const thoughts: ThoughtData[] = [];
    const ts = (i: number) => `2026-01-01T00:0${i}:00.000Z`;

    for (let i = 1; i <= 3; i++) {
      const parentHash = i === 1
        ? GENESIS_HASH
        : thoughts[i - 2].contentHash!;

      const hash = computeHash({
        thought: `Thought ${i}`,
        thoughtNumber: i,
        parentHash,
        timestamp: ts(i),
      });

      thoughts.push({
        thought: `Thought ${i}`,
        thoughtNumber: i,
        totalThoughts: 3,
        nextThoughtNeeded: i < 3,
        timestamp: ts(i),
        contentHash: hash,
        parentHash,
      });
    }

    // Tamper with thought 2's content
    thoughts[1].thought = 'TAMPERED CONTENT';

    const result = verifyChain(thoughts);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].thoughtNumber).toBe(2);
  });

  it('T-MA-HASH-9: verifyChain detects missing thought in chain', () => {
    const ts = (i: number) => `2026-01-01T00:0${i}:00.000Z`;

    const hash1 = computeHash({
      thought: 'Thought 1', thoughtNumber: 1,
      parentHash: GENESIS_HASH, timestamp: ts(1),
    });

    const hash2 = computeHash({
      thought: 'Thought 2', thoughtNumber: 2,
      parentHash: hash1, timestamp: ts(2),
    });

    const hash3 = computeHash({
      thought: 'Thought 3', thoughtNumber: 3,
      parentHash: hash2, timestamp: ts(3),
    });

    // Include thoughts 1 and 3 but skip 2 — thought 3's parentHash won't match
    const thoughts: ThoughtData[] = [
      {
        thought: 'Thought 1', thoughtNumber: 1, totalThoughts: 3,
        nextThoughtNeeded: true, timestamp: ts(1),
        contentHash: hash1, parentHash: GENESIS_HASH,
      },
      {
        thought: 'Thought 3', thoughtNumber: 3, totalThoughts: 3,
        nextThoughtNeeded: false, timestamp: ts(3),
        contentHash: hash3, parentHash: hash2,
      },
    ];

    const result = verifyChain(thoughts);
    // Thought 3 will fail because its parentHash (hash2) won't match
    // what resolveParentHash computes (hash1, since thought 2 is missing)
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.thoughtNumber === 3)).toBe(true);
  });

  it('T-MA-HASH-10: legacy thoughts without contentHash skipped by verifyChain', () => {
    const thoughts: ThoughtData[] = [
      {
        thought: 'Legacy thought', thoughtNumber: 1, totalThoughts: 2,
        nextThoughtNeeded: true, timestamp: '2026-01-01T00:00:00.000Z',
        // No contentHash — legacy
      },
      {
        thought: 'Modern thought', thoughtNumber: 2, totalThoughts: 2,
        nextThoughtNeeded: false, timestamp: '2026-01-01T00:01:00.000Z',
        contentHash: computeHash({
          thought: 'Modern thought', thoughtNumber: 2,
          parentHash: GENESIS_HASH, // Legacy parent has no hash
          timestamp: '2026-01-01T00:01:00.000Z',
        }),
        parentHash: GENESIS_HASH,
      },
    ];

    const result = verifyChain(thoughts);
    expect(result.valid).toBe(true);
    expect(result.skippedCount).toBe(1);
    expect(result.verifiedCount).toBe(1);
  });
});
