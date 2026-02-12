/**
 * Unit tests for Phase 2 evaluators (Layer 3)
 *
 * Run with: npx tsx tests/unit/evaluators.test.ts
 */

import {
  dgmFitnessEvaluator,
  getAllEvaluators,
  getEvaluator,
  memoryQualityEvaluator,
  reasoningCoherenceEvaluator,
  sessionQualityEvaluator,
} from "../../src/evaluation/evaluators/index.js";

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

function assertScore(score: unknown, name: string) {
  assert(typeof score === "number", `${name} should return numeric score`);
  assert(score >= 0 && score <= 1, `${name} should return score in [0, 1]`);
}

const baseRun = {
  session_id: "exp-1",
  outputs: {
    trackedThoughtCount: 8,
    finalThoughtCount: 8,
    sessionQuality: 0.8,
    memoryQuality: 0.7,
    reasoningCoherence: 0.75,
    contextUtilization: 0.72,
    memoryDesignId: "memory-v1",
    thought: "First we inspect the problem, then evaluate alternatives, then execute.",
  },
  extra: {
    metadata: {
      revisionCount: 2,
      branchCount: 1,
      branchingFactor: 1,
      contextUtilization: 0.72,
      memoryDesignId: "memory-v1",
    },
  },
};

async function runTests() {
  console.log("\n🧪 Evaluator Tests\n");

  await test("sessionQualityEvaluator returns bounded score with expected key", async () => {
    const result = await sessionQualityEvaluator({
      run: baseRun as any,
      example: {} as any,
      inputs: {},
      outputs: baseRun.outputs,
      referenceOutputs: {},
    });
    assertEqual(result.key, "sessionQuality", "Unexpected evaluator key");
    assertScore(result.score, "sessionQuality");
  });

  await test("memoryQualityEvaluator uses referenceOutputs baseline", async () => {
    const result = await memoryQualityEvaluator({
      run: baseRun as any,
      example: {} as any,
      inputs: {},
      outputs: baseRun.outputs,
      referenceOutputs: { sessionQuality: 0.6 },
    });
    assertEqual(result.key, "memoryQuality", "Unexpected evaluator key");
    assertScore(result.score, "memoryQuality");
  });

  await test("dgmFitnessEvaluator returns bounded score and archive info", async () => {
    const result = await dgmFitnessEvaluator({
      run: baseRun as any,
      example: {} as any,
      inputs: {},
      outputs: baseRun.outputs,
      referenceOutputs: {},
    });
    assertEqual(result.key, "dgmFitness", "Unexpected evaluator key");
    assertScore(result.score, "dgmFitness");
    assert(!!result.evaluatorInfo, "dgmFitness should include archive metadata");
  });

  await test("reasoningCoherenceEvaluator returns bounded score", async () => {
    const result = await reasoningCoherenceEvaluator({
      run: baseRun as any,
      example: {} as any,
      inputs: {},
      outputs: baseRun.outputs,
      referenceOutputs: {},
    });
    assertEqual(result.key, "reasoningCoherence", "Unexpected evaluator key");
    assertScore(result.score, "reasoningCoherence");
  });

  await test("getEvaluator returns named evaluators", async () => {
    assertEqual(getEvaluator("sessionQuality"), sessionQualityEvaluator, "sessionQuality lookup failed");
    assertEqual(getEvaluator("memoryQuality"), memoryQualityEvaluator, "memoryQuality lookup failed");
    assertEqual(getEvaluator("dgmFitness"), dgmFitnessEvaluator, "dgmFitness lookup failed");
    assertEqual(
      getEvaluator("reasoningCoherence"),
      reasoningCoherenceEvaluator,
      "reasoningCoherence lookup failed"
    );
  });

  await test("getAllEvaluators returns deterministic evaluator set", async () => {
    const all = getAllEvaluators();
    assertEqual(all.length, 4, "Expected four evaluators");
    assertEqual(all[0], sessionQualityEvaluator, "Unexpected evaluator order");
    assertEqual(all[1], memoryQualityEvaluator, "Unexpected evaluator order");
    assertEqual(all[2], dgmFitnessEvaluator, "Unexpected evaluator order");
    assertEqual(all[3], reasoningCoherenceEvaluator, "Unexpected evaluator order");
  });

  console.log("\n✨ Evaluator tests complete\n");
}

runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});

