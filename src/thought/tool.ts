import { z } from "zod";
import { ThoughtHandler } from "../thought-handler.js";

// Metadata schemas based on AUDIT-001 definitions

// Spec 06: Cipher Mode Toggle - Cipher Mode Types
import type { CipherMode, EffectiveCipherDecision, PersistAsConfig, AssumptionPersistAsConfig, JSONSchema } from "../code-mode/sdk-types.js";

// =============================================================================
// Spec 09: Named Checkpoints - CheckpointLabel Zod Schema
// =============================================================================

/**
 * Spec 09: Named Checkpoints
 * Zod schema for validating checkpoint labels.
 * Format: lowercase alphanumeric, hyphens, underscores only.
 * Must start with letter or digit.
 */
export const CheckpointLabelSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9_-]*$/, {
    message:
      "Checkpoint label must match /^[a-z0-9][a-z0-9_-]*$/: " +
      "lowercase alphanumeric, starting with letter or digit, " +
      "with hyphens and underscores allowed",
  })
  .min(1, "Checkpoint label cannot be empty");

/**
 * Spec 06: Cipher Mode Toggle
 * 
 * Determines the effective cipher decision based on session cipher mode and per-thought flag.
 * 
 * Semantic rules:
 * - cipherMode:"off" is ABSOLUTE - per-thought cipher:true is IGNORED (not an error)
 * - cipherMode:"auto" ignores per-thought flag - server decides based on content signals
 * - cipherMode:"manual" uses per-thought flag - true requests cipher, false/undefined skips
 */
export function getEffectiveCipherDecision(
  sessionCipherMode: CipherMode,
  thoughtCipherFlag?: boolean
): EffectiveCipherDecision {
  switch (sessionCipherMode) {
    case "off":
      // When cipherMode === "off", the per-thought flag is IGNORED (silently)
      return { decision: "skip", reason: "mode_off" };

    case "auto":
      // When cipherMode === "auto", the per-thought flag is IGNORED
      return { decision: "skip", reason: "auto_signal_clear" };

    case "manual":
      // When cipherMode === "manual", the per-thought flag is EFFECTIVE
      if (thoughtCipherFlag === true) {
        return { decision: "cipher", reason: "manual_request" };
      }
      return { decision: "skip", reason: "manual_opt_out" };
  }
}

// Spec 07: Deliberation Without Commitment - Discriminated Union Types
// Discriminated by selected: true (SelectedOption) vs false/undefined (UnselectedOption)

const UnselectedOptionSchema = z.object({
  label: z.string().describe("Label of the option"),
  selected: z.literal(false).optional(),
});

const SelectedOptionSchema = z.object({
  label: z.string().describe("Label of the option"),
  selected: z.literal(true),
  reason: z.string().optional().describe("Why this option was chosen"),
});

// DecisionOption is a discriminated union: either selected or unselected
const DecisionOptionSchema = z.union([
  SelectedOptionSchema,
  UnselectedOptionSchema,
]);

// Expose for use in sdk-types.ts type declarations
export type DecisionOption = UnselectedOption | SelectedOption;

interface UnselectedOption {
  label: string;
  selected?: false;
}

interface SelectedOption {
  label: string;
  selected: true;
  reason?: string;
}

const ActionResultSchema = z.object({
  success: z.boolean().describe("Whether the action was successful"),
  reversible: z.enum(["yes", "no", "partial"]).describe("Can this action be reversed?"),
  tool: z.string().describe("The tool used to perform this action"),
  target: z.string().describe("Target of the action"),
  sideEffects: z.array(z.string()).optional().describe("Any side effects caused by the action"),
});

const BeliefSchema = z.object({
  entities: z.array(z.object({
    name: z.string(),
    state: z.string(),
  })).describe("Important entities and their current state"),
  constraints: z.array(z.string()).optional().describe("Known constraints on the work"),
  risks: z.array(z.string()).optional().describe("Identified risks"),
});

