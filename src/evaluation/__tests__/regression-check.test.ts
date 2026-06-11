/**
 * Regression-gate honesty tests (SPEC-V1-INITIATIVE Phase 3.5).
 *
 * A gate must never pass by being disabled: when LangSmith is unconfigured
 * (or the experiment yields no result), runRegressionCheck must report
 * skipped=true and passed=false so callers can distinguish "gate ran and
 * passed" from "gate did not run".
 */
import { describe, it, expect } from "vitest";
import { ExperimentRunner } from "../experiment-runner.js";
import type { LangSmithConfig } from "../types.js";

function createConfig(): LangSmithConfig {
  return {
    apiKey: "test-key",
    apiUrl: "https://api.smith.langchain.com",
    project: "test-project",
  };
}

type MockRow = {
  example: { id: string; inputs: Record<string, unknown> };
  evaluationResults: { results: Array<{ key: string; score: number }> };
};

function createMockEvaluate(rows: MockRow[]) {
  return async () => {
    let index = 0;
    return {
      experimentName: "test-experiment-001",
      [Symbol.asyncIterator]() {
        return this;
      },
      async next() {
        if (index < rows.length) {
          return { value: rows[index++], done: false };
        }
        return { value: undefined, done: true };
      },
    };
  };
}

describe("runRegressionCheck gate honesty", () => {
  it("reports skipped and NOT passed when LangSmith is unconfigured", async () => {
    const runner = new ExperimentRunner(null);
    const check = await runner.runRegressionCheck("regression-ds", async (input) => input);

    expect(check.passed).toBe(false);
    expect(check.skipped).toBe(true);
    expect(check.scores).toEqual({});
    expect(check.failedEvaluators).toEqual([]);
    expect(check.details).toContain("not configured");
    expect(check.details).toContain("not passed");
  });

  it("reports skipped and NOT passed when the experiment produces no result", async () => {
    const failingEvaluate = async () => {
      throw new Error("LangSmith API unavailable");
    };
    const runner = new ExperimentRunner(createConfig(), undefined, failingEvaluate as never);
    const check = await runner.runRegressionCheck("regression-ds", async (input) => input);

    expect(check.passed).toBe(false);
    expect(check.skipped).toBe(true);
    expect(check.details).toContain("no result");
  });

  it("passes with skipped=false when evaluators meet thresholds", async () => {
    const mockEvaluate = createMockEvaluate([
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
    const runner = new ExperimentRunner(createConfig(), undefined, mockEvaluate as never);
    const check = await runner.runRegressionCheck("regression-ds", async (input) => input);

    expect(check.passed).toBe(true);
    expect(check.skipped).toBe(false);
    expect(check.failedEvaluators).toEqual([]);
  });

  it("fails with skipped=false when an evaluator is below threshold", async () => {
    const mockEvaluate = createMockEvaluate([
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
    const runner = new ExperimentRunner(createConfig(), undefined, mockEvaluate as never);
    const check = await runner.runRegressionCheck("regression-ds", async (input) => input);

    expect(check.passed).toBe(false);
    expect(check.skipped).toBe(false);
    expect(check.failedEvaluators).toContain("sessionQuality");
  });
});
