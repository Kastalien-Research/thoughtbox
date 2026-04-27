/**
 * TypeScript type declarations for the `tb` SDK object.
 * Embedded in the thoughtbox_execute tool description so the LLM
 * gets type hints without loading operation catalogs.
 *
 * IMPORTANT: This file must stay in sync with the source Zod schemas:
 * - thought:       src/thought/tool.ts (thoughtToolInputSchema)
 * - session:       src/sessions/tool.ts (sessionToolInputSchema)
 * - knowledge:     src/knowledge/tool.ts (knowledgeToolInputSchema)
 * - notebook:      src/notebook/tool.ts (notebookToolInputSchema)
 * - theseus:       src/protocol/theseus-tool.ts (theseusToolInputSchema)
 * - ulysses:       src/protocol/ulysses-tool.ts (ulyssesToolInputSchema)
 * - observability: src/observability/gateway-handler.ts (ObservabilityInputSchema)
 */

import type { ThoughtData } from "../persistence/types.js";

// =============================================================================
// Spec 06: Cipher Mode Toggle - Session-Level and Per-Thought Cipher Control
// =============================================================================

/**
 * Session-level cipher mode controlling how cipher extension operates.
 * - "auto": Cipher extension activates automatically based on content sensitivity signals
 * - "manual": Cipher extension only activates when explicitly requested per-thought
 * - "off": Cipher extension is disabled for the entire session
 */
export type CipherMode = "auto" | "manual" | "off";

/**
 * Represents the effective cipher decision for a thought.
 * This is computed from session.cipherMode + thought.cipher flag.
 * 
 * The semantic constraint: cipherMode:"off" is absolute - per-thought cipher:true
 * is IGNORED (not an error) when session cipherMode is "off".
 */
export type EffectiveCipherDecision =
  | { decision: "cipher"; reason: "auto_signal" | "manual_request" }
  | { decision: "skip"; reason: "auto_signal_clear" | "manual_opt_out" | "mode_off" };

// =============================================================================
// Spec 09: Named Checkpoints - Branded Type for URL-Safe Checkpoint Labels
// =============================================================================

/**
 * Brand utility type for creating branded types.
 */
declare const __brand: unique symbol;
type Brand<T, B> = T & { readonly [__brand]: B };

/**
 * Branded type for URL-safe checkpoint labels.
 * Format: lowercase, alphanumeric, hyphens, underscores only.
 * Examples: "auth-analysis-complete", "data_model_finalized", "step-1-of-3"
 */
type CheckpointLabel = Brand<string, "CheckpointLabel">;

/**
 * Validate and coerce a string to CheckpointLabel.
 * Throws if the string doesn't match the pattern.
 */
function createCheckpointLabel(label: string): CheckpointLabel {
  const pattern = /^[a-z0-9][a-z0-9_-]*$/;
  if (!pattern.test(label)) {
    throw new Error(
      `Invalid checkpoint label "${label}". ` +
      `Must match pattern /^[a-z0-9][a-z0-9_-]*$/: ` +
      `lowercase alphanumeric, starting with letter or digit, ` +
      `with hyphens and underscores allowed.`
    );
  }
  return label as CheckpointLabel;
}

/**
 * Check if a string is a valid checkpoint label (without throwing).
 */
function isValidCheckpointLabel(label: string): label is CheckpointLabel {
  return /^[a-z0-9][a-z0-9_-]*$/.test(label);
}

/**
 * The checkpoint metadata payload, always present on a CheckpointThought.
 */
interface CheckpointMetadata {
  /** Type-safe, URL-safe label. */
  label: CheckpointLabel;
  /** Human-readable summary, if provided at creation time. */
  summary?: string;
  /** Server-assigned ISO 8601 timestamp at which the checkpoint was created. */
  createdAt: string;
}

/**
 * A Thought that is also a checkpoint.
 *
 * Refines the base Thought by:
 *   - narrowing `thoughtType` to the literal "progress"
 *   - guaranteeing `metadata.checkpoint: CheckpointMetadata` is present (not optional)
 *
 * All other fields inherited from Thought (thoughtNumber, timestamp, etc.)
 * retain their semantics.
 */
interface CheckpointThought extends ThoughtData {
  thoughtType: "progress";
  /** At creation time: `summary ?? \`Checkpoint: ${label}\``. */
  thought: string;
  metadata: {
    checkpoint: CheckpointMetadata;
  };
}