const AssumptionChangeSchema = z.object({
  text: z.string().describe("The text of the assumption"),
  oldStatus: z.string().describe("The previous status of this assumption"),
  newStatus: z.enum(["believed", "uncertain", "refuted"]).describe("The newly decided status"),
  trigger: z.string().optional().describe("What triggered this assumption change"),
  downstream: z.array(z.number()).optional().describe("Downstream thoughts affected"),
});

const ContextDataSchema = z.object({
  toolsAvailable: z.array(z.string()).optional(),
  systemPromptHash: z.string().optional(),
  modelId: z.string().optional(),
  constraints: z.array(z.string()).optional(),
  dataSourcesAccessed: z.array(z.string()).optional(),
});

const ProgressDataSchema = z.object({
  task: z.string().describe("The name of the task being tracked"),
  status: z.enum(["pending", "in_progress", "done", "blocked"]).describe("Status of the task"),
  note: z.string().optional().describe("Optional note on progress"),
});

// =============================================================================
// Spec 10: Knowledge Graph Persistence Shortcut - Zod Schemas
// =============================================================================

/**
 * Spec 10: Knowledge Graph Persistence Shortcut
 * Zod schema for Visibility type.
 */
export const VisibilitySchema = z.enum(["public", "agent-private", "user-private", "team-private"]);

/**
 * Spec 10: Configuration for persisting a thought as a KG entity.
 * name is required; visibility defaults to agent-private.
 */
export const PersistAsConfigSchema = z.object({
  name: z.string().describe("Entity name in knowledge graph"),
  visibility: VisibilitySchema.optional().default("agent-private"),
  relationTo: z.string().optional().describe("Existing entity ID to link via BUILDS_ON"),
});

/**
 * Spec 10: Extended persist config for assumption-related thoughts.
 */
export const AssumptionPersistAsConfigSchema = PersistAsConfigSchema.extend({
  previousStatus: z.enum(["believed", "uncertain", "refuted"]).optional(),
});

/**
 * Spec 10: Union of persistAs config types (discriminated by presence of previousStatus).
 * Only valid for thoughtTypes: belief_snapshot, assumption_update.
 */
export const PersistAsSchema = z.union([
  AssumptionPersistAsConfigSchema,
  PersistAsConfigSchema,
]);

/**
 * Spec 10: KG Persistence error details schema.
 */
export const KGPersistErrorDetailsSchema = z.object({
  attemptedName: z.string().optional(),
  attemptedRelationTo: z.string().optional(),
  existingEntityId: z.string().optional(),
});

/**
 * Spec 10: KG Persistence error code enum.
 */
export const KGPersistErrorCodeSchema = z.enum([
  "ENTITY_NAME_CONFLICT",
  "RELATION_TARGET_NOT_FOUND",
  "VISIBILITY_DENIED",
  "STORAGE_ERROR",
  "UNKNOWN_ERROR",
]);

/**
 * Spec 10: KG Persistence error schema.
 */
export const KGPersistErrorSchema = z.object({
  code: KGPersistErrorCodeSchema,
  message: z.string(),
  details: KGPersistErrorDetailsSchema.optional(),
  timestamp: z.string(),
});

// =============================================================================
// Spec 11: Structured Return Schemas - Zod Schemas
// =============================================================================

/**
 * Spec 11: Validation error for structured output parsing.
 */
export const ValidationErrorSchema = z.object({
  path: z.string().describe("JSON path to the invalid field"),
  expected: z.string().describe("Expected type/format description"),
  received: z.unknown().describe("Actual value received"),
  reason: z.string().optional().describe("Optional failure context"),
});

/**
 * Spec 11: JSON parsing error with location info.
 */
export const ParsingErrorSchema = z.object({
  message: z.string(),
  offset: z.number().optional(),
  line: z.number().optional(),
  column: z.number().optional(),
});

/**
 * Spec 11: Basic JSON Schema structure for expected return types.
 */
export const JSONSchemaSchema: z.ZodType<JSONSchema> = z.record(z.unknown()).transform((val) => val as JSONSchema);

