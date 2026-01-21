#!/usr/bin/env npx tsx
/**
 * Unit tests for Benchmark Anchor Point Sampler
 * SPEC: SIL-003
 *
 * Run with: npx tsx tests/unit/sampler.test.ts
 */

import {
  BenchmarkSampler,
  DEFAULT_ANCHOR_CONFIG,
  type Issue,
  type AnchorPointConfig,
  type SamplerState,
} from "../../benchmarks/sampler.js";

// =============================================================================
// Test Utilities
// =============================================================================

let testsPassed = 0;
let testsFailed = 0;
let currentTest = "";

function test(name: string, fn: () => void | Promise<void>): void {
  currentTest = name;
  Promise.resolve(fn())
    .then(() => {
      testsPassed++;
      console.log(`  \u2713 ${name}`);
    })
    .catch((err) => {
      testsFailed++;
      console.error(`  \u2717 ${name}`);
      console.error(`    Error: ${err.message}`);
    });
}

function assert(condition: boolean, message?: string): void {
  if (!condition) {
    throw new Error(message || `Assertion failed in "${currentTest}"`);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      message ||
        `Expected "${expected}" but got "${actual}" in "${currentTest}"`
    );
  }
}

function assertApproxEqual(
  actual: number,
  expected: number,
  tolerance: number,
  message?: string
): void {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(
      message ||
        `Expected ~${expected} (±${tolerance}) but got ${actual} in "${currentTest}"`
    );
  }
}

// =============================================================================
// Test Fixtures
// =============================================================================

function createTestIssues(count: number): Issue[] {
  const difficulties: Array<"easy" | "medium" | "hard"> = [
    "easy",
    "medium",
    "hard",
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: `issue-${i + 1}`,
    repo: "test/repo",
    number: i + 1,
    title: `Test issue ${i + 1}`,
    body: `This is the body of test issue ${i + 1}`,
    difficulty: difficulties[i % 3],
    solution: i % 2 === 0 ? `Solution for issue ${i + 1}` : undefined,
  }));
}

function createStratifiedIssues(): Issue[] {
  // 30 easy, 60 medium, 10 hard = 100 issues
  const issues: Issue[] = [];

  for (let i = 0; i < 30; i++) {
    issues.push({
      id: `easy-${i}`,
      repo: "test/repo",
      number: i,
      title: `Easy issue ${i}`,
      body: `Easy body ${i}`,
      difficulty: "easy",
    });
  }

  for (let i = 0; i < 60; i++) {
    issues.push({
      id: `medium-${i}`,
      repo: "test/repo",
      number: 30 + i,
      title: `Medium issue ${i}`,
      body: `Medium body ${i}`,
      difficulty: "medium",
    });
  }

  for (let i = 0; i < 10; i++) {
    issues.push({
      id: `hard-${i}`,
      repo: "test/repo",
      number: 90 + i,
      title: `Hard issue ${i}`,
      body: `Hard body ${i}`,
      difficulty: "hard",
    });
  }

  return issues;
}

// =============================================================================
// Tests
// =============================================================================

