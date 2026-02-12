import type { EvaluationResult } from "langsmith/evaluation";
import { type Evaluator, clamp01, asNumber, extractRunContext } from "./utils.js";

/**
 * Scores reasoning coherence from run structure and output characteristics.
 */
export const reasoningCoherenceEvaluator: Evaluator = ({
  run,
  outputs,
}): EvaluationResult => {
  const { outputs: runOutputs, metadata } = extractRunContext(run, outputs);

  const thoughtText = typeof runOutputs.thought === "string" ? runOutputs.thought : "";
  const thoughtCount = asNumber(
    runOutputs.trackedThoughtCount ?? runOutputs.finalThoughtCount,
    0
  );
  const branchCount = asNumber(metadata.branchCount ?? metadata.branchingFactor, 0);

  const hasResolution = thoughtCount > 0 ? 1 : 0;
  const depthBalance = clamp01(thoughtCount / 10);
  const branchPenalty = clamp01(1 - Math.max(0, branchCount - 4) / 8);
  const textSignal = clamp01(thoughtText.length / 600);

  const score = clamp01(
    hasResolution * 0.35 + depthBalance * 0.3 + branchPenalty * 0.2 + textSignal * 0.15
  );

  return {
    key: "reasoningCoherence",
    score,
    comment: "Deterministic coherence score based on thought depth, branching, and resolution signals.",
    evaluatorInfo: {
      hasResolution,
      depthBalance,
      branchPenalty,
      textSignal,
      thoughtCount,
      branchCount,
    },
  };
};
