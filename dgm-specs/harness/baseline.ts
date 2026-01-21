/**
 * Baseline storage and comparison for SIL Benchmark Harness
 * SPEC-SIL-100: Benchmark Harness
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type {
  BenchmarkRun,
  BaselineComparison,
  RegressionThresholds,
} from './types.js';
import { DEFAULT_THRESHOLDS } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const VALIDATION_DIR = join(__dirname, '..', 'validation');
const BASELINE_PATH = join(VALIDATION_DIR, 'baseline.json');
const HISTORY_DIR = join(__dirname, '..', 'history', 'runs');

/**
 * Load the current baseline from storage
 */
export function loadBaseline(): BenchmarkRun | null {
  if (!existsSync(BASELINE_PATH)) {
    return null;
  }
  try {
    const content = readFileSync(BASELINE_PATH, 'utf-8');
    return JSON.parse(content) as BenchmarkRun;
  } catch (error) {
    console.error('Failed to load baseline:', error);
    return null;
  }
}

/**
 * Save a benchmark run as the new baseline
 */
export function saveBaseline(run: BenchmarkRun): void {
  // Ensure validation directory exists
  if (!existsSync(VALIDATION_DIR)) {
    mkdirSync(VALIDATION_DIR, { recursive: true });
  }
  writeFileSync(BASELINE_PATH, JSON.stringify(run, null, 2));
  console.log(`Baseline saved: ${run.runId}`);
}

/**
 * Save a benchmark run to history for later analysis
 */
export function saveToHistory(run: BenchmarkRun): void {
  if (!existsSync(HISTORY_DIR)) {
    mkdirSync(HISTORY_DIR, { recursive: true });
  }
  const historyPath = join(HISTORY_DIR, `${run.runId}.json`);
  writeFileSync(historyPath, JSON.stringify(run, null, 2));
}

/**
 * Compare a benchmark run against the baseline
 */
export function compareToBaseline(
  current: BenchmarkRun,
  baseline: BenchmarkRun,
  thresholds: RegressionThresholds = { duration_ms_increase_max: 20, response_bytes_increase_max: 10 }
): BaselineComparison {
  const regressions: BaselineComparison['regressions'] = [];
  const improvements: BaselineComparison['improvements'] = [];

  for (const result of current.results) {
    const baselineResult = baseline.results.find(r => r.testId === result.testId);
    if (!baselineResult) {
      // New test, can't compare
      continue;
    }

    // Check duration
    if (baselineResult.duration_ms > 0) {
      const durationDelta = (result.duration_ms - baselineResult.duration_ms)
                            / baselineResult.duration_ms * 100;

      if (durationDelta > thresholds.duration_ms_increase_max) {
        regressions.push({
          testId: result.testId,
          metric: 'duration_ms',
          baseline: baselineResult.duration_ms,
          current: result.duration_ms,
          delta_percent: Math.round(durationDelta * 100) / 100
        });
      } else if (durationDelta < -10) {
        improvements.push({
          testId: result.testId,
          metric: 'duration_ms',
          baseline: baselineResult.duration_ms,
          current: result.duration_ms,
          delta_percent: Math.round(durationDelta * 100) / 100
        });
      }
    }

    // Check response size
    if (baselineResult.response_bytes > 0) {
      const sizeDelta = (result.response_bytes - baselineResult.response_bytes)
                        / baselineResult.response_bytes * 100;

      if (sizeDelta > thresholds.response_bytes_increase_max) {
        regressions.push({
          testId: result.testId,
          metric: 'response_bytes',
          baseline: baselineResult.response_bytes,
          current: result.response_bytes,
          delta_percent: Math.round(sizeDelta * 100) / 100
        });
      } else if (sizeDelta < -10) {
        improvements.push({
          testId: result.testId,
          metric: 'response_bytes',
          baseline: baselineResult.response_bytes,
          current: result.response_bytes,
          delta_percent: Math.round(sizeDelta * 100) / 100
        });
      }
    }
  }

  return {
    baselineRunId: baseline.runId,
    currentRunId: current.runId,
    regressions,
    improvements,
    verdict: regressions.length > 0 ? 'FAIL' : 'PASS'
  };
}

/**
 * Format a comparison result for console output
 */
export function formatComparison(comparison: BaselineComparison): string {
  const lines: string[] = [];

  lines.push(`\n${'='.repeat(60)}`);
  lines.push('BASELINE COMPARISON');
  lines.push(`${'='.repeat(60)}`);
  lines.push(`Baseline: ${comparison.baselineRunId}`);
  lines.push(`Current:  ${comparison.currentRunId}`);
  lines.push('');

  if (comparison.regressions.length > 0) {
    lines.push('❌ REGRESSIONS DETECTED:');
    for (const reg of comparison.regressions) {
      lines.push(`  - ${reg.testId}: ${reg.metric}`);
      lines.push(`    Baseline: ${reg.baseline.toFixed(2)}, Current: ${reg.current.toFixed(2)}`);
      lines.push(`    Delta: +${reg.delta_percent.toFixed(1)}%`);
    }
    lines.push('');
  }

  if (comparison.improvements.length > 0) {
    lines.push('✅ IMPROVEMENTS:');
    for (const imp of comparison.improvements) {
      lines.push(`  - ${imp.testId}: ${imp.metric}`);
      lines.push(`    Baseline: ${imp.baseline.toFixed(2)}, Current: ${imp.current.toFixed(2)}`);
      lines.push(`    Delta: ${imp.delta_percent.toFixed(1)}%`);
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
