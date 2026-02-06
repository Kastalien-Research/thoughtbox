/**
 * Content Hash — SHA-256 Merkle Chain for Thought Integrity
 *
 * Each thought gets a content-addressable hash:
 *   hash = SHA-256(thought + "|" + thoughtNumber + "|" + parentHash + "|" + agentId + "|" + timestamp)
 *
 * Chain rules:
 *   - First thought: parentHash = "genesis"
 *   - Subsequent thought: parentHash = previous thought's contentHash
 *   - Branch thought: parentHash = branch-from thought's contentHash
 *
 * @module src/multi-agent/content-hash
 */

import { createHash } from 'node:crypto';
import type { ThoughtData } from '../persistence/types.js';

/**
 * The sentinel value for the first thought in a chain.
 */
export const GENESIS_HASH = 'genesis';

/**
 * Input fields used for hash computation.
 */
export interface HashInput {
  thought: string;
  thoughtNumber: number;
  parentHash: string;
  agentId?: string;
  timestamp: string;
}

/**
 * Compute SHA-256 content hash from thought fields.
 *
 * @param input - Hash input fields
 * @returns Hex-encoded SHA-256 hash
 */
export function computeHash(input: HashInput): string {
  const payload = [
    input.thought,
    String(input.thoughtNumber),
    input.parentHash,
    input.agentId ?? '',
    input.timestamp,
  ].join('|');

  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Determine the parent hash for a thought in the chain.
 *
 * @param thoughts - All thoughts in the session (ordered by thoughtNumber)
 * @param current - The thought to compute parent hash for
 * @returns Parent hash string
 */
export function resolveParentHash(
  thoughts: ThoughtData[],
  current: ThoughtData
): string {
  // Branch thought → parent is the branch-from thought
  if (current.branchFromThought) {
    const branchFrom = thoughts.find(t => t.thoughtNumber === current.branchFromThought);
    return branchFrom?.contentHash ?? GENESIS_HASH;
  }

  // First thought (no previous)
  if (current.thoughtNumber <= 1) {
    return GENESIS_HASH;
  }

  // Normal chain: previous thought's hash
  const previous = thoughts
    .filter(t => !t.branchId || t.branchId === current.branchId)
    .filter(t => t.thoughtNumber < current.thoughtNumber)
    .sort((a, b) => b.thoughtNumber - a.thoughtNumber)[0];

  return previous?.contentHash ?? GENESIS_HASH;
}

/**
 * Result of chain verification.
 */
export interface ChainVerification {
  valid: boolean;
  verifiedCount: number;
  skippedCount: number;
  errors: Array<{
    thoughtNumber: number;
    expected: string;
    actual: string;
  }>;
}

/**
 * Verify the integrity of a thought chain.
 *
 * Recalculates hashes and compares against stored contentHash values.
 * Thoughts without contentHash are skipped (legacy backward compat).
 *
 * @param thoughts - Ordered array of thoughts to verify
 * @returns Verification result
 */
export function verifyChain(thoughts: ThoughtData[]): ChainVerification {
  const result: ChainVerification = {
    valid: true,
    verifiedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  for (const thought of thoughts) {
    // Skip legacy thoughts without hash
    if (!thought.contentHash) {
      result.skippedCount++;
      continue;
    }

    const parentHash = resolveParentHash(thoughts, thought);
    const expectedHash = computeHash({
      thought: thought.thought,
      thoughtNumber: thought.thoughtNumber,
      parentHash,
      agentId: thought.agentId,
      timestamp: thought.timestamp,
    });

    if (expectedHash !== thought.contentHash) {
      result.valid = false;
      result.errors.push({
        thoughtNumber: thought.thoughtNumber,
        expected: expectedHash,
        actual: thought.contentHash,
      });
    }

    result.verifiedCount++;
  }

  return result;
}
