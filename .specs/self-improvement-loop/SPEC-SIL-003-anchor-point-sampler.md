# SPEC-SIL-003: Anchor Point Sampler

> **Status**: Draft
> **Priority**: HIGH
> **Week**: 2 (Benchmark Infrastructure)
> **Phase**: Cost Reduction
> **Estimated Effort**: 6-8 hours

## Summary

Implement anchor point sampling that selects a representative 1% subset of benchmark issues, enabling 99% cost reduction while maintaining >0.9 correlation with full benchmark performance.

## Problem Statement

Full benchmark evaluation is prohibitively expensive:
- SICA: $7,000 for 15 iterations
- SWE-bench full: 2,294 issues
- Each issue evaluation: ~$3-5

Anchor point sampling selects a small representative subset that predicts full benchmark performance. If the correlation is >0.9, we can trust the sampled results.

## Scope

### In Scope
- Stratified sampling across difficulty levels
- Correlation validation (sample vs full)
- Monthly rotation of held-out set
- Issue fingerprinting for contamination detection

### Out of Scope
- Issue scraping (SPEC-SIL-006)
- Actual benchmark execution (SPEC-SIL-004)
- Contamination detection logic (SPEC-SIL-009)

## Requirements

### R1: Stratified Sampling
```typescript
interface StratifiedSample {
  selectAnchorPoints(
    fullBenchmark: Issue[],
    config: AnchorPointConfig
  ): Issue[];
}
```

Sample proportionally across difficulty strata (easy/medium/hard).

### R2: Correlation Validation
```typescript
interface CorrelationValidator {
  validateCorrelation(
    anchorResults: EvaluationResult[],
    fullResults: EvaluationResult[]
  ): { correlation: number; valid: boolean };
}
```

Pearson correlation must exceed threshold (default 0.9).

### R3: Rotation Management
```typescript
interface RotationManager {
  rotateHeldOutSet(): Promise<void>;
  getCurrentRotation(): Date;
  getHeldOutSet(): Issue[];
  getTrainingSet(): Issue[];
}
```

Monthly rotation moves held-out to training, selects fresh held-out.

### R4: Issue Fingerprinting
```typescript
interface IssueFingerprint {
  issue_id: string;
  content_hash: string;
  solution_hash: string;
  created_at: string;
  added_to_training: string | null;
}
```

Enable contamination detection by tracking when issues entered training set.

## Technical Approach

### Implementation

