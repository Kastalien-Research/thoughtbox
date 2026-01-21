/**
 * Type definitions for the SIL Benchmark Harness
 * SPEC-SIL-100: Benchmark Harness
 */

export interface BenchmarkResult {
  testId: string;
  testName: string;
  toolhost: 'thoughtbox' | 'notebook' | 'mental_models' | 'memory' | 'init';
  passed: boolean;
  duration_ms: number;
  response_bytes: number;
  tokens_estimated: number;  // response_bytes / 4 approximation
  timestamp: string;
  error?: string;
}

export interface BenchmarkRun {
  runId: string;
  timestamp: string;
  gitCommit: string;
  results: BenchmarkResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    avg_duration_ms: number;
    total_response_bytes: number;
    total_tokens_estimated: number;
  };
}

export interface BaselineComparison {
  baselineRunId: string;
  currentRunId: string;
  regressions: Array<{
    testId: string;
    metric: 'duration_ms' | 'response_bytes';
    baseline: number;
    current: number;
    delta_percent: number;
  }>;
  improvements: Array<{
    testId: string;
    metric: 'duration_ms' | 'response_bytes';
    baseline: number;
    current: number;
    delta_percent: number;
  }>;
  verdict: 'PASS' | 'FAIL';  // FAIL if any regression > threshold
}

export interface RegressionThresholds {
  duration_ms_increase_max: number;  // Default: 20%
  response_bytes_increase_max: number;  // Default: 10%
}

export const DEFAULT_THRESHOLDS: RegressionThresholds = {
  duration_ms_increase_max: 20,
  response_bytes_increase_max: 10
};

export interface TestConfig {
  id: string;
  name: string;
  toolhost: BenchmarkResult['toolhost'];
  description: string;
  steps: TestStep[];
}

export interface TestStep {
  operation: string;
  args?: Record<string, unknown>;
  expectedBehavior: string;
}
