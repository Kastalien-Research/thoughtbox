/**
 * Tiered Evaluation Pipeline
 * SPEC: SIL-004
 *
 * Implements tiered evaluation that runs cheap gates first, terminating
 * early on failure to minimize cost while ensuring quality.
 *
 * Tier order:
 * 1. Smoke test ($0.10) - Quick sanity check
 * 2. Regression ($1.00) - Full test suite
 * 3. Real-world ($10.00) - Actual benchmarks
 *
 * Early termination saves 80-90% of evaluation cost.
 */

import {
  loadBenchmarkConfig,
  type BenchmarkConfig,
  type TierConfig,
} from "./config-loader.js";
import { improvementTracker } from "../src/observatory/improvement-tracker.js";

// =============================================================================
// Types
// =============================================================================

/**
 * A code modification to be evaluated
 */
export interface CodeModification {
  id: string;
  type: string;
  files: string[];
  diff: string;
}

/**
 * Result of executing a single tier
 */
export interface TierResult {
  tier: string;
  tierId: string;
  score: number;
  passed: boolean;
  cost: number;
  duration_ms: number;
  details?: Record<string, unknown>;
}

/**
 * Overall evaluation result
 */
export interface EvaluationResult {
  passed: boolean;
  passedTiers: string[];
  failedAt: string | null;
  tierResults: TierResult[];
  totalCost: number;
  totalDuration_ms: number;
  reason?: string;
}

/**
 * Interface for tier executors
 */
export interface TierExecutor {
  name: string;
  execute(modification: CodeModification): Promise<TierResult>;
}

/**
 * Configuration for tiered evaluator
 */
export interface TieredEvaluatorConfig {
  /** Path to benchmark config YAML */
  configPath?: string;
  /** Enable observatory tracking */
  trackingEnabled?: boolean;
}

// =============================================================================
// Default Tier Costs
// =============================================================================

const DEFAULT_TIER_COSTS: Record<string, number> = {
  "smoke-test": 0.1,
  regression: 1.0,
  "real-world": 10.0,
};

// =============================================================================
// TieredEvaluator
// =============================================================================

/**
 * Tiered evaluation pipeline for code modifications.
 *
 * Runs evaluation tiers in order, stopping on first failure to minimize cost.
 * Integrates with ImprovementTracker for observability.
 */
export class TieredEvaluator {
  private config: BenchmarkConfig;
  private executors: Map<string, TierExecutor> = new Map();
  private trackingEnabled: boolean;

  constructor(options: TieredEvaluatorConfig = {}) {
    this.config = loadBenchmarkConfig(options.configPath);
    this.trackingEnabled = options.trackingEnabled ?? true;
    this.registerDefaultExecutors();
  }

  /**
   * Evaluate a modification through all tiers.
   * Stops on first required tier failure.
   *
   * @param modification - The code modification to evaluate
   * @returns Evaluation result with all tier scores
   */
  async evaluate(modification: CodeModification): Promise<EvaluationResult> {
    const tierResults: TierResult[] = [];
    const passedTiers: string[] = [];
    let totalCost = 0;
    let totalDuration = 0;
    let failedAt: string | null = null;

    for (const tierConfig of this.config.tiers) {
      const executor = this.executors.get(tierConfig.id);
      if (!executor) {
        console.warn(`No executor for tier: ${tierConfig.id}`);
        continue;
      }

      const startTime = Date.now();

      let result: TierResult;
      try {
        result = await executor.execute(modification);
      } catch (err) {
        // Executor threw - treat as failure
        result = {
          tier: tierConfig.name,
          tierId: tierConfig.id,
          score: 0,
          passed: false,
          cost: DEFAULT_TIER_COSTS[tierConfig.id] ?? 0,
          duration_ms: Date.now() - startTime,
          details: {
            error: err instanceof Error ? err.message : String(err),
          },
        };
      }

      const duration = Date.now() - startTime;
      result.duration_ms = duration;

      // Check if passed threshold
      const passed = result.score >= tierConfig.required_pass_rate;
      result.passed = passed;

      tierResults.push(result);
      totalCost += result.cost;
      totalDuration += duration;

      // Track in Observatory
      if (this.trackingEnabled) {
        improvementTracker.trackEvaluation(
          {
            tier: tierConfig.id,
            tierName: tierConfig.name,
            score: result.score,
            threshold: tierConfig.required_pass_rate,
            passed: result.passed,
            details: result.details,
          },
          result.cost,
          result.passed
        );
      }

      if (passed) {
        passedTiers.push(tierConfig.id);
      } else {
        // Early termination on failure (all tiers are required by default)
        failedAt = tierConfig.id;
        break;
      }
    }

    const passed = failedAt === null;

    return {
      passed,
      passedTiers,
      failedAt,
      tierResults,
      totalCost,
      totalDuration_ms: totalDuration,
      reason: failedAt
        ? `Failed ${failedAt} with score ${tierResults.find((r) => r.tierId === failedAt)?.score?.toFixed(2)}`
        : undefined,
    };
  }

