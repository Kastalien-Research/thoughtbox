import { z } from "zod";
import { ThoughtHandler } from "../thought-handler.js";

// Metadata schemas based on AUDIT-001 definitions
const OptionSchema = z.object({
  label: z.string().describe("Label of the option"),
  selected: z.boolean().describe("Whether this option was chosen"),
  reason: z.string().optional().describe("Why this option was or wasn't chosen"),
});

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

export const thoughtToolInputSchema = z.object({
  thought: z.string().describe("Your current thinking process, insights, or analysis"),
  
  // Base properties
  thoughtNumber: z.number().optional().describe("Optional explicit thought number. Useful to restart a thought track by sending 1."),
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
  options: z.array(OptionSchema).optional().describe("Options evaluated during decision frames"),
  actionResult: ActionResultSchema.optional().describe("Results of actions explicitly tracked"),
  beliefs: BeliefSchema.optional().describe("Snapshot of active beliefs"),
  assumptionChange: AssumptionChangeSchema.optional().describe("Updates to previously recorded assumptions"),
  contextData: ContextDataSchema.optional().describe("Snapshot of contextual awareness"),
  progressData: ProgressDataSchema.optional().describe("Status update on a specific task progress"),
  
  // Multi-agent attribution
  agentId: z.string().optional().describe("ID of the agent submitting this thought"),
  agentName: z.string().optional().describe("Name of the agent submitting this thought"),
});

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
