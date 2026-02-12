/**
 * Evaluation Module
 * SPEC: SPEC-EVAL-001
 *
 * Unified evaluation system built on LangSmith.
 *
 * Phase 1: Trace listener + types + config
 * Phase 2 (current): Datasets + evaluators
 * Phase 3: Experiment runner
 * Phase 4: Online monitoring
 *
 * Quick Start:
 * ```ts
 * import { initEvaluation } from './evaluation';
 * import { thoughtEmitter } from './observatory';
 *
 * // Initialize (returns null if LANGSMITH_API_KEY not set)
 * const listener = initEvaluation(thoughtEmitter);
 * ```
 */

import { thoughtEmitter } from "../observatory/emitter.js";
import { loadLangSmithConfig, isLangSmithEnabled } from "./langsmith-config.js";
import { DatasetManager } from "./dataset-manager.js";
import { LangSmithTraceListener } from "./trace-listener.js";

// Types
export type {
  LangSmithConfig,
  SessionRun,
  EvalTask,
  CollectionTask,
  DeploymentTask,
  EvaluatorName,
  ExperimentConfig,
  ExperimentResult,
  MemoryDesignArchiveEntry,
  MonitoringAlert,
  AlertSeverity,
  AlertType,
} from "./types.js";

// Config
export { loadLangSmithConfig, isLangSmithEnabled } from "./langsmith-config.js";

// Dataset manager
export { DatasetManager } from "./dataset-manager.js";

// Trace listener
export { LangSmithTraceListener } from "./trace-listener.js";

// Evaluators
export {
  sessionQualityEvaluator,
  memoryQualityEvaluator,
  dgmFitnessEvaluator,
  reasoningCoherenceEvaluator,
  getEvaluator,
  getAllEvaluators,
} from "./evaluators/index.js";

/**
 * Initialize the evaluation system.
 *
 * Loads LangSmith config from environment variables and attaches
 * the trace listener to the global ThoughtEmitter singleton.
 *
 * Returns the listener instance if LangSmith is configured, null otherwise.
 * This function is safe to call even without LangSmith credentials.
 */
export function initEvaluation(): LangSmithTraceListener | null {
  const config = loadLangSmithConfig();

  if (!config) {
    console.error("[Evaluation] LangSmith not configured (no LANGSMITH_API_KEY). Tracing disabled.");
    return null;
  }

  const listener = new LangSmithTraceListener(config);
  listener.attach(thoughtEmitter);

  console.error(`[Evaluation] LangSmith tracing enabled (project: ${config.project})`);
  return listener;
}

/**
 * Initialize Layer 2 dataset manager.
 *
 * Returns a manager that gracefully no-ops when LangSmith is not configured.
 */
export function initDatasets(): DatasetManager {
  const config = loadLangSmithConfig();

  if (!config) {
    console.error("[Evaluation] LangSmith not configured (no LANGSMITH_API_KEY). Dataset manager in no-op mode.");
  }

  return new DatasetManager(config);
}
