/**
 * ExperimentRunner — Layer 4 of the Evaluation System
 * SPEC: SPEC-EVAL-001
 *
 * Wires datasets + evaluators into LangSmith's evaluate() function
 * to run reproducible evaluation experiments.
 *
 * Usage:
 * ```ts
 * import { initExperimentRunner } from './evaluation';
 *
 * const runner = initExperimentRunner();
 * const result = await runner.runExperiment({
 *   datasetName: 'thoughtbox-regression',
 *   target: async (input) => myAgent(input),
 * });
 * ```
 */

import { Client } from "langsmith";
import { evaluate as langsmithEvaluate } from "langsmith/evaluation";
import type { EvaluationResult } from "langsmith/evaluation";
import type { Run } from "langsmith/schemas";
import type { Example } from "langsmith/schemas";
import type {
  LangSmithConfig,
  RunExperimentOptions,
  ExperimentRunResult,
  EvaluatorName,
} from "./types.js";
import { getEvaluator, getAllEvaluators } from "./evaluators/index.js";
import type { Evaluator } from "./evaluators/utils.js";

type EvaluateFn = typeof langsmithEvaluate;

/**
 * Layer 4 experiment runner for LangSmith.
 *
 * Orchestrates evaluation experiments by:
 * 1. Resolving evaluators by name
 * 2. Calling LangSmith evaluate() with the target function
 * 3. Collecting and aggregating results
 * 4. Optionally updating the DGM fitness archive
 */
export class ExperimentRunner {
  private readonly client: Client | null;
  private readonly projectName: string;
  private readonly evaluateFn: EvaluateFn;

  constructor(
    config: LangSmithConfig | null,
    client?: Client,
    evaluateFn?: EvaluateFn,
  ) {
    if (!config) {
      this.client = null;
      this.projectName = "default";
      this.evaluateFn = evaluateFn ?? langsmithEvaluate;
      return;
    }

    this.client =
      client ??
      new Client({
        apiKey: config.apiKey,
        apiUrl: config.apiUrl,
      });
    this.projectName = config.project || "default";
    this.evaluateFn = evaluateFn ?? langsmithEvaluate;
  }

  /**
   * Returns true when LangSmith experiment features are available.
   */
  isEnabled(): boolean {
    return this.client !== null;
  }

