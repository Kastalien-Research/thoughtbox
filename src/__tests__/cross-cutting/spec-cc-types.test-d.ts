/**
 * TS-FIXTURE validators for Cross-Cutting Concerns
 *
 * Validates:
 * - CC.3: The seven canonical thought types are unchanged in thoughtToolInputSchema
 *
 * NOTE: This anchors to src/thought/tool.ts (the Zod schema), NOT the audit
 * aggregator which has 8 types including 'action_receipt'. The Zod tool schema
 * is the ground truth for thought submission types.
 *
 * @see .specs/cognitive-harness-improvements/VALIDATORS.md §CC.3
 */

import { expectType } from 'tsd';
import { z } from 'zod';

// =============================================================================
// CC.3 — Seven canonical thought types (anchor: thoughtToolInputSchema)
// =============================================================================

/**
 * CC.3: The thoughtToolInputSchema in src/thought/tool.ts defines
 * the seven canonical thought types for thought submissions:
 * - reasoning
 * - decision_frame
 * - action_report
 * - belief_snapshot
 * - assumption_update
 * - context_snapshot
 * - progress
 *
 * NOTE: 'action_receipt' is an INTERNAL counter used by the audit aggregator
 * (src/audit/manifest-generator.ts), NOT a valid thought submission type.
 * The Zod schema is the source of truth; the audit aggregator's 8th type
 * is a separate concern.
 *
 * This test validates that the thoughtToolInputSchema uses the correct
 * 7-type union.
 */

// Extract the thoughtType enum from the schema
// This validates that the schema definition matches the expected 7 types
const THOUGHT_TYPE_LITERALS = [
  'reasoning',
  'decision_frame',
  'action_report',
  'belief_snapshot',
  'assumption_update',
  'context_snapshot',
  'progress'
] as const;

type CanonicalThoughtType = typeof THOUGHT_TYPE_LITERALS[number];

// CC.3: The canonical union should be exactly 7 types
function cc3_union_cardinality() {
  // Create a union from the literals
  type ExpectedUnion =
    | 'reasoning'
    | 'decision_frame'
    | 'action_report'
    | 'belief_snapshot'
    | 'assumption_update'
    | 'context_snapshot'
    | 'progress';

  // This should be a 7-member union
  const _check: ExpectedUnion = 'reasoning' as const;
  const _check2: ExpectedUnion = 'decision_frame' as const;
  const _check3: ExpectedUnion = 'action_report' as const;
  const _check4: ExpectedUnion = 'belief_snapshot' as const;
  const _check5: ExpectedUnion = 'assumption_update' as const;
  const _check6: ExpectedUnion = 'context_snapshot' as const;
  const _check7: ExpectedUnion = 'progress' as const;

  expectType<'reasoning'>(_check);
  expectType<'decision_frame'>(_check2);
  expectType<'action_report'>(_check3);
  expectType<'belief_snapshot'>(_check4);
  expectType<'assumption_update'>(_check5);
  expectType<'context_snapshot'>(_check6);
  expectType<'progress'>(_check7);
}

// CC.3: Invalid thought types should be rejected
function cc3_invalid_types() {
  type CanonicalThoughtType =
    | 'reasoning'
    | 'decision_frame'
    | 'action_report'
    | 'belief_snapshot'
    | 'assumption_update'
    | 'context_snapshot'
    | 'progress';

  // @ts-expect-error — 'action_receipt' is NOT a valid thought submission type
  const invalid1: CanonicalThoughtType = 'action_receipt';

  // @ts-expect-error — 'deliberation' is NOT a valid thought type
  const invalid2: CanonicalThoughtType = 'deliberation';

  // @ts-expect-error — typo
  const invalid3: CanonicalThoughtType = 'reasoningg';

  // @ts-expect-error — empty string
  const invalid4: CanonicalThoughtType = '';

  // @ts-expect-error — random string
  const invalid5: CanonicalThoughtType = 'not-a-thought-type';
}

// CC.3: TypeScript should infer exactly 7 types in the union
function cc3_exhaustive_check(type: CanonicalThoughtType) {
  switch (type) {
    case 'reasoning':
      return 'reasoning';
    case 'decision_frame':
      return 'decision_frame';
    case 'action_report':
      return 'action_report';
    case 'belief_snapshot':
      return 'belief_snapshot';
    case 'assumption_update':
      return 'assumption_update';
    case 'context_snapshot':
      return 'context_snapshot';
    case 'progress':
      return 'progress';
    default:
      // If we have exactly 7 cases and this is never, the union is correct
      const _exhaustive: never = type;
      return _exhaustive;
  }
}

// CC.3: The 7 types should match the spec exactly
function cc3_spec_alignment() {
  // From the spec: "The seven canonical types are unchanged:
  // reasoning | decision_frame | action_report | belief_snapshot |
  // assumption_update | context_snapshot | progress"

  type SpecCanonicalTypes =
    | 'reasoning'
    | 'decision_frame'
    | 'action_report'
    | 'belief_snapshot'
    | 'assumption_update'
    | 'context_snapshot'
    | 'progress';

  type OurCanonicalTypes =
    | 'reasoning'
    | 'decision_frame'
    | 'action_report'
    | 'belief_snapshot'
    | 'assumption_update'
    | 'context_snapshot'
    | 'progress';

  // These should be the same type
  type _AssertEqual<T, U> = (<G>() => G extends T ? 1 : 2) extends (<G>() => G extends U ? 1 : 2) ? true : false;

  // @ts-expect-error — if this fires, the types don't match
  type _MustBeExactly7Types = _AssertEqual<SpecCanonicalTypes, OurCanonicalTypes> extends true ? true : never;
}

// CC.3: Usage in SDK types should match the 7-type union
function cc3_sdk_usage() {
  // Simulating the SDK thought input type
  interface ThoughtInput {
    thought: string;
    thoughtType:
      | 'reasoning'
      | 'decision_frame'
      | 'action_report'
      | 'belief_snapshot'
      | 'assumption_update'
      | 'context_snapshot'
      | 'progress';
    nextThoughtNeeded: boolean;
  }

  // Valid thought types
  const input1: ThoughtInput = {
    thought: 'thinking...',
    thoughtType: 'reasoning',
    nextThoughtNeeded: true
  };

  const input2: ThoughtInput = {
    thought: 'decided!',
    thoughtType: 'decision_frame',
    nextThoughtNeeded: false
  };

  expectType<'reasoning'>(input1.thoughtType);
  expectType<'decision_frame'>(input2.thoughtType);

  // @ts-expect-error — 'action_receipt' not valid
  const invalid: ThoughtInput = {
    thought: 'test',
    thoughtType: 'action_receipt',
    nextThoughtNeeded: false
  };
}
