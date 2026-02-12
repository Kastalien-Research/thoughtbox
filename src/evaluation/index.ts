/**
 * Evaluation Module
 * SPEC: SPEC-EVAL-001
 *
 * Unified evaluation system built on LangSmith.
 *
 * Phase 1 (current): Trace listener + types + config
 * Phase 2: Datasets + evaluators
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
import { LangSmithTraceListener } from "./trace-listener.js";

// Types
export type {
  LangSmithConfig,
  SessionRun,
  EvalTask,
  CollectionTask,
  DeploymentTask,
  EvaluatorResult,
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

// Trace listener
export { LangSmithTraceListener } from "./trace-listener.js";

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
