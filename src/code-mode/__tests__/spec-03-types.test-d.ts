/**
 * TS-FIXTURE validators for Spec 03 — Mid-Session Recall Primitives
 *
 * Validates:
 * - V3.6: Returned arrays are `readonly Thought[]`
 *
 * @see .specs/cognitive-harness-improvements/03-mid-session-recall-primitives.md
 * @see .specs/cognitive-harness-improvements/VALIDATORS.md §V3.6
 */

import { expectType } from 'tsd';

// =============================================================================
// V3.6 — Returned arrays are `readonly Thought[]`
// =============================================================================

/**
 * V3.6: Returned arrays from session recall primitives must be readonly.
 * Mutation of session data via returned arrays must be a type error.
 *
 * Operations that return readonly arrays:
 * - tb.session.recentThoughts(count?: number): Promise<readonly Thought[]>
 * - tb.session.searchWithin(query: string, options?: SearchWithinOptions): Promise<readonly Thought[]>
 *
 * The readonly modifier prevents callers from accidentally mutating session data.
 * This is a compile-time enforcement of "making illegal states unrepresentable".
 */

/**
 * Mock Thought type for testing readonly inference.
 * In production, this would be imported from the actual types.
 */
interface Thought {
  thoughtNumber: number;
  thought: string;
  thoughtType: 'reasoning' | 'decision_frame' | 'action_report' | 'belief_snapshot' | 'assumption_update' | 'context_snapshot' | 'progress';
  timestamp: string;
  nextThoughtNeeded: boolean;
}

/**
 * Simulates the return type of tb.session.recentThoughts()
 * The readonly modifier is REQUIRED per spec.
 */
declare function recentThoughts(count: number): Promise<readonly Thought[]>;

/**
 * Simulates the return type of tb.session.searchWithin()
 * The readonly modifier is REQUIRED per spec.
 */
declare function searchWithin(query: string): Promise<readonly Thought[]>;

// V3.6: Attempting to mutate a returned readonly array should be a type error
async function v3_6_readonly_check() {
  const recent = await recentThoughts(5);
  const found = await searchWithin('test');

  // These mutations should all be type errors:
  // @ts-expect-error — cannot assign to readonly array
  recent[0] = { thoughtNumber: 1, thought: 'mutated', thoughtType: 'reasoning' as const, timestamp: new Date().toISOString(), nextThoughtNeeded: false };

  // @ts-expect-error — cannot push to readonly array
  recent.push({ thoughtNumber: 99, thought: 'pushed', thoughtType: 'reasoning' as const, timestamp: new Date().toISOString(), nextThoughtNeeded: false });

  // @ts-expect-error — cannot splice readonly array
  recent.splice(0, 1);

  // @ts-expect-error — cannot assign to property of readonly array element
  recent[0].thought = 'mutated thought';

  // Same checks for searchWithin results
  // @ts-expect-error — cannot assign to readonly array
  found[0] = { thoughtNumber: 1, thought: 'mutated', thoughtType: 'reasoning' as const, timestamp: new Date().toISOString(), nextThoughtNeeded: false };

  // @ts-expect-error — cannot assign to property of readonly array element
  found[0].thought = 'mutated thought';
}

// V3.6: Reading from readonly arrays should work fine
async function v3_6_readonly_read() {
  const recent = await recentThoughts(5);

  // These reads should compile without errors
  const first: Thought = recent[0];
  const all = recent.map(t => t.thoughtNumber);
  const filtered = recent.filter(t => t.thoughtType === 'reasoning');

  expectType<Thought>(first);
  expectType<number[]>(all);
  expectType<readonly Thought[]>(filtered);
}
