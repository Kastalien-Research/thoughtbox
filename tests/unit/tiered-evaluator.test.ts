#!/usr/bin/env npx tsx
/**
 * Unit tests for Tiered Evaluation Pipeline
 * SPEC: SIL-004
 *
 * Run with: npx tsx tests/unit/tiered-evaluator.test.ts
 */

import {
  TieredEvaluator,
  createMockExecutor,
  resetTieredEvaluator,
  type CodeModification,
  type TierExecutor,
  type TierResult,
} from "../../benchmarks/tiered-evaluator.js";
import { ImprovementTracker } from "../../src/observatory/improvement-tracker.js";

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

// =============================================================================
// Test Fixtures
// =============================================================================

const mockModification: CodeModification = {
  id: "mod-1",
  type: "fix",
  files: ["src/test.ts"],
  diff: "--- a/src/test.ts\n+++ b/src/test.ts\n@@ -1,1 +1,1 @@\n-old\n+new",
};

// =============================================================================
// Tests
// =============================================================================

async function runTests(): Promise<void> {
  console.log("\nTiered Evaluator Tests\n");

  // Reset singleton before tests
  resetTieredEvaluator();
  ImprovementTracker.resetInstance();

  // -------------------------------------------------------------------------
  // Initialization Tests
  // -------------------------------------------------------------------------

  console.log("Initialization Tests:");

  test("TieredEvaluator loads default config", () => {
    const evaluator = new TieredEvaluator({ trackingEnabled: false });
    const config = evaluator.getConfig();
    assert(config.name === "thoughtbox-improvement", `Expected name "thoughtbox-improvement" but got "${config.name}"`);
    assert(config.tiers.length > 0, "Should have tiers defined");
  });

  test("TieredEvaluator registers default executors", () => {
    const evaluator = new TieredEvaluator({ trackingEnabled: false });
    const tiers = evaluator.getRegisteredTiers();
    assert(tiers.includes("smoke-test"), "Should have smoke-test executor");
    assert(tiers.includes("regression"), "Should have regression executor");
    assert(tiers.includes("real-world"), "Should have real-world executor");
  });

  // -------------------------------------------------------------------------
  // Evaluation Tests
  // -------------------------------------------------------------------------

  console.log("\nEvaluation Tests:");

  test("evaluate passes all tiers when all executors return passing scores", async () => {
    const evaluator = new TieredEvaluator({ trackingEnabled: false });

    // Register mock executors that all pass
    evaluator.registerExecutor(createMockExecutor("smoke-test", 1.0, 0.1));
    evaluator.registerExecutor(createMockExecutor("regression", 0.98, 1.0));
    evaluator.registerExecutor(createMockExecutor("real-world", 0.85, 10.0));

    const result = await evaluator.evaluate(mockModification);

    assert(result.passed === true, "Should pass when all tiers pass");
    assertEqual(result.failedAt, null);
    assert(result.passedTiers.length === 3, `Expected 3 passed tiers but got ${result.passedTiers.length}`);
  });

  test("evaluate terminates early on first tier failure", async () => {
    const evaluator = new TieredEvaluator({ trackingEnabled: false });

    // Smoke test fails
    evaluator.registerExecutor(createMockExecutor("smoke-test", 0.5, 0.1));
    evaluator.registerExecutor(createMockExecutor("regression", 1.0, 1.0));
    evaluator.registerExecutor(createMockExecutor("real-world", 1.0, 10.0));

    const result = await evaluator.evaluate(mockModification);

    assert(result.passed === false, "Should fail when first tier fails");
    assertEqual(result.failedAt, "smoke-test");
    assertEqual(result.tierResults.length, 1); // Only smoke-test ran
    assertEqual(result.passedTiers.length, 0);
  });

  test("evaluate terminates early on middle tier failure", async () => {
    const evaluator = new TieredEvaluator({ trackingEnabled: false });

    // Smoke passes, regression fails
    evaluator.registerExecutor(createMockExecutor("smoke-test", 1.0, 0.1));
    evaluator.registerExecutor(createMockExecutor("regression", 0.5, 1.0));
    evaluator.registerExecutor(createMockExecutor("real-world", 1.0, 10.0));

    const result = await evaluator.evaluate(mockModification);

    assert(result.passed === false, "Should fail when middle tier fails");
    assertEqual(result.failedAt, "regression");
    assertEqual(result.tierResults.length, 2); // smoke-test and regression ran
    assertEqual(result.passedTiers.length, 1);
    assert(result.passedTiers.includes("smoke-test"), "Should include smoke-test in passed tiers");
  });

  // -------------------------------------------------------------------------
  // Cost Tracking Tests
  // -------------------------------------------------------------------------

  console.log("\nCost Tracking Tests:");

  test("evaluate tracks total cost across all tiers", async () => {
    const evaluator = new TieredEvaluator({ trackingEnabled: false });

    evaluator.registerExecutor(createMockExecutor("smoke-test", 1.0, 0.1));
    evaluator.registerExecutor(createMockExecutor("regression", 1.0, 1.0));
    evaluator.registerExecutor(createMockExecutor("real-world", 1.0, 10.0));

    const result = await evaluator.evaluate(mockModification);

    // Total cost should be 0.1 + 1.0 + 10.0 = 11.1
    assertEqual(result.totalCost, 11.1);
  });

  test("evaluate tracks partial cost on early termination", async () => {
    const evaluator = new TieredEvaluator({ trackingEnabled: false });

    // Fail at smoke test
    evaluator.registerExecutor(createMockExecutor("smoke-test", 0.5, 0.1));
    evaluator.registerExecutor(createMockExecutor("regression", 1.0, 1.0));
    evaluator.registerExecutor(createMockExecutor("real-world", 1.0, 10.0));

    const result = await evaluator.evaluate(mockModification);

    // Only smoke test cost should be tracked
    assertEqual(result.totalCost, 0.1);
  });

  test("evaluate tracks duration for each tier", async () => {
    const evaluator = new TieredEvaluator({ trackingEnabled: false });

    evaluator.registerExecutor(createMockExecutor("smoke-test", 1.0, 0.1));
    evaluator.registerExecutor(createMockExecutor("regression", 1.0, 1.0));
    evaluator.registerExecutor(createMockExecutor("real-world", 1.0, 10.0));

    const result = await evaluator.evaluate(mockModification);

    assert(result.totalDuration_ms >= 0, "Should have non-negative duration");
    for (const tier of result.tierResults) {
      assert(tier.duration_ms >= 0, `Tier ${tier.tierId} should have non-negative duration`);
    }
  });

  // -------------------------------------------------------------------------
  // Threshold Tests
  // -------------------------------------------------------------------------

  console.log("\nThreshold Tests:");

  test("evaluate uses config thresholds for pass/fail", async () => {
    const evaluator = new TieredEvaluator({ trackingEnabled: false });

    // Regression tier requires 95% pass rate (0.95)
    // Return score just below threshold
    evaluator.registerExecutor(createMockExecutor("smoke-test", 1.0, 0.1));
    evaluator.registerExecutor({
      name: "regression",
      execute: async (): Promise<TierResult> => ({
        tier: "Regression",
        tierId: "regression",
        score: 0.94, // Just below 0.95 threshold
        passed: true, // Will be recalculated
        cost: 1.0,
        duration_ms: 100,
      }),
    });

    const result = await evaluator.evaluate(mockModification);

    assert(result.passed === false, "Should fail when score below threshold");
    assertEqual(result.failedAt, "regression");
  });

  // -------------------------------------------------------------------------
  // Custom Executor Tests
  // -------------------------------------------------------------------------

  console.log("\nCustom Executor Tests:");

  test("registerExecutor allows custom executors", async () => {
    const evaluator = new TieredEvaluator({ trackingEnabled: false });

    const customExecutor: TierExecutor = {
      name: "smoke-test",
      execute: async (): Promise<TierResult> => ({
        tier: "Custom Smoke",
        tierId: "smoke-test",
        score: 0.99,
        passed: true,
        cost: 0.05,
        duration_ms: 50,
        details: { custom: true },
      }),
    };

    evaluator.registerExecutor(customExecutor);
    evaluator.registerExecutor(createMockExecutor("regression", 1.0, 1.0));
    evaluator.registerExecutor(createMockExecutor("real-world", 1.0, 10.0));

    const result = await evaluator.evaluate(mockModification);

    const smokeResult = result.tierResults.find((r) => r.tierId === "smoke-test");
    assertEqual(smokeResult?.cost, 0.05);
    assertEqual(smokeResult?.details?.custom, true);
  });

  test("executor errors are handled gracefully", async () => {
    const evaluator = new TieredEvaluator({ trackingEnabled: false });

    const throwingExecutor: TierExecutor = {
      name: "smoke-test",
      execute: async (): Promise<TierResult> => {
        throw new Error("Executor failed!");
      },
    };

    evaluator.registerExecutor(throwingExecutor);

    const result = await evaluator.evaluate(mockModification);

    assert(result.passed === false, "Should fail when executor throws");
    assertEqual(result.failedAt, "smoke-test");
    assert(
      result.tierResults[0].details?.error !== undefined,
      "Should capture error in details"
    );
  });

  // -------------------------------------------------------------------------
  // Result Details Tests
  // -------------------------------------------------------------------------

  console.log("\nResult Details Tests:");

  test("evaluate includes reason on failure", async () => {
    const evaluator = new TieredEvaluator({ trackingEnabled: false });

    evaluator.registerExecutor(createMockExecutor("smoke-test", 0.3, 0.1));

    const result = await evaluator.evaluate(mockModification);

    assert(result.reason !== undefined, "Should have failure reason");
    assert(result.reason!.includes("Failed smoke-test"), "Reason should mention failed tier");
  });

  test("evaluate has no reason on success", async () => {
    const evaluator = new TieredEvaluator({ trackingEnabled: false });

    evaluator.registerExecutor(createMockExecutor("smoke-test", 1.0, 0.1));
    evaluator.registerExecutor(createMockExecutor("regression", 1.0, 1.0));
    evaluator.registerExecutor(createMockExecutor("real-world", 1.0, 10.0));

    const result = await evaluator.evaluate(mockModification);

    assertEqual(result.reason, undefined);
  });

  // -------------------------------------------------------------------------
  // Mock Executor Helper Tests
  // -------------------------------------------------------------------------

  console.log("\nMock Executor Helper Tests:");

  test("createMockExecutor creates executor with correct values", async () => {
    const executor = createMockExecutor("test-tier", 0.75, 5.0);

    assertEqual(executor.name, "test-tier");

    const result = await executor.execute(mockModification);
    assertEqual(result.score, 0.75);
    assertEqual(result.cost, 5.0);
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
