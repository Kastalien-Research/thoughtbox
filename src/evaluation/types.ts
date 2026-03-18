/**
 * Evaluation System — Shared Type Definitions
 * SPEC: SPEC-EVAL-001
 *
 * Types used across all evaluation layers:
 * - Trace recording (Layer 1)
 * - Datasets (Layer 2)
 * - Evaluators (Layer 3)
 * - Experiment runner (Layer 4)
 * - Online monitoring (Layer 5)
 */

// =============================================================================
// Configuration
// =============================================================================

/**
 * LangSmith connection configuration.
 * Loaded from environment variables at startup.
 */
export interface LangSmithConfig {
  /** LangSmith API key (LANGSMITH_API_KEY) */
  apiKey: string;
  /** LangSmith API endpoint (LANGSMITH_ENDPOINT, defaults to https://api.smith.langchain.com) */
  apiUrl?: string;
  /** LangSmith project name or ID (LANGSMITH_PROJECT) */
  project?: string;
  /** LangSmith workspace ID (LANGSMITH_WORKSPACE_ID) */
  workspaceId?: string;
}

// =============================================================================
// Trace Types (Layer 1)
// =============================================================================

/**
 * Represents a LangSmith run created from a Thoughtbox session.
 * The session run is the parent; individual thought events are child runs.
 */
export interface SessionRun {
  /** LangSmith run ID */
  runId: string;
  /** Thoughtbox session ID */
  sessionId: string;
  /** ISO 8601 start time */
  startTime: string;
  /** ISO 8601 end time (set on session:ended) */
  endTime?: string;
  /** Total thoughts recorded */
  thoughtCount: number;
}

// =============================================================================
// Dataset Types (Layer 2)
// =============================================================================

/**
 * An evaluation task in an ALMA-style dataset.
 * Collection tasks have no memory; deployment tasks include prior context.
 */
export interface EvalTask {
  /** Unique task identifier */
  taskId: string;
  /** Human-readable description of what the agent should do */
  description: string;
  /** Capabilities this task is expected to exercise */
  expectedCapabilities: string[];
  /** Difficulty tier for tiered evaluation */
  difficultyTier: "smoke" | "regression" | "real_world";
}

/**
 * Collection task — run WITHOUT memory (baseline performance).
 * ALMA: Measures raw agent capability.
 */
export interface CollectionTask extends EvalTask {
  _type: "collection";
}

/**
 * Deployment task — run WITH memory (memory-augmented performance).
 * ALMA: Measures benefit of a specific memory design.
 */
export interface DeploymentTask extends EvalTask {
  _type: "deployment";
  /** ID of the memory design being tested */
  memoryDesignId: string;
  /** Prior context to provide to the agent */
  priorContext: Record<string, unknown>;
}

// =============================================================================
// Evaluator Types (Layer 3)
// =============================================================================

/**
 * Result from a single evaluator run against a trace.
 */