/**
 * Type predicate for narrowing from Thought to CheckpointThought.
 * Note: Uses type assertion because the actual Thought type doesn't have metadata,
 * but CheckpointThought (per Spec 09) has metadata.checkpoint.
 */
function isCheckpointThought(t: ThoughtData): t is CheckpointThought {
  return t.thoughtType === "progress"
      && (t as unknown as { metadata?: { checkpoint?: CheckpointMetadata } }).metadata?.checkpoint !== undefined
      && isValidCheckpointLabel((t as unknown as { metadata: { checkpoint: CheckpointMetadata } }).metadata.checkpoint.label);
}

// =============================================================================
// Spec 08: Per-Session-Type Audit - SessionType Metadata for Audit Gap Detection
// =============================================================================

/**
 * Enumerated session types for audit gap detection.
 * Each type has different expected reasoning patterns.
 */
export type SessionType =
  | "research"
  | "decision"
  | "implementation"
  | "debugging"
  | "exploration";

/**
 * Session creation parameters including type.
 */
export interface SessionCreateParams {
  title: string;
  sessionType?: SessionType;
  // ... other params
}

/**
 * Session with type metadata.
 */
export interface Session {
  id: string;
  title: string;
  sessionType: SessionType;
  // ... other fields
}

/**
 * Thought type for use in gap detection rules.
 */
type ThoughtType = ThoughtData["thoughtType"];

/**
 * Expected patterns and gap detection rules per session type.
 */
export interface GapDetectionRule {
  expectedThoughts?: ThoughtType[];
  unexpectedThoughts?: ThoughtType[];
  minCount?: number;
  requiredState?: "committed";  // For decision frames
  requiredContent?: string;     // Substring that must appear
  gapSeverity: "warning" | "error" | null;
  description: string;
}

/**
 * Audit gap detection rules keyed by session type.
 */
export const SESSION_TYPE_RULES: Record<SessionType, GapDetectionRule> = {
  research: {
    expectedThoughts: ["belief_snapshot"],
    minCount: 2,
    gapSeverity: "warning",
    description: "Multiple belief snapshots expected; ends with synthesized insight"
  },

  decision: {
    expectedThoughts: ["decision_frame"],
    requiredState: "committed",
    gapSeverity: "error",
    description: "At least one committed decision_frame expected"
  },

  implementation: {
    expectedThoughts: ["action_report"],
    unexpectedThoughts: ["belief_snapshot"],
    gapSeverity: "warning",
    description: "action_report thoughts expected; belief snapshots unexpected"
  },

  debugging: {
    expectedThoughts: ["action_report"],
    requiredContent: "root cause",
    gapSeverity: "error",
    description: "action_report identifying root cause expected"
  },

  exploration: {
    // No strict expectations
    gapSeverity: null,  // No alerts for exploration
    description: "Flexible; minimal constraints"
  }
};

/**
 * Types of audit gaps that can be detected.
 */
export type AuditGapType =
  | "insufficient_belief_snapshots"   // research session
  | "no_committed_decision"            // decision session
  | "unexpected_belief_snapshots"      // implementation session
  | "no_root_cause_identified";       // debugging session

/**
 * Audit gap metadata attached to thoughts that trigger gaps.
 */
export interface AuditGap {
  /**
   * Type of gap detected.
   */
  type: AuditGapType;

  /**
   * Severity of the gap.
   */
  severity: "warning" | "error";

  /**
   * Human-readable description of the gap.
   */
  message: string;

  /**
   * The session type that triggered this check.
   */
  sessionType: SessionType;

  /**
   * Expected vs actual counts (if applicable).
   */
  details?: {
    expected?: number;
    actual?: number;
    expectedTypes?: ThoughtType[];
    actualTypes?: ThoughtType[];
  };
}

/**
 * Session operations including update method for changing session type.
 */
export interface SessionOperations {
  /**
   * Update session metadata.
   * Can change sessionType if context shifts.
   */
  update(attrs: { sessionType?: SessionType }): Promise<Session>;

  // =============================================================================
  // Spec 03: Mid-Session Recall Primitives
  // =============================================================================

  /**
   * Retrieves a specific thought by its ordinal number.
   * @returns Thought | null - null if thoughtNumber is out of bounds
   */
  getThought(thoughtNumber: number): Promise<Thought | null>;

