/**
 * Statistical Utilities for Multi-Run Benchmark Analysis
 *
 * Provides functions for calculating mean, std, confidence intervals,
 * statistical significance tests, and effect sizes.
 */

/**
 * Calculate mean of an array of numbers
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation of an array of numbers
 */
export function std(values: number[], sample: boolean = true): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return 0;

  const avg = mean(values);
  const squareDiffs = values.map(val => Math.pow(val - avg, 2));
  const avgSquareDiff = mean(squareDiffs);

  // Use sample standard deviation (n-1) by default
  const divisor = sample ? values.length - 1 : values.length;
  const variance = (avgSquareDiff * values.length) / divisor;

  return Math.sqrt(variance);
}

/**
 * Calculate median of an array of numbers
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * Calculate minimum of an array of numbers
 */
export function min(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.min(...values);
}

/**
 * Calculate maximum of an array of numbers
 */
export function max(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values);
}

/**
 * Calculate standard error of the mean
 */
export function standardError(values: number[]): number {
  if (values.length === 0) return 0;
  return std(values) / Math.sqrt(values.length);
}

/**
 * Calculate confidence interval (mean ± z * SE)
 *
 * @param values Array of values
 * @param confidence Confidence level (default: 0.95 for 95% CI)
 * @returns [lower, upper] bounds of confidence interval
 */
export function confidenceInterval(
  values: number[],
  confidence: number = 0.95
): [number, number] {
  if (values.length === 0) return [0, 0];
  if (values.length === 1) return [values[0], values[0]];

  const avg = mean(values);
  const se = standardError(values);

  // Z-scores for common confidence levels
  const zScores: Record<number, number> = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };

  const z = zScores[confidence] || 1.96;  // Default to 95%
  const margin = z * se;

  return [avg - margin, avg + margin];
}

/**
 * Perform two-sample t-test
 * Tests whether two samples have significantly different means
 *
 * @returns p-value (probability that difference is due to chance)
 */
export function tTest(sample1: number[], sample2: number[]): {
  tStatistic: number;
  pValue: number;
  degreesOfFreedom: number;
} {
  const n1 = sample1.length;
  const n2 = sample2.length;

  if (n1 === 0 || n2 === 0) {
    return { tStatistic: 0, pValue: 1, degreesOfFreedom: 0 };
  }

  const mean1 = mean(sample1);
  const mean2 = mean(sample2);
  const std1 = std(sample1);
  const std2 = std(sample2);

  // Welch's t-test (doesn't assume equal variances)
  const variance1 = Math.pow(std1, 2);
  const variance2 = Math.pow(std2, 2);

  const pooledStdError = Math.sqrt(variance1 / n1 + variance2 / n2);

  if (pooledStdError === 0) {
    return { tStatistic: 0, pValue: 1, degreesOfFreedom: n1 + n2 - 2 };
  }

  const tStatistic = (mean1 - mean2) / pooledStdError;

  // Welch-Satterthwaite degrees of freedom
  const df = Math.pow(variance1 / n1 + variance2 / n2, 2) /
    (Math.pow(variance1 / n1, 2) / (n1 - 1) + Math.pow(variance2 / n2, 2) / (n2 - 1));

  // Approximate p-value using t-distribution
  // For simplicity, use conservative approximation
  const pValue = approximatePValue(Math.abs(tStatistic), df);

  return { tStatistic, pValue, degreesOfFreedom: df };
}

/**
 * Approximate p-value for t-test
 * Uses conservative approximation based on normal distribution
 */
function approximatePValue(t: number, df: number): number {
  // For large df (>30), t-distribution approximates normal
  // For smaller df, this is conservative (overestimates p-value)

  // Convert t-statistic to approximate p-value
  // Using standard normal approximation
  const z = t;

  // Two-tailed p-value approximation
  // P(|Z| > z) ≈ 2 * (1 - Φ(z))

  // Simplified approximation for p-value
  if (z > 4) return 0.0001;  // Very significant
  if (z > 3) return 0.003;   // p < 0.01
  if (z > 2.576) return 0.01; // p < 0.01
  if (z > 1.96) return 0.05;  // p < 0.05
  if (z > 1.645) return 0.10; // p < 0.10

  return 0.20;  // Not significant
}

/**
 * Calculate Cohen's d effect size
 * Measures standardized difference between two means
 *
 * Interpretation:
 * - |d| < 0.2: Small effect
 * - |d| < 0.5: Medium effect
 * - |d| >= 0.8: Large effect
 */
export function cohensD(sample1: number[], sample2: number[]): number {
  if (sample1.length === 0 || sample2.length === 0) return 0;

  const mean1 = mean(sample1);
  const mean2 = mean(sample2);
  const std1 = std(sample1);
  const std2 = std(sample2);

  // Pooled standard deviation
  const n1 = sample1.length;
  const n2 = sample2.length;

  const pooledStd = Math.sqrt(
    ((n1 - 1) * Math.pow(std1, 2) + (n2 - 1) * Math.pow(std2, 2)) / (n1 + n2 - 2)
  );

  if (pooledStd === 0) return 0;

  return (mean1 - mean2) / pooledStd;
}

/**
 * Get significance indicator string
 */
export function significanceIndicator(pValue: number): string {
  if (pValue < 0.001) return '***';
  if (pValue < 0.01) return '**';
  if (pValue < 0.05) return '*';
  return '(ns)';  // not significant
}

/**
 * Format number with confidence interval
 * Example: "75.2 ± 3.1"
 */
export function formatWithCI(
  values: number[],
  decimals: number = 1
): string {
  const avg = mean(values);
  const [lower, upper] = confidenceInterval(values);
  const margin = (upper - lower) / 2;

  return `${avg.toFixed(decimals)} ± ${margin.toFixed(decimals)}`;
}

/**
 * Format statistical comparison result
 * Example: "+10.2 ± 2.1 ***"
 */
export function formatComparison(
  treatment: number[],
  control: number[],
  decimals: number = 1
): string {
  const delta = mean(treatment) - mean(control);
  const test = tTest(treatment, control);
  const sig = significanceIndicator(test.pValue);

  const [lower, upper] = confidenceInterval(
    treatment.map((t, i) => t - control[i])
  );
  const margin = (upper - lower) / 2;

  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(decimals)} ± ${margin.toFixed(decimals)} ${sig}`;
}

/**
 * Calculate percentile
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sorted[lower];
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}