/**
 * Spec 11: Error thrown when subagent output fails schema validation.
 * Discriminant: type === "structured_output_error"
 */
export const StructuredOutputErrorSchema = z.object({
  type: z.literal("structured_output_error"),
  message: z.string(),
  rawOutput: z.string(),
  validationErrors: z.array(ValidationErrorSchema),
  expectedSchema: JSONSchemaSchema,
  timestamp: z.string(),
  parsingError: ParsingErrorSchema.optional(),
});

/**
 * Spec 11: Successfully validated output from a subagent.
 * Generic T is the type of the validated data.
 */
export const ValidatedOutputSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    schema: JSONSchemaSchema,
    validatedAt: z.string(),
  });

/**
 * Spec 11: Input for dispatching a subagent with expected return schema.
 */
export const SubagentDispatchInputSchema = z.object({
  prompt: z.string().describe("The prompt/instruction to send to the subagent"),
  expectedReturn: z.object({
    schema: JSONSchemaSchema.describe("JSON Schema for expected return structure"),
    description: z.string().optional().describe("Human-readable description of expected return"),
  }).optional(),
});

/**
 * Spec 11: Output from a completed subagent dispatch.
 */
export const SubagentOutputSchema = z.object({
  content: z.string(),
  summary: z.string().optional(),
  metadata: z.record(z.unknown()).readonly().optional(),
  completedAt: z.string(),
  durationMs: z.number().optional(),
  model: z.string().optional(),
});

// Base schema for thoughtToolInputSchema - used to build the final schema with strict mode and refinements
const thoughtToolInputBaseSchema = z.object({
  thought: z.string().describe("Your current thinking process, insights, or analysis"),
  
  // Base properties
  // NOTE: thoughtNumber is server-auto-assigned - NOT allowed in client input
  // V1.2: The schema uses .strict() to reject any unexpected keys
  totalThoughts: z.number().optional().describe("Estimated total thoughts needed. Optional."),
  nextThoughtNeeded: z.boolean().describe("Whether another thought is needed to complete the reasoning step"),
  
  // Branching/Revision properties
  isRevision: z.boolean().optional().describe("Whether this thought revises a previous one"),
  revisesThought: z.number().optional().describe("The thought number being revised (if isRevision is true)"),
  branchFromThought: z.number().optional().describe("The thought number this branch originates from"),
  branchId: z.string().optional().describe("A unique identifier for this new reasoning branch"),
  needsMoreThoughts: z.boolean().optional().describe("Whether more thoughts are needed in this branch/revision"),
  includeGuide: z.boolean().optional().describe("Whether to include the reasoning guide in the response"),
  
  // Session details (for initialization)
  sessionTitle: z.string().optional().describe("Title for a new reasoning session (applies mainly for thoughtNumber 1)"),
  sessionTags: z.array(z.string()).optional().describe("Tags for a new reasoning session"),
  
  // Autonomous/Advanced
  critique: z.boolean().optional().describe("Request an autonomous critique of this thought"),
  verbose: z.boolean().optional().describe("Return verbose response including the structured metadata mapping"),
  
  // Type discriminators & Metadata
  thoughtType: z.enum([
    "reasoning", "decision_frame", "action_report", 
    "belief_snapshot", "assumption_update", "context_snapshot", "progress"
  ]).describe("The structured type of this thought"),
  
  confidence: z.enum(["high", "medium", "low"]).optional().describe("Confidence level for decision frames"),
  options: z.array(DecisionOptionSchema).optional().describe("Options evaluated during decision frames"),
  decisionState: z.enum(["deliberating", "committed"]).optional().describe("Current state of the decision: deliberating (gathering options) or committed (final decision made)"),
  actionResult: ActionResultSchema.optional().describe("Results of actions explicitly tracked"),
  beliefs: BeliefSchema.optional().describe("Snapshot of active beliefs"),
  assumptionChange: AssumptionChangeSchema.optional().describe("Updates to previously recorded assumptions"),
  contextData: ContextDataSchema.optional().describe("Snapshot of contextual awareness"),
  progressData: ProgressDataSchema.optional().describe("Status update on a specific task progress"),
  
  // Multi-agent attribution
  agentId: z.string().optional().describe("ID of the agent submitting this thought"),
  agentName: z.string().optional().describe("Name of the agent submitting this thought"),

  // Spec 06: Cipher Mode Toggle - Per-thought cipher override
  // ONLY effective when session.cipherMode === "manual".
  // Ignored when session.cipherMode is "auto" or "off".
  // - true: Request cipher processing (when session mode is "manual")
  // - false: Explicit opt-out (when session mode is "manual")  
  // - undefined: Use session-level setting (when session mode is "manual")
  cipher: z.boolean().optional().describe("Per-thought cipher override. ONLY effective when session.cipherMode === 'manual'. Ignored when 'auto' or 'off'."),

  // Spec 10: Knowledge Graph Persistence Shortcut
  // persistAs is only valid for belief_snapshot and assumption_update thoughtTypes.
  // It allows automatically persisting thought content as a KG entity.
  persistAs: PersistAsSchema.optional().describe("KG persistence config. Only valid for belief_snapshot and assumption_update thoughtTypes."),
});

