/**
 * Unit tests for ExperimentRunner (Layer 4)
 *
 * Converted from tests/unit/experiment-runner.test.ts (hand-rolled tsx runner)
 * to vitest.
 */

import { describe, it, expect } from "vitest";
import { ExperimentRunner } from "../experiment-runner.js";
import { getSharedClient, resetClient } from "../client.js";
import type { LangSmithConfig } from "../types.js";

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

describe("ExperimentRunner", () => {
  it("isEnabled returns false when config missing", () => {
    const runner = new ExperimentRunner(null);
    expect(runner.isEnabled()).toBe(false);
  });

  it("isEnabled returns true when config provided", () => {
    const runner = new ExperimentRunner(createConfig());
    expect(runner.isEnabled()).toBe(true);
  });

  it("runExperiment returns null when disabled", async () => {
    const runner = new ExperimentRunner(null);
    const result = await runner.runExperiment({
      datasetName: "test-ds",
      target: async (input) => input,
    });
    expect(result).toBeNull();
  });

  it("runExperiment passes caller-supplied evaluators through", async () => {
    const { mockEvaluate, getLastOptions } = createMockEvaluate([]);
    const runner = new ExperimentRunner(createConfig(), undefined, mockEvaluate as any);

    const evalA = () => ({ key: "a", score: 1 });
    const evalB = () => ({ key: "b", score: 0 });
    await runner.runExperiment({
      datasetName: "test-ds",
      target: async (input) => input,
      evaluators: [evalA as any, evalB as any],
    });

    const opts = getLastOptions();
    expect(opts.evaluators.length).toBe(2);
  });

  it("runExperiment defaults to no evaluators when none specified", async () => {
    const { mockEvaluate, getLastOptions } = createMockEvaluate([]);
    const runner = new ExperimentRunner(createConfig(), undefined, mockEvaluate as any);

    await runner.runExperiment({
      datasetName: "test-ds",
      target: async (input) => input,
    });

    const opts = getLastOptions();
    expect(opts.evaluators.length).toBe(0);
  });

  it("runExperiment passes correct options to evaluate()", async () => {
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
    expect(opts.data).toBe("my-dataset");
    expect(opts.experimentPrefix).toBe("custom-prefix");
    expect(opts.description).toBe("A test experiment");
    expect(opts.maxConcurrency).toBe(2);
    expect(opts.metadata.memoryDesignId).toBe("memory-v1");
    expect(opts.metadata.source).toBe("thoughtbox-experiment-runner");
  });

  it("runExperiment computes aggregate scores", async () => {
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

    expect(result).not.toBeNull();
    expect(result!.totalExamples).toBe(2);
    expect(result!.aggregateScores.sessionQuality).toBeCloseTo(0.6, 9);
    expect(result!.aggregateScores.reasoningCoherence).toBeCloseTo(0.8, 9);
    expect(result!.experimentName).toBe("test-experiment-001");
    expect(result!.datasetName).toBe("test-ds");
  });

  it("runExperiment handles empty dataset", async () => {
    const { mockEvaluate } = createMockEvaluate([]);
    const runner = new ExperimentRunner(createConfig(), undefined, mockEvaluate as any);

    const result = await runner.runExperiment({
      datasetName: "empty-ds",
      target: async (input) => input,
    });

    expect(result).not.toBeNull();
    expect(result!.totalExamples).toBe(0);
    expect(Object.keys(result!.aggregateScores).length).toBe(0);
  });

  it("runCollectionExperiment sets no memoryDesignId", async () => {
    const { mockEvaluate, getLastOptions } = createMockEvaluate([]);
    const runner = new ExperimentRunner(createConfig(), undefined, mockEvaluate as any);

    await runner.runCollectionExperiment("coll-ds", async (input) => input);

    const opts = getLastOptions();
    expect(opts.metadata.memoryDesignId).toBeUndefined();
    expect(opts.experimentPrefix).toContain("collection");
  });

  it("runDeploymentExperiment sets memoryDesignId", async () => {
    const { mockEvaluate, getLastOptions } = createMockEvaluate([]);
    const runner = new ExperimentRunner(createConfig(), undefined, mockEvaluate as any);

    await runner.runDeploymentExperiment("deploy-ds", "memory-v2", async (input) => input);

    const opts = getLastOptions();
    expect(opts.metadata.memoryDesignId).toBe("memory-v2");
    expect(opts.experimentPrefix).toContain("deployment");
  });

  it("runRegressionCheck returns pass when above thresholds", async () => {
    const { mockEvaluate } = createMockEvaluate([
      {
        example: { id: "ex-1", inputs: {} },
        evaluationResults: {
          results: [
            { key: "task_success", score: 0.9 },
            { key: "pairwise_win_rate", score: 0.8 },
          ],
        },
      },
    ]);

    const runner = new ExperimentRunner(createConfig(), undefined, mockEvaluate as any);
    const check = await runner.runRegressionCheck("regression-ds", async (input) => input, {
      task_success: 0.5,
      pairwise_win_rate: 0.5,
    });

    expect(check.passed).toBe(true);
    expect(check.skipped).toBe(false);
    expect(check.failedEvaluators.length).toBe(0);
    expect(check.details).toContain("passed");
  });

  it("runRegressionCheck returns fail when below thresholds", async () => {
    const { mockEvaluate } = createMockEvaluate([
      {
        example: { id: "ex-1", inputs: {} },
        evaluationResults: {
          results: [
            { key: "task_success", score: 0.2 },
            { key: "pairwise_win_rate", score: 0.9 },
          ],
        },
      },
    ]);

    const runner = new ExperimentRunner(createConfig(), undefined, mockEvaluate as any);
    const check = await runner.runRegressionCheck("regression-ds", async (input) => input, {
      task_success: 0.5,
      pairwise_win_rate: 0.5,
    });

    expect(check.passed).toBe(false);
    expect(check.skipped).toBe(false);
    expect(check.failedEvaluators).toContain("task_success");
    expect(check.failedEvaluators).not.toContain("pairwise_win_rate");
  });

  it("runRegressionCheck on unconfigured runner is skipped and NOT passed", async () => {
    const runner = new ExperimentRunner(null);
    const check = await runner.runRegressionCheck("regression-ds", async (input) => input);

    expect(check.passed).toBe(false);
    expect(check.skipped).toBe(true);
    expect(check.failedEvaluators.length).toBe(0);
    expect(Object.keys(check.scores).length).toBe(0);
    expect(check.details).toContain("not configured");
  });

  it("shared client is reused across instances", () => {
    resetClient();
    const config = createConfig();
    const client1 = getSharedClient(config);
    const client2 = getSharedClient(config);
    expect(client1).toBe(client2);

    // Different config should create new client
    const client3 = getSharedClient({ ...config, apiKey: "different-key" });
    expect(client1).not.toBe(client3);
    resetClient();
  });
});
