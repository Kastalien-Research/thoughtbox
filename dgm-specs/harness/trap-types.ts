/**
 * Type definitions for Detect-and-Recover Trap Benchmark
 *
 * Tests Thoughtbox's self-observability by measuring ability to detect
 * inconsistencies, traps, and recover gracefully.
 */

/**
 * Types of traps
 */
export type TrapType =
  | 'ambiguous-requirement'  // Spec is vague or contradictory
  | 'misleading-test'        // Test name doesn't match what it tests
  | 'flaky-test'             // Non-deterministic test
  | 'missing-constraint'     // Critical requirement omitted
  | 'contradictory-spec';    // Spec contradicts itself

/**
 * A trap task
 */
export interface TrapTask {
  id: string;
  trapType: TrapType;
  name: string;
  description: string;

  // Task setup
  prompt: string;              // What agent is asked to do
  trap: string;                // Description of the trap
  seedCode?: string;           // Optional starting code with trap embedded

  // Detection criteria
  expectedDetection: string;   // What agent should notice
  correctBehavior: string;     // What agent should do after detection

  // Success metrics
  trapHandled: boolean;        // Did agent solve despite trap?
  detectionRequired: boolean;  // Must explicitly flag the trap?

  // Metrics expectations
  expectedThoughtboxBenefit: string;
  estimatedTokens: number;
}

/**
 * Metrics for trap detection and recovery
 */
export interface TrapMetrics {
  // Detection metrics
  trapDetected: boolean;           // Did agent flag inconsistency?
  detectionTurns: number;          // How many turns to detect?
  detectionTime_ms: number;        // Time to detection

  // Recovery metrics
  recoveryAttempts: number;        // Failed attempts after detection
  falseStarts: number;             // Began implementing before detection
  backtrackCount: number;          // Reverted work

  // Outcome metrics
  trapHandled: boolean;            // Successfully solved despite trap
  finalCorrectness: number;        // 0-100

  // Computed scores
  detectionSpeed: number;          // 0-100 (faster = higher)
  recoveryEfficiency: number;      // 0-100 (fewer attempts = higher)
  overallScore: number;            // Weighted combination
}

/**
 * Result of trap comparison
 */
export interface TrapResult {
  taskId: string;
  taskName: string;
  trapType: TrapType;

  control: {
    metrics: TrapMetrics;
    duration_ms: number;
    tokensEstimated: number;
  };

  treatment: {
    metrics: TrapMetrics;
    duration_ms: number;
    tokensEstimated: number;
    thoughtboxUsed: boolean;
  };

  delta: {
    detectionSpeed: number;
    recoveryEfficiency: number;
    overallScore: number;
  };

  thoughtboxImproved: boolean;
  timestamp: string;
}

/**
 * Trap suite result
 */
export interface TrapSuite {
  runId: string;
  timestamp: string;
  gitCommit: string;
  results: TrapResult[];

  summary: {
    totalTasks: number;
    improvementCount: number;
    regressionCount: number;
    avgDetectionSpeedGain: number;
    avgRecoveryEfficiencyGain: number;
    avgOverallGain: number;
    thoughtboxWinRate: number;
    totalCostEstimate: number;
  };
}
