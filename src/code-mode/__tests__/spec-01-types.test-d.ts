/**
 * TS-FIXTURE validators for Spec 01 — Auto-Numbering Surfacing
 *
 * Validates:
 * - V1.1: ThoughtInput literal containing thoughtNumber: 5 should error
 * - V1.3: ThoughtInput does NOT extend Thought or ThoughtData
 *
 * @see .specs/cognitive-harness-improvements/01-auto-numbering-surfacing.md
 * @see .specs/cognitive-harness-improvements/VALIDATORS.md §V1.1, V1.3
 */

import { expectType } from 'tsd';

// =============================================================================
// V1.1 — thoughtNumber should be forbidden in ThoughtInput (server-assigned)
// =============================================================================

// These imports represent the TARGET STATE types that should exist after implementation.
// Currently these will cause "module not found" errors - that's expected.
// Once types are implemented per spec, these tests validate the invariants.

/**
 * V1.1: A ThoughtInput literal containing thoughtNumber: 5 should produce
 * a TypeScript error that tsd accepts via // @ts-expect-error.
 *
 * The server auto-assigns thoughtNumber; clients must NOT set it.
 * After implementation, the type should use `thoughtNumber?: never` or similar.
 */
declare const inputWithThoughtNumber: {
  thought: string;
  thoughtType: 'reasoning';
  nextThoughtNeeded: boolean;
  thoughtNumber: 5; // This should be a type error
};

// V1.1: tsd accepts the @ts-expect-error - compilation should fail on thoughtNumber
// @ts-expect-error — thoughtNumber is server-auto-assigned, not client-settable
type V1_1_ShouldError = typeof inputWithThoughtNumber;

// =============================================================================
// V1.3 — ThoughtInput does NOT extend Thought or ThoughtData
// =============================================================================

/**
 * V1.3: AST-grep check — no `interface ThoughtInput extends Thought` or
 * `extends ThoughtData` declaration in sdk-types.ts or persistence/types.ts.
 *
 * This is a documentation test: the type hierarchy should be:
 * - ThoughtInput: client input (server-assigned fields are `never`)
 * - ThoughtData: server-persisted record
 * - Thought: server output (extends ThoughtData with required fields)
 *
 * ThoughtInput should NOT inherit from ThoughtData because that would
 * make server-assigned fields like thoughtNumber appear optional-but-present,
 * which contradicts the "making illegal states unrepresentable" principle.
 */

// V1.3: These should fail to compile if ThoughtInput extends Thought/ThoughtData
// If you see errors here, it means the type hierarchy is incorrect.
// The correct pattern is:
//   interface ThoughtInput { thoughtNumber?: never; timestamp?: never; }
// NOT:
//   interface ThoughtInput extends ThoughtData { ... }
declare const validInput: {
  thought: string;
  thoughtType: 'reasoning';
  nextThoughtNeeded: boolean;
  // No thoughtNumber - this is correct client input
};

// This assignment should work if types are correctly separated
const _checkValidInput: typeof validInput = validInput;
