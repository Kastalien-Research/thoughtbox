/**
 * Cipher Module
 *
 * Protocol layer for structured reasoning. The cipher enables deterministic
 * server-side processing of thought structure without inference.
 *
 * @module src/cipher
 */

export {
  parseCipher,
  usesCipherNotation,
  getReferencedThoughts,
  inferPreviousThought,
  type ParsedCipher,
  type ThoughtType,
  type ThoughtReference,
  type ConfidenceMarker,
  THOUGHT_TYPE_NAMES,
} from "./parser.js";

export {
  inferThoughtStructure,
  createInferenceContext,
  updateInferenceContext,
  type MinimalThoughtInput,
  type InferredThoughtInput,
  type InferenceContext,
} from "./infer-structure.js";
