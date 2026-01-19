# SPEC-SIL-000: Feedback Loop Validation

> **Status**: Draft
> **Priority**: CRITICAL (MUST complete before other specs)
> **Week**: 0 (Pre-flight)
> **Phase**: Validation
> **Estimated Effort**: 8-12 hours
> **Source**: Claude Desktop validation spec

## Summary

Pre-flight checks and structural work required before the autonomous improvement loop can produce trustworthy signal. We cannot trust improvement signals until we've verified the measurement apparatus works in both directions.

**Core Principle**: The feedback loop must:
1. Produce reproducible baselines (variance < 5%)
2. Detect improvements when they exist
3. Detect regressions when they occur
4. Have signal exceed noise

## Problem Statement

Without validation:
- We might spend tokens on "improvements" that are just noise
- We can't distinguish real improvements from measurement variance
- We might miss real regressions
- The compounding nature of CLAUDE.md learnings means errors propagate

## Scope

### In Scope
1. Baseline reproducibility validation
2. Sensitivity validation (known-good / known-bad)
3. dgm-specs/ directory structure
4. CLAUDE.md update mechanism
5. Distbook status assessment (blocking dependency)
6. Token-based cost tracking

### Out of Scope
- Actual improvement cycles (must wait for validation)
- Full benchmark suite implementation

## Requirements

### R1: Baseline Reproducibility
Run the same benchmark 3 times against unchanged Thoughtbox. Variance must be < 5%.

```typescript
interface ReproducibilityResult {
  runs: BaselineRun[];
  variance: number;
  reproducible: boolean;  // variance < 0.05
  recommendation: string;
}
```

### R2: Sensitivity Validation
Verify benchmarks detect both improvements AND regressions.

```typescript
interface SensitivityTest {
  name: string;
  type: 'known-good' | 'known-bad';
  expectedDirection: 'improve' | 'regress';
  actualDirection?: 'improve' | 'regress' | 'no-change';
  deltaScore?: number;
}
```

### R3: Token-Based Budgets
All cost tracking uses tokens as primary unit.

```yaml
budgets:
  per_run:
    tokens: 2000000      # 2M tokens max per iteration
  daily:
    tokens: 10000000     # 10M tokens daily cap
  monthly:
    tokens: 50000000     # 50M tokens monthly cap
```

### R4: CLAUDE.md Learning Capture
Mechanism to append learnings to CLAUDE.md after each cycle.

## Technical Approach

### Task 1: Baseline Reproducibility

Create `validation/baseline-reproducibility.ts`:

```typescript
interface BaselineRun {
  runNumber: number;
  timestamp: string;
  scores: {
    behavioral: number;
  };
  tokenCount: number;
  durationMs: number;
}

async function runBaselineValidation(): Promise<ReproducibilityResult> {
  const runs: BaselineRun[] = [];

  for (let i = 0; i < 3; i++) {
    const start = Date.now();
    const result = await runBehavioralTests();
    runs.push({
      runNumber: i + 1,
      timestamp: new Date().toISOString(),
      scores: { behavioral: result.score },
      tokenCount: result.tokens,
      durationMs: Date.now() - start
    });
  }

  const scores = runs.map(r => r.scores.behavioral);
  const mean = scores.reduce((a, b) => a + b) / scores.length;
  const variance = scores.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / scores.length;
  const cv = Math.sqrt(variance) / mean;  // Coefficient of variation

  return {
    runs,
    variance: cv,
    reproducible: cv < 0.05,
    recommendation: cv < 0.05
      ? 'Baseline is reproducible, proceed with improvement loop'
      : 'Baseline variance too high, investigate sources of noise'
  };
}
```

### Task 2: Sensitivity Validation

Create `validation/sensitivity-test.ts`:

