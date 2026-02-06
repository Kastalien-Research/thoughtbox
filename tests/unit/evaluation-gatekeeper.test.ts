/**
 * Unit tests for EvaluationGatekeeper
 * SPEC: SPEC-evaluation-gates.md
 *
 * Verifies gate logic: both tiered evaluation and behavioral contracts must pass.
 *
 * Run with: npx tsx tests/unit/evaluation-gatekeeper.test.ts
 */

import {
  EvaluationGatekeeper,
  createMockEvaluator,
  createMockContracts,
  type CodeModification,
  type BehavioralContractType,
} from "../../src/observatory/evaluation-gatekeeper.js";

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

// =============================================================================
// Test Data
// =============================================================================

function createTestModification(overrides: Partial<CodeModification> = {}): CodeModification {
  return {
    id: "test-mod-1",
    type: "refactor",
    files: ["src/test.ts"],
    diff: "--- a/src/test.ts\n+++ b/src/test.ts\n@@ -1 +1 @@\n-old\n+new",
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

async function runTests() {
  console.log("\n🧪 EvaluationGatekeeper Tests\n");

  // Test 1: Passes when both tiered evaluation and behavioral contracts pass
  await test("passes when both gates pass", async () => {
    const gatekeeper = new EvaluationGatekeeper();

    gatekeeper.setMockEvaluator(
      createMockEvaluator({
        passed: true,
        tierResults: [
          { tier: "smoke", tierId: "smoke-1", score: 1.0, passed: true, cost: 0.1, duration_ms: 100 },
          { tier: "regression", tierId: "reg-1", score: 0.95, passed: true, cost: 0.2, duration_ms: 200 },
        ],
        totalCost: 0.3,
      })
    );

    gatekeeper.setMockContracts(
      createMockContracts({
        allPassed: true,
        results: [
          { contract: "VARIANCE", passed: true, details: "Passed variance check" },
          { contract: "TRACE_EXISTS", passed: true, details: "Trace exists" },
        ],
      })
    );

    const result = await gatekeeper.checkGates(createTestModification());

    assertEqual(result.passed, true, "Gate should pass");
    assertEqual(result.blockedBy, null, "Should not be blocked");
    assertEqual(result.tierResults.length, 2, "Should have 2 tier results");
    assertEqual(result.contractResults.length, 2, "Should have 2 contract results");

    gatekeeper.clearMocks();
  });

  // Test 2: Fails when tiered evaluation fails
  await test("fails when tiered evaluation fails", async () => {
    const gatekeeper = new EvaluationGatekeeper();

    gatekeeper.setMockEvaluator(
      createMockEvaluator({
        passed: false,
        failedAt: "smoke",
        tierResults: [
          { tier: "smoke", tierId: "smoke-1", score: 0.5, passed: false, cost: 0.1, duration_ms: 100 },
        ],
        totalCost: 0.1,
        reason: "Smoke tests failed",
      })
    );

    gatekeeper.setMockContracts(
      createMockContracts({ allPassed: true })
    );

    const result = await gatekeeper.checkGates(createTestModification());

    assertEqual(result.passed, false, "Gate should fail");
    assert(result.blockedBy?.includes("tiered"), "Should be blocked by tiered evaluator");
    assertEqual(result.tierResults.length, 1, "Should have 1 tier result");
    assertEqual(result.contractResults.length, 0, "Should have 0 contract results (short-circuited)");

    gatekeeper.clearMocks();
  });

  // Test 3: Fails when behavioral contracts fail
  await test("fails when behavioral contracts fail", async () => {
    const gatekeeper = new EvaluationGatekeeper();

    gatekeeper.setMockEvaluator(
      createMockEvaluator({ passed: true, tierResults: [], totalCost: 0.1 })
    );

    const failedContract: BehavioralContractType = "VARIANCE";
    gatekeeper.setMockContracts(
      createMockContracts({
        allPassed: false,
        failedContract,
        results: [
          { contract: "VARIANCE", passed: false, details: "Low variance", failureReason: "Variance too low" },
        ],
      })
    );

    const result = await gatekeeper.checkGates(createTestModification());

    assertEqual(result.passed, false, "Gate should fail");
    assert(result.blockedBy?.includes("behavioral"), "Should be blocked by behavioral contracts");
    assertEqual(result.tierResults.length, 0, "Should have 0 tier results");
    assertEqual(result.contractResults.length, 1, "Should have 1 contract result");

    gatekeeper.clearMocks();
  });

  // Test 4: Fails when both gates fail (short-circuits at first failure)
  await test("fails when both gates fail (short-circuits)", async () => {
    const gatekeeper = new EvaluationGatekeeper();

    gatekeeper.setMockEvaluator(
      createMockEvaluator({
        passed: false,
        failedAt: "regression",
        tierResults: [
          { tier: "smoke", tierId: "smoke-1", score: 1.0, passed: true, cost: 0.1, duration_ms: 100 },
          { tier: "regression", tierId: "reg-1", score: 0.3, passed: false, cost: 0.2, duration_ms: 200 },
        ],
        totalCost: 0.3,
      })
    );

    gatekeeper.setMockContracts(
      createMockContracts({ allPassed: false, failedContract: "TRACE_EXISTS" })
    );

    const result = await gatekeeper.checkGates(createTestModification());

    assertEqual(result.passed, false, "Gate should fail");
    // Should short-circuit at tiered evaluation, never reaching contracts
    assert(result.blockedBy?.includes("tiered"), "Should be blocked by tiered (first gate)");
    assertEqual(result.contractResults.length, 0, "Should have 0 contract results (short-circuited)");

    gatekeeper.clearMocks();
  });

  // Test 5: Reports correct cost from tiered evaluation
  await test("reports correct cost from tiered evaluation", async () => {
    const gatekeeper = new EvaluationGatekeeper();

    gatekeeper.setMockEvaluator(
      createMockEvaluator({
        passed: true,
        tierResults: [
          { tier: "smoke", tierId: "smoke-1", score: 1.0, passed: true, cost: 0.15, duration_ms: 100 },
          { tier: "regression", tierId: "reg-1", score: 0.98, passed: true, cost: 0.35, duration_ms: 200 },
          { tier: "real-world", tierId: "rw-1", score: 0.92, passed: true, cost: 0.50, duration_ms: 300 },
        ],
        totalCost: 1.0,
      })
    );

    gatekeeper.setMockContracts(createMockContracts({ allPassed: true }));

    const result = await gatekeeper.checkGates(createTestModification());

    assertEqual(result.totalCost, 1.0, "Total cost should be 1.0");
    assertEqual(result.tierResults.length, 3, "Should have 3 tiers");

    gatekeeper.clearMocks();
  });

  // Test 6: Handles empty modification gracefully
  await test("handles empty modification gracefully", async () => {
    const gatekeeper = new EvaluationGatekeeper();

    gatekeeper.setMockEvaluator(createMockEvaluator({ passed: true, tierResults: [], totalCost: 0 }));
    gatekeeper.setMockContracts(createMockContracts({ allPassed: true }));

    const result = await gatekeeper.checkGates({
      id: "empty",
      type: "none",
      files: [],
      diff: "",
    });

    assertEqual(result.passed, true, "Should pass with empty modification");

    gatekeeper.clearMocks();
  });

  // Test 7: Skip flags work correctly
  await test("skip flags bypass gates", async () => {
    const gatekeeper = new EvaluationGatekeeper({
      skipTieredEvaluation: true,
      skipBehavioralContracts: true,
    });

    // Don't set mocks - they shouldn't be called
    const result = await gatekeeper.checkGates(createTestModification());

    assertEqual(result.passed, true, "Should pass when gates are skipped");
    assertEqual(result.tierResults.length, 0, "Should have 0 tier results");
    assertEqual(result.contractResults.length, 0, "Should have 0 contract results");
  });

  console.log("\n✨ All EvaluationGatekeeper tests complete\n");
}

// Run tests
runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
