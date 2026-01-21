/**
 * Shared types for SIL agentic scripts
 *
 * These types define the contracts between agents and the Thoughtbox MCP server.
 */

// ============================================================================
// Thoughtbox System Prompt Instructions
// ============================================================================

/**
 * System prompt snippet for agents that use Thoughtbox.
 */
export const THOUGHTBOX_INSTRUCTIONS = `
You have access to Thoughtbox via MCP tools. Use thoughtbox_gateway for reasoning.

## Thoughtbox Usage Pattern

1. First, initialize a session:
   thoughtbox_gateway { operation: "start_new", args: { title: "Your task description" } }

2. Use the cipher for structured notation:
   thoughtbox_gateway { operation: "cipher" }

3. Record thoughts with proper structure:
   thoughtbox_gateway {
     operation: "thought",
     args: {
       content: "Your reasoning here",
       annotations: { ... }
     }
   }

4. For branching exploration:
   - First record a thought
   - Then create a branch: thoughtbox_gateway { operation: "thought", args: { branchId: "new-branch", branchFromThought: "S3" } }

## Important Rules

- Always initialize a session before using thoughts
- Use the cipher notation for structured reasoning
- When comparing approaches, create branches
- Record your actual reasoning, not placeholder text
- Reference previous thoughts using S1, S2, etc.
`.trim();

// ============================================================================
// Discovery Types (input to improvement reasoner)
// ============================================================================

export interface Discovery {
  id: string;
  type: "performance" | "security" | "refactor" | "bug" | "feature" | "memory-leak" | "race-condition";
  description: string;
  severity?: "low" | "medium" | "high" | "critical";
  source?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Improvement Plan Types (output from improvement reasoner)
// ============================================================================

export interface Assessment {
  feasibility: number; // 1-10
  risk: number; // 1-10
  estimatedCost: number; // in tokens
  rationale: string; // WHY these values - must reference input
}

export interface ApproachBranch {
  name: string;
  description: string;
  assessment: Assessment;
  thoughtBranchId?: string; // Thoughtbox branch ID for this approach
}

export interface ImprovementPlan {
  discoveryId: string;
  discoveryReference: string; // Must contain discovery-specific content
  approaches: ApproachBranch[];
  recommendedApproach: string;
  reasoningTrace: string[]; // Summary of thoughts that led to this
  sessionId: string; // Thoughtbox session for traceability
}

// ============================================================================
// Loop State Types (for orchestrator)
// ============================================================================

export type LoopPhase = "discovery" | "filter" | "experiment" | "evaluate" | "integrate";

export interface LoopIteration {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  phase: LoopPhase;
  discoveries: Discovery[];
  plans: ImprovementPlan[];
  experiments: ExperimentResult[];
  evaluations: EvaluationResult[];
  outcome: "success" | "failure" | "terminated" | "in_progress";
  costSoFar: number;
}

export interface ExperimentResult {
  planId: string;
  approach: string;
  codeChanges: CodeChange[];
  success: boolean;
  error?: string;
}

export interface CodeChange {
  file: string;
  diff: string;
  type: "create" | "modify" | "delete";
}

export interface EvaluationResult {
  experimentId: string;
  tier: 1 | 2 | 3;
  passed: boolean;
  metrics: Record<string, number>;
  details: string;
}

// ============================================================================
// CLAUDE.md Learning Types
// ============================================================================

export interface Learning {
  category: "what_works" | "what_doesnt" | "capability_gaps";
  content: string;
  discoveredAt: Date;
  sourceIterationId: string;
  confidence: number; // 0-1
}

// ============================================================================
// Agent Configuration
// ============================================================================

export interface AgentConfig {
  thoughtboxUrl: string;
  maxBudgetUsd?: number;
  maxTurns?: number;
  model?: string;
  verbose?: boolean;
}

export const DEFAULT_CONFIG: AgentConfig = {
  thoughtboxUrl: "http://localhost:1731/mcp",
  maxBudgetUsd: 1.0,
  maxTurns: 50,
  model: "claude-sonnet-4-20250514",
  verbose: false,
};

// ============================================================================
// Behavioral Contract Types
// ============================================================================

export interface BehavioralContractResult {
  contract: "VARIANCE" | "CONTENT_COUPLED" | "TRACE_EXISTS" | "LLM_JUDGES";
  passed: boolean;
  details: string;
  failureReason?: string;
}

export interface BehavioralVerificationReport {
  functionName: string;
  timestamp: Date;
  results: BehavioralContractResult[];
  allPassed: boolean;
}