```typescript
const SENSITIVITY_TESTS: SensitivityTest[] = [
  {
    name: 'gateway-only-architecture',
    type: 'known-good',
    modification: {
      file: 'src/index.ts',
      change: 'Revert to pre-gateway architecture',
      revert: 'git checkout d69d633 -- src/index.ts'
    },
    expectedDirection: 'regress'  // Reverting good change = regression
  },
  {
    name: 'artificial-latency',
    type: 'known-bad',
    modification: {
      file: 'src/thought-handler.ts',
      change: 'Add 500ms delay to addThought',
      revert: 'Remove the delay'
    },
    expectedDirection: 'regress'
  }
];

async function runSensitivityValidation(): Promise<SensitivityResult> {
  const baseline = await runBenchmark();
  const results: SensitivityTest[] = [];

  for (const test of SENSITIVITY_TESTS) {
    // Apply modification
    await applyModification(test.modification);

    // Run benchmark
    const modified = await runBenchmark();

    // Calculate delta
    const delta = modified.score - baseline.score;

    // Revert
    await revertModification(test.modification);

    results.push({
      ...test,
      actualDirection: delta > 0.01 ? 'improve' : delta < -0.01 ? 'regress' : 'no-change',
      deltaScore: delta
    });
  }

  return { tests: results, baselineScore: baseline.score };
}
```

### Task 3: Directory Structure

```
dgm-specs/
├── README.md
├── config.yaml                        # Token-based budgets
├── targets/                           # Capability targets
│   ├── context-retrieval.md
│   ├── reasoning-coherence.md
│   └── recovery-robustness.md
├── hypotheses/
│   ├── active/
│   └── tested/
│       └── 000-baseline.md
├── benchmarks/
│   ├── registry.yaml
│   └── suite.yaml
├── validation/
│   ├── baseline-reproducibility.ts
│   ├── baseline-results.json
│   ├── sensitivity-test.ts
│   └── sensitivity-results.json
└── history/
    └── runs/
```

### Task 4: CLAUDE.md Update Mechanism

```typescript
// src/improvement/claude-md-updater.ts

interface Learning {
  type: 'success' | 'failure' | 'insight';
  hypothesis: string;
  outcome: string;
  lesson: string;
  timestamp: string;
}

export async function updateClaudeMd(learning: Learning): Promise<void> {
  const claudeMd = await readFile('CLAUDE.md', 'utf-8');

  const section = learning.type === 'success'
    ? '### What Works'
    : learning.type === 'failure'
    ? "### What Doesn't Work"
    : '### Current Capability Gaps';

  const entry = `- **${learning.hypothesis}** (${learning.timestamp}): ${learning.lesson}`;

  // Insert entry under appropriate section
  const updated = insertUnderSection(claudeMd, section, entry);

  await writeFile('CLAUDE.md', updated);
}
```

### Task 5: Distbook Status Assessment

Create `dgm-specs/distbook-status.md` documenting:
- cell_execute wiring status
- Client transport status
- Blocking issues
- Recommendation: proceed or fallback to npm test

### Task 6: Token Conversion

Update all cost references to use tokens as primary unit:
- `cost: $0.10` → `cost_tokens: 50000`
- `budget_usd` → `budget_tokens`
- Default budget: 5M tokens

## Files

### New Files
| File | Purpose |
|------|---------|
| `dgm-specs/config.yaml` | Token budgets and thresholds |
| `dgm-specs/validation/baseline-reproducibility.ts` | Reproducibility test |
| `dgm-specs/validation/sensitivity-test.ts` | Sensitivity test |
| `dgm-specs/hypotheses/tested/000-baseline.md` | Initial baseline |
| `dgm-specs/distbook-status.md` | Distbook assessment |
| `src/improvement/claude-md-updater.ts` | Learning capture |

### Modified Files
| File | Changes |
|------|---------|
| `CLAUDE.md` | Add "Improvement Loop Learnings" section |

## Acceptance Criteria

- [ ] Baseline reproducibility: variance < 5% across 3 runs
- [ ] Sensitivity: known-good produces improvement signal
- [ ] Sensitivity: known-bad produces regression signal
- [ ] Both deltas exceed baseline variance (signal > noise)
- [ ] dgm-specs/ structure complete
- [ ] config.yaml uses token-based budgets
- [ ] CLAUDE.md update mechanism ready
- [ ] Distbook status documented with recommendation

## Gates

### Entry Gate
- None (this is the first spec)

### Exit Gate
- All acceptance criteria met
- Recommendation on Distbook (proceed or fallback)
- Green light to begin improvement cycles

## Dependencies

- None

## Blocked By

- None

## Blocks

- ALL other specs (this must complete first)

## Fallback Strategy

If Distbook is too far from ready:
- Use `npm test` directly in Thoughtbox repo
- Less elegant but zero additional infrastructure
- Task 5 assessment will determine if this is necessary

---

**Created**: 2026-01-19
**Source**: Claude Desktop validation spec
**Priority**: Must complete before any improvement cycle spend