  /**
   * Returns the most recent thoughts in the session.
   * @param count - Number of recent thoughts to return (default: 10)
   * @returns Ordered from oldest to newest within the returned slice
   */
  recentThoughts(count?: number): Promise<readonly Thought[]>;

  /**
   * Full-text search across thoughts in the current session.
   * @param query - Search query
   * @param options - Optional search configuration
   * @returns Thoughts ordered from newest to oldest
   */
  searchWithin(query: string, options?: SearchWithinOptions): Promise<readonly Thought[]>;

  // =============================================================================
  // Spec 05: Hook Suppression During Active Sessions
  // =============================================================================

  /**
   * Check if there is currently an active Thoughtbox session.
   * @returns true if an active session exists, false otherwise
   *
   * A session is considered "active" when:
   * 1. A ThoughtboxSession has been created (via tb.session.create() or tb.think())
   * 2. The configured activity timeout has not been exceeded since the last thought submission
   * 3. The session has not been explicitly ended via tb.session.end()
   */
  isActive(): Promise<boolean>;

  /**
   * End the current session, marking it as complete.
   * This immediately restores nudge behavior regardless of timeout setting.
   */
  end(): Promise<Session>;
}

// =============================================================================
// Spec 10: Knowledge Graph Persistence Shortcut - KG Persistence Types
// =============================================================================

/**
 * Visibility levels for knowledge graph entities.
 * Controls which agents/users/teams can access the entity.
 */
export type Visibility = "public" | "agent-private" | "user-private" | "team-private";

/**
 * Configuration for persisting a thought as a knowledge graph entity.
 * Used as a shortcut to automatically create KG entities from thought content.
 */
export interface PersistAsConfig {
  /** Entity name in knowledge graph (must be unique within type) */
  name: string;
  /** Defaults to "agent-private" if not specified */
  visibility?: Visibility;
  /** Optional: existing entity ID to link via BUILDS_ON relation */
  relationTo?: string;
}

/**
 * Extended persist config for assumption-related thoughts.
 * Includes the previous assumption status for tracking assumption history.
 */
export interface AssumptionPersistAsConfig extends PersistAsConfig {
  /** The status of the assumption before this change */
  previousStatus?: "believed" | "uncertain" | "refuted";
}

/**
 * Error codes for KG persistence failures.
 */
export type KGPersistErrorCode =
  | "ENTITY_NAME_CONFLICT"   // Entity with this name already exists
  | "RELATION_TARGET_NOT_FOUND"  // relationTo target entity doesn't exist
  | "VISIBILITY_DENIED"      // User lacks permission for requested visibility
  | "STORAGE_ERROR"          // Underlying storage failure
  | "UNKNOWN_ERROR";         // Catch-all for unexpected failures

/**
 * Error details for KG persistence failures.
 * Populated in thought metadata when KG persistence fails.
 */
export interface KGPersistErrorDetails {
  /** The entity name that caused the conflict (if applicable) */
  attemptedName?: string;
  /** The relation target that was not found (if applicable) */
  attemptedRelationTo?: string;
  /** The existing entity ID if conflict was due to duplicate name */
  existingEntityId?: string;
}

/**
 * Error returned when KG persistence fails.
 * Stored in thought metadata.kgPersistError on failure.
 */
export interface KGPersistError {
  /** Machine-readable error code */
  code: KGPersistErrorCode;
  /** Human-readable error message */
  message: string;
  /** Additional context about the error */
  details?: KGPersistErrorDetails;
  /** ISO 8601 timestamp when the error occurred */
  timestamp: string;
}

/**
 * Success result for KG persistence.
 * Stored in thought metadata.kgPersistSuccess on success.
 */
export interface KGPersistSuccess {
  /** The created entity's UUID */
  entityId: string;
  /** The entity's name (as provided in persistAs config) */
  entityName: string;
  /** ISO 8601 timestamp when persistence succeeded */
  timestamp: string;
}

/**
 * Extended thought metadata with KG persistence fields.
 * These fields are present ONLY when KG persistence is attempted.
 */
export interface ThoughtMetadata {
  // NOTE: Other fields may exist from other specs
  /** Present ONLY if KG persistence failed */
  kgPersistError?: KGPersistError;
  /** Present ONLY if KG persistence succeeded */
  kgPersistSuccess?: KGPersistSuccess;
}

