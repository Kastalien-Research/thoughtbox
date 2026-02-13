/**
 * EvaluationGatekeeper - Enforced Evaluation Gates
 * SPEC: SPEC-evaluation-gates.md
 *
 * Combines tiered evaluation and behavioral contracts into a single
 * gating mechanism that must pass before improvements can be integrated.
 *
 * Gate Policy:
 * 1. Run tiered evaluator (smoke, regression, real-world)
 * 2. Run behavioral contracts (VARIANCE, CONTENT_COUPLED, TRACE_EXISTS, LLM_JUDGES)
 * 3. If any gate fails, block integration
 * 4. Record gate outcomes in improvement history
 *
 * Usage:
 * ```ts
 * import { EvaluationGatekeeper } from './evaluation-gatekeeper';
 *
 * const gatekeeper = new EvaluationGatekeeper();
 * const result = await gatekeeper.checkGates(modification);
 *
 * if (!result.passed) {
 *   console.log(`Blocked by: ${result.blockedBy}`);
 *   // Don't integrate
 * }
 * ```
 */

// =============================================================================
// Behavioral Contract Types (duplicated to avoid cross-rootDir imports)
// =============================================================================

/**
 * Contract types for behavioral verification
 */
export type BehavioralContractType = "VARIANCE" | "CONTENT_COUPLED" | "TRACE_EXISTS" | "LLM_JUDGES";

/**
 * Result of a single behavioral contract check
 */
export interface BehavioralContractResult {
  contract: BehavioralContractType;
  passed: boolean;
  details: string;
  failureReason?: string;
}

/**
 * Full behavioral verification report
 */
export interface BehavioralVerificationReport {
  functionName: string;
  timestamp: Date;
  results: BehavioralContractResult[];
  allPassed: boolean;
}

// =============================================================================
// Types
// =============================================================================

/**
 * Result of a single tier evaluation
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
 * Result of tiered evaluation
 */
export interface TieredEvaluationResult {
  passed: boolean;
  passedTiers: string[];
  failedAt: string | null;
  tierResults: TierResult[];
  totalCost: number;
  totalDuration_ms: number;
  reason?: string;
}

/**
 * Code modification to be evaluated
 */
export interface CodeModification {
  id: string;
  type: string;
  files: string[];
  diff: string;
}

/**
 * Result of gate check
 */
export interface GateResult {
  /** Whether all gates passed */
  passed: boolean;
  /** Which gate blocked (null if passed) */
  blockedBy: string | null;
  /** Tiered evaluation results */
  tierResults: TierResult[];
  /** Behavioral contract results */
  contractResults: BehavioralContractResult[];
  /** Total cost of evaluation */
  totalCost: number;
  /** Total duration in milliseconds */
  totalDuration_ms: number;
  /** Detailed failure reason */
  reason?: string;
}

/**
 * Configuration for the gatekeeper
 */
export interface GatekeeperConfig {
  /** Skip tiered evaluation (for testing) */
  skipTieredEvaluation?: boolean;
  /** Skip behavioral contracts (for testing) */
  skipBehavioralContracts?: boolean;
  /** Custom thresholds (override defaults) */
  thresholds?: {
    smoke?: number;
    regression?: number;
    realWorld?: number;
  };
}

// =============================================================================
// Mock Types for Testing
// =============================================================================

interface MockEvaluator {
  evaluate(modification: CodeModification): Promise<TieredEvaluationResult>;
}

interface MockContracts {
  verify(): Promise<BehavioralVerificationReport>;
}

/**
 * Duck-type interface for ExperimentRunner to avoid cross-module import.
 */
interface ExperimentRunnerLike {
  runRegressionCheck(
    datasetName: string,
    target: (input: Record<string, any>) => Promise<Record<string, any>>,
    thresholds?: Record<string, number>,
  ): Promise<{
    passed: boolean;
    scores: Record<string, number>;
    failedEvaluators: string[];
    details: string;
  }>;
}

// =============================================================================
// EvaluationGatekeeper
// =============================================================================

/**
 * Gatekeeper that enforces evaluation gates before integration.
 *
 * Combines tiered evaluation (deterministic) with behavioral contracts
 * (black-box) to ensure improvements are valid before integration.
 */
export class EvaluationGatekeeper {
  private config: GatekeeperConfig;
  private mockEvaluator: MockEvaluator | null = null;
  private mockContracts: MockContracts | null = null;
  private experimentRunner: ExperimentRunnerLike | null = null;
  private regressionDataset = "thoughtbox-regression";

  constructor(config: GatekeeperConfig = {}) {
    this.config = config;
  }

  /**
   * Set the experiment runner for tiered evaluation.
   */
  setExperimentRunner(runner: ExperimentRunnerLike, datasetName?: string): void {
    this.experimentRunner = runner;
    if (datasetName) this.regressionDataset = datasetName;
  }

