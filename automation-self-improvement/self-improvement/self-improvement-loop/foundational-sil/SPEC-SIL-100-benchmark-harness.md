# SPEC-SIL-100: Benchmark Harness

> **Status**: Draft
> **Priority**: CRITICAL (First Iteration Bootstrap)
> **Week**: 0 (Pre-SIL)
> **Phase**: Infrastructure
> **Estimated Effort**: 2-3 hours
> **Source**: 200-thought exploration S168, S188-189

## Summary

Wrap existing behavioral tests with timing and size measurement to establish baseline metrics. This enables before/after comparison for all subsequent improvements.

## Problem Statement

Without baseline metrics:
- Can't measure if improvements actually improve anything
- No way to detect performance regressions
- SIL tiered evaluation has nothing to compare against
- "Improvement" becomes subjective, not empirical

With benchmark harness:
- Every behavioral test produces metrics
- Before/after comparison is objective
- SIL can gate deployments on metric thresholds
- DGM principle: empirical validation over assumptions

## Scope

### In Scope
- Wrap existing 41 behavioral tests with metrics collection
- Measure: duration_ms, response_bytes, tokens_estimated
- Output structured JSON results
- Baseline establishment (first run = baseline)
- Regression detection (compare to baseline)

### Out of Scope
- New behavioral tests (existing 41 sufficient)
- Distributed benchmarking
- Statistical analysis beyond simple comparison
- UI for viewing benchmarks

## Requirements

### R1: Metrics Per Test

```typescript
interface BenchmarkResult {
  testId: string;
  testName: string;
  toolhost: 'thoughtbox' | 'notebook' | 'mental_models' | 'memory';
  passed: boolean;
  duration_ms: number;
  response_bytes: number;
  tokens_estimated: number;  // response_bytes / 4 approximation
  timestamp: string;
  error?: string;
}
```

### R2: Harness Output

```typescript
interface BenchmarkRun {
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
```

### R3: Baseline Comparison

```typescript
interface BaselineComparison {
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
    metric: string;
    baseline: number;
    current: number;
    delta_percent: number;
  }>;
  verdict: 'PASS' | 'FAIL';  // FAIL if any regression > threshold
}
```

### R4: Regression Threshold

```yaml
thresholds:
  duration_ms_increase_max: 20%   # Fail if >20% slower
  response_bytes_increase_max: 10%  # Fail if >10% larger
```

## Technical Approach

### Task 1: Benchmark Wrapper

Create wrapper that runs each behavioral test and captures metrics:

```typescript
// dgm-specs/harness/benchmark-runner.ts

import { execSync } from 'child_process';

interface TestConfig {
  id: string;
  name: string;
  toolhost: string;
  steps: string[];  // From behavioral-tests-content.ts
}

async function runBenchmark(test: TestConfig): Promise<BenchmarkResult> {
  const start = performance.now();
  let response: any;
  let error: string | undefined;
  let passed = false;

  try {
    // Execute test steps via MCP
    for (const step of test.steps) {
      response = await executeStep(step);
    }
    passed = true;
  } catch (e) {
    error = String(e);
    passed = false;
  }

  const duration_ms = performance.now() - start;
  const response_bytes = JSON.stringify(response).length;

  return {
    testId: test.id,
    testName: test.name,
    toolhost: test.toolhost,
    passed,
    duration_ms,
    response_bytes,
    tokens_estimated: Math.ceil(response_bytes / 4),
    timestamp: new Date().toISOString(),
    error
  };
}
```

### Task 2: Baseline Storage

