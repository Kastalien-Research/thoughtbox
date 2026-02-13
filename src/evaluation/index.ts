/**
 * Evaluation Module
 * SPEC: SPEC-EVAL-001
 *
 * Unified evaluation system built on LangSmith.
 *
 * Phase 1: Trace listener + types + config
 * Phase 2: Datasets + evaluators
 * Phase 3: Experiment runner
 * Phase 4 (current): Online monitoring
 *
 * Quick Start:
 * ```ts
 * import { initEvaluation } from './evaluation';
 *
 * // Initialize (returns null if LANGSMITH_API_KEY not set)
 * const listener = initEvaluation();
 * ```
 */

import { thoughtEmitter } from "../observatory/emitter.js";
import { loadLangSmithConfig, isLangSmithEnabled } from "./langsmith-config.js";
import { getSharedClient } from "./client.js";
import { DatasetManager } from "./dataset-manager.js";
import { ExperimentRunner } from "./experiment-runner.js";
import { LangSmithTraceListener } from "./trace-listener.js";
import { OnlineMonitor } from "./online-monitor.js";

// Types
export type {
  LangSmithConfig,
  SessionRun,
  EvalTask,
  CollectionTask,
  DeploymentTask,
  EvaluatorName,
  RunExperimentOptions,
  ExperimentRunResult,
  MemoryDesignArchiveEntry,
  MonitoringAlert,
  AlertSeverity,
  AlertType,
  MonitorConfig,
} from "./types.js";

// Client
export { getSharedClient, resetClient } from "./client.js";

// Config
export { loadLangSmithConfig, isLangSmithEnabled } from "./langsmith-config.js";

// Dataset manager
export { DatasetManager } from "./dataset-manager.js";

// Trace listener
export { LangSmithTraceListener } from "./trace-listener.js";
export type { TraceListenerOptions } from "./trace-listener.js";

// Experiment runner
export { ExperimentRunner } from "./experiment-runner.js";

// Online monitor
export { OnlineMonitor } from "./online-monitor.js";

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

  const client = getSharedClient(config);
  const listener = new LangSmithTraceListener(config, client);
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
    return new DatasetManager(null);
  }

  return new DatasetManager(config, getSharedClient(config));
}

/**
 * Initialize Layer 4 experiment runner.
 *
 * Returns a runner that gracefully no-ops when LangSmith is not configured.
 */
export function initExperimentRunner(): ExperimentRunner {
  const config = loadLangSmithConfig();

  if (!config) {
    console.error("[Evaluation] LangSmith not configured (no LANGSMITH_API_KEY). Experiment runner in no-op mode.");
    return new ExperimentRunner(null);
  }

  return new ExperimentRunner(config, getSharedClient(config));
}

/**
 * Initialize Layer 5 online monitoring.
 *
 * Subscribes to session events and scores production sessions
 * using the same evaluator pipeline as offline experiments.
 *
 * Requires a trace listener instance to look up LangSmith run IDs.
 * Returns null if LangSmith is not configured.
 */
export function initMonitoring(
  traceListener?: LangSmithTraceListener,
): OnlineMonitor | null {
  const config = loadLangSmithConfig();
  if (!config) {
    console.error("[Evaluation] LangSmith not configured. Online monitoring disabled.");
    return null;
  }

  const client = getSharedClient(config);
  const monitor = new OnlineMonitor(config, client, { traceListener });
  monitor.attach(thoughtEmitter);

  console.error("[Evaluation] Online monitoring enabled");
  return monitor;
}
