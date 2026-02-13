/**
 * Unit tests for ExperimentRunner (Layer 4)
 *
 * Run with: npx tsx tests/unit/experiment-runner.test.ts
 */

import { ExperimentRunner } from "../../src/evaluation/experiment-runner.js";
import { getSharedClient, resetClient } from "../../src/evaluation/client.js";
import type { LangSmithConfig, RunExperimentOptions, ExperimentRunResult } from "../../src/evaluation/types.js";

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`\u2705 ${name}`);
  } catch (error) {
    console.error(`\u274c ${name}`);
    console.error(`   ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertApprox(actual: number, expected: number, message: string, epsilon = 1e-9) {
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(`${message}: expected ~${expected}, got ${actual}`);
  }
}

function createConfig(): LangSmithConfig {
  return {
    apiKey: "test-key",
    apiUrl: "https://api.smith.langchain.com",
    project: "test-project",
  };
}

/**
 * Creates a mock evaluate() function that returns predictable results.
 */
function createMockEvaluate(mockResults: Array<{
  run?: { outputs?: Record<string, any> };
  example?: { id?: string; inputs?: Record<string, any> };
  evaluationResults?: { results: Array<{ key: string; score: number; comment?: string; evaluatorInfo?: Record<string, unknown> }> };
}>) {
  let callCount = 0;
  let lastOptions: any = null;

  const mockEvaluate = async (_target: any, options: any) => {
    callCount++;
    lastOptions = options;

    // Return an async iterable that also has experimentName and length
    const results = mockResults;
    let index = 0;

    const iterator = {
      experimentName: "test-experiment-001",
      results,
      length: results.length,
      [Symbol.asyncIterator]() { return this; },
      async next() {
        if (index < results.length) {
          return { value: results[index++], done: false };
        }
        return { value: undefined, done: true };
      },
    };

    return iterator;
  };

  return { mockEvaluate, getCallCount: () => callCount, getLastOptions: () => lastOptions };
}

async function runTests() {
  console.log("\n\ud83e\uddea ExperimentRunner Tests\n");

  await test("isEnabled returns false when config missing", async () => {
    const runner = new ExperimentRunner(null);
    assertEqual(runner.isEnabled(), false, "Runner should be disabled");
  });

  await test("isEnabled returns true when config provided", async () => {
    const runner = new ExperimentRunner(createConfig());
    assertEqual(runner.isEnabled(), true, "Runner should be enabled");
  });

  await test("runExperiment returns null when disabled", async () => {
    const runner = new ExperimentRunner(null);
    const result = await runner.runExperiment({
      datasetName: "test-ds",
      target: async (input) => input,
    });
    assertEqual(result, null, "Disabled runner should return null");
  });

  await test("runExperiment resolves evaluators by name", async () => {
    const { mockEvaluate, getLastOptions } = createMockEvaluate([]);
    const runner = new ExperimentRunner(createConfig(), undefined, mockEvaluate as any);

    await runner.runExperiment({
      datasetName: "test-ds",
      target: async (input) => input,
      evaluators: ["sessionQuality", "dgmFitness"],
    });

    const opts = getLastOptions();
    assertEqual(opts.evaluators.length, 2, "Should resolve 2 evaluators");
  });

  await test("runExperiment defaults to all evaluators when none specified", async () => {
    const { mockEvaluate, getLastOptions } = createMockEvaluate([]);
    const runner = new ExperimentRunner(createConfig(), undefined, mockEvaluate as any);

    await runner.runExperiment({
      datasetName: "test-ds",
      target: async (input) => input,
    });

    const opts = getLastOptions();
    assertEqual(opts.evaluators.length, 4, "Should use all 4 evaluators by default");
  });

  await test("runExperiment passes correct options to evaluate()", async () => {
    const { mockEvaluate, getLastOptions } = createMockEvaluate([]);
    const runner = new ExperimentRunner(createConfig(), undefined, mockEvaluate as any);

    await runner.runExperiment({
      datasetName: "my-dataset",
      target: async (input) => input,
      experimentPrefix: "custom-prefix",
      description: "A test experiment",
      metadata: { custom: true },
      memoryDesignId: "memory-v1",
      maxConcurrency: 2,
    });

    const opts = getLastOptions();
    assertEqual(opts.data, "my-dataset", "Dataset name should pass through");
    assertEqual(opts.experimentPrefix, "custom-prefix", "Prefix should pass through");
    assertEqual(opts.description, "A test experiment", "Description should pass through");
    assertEqual(opts.maxConcurrency, 2, "Max concurrency should pass through");
    assertEqual(opts.metadata.memoryDesignId, "memory-v1", "Memory design ID in metadata");
    assertEqual(opts.metadata.source, "thoughtbox-experiment-runner", "Source in metadata");
  });

  await test("runExperiment computes aggregate scores", async () => {
    const { mockEvaluate } = createMockEvaluate([
      {
        run: { outputs: { result: "a" } },
        example: { id: "ex-1", inputs: { taskId: "t1" } },
        evaluationResults: {
          results: [
            { key: "sessionQuality", score: 0.8 },
            { key: "reasoningCoherence", score: 0.6 },
          ],
        },
      },
      {
        run: { outputs: { result: "b" } },
        example: { id: "ex-2", inputs: { taskId: "t2" } },
        evaluationResults: {
          results: [
            { key: "sessionQuality", score: 0.4 },
            { key: "reasoningCoherence", score: 1.0 },
          ],
        },
      },
    ]);

    const runner = new ExperimentRunner(createConfig(), undefined, mockEvaluate as any);
    const result = await runner.runExperiment({
      datasetName: "test-ds",
      target: async (input) => input,
    });

    assert(result !== null, "Result should not be null");
    assertEqual(result!.totalExamples, 2, "Should have 2 examples");
    assertApprox(result!.aggregateScores.sessionQuality, 0.6, "Mean of 0.8 and 0.4");
    assertApprox(result!.aggregateScores.reasoningCoherence, 0.8, "Mean of 0.6 and 1.0");
    assertEqual(result!.experimentName, "test-experiment-001", "Experiment name from results");
    assertEqual(result!.datasetName, "test-ds", "Dataset name preserved");
  });

  await test("runExperiment handles empty dataset", async () => {
    const { mockEvaluate } = createMockEvaluate([]);
    const runner = new ExperimentRunner(createConfig(), undefined, mockEvaluate as any);

    const result = await runner.runExperiment({
      datasetName: "empty-ds",
      target: async (input) => input,
    });

    assert(result !== null, "Result should not be null");
    assertEqual(result!.totalExamples, 0, "Should have 0 examples");
    assertEqual(Object.keys(result!.aggregateScores).length, 0, "No aggregate scores");
  });

  await test("runCollectionExperiment sets no memoryDesignId", async () => {
    const { mockEvaluate, getLastOptions } = createMockEvaluate([]);
    const runner = new ExperimentRunner(createConfig(), undefined, mockEvaluate as any);

    await runner.runCollectionExperiment("coll-ds", async (input) => input);

    const opts = getLastOptions();
    assertEqual(opts.metadata.memoryDesignId, undefined, "No memoryDesignId for collection");
    assert(opts.experimentPrefix.includes("collection"), "Prefix should indicate collection");
  });

  await test("runDeploymentExperiment sets memoryDesignId", async () => {
    const { mockEvaluate, getLastOptions } = createMockEvaluate([]);
    const runner = new ExperimentRunner(createConfig(), undefined, mockEvaluate as any);

    await runner.runDeploymentExperiment("deploy-ds", "memory-v2", async (input) => input);

    const opts = getLastOptions();
    assertEqual(opts.metadata.memoryDesignId, "memory-v2", "memoryDesignId should be set");
    assert(opts.experimentPrefix.includes("deployment"), "Prefix should indicate deployment");
  });

  await test("runRegressionCheck returns pass when above thresholds", async () => {
    const { mockEvaluate } = createMockEvaluate([
      {
        example: { id: "ex-1", inputs: {} },
        evaluationResults: {
          results: [
            { key: "sessionQuality", score: 0.9 },
            { key: "reasoningCoherence", score: 0.8 },
          ],
        },
      },
    ]);

    const runner = new ExperimentRunner(createConfig(), undefined, mockEvaluate as any);
    const check = await runner.runRegressionCheck("regression-ds", async (input) => input);

    assertEqual(check.passed, true, "Should pass above thresholds");
    assertEqual(check.failedEvaluators.length, 0, "No failed evaluators");
    assert(check.details.includes("passed"), "Details should say passed");
  });

  await test("runRegressionCheck returns fail when below thresholds", async () => {
    const { mockEvaluate } = createMockEvaluate([
      {
        example: { id: "ex-1", inputs: {} },
        evaluationResults: {
          results: [
            { key: "sessionQuality", score: 0.2 },
            { key: "reasoningCoherence", score: 0.9 },
          ],
        },
      },
    ]);

    const runner = new ExperimentRunner(createConfig(), undefined, mockEvaluate as any);
    const check = await runner.runRegressionCheck("regression-ds", async (input) => input);

    assertEqual(check.passed, false, "Should fail below thresholds");
    assert(check.failedEvaluators.includes("sessionQuality"), "sessionQuality should fail");
    assert(!check.failedEvaluators.includes("reasoningCoherence"), "reasoningCoherence should pass");
  });

  await test("shared client is reused across instances", async () => {
    resetClient();
    const config = createConfig();
    const client1 = getSharedClient(config);
    const client2 = getSharedClient(config);
    assert(client1 === client2, "Same config should return same client instance");

    // Different config should create new client
    const client3 = getSharedClient({ ...config, apiKey: "different-key" });
    assert(client1 !== client3, "Different config should create new client");
    resetClient();
  });

  console.log("\n\u2728 ExperimentRunner tests complete\n");
}

runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
