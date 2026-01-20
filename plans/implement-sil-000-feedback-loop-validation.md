# SPEC-SIL-000: Feedback Loop Validation

> **Status**: Ready for Implementation
> **Priority**: CRITICAL (Gates all other specs)
> **Estimated Effort**: 6 hours
> **Created**: 2026-01-19
> **Simplified**: 2026-01-19 (post-review)

## Overview

Validate that our measurement apparatus is trustworthy before spending tokens on improvement cycles.

**Requirements:**
1. Baseline reproducibility: CV < 5% across 3 runs
2. Sensitivity: 4 tests (2 known-good, 2 known-bad) detect expected direction
3. Signal > Noise: Changes exceed baseline variance

**Decision**: Use `npm test` fallback (Distbook assessment complete - see `dgm-specs/distbook-status.md`)

---

## Task 1: Foundation (2 hours)

Create directory structure, config, and CLAUDE.md updater.

### 1.1 Directory Structure

```bash
mkdir -p dgm-specs/{validation,history/runs}
```

### 1.2 Create Config

**File**: `dgm-specs/config.yaml`

```yaml
name: thoughtbox-improvement
version: "1.0"

validation:
  min_runs: 3
  cv_threshold: 0.05  # 5%

budgets:
  per_run_tokens: 2000000      # ~$4 equivalent
  daily_tokens: 10000000       # ~$20 equivalent
```

### 1.3 Add CLAUDE.md Section

Add to `CLAUDE.md`:

```markdown
## Improvement Loop Learnings

> Auto-generated learnings from autonomous improvement cycles

### What Works

### What Doesn't Work

### Current Capability Gaps
```

### 1.4 Create Simple Updater

**File**: `src/improvement/claude-md-updater.ts`

```typescript
import { readFileSync, writeFileSync } from 'fs';

interface Learning {
  type: 'success' | 'failure' | 'insight';
  hypothesis: string;
  lesson: string;
  timestamp: string;
}

const SECTIONS = {
  success: '### What Works',
  failure: "### What Doesn't Work",
  insight: '### Current Capability Gaps'
} as const;

export function updateClaudeMd(learning: Learning, path = 'CLAUDE.md'): void {
  let content = readFileSync(path, 'utf-8');

  const section = SECTIONS[learning.type];
  const entry = `- **${learning.hypothesis}** (${learning.timestamp}): ${learning.lesson}`;

  const idx = content.indexOf(section);
  if (idx === -1) throw new Error(`Section not found: ${section}`);

  const insertAt = content.indexOf('\n', idx + section.length) + 1;
  content = content.slice(0, insertAt) + entry + '\n' + content.slice(insertAt);

  writeFileSync(path, content);
}
```

**Test**: `src/improvement/claude-md-updater.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { updateClaudeMd } from './claude-md-updater';

const TEST_PATH = '/tmp/test-claude.md';
const TEMPLATE = `# CLAUDE.md

## Improvement Loop Learnings

### What Works

### What Doesn't Work

### Current Capability Gaps
`;

describe('updateClaudeMd', () => {
  beforeEach(() => writeFileSync(TEST_PATH, TEMPLATE));
  afterEach(() => unlinkSync(TEST_PATH));

  it('inserts learning under correct section', () => {
    updateClaudeMd({
      type: 'success',
      hypothesis: 'test',
      lesson: 'it worked',
      timestamp: '2026-01-19'
    }, TEST_PATH);

    const content = readFileSync(TEST_PATH, 'utf-8');
    expect(content).toContain('### What Works\n- **test**');
  });
});
```

---

## Task 2: Baseline Reproducibility (2 hours)

Run benchmarks 3 times, verify CV < 5%.

**File**: `dgm-specs/validation/baseline.ts`

