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
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const result = runBaselineValidation();
  writeFileSync(
    'dgm-specs/validation/baseline-results.json',
    JSON.stringify(result, null, 2)
  );
}
