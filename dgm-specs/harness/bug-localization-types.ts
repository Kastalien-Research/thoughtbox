/**
 * Type definitions for Bug Localization Benchmark
 *
 * Tests Thoughtbox's context isolation by measuring ability to locate and fix bugs
 * with minimal distraction.
 */

/**
 * Variants for bug localization tasks
 */
export type BugLocalizationVariant =
  | 'clean'        // Just failing test + stack trace
  | 'distractor'   // Add irrelevant docs from different tech
  | 'adversarial'; // Include tempting but wrong similar code

/**
 * A bug localization task
 */
export interface BugLocalizationTask {
  id: string;
  variant: BugLocalizationVariant;
  name: string;
  description: string;

  // Bug context
  gitCommit: string;           // Commit hash before fix
  fixCommit: string;           // Commit hash with fix (for ground truth)
  failingTest?: string;        // Test output or description
  stackTrace?: string;         // Stack trace if available
  errorMessage: string;        // Error description

  // Files involved
  affectedFiles: string[];     // Files that need to be examined/fixed
  correctFile: string;         // Primary file that needs fixing

  // Distractor context (for variants)
  distractorContext?: string;  // Irrelevant docs or code

  // Success criteria
  expectedPatch?: string;      // Ground truth patch (if available)
  successCriteria: string;     // How to verify fix worked

  // Metrics expectations
  expectedThoughtboxBenefit: string;
  estimatedTokens: number;
}

/**
 * Metrics for bug localization evaluation
 */
export interface BugFixMetrics {
  // Primary success metrics
  correctFileLocated: boolean;     // Found the right file?
  testsPass: boolean;              // Tests pass after fix?
  bugFixed: boolean;               // Actual bug resolved?

  // Quality metrics
  diffSize: number;                // LOC changed (smaller is better)
  filesTouched: number;            // Files edited
  wrongFileEdits: number;          // Edits to irrelevant files

  // Process metrics
  timeToCorrectFile: number;       // ms until first edit to correct file
  hallucinatedSymbols: number;     // References to non-existent identifiers
  backtrackCount: number;          // Reverted edits
  searchDuplication: number;       // Re-reading same files

  // Computed scores
  localizationAccuracy: number;    // 0-100
  fixQuality: number;              // 0-100
  efficiency: number;              // 0-100
  overallScore: number;            // Weighted combination
}

/**
 * Result of bug localization comparison
 */
export interface BugLocalizationResult {
  taskId: string;
  taskName: string;
  variant: BugLocalizationVariant;

  control: {
    metrics: BugFixMetrics;
    duration_ms: number;
    tokensEstimated: number;
  };

  treatment: {
    metrics: BugFixMetrics;
    duration_ms: number;
    tokensEstimated: number;
    thoughtboxUsed: boolean;
  };

  delta: {
    localizationAccuracy: number;
    fixQuality: number;
    efficiency: number;
    overallScore: number;
  };

  thoughtboxImproved: boolean;
  timestamp: string;
}

/**
 * Bug localization suite result
 */
export interface BugLocalizationSuite {
  runId: string;
  timestamp: string;
  gitCommit: string;
  results: BugLocalizationResult[];

  summary: {
    totalTasks: number;
    improvementCount: number;
    regressionCount: number;
    avgLocalizationGain: number;
    avgFixQualityGain: number;
    avgEfficiencyGain: number;
    avgOverallGain: number;
    thoughtboxWinRate: number;
    totalCostEstimate: number;
  };
}