```typescript
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

interface Run {
  runNumber: number;
  timestamp: string;
  score: number;
  durationMs: number;
}

interface BaselineResult {
  runs: Run[];
  mean: number;
  stdDev: number;
  cv: number;
  reproducible: boolean;
  recommendation: string;
}

export function runBaselineValidation(): BaselineResult {
  const runs: Run[] = [];

  console.log('Running baseline validation (3 runs)...\n');

  for (let i = 0; i < 3; i++) {
    console.log(`Run ${i + 1}/3...`);
    const start = Date.now();

    const output = execSync('npm test -- --tool thoughtbox', {
      encoding: 'utf-8',
      timeout: 300000
    });

    // Parse: "TOOL: thoughtbox | PASSED: 14 | FAILED: 1"
    const match = output.match(/PASSED:\s*(\d+).*FAILED:\s*(\d+)/);
    if (!match) throw new Error('Unexpected test output format');

    const passed = parseInt(match[1], 10);
    const failed = parseInt(match[2], 10);
    const score = passed / (passed + failed);

    runs.push({
      runNumber: i + 1,
      timestamp: new Date().toISOString(),
      score,
      durationMs: Date.now() - start
    });

    console.log(`  Score: ${(score * 100).toFixed(1)}% (${passed}/${passed + failed})\n`);
  }

  // Calculate CV
  const scores = runs.map(r => r.score);
  const mean = scores.reduce((a, b) => a + b) / scores.length;
  const variance = scores.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean !== 0 ? stdDev / mean : Infinity;

  const reproducible = cv < 0.05;
  const recommendation = reproducible
    ? `PASS: CV=${(cv * 100).toFixed(2)}% < 5%. Proceed with improvement loop.`
    : `FAIL: CV=${(cv * 100).toFixed(2)}% >= 5%. Investigate variance sources.`;

  console.log(`\nResult: ${recommendation}`);

  return { runs, mean, stdDev, cv, reproducible, recommendation };
}

// Run if executed directly
if (require.main === module) {
  const result = runBaselineValidation();
  writeFileSync(
    'dgm-specs/validation/baseline-results.json',
    JSON.stringify(result, null, 2)
  );
}
```

---

## Task 3: Sensitivity Validation (2 hours)

Apply known changes, verify detection.

**File**: `dgm-specs/validation/sensitivity.ts`

```typescript
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

interface SensitivityTest {
  name: string;
  type: 'known-good' | 'known-bad';
  file: string;
  apply: string;
  revert: string;
  expectedDirection: 'improve' | 'regress';
}

interface TestResult extends SensitivityTest {
  baselineScore: number;
  modifiedScore: number;
  delta: number;
  actualDirection: 'improve' | 'regress' | 'no-change';
  passed: boolean;
}

// 2 known-good (reverting causes regression), 2 known-bad (applying causes regression)
const TESTS: SensitivityTest[] = [
  {
    name: 'gateway-only-architecture',
    type: 'known-good',
    file: 'src/server-factory.ts',
    apply: 'git show d69d633^:src/server-factory.ts > src/server-factory.ts',
    revert: 'git restore src/server-factory.ts',
    expectedDirection: 'regress'
  },
  {
    name: 'branchid-validation',
    type: 'known-good',
    file: 'src/thought-handler.ts',
    apply: "sed -i '' 's/if (data.branchId && !data.branchFromThought)/if (false)/' src/thought-handler.ts",
    revert: 'git restore src/thought-handler.ts',
    expectedDirection: 'regress'
  },
  {
    name: 'artificial-latency',
    type: 'known-bad',
    file: 'src/thought-handler.ts',
    apply: "sed -i '' 's/async addThought(/async addThought() { await new Promise(r => setTimeout(r, 500)); return this._addThought(); } async _addThought(/' src/thought-handler.ts",
    revert: 'git restore src/thought-handler.ts',
    expectedDirection: 'regress'
  },
  {
    name: 'remove-error-context',
    type: 'known-bad',
    file: 'src/thought-handler.ts',
    apply: "sed -i '' 's/throw new Error(/throw new Error(\"error\"); \\/\\/ /' src/thought-handler.ts",
    revert: 'git restore src/thought-handler.ts',
    expectedDirection: 'regress'
  }
];

function runBenchmark(): number {
  const output = execSync('npm test -- --tool thoughtbox', {
    encoding: 'utf-8',
    timeout: 300000
  });
  const match = output.match(/PASSED:\s*(\d+).*FAILED:\s*(\d+)/);
  if (!match) throw new Error('Unexpected output');
  const passed = parseInt(match[1], 10);
  const failed = parseInt(match[2], 10);
  return passed / (passed + failed);
}

export function runSensitivityValidation(baselineCV: number): {
  tests: TestResult[];
  allPassed: boolean;
  recommendation: string;
} {
  console.log('Running sensitivity validation...\n');

  // Get fresh baseline
  console.log('Getting baseline score...');
  const baseline = runBenchmark();
  console.log(`Baseline: ${(baseline * 100).toFixed(1)}%\n`);

  const threshold = 2 * baselineCV; // Signal must exceed 2x variance
  const results: TestResult[] = [];

  for (const test of TESTS) {
    console.log(`Testing: ${test.name} (${test.type})...`);

    try {
      // Apply modification
      execSync(test.apply, { stdio: 'pipe' });
      execSync('npm run build:local', { stdio: 'pipe' });

      // Run benchmark
      const modified = runBenchmark();
      const delta = modified - baseline;

      const actualDirection: 'improve' | 'regress' | 'no-change' =
        delta > threshold ? 'improve' :
        delta < -threshold ? 'regress' : 'no-change';

      const passed = actualDirection === test.expectedDirection;

      results.push({
        ...test,
        baselineScore: baseline,
        modifiedScore: modified,
        delta,
        actualDirection,
        passed
      });

      console.log(`  Modified: ${(modified * 100).toFixed(1)}%, Delta: ${(delta * 100).toFixed(2)}%`);
      console.log(`  Expected: ${test.expectedDirection}, Actual: ${actualDirection}`);
      console.log(`  ${passed ? 'PASS' : 'FAIL'}\n`);

    } finally {
      // Always revert
      execSync(test.revert, { stdio: 'pipe' });
      execSync('npm run build:local', { stdio: 'pipe' });
    }
  }

  const allPassed = results.every(r => r.passed);
  const passCount = results.filter(r => r.passed).length;

  const recommendation = allPassed
    ? `PASS: ${passCount}/${results.length} sensitivity tests passed.`
    : `FAIL: ${passCount}/${results.length} tests passed. Review failing tests.`;

  console.log(`\nResult: ${recommendation}`);

  return { tests: results, allPassed, recommendation };
}

// Run if executed directly
if (require.main === module) {
  // Load baseline CV from previous run
  const baselineResults = require('./baseline-results.json');
  const result = runSensitivityValidation(baselineResults.cv);
  writeFileSync(
    'dgm-specs/validation/sensitivity-results.json',
    JSON.stringify(result, null, 2)
  );
}
```

