/**
 * Baseline Tracking for Reasoning Quality Evaluation
 *
 * Saves, loads, and compares reasoning evaluation baselines.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type {
  ComparisonBenchmarkRun,
  ReasoningBaselineComparison,
  ReasoningThresholds,
} from './reasoning-types.js';
import { DEFAULT_REASONING_THRESHOLDS } from './reasoning-types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const VALIDATION_DIR = join(__dirname, '..', 'validation');
const BASELINE_PATH = join(VALIDATION_DIR, 'reasoning-baseline.json');
const HISTORY_DIR = join(__dirname, '..', 'history', 'reasoning-runs');

/**
 * Load the current reasoning baseline
 */
export function loadReasoningBaseline(): ComparisonBenchmarkRun | null {
  if (!existsSync(BASELINE_PATH)) {
    return null;
  }
  try {
    const content = readFileSync(BASELINE_PATH, 'utf-8');
    return JSON.parse(content) as ComparisonBenchmarkRun;
  } catch (error) {
    console.error('Failed to load reasoning baseline:', error);
    return null;
  }
}

/**
 * Save a comparison run as the new baseline
 */
export function saveReasoningBaseline(run: ComparisonBenchmarkRun): void {
  // Ensure validation directory exists
  if (!existsSync(VALIDATION_DIR)) {
    mkdirSync(VALIDATION_DIR, { recursive: true });
  }
  writeFileSync(BASELINE_PATH, JSON.stringify(run, null, 2));
  console.log(`Reasoning baseline saved: ${run.runId}`);
}

/**
 * Save a comparison run to history
 */
export function saveReasoningToHistory(run: ComparisonBenchmarkRun): void {
  if (!existsSync(HISTORY_DIR)) {
    mkdirSync(HISTORY_DIR, { recursive: true });
  }
  const historyPath = join(HISTORY_DIR, `${run.runId}.json`);
  writeFileSync(historyPath, JSON.stringify(run, null, 2));
}

/**
 * Compare current run against baseline
 *
 * Regression detection: Flag if Thoughtbox advantage decreased by > threshold on any task
 */
export function compareToReasoningBaseline(
  current: ComparisonBenchmarkRun,
  baseline: ComparisonBenchmarkRun,
  thresholds: ReasoningThresholds = DEFAULT_REASONING_THRESHOLDS
): ReasoningBaselineComparison {
  const regressions: ReasoningBaselineComparison['regressions'] = [];
  const improvements: ReasoningBaselineComparison['improvements'] = [];

  for (const currentResult of current.results) {
    const baselineResult = baseline.results.find(r => r.taskId === currentResult.taskId);
    if (!baselineResult) {
      // New task, can't compare
      continue;
    }

    // Compare Thoughtbox advantage (delta.overallScore)
    const baselineAdvantage = baselineResult.delta.overallScore;
    const currentAdvantage = currentResult.delta.overallScore;
    const advantageChange = currentAdvantage - baselineAdvantage;

    if (advantageChange < -thresholds.thoughtbox_advantage_decrease_max) {
      // Regression: Thoughtbox advantage decreased significantly
      regressions.push({
        taskId: currentResult.taskId,
        metric: 'thoughtbox_advantage',
        baseline: baselineAdvantage,
        current: currentAdvantage,
        delta_points: advantageChange,
      });
    } else if (advantageChange > 5) {
      // Improvement: Thoughtbox advantage increased significantly
      improvements.push({
        taskId: currentResult.taskId,
        metric: 'thoughtbox_advantage',
        baseline: baselineAdvantage,
        current: currentAdvantage,
        delta_points: advantageChange,
      });
    }
  }

  return {
    baselineRunId: baseline.runId,
    currentRunId: current.runId,
    regressions,
    improvements,
    verdict: regressions.length > 0 ? 'FAIL' : 'PASS',
  };
}

/**
 * Format reasoning baseline comparison for console output
 */
export function formatReasoningComparison(comparison: ReasoningBaselineComparison): string {
  const lines: string[] = [];

  lines.push(`\n${'='.repeat(60)}`);
  lines.push('REASONING BASELINE COMPARISON');
  lines.push(`${'='.repeat(60)}`);
  lines.push(`Baseline: ${comparison.baselineRunId}`);
  lines.push(`Current:  ${comparison.currentRunId}`);
  lines.push('');

  if (comparison.regressions.length > 0) {
    lines.push('❌ REGRESSIONS DETECTED:');
    lines.push('   (Thoughtbox advantage decreased significantly)');
    for (const reg of comparison.regressions) {
      lines.push(`  - ${reg.taskId}:`);
      lines.push(`    Baseline advantage: ${reg.baseline.toFixed(1)} points`);
      lines.push(`    Current advantage:  ${reg.current.toFixed(1)} points`);
      lines.push(`    Change: ${reg.delta_points.toFixed(1)} points`);
    }
    lines.push('');
  }

  if (comparison.improvements.length > 0) {
    lines.push('✅ IMPROVEMENTS:');
    lines.push('   (Thoughtbox advantage increased significantly)');
    for (const imp of comparison.improvements) {
      lines.push(`  - ${imp.taskId}:`);
      lines.push(`    Baseline advantage: ${imp.baseline.toFixed(1)} points`);
      lines.push(`    Current advantage:  ${imp.current.toFixed(1)} points`);
      lines.push(`    Change: +${imp.delta_points.toFixed(1)} points`);
    }
    lines.push('');
  }

  if (comparison.regressions.length === 0 && comparison.improvements.length === 0) {
    lines.push('No significant changes from baseline.');
    lines.push('');
  }

  lines.push(`VERDICT: ${comparison.verdict}`);
  lines.push(`${'='.repeat(60)}\n`);

  return lines.join('\n');
}
