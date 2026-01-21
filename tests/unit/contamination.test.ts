#!/usr/bin/env npx tsx
/**
 * Unit tests for Contamination Detection
 * SPEC: SIL-009
 *
 * Run with: npx tsx tests/unit/contamination.test.ts
 */

import {
  ContaminationDetector,
  resetContaminationDetector,
  DEFAULT_CONTAMINATION_CONFIG,
  EXPECTED_SOLVE_TIMES,
  type TestCase,
  type KnownSolution,
} from "../../benchmarks/contamination.js";

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
// Tests
// =============================================================================

async function runTests(): Promise<void> {
  console.log("\nContamination Detection Tests\n");

  // Reset singleton before tests
  resetContaminationDetector();

  // -------------------------------------------------------------------------
  // R1: Similarity Checking Tests
  // -------------------------------------------------------------------------

  console.log("R1: Similarity Checking Tests:");

  test("detects high similarity to known solution", () => {
    const detector = new ContaminationDetector();
    const knownSolution = "function add(a, b) { return a + b; }";
    detector.addToTrainingSet("test-1", knownSolution);

    const result = detector.checkContamination(
      "function add(a, b) { return a + b; }",
      { id: "test-1", name: "Add", difficulty: "easy" }
    );

    assert(result.contaminated === true, "Should detect identical solution as contaminated");
    assert(result.checks.similarity !== undefined, "Should have similarity check");
    assert(result.checks.similarity!.contaminated === true, "Similarity check should flag contamination");
  });

  test("passes novel solutions with low similarity", () => {
    const detector = new ContaminationDetector();
    detector.addToTrainingSet(
      "test-1",
      "function add(a, b) { return a + b; }"
    );

    const result = detector.checkContamination(
      "const multiply = (x, y) => x * y;",
      { id: "test-1", name: "Add", difficulty: "easy" }
    );

    // Novel solution should not be contaminated
    assert(
      result.checks.similarity?.contaminated === false,
      "Novel solution should not be flagged"
    );
  });

  test("checkSimilarity returns correct values", () => {
    const detector = new ContaminationDetector();
    const known = "The quick brown fox jumps over the lazy dog";

    const identical = detector.checkSimilarity(known, known);
    assertApproxEqual(identical.similarity, 1.0, 0.01);

    const different = detector.checkSimilarity(
      "A completely different sentence with no overlap",
      known
    );
    assert(different.similarity < 0.5, `Expected low similarity but got ${different.similarity}`);
  });

  test("similarity threshold is configurable", () => {
    const strictDetector = new ContaminationDetector({ similarityThreshold: 0.5 });
    const lenientDetector = new ContaminationDetector({ similarityThreshold: 0.99 });

    const known = "The quick brown fox jumps over the lazy dog";
    const similar = "The quick brown fox leaps over the lazy dog"; // slightly different

    strictDetector.addToTrainingSet("test-1", known);
    lenientDetector.addToTrainingSet("test-1", known);

    const strictResult = strictDetector.checkContamination(similar, {
      id: "test-1",
      name: "Test",
      difficulty: "easy",
    });
    const lenientResult = lenientDetector.checkContamination(similar, {
      id: "test-1",
      name: "Test",
      difficulty: "easy",
    });

    // Same input, different thresholds should give different results
    assert(
      strictResult.checks.similarity!.threshold !== lenientResult.checks.similarity!.threshold,
      "Thresholds should differ"
    );
  });

  // -------------------------------------------------------------------------
  // R2: Timing Analysis Tests
  // -------------------------------------------------------------------------

  console.log("\nR2: Timing Analysis Tests:");

  test("detects suspiciously fast solve time", () => {
    const detector = new ContaminationDetector();

    const result = detector.checkContamination("solution here", {
      id: "test-2",
      name: "Test",
      difficulty: "hard",
      solveTime: 5000, // 5 seconds for a "hard" problem (expected 15 min)
    });

    assert(result.checks.timing !== undefined, "Should have timing check");
    assert(result.checks.timing!.contaminated === true, "Should flag suspiciously fast solve");
    assert(result.contaminated === true, "Overall should be contaminated");
  });

  test("passes reasonable solve times", () => {
    const detector = new ContaminationDetector();

    const result = detector.checkContamination("solution here", {
      id: "test-2",
      name: "Test",
      difficulty: "medium",
      solveTime: 200000, // 200 seconds (expected 5 min = 300s)
    });

    assert(
      result.checks.timing?.contaminated === false,
      "Reasonable solve time should not be flagged"
    );
  });

  test("checkTiming uses correct expected times by difficulty", () => {
    const detector = new ContaminationDetector();

    const easyResult = detector.checkTiming({
      id: "t1",
      name: "Easy",
      difficulty: "easy",
      solveTime: 30000, // 30s
    });
    assertEqual(easyResult.expectedTime, EXPECTED_SOLVE_TIMES.easy);

    const hardResult = detector.checkTiming({
      id: "t2",
      name: "Hard",
      difficulty: "hard",
      solveTime: 60000, // 1min
    });
    assertEqual(hardResult.expectedTime, EXPECTED_SOLVE_TIMES.hard);
  });

  test("fast solve threshold is configurable", () => {
    const strictDetector = new ContaminationDetector({ fastSolveThreshold: 0.5 });

    const result = strictDetector.checkTiming({
      id: "t1",
      name: "Test",
      difficulty: "medium",
      solveTime: 120000, // 2 min (40% of expected 5 min)
    });

    assert(result.contaminated === true, "40% should be flagged with 50% threshold");
  });

  // -------------------------------------------------------------------------
  // R3: Reasoning Chain Analysis Tests
  // -------------------------------------------------------------------------

  console.log("\nR3: Reasoning Chain Analysis Tests:");

  test("detects reasoning chain that jumps to solution", () => {
    const detector = new ContaminationDetector();
    const knownSolution = "The answer is to use map and filter to transform the array";
    detector.addToTrainingSet("test-3", knownSolution);

    // Jump detection checks the first third of thoughts
    // With 6 thoughts, first third is thoughts 0-1, so solution in position 1 gets detected
    const result = detector.checkContamination(knownSolution, {
      id: "test-3",
      name: "Test",
      difficulty: "medium",
      thoughtChain: [
        "Let me look at this problem",
        "The answer is to use map and filter to transform the array", // In first third (1 of 6)
        "Some more thinking",
        "Additional consideration",
        "Further analysis",
        "Done",
      ],
    });

    assert(result.checks.reasoning !== undefined, "Should have reasoning check");
    assert(
      result.checks.reasoning!.jumpsToSolution === true,
      "Should detect jump to solution"
    );
  });

  test("passes clean reasoning with exploration", () => {
    const detector = new ContaminationDetector();

    const result = detector.checkContamination("A novel solution approach", {
      id: "novel-test",
      name: "Novel",
      difficulty: "medium",
      solveTime: 200000,
      thoughtChain: [
        "Let me understand the problem first",
        "One approach could be using recursion",
        "But alternatively, I could use iteration",
        "Actually, what if I combine both approaches?",
        "Hmm, let me think about edge cases",
        "Considering the requirements again",
        "Here is my final solution",
      ],
    });

    assert(
      result.checks.reasoning?.jumpsToSolution === false,
      "Clean reasoning should not be flagged"
    );
    assert(
      result.checks.reasoning!.explorationDepth >= 3,
      `Expected exploration depth >= 3 but got ${result.checks.reasoning!.explorationDepth}`
    );
  });

  test("analyzeReasoning counts exploration patterns", () => {
    const detector = new ContaminationDetector();

    const result = detector.analyzeReasoning([
      "Let me think about this",
      "What if we try a different approach?",
      "Alternatively, we could...",
      "But wait, there's another way",
      "Actually, I should reconsider",
    ]);

    assert(result.explorationDepth >= 4, `Expected depth >= 4 but got ${result.explorationDepth}`);
    assertEqual(result.thoughtCount, 5);
  });

  test("analyzeReasoning detects suspicious early claims", () => {
    const detector = new ContaminationDetector();

    const result = detector.analyzeReasoning([
      "I already know the answer",
      "The solution is...",
    ]);

    assert(
      result.suspiciousPatterns.some((p) => p.includes("immediate knowledge")),
      "Should detect early knowledge claims"
    );
  });

  test("analyzeReasoning flags short chains", () => {
    const detector = new ContaminationDetector();

    const result = detector.analyzeReasoning(["Here's the answer"]);

    assert(
      result.suspiciousPatterns.some((p) => p.includes("short")),
      "Should flag very short chains"
    );
  });

  // -------------------------------------------------------------------------
  // R4: Training Set Fingerprinting Tests
  // -------------------------------------------------------------------------

  console.log("\nR4: Training Set Fingerprinting Tests:");

  test("addToTrainingSet adds solutions correctly", () => {
    const detector = new ContaminationDetector();

    detector.addToTrainingSet("case-1", "Solution A");
    detector.addToTrainingSet("case-2", "Solution B");

    assertEqual(detector.getTrainingSetSize(), 2);
  });

  test("isInTrainingSet detects exact matches", () => {
    const detector = new ContaminationDetector();
    const solution = "Exact solution text";

    detector.addToTrainingSet("case-1", solution);

    assert(detector.isInTrainingSet(solution) === true, "Should find exact match");
    assert(
      detector.isInTrainingSet("Different text") === false,
      "Should not find different text"
    );
  });

  test("isInTrainingSet normalizes whitespace", () => {
    const detector = new ContaminationDetector();

    detector.addToTrainingSet("case-1", "solution   with   spaces");

    assert(
      detector.isInTrainingSet("solution with spaces") === true,
      "Should match with normalized whitespace"
    );
  });

  test("loadTrainingSet loads multiple solutions", () => {
    const detector = new ContaminationDetector();

    const solutions: KnownSolution[] = [
      {
        testCaseId: "test-1",
        solution: "Solution 1",
        hash: "hash1",
        addedToTraining: "2026-01-01",
      },
      {
        testCaseId: "test-2",
        solution: "Solution 2",
        hash: "hash2",
        addedToTraining: "2026-01-01",
      },
    ];

    detector.loadTrainingSet(solutions);

    assertEqual(detector.getTrainingSetSize(), 2);
    assert(detector.isInTrainingSet("Solution 1") === true, "Should find loaded solution");
  });

  test("clearTrainingSet removes all solutions", () => {
    const detector = new ContaminationDetector();

    detector.addToTrainingSet("case-1", "Solution");
    detector.clearTrainingSet();

    assertEqual(detector.getTrainingSetSize(), 0);
  });

  // -------------------------------------------------------------------------
  // Confidence Calculation Tests
  // -------------------------------------------------------------------------

  console.log("\nConfidence Calculation Tests:");

  test("confidence is calculated based on check results", () => {
    const detector = new ContaminationDetector();
    const knownSolution = "Known solution text for this test case";
    detector.addToTrainingSet("test-1", knownSolution);

    // Contaminated case - high similarity, fast solve, short chain
    const contaminated = detector.checkContamination(knownSolution, {
      id: "test-1",
      name: "Test",
      difficulty: "hard",
      solveTime: 1000, // Very fast
      thoughtChain: [knownSolution], // Short chain
    });

    // Clean case - novel solution, reasonable time, good reasoning
    const clean = detector.checkContamination("Completely different novel solution", {
      id: "unknown-test",
      name: "Unknown",
      difficulty: "easy",
      solveTime: 50000, // Reasonable
      thoughtChain: [
        "Let me think about this",
        "What if I try this approach?",
        "Alternatively, I could...",
        "After considering, here's my answer",
      ],
    });

    // Both should have reasonable confidence (0-1 range)
    assert(
      contaminated.confidence >= 0 && contaminated.confidence <= 1,
      `Contaminated confidence should be 0-1, got ${contaminated.confidence}`
    );
    assert(
      clean.confidence >= 0 && clean.confidence <= 1,
      `Clean confidence should be 0-1, got ${clean.confidence}`
    );

    // Contaminated case should flag contamination
    assert(contaminated.contaminated === true, "Should detect contamination");
    // Clean case should not flag contamination
    assert(clean.contaminated === false, "Should not flag clean case");
  });

  // -------------------------------------------------------------------------
  // Default Configuration Tests
  // -------------------------------------------------------------------------

  console.log("\nDefault Configuration Tests:");

  test("DEFAULT_CONTAMINATION_CONFIG has expected values", () => {
    assertEqual(DEFAULT_CONTAMINATION_CONFIG.similarityThreshold, 0.95);
    assertEqual(DEFAULT_CONTAMINATION_CONFIG.fastSolveThreshold, 0.1);
    assertEqual(DEFAULT_CONTAMINATION_CONFIG.minExplorationDepth, 3);
  });

  test("EXPECTED_SOLVE_TIMES has values for all difficulties", () => {
    assert(EXPECTED_SOLVE_TIMES.easy > 0, "Should have easy time");
    assert(EXPECTED_SOLVE_TIMES.medium > 0, "Should have medium time");
    assert(EXPECTED_SOLVE_TIMES.hard > 0, "Should have hard time");
    assert(
      EXPECTED_SOLVE_TIMES.easy < EXPECTED_SOLVE_TIMES.medium,
      "Easy should be faster than medium"
    );
    assert(
      EXPECTED_SOLVE_TIMES.medium < EXPECTED_SOLVE_TIMES.hard,
      "Medium should be faster than hard"
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