  /**
   * Run an evaluation experiment against a LangSmith dataset.
   *
   * Resolves evaluators, calls LangSmith evaluate(), collects results,
   * and computes aggregate scores.
   */
  async runExperiment(options: RunExperimentOptions): Promise<ExperimentRunResult | null> {
    return this.safe("runExperiment", null, async () => {
      const startTime = Date.now();

      // Resolve evaluators
      const resolvedEvaluators = this.resolveEvaluators(options.evaluators);

      // Wrap the target to match LangSmith's expected signature
      const target = async (inputs: Record<string, any>): Promise<Record<string, any>> => {
        return options.target(inputs);
      };

      // Call LangSmith evaluate()
      const experimentResults = await this.evaluateFn(target, {
        data: options.datasetName,
        evaluators: resolvedEvaluators as any[],
        metadata: {
          ...options.metadata,
          memoryDesignId: options.memoryDesignId,
          source: "thoughtbox-experiment-runner",
        },
        experimentPrefix: options.experimentPrefix ?? "thoughtbox",
        description: options.description,
        client: this.client!,
        maxConcurrency: options.maxConcurrency ?? 4,
      });

      // Collect all results by iterating the async iterator
      const exampleResults: ExperimentRunResult["exampleResults"] = [];
      const scoreAccumulator: Record<string, { sum: number; count: number }> = {};

      for await (const row of experimentResults) {
        const rowResults: ExperimentRunResult["exampleResults"][0]["evaluationResults"] = [];

        if (row.evaluationResults?.results) {
          for (const evalResult of row.evaluationResults.results) {
            const key = evalResult.key ?? "unknown";
            const score = typeof evalResult.score === "number" ? evalResult.score : undefined;

            rowResults.push({
              key,
              score,
              comment: evalResult.comment ?? undefined,
              evaluatorInfo: evalResult.evaluatorInfo as Record<string, unknown> | undefined,
            });

            if (score !== undefined) {
              if (!scoreAccumulator[key]) {
                scoreAccumulator[key] = { sum: 0, count: 0 };
              }
              scoreAccumulator[key].sum += score;
              scoreAccumulator[key].count += 1;
            }
          }
        }

        exampleResults.push({
          exampleId: row.example?.id ?? "unknown",
          inputs: row.example?.inputs ?? {},
          outputs: row.run?.outputs ?? {},
          evaluationResults: rowResults,
        });
      }

      // Compute aggregate scores (mean per evaluator key)
      const aggregateScores: Record<string, number> = {};
      for (const [key, acc] of Object.entries(scoreAccumulator)) {
        aggregateScores[key] = acc.count > 0 ? acc.sum / acc.count : 0;
      }

      return {
        experimentName: experimentResults.experimentName ?? "unknown",
        datasetName: options.datasetName,
        memoryDesignId: options.memoryDesignId,
        aggregateScores,
        exampleResults,
        totalExamples: exampleResults.length,
        totalDuration_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    });
  }

  /**
   * Run a collection experiment (no memory).
   */
  async runCollectionExperiment(
    datasetName: string,
    target: RunExperimentOptions["target"],
    options?: Partial<Pick<RunExperimentOptions, "evaluators" | "experimentPrefix" | "description" | "metadata" | "maxConcurrency">>,
  ): Promise<ExperimentRunResult | null> {
    return this.runExperiment({
      datasetName,
      target,
      experimentPrefix: options?.experimentPrefix ?? "thoughtbox-collection",
      description: options?.description ?? "Collection experiment (no memory)",
      ...options,
    });
  }

  /**
   * Run a deployment experiment (with memory).
   */
  async runDeploymentExperiment(
    datasetName: string,
    memoryDesignId: string,
    target: RunExperimentOptions["target"],
    options?: Partial<Pick<RunExperimentOptions, "evaluators" | "experimentPrefix" | "description" | "metadata" | "maxConcurrency">>,
  ): Promise<ExperimentRunResult | null> {
    return this.runExperiment({
      datasetName,
      target,
      memoryDesignId,
      experimentPrefix: options?.experimentPrefix ?? "thoughtbox-deployment",
      description: options?.description ?? `Deployment experiment (memory: ${memoryDesignId})`,
      ...options,
    });
  }

  /**
   * Run a regression check suitable for gatekeeper integration.
   *
   * Runs all evaluators and returns a simple pass/fail with details.
   */
  async runRegressionCheck(
    datasetName: string,
    target: RunExperimentOptions["target"],
    thresholds?: Record<string, number>,
  ): Promise<{
    passed: boolean;
    scores: Record<string, number>;
    failedEvaluators: string[];
    details: string;
  }> {
    const defaultThresholds: Record<string, number> = {
      sessionQuality: 0.5,
      memoryQuality: 0.4,
      dgmFitness: 0.3,
      reasoningCoherence: 0.5,
      ...thresholds,
    };

    const result = await this.runExperiment({
      datasetName,
      target,
      experimentPrefix: "thoughtbox-regression",
      description: "Regression check for evaluation gatekeeper",
    });

    if (!result) {
      return {
        passed: true,
        scores: {},
        failedEvaluators: [],
        details: "LangSmith not configured — regression check skipped",
      };
    }

    const failedEvaluators: string[] = [];
    for (const [key, threshold] of Object.entries(defaultThresholds)) {
      const score = result.aggregateScores[key];
      if (score !== undefined && score < threshold) {
        failedEvaluators.push(key);
      }
    }

    return {
      passed: failedEvaluators.length === 0,
      scores: result.aggregateScores,
      failedEvaluators,
      details: failedEvaluators.length === 0
        ? `All evaluators passed (${result.totalExamples} examples)`
        : `Failed: ${failedEvaluators.join(", ")}`,
    };
  }

  /**
   * Resolve evaluator names to evaluator functions.
   * Defaults to all four evaluators if none specified.
   */
  private resolveEvaluators(names?: EvaluatorName[]): Evaluator[] {
    if (!names || names.length === 0) {
      return getAllEvaluators();
    }
    return names.map((name) => getEvaluator(name));
  }

  /**
   * Execute an async operation with consistent error handling and no-op when disabled.
   */
  private async safe<T>(label: string, fallback: T, fn: () => Promise<T>): Promise<T> {
    if (!this.client) return fallback;
    try {
      return await fn();
    } catch (err) {
      console.warn(`[Evaluation] ${label}:`, err instanceof Error ? err.message : err);
      return fallback;
    }
  }
}
