/**
 * ScorecardAggregator - Metrics Computation and Trend Analysis
 * SPEC: SPEC-persistence.md, SPEC-automation.md
 *
 * Aggregates improvement history into a scorecard that measures
 * improvement over time. Provides deterministic metrics for:
 * - Success rate
 * - Evaluation pass rates by tier
 * - Regression count
 * - Cost per success
 * - Trend direction
 *
 * Usage:
 * ```ts
 * import { ScorecardAggregator } from './scorecard-aggregator';
 * import { defaultImprovementStore } from './improvement-store';
 *
 * const aggregator = new ScorecardAggregator(defaultImprovementStore);
 * const scorecard = await aggregator.computeScorecard({});
 *
 * console.log(`Success rate: ${scorecard.metrics.successRate}`);
 * console.log(`Trend: ${scorecard.trend}`);
 * ```
 */

import { writeFile } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import type { ImprovementEventStore, ImprovementEventFilter } from "./improvement-store.js";
import type { ImprovementEvent } from "./emitter.js";

// =============================================================================
// Types
// =============================================================================

/**
 * Summary of a single iteration
 */
export interface IterationSummary {
  /** Iteration number */
  iteration: number;
  /** Whether the iteration was successful */
  success: boolean;
  /** Total cost of the iteration */
  cost: number;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Duration in milliseconds */
  duration_ms?: number;
  /** Phase costs breakdown */
  phaseCosts?: {
    discovery: number;
    filter: number;
    experiment: number;
    evaluate: number;
    integrate: number;
  };
}

/**
 * Evaluation pass rates by tier
 */
export interface EvaluationPassRates {
  smoke: number;
  regression: number;
  realWorld: number;
}

/**
 * Scorecard metrics
 */
export interface ScorecardMetrics {
  /** Total number of iterations */
  totalIterations: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Evaluation pass rates by tier */
  evaluationPassRates: EvaluationPassRates;
  /** Number of regressions (failures after success) */
  regressionCount: number;
  /** Average cost per successful iteration */
  costPerSuccess: number;
  /** Total cost across all iterations */
  totalCost: number;
}

/**
 * Trend direction
 */
export type TrendDirection = "improving" | "declining" | "stable";

/**
 * Full scorecard
 */
export interface Scorecard {
  /** ISO 8601 timestamp when scorecard was generated */
  generatedAt: string;
  /** Time period covered */
  period: {
    start: string | null;
    end: string | null;
  };
  /** Computed metrics */
  metrics: ScorecardMetrics;
  /** Trend direction */
  trend: TrendDirection;
  /** Recent iteration summaries */
  recentIterations: IterationSummary[];
}

/**
 * Options for scorecard computation
 */
export interface ScorecardOptions {
  /** Filter by start time */
  startTime?: string;
  /** Filter by end time */
  endTime?: string;
  /** Number of recent iterations to include */
  recentCount?: number;
  /** Output path for scorecard JSON */
  outputPath?: string;
}

// =============================================================================
// ScorecardAggregator
// =============================================================================

/**
 * Aggregates improvement history into a scorecard with metrics and trends.
 */
export class ScorecardAggregator {
  private store: ImprovementEventStore;

  constructor(store: ImprovementEventStore) {
    this.store = store;
  }

  /**
   * Compute a scorecard from improvement history.
   *
   * @param options - Options for filtering and output
   * @returns Computed scorecard
   */
  async computeScorecard(options: ScorecardOptions = {}): Promise<Scorecard> {
    const filter: ImprovementEventFilter = {
      startTime: options.startTime,
      endTime: options.endTime,
    };

    // Get all cycle_end events (one per iteration)
    const cycleEndEvents = await this.store.listEvents({
      ...filter,
      type: "cycle_end",
    });

    // Get all evaluation events for pass rate calculation
    const evaluationEvents = await this.store.listEvents({
      ...filter,
      type: "evaluate",
    });

    // Compute metrics
    const metrics = this.computeMetrics(cycleEndEvents, evaluationEvents);

    // Compute trend
    const trend = this.computeTrend(cycleEndEvents);

    // Get recent iterations
    const recentCount = options.recentCount ?? 10;
    const recentIterations = this.extractRecentIterations(cycleEndEvents, recentCount);

    // Determine period
    const timestamps = cycleEndEvents.map((e) => e.timestamp).sort();
    const period = {
      start: timestamps[0] ?? null,
      end: timestamps[timestamps.length - 1] ?? null,
    };

    const scorecard: Scorecard = {
      generatedAt: new Date().toISOString(),
      period,
      metrics,
      trend,
      recentIterations,
    };

    // Write to file if output path specified
    if (options.outputPath) {
      await this.writeScorecard(scorecard, options.outputPath);
    }

    return scorecard;
  }

