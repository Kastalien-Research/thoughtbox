import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

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
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  // Load baseline CV from previous run
  const baselineResults = JSON.parse(
    readFileSync('dgm-specs/validation/baseline-results.json', 'utf-8')
  );
  const result = runSensitivityValidation(baselineResults.cv);
  writeFileSync(
    'dgm-specs/validation/sensitivity-results.json',
    JSON.stringify(result, null, 2)
  );
}