// =============================================================================
// Spec 11: Structured Return Schemas - Validation and Output Types
// =============================================================================

/**
 * A single validation error for structured output parsing.
 * Describes what was expected vs what was received at a specific JSON path.
 */
export interface ValidationError {
  /** JSON path to the invalid field, e.g., "$.rootCause" */
  readonly path: string;
  /** Human-readable description of the expected type/format */
  readonly expected: string;
  /** The actual value that was received */
  readonly received: unknown;
  /** Optional additional context about why validation failed */
  readonly reason?: string;
}

/**
 * Error that occurs when trying to parse the raw output as JSON.
 * Contains location information if available.
 */
export interface ParsingError {
  /** Error message describing the parse failure */
  readonly message: string;
  /** Character offset where parsing failed (if detectable) */
  readonly offset?: number;
  /** Line number where parsing failed (if detectable) */
  readonly line?: number;
  /** Column number where parsing failed (if detectable) */
  readonly column?: number;
}

/**
 * JSON Schema type for type references.
 * Used in structured output validation schemas.
 */
export interface JSONSchema {
  /** JSON Schema type keyword */
  type?: string;
  /** For object types, the properties schema */
  properties?: Record<string, JSONSchema>;
  /** Required properties for objects */
  required?: string[];
  /** For array types, the items schema */
  items?: JSONSchema;
  /** Enum values */
  enum?: unknown[];
  /** Schema description */
  description?: string;
  /** Additional schema keywords */
  [key: string]: unknown;
}

/**
 * Error thrown when subagent output fails schema validation.
 * Discriminant: type === "structured_output_error"
 * 
 * Use this for type narrowing:
 * ```ts
 * if (error.type === "structured_output_error") {
 *   // error.validationErrors is accessible here
 * }
 * ```
 */
export interface StructuredOutputError {
  /** Discriminant for type narrowing - always "structured_output_error" */
  readonly type: "structured_output_error";
  /** Human-readable error message */
  readonly message: string;
  /** The raw string output from the subagent */
  readonly rawOutput: string;
  /** List of validation errors found */
  readonly validationErrors: readonly ValidationError[];
  /** The schema that the output was validated against */
  readonly expectedSchema: JSONSchema;
  /** ISO 8601 timestamp when validation failed */
  readonly timestamp: string;
  /** Present if JSON parsing also failed (before validation) */
  readonly parsingError?: ParsingError;
}

/**
 * Successfully validated output from a subagent.
 * Generic type T carries the validated data with proper typing.
 * 
 * @example
 * ```ts
 * const result: ValidatedOutput<{ x: string; y: number }> = {
 *   success: true,
 *   data: { x: "hello", y: 42 },
 *   schema: { type: "object", properties: { x: { type: "string" }, y: { type: "number" } } },
 *   validatedAt: new Date().toISOString()
 * };
 * ```
 */
export interface ValidatedOutput<T> {
  /** Always true for successful validation */
  readonly success: true;
  /** The parsed and validated JSON data, typed as T */
  readonly data: T;
  /** The JSON Schema used for validation */
  readonly schema: JSONSchema;
  /** ISO 8601 timestamp when validation occurred */
  readonly validatedAt: string;
}

// =============================================================================
// Spec 02: Terse Shorthand & Chain API
// =============================================================================

/**
 * A ThoughtChain provides a fluent interface for submitting thoughts within a session.
 * Each method call persists immediately to the server (per-call roundtrip model).
 * 
 * Note: The chain-bound t(), end(), and thought() methods have identical signatures
 * to their counterparts on the main tb instance. The chain-bound versions resolve
 * sessionId from the chain's captured session.
 */
interface ThoughtChain {
  /** Identifier of the underlying session. Captured at chain creation. */
  readonly sessionId: string;

  /** True after end() has been called on this chain instance. */
  readonly closed: boolean;

  /**
   * Submit a reasoning thought (thoughtType: "reasoning", nextThoughtNeeded: true).
   * Persists immediately via per-call server roundtrip.
   * Throws ChainClosedError if called after end().
   */
  t(content: string): Promise<Thought>;

  /**
   * Submit a final thought (thoughtType: "reasoning", nextThoughtNeeded: false)
   * and mark the chain closed. Subsequent t/end/thought calls throw.
   * Returns the persisted final thought.
   */
  end(content: string): Promise<Thought>;