  /**
   * Compute metrics from events.
   */
  private computeMetrics(
    cycleEndEvents: ImprovementEvent[],
    evaluationEvents: ImprovementEvent[]
  ): ScorecardMetrics {
    const totalIterations = cycleEndEvents.length;
    const successfulIterations = cycleEndEvents.filter((e) => e.success).length;
    const successRate = totalIterations > 0 ? successfulIterations / totalIterations : 0;

    // Total cost from cycle_end events
    const totalCost = cycleEndEvents.reduce((sum, e) => sum + e.cost, 0);

    // Cost per success
    const costPerSuccess = successfulIterations > 0 ? totalCost / successfulIterations : 0;

    // Regression count: failures that follow a success
    const regressionCount = this.countRegressions(cycleEndEvents);

    // Evaluation pass rates by tier
    const evaluationPassRates = this.computeEvaluationPassRates(evaluationEvents);

    return {
      totalIterations,
      successRate,
      evaluationPassRates,
      regressionCount,
      costPerSuccess,
      totalCost,
    };
  }

  /**
   * Count regressions (failures after success).
   */
  private countRegressions(cycleEndEvents: ImprovementEvent[]): number {
    // Sort by iteration number
    const sorted = [...cycleEndEvents].sort((a, b) => a.iteration - b.iteration);

    let regressions = 0;
    let previousSuccess = false;

    for (const event of sorted) {
      if (previousSuccess && !event.success) {
        regressions++;
      }
      previousSuccess = event.success;
    }

    return regressions;
  }

  /**
   * Compute evaluation pass rates by tier.
   */
  private computeEvaluationPassRates(evaluationEvents: ImprovementEvent[]): EvaluationPassRates {
    const tierCounts: Record<string, { passed: number; total: number }> = {
      smoke: { passed: 0, total: 0 },
      regression: { passed: 0, total: 0 },
      realWorld: { passed: 0, total: 0 },
    };

    for (const event of evaluationEvents) {
      const tier = event.metadata?.tier as string;
      const passed = event.metadata?.passed as boolean;

      // Map tier IDs to our categories
      let category: string | null = null;
      if (tier === "smoke-test" || tier === "smoke") {
        category = "smoke";
      } else if (tier === "regression") {
        category = "regression";
      } else if (tier === "real-world" || tier === "realWorld") {
        category = "realWorld";
      }

      if (category && tierCounts[category]) {
        tierCounts[category].total++;
        if (passed) {
          tierCounts[category].passed++;
        }
      }
    }

    return {
      smoke: tierCounts.smoke.total > 0 ? tierCounts.smoke.passed / tierCounts.smoke.total : 0,
      regression: tierCounts.regression.total > 0 ? tierCounts.regression.passed / tierCounts.regression.total : 0,
      realWorld: tierCounts.realWorld.total > 0 ? tierCounts.realWorld.passed / tierCounts.realWorld.total : 0,
    };
  }

  /**
   * Compute trend direction.
   *
   * Compares success rate of first half vs second half of iterations.
   */
  private computeTrend(cycleEndEvents: ImprovementEvent[]): TrendDirection {
    if (cycleEndEvents.length < 4) {
      return "stable"; // Not enough data
    }

    // Sort by iteration
    const sorted = [...cycleEndEvents].sort((a, b) => a.iteration - b.iteration);

    // Split into halves
    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

    // Calculate success rates
    const firstHalfSuccessRate = firstHalf.filter((e) => e.success).length / firstHalf.length;
    const secondHalfSuccessRate = secondHalf.filter((e) => e.success).length / secondHalf.length;

    // Determine trend (10% threshold for significance)
    const threshold = 0.1;
    const diff = secondHalfSuccessRate - firstHalfSuccessRate;

    if (diff > threshold) {
      return "improving";
    } else if (diff < -threshold) {
      return "declining";
    } else {
      return "stable";
    }
  }

  /**
   * Extract recent iteration summaries.
   */
  private extractRecentIterations(
    cycleEndEvents: ImprovementEvent[],
    count: number
  ): IterationSummary[] {
    // Sort by iteration descending (most recent first)
    const sorted = [...cycleEndEvents].sort((a, b) => b.iteration - a.iteration);

    return sorted.slice(0, count).map((event) => ({
      iteration: event.iteration,
      success: event.success,
      cost: event.cost,
      timestamp: event.timestamp,
      duration_ms: event.metadata?.duration_ms as number | undefined,
      phaseCosts: event.metadata?.phaseCosts as IterationSummary["phaseCosts"],
    }));
  }

  /**
   * Write scorecard to file.
   */
  private async writeScorecard(scorecard: Scorecard, outputPath: string): Promise<void> {
    const content = JSON.stringify(scorecard, null, 2);
    await writeFile(outputPath, content, "utf-8");
  }

  /**
   * Get the default scorecard output path.
   */
  static getDefaultOutputPath(): string {
    return join(homedir(), ".thoughtbox", "scorecard.json");
  }
}

/**
 * Create a scorecard aggregator with the default store.
 */
export async function createDefaultScorecardAggregator(): Promise<ScorecardAggregator> {
  const { defaultImprovementStore } = await import("./improvement-store.js");
  await defaultImprovementStore.initialize();
  return new ScorecardAggregator(defaultImprovementStore);
}
