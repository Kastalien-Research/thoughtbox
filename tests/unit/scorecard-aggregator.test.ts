/**
 * Unit tests for ScorecardAggregator
 * SPEC: SPEC-persistence.md (scorecard generation)
 *
 * Verifies metrics computation, trend analysis, and scorecard generation.
 *
 * Run with: npx tsx tests/unit/scorecard-aggregator.test.ts
 */

import { tmpdir } from "os";
import { join } from "path";
import { mkdir, rm } from "fs/promises";
import {
  ImprovementEventStore,
  ScorecardAggregator,
  type ImprovementEvent,
} from "../../src/observatory/index.js";

// =============================================================================
// Test Utilities
// =============================================================================

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertApprox(actual: number, expected: number, tolerance: number, message: string) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}: expected ~${expected}, got ${actual}`);
  }
}

// =============================================================================
// Test Data
// =============================================================================

function createEvent(overrides: Partial<ImprovementEvent>): ImprovementEvent {
  return {
    timestamp: new Date().toISOString(),
    iteration: 1,
    type: "cycle_end",
    phase: "completion",
    cost: 0.5,
    success: true,
    metadata: {},
    ...overrides,
  };
}

async function populateStore(
  store: ImprovementEventStore,
  events: Array<Partial<ImprovementEvent>>
): Promise<void> {
  for (const eventData of events) {
    await store.recordEvent(createEvent(eventData));
  }
}

// =============================================================================
// Tests
// =============================================================================

async function runTests() {
  console.log("\n🧪 ScorecardAggregator Tests\n");

  const testDir = join(tmpdir(), `scorecard-test-${Date.now()}`);
  await mkdir(testDir, { recursive: true });

  try {
    // Test 1: Computes success rate correctly
    await test("computes success rate correctly", async () => {
      const store = new ImprovementEventStore({ path: join(testDir, "test1.jsonl") });
      await store.initialize();

      // 4 cycle_end events: 3 success, 1 failure = 75% success rate
      await populateStore(store, [
        { iteration: 1, type: "cycle_end", success: true },
        { iteration: 2, type: "cycle_end", success: true },
        { iteration: 3, type: "cycle_end", success: false },
        { iteration: 4, type: "cycle_end", success: true },
      ]);

      const aggregator = new ScorecardAggregator(store);
      const scorecard = await aggregator.computeScorecard();

      assertEqual(scorecard.metrics.totalIterations, 4, "Should have 4 iterations");
      assertApprox(scorecard.metrics.successRate, 0.75, 0.01, "Success rate should be 75%");
    });

    // Test 2: Computes cost per success correctly
    await test("computes cost per success correctly", async () => {
      const store = new ImprovementEventStore({ path: join(testDir, "test2.jsonl") });
      await store.initialize();

      // 2 successful iterations with total cost of $2.00
      // Cost per success = $2.00 / 2 = $1.00
      await populateStore(store, [
        { iteration: 1, type: "cycle_end", success: true, cost: 0.8 },
        { iteration: 2, type: "cycle_end", success: false, cost: 0.4 },
        { iteration: 3, type: "cycle_end", success: true, cost: 0.8 },
      ]);

      const aggregator = new ScorecardAggregator(store);
      const scorecard = await aggregator.computeScorecard();

      assertEqual(scorecard.metrics.totalCost, 2.0, "Total cost should be $2.00");
      assertApprox(scorecard.metrics.costPerSuccess, 1.0, 0.01, "Cost per success should be $1.00");
    });

    // Test 3: Detects improving trend
    await test("detects improving trend", async () => {
      const store = new ImprovementEventStore({ path: join(testDir, "test3.jsonl") });
      await store.initialize();

      // Recent iterations are more successful than earlier ones
      // First half: 0/3 success (0%), Second half: 3/3 success (100%)
      await populateStore(store, [
        { iteration: 1, type: "cycle_end", success: false },
        { iteration: 2, type: "cycle_end", success: false },
        { iteration: 3, type: "cycle_end", success: false },
        { iteration: 4, type: "cycle_end", success: true },
        { iteration: 5, type: "cycle_end", success: true },
        { iteration: 6, type: "cycle_end", success: true },
      ]);

      const aggregator = new ScorecardAggregator(store);
      const scorecard = await aggregator.computeScorecard();

      assertEqual(scorecard.trend, "improving", "Trend should be improving");
    });

    // Test 4: Detects declining trend
    await test("detects declining trend", async () => {
      const store = new ImprovementEventStore({ path: join(testDir, "test4.jsonl") });
      await store.initialize();

      // Recent iterations are less successful than earlier ones
      // First half: 3/3 success (100%), Second half: 0/3 success (0%)
      await populateStore(store, [
        { iteration: 1, type: "cycle_end", success: true },
        { iteration: 2, type: "cycle_end", success: true },
        { iteration: 3, type: "cycle_end", success: true },
        { iteration: 4, type: "cycle_end", success: false },
        { iteration: 5, type: "cycle_end", success: false },
        { iteration: 6, type: "cycle_end", success: false },
      ]);

      const aggregator = new ScorecardAggregator(store);
      const scorecard = await aggregator.computeScorecard();

      assertEqual(scorecard.trend, "declining", "Trend should be declining");
    });

    // Test 5: Computes evaluation pass rates from evaluate events
    await test("computes evaluation pass rates from evaluate events", async () => {
      const store = new ImprovementEventStore({ path: join(testDir, "test5.jsonl") });
      await store.initialize();

      // 4 evaluate events with tier metadata
      await populateStore(store, [
        {
          iteration: 1,
          type: "evaluate",
          success: true,
          metadata: { tier: "smoke", passed: true },
        },
        {
          iteration: 1,
          type: "evaluate",
          success: true,
          metadata: { tier: "regression", passed: true },
        },
        {
          iteration: 2,
          type: "evaluate",
          success: true,
          metadata: { tier: "smoke", passed: true },
        },
        {
          iteration: 2,
          type: "evaluate",
          success: false,
          metadata: { tier: "regression", passed: false },
        },
        // Also add cycle_end events for iteration tracking
        { iteration: 1, type: "cycle_end", success: true },
        { iteration: 2, type: "cycle_end", success: false },
      ]);

      const aggregator = new ScorecardAggregator(store);
      const scorecard = await aggregator.computeScorecard();

      // smoke: 2 events, both passed = 100%
      // regression: 2 events, 1 passed = 50%
      assertApprox(
        scorecard.metrics.evaluationPassRates.smoke,
        1.0,
        0.01,
        "Smoke pass rate should be 100%"
      );
      assertApprox(
        scorecard.metrics.evaluationPassRates.regression,
        0.5,
        0.01,
        "Regression pass rate should be 50%"
      );
    });

    // Test 6: Counts regressions correctly (failure after success)
    await test("counts regressions correctly (failure after success)", async () => {
      const store = new ImprovementEventStore({ path: join(testDir, "test6.jsonl") });
      await store.initialize();

      // Pattern: success -> failure (1 regression), failure -> success (not a regression), success -> failure (1 regression)
      await populateStore(store, [
        { iteration: 1, type: "cycle_end", success: true },
        { iteration: 2, type: "cycle_end", success: false }, // regression
        { iteration: 3, type: "cycle_end", success: true },
        { iteration: 4, type: "cycle_end", success: false }, // regression
      ]);

      const aggregator = new ScorecardAggregator(store);
      const scorecard = await aggregator.computeScorecard();

      assertEqual(scorecard.metrics.regressionCount, 2, "Should count 2 regressions");
    });

    // Test 7: Returns recent iterations in scorecard
    await test("returns recent iterations in scorecard", async () => {
      const store = new ImprovementEventStore({ path: join(testDir, "test7.jsonl") });
      await store.initialize();

      await populateStore(store, [
        { iteration: 1, type: "cycle_end", success: true, cost: 0.1 },
        { iteration: 2, type: "cycle_end", success: false, cost: 0.2 },
        { iteration: 3, type: "cycle_end", success: true, cost: 0.3 },
      ]);

      const aggregator = new ScorecardAggregator(store);
      const scorecard = await aggregator.computeScorecard({ recentCount: 2 });

      assertEqual(scorecard.recentIterations.length, 2, "Should return 2 recent iterations");
      // Most recent first
      assertEqual(scorecard.recentIterations[0].iteration, 3, "First should be iteration 3");
      assertEqual(scorecard.recentIterations[1].iteration, 2, "Second should be iteration 2");
    });

    // Test 8: Handles empty store gracefully
    await test("handles empty store gracefully", async () => {
      const store = new ImprovementEventStore({ path: join(testDir, "test8.jsonl") });
      await store.initialize();

      const aggregator = new ScorecardAggregator(store);
      const scorecard = await aggregator.computeScorecard();

      assertEqual(scorecard.metrics.totalIterations, 0, "Should have 0 iterations");
      assertEqual(scorecard.metrics.successRate, 0, "Success rate should be 0");
      assertEqual(scorecard.metrics.totalCost, 0, "Total cost should be 0");
      assertEqual(scorecard.trend, "stable", "Trend should be stable for empty data");
    });

    // Test 9: Detects stable trend when not enough data
    await test("detects stable trend when not enough data", async () => {
      const store = new ImprovementEventStore({ path: join(testDir, "test9.jsonl") });
      await store.initialize();

      // Only 3 iterations - not enough for trend analysis (needs >= 4)
      await populateStore(store, [
        { iteration: 1, type: "cycle_end", success: true },
        { iteration: 2, type: "cycle_end", success: false },
        { iteration: 3, type: "cycle_end", success: true },
      ]);

      const aggregator = new ScorecardAggregator(store);
      const scorecard = await aggregator.computeScorecard();

      assertEqual(scorecard.trend, "stable", "Trend should be stable with < 4 iterations");
    });

  } finally {
    // Cleanup
    await rm(testDir, { recursive: true, force: true });
  }

  console.log("\n✨ All ScorecardAggregator tests complete\n");
}

// Run tests
runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
