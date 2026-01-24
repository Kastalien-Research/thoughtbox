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
  toolCallCount: number;                // NEW: total tool calls
  thoughtboxToolCalls: number;          // NEW: Thoughtbox-specific tool calls
  thoughtboxThoughtsRecorded: number;   // NEW: thoughts recorded via Thoughtbox
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
 * Tool call block from Claude Agent SDK
 */
export interface ToolCall {
  type: 'tool_use';
  id: string;
  name: string;
  input: any;
  timestamp: string;
}

/**
 * Tool result block from Claude Agent SDK
 */
export interface ToolResult {
  type: 'tool_result';
  tool_use_id: string;
  content: any;
  is_error?: boolean;
  timestamp: string;
}

/**
 * Message block (can be text, tool_use, or tool_result)
 */
export interface MessageBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  content?: string;
  id?: string;
  name?: string;
  input?: any;
  tool_use_id?: string;
  is_error?: boolean;
  timestamp: string;
}

/**
 * Thoughtbox session data extracted from actual tool calls
 */
export interface ThoughtboxSession {
  sessionId: string;
  thoughtsCount: number;
  thoughts: Array<{ content: string; thoughtNumber: number }>;
  mentalModelsUsed: string[];
  branchesCreated: number;
  toolCallsToThoughtbox: number;
}

/**
 * Control run trace (without Thoughtbox)
 */
export interface ControlTrace {
  assistantMessages: MessageBlock[];
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  fullReasoning: string;       // All messages joined - used for quality judging
  finalAnswer: string;          // Extracted answer - used for correctness only
  duration_ms: number;
  tokensEstimated: number;
}

/**
 * Treatment run trace (with Thoughtbox)
 */
export interface TreatmentTrace extends ControlTrace {
  thoughtboxSession?: ThoughtboxSession;
  thoughtboxUsed: boolean;  // Explicit flag - true if Thoughtbox MCP tools were called
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

  thoughtboxImproved: boolean;  // thoughtboxUsed && delta.overallScore > 0
  thoughtboxUsed: boolean;      // true if Thoughtbox MCP tools were called
  comparisonValid: boolean;     // same as thoughtboxUsed - comparison only valid if Thoughtbox was used
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

/**
 * Statistics for a metric across multiple runs
 */
export interface RunStatistics {
  mean: number;
  std: number;
  median: number;
  min: number;
  max: number;
  confidenceInterval: [number, number];  // [lower, upper] 95% CI
  runs: number;  // Number of runs
}

/**
 * Score statistics across multiple runs
 */
export interface TaskScoreStats {
  correctness: RunStatistics;
  qualityScore: RunStatistics;
  processScore: RunStatistics;
  overallScore: RunStatistics;
}

/**
 * Comparison result with statistics from multiple runs
 */
export interface ComparisonResultWithStats {
  taskId: string;
  taskName: string;
  category: ReasoningCategory;

  // Individual runs
  runs: ComparisonResult[];

  // Aggregated statistics
  control: {
    scoreStats: TaskScoreStats;
  };

  treatment: {
    scoreStats: TaskScoreStats;
  };

  delta: {
    scoreStats: TaskScoreStats;
    tTest: {
      pValue: number;
      significant: boolean;  // p < 0.05
    };
    effectSize: number;  // Cohen's d
  };

  thoughtboxImprovedConsistently: boolean;  // Improved in majority of runs
  timestamp: string;
}

/**
 * Multi-run benchmark suite result
 */
export interface MultiRunBenchmarkSuite {
  runId: string;
  timestamp: string;
  gitCommit: string;
  runsPerTask: number;

  // Per-task results with statistics
  results: ComparisonResultWithStats[];

  // Aggregated summary
  summary: {
    totalTasks: number;
    improvementCount: number;  // Tasks with positive delta (mean)
    regressionCount: number;
    noChangeCount: number;

    // Average deltas across all tasks
    avgCorrectnessGain: RunStatistics;
    avgQualityGain: RunStatistics;
    avgProcessGain: RunStatistics;
    avgOverallGain: RunStatistics;

    thoughtboxWinRate: number;  // Percentage (0-100)
    totalCostEstimate: number;
  };
}