  /**
   * Submit an explicitly-typed thought. Persists immediately.
   * Throws ChainClosedError if called after end().
   */
  thought(input: ThoughtInput): Promise<Thought>;
}

/**
 * Input for creating a thought via the chain API.
 * Mirrors the core thought input but sessionId is inferred from chain context.
 * This type is the same as the thought input in the TB interface below.
 * Note: options field omitted - see the full type in TB interface.
 */
type ThoughtInput = {
  thought: string;
  thoughtType?: ThoughtType;
  nextThoughtNeeded?: boolean;
  totalThoughts?: number;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
  includeGuide?: boolean;
  sessionTitle?: string;
  sessionTags?: string[];
  critique?: boolean;
  verbose?: boolean;
  confidence?: "high" | "medium" | "low";
  decisionState?: "deliberating" | "committed";
  actionResult?: { success: boolean; reversible: "yes" | "no" | "partial"; tool: string; target: string; sideEffects?: string[] };
  beliefs?: { entities: Array<{ name: string; state: string }>; constraints?: string[]; risks?: string[] };
  assumptionChange?: { text: string; oldStatus: string; newStatus: "believed" | "uncertain" | "refuted"; trigger?: string; downstream?: number[] };
  contextData?: { toolsAvailable?: string[]; systemPromptHash?: string; modelId?: string; constraints?: string[]; dataSourcesAccessed?: string[] };
  progressData?: { task: string; status: "pending" | "in_progress" | "done" | "blocked"; note?: string };
  agentId?: string;
  agentName?: string;
};

/**
 * Thrown when a chain method is called after end().
 */
class ChainClosedError extends Error {
  readonly sessionId: string;
  readonly attemptedOperation: "t" | "end" | "thought";

  constructor(sessionId: string, attemptedOperation: "t" | "end" | "thought") {
    super(`Chain for session ${sessionId} is closed; cannot call ${attemptedOperation}()`);
    this.name = "ChainClosedError";
    this.sessionId = sessionId;
    this.attemptedOperation = attemptedOperation;
  }
}

/**
 * Options for opening a thought chain via tb.think(), tb.decide(), or tb.research().
 */
interface ThinkOpts {
  /** Resume existing session by ID. If omitted, a new session is created. */
  sessionId?: string;
  /** Title for the new session. Ignored when sessionId is provided. */
  sessionTitle?: string;
  /** Tags for the new session. Ignored when sessionId is provided. */
  sessionTags?: string[];
  /** Override the factory's default session type (Spec 08). */
  sessionType?: SessionType;
  /** Cipher mode for the new session (Spec 06). */
  cipherMode?: CipherMode;
  /** Per-session activity timeout for hook suppression (Spec 05). */
  activityTimeoutMs?: number;
}

// =============================================================================
// Spec 03: Mid-Session Recall Primitives
// =============================================================================

/**
 * Options for session search.
 */
interface SearchWithinOptions {
  /**
   * Maximum number of results to return.
   * @default 20
   * @max 100
   */
  limit?: number;

  /**
   * Filter to only include thoughts of these types.
   * If not provided, all thought types are searched.
   */
  thoughtTypes?: readonly ThoughtType[];

  /**
   * Search mode.
   * - "fulltext" (default): tsvector match with stemming + stopwords; English locale
   * - "substring": case-insensitive ILIKE match; no stemming; useful for exact phrase
   */
  mode?: "fulltext" | "substring";
}

/**
 * The server-persisted thought type.
 * All server-assigned fields are guaranteed present.
 */
interface Thought {
  thoughtNumber: number;     // Server-assigned, always present
  thought: string;
  thoughtType: ThoughtType;
  nextThoughtNeeded: boolean;
  timestamp: string;          // Server-assigned ISO 8601
  // ... all other ThoughtData fields
}

// =============================================================================
// Spec 04: Subagent Session Attachment
// =============================================================================

/**
 * Options for attaching a subagent output to the session.
 */
interface AttachOptions {
  /**
   * Thought type for the attachment.
   * Default: "context_snapshot"
   */
  thoughtType?: ThoughtType;

  /**
   * Visibility for any knowledge graph entities created.
   * Default: "agent-private"
   */
  visibility?: Visibility;

