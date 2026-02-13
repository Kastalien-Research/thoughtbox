import type { EvaluationResult } from "langsmith/evaluation";
import { type Evaluator, clamp01, asNumber, extractRunContext } from "./utils.js";

/**
 * Computes DGM fitness score and descriptors from evaluation metadata.
 */
export const dgmFitnessEvaluator: Evaluator = ({ run, outputs }): EvaluationResult => {
  const { outputs: runOutputs, metadata } = extractRunContext(run, outputs);

  const sessionQuality = clamp01(asNumber(runOutputs.sessionQuality, 0.5));
  const memoryQuality = clamp01(asNumber(runOutputs.memoryQuality, 0.5));
  const reasoningCoherence = clamp01(asNumber(runOutputs.reasoningCoherence, 0.5));

  const thoughtDepth = clamp01(
    asNumber(runOutputs.trackedThoughtCount ?? runOutputs.finalThoughtCount, 0) / 16
  );
  // branchCount is the canonical raw metric from trace-listener metadata
  const branchingFactor = clamp01(
    asNumber(metadata.branchCount, 0) / 8
  );
  const contextUtilization = clamp01(
    asNumber(runOutputs.contextUtilization ?? metadata.contextUtilization, memoryQuality)
  );

  const score = clamp01(
    sessionQuality * 0.35 + memoryQuality * 0.4 + reasoningCoherence * 0.25
  );

  return {
    key: "dgmFitness",
    score,
    comment: "DGM archive fitness score synthesized from session/memory/reasoning scores.",
    evaluatorInfo: {
      sessionQuality,
      memoryQuality,
      reasoningCoherence,
      thoughtDepth,
      branchingFactor,
      contextUtilization,
    },
  };
};
