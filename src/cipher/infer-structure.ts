/**
 * Structure Inference from Cipher
 *
 * Transforms cipher-encoded content into thought handler input.
 * This is the bridge between the minimal schema (just `thought`) and
 * the full structure the server needs.
 *
 * @module src/cipher/infer-structure
 */

import {
  parseCipher,
  type ParsedCipher,
  type ThoughtType,
  inferPreviousThought,
} from "./parser.js";

/**
 * Minimal input - what the agent sends
 */
export interface MinimalThoughtInput {
  thought: string;
  // Optional overrides (for backwards compatibility or explicit control)
  thoughtNumber?: number;
  nextThoughtNeeded?: boolean;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
}

/**
 * Full input - what the thought handler expects
 */
export interface InferredThoughtInput {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  nextThoughtNeeded: boolean;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  // Inferred metadata
  _inferred: {
    usedCipher: boolean;
    type?: ThoughtType;
    references: number[];
    confidence?: string;
    previousThought?: number;
  };
}

/**
 * State needed for inference
 */
export interface InferenceContext {
  /** Current thought count in session */
  currentThoughtNumber: number;
  /** Estimated total thoughts (can be adjusted) */
  estimatedTotal: number;
  /** Branch heads - track latest thought per branch */
  branchHeads: Map<string, number>;
}

/**
 * Infer full thought structure from minimal cipher-encoded input
 *
 * @param input - Minimal input (just thought string, maybe some overrides)
 * @param context - Current session context for auto-incrementing
 * @returns Full thought input with inferred structure
 */
export function inferThoughtStructure(
  input: MinimalThoughtInput,
  context: InferenceContext
): InferredThoughtInput {
  // Parse the cipher content
  const parsed = parseCipher(input.thought);

  // Determine thought number:
  // 1. Explicit override in input
  // 2. Extracted from cipher (S47|...)
  // 3. Auto-increment from context
  const thoughtNumber =
    input.thoughtNumber ?? parsed.thoughtNumber ?? context.currentThoughtNumber + 1;

  // Determine if this is a revision
  const isRevision = input.isRevision ?? (parsed.revises !== undefined);
  const revisesThought = input.revisesThought ?? parsed.revises;

  // Determine branch info
  // If cipher encodes a branch reference, extract it
  // (Note: branchId in cipher would need explicit syntax - not currently supported)
  const branchFromThought = input.branchFromThought;
  const branchId = input.branchId;

  // Determine if more thoughts needed
  // Conclusion type (C) suggests no more needed unless explicitly set
  const isConclusion = parsed.type === "C";
  const nextThoughtNeeded =
    input.nextThoughtNeeded ?? (isConclusion ? false : true);

  // Estimate total thoughts
  // Start generous, agent can signal conclusion early
  const totalThoughts = Math.max(context.estimatedTotal, thoughtNumber + 5);

  // Get previous thought for linking
  const previousThought = inferPreviousThought(parsed);

  return {
    thought: input.thought,
    thoughtNumber,
    totalThoughts,
    nextThoughtNeeded,
    isRevision: isRevision || undefined,
    revisesThought,
    branchFromThought,
    branchId,
    _inferred: {
      usedCipher: parsed.usedStepFormat,
      type: parsed.type,
      references: parsed.references.map((r) => r.thoughtNumber),
      confidence: parsed.confidence?.raw,
      previousThought: previousThought ?? undefined,
    },
  };
}

/**
 * Create initial inference context for a new session
 */
export function createInferenceContext(): InferenceContext {
  return {
    currentThoughtNumber: 0,
    estimatedTotal: 10, // Start with reasonable estimate
    branchHeads: new Map(),
  };
}

/**
 * Update context after processing a thought
 */
export function updateInferenceContext(
  context: InferenceContext,
  processedThought: InferredThoughtInput
): InferenceContext {
  const newContext = {
    ...context,
    currentThoughtNumber: Math.max(
      context.currentThoughtNumber,
      processedThought.thoughtNumber
    ),
    branchHeads: new Map(context.branchHeads),
  };

  // Track branch heads
  if (processedThought.branchId) {
    newContext.branchHeads.set(
      processedThought.branchId,
      processedThought.thoughtNumber
    );
  }

  // Adjust total estimate if we're getting close
  if (processedThought.thoughtNumber > context.estimatedTotal - 3) {
    newContext.estimatedTotal = processedThought.thoughtNumber + 10;
  }

  return newContext;
}

/**
 * Example usage:
 *
 * ```typescript
 * const context = createInferenceContext();
 *
 * // Agent sends minimal input
 * const input = { thought: "S1|H|-|API latency might be caused by db regression" };
 *
 * // Server infers full structure
 * const full = inferThoughtStructure(input, context);
 * // full.thoughtNumber = 1
 * // full.type = "H"
 * // full.nextThoughtNeeded = true
 *
 * // Update context
 * const newContext = updateInferenceContext(context, full);
 *
 * // Next thought
 * const input2 = { thought: "S2|E|S1|query metrics show p99 ↑3x ⊕ [H1]" };
 * const full2 = inferThoughtStructure(input2, newContext);
 * // full2.thoughtNumber = 2
 * // full2._inferred.references = [1]
 * ```
 */
