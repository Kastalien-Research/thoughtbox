# SPEC-SIL-004: Tiered Evaluation Pipeline

> **Status**: Draft
> **Priority**: HIGH
> **Week**: 2 (Benchmark Infrastructure)
> **Phase**: Evaluation
> **Estimated Effort**: 6-8 hours

## Summary

Implement the tiered evaluation pipeline that runs cheap gates first, terminating early on failure to minimize cost while ensuring quality.

## Problem Statement

Full evaluation of every modification is expensive. The tiered approach:
1. Run cheap smoke tests first ($0.10)
2. Only if passed, run regression suite ($1.00)
3. Only if passed, run real-world benchmarks ($10.00)

Early termination on failure saves 80-90% of evaluation cost.

## Scope

### In Scope
- Tiered gate execution
- Early termination on failure
- Cost tracking per tier
- Result aggregation
- Pass/fail threshold enforcement

### Out of Scope
- Actual benchmark implementation (uses existing tests)
- Proctored execution (SPEC-SIL-007)
- SWE-bench integration (future)

## Requirements

### R1: Sequential Gate Execution
```typescript
interface TieredEvaluator {
  evaluate(modification: CodeModification): Promise<EvaluationResult>;
}
```

Run tiers in order, stop on first failure.

### R2: Early Termination
```typescript
interface EvaluationResult {
  passed: boolean;
  passedTiers: string[];
  failedAt: string | null;
  scores: Record<string, number>;
  totalCost: number;
  reason?: string;
}
```

### R3: Configurable Thresholds
Load thresholds from `suite.yaml` config.

### R4: Cost Tracking
Track and report cost per tier.

## Technical Approach

### Implementation

```typescript
// benchmarks/tiered-evaluator.ts

import { loadBenchmarkConfig, BenchmarkConfig } from './config-loader';
import { improvementTracker } from '../observatory/improvement-tracker';

interface CodeModification {
  id: string;
  type: string;
  files: string[];
  diff: string;
}

interface TierResult {
  tier: string;
  score: number;
  passed: boolean;
  cost: number;
  duration_ms: number;
  details?: Record<string, unknown>;
}

interface EvaluationResult {
  passed: boolean;
  passedTiers: string[];
  failedAt: string | null;
  tierResults: TierResult[];
  totalCost: number;
  totalDuration_ms: number;
  reason?: string;
}

interface TierExecutor {
  name: string;
  execute(modification: CodeModification): Promise<TierResult>;
}

export class TieredEvaluator {
  private config: BenchmarkConfig;
  private executors: Map<string, TierExecutor> = new Map();

  constructor(configPath?: string) {
    this.config = loadBenchmarkConfig(configPath);
    this.registerDefaultExecutors();
  }

  /**
   * Evaluate a modification through all tiers.
   * Stops on first required tier failure.
   */
  async evaluate(modification: CodeModification): Promise<EvaluationResult> {
    const tierResults: TierResult[] = [];
    const passedTiers: string[] = [];
    let totalCost = 0;
    let totalDuration = 0;
    let failedAt: string | null = null;

    for (const tierConfig of this.config.tiers) {
      const executor = this.executors.get(tierConfig.name);
      if (!executor) {
        console.warn(`No executor for tier: ${tierConfig.name}`);
        continue;
      }

      const startTime = Date.now();
      const result = await executor.execute(modification);
      const duration = Date.now() - startTime;

      const tierResult: TierResult = {
        tier: tierConfig.name,
        score: result.score,
        passed: result.score >= tierConfig.pass_threshold,
        cost: result.cost,
        duration_ms: duration,
        details: result.details
      };

      tierResults.push(tierResult);
      totalCost += tierResult.cost;
      totalDuration += duration;

      // Track in Observatory
      improvementTracker.trackEvaluation(
        tierConfig.name,
        tierResult.score,
        tierResult.passed,
        tierResult.cost
      );

      if (tierResult.passed) {
        passedTiers.push(tierConfig.name);
      } else if (tierConfig.required) {
        // Early termination on required tier failure
        failedAt = tierConfig.name;
        break;
      }
    }

    const passed = failedAt === null;

    return {
      passed,
      passedTiers,
      failedAt,
      tierResults,
      totalCost,
      totalDuration_ms: totalDuration,
      reason: failedAt
        ? `Failed ${failedAt} with score ${tierResults.find(r => r.tier === failedAt)?.score}`
        : undefined
    };
  }

  /**
   * Register a custom tier executor.
   */
  registerExecutor(executor: TierExecutor): void {
    this.executors.set(executor.name, executor);
  }

  private registerDefaultExecutors(): void {
    // Smoke test: run behavioral tests
    this.executors.set('smoke-test', {
      name: 'smoke-test',
      async execute(modification: CodeModification): Promise<TierResult> {
        // Run existing behavioral tests
        const { execSync } = await import('child_process');
        try {
          execSync('npm run test:behavioral -- --reporter=json', {
            encoding: 'utf-8',
            timeout: 5 * 60 * 1000  // 5 minutes
          });
          return { tier: 'smoke-test', score: 1.0, passed: true, cost: 0.10 };
        } catch (error) {
          return { tier: 'smoke-test', score: 0, passed: false, cost: 0.10 };
        }
      }
    });

    // Regression: run full test suite
    this.executors.set('regression', {
      name: 'regression',
      async execute(modification: CodeModification): Promise<TierResult> {
        const { execSync } = await import('child_process');
        try {
          const output = execSync('npm test -- --reporter=json', {
            encoding: 'utf-8',
            timeout: 30 * 60 * 1000  // 30 minutes
          });
          // Parse test results for score
          const results = JSON.parse(output);
          const score = results.numPassedTests / results.numTotalTests;
          return {
            tier: 'regression',
            score,
            passed: score >= 0.9,
            cost: 1.00,
            details: { total: results.numTotalTests, passed: results.numPassedTests }
          };
        } catch (error) {
          return { tier: 'regression', score: 0, passed: false, cost: 1.00 };
        }
      }
    });

    // Real-world: placeholder for SWE-bench
    this.executors.set('real-world', {
      name: 'real-world',
      async execute(modification: CodeModification): Promise<TierResult> {
        // TODO: Integrate with SWE-bench anchor points
        console.log('Real-world tier: Using placeholder (SWE-bench not yet integrated)');
        return {
          tier: 'real-world',
          score: 0.75,  // Placeholder
          passed: true,
          cost: 10.00,
          details: { note: 'SWE-bench integration pending' }
        };
      }
    });
  }
}

// Singleton for easy access
let evaluatorInstance: TieredEvaluator | null = null;

export function getTieredEvaluator(): TieredEvaluator {
  if (!evaluatorInstance) {
    evaluatorInstance = new TieredEvaluator();
  }
  return evaluatorInstance;
}
```

