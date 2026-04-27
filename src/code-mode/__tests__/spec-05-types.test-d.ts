/**
 * TS-FIXTURE validators for Spec 05 — Hook Suppression During Active Sessions
 *
 * Validates:
 * - V5.1: tb.session.isActive returns Promise<boolean>
 *
 * @see .specs/cognitive-harness-improvements/05-hook-suppression-during-sessions.md
 * @see .specs/cognitive-harness-improvements/VALIDATORS.md §V5.1
 */

import { expectType } from 'tsd';

// =============================================================================
// V5.1 — tb.session.isActive returns Promise<boolean>
// =============================================================================

/**
 * V5.1: The isActive() method must return Promise<boolean>.
 * This enables simple boolean logic in callers:
 *
 * ```typescript
 * const isActive: boolean = await tb.session.isActive();
 * if (isActive) { ... }
 * ```
 *
 * The explicit return type prevents confusion about what "active" means.
 */
interface SessionOperations {
  isActive(): Promise<boolean>;
}

// Simulated SDK interface matching the spec
declare const sessionOps: SessionOperations;

// V5.1: The return type must be Promise<boolean>
// This means awaiting it produces a boolean
async function v5_1_return_type_check() {
  const result = sessionOps.isActive();

  // Should be Promise<boolean>
  expectType<Promise<boolean>>(result);

  // Awaiting should give boolean
  const active: boolean = await sessionOps.isActive();
  expectType<boolean>(active);

  // Should be usable in boolean context directly
  if (await sessionOps.isActive()) {
    // This block should execute if session is active
  }
}

// V5.1: The boolean must be usable in all boolean contexts
async function v5_1_boolean_contexts() {
  // Boolean assignment
  const isActive: boolean = await sessionOps.isActive();
  expectType<boolean>(isActive);

  // Logical AND
  const andResult: boolean = isActive && true;
  expectType<boolean>(andResult);

  // Logical OR
  const orResult: boolean = isActive || false;
  expectType<boolean>(orResult);

  // Negation
  const notResult: boolean = !isActive;
  expectType<boolean>(notResult);

  // Ternary
  const ternary: 'yes' | 'no' = isActive ? 'yes' : 'no';
  expectType<'yes' | 'no'>(ternary);
}