```typescript
// benchmarks/sampler.ts

import { createHash } from 'crypto';

interface Issue {
  id: string;
  repo: string;
  number: number;
  title: string;
  body: string;
  difficulty: 'easy' | 'medium' | 'hard';
  solution?: string;
}

interface AnchorPointConfig {
  sampleRate: number;           // 0.01 = 1%
  selection: 'stratified' | 'random';
  stratificationKey: 'difficulty';
  rotationPeriod: 'weekly' | 'monthly';
  validation: {
    enabled: boolean;
    correlationThreshold: number;
    validationRuns: number;
  };
}

export class BenchmarkSampler {
  private trainingSet: Issue[] = [];
  private heldOutSet: Issue[] = [];
  private currentRotation: Date;
  private fingerprints: Map<string, IssueFingerprint> = new Map();

  constructor(private config: AnchorPointConfig) {
    this.currentRotation = this.getRotationDate();
  }

  /**
   * Select representative anchor points from full benchmark.
   * Uses stratified sampling to ensure coverage across difficulty levels.
   */
  selectAnchorPoints(fullBenchmark: Issue[]): Issue[] {
    if (this.config.selection === 'random') {
      return this.randomSample(fullBenchmark, this.config.sampleRate);
    }

    // Stratified sampling
    const strata = this.stratifyByDifficulty(fullBenchmark);
    const anchors: Issue[] = [];

    for (const [difficulty, issues] of Object.entries(strata)) {
      const count = Math.max(1, Math.ceil(issues.length * this.config.sampleRate));
      anchors.push(...this.randomSample(issues, count / issues.length));
    }

    return anchors;
  }

  /**
   * Validate that anchor points correlate with full benchmark.
   * Run periodically to ensure sampling remains valid.
   */
  async validateCorrelation(
    anchorResults: number[],
    fullResults: number[]
  ): Promise<{ correlation: number; valid: boolean }> {
    const correlation = this.pearsonCorrelation(anchorResults, fullResults);
    return {
      correlation,
      valid: correlation >= this.config.validation.correlationThreshold
    };
  }

  /**
   * Monthly rotation: move held-out to training, select new held-out.
   */
  async rotateHeldOutSet(freshIssues: Issue[]): Promise<void> {
    const newRotation = this.getRotationDate();

    if (newRotation > this.currentRotation) {
      // Move current held-out to training
      for (const issue of this.heldOutSet) {
        const fp = this.fingerprints.get(issue.id);
        if (fp) {
          fp.added_to_training = new Date().toISOString();
        }
        this.trainingSet.push(issue);
      }

      // Select new held-out from fresh issues
      this.heldOutSet = this.selectForHeldOut(freshIssues);

      // Fingerprint new held-out issues
      for (const issue of this.heldOutSet) {
        this.fingerprints.set(issue.id, {
          issue_id: issue.id,
          content_hash: this.hashContent(issue),
          solution_hash: issue.solution ? this.hashContent({ body: issue.solution }) : '',
          created_at: new Date().toISOString(),
          added_to_training: null
        });
      }

      this.currentRotation = newRotation;
    }
  }

  /**
   * Get fingerprint for contamination detection.
   */
  getFingerprint(issueId: string): IssueFingerprint | undefined {
    return this.fingerprints.get(issueId);
  }

  // Private helpers

  private stratifyByDifficulty(issues: Issue[]): Record<string, Issue[]> {
    return issues.reduce((acc, issue) => {
      const key = issue.difficulty || 'unknown';
      (acc[key] = acc[key] || []).push(issue);
      return acc;
    }, {} as Record<string, Issue[]>);
  }

  private randomSample(issues: Issue[], rate: number): Issue[] {
    const count = Math.ceil(issues.length * rate);
    const shuffled = [...issues].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private selectForHeldOut(issues: Issue[]): Issue[] {
    // Stratified selection for held-out set
    const strata = this.stratifyByDifficulty(issues);
    const selected: Issue[] = [];

    for (const stratum of Object.values(strata)) {
      // Select ~10% of each stratum for held-out
      const count = Math.max(5, Math.ceil(stratum.length * 0.1));
      selected.push(...this.randomSample(stratum, count / stratum.length));
    }

    return selected;
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private hashContent(obj: { body?: string; title?: string }): string {
    const content = `${obj.title || ''}::${obj.body || ''}`;
    return createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  private getRotationDate(): Date {
    const now = new Date();
    if (this.config.rotationPeriod === 'monthly') {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    // Weekly: start of week
    const day = now.getDay();
    const diff = now.getDate() - day;
    return new Date(now.setDate(diff));
  }
}
```

## Files

### New Files
| File | Purpose |
|------|---------|
| `benchmarks/sampler.ts` | Anchor point sampling |
| `benchmarks/sampler.test.ts` | Unit tests |

## Acceptance Criteria

- [ ] `selectAnchorPoints()` returns stratified sample
- [ ] Sample rate configurable (default 1%)
- [ ] `validateCorrelation()` computes Pearson r
- [ ] Rotation moves held-out to training
- [ ] Fingerprinting tracks issue history
- [ ] Unit tests cover edge cases

## Gates

### Entry Gate
- SPEC-SIL-002 (Config) complete
- Sample issues available for testing

### Exit Gate
- Correlation validation passes (r > 0.9 on test data)
- Sampling reduces benchmark size by configured rate

## Dependencies

- SPEC-SIL-002 (Benchmark Config)

## Blocked By

- SPEC-SIL-002

## Blocks

- SPEC-SIL-004 (Tiered Evaluator)
- SPEC-SIL-009 (Contamination Detection)

---

**Created**: 2026-01-19
**Source**: PLAN Week 2, Section 2.1