// Apply .strict() first to reject unknown keys
// V1.2: .strict() rejects thoughtNumber since it's not in the schema
const thoughtToolInputSchemaStrict = thoughtToolInputBaseSchema.strict();

// Export the final schema with all refinements applied
export const thoughtToolInputSchema = thoughtToolInputSchemaStrict
  // V1.2: Additional explicit rejection of thoughtNumber via refinement
  // This ensures thoughtNumber is rejected with a specific error message
  .refine(
    (data) => !("thoughtNumber" in data),
    {
      message: "thoughtNumber is server-assigned and cannot be provided as input",
      path: ["thoughtNumber"],
    }
  )
  // Spec 07: Deliberation Without Commitment - Cross-element invariant
  // V7.2: At most one option may be selected
  .refine(
    (data) => (data.options?.filter(o => o.selected === true).length ?? 0) <= 1,
    {
      message: "At most one option may have selected: true",
      path: ["options"],
    }
  )
  // Spec 07: Deliberation Without Commitment - Cross-field invariant
  // V7.3: Committed decision must have at least one selection
  .refine(
    (data) => {
      if (data.decisionState === "committed") {
        const hasSelection = data.options?.some(o => o.selected === true) ?? false;
        if (!hasSelection) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Committed decision must have exactly one selected option",
      path: ["decisionState"],
    }
  )
  // Spec 10: Knowledge Graph Persistence Shortcut - Structural scoping
  // V10.7: persistAs is only valid for belief_snapshot and assumption_update thoughtTypes
  .refine(
    (data) => {
      if (data.persistAs !== undefined) {
        const allowedTypes = ["belief_snapshot", "assumption_update"] as const;
        return allowedTypes.includes(data.thoughtType as typeof allowedTypes[number]);
      }
      return true;
    },
    {
      message: "persistAs is only valid for belief_snapshot and assumption_update thoughtTypes",
      path: ["persistAs"],
    }
  );

export type ThoughtToolInput = z.infer<typeof thoughtToolInputSchema>;

export const THOUGHT_TOOL = {
  name: "thoughtbox_thought",
  description: "Advanced reasoning tracking tool. Submit thoughts, track state changes, audit decisions, and build branches or revisions.",
  inputSchema: thoughtToolInputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

export class ThoughtTool {
  constructor(
    private handler: ThoughtHandler,
    private config?: { agentId?: string; agentName?: string }
  ) {}

  async handle(input: ThoughtToolInput) {
    // Inject agent context if provided via config and not specified in input
    if (this.config?.agentId && !input.agentId) {
      input.agentId = this.config.agentId;
    }
    if (this.config?.agentName && !input.agentName) {
      input.agentName = this.config.agentName;
    }

    // The handler does its own detailed validation (discriminators etc.) natively
    // We just pass the mapped input down directly.
    return this.handler.processThought(input);
  }
}
