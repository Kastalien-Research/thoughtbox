/**
 * Type definitions for Reasoning Quality Evaluation
 *
 * This module defines types for evaluating whether Thoughtbox improves agent reasoning
 * quality through controlled A/B comparison.
 */

/**
 * Categories of reasoning tasks
 */
export type ReasoningCategory =
  | 'complex-reasoning'  // Multi-step logic, puzzles, proofs
  | 'debugging'          // Root cause analysis, troubleshooting
  | 'planning'           // System design, architecture decisions
  | 'decision-making';   // Trade-off analysis, option evaluation

/**
 * Scoring rubric for open-ended tasks
 * Each dimension is scored 0-10 points
 */
export interface ScoringRubric {
  [dimension: string]: number;  // e.g., "identified-constraints": 2
}

/**
 * A reasoning task to be evaluated
 */
export interface ReasoningTask {
  id: string;
  category: ReasoningCategory;
  name: string;
  prompt: string;
  correctAnswer?: string;  // For exact-match tasks
  scoringRubric?: ScoringRubric;  // For open-ended tasks
  expectedThoughtboxBenefit: string;  // Why Thoughtbox should help
  estimatedTokens: number;  // Expected token usage per run
}

/**
 * LLM-as-judge quality metrics
 * Each dimension scored 1-10, then normalized to 0-100
 */
export interface LLMJudgeMetric {
  thoroughness: number;  // How complete is the reasoning?
  coherence: number;     // How well-structured and logical?
  insight: number;       // How deep is the analysis?
  specificity: number;   // How concrete vs generic?
  overall: number;       // Average of dimensions (0-100)
  rawResponse: string;   // Full judge response for debugging
}

/**
 * Process transparency metrics
 * Measures how structured and visible the reasoning process is
 */
export interface ProcessMetrics {
  thoughtboxUsage?: {
    thoughtsRecorded: number;
    mentalModelsUsed: string[];
    branchesCreated: number;
    sessionId: string;
  };
  messageCount: number;
  avgMessageLength: number;
  hasStructuredThinking: boolean;
  transparencyScore: number;  // 0-100
}

/**
 * Score breakdown for a single task run
 */
export interface TaskScore {
  correctness: number;     // 0-100 (70% weight)
  qualityScore: number;    // 0-100 from LLM judge (20% weight)
  processScore: number;    // 0-100 from process metrics (10% weight)
  overallScore: number;    // Weighted combination
}

/**
 * Control run trace (without Thoughtbox)
 */
export interface ControlTrace {
  assistantMessages: Array<{
    content: string;
    timestamp: string;
  }>;
  finalAnswer: string;
  duration_ms: number;
  tokensEstimated: number;
}

/**
 * Treatment run trace (with Thoughtbox)
 */
export interface TreatmentTrace extends ControlTrace {
  thoughtboxSession?: {
    sessionId: string;
    thoughts: Array<{
      content: string;
      thoughtNumber: number;
    }>;
    mentalModelsUsed: string[];
    branchesCreated: number;
  };
}

/**
 * Result of comparing control vs treatment on a single task
 */
export interface ComparisonResult {
  taskId: string;
  taskName: string;
  category: ReasoningCategory;

  control: {
    trace: ControlTrace;
    score: TaskScore;
    llmJudge: LLMJudgeMetric;
    processMetrics: ProcessMetrics;
  };

  treatment: {
    trace: TreatmentTrace;
    score: TaskScore;
    llmJudge: LLMJudgeMetric;
    processMetrics: ProcessMetrics;
  };

  delta: {
    correctness: number;      // treatment - control
    qualityScore: number;
    processScore: number;
    overallScore: number;
  };

  thoughtboxImproved: boolean;  // delta.overallScore > 0
  timestamp: string;
}

/**
 * A complete benchmark run with all task comparisons
 */
export interface ComparisonBenchmarkRun {
  runId: string;
  timestamp: string;
  gitCommit: string;
  results: ComparisonResult[];
  summary: {
    totalTasks: number;
    improvementCount: number;     // How many tasks improved with Thoughtbox
    regressionCount: number;      // How many tasks regressed with Thoughtbox
    noChangeCount: number;        // No significant difference
    avgCorrectnessGain: number;   // Average correctness improvement
    avgQualityGain: number;       // Average quality improvement
    avgProcessGain: number;       // Average process improvement
    avgOverallGain: number;       // Average overall improvement
    thoughtboxWinRate: number;    // improvementCount / totalTasks (percentage)
    totalCostEstimate: number;    // Estimated cost in USD
  };
}

/**
 * Baseline comparison for reasoning evaluation
 */
export interface ReasoningBaselineComparison {
  baselineRunId: string;
  currentRunId: string;
  regressions: Array<{
    taskId: string;
    metric: 'thoughtbox_advantage';  // Delta between treatment and control
    baseline: number;
    current: number;
    delta_points: number;  // How much the advantage decreased
  }>;
  improvements: Array<{
    taskId: string;
    metric: 'thoughtbox_advantage';
    baseline: number;
    current: number;
    delta_points: number;  // How much the advantage increased
  }>;
  verdict: 'PASS' | 'FAIL';  // FAIL if any task shows >10 point decrease in advantage
}

/**
 * Thresholds for detecting regressions in reasoning evaluation
 */
export interface ReasoningThresholds {
  thoughtbox_advantage_decrease_max: number;  // Default: 10 points
}

export const DEFAULT_REASONING_THRESHOLDS: ReasoningThresholds = {
  thoughtbox_advantage_decrease_max: 10,
};
