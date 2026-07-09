/**
 * Evaluation System — Shared Type Definitions
 * SPEC: SPEC-EVAL-001
 *
 * Types used across the evaluation layers:
 * - Trace recording (Layer 1)
 * - Datasets (Layer 2)
 * - Experiment runner (Layer 4, evaluator-agnostic)
 *
 * The former Layer 3 heuristic evaluators and Layer 5 online monitor were
 * removed: they scored thought volume, not outcomes. Evaluators are now
 * supplied by callers (see scripts/eval-run.ts for the causal-lift rig).
 */

import type { Run, Example } from "langsmith/schemas";
import type { EvaluationResult } from "langsmith/evaluation";

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
// Evaluator Types
// =============================================================================

/**
 * Arguments passed to a per-run evaluator — one arm of LangSmith's EvaluatorT
 * union, explicitly typed so destructuring works without implicit `any`.
 */
export interface EvaluatorArgs {
  run: Run;
  example: Example;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  referenceOutputs?: Record<string, any>;
  attachments?: Record<string, any>;
}

/**
 * A per-run evaluator function. The evaluation module ships no built-in
 * evaluators — callers define their own and pass them to ExperimentRunner.
 */
export type Evaluator = (
  args: EvaluatorArgs,
) => EvaluationResult | Promise<EvaluationResult>;

// =============================================================================
// Experiment Types (Layer 4)
// =============================================================================

/**
 * Options for running an evaluation experiment via ExperimentRunner.
 * Aligned with LangSmith's evaluate() API.
 */
export interface RunExperimentOptions {
  /** LangSmith dataset name to evaluate against */
  datasetName: string;
  /**
   * Explicit example IDs to evaluate (subset of the dataset). Used for
   * small-N smoke runs; omit to evaluate the whole dataset.
   */
  exampleIds?: string[];
  /** Evaluators to run against each example (caller-supplied; default none) */
  evaluators?: Evaluator[];
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

/**
 * Result of a regression check gate.
 *
 * A skipped check is never a passed check: when the experiment cannot run
 * (LangSmith unconfigured, or the run produced no results), `passed` is
 * false and `skipped` is true so callers can distinguish "gate ran and
 * passed" from "gate did not run".
 */
export interface RegressionCheckResult {
  /** True only when the experiment ran and all evaluators met thresholds */
  passed: boolean;
  /** True when the check did not run (unconfigured or no results) */
  skipped: boolean;
  /** Aggregate scores keyed by evaluator name (empty when skipped) */
  scores: Record<string, number>;
  /** Evaluators that scored below their threshold */
  failedEvaluators: string[];
  /** Human-readable explanation of the outcome */
  details: string;
}