async function runTests(): Promise<void> {
  console.log("\nBenchmark Sampler Tests\n");

  // -------------------------------------------------------------------------
  // R1: Stratified Sampling Tests
  // -------------------------------------------------------------------------

  console.log("R1: Stratified Sampling Tests:");

  test("selectAnchorPoints returns empty array for empty input", () => {
    const sampler = new BenchmarkSampler();
    const anchors = sampler.selectAnchorPoints([]);
    assertEqual(anchors.length, 0);
  });

  test("selectAnchorPoints with random selection", () => {
    const config: AnchorPointConfig = {
      ...DEFAULT_ANCHOR_CONFIG,
      selection: "random",
      sampleRate: 0.1, // 10%
    };
    const sampler = new BenchmarkSampler(config);
    const issues = createTestIssues(100);
    const anchors = sampler.selectAnchorPoints(issues);

    // With 10% rate on 100 issues, expect ~10 samples
    assert(anchors.length >= 5 && anchors.length <= 20, `Expected ~10 anchors but got ${anchors.length}`);
  });

  test("selectAnchorPoints with stratified selection covers all strata", () => {
    const config: AnchorPointConfig = {
      ...DEFAULT_ANCHOR_CONFIG,
      selection: "stratified",
      sampleRate: 0.1, // 10%
    };
    const sampler = new BenchmarkSampler(config);
    const issues = createStratifiedIssues();
    const anchors = sampler.selectAnchorPoints(issues);

    // Should have at least one from each difficulty
    const difficulties = new Set(anchors.map((a) => a.difficulty));
    assert(difficulties.has("easy"), "Should include easy issues");
    assert(difficulties.has("medium"), "Should include medium issues");
    assert(difficulties.has("hard"), "Should include hard issues");
  });

  test("selectAnchorPoints respects sample rate proportionally per stratum", () => {
    const config: AnchorPointConfig = {
      ...DEFAULT_ANCHOR_CONFIG,
      selection: "stratified",
      sampleRate: 0.1, // 10%
    };
    const sampler = new BenchmarkSampler(config);
    const issues = createStratifiedIssues(); // 30 easy, 60 medium, 10 hard

    // Run multiple times and average to account for randomness
    let totalEasy = 0;
    let totalMedium = 0;
    let totalHard = 0;
    const runs = 50;

    for (let i = 0; i < runs; i++) {
      const anchors = sampler.selectAnchorPoints(issues);
      totalEasy += anchors.filter((a) => a.difficulty === "easy").length;
      totalMedium += anchors.filter((a) => a.difficulty === "medium").length;
      totalHard += anchors.filter((a) => a.difficulty === "hard").length;
    }

    const avgEasy = totalEasy / runs;
    const avgMedium = totalMedium / runs;
    const avgHard = totalHard / runs;

    // 10% of 30 = 3, 10% of 60 = 6, 10% of 10 = 1 (minimum)
    assertApproxEqual(avgEasy, 3, 2, `Expected ~3 easy but got ${avgEasy}`);
    assertApproxEqual(avgMedium, 6, 2, `Expected ~6 medium but got ${avgMedium}`);
    // Hard has minimum of 1
    assert(avgHard >= 1, `Expected at least 1 hard but got ${avgHard}`);
  });

  test("selectAnchorPoints ensures at least 1 per stratum", () => {
    const config: AnchorPointConfig = {
      ...DEFAULT_ANCHOR_CONFIG,
      selection: "stratified",
      sampleRate: 0.001, // Very low rate
    };
    const sampler = new BenchmarkSampler(config);
    const issues = createStratifiedIssues();
    const anchors = sampler.selectAnchorPoints(issues);

    // Even with tiny rate, should have at least 1 from each
    const difficulties = new Set(anchors.map((a) => a.difficulty));
    assertEqual(difficulties.size, 3);
  });

  // -------------------------------------------------------------------------
  // R2: Correlation Validation Tests
  // -------------------------------------------------------------------------

  console.log("\nR2: Correlation Validation Tests:");

  test("validateCorrelation returns 1.0 for identical arrays", () => {
    const sampler = new BenchmarkSampler();
    const x = [1, 2, 3, 4, 5];
    const y = [1, 2, 3, 4, 5];
    const result = sampler.validateCorrelation(x, y);
    assertApproxEqual(result.correlation, 1.0, 0.001);
    assert(result.valid, "Should be valid for perfect correlation");
  });

  test("validateCorrelation returns -1.0 for perfectly negatively correlated", () => {
    const sampler = new BenchmarkSampler();
    const x = [1, 2, 3, 4, 5];
    const y = [5, 4, 3, 2, 1];
    const result = sampler.validateCorrelation(x, y);
    assertApproxEqual(result.correlation, -1.0, 0.001);
    assert(!result.valid, "Should not be valid for negative correlation");
  });

  test("validateCorrelation returns ~0 for uncorrelated data", () => {
    const sampler = new BenchmarkSampler();
    const x = [1, 2, 3, 4, 5];
    const y = [3, 3, 3, 3, 3]; // Constant - no correlation
    const result = sampler.validateCorrelation(x, y);
    assertEqual(result.correlation, 0);
    assert(!result.valid, "Should not be valid for no correlation");
  });

  test("validateCorrelation handles empty arrays", () => {
    const sampler = new BenchmarkSampler();
    const result = sampler.validateCorrelation([], []);
    assertEqual(result.correlation, 0);
    assert(!result.valid, "Should not be valid for empty arrays");
  });

  test("validateCorrelation handles mismatched array lengths", () => {
    const sampler = new BenchmarkSampler();
    const result = sampler.validateCorrelation([1, 2, 3], [1, 2]);
    assertEqual(result.correlation, 0);
    assert(!result.valid, "Should not be valid for mismatched lengths");
  });

  test("validateCorrelation uses configurable threshold", () => {
    const config: AnchorPointConfig = {
      ...DEFAULT_ANCHOR_CONFIG,
      validation: {
        enabled: true,
        correlationThreshold: 0.95,
        validationRuns: 3,
      },
    };
    const sampler = new BenchmarkSampler(config);
    const x = [1, 2, 3, 4, 5];
    const y = [1.1, 2.1, 2.9, 4.1, 4.9]; // High but not perfect correlation
    const result = sampler.validateCorrelation(x, y);
    // This should be around 0.99, above 0.9 but check against 0.95
    assert(result.correlation > 0.95, `Expected correlation > 0.95 but got ${result.correlation}`);
    assert(result.valid, "Should be valid above threshold");
  });

  // -------------------------------------------------------------------------
  // R3: Rotation Management Tests
  // -------------------------------------------------------------------------

  console.log("\nR3: Rotation Management Tests:");

  test("getCurrentRotation returns a Date", () => {
    const sampler = new BenchmarkSampler();
    const rotation = sampler.getCurrentRotation();
    assert(rotation instanceof Date, "Should return a Date");
  });

  test("getHeldOutSet returns copy of held-out set", () => {
    const sampler = new BenchmarkSampler();
    const heldOut = sampler.getHeldOutSet();
    assert(Array.isArray(heldOut), "Should return an array");
  });

  test("getTrainingSet returns copy of training set", () => {
    const sampler = new BenchmarkSampler();
    const training = sampler.getTrainingSet();
    assert(Array.isArray(training), "Should return an array");
  });

  test("rotateHeldOutSet populates held-out from fresh issues", () => {
    // Create a sampler with a past rotation date to force rotation
    const config: AnchorPointConfig = {
      ...DEFAULT_ANCHOR_CONFIG,
      rotationPeriod: "monthly",
    };
    const sampler = new BenchmarkSampler(config);

    // Manually set a past rotation by importing state
    const pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - 2);
    sampler.importState({
      trainingSet: [],
      heldOutSet: [],
      currentRotation: pastDate.toISOString(),
      fingerprints: {},
    });

    const freshIssues = createTestIssues(50);
    sampler.rotateHeldOutSet(freshIssues);

    const heldOut = sampler.getHeldOutSet();
    assert(heldOut.length > 0, "Held-out set should be populated after rotation");
  });

  test("rotateHeldOutSet moves old held-out to training", () => {
    const config: AnchorPointConfig = {
      ...DEFAULT_ANCHOR_CONFIG,
      rotationPeriod: "monthly",
    };
    const sampler = new BenchmarkSampler(config);

    // Set up initial state with held-out issues
    const pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - 2);
    const oldHeldOut = createTestIssues(10);

    sampler.importState({
      trainingSet: [],
      heldOutSet: oldHeldOut,
      currentRotation: pastDate.toISOString(),
      fingerprints: {},
    });

    const freshIssues = createTestIssues(50);
    sampler.rotateHeldOutSet(freshIssues);

    const training = sampler.getTrainingSet();
    // Old held-out should now be in training
    assert(
      training.length >= oldHeldOut.length,
      `Training should contain old held-out issues (got ${training.length}, expected >= ${oldHeldOut.length})`
    );
  });

  test("rotateHeldOutSet does nothing if rotation period not passed", () => {
    const sampler = new BenchmarkSampler();
    const initialState = sampler.exportState();

    const freshIssues = createTestIssues(50);
    sampler.rotateHeldOutSet(freshIssues);

    const finalState = sampler.exportState();
    assertEqual(
      finalState.currentRotation,
      initialState.currentRotation,
      "Rotation should not change if period not passed"
    );
  });

  // -------------------------------------------------------------------------
  // R4: Issue Fingerprinting Tests
  // -------------------------------------------------------------------------

  console.log("\nR4: Issue Fingerprinting Tests:");

  test("createFingerprint creates valid fingerprint", () => {
    const sampler = new BenchmarkSampler();
    const issue = createTestIssues(1)[0];
    const fingerprint = sampler.createFingerprint(issue);

    assertEqual(fingerprint.issue_id, issue.id);
    assert(fingerprint.content_hash.length === 16, "Content hash should be 16 chars");
    assert(fingerprint.created_at.length > 0, "Created at should be set");
    assertEqual(fingerprint.added_to_training, null);
  });

  test("createFingerprint generates solution hash when solution exists", () => {
    const sampler = new BenchmarkSampler();
    const issue: Issue = {
      id: "test-1",
      repo: "test/repo",
      number: 1,
      title: "Test",
      body: "Body",
      difficulty: "easy",
      solution: "This is the solution",
    };
    const fingerprint = sampler.createFingerprint(issue);

    assert(
      fingerprint.solution_hash.length === 16,
      "Solution hash should be 16 chars"
    );
  });

  test("createFingerprint generates empty solution hash when no solution", () => {
    const sampler = new BenchmarkSampler();
    const issue: Issue = {
      id: "test-1",
      repo: "test/repo",
      number: 1,
      title: "Test",
      body: "Body",
      difficulty: "easy",
    };
    const fingerprint = sampler.createFingerprint(issue);

    assertEqual(fingerprint.solution_hash, "");
  });

  test("getFingerprint retrieves created fingerprint", () => {
    const sampler = new BenchmarkSampler();
    const issue = createTestIssues(1)[0];
    sampler.createFingerprint(issue);

    const retrieved = sampler.getFingerprint(issue.id);
    assert(retrieved !== undefined, "Should retrieve fingerprint");
    assertEqual(retrieved!.issue_id, issue.id);
  });

  test("getFingerprint returns undefined for unknown issue", () => {
    const sampler = new BenchmarkSampler();
    const fingerprint = sampler.getFingerprint("nonexistent");
    assertEqual(fingerprint, undefined);
  });

  test("getAllFingerprints returns all fingerprints", () => {
    const sampler = new BenchmarkSampler();
    const issues = createTestIssues(5);
    for (const issue of issues) {
      sampler.createFingerprint(issue);
    }

    const all = sampler.getAllFingerprints();
    assertEqual(all.size, 5);
  });

  test("fingerprint content_hash is deterministic", () => {
    const sampler = new BenchmarkSampler();
    const issue = createTestIssues(1)[0];

    const fp1 = sampler.createFingerprint(issue);
    const fp2 = sampler.createFingerprint(issue);

    assertEqual(fp1.content_hash, fp2.content_hash);
  });

  test("fingerprint content_hash differs for different content", () => {
    const sampler = new BenchmarkSampler();
    const issue1: Issue = {
      id: "test-1",
      repo: "test/repo",
      number: 1,
      title: "Title A",
      body: "Body A",
      difficulty: "easy",
    };
    const issue2: Issue = {
      id: "test-2",
      repo: "test/repo",
      number: 2,
      title: "Title B",
      body: "Body B",
      difficulty: "easy",
    };

    const fp1 = sampler.createFingerprint(issue1);
    const fp2 = sampler.createFingerprint(issue2);

    assert(fp1.content_hash !== fp2.content_hash, "Different content should have different hashes");
  });

  // -------------------------------------------------------------------------
  // State Persistence Tests
  // -------------------------------------------------------------------------

  console.log("\nState Persistence Tests:");

  test("exportState returns serializable state", () => {
    const sampler = new BenchmarkSampler();
    const issues = createTestIssues(5);
    for (const issue of issues) {
      sampler.createFingerprint(issue);
    }

    const state = sampler.exportState();
    assert(typeof state.currentRotation === "string", "currentRotation should be string");
    assert(Array.isArray(state.trainingSet), "trainingSet should be array");
    assert(Array.isArray(state.heldOutSet), "heldOutSet should be array");
    assert(typeof state.fingerprints === "object", "fingerprints should be object");
  });

  test("importState restores sampler state", () => {
    const sampler1 = new BenchmarkSampler();
    const issues = createTestIssues(5);
    for (const issue of issues) {
      sampler1.createFingerprint(issue);
    }
    const exportedState = sampler1.exportState();

    const sampler2 = new BenchmarkSampler();
    sampler2.importState(exportedState);

    const fingerprints1 = sampler1.getAllFingerprints();
    const fingerprints2 = sampler2.getAllFingerprints();
    assertEqual(fingerprints1.size, fingerprints2.size);
  });

  test("state round-trips through JSON serialization", () => {
    const sampler = new BenchmarkSampler();
    const issues = createTestIssues(5);
    for (const issue of issues) {
      sampler.createFingerprint(issue);
    }

    const state = sampler.exportState();
    const json = JSON.stringify(state);
    const parsed = JSON.parse(json) as SamplerState;

    const sampler2 = new BenchmarkSampler();
    sampler2.importState(parsed);

    assertEqual(sampler2.getAllFingerprints().size, 5);
  });

  // -------------------------------------------------------------------------
  // Configuration Tests
  // -------------------------------------------------------------------------

  console.log("\nConfiguration Tests:");

  test("DEFAULT_ANCHOR_CONFIG has expected values", () => {
    assertEqual(DEFAULT_ANCHOR_CONFIG.sampleRate, 0.01);
    assertEqual(DEFAULT_ANCHOR_CONFIG.selection, "stratified");
    assertEqual(DEFAULT_ANCHOR_CONFIG.stratificationKey, "difficulty");
    assertEqual(DEFAULT_ANCHOR_CONFIG.rotationPeriod, "monthly");
    assertEqual(DEFAULT_ANCHOR_CONFIG.validation.enabled, true);
    assertEqual(DEFAULT_ANCHOR_CONFIG.validation.correlationThreshold, 0.9);
  });

  test("BenchmarkSampler accepts custom config", () => {
    const customConfig: AnchorPointConfig = {
      sampleRate: 0.05,
      selection: "random",
      stratificationKey: "difficulty",
      rotationPeriod: "weekly",
      validation: {
        enabled: false,
        correlationThreshold: 0.8,
        validationRuns: 5,
      },
    };
    const sampler = new BenchmarkSampler(customConfig);

    // Verify config is used by checking random selection behavior
    const issues = createStratifiedIssues();
    const anchors = sampler.selectAnchorPoints(issues);

    // Random selection with 5% rate on 100 issues = ~5 samples
    assert(
      anchors.length >= 2 && anchors.length <= 15,
      `Expected ~5 anchors with 5% rate but got ${anchors.length}`
    );
  });

  // -------------------------------------------------------------------------
  // Wait and Report
  // -------------------------------------------------------------------------

  await new Promise((resolve) => setTimeout(resolve, 200));

  console.log("\n" + "=".repeat(50));
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log("=".repeat(50));

  if (testsFailed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