  /**
   * If provided, creates a knowledge graph entity with this name
   * linking to the thought.
   */
  entityName?: string;
}

/**
 * Metadata attached to a thought created from subagent output.
 */
interface SubagentOutputMetadata {
  /**
   * The original subagent output.
   */
  subagentOutput: SubagentOutput;

  /**
   * The thought type used for the attachment.
   */
  thoughtType: ThoughtType;

  /**
   * Visibility of any created KG entity (if applicable).
   */
  visibility?: Visibility;

  /**
   * ID of created KG entity (if entityName was provided).
   */
  entityId?: string;
}

/**
 * Operations for running and attaching subagent outputs.
 */
interface SubagentOperations {
  /**
   * Attach a subagent output to the parent session.
   *
   * @param output - The subagent output to attach
   * @param options - Optional configuration for the attachment
   * @returns Promise<Thought> - The created thought
   */
  attach(output: SubagentOutput, options?: AttachOptions): Promise<Thought>;

  /**
   * Run a subagent and optionally attach its output.
   */
  run(input: SubagentDispatchInput): Promise<SubagentOutput>;
}

// =============================================================================
// Spec 05: Hook Suppression During Active Sessions
// =============================================================================

/**
 * Result of checking hook suppression condition.
 */
interface HookResult {
  /**
   * Whether the hook/nudge was suppressed.
   */
  suppressed: boolean;

  /**
   * Reason for suppression (if suppressed).
   */
  reason?: "active_session" | "user_preference" | "rate_limited";

  /**
   * The session ID that caused suppression (if applicable).
   */
  sessionId?: string;
}

/**
 * Observability log entry for suppression events.
 */
interface SuppressionLogEntry {
  hook: "SessionStart";
  event: "nudge_suppressed";
  reason: "active_session";
  sessionId: string;
  timestamp: string;  // ISO 8601
}

/**
 * Input for dispatching a subagent with expected return schema.
 */
export interface SubagentDispatchInput {
  /** The prompt/instruction to send to the subagent */
  prompt: string;
  /** Optional: expected return type specification */
  expectedReturn?: {
    /** JSON Schema describing the expected return structure */
    schema: JSONSchema;
    /** Human-readable description of expected return */
    description?: string;
  };
}

/**
 * Output from a completed subagent dispatch.
 */
export interface SubagentOutput {
  /** The text content returned by the subagent */
  content: string;
  /** Optional summary of the output (may be generated) */
  summary?: string;
  /** Additional metadata from the subagent (readonly to prevent mutation) */
  readonly metadata?: Readonly<Record<string, unknown>>;
  /** ISO 8601 timestamp when the subagent completed */
  completedAt: string;
  /** Duration of the subagent execution in milliseconds */
  durationMs?: number;
  /** The model used by the subagent (if applicable) */
  model?: string;
}

// =============================================================================
// TB SDK Interface - Core SDK types for compile-time type checking
// =============================================================================

/**
 * The main Thoughtbox SDK interface.
 * Provides methods for submitting thoughts, managing sessions, and interacting
 * with the knowledge graph.
 * 
 * Note: The tb.t() and tb.end() shorthand methods are available directly on TB
 * for simple reasoning chains. For more complex workflows, use tb.think() to
 * open a ThoughtChain.
 */
export interface TB {
  // =============================================================================
  // Spec 02: Terse Shorthand & Chain API
  // =============================================================================

  /**
   * Submit a plain reasoning thought with nextThoughtNeeded: true.
   * Shorthand for tb.thought({ thought: content, thoughtType: "reasoning", nextThoughtNeeded: true }).
   */
  t(content: string): Promise<Thought>;

  /**
   * Submit a final thought that ends the current thought chain.
   * Shorthand for tb.thought({ thought: content, thoughtType: "reasoning", nextThoughtNeeded: false }).
   */
  end(content: string): Promise<Thought>;

  /**
   * Open a thought chain bound to a new (or specified) session.
   * Default sessionType: "exploration".
   */
  think(opts?: ThinkOpts): Promise<ThoughtChain>;

  /**
   * Open a thought chain optimized for decision-making.
   * Default sessionType: "decision".
   */
  decide(opts?: ThinkOpts): Promise<ThoughtChain>;

  /**
   * Open a thought chain optimized for research.
   * Default sessionType: "research".
   */
  research(opts?: ThinkOpts): Promise<ThoughtChain>;