---

## Acceptance Criteria

| Criterion | Target |
|-----------|--------|
| Baseline CV | < 5% |
| Sensitivity tests | 4/4 pass |
| Signal > Noise | Delta > 2 * baseline_cv |

### Checklist

- [ ] `dgm-specs/` directory created
- [ ] `dgm-specs/config.yaml` exists
- [ ] CLAUDE.md has "Improvement Loop Learnings" section
- [ ] `updateClaudeMd()` passes unit test
- [ ] Baseline CV < 5% (3 runs)
- [ ] All 4 sensitivity tests pass
- [ ] `baseline-results.json` written
- [ ] `sensitivity-results.json` written

---

## Run Order

```bash
# 1. Foundation (manual)
mkdir -p dgm-specs/{validation,history/runs}
# Create config.yaml, update CLAUDE.md, create updater

# 2. Run baseline
npx tsx dgm-specs/validation/baseline.ts

# 3. Run sensitivity (requires baseline-results.json)
npx tsx dgm-specs/validation/sensitivity.ts
```

---

## Files Created

| File | Purpose |
|------|---------|
| `dgm-specs/config.yaml` | Budget configuration |
| `dgm-specs/validation/baseline.ts` | Reproducibility validation |
| `dgm-specs/validation/sensitivity.ts` | Sensitivity validation |
| `dgm-specs/validation/baseline-results.json` | Output |
| `dgm-specs/validation/sensitivity-results.json` | Output |
| `src/improvement/claude-md-updater.ts` | Learning capture |
| `src/improvement/claude-md-updater.test.ts` | Unit test |

---

## Known Limitations

1. **sed commands are macOS-specific** - `sed -i ''` syntax. For Linux CI, use `sed -i` without quotes.
2. **No retry logic** - If `npm test` fails, fix manually and re-run.
3. **No timing gap between runs** - Add `sleep` if variance is high.

---

**Source**: SPEC-SIL-000-feedback-loop-validation.md
**Simplified after**: DHH, TypeScript, and Simplicity reviews
**Total code**: ~150 lines (not 1000+)