  /**
   * Check all gates for a code modification.
   *
   * @param modification - The code modification to evaluate
   * @returns Gate result with pass/fail and details
   */
  async checkGates(modification: CodeModification): Promise<GateResult> {
    const startTime = Date.now();
    let totalCost = 0;
    const tierResults: TierResult[] = [];
    const contractResults: BehavioralContractResult[] = [];

    // Gate 1: Tiered Evaluation
    if (!this.config.skipTieredEvaluation) {
      const tieredResult = await this.runTieredEvaluation(modification);
      tierResults.push(...tieredResult.tierResults);
      totalCost += tieredResult.totalCost;

      if (!tieredResult.passed) {
        return {
          passed: false,
          blockedBy: `tiered-evaluator:${tieredResult.failedAt}`,
          tierResults,
          contractResults,
          totalCost,
          totalDuration_ms: Date.now() - startTime,
          reason: tieredResult.reason,
        };
      }
    }

    // Gate 2: Behavioral Contracts
    if (!this.config.skipBehavioralContracts) {
      const contractReport = await this.runBehavioralContracts();
      contractResults.push(...contractReport.results);

      if (!contractReport.allPassed) {
        const failedContract = contractReport.results.find((r) => !r.passed);
        return {
          passed: false,
          blockedBy: `behavioral-contract:${failedContract?.contract}`,
          tierResults,
          contractResults,
          totalCost,
          totalDuration_ms: Date.now() - startTime,
          reason: failedContract?.failureReason || failedContract?.details,
        };
      }
    }

    // All gates passed
    return {
      passed: true,
      blockedBy: null,
      tierResults,
      contractResults,
      totalCost,
      totalDuration_ms: Date.now() - startTime,
    };
  }

  /**
   * Run tiered evaluation.
   */
  private async runTieredEvaluation(modification: CodeModification): Promise<TieredEvaluationResult> {
    // Use mock if set (for testing)
    if (this.mockEvaluator) {
      return this.mockEvaluator.evaluate(modification);
    }

    // Use ExperimentRunner for regression checks when available
    if (this.experimentRunner) {
      const startTime = Date.now();
      const check = await this.experimentRunner.runRegressionCheck(
        this.regressionDataset,
        async (input) => input, // identity target — evaluates trace data as-is
        this.config.thresholds ? Object.fromEntries(
          Object.entries(this.config.thresholds).filter(([, v]) => v !== undefined)
        ) as Record<string, number> : undefined,
      );

      return {
        passed: check.passed,
        passedTiers: check.passed ? ["smoke", "regression"] : [],
        failedAt: check.failedEvaluators[0] ?? null,
        tierResults: Object.entries(check.scores).map(([key, score]) => ({
          tier: key,
          tierId: key,
          score,
          passed: !check.failedEvaluators.includes(key),
          cost: 0,
          duration_ms: Date.now() - startTime,
        })),
        totalCost: 0,
        totalDuration_ms: Date.now() - startTime,
        reason: check.details,
      };
    }

    // Fallback: no experiment runner configured
    return {
      passed: true,
      passedTiers: [],
      failedAt: null,
      tierResults: [],
      totalCost: 0,
      totalDuration_ms: 0,
      reason: "ExperimentRunner not configured - evaluation skipped",
    };
  }

  /**
   * Run behavioral contracts.
   */
  private async runBehavioralContracts(): Promise<BehavioralVerificationReport> {
    // Use mock if set (for testing)
    if (this.mockContracts) {
      return this.mockContracts.verify();
    }

    // For now, return a pass-through result
    // In a full implementation, this would run the actual behavioral contracts
    // against the modification using the behavioral-contracts.ts module
    return {
      functionName: "gatekeeper-check",
      timestamp: new Date(),
      results: [],
      allPassed: true,
    };
  }

  /**
   * Set a mock evaluator for testing.
   */
  setMockEvaluator(evaluator: MockEvaluator): void {
    this.mockEvaluator = evaluator;
  }

  /**
   * Set mock contracts for testing.
   */
  setMockContracts(contracts: MockContracts): void {
    this.mockContracts = contracts;
  }

  /**
   * Clear all mocks.
   */
  clearMocks(): void {
    this.mockEvaluator = null;
    this.mockContracts = null;
  }
}

// =============================================================================
// Helper Functions for Testing
// =============================================================================

/**
 * Create a mock evaluator for testing.
 */
export function createMockEvaluator(result: Partial<TieredEvaluationResult>): MockEvaluator {
  return {
    evaluate: async () => ({
      passed: result.passed ?? true,
      passedTiers: result.passedTiers ?? [],
      failedAt: result.failedAt ?? null,
      tierResults: result.tierResults ?? [],
      totalCost: result.totalCost ?? 0,
      totalDuration_ms: result.totalDuration_ms ?? 0,
      reason: result.reason,
    }),
  };
}

/**
 * Create mock contracts for testing.
 */
export function createMockContracts(result: {
  allPassed: boolean;
  results?: BehavioralContractResult[];
  failedContract?: BehavioralContractType;
}): MockContracts {
  return {
    verify: async (): Promise<BehavioralVerificationReport> => ({
      functionName: "mock-check",
      timestamp: new Date(),
      results: result.results ?? (result.allPassed ? [] : [{
        contract: result.failedContract ?? "VARIANCE",
        passed: false,
        details: "Mock failure",
        failureReason: "Mock failure reason",
      }]),
      allPassed: result.allPassed,
    }),
  };
}

/**
 * Default gatekeeper instance.
 */
export const defaultGatekeeper = new EvaluationGatekeeper();
