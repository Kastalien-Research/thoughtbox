/**
 * TS-FIXTURE validators for Spec 04 — Subagent Session Attachment
 *
 * Validates:
 * - V4.6: SubagentOutput.metadata field is Readonly<Record<string, unknown>>
 *
 * @see .specs/cognitive-harness-improvements/04-subagent-session-attachment.md
 * @see .specs/cognitive-harness-improvements/VALIDATORS.md §V4.6
 */

import { expectType } from 'tsd';

// =============================================================================
// V4.6 — SubagentOutput.metadata is Readonly<Record<string, unknown>>
// =============================================================================

/**
 * V4.6: The metadata field on SubagentOutput must be Readonly<Record<string, unknown>>
 * to prevent mutation of subagent-provided metadata after attachment.
 *
 * This maintains data integrity and ensures audit trail is not tampered with.
 */
interface SubagentOutput {
  content: string;
  summary?: string;
  metadata?: Readonly<Record<string, unknown>>;
  completedAt: string;
  durationMs?: number;
  model?: string;
}

// V4.6: Assignment to metadata should be a type error (it's readonly)
function v4_6_readonly_metadata_check() {
  const output: SubagentOutput = {
    content: 'test output',
    completedAt: new Date().toISOString(),
    metadata: { key: 'value' }
  };

  // @ts-expect-error — metadata is Readonly, cannot assign new value
  output.metadata = { newKey: 'newValue' };

  // @ts-expect-error — cannot spread into a new object and assign (mutation attempt)
  const mutatedMetadata = { ...output.metadata, extra: 'field' };
  output.metadata = mutatedMetadata;
}

// V4.6: Reading from metadata should work fine
function v4_6_readonly_read() {
  const output: SubagentOutput = {
    content: 'test output',
    completedAt: new Date().toISOString(),
    metadata: { key: 'value', nested: { a: 1 } }
  };

  // Reading should work
  const val = output.metadata?.['key'];
  expectType<string | undefined>(val);

  const nested = output.metadata?.['nested'] as { a: number } | undefined;
  expectType<{ a: number } | undefined>(nested);

  // Object.keys, Object.entries should work
  const keys = Object.keys(output.metadata ?? {});
  expectType<string[]>(keys);
}

// V4.6: Creating new outputs with metadata should work
function v4_6_creation() {
  const output: SubagentOutput = {
    content: 'test output',
    completedAt: new Date().toISOString(),
    metadata: Object.freeze({ key: 'value' }) // freeze to demonstrate readonly intent
  };

  // This should compile - we're not mutating, just creating
  expectType<string>(output.content);
  expectType<Readonly<Record<string, unknown>> | undefined>(output.metadata);
}