  /**
   * Register a custom tier executor.
   *
   * @param executor - The executor to register
   */
  registerExecutor(executor: TierExecutor): void {
    this.executors.set(executor.name, executor);
  }

  /**
   * Get the current benchmark configuration.
   */
  getConfig(): BenchmarkConfig {
    return this.config;
  }

  /**
   * Get all registered tier IDs.
   */
  getRegisteredTiers(): string[] {
    return Array.from(this.executors.keys());
  }

  /**
   * Register default tier executors.
   *
   * These provide basic implementations that can be overridden
   * with custom executors for specific use cases.
   */
  private registerDefaultExecutors(): void {
    // Smoke test: Quick sanity check
    this.executors.set("smoke-test", {
      name: "smoke-test",
      execute: async (_modification: CodeModification): Promise<TierResult> => {
        // Default implementation runs behavioral tests
        try {
          const { execSync } = await import("child_process");
          execSync("npm run test:behavioral -- --reporter=json 2>/dev/null", {
            encoding: "utf-8",
            timeout: 5 * 60 * 1000, // 5 minutes
            stdio: "pipe",
          });
          return {
            tier: "Smoke Test",
            tierId: "smoke-test",
            score: 1.0,
            passed: true,
            cost: DEFAULT_TIER_COSTS["smoke-test"],
            duration_ms: 0,
          };
        } catch {
          return {
            tier: "Smoke Test",
            tierId: "smoke-test",
            score: 0,
            passed: false,
            cost: DEFAULT_TIER_COSTS["smoke-test"],
            duration_ms: 0,
          };
        }
      },
    });

    // Regression: Full test suite
    this.executors.set("regression", {
      name: "regression",
      execute: async (_modification: CodeModification): Promise<TierResult> => {
        try {
          const { execSync } = await import("child_process");
          const output = execSync("npm test -- --reporter=json 2>/dev/null", {
            encoding: "utf-8",
            timeout: 30 * 60 * 1000, // 30 minutes
            stdio: "pipe",
          });

          // Try to parse JSON output
          let score = 1.0;
          let details: Record<string, unknown> = {};

          try {
            const results = JSON.parse(output);
            if (results.numTotalTests && results.numTotalTests > 0) {
              score = results.numPassedTests / results.numTotalTests;
              details = {
                total: results.numTotalTests,
                passed: results.numPassedTests,
                failed: results.numFailedTests,
              };
            }
          } catch {
            // JSON parsing failed, assume pass if command succeeded
            details = { note: "Could not parse test output" };
          }

          return {
            tier: "Regression Tests",
            tierId: "regression",
            score,
            passed: score >= 0.95,
            cost: DEFAULT_TIER_COSTS["regression"],
            duration_ms: 0,
            details,
          };
        } catch {
          return {
            tier: "Regression Tests",
            tierId: "regression",
            score: 0,
            passed: false,
            cost: DEFAULT_TIER_COSTS["regression"],
            duration_ms: 0,
          };
        }
      },
    });

    // Real-world: Placeholder for SWE-bench integration
    this.executors.set("real-world", {
      name: "real-world",
      execute: async (_modification: CodeModification): Promise<TierResult> => {
        // TODO: Integrate with SWE-bench anchor points from SPEC-SIL-003
        console.log(
          "Real-world tier: Using placeholder (SWE-bench not yet integrated)"
        );
        return {
          tier: "Real-World Tests",
          tierId: "real-world",
          score: 0.8, // Placeholder score
          passed: true,
          cost: DEFAULT_TIER_COSTS["real-world"],
          duration_ms: 0,
          details: { note: "SWE-bench integration pending" },
        };
      },
    });
  }
}

// =============================================================================
// Mock Executor for Testing
// =============================================================================

/**
 * Create a mock executor for testing purposes.
 *
 * @param tierId - The tier ID
 * @param score - The score to return
 * @param cost - The cost to report
 */
export function createMockExecutor(
  tierId: string,
  score: number,
  cost: number = DEFAULT_TIER_COSTS[tierId] ?? 0
): TierExecutor {
  return {
    name: tierId,
    execute: async (): Promise<TierResult> => ({
      tier: tierId,
      tierId,
      score,
      passed: score >= 0.8,
      cost,
      duration_ms: 100,
    }),
  };
}

// =============================================================================
// Singleton
// =============================================================================

let evaluatorInstance: TieredEvaluator | null = null;

/**
 * Get the singleton TieredEvaluator instance.
 *
 * @param options - Configuration options (only used on first call)
 */
export function getTieredEvaluator(
  options?: TieredEvaluatorConfig
): TieredEvaluator {
  if (!evaluatorInstance) {
    evaluatorInstance = new TieredEvaluator(options);
  }
  return evaluatorInstance;
}

/**
 * Reset the singleton instance (for testing).
 */
export function resetTieredEvaluator(): void {
  evaluatorInstance = null;
}