export interface EvaluatorResult {
  /** Evaluator name (e.g., "sessionQuality", "reasoningCoherence") */
  key: string;
  /** Numeric score, typically 0.0–1.0 */
  score: number;
  /** Human-readable explanation of the score */
  comment?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Available evaluator names.
 */
export type EvaluatorName =
  | "sessionQuality"
  | "memoryQuality"
  | "dgmFitness"
  | "reasoningCoherence";

// =============================================================================
// Experiment Types (Layer 4)
// =============================================================================

/**
 * @deprecated Use RunExperimentOptions instead. Will be removed in Phase 4.
 */
export interface ExperimentConfig {
  datasetName: string;
  memoryDesignId?: string;
  evaluators: EvaluatorName[];
  metadata: Record<string, unknown>;
}

/**
 * @deprecated Use ExperimentRunResult instead. Will be removed in Phase 4.
 */
export interface ExperimentResult {
  experimentId: string;
  datasetName: string;
  aggregateScores: Record<string, number>;
  exampleResults: Array<{
    exampleId: string;
    evaluatorResults: EvaluatorResult[];
  }>;
  totalCost: number;
  totalDuration_ms: number;
}

/**
 * Options for running an evaluation experiment via ExperimentRunner.
 * Aligned with LangSmith's evaluate() API.
 */
export interface RunExperimentOptions {
  /** LangSmith dataset name to evaluate against */
  datasetName: string;
  /** Which evaluators to run (defaults to all four) */
  evaluators?: EvaluatorName[];
  /** The target function that processes each example */
  target: (input: Record<string, any>) => Promise<Record<string, any>>;
  /** Experiment name prefix (LangSmith generates suffix) */
  experimentPrefix?: string;
  /** Free-form description */
  description?: string;
  /** Experiment metadata */
  metadata?: Record<string, unknown>;
  /** Memory design ID (for deployment experiments) */
  memoryDesignId?: string;
  /** Max concurrency for target execution */
  maxConcurrency?: number;
}

/**
 * Result of an evaluation experiment run.
 * Structured from LangSmith's ExperimentResults.
 */
export interface ExperimentRunResult {
  /** LangSmith experiment name */
  experimentName: string;
  /** Dataset that was evaluated */
  datasetName: string;
  /** Memory design ID if this was a deployment experiment */
  memoryDesignId?: string;
  /** Aggregate scores across all examples, keyed by evaluator name */
  aggregateScores: Record<string, number>;
  /** Per-example results */
  exampleResults: Array<{
    exampleId: string;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    evaluationResults: Array<{
      key: string;
      score: number | undefined;
      comment?: string;
      evaluatorInfo?: Record<string, unknown>;
    }>;
  }>;
  /** Total examples processed */
  totalExamples: number;
  /** Total duration in milliseconds */
  totalDuration_ms: number;
  /** ISO 8601 timestamp */
  timestamp: string;
}

// =============================================================================
// DGM Archive Types (Layer 4 → DGM bridge)
// =============================================================================

/**
 * Entry in the DGM memory design quality-diversity archive.
 * Bridges evaluation results into the DGM fitness landscape.
 */
export interface MemoryDesignArchiveEntry {
  /** Unique memory design identifier */
  designId: string;
  /** Fitness scores from evaluators */
  fitness: {
    sessionQuality: number;
    memoryQuality: number;
    reasoningCoherence: number;
  };
  /** Behavioral descriptors for niche placement */
  descriptors: {
    thoughtDepth: number;
    branchingFactor: number;
    contextUtilization: number;
  };
  /** Number of times this design has been evaluated */
  visitCount: number;
  /** LangSmith experiment IDs where this design was tested */
  experimentIds: string[];
  /** ISO 8601 timestamp of last evaluation */
  lastEvaluated: string;
}

// =============================================================================
// Monitoring Types (Layer 5)
// =============================================================================

/**
 * Configuration for the online session monitor.
 */
export interface MonitorConfig {
  /** Minimum thought count for scoring production sessions (default: 5) */
  minThoughts?: number;
  /** Session tags that always trigger scoring regardless of thought count */
  alwaysScoreTags?: string[];
  /** Minimum scored sessions before enabling regression detection (default: 10) */
  minSamplesForBaseline?: number;
  /** Number of recent sessions for rolling baseline (default: 20) */
  rollingWindowSize?: number;
  /** Stddev multiplier for anomaly/regression detection (default: 2) */
  stddevThreshold?: number;
  /** Alert cooldown per metric in ms (default: 1_800_000 = 30 min) */
  alertCooldownMs?: number;
}

/**
 * Alert severity levels for monitoring events.
 */
export type AlertSeverity = "info" | "warning" | "critical";

/**
 * Alert types for monitoring events.
 */
export type AlertType = "regression" | "anomaly" | "budget_exceeded";

/**
 * Monitoring alert emitted via ThoughtEmitter.
 * Surfaces evaluation concerns in real-time.
 */
export interface MonitoringAlert {
  /** Type of alert */
  type: AlertType;
  /** Severity level */
  severity: AlertSeverity;
  /** Which metric triggered the alert */
  metric: string;
  /** Current value of the metric */
  currentValue: number;
  /** Threshold that was exceeded */
  threshold: number;
  /** Human-readable alert message */
  message: string;
  /** ISO 8601 timestamp */
  timestamp: string;
}
