/**
 * Conflict Detection — Cross-Branch Contradiction Detection
 *
 * Compares extracted claims across branches/agents to detect:
 * - Direct contradictions: CLAIM: X vs CLAIM: ¬X
 * - Derivation conflicts: A ⊢ P vs B ⊢ ¬P
 *
 * @module src/multi-agent/conflict-detection
 */

import { parseClaims, normalizeClaim, type ExtractedClaim } from './claim-parser.js';
import type { ThoughtData } from '../persistence/types.js';

/**
 * A detected conflict between two claims.
 */
export interface Conflict {
  /** The two claims that conflict */
  claimA: ExtractedClaim;
  claimB: ExtractedClaim;
  /** Agent who made claim A */
  agentA?: string;
  /** Agent who made claim B */
  agentB?: string;
  /** Thought number containing claim A */
  thoughtNumberA: number;
  /** Thought number containing claim B */
  thoughtNumberB: number;
  /** Branch containing claim A */
  branchA?: string;
  /** Branch containing claim B */
  branchB?: string;
  /** Type of conflict */
  type: 'direct_contradiction' | 'derivation_conflict';
}

/**
 * Result of conflict detection.
 */
export interface ConflictResult {
  conflicts: Conflict[];
  totalClaims: number;
}

/**
 * Internal representation of a claim with its source metadata.
 */
interface AnnotatedClaim {
  claim: ExtractedClaim;
  agentId?: string;
  thoughtNumber: number;
  branchId?: string;
}

/**
 * Detect conflicts among claims extracted from a set of thoughts.
 *
 * @param thoughts - Array of thoughts to analyze for conflicts
 * @returns Detected conflicts
 */
export function detectConflicts(thoughts: ThoughtData[]): ConflictResult {
  // 1. Extract all claims with source metadata
  const annotated: AnnotatedClaim[] = [];

  for (const thought of thoughts) {
    const parsed = parseClaims(thought.thought);

    for (const claim of parsed.claims) {
      annotated.push({
        claim,
        agentId: thought.agentId,
        thoughtNumber: thought.thoughtNumber,
        branchId: thought.branchId,
      });
    }
  }

  if (annotated.length === 0) {
    return { conflicts: [], totalClaims: 0 };
  }

  // 2. Compare claims pairwise for contradictions
  const conflicts: Conflict[] = [];

  for (let i = 0; i < annotated.length; i++) {
    for (let j = i + 1; j < annotated.length; j++) {
      const a = annotated[i];
      const b = annotated[j];

      const conflict = checkContradiction(a, b);
      if (conflict) {
        conflicts.push(conflict);
      }
    }
  }

  return {
    conflicts,
    totalClaims: annotated.length,
  };
}

/**
 * Check if two annotated claims contradict each other.
 */
function checkContradiction(a: AnnotatedClaim, b: AnnotatedClaim): Conflict | null {
  // Direct contradiction: one negates the other
  // CLAIM: X vs CLAIM: ¬X or REFUTE: X
  const normA = normalizeClaim(a.claim.content);
  const normB = normalizeClaim(b.claim.content);

  // Case 1: One is explicitly negated version of the other
  if (isNegation(a.claim, b.claim, normA, normB)) {
    return {
      claimA: a.claim,
      claimB: b.claim,
      agentA: a.agentId,
      agentB: b.agentId,
      thoughtNumberA: a.thoughtNumber,
      thoughtNumberB: b.thoughtNumber,
      branchA: a.branchId,
      branchB: b.branchId,
      type: 'direct_contradiction',
    };
  }

  // Case 2: CLAIM vs REFUTE of same content
  if (a.claim.type === 'claim' && b.claim.type === 'refute' && contentOverlaps(normA, normB)) {
    return {
      claimA: a.claim,
      claimB: b.claim,
      agentA: a.agentId,
      agentB: b.agentId,
      thoughtNumberA: a.thoughtNumber,
      thoughtNumberB: b.thoughtNumber,
      branchA: a.branchId,
      branchB: b.branchId,
      type: 'direct_contradiction',
    };
  }

  if (b.claim.type === 'claim' && a.claim.type === 'refute' && contentOverlaps(normB, normA)) {
    return {
      claimA: a.claim,
      claimB: b.claim,
      agentA: a.agentId,
      agentB: b.agentId,
      thoughtNumberA: a.thoughtNumber,
      thoughtNumberB: b.thoughtNumber,
      branchA: a.branchId,
      branchB: b.branchId,
      type: 'direct_contradiction',
    };
  }

  return null;
}

/**
 * Check if one claim is the negation of the other.
 */
function isNegation(
  a: ExtractedClaim,
  b: ExtractedClaim,
  normA: string,
  normB: string
): boolean {
  // One is negated, other is not, and they share content
  if (a.negated !== b.negated) {
    // Strip negation symbol and compare
    const strippedA = normA.replace(/¬/g, '').replace(/\(|\)/g, '').trim();
    const strippedB = normB.replace(/¬/g, '').replace(/\(|\)/g, '').trim();

    if (strippedA === strippedB) return true;
    if (strippedA.includes(strippedB) || strippedB.includes(strippedA)) return true;
  }

  return false;
}

/**
 * Check if two normalized claims have significant content overlap.
 */
function contentOverlaps(normA: string, normB: string): boolean {
  // Strip negation from refute side
  const cleanA = normA.replace(/¬/g, '').replace(/\(|\)/g, '').trim();
  const cleanB = normB.replace(/¬/g, '').replace(/\(|\)/g, '').trim();

  if (cleanA === cleanB) return true;
  if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;

  return false;
}