## Files

### New Files
| File | Purpose |
|------|---------|
| `benchmarks/tiered-evaluator.ts` | Tiered evaluation pipeline |
| `benchmarks/tiered-evaluator.test.ts` | Unit tests |

## Acceptance Criteria

- [ ] Tiers execute in configured order
- [ ] Early termination on required tier failure
- [ ] Cost tracked per tier
- [ ] Results include all tier scores
- [ ] Thresholds loaded from config
- [ ] Observable via improvement tracker

## Test Cases

```typescript
describe('TieredEvaluator', () => {
  it('passes all tiers when scores exceed thresholds', async () => {
    const evaluator = new TieredEvaluator();
    // Mock executors to return passing scores
    const result = await evaluator.evaluate(mockModification);
    expect(result.passed).toBe(true);
    expect(result.failedAt).toBeNull();
  });

  it('terminates early on required tier failure', async () => {
    const evaluator = new TieredEvaluator();
    // Mock smoke-test to fail
    const result = await evaluator.evaluate(mockModification);
    expect(result.passed).toBe(false);
    expect(result.failedAt).toBe('smoke-test');
    expect(result.tierResults.length).toBe(1);  // Only smoke-test ran
  });

  it('tracks total cost across tiers', async () => {
    const evaluator = new TieredEvaluator();
    const result = await evaluator.evaluate(mockModification);
    expect(result.totalCost).toBeGreaterThan(0);
  });
});
```

## Gates

### Entry Gate
- SPEC-SIL-002 (Config) complete
- SPEC-SIL-003 (Sampler) complete for real-world tier

### Exit Gate
- All tiers execute correctly
- Early termination works
- Cost tracking accurate

## Dependencies

- SPEC-SIL-002 (Benchmark Config)
- SPEC-SIL-001 (Improvement Tracker)

## Blocked By

- SPEC-SIL-002
- SPEC-SIL-001

## Blocks

- SPEC-SIL-010 (Main Loop)

---

**Created**: 2026-01-19
**Source**: PLAN Week 2, Section 2.2