  // =============================================================================
  // Subagent Operations (Spec 04)
  // =============================================================================

  /**
   * Subagent operations for running and attaching subagent outputs.
   */
  subagent: SubagentOperations;

  // ... existing TB methods are documented in TB_SDK_TYPES constant
  // for embedding in tool descriptions
}

export const TB_SDK_TYPES = `\`\`\`ts
// Spec 08: Per-Session-Type Audit - SessionType Metadata for Audit Gap Detection

/**
 * Enumerated session types for audit gap detection.
 * Each type has different expected reasoning patterns.
 */
type SessionType = "research" | "decision" | "implementation" | "debugging" | "exploration";

/**
 * Session creation parameters including type.
 */
interface SessionCreateParams {
  title: string;
  sessionType?: SessionType;
}

/**
 * Session with type metadata.
 */
interface Session {
  id: string;
  title: string;
  sessionType: SessionType;
}

/**
 * Audit gap types detected per session type.
 */
type AuditGapType =
  | "insufficient_belief_snapshots"
  | "no_committed_decision"
  | "unexpected_belief_snapshots"
  | "no_root_cause_identified";

/**
 * Audit gap metadata attached to thoughts that trigger gaps.
 */
interface AuditGap {
  type: AuditGapType;
  severity: "warning" | "error";
  message: string;
  sessionType: SessionType;
  details?: {
    expected?: number;
    actual?: number;
    expectedTypes?: string[];
    actualTypes?: string[];
  };
}

// Spec 07: Deliberation Without Commitment - Discriminated Union Types
interface UnselectedOption {
  label: string;
  selected?: false;
}

interface SelectedOption {
  label: string;
  selected: true;
  reason?: string;
}

type DecisionOption = UnselectedOption | SelectedOption;

interface TB {
  /** Submit a structured thought. Source: src/thought/tool.ts */
  thought(input: {
    thought: string;
    thoughtType: "reasoning" | "decision_frame" | "action_report" | "belief_snapshot" | "assumption_update" | "context_snapshot" | "progress";
    nextThoughtNeeded: boolean;
    
    /**
     * Server-auto-assigned. Client should NOT set this field.
     * The server assigns sequential thought numbers on write.
     */
    thoughtNumber?: never;
    
    totalThoughts?: number;
    isRevision?: boolean;
    revisesThought?: number;
    branchFromThought?: number;
    branchId?: string;
    needsMoreThoughts?: boolean;
    includeGuide?: boolean;
    sessionTitle?: string;
    sessionTags?: string[];
    critique?: boolean;
    verbose?: boolean;
    confidence?: "high" | "medium" | "low";
    options?: DecisionOption[];
    decisionState?: "deliberating" | "committed";
    actionResult?: { success: boolean; reversible: "yes" | "no" | "partial"; tool: string; target: string; sideEffects?: string[] };
    beliefs?: { entities: Array<{ name: string; state: string }>; constraints?: string[]; risks?: string[] };
    assumptionChange?: { text: string; oldStatus: string; newStatus: "believed" | "uncertain" | "refuted"; trigger?: string; downstream?: number[] };
    contextData?: { toolsAvailable?: string[]; systemPromptHash?: string; modelId?: string; constraints?: string[]; dataSourcesAccessed?: string[] };
    progressData?: { task: string; status: "pending" | "in_progress" | "done" | "blocked"; note?: string };
    agentId?: string;
    agentName?: string;
  }): Promise<unknown>;

  /** Session management. Source: src/sessions/tool.ts */
  session: {
    list(args?: { limit?: number; offset?: number; tags?: string[] }): Promise<unknown>;
    get(sessionId: string): Promise<unknown>;
    search(query: string, limit?: number): Promise<unknown>;
    resume(sessionId: string): Promise<unknown>;
    export(sessionId: string, format?: "markdown" | "cipher" | "json"): Promise<unknown>;
    analyze(sessionId: string): Promise<unknown>;
    extractLearnings(sessionId: string, args?: Record<string, unknown>): Promise<unknown>;
    update(attrs: { sessionType?: SessionType }): Promise<unknown>;
  };

  /** Knowledge graph. Source: src/knowledge/tool.ts */
  knowledge: {
    createEntity(args: { name: string; type: "Insight" | "Concept" | "Workflow" | "Decision" | "Agent"; label: string; properties?: Record<string, unknown>; created_by?: string; visibility?: "public" | "agent-private" | "user-private" | "team-private" }): Promise<unknown>;
    getEntity(entityId: string): Promise<unknown>;
    listEntities(args?: { types?: string[]; name_pattern?: string; created_after?: string; created_before?: string; limit?: number; offset?: number }): Promise<unknown>;
    addObservation(args: { entity_id: string; content: string; source_session?: string; added_by?: string }): Promise<unknown>;
    createRelation(args: { from_id: string; to_id: string; relation_type: "RELATES_TO" | "BUILDS_ON" | "CONTRADICTS" | "EXTRACTED_FROM" | "APPLIED_IN" | "LEARNED_BY" | "DEPENDS_ON" | "SUPERSEDES" | "MERGED_FROM"; properties?: Record<string, unknown> }): Promise<unknown>;
    queryGraph(args: { start_entity_id: string; relation_types?: string[]; max_depth?: number }): Promise<unknown>;
    stats(): Promise<unknown>;
  };

  /** Literate programming notebooks. Source: src/notebook/tool.ts */
  notebook: {
    create(args: { title: string; language: "javascript" | "typescript"; template?: "sequential-feynman" }): Promise<unknown>;
    list(): Promise<unknown>;
    load(args: { path?: string; content?: string }): Promise<unknown>;
    addCell(args: { notebookId: string; cellType: "title" | "markdown" | "code"; content: string; filename?: string; position?: number }): Promise<unknown>;
    updateCell(args: { notebookId: string; cellId: string; content: string }): Promise<unknown>;
    runCell(args: { notebookId: string; cellId: string }): Promise<unknown>;
    listCells(args: { notebookId: string }): Promise<unknown>;
    getCell(args: { notebookId: string; cellId: string }): Promise<unknown>;
    installDeps(args: { notebookId: string }): Promise<unknown>;
    export(args: { notebookId: string; path?: string }): Promise<unknown>;
  };

  /** Theseus Protocol: friction-gated refactoring. Source: src/protocol/theseus-tool.ts */
  theseus(input: {
    operation: "init" | "visa" | "checkpoint" | "outcome" | "status" | "complete";
    scope?: string[];
    description?: string;
    filePath?: string;
    justification?: string;
    antiPatternAcknowledged?: boolean;
    diffHash?: string;
    commitMessage?: string;
    approved?: boolean;
    feedback?: string;
    testsPassed?: boolean;
    details?: string;
    terminalState?: "complete" | "audit_failure" | "scope_exhaustion";
    summary?: string;
  }): Promise<unknown>;

  /** Ulysses Protocol: state-step-gated debugging. S tracks position in plan→execute→evaluate cycle. S=0 at checkpoint, S=1 after plan submitted (primary executing), S=2 after primary fails (backup executing) or both fail (reflect required). Source: src/protocol/ulysses-tool.ts */
  ulysses(input: {
    operation: "init" | "plan" | "outcome" | "reflect" | "status" | "complete";
    problem?: string;
    constraints?: string[];
    primary?: string;
    recovery?: string;
    irreversible?: boolean;
    assessment?: "expected" | "unexpected-favorable" | "unexpected-unfavorable";
    details?: string;
    hypothesis?: string;
    falsification?: string;
    terminalState?: "resolved" | "insufficient_information" | "environment_compromised";
    summary?: string;
  }): Promise<unknown>;

  /** Observability queries. Source: src/observability/gateway-handler.ts */
  observability(input: {
    operation: "health" | "sessions" | "session_info" | "session_timeline" | "session_cost";
    args?: {
      sessionId?: string;
      limit?: number;
      status?: "active" | "idle" | "all";
      services?: string[];
      model?: string;
    };
  }): Promise<unknown>;

  /** Branch management. Source: src/branch/index.ts */
  branch: {
    spawn(args: { sessionId: string; branchId: string; description?: string; branchFromThought: number }): Promise<unknown>;
    merge(args: { sessionId: string; synthesis: string; selectedBranchId?: string; resolution: "selected" | "synthesized" | "abandoned" }): Promise<unknown>;
    list(args: { sessionId: string }): Promise<unknown>;
    get(args: { sessionId: string; branchId: string }): Promise<unknown>;
  };
}
\`\`\``;
