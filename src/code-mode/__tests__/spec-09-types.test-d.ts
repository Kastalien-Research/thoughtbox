/**
 * TS-FIXTURE validators for Spec 09 — Named Checkpoints
 *
 * Validates:
 * - V9.2: Branded CheckpointLabel — cannot assign raw string
 * - V9.7: isCheckpointThought predicate narrows Thought to CheckpointThought
 *
 * @see .specs/cognitive-harness-improvements/09-named-checkpoints.md
 * @see .specs/cognitive-harness-improvements/VALIDATORS.md §V9.2, V9.7
 */

import { expectType } from 'tsd';

// =============================================================================
// V9.2 — Branded CheckpointLabel type
// =============================================================================

/**
 * V9.2: CheckpointLabel is a branded type using TypeScript's opaque type pattern.
 * Format: lowercase alphanumeric, hyphens, underscores only.
 * Pattern: /^[a-z0-9][a-z0-9_-]*$/
 *
 * This prevents illegal states like empty strings, uppercase, spaces, etc.
 */
type CheckpointLabel = string & { readonly __brand: 'CheckpointLabel' };

/**
 * Creates a CheckpointLabel from a validated string.
 * Throws if the string doesn't match the pattern.
 */
declare function createCheckpointLabel(label: string): CheckpointLabel;

// V9.2: Cannot assign raw string to CheckpointLabel
function v9_2_branded_type_check() {
  // @ts-expect-error — raw string cannot be assigned to branded CheckpointLabel
  const invalid1: CheckpointLabel = 'foo';

  // @ts-expect-error — empty string is invalid
  const invalid2: CheckpointLabel = '';

  // @ts-expect-error — contains spaces is invalid
  const invalid3: CheckpointLabel = 'has spaces';

  // @ts-expect-error — uppercase is invalid
  const invalid4: CheckpointLabel = 'UPPERCASE';

  // @ts-expect-error — starts with underscore is invalid
  const invalid5: CheckpointLabel = '_starts';

  // @ts-expect-error — contains slash is invalid
  const invalid6: CheckpointLabel = 'has/slashes';
}

// V9.2: createCheckpointLabel produces valid CheckpointLabel
function v9_2_factory_function() {
  // Valid labels should work
  const label1 = createCheckpointLabel('auth-analysis-complete');
  const label2 = createCheckpointLabel('data_model_finalized');
  const label3 = createCheckpointLabel('step1');
  const label4 = createCheckpointLabel('init');

  expectType<CheckpointLabel>(label1);
  expectType<CheckpointLabel>(label2);
  expectType<CheckpointLabel>(label3);
  expectType<CheckpointLabel>(label4);
}

// V9.2: CheckpointLabel can be used in type positions
function v9_2_type_usage() {
  interface CheckpointMetadata {
    label: CheckpointLabel;
    summary?: string;
    createdAt: string;
  }

  // Valid usage with factory
  const metadata: CheckpointMetadata = {
    label: createCheckpointLabel('valid-label'),
    summary: 'Checkpoint summary',
    createdAt: new Date().toISOString()
  };

  expectType<CheckpointLabel>(metadata.label);
}

// =============================================================================
// V9.7 — isCheckpointThought predicate narrows Thought to CheckpointThought
// =============================================================================

/**
 * V9.7: isCheckpointThought is a type predicate that narrows Thought to CheckpointThought.
 * Inside the if block, TypeScript knows the thought is a checkpoint.
 */
interface Thought {
  thoughtNumber: number;
  thought: string;
  thoughtType: 'reasoning' | 'decision_frame' | 'action_report' | 'belief_snapshot' | 'assumption_update' | 'context_snapshot' | 'progress';
  timestamp: string;
  nextThoughtNeeded: boolean;
  metadata?: Record<string, unknown>;
}

interface CheckpointMetadata {
  label: CheckpointLabel;
  summary?: string;
  createdAt: string;
}

interface CheckpointThought extends Thought {
  thoughtType: 'progress';
  metadata: Thought['metadata'] & {
    checkpoint: CheckpointMetadata;
  };
}

/**
 * Type predicate that narrows Thought to CheckpointThought
 */
declare function isCheckpointThought(t: Thought): t is CheckpointThought;

// V9.7: Inside the if block, metadata.checkpoint.label is accessible without optional chaining
function v9_7_predicate_narrowing(thought: Thought) {
  if (isCheckpointThought(thought)) {
    // Inside this block, thought is CheckpointThought
    expectType<number>(thought.thoughtNumber);
    expectType<string>(thought.thought);

    // V9.7: metadata.checkpoint.label is guaranteed to exist
    // No optional chaining needed inside this block
    const label: string = thought.metadata.checkpoint.label;
    expectType<string>(label);

    // summary is optional on CheckpointMetadata
    const summary: string | undefined = thought.metadata.checkpoint.summary;
    expectType<string | undefined>(summary);

    // createdAt is always present
    const createdAt: string = thought.metadata.checkpoint.createdAt;
    expectType<string>(createdAt);

    // thoughtType is narrowed to 'progress'
    expectType<'progress'>(thought.thoughtType);
  } else {
    // Outside the if block, thought is still Thought (not CheckpointThought)
    expectType<Thought>(thought);

    // metadata.checkpoint may not exist
    // @ts-expect-error — checkpoint may not exist on non-checkpoint thoughts
    const label: string = thought.metadata.checkpoint.label;
  }
}

// V9.7: Predicate works with arrays
function v9_7_array_filter(thoughts: Thought[]) {
  const checkpoints = thoughts.filter(isCheckpointThought);

  // All elements in checkpoints are CheckpointThoughts
  for (const cp of checkpoints) {
    const label: string = cp.metadata.checkpoint.label;
    expectType<string>(label);
  }

  expectType<CheckpointThought[]>(checkpoints);
}

// V9.7: Predicate works with type narrowing in return positions
function v9_7_return_narrowing(thought: Thought): CheckpointThought | null {
  if (isCheckpointThought(thought)) {
    return thought; // TypeScript knows this is CheckpointThought
  }
  return null;
}