```typescript
// dgm-specs/harness/baseline.ts

const BASELINE_PATH = 'dgm-specs/validation/baseline.json';

async function loadBaseline(): Promise<BenchmarkRun | null> {
  if (!existsSync(BASELINE_PATH)) return null;
  return JSON.parse(readFileSync(BASELINE_PATH, 'utf-8'));
}

async function saveBaseline(run: BenchmarkRun): Promise<void> {
  writeFileSync(BASELINE_PATH, JSON.stringify(run, null, 2));
}

async function compareToBaseline(
  current: BenchmarkRun,
  baseline: BenchmarkRun
): Promise<BaselineComparison> {
  const regressions: BaselineComparison['regressions'] = [];
  const improvements: BaselineComparison['improvements'] = [];

  for (const result of current.results) {
    const baselineResult = baseline.results.find(r => r.testId === result.testId);
    if (!baselineResult) continue;

    // Check duration
    const durationDelta = (result.duration_ms - baselineResult.duration_ms)
                          / baselineResult.duration_ms * 100;
    if (durationDelta > 20) {
      regressions.push({
        testId: result.testId,
        metric: 'duration_ms',
        baseline: baselineResult.duration_ms,
        current: result.duration_ms,
        delta_percent: durationDelta
      });
    } else if (durationDelta < -10) {
      improvements.push({
        testId: result.testId,
        metric: 'duration_ms',
        baseline: baselineResult.duration_ms,
        current: result.duration_ms,
        delta_percent: durationDelta
      });
    }

    // Check response size
    const sizeDelta = (result.response_bytes - baselineResult.response_bytes)
                      / baselineResult.response_bytes * 100;
    if (sizeDelta > 10) {
      regressions.push({
        testId: result.testId,
        metric: 'response_bytes',
        baseline: baselineResult.response_bytes,
        current: result.response_bytes,
        delta_percent: sizeDelta
      });
    } else if (sizeDelta < -10) {
      improvements.push({
        testId: result.testId,
        metric: 'response_bytes',
        baseline: baselineResult.response_bytes,
        current: result.response_bytes,
        delta_percent: sizeDelta
      });
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
```

### Task 3: CLI Interface

```typescript
// dgm-specs/harness/cli.ts

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'run':
    // Run all benchmarks, compare to baseline if exists
    const results = await runAllBenchmarks();
    const baseline = await loadBaseline();
    if (baseline) {
      const comparison = await compareToBaseline(results, baseline);
      console.log(formatComparison(comparison));
      process.exit(comparison.verdict === 'PASS' ? 0 : 1);
    } else {
      console.log('No baseline found. Run `benchmark baseline` first.');
    }
    break;

  case 'baseline':
    // Establish new baseline
    const run = await runAllBenchmarks();
    await saveBaseline(run);
    console.log(`Baseline established: ${run.runId}`);
    break;

  case 'report':
    // Generate comparison report
    const report = await generateReport();
    console.log(report);
    break;
}
```

## Files

### New Files
| File | Purpose |
|------|---------|
| `dgm-specs/harness/benchmark-runner.ts` | Core benchmark execution |
| `dgm-specs/harness/baseline.ts` | Baseline storage and comparison |
| `dgm-specs/harness/cli.ts` | Command-line interface |
| `dgm-specs/harness/types.ts` | TypeScript interfaces |
| `dgm-specs/validation/baseline.json` | Stored baseline (gitignored initially) |

### Modified Files
| File | Changes |
|------|---------|
| `package.json` | Add `benchmark` script |

## Acceptance Criteria

- [ ] All 41 behavioral tests run through harness
- [ ] Each test produces BenchmarkResult with all metrics
- [ ] Baseline can be established and stored
- [ ] Comparison to baseline detects regressions
- [ ] CLI returns non-zero exit code on regression
- [ ] Summary includes aggregate metrics

## Gates

### Entry Gate
- Behavioral tests exist (41 tests in behavioral-tests-content.ts)
- MCP server accessible for test execution

### Exit Gate
- First baseline established
- `npm run benchmark` works end-to-end
- Regression detection verified with synthetic test

## Dependencies

- Existing behavioral tests (src/resources/behavioral-tests-content.ts)
- MCP server running

## Blocked By

- None (this is foundational)

## Blocks

- SPEC-SIL-101 (needs baseline to measure improvement)
- SPEC-SIL-102 (needs baseline to measure improvement)
- SPEC-SIL-103 (needs baseline to measure improvement)
- SPEC-SIL-104 (needs baseline to measure improvement)
- All future SIL improvements (need baseline comparison)

---

**Created**: 2026-01-20
**Source**: 200-thought exploration S168 (benchmark harness target), S188-189 (first iteration prioritization)
