import type { EvaluationResult } from "langsmith/evaluation";
import { type Evaluator, clamp01, asNumber, extractRunContext } from "./utils.js";

/**
 * Scores session quality using deterministic run/output metadata heuristics.
 */
export const sessionQualityEvaluator: Evaluator = ({
  run,
  outputs,
}): EvaluationResult => {
  const { outputs: runOutputs, metadata } = extractRunContext(run, outputs);

  const trackedThoughtCount = asNumber(
    runOutputs.trackedThoughtCount ?? runOutputs.finalThoughtCount,
    0
  );
  const revisionCount = asNumber(metadata.revisionCount, 0);
  const branchCount = asNumber(metadata.branchCount, 0);

  const depthScore = clamp01(trackedThoughtCount / 12);
  const completionScore = trackedThoughtCount > 0 ? 1 : 0;
  const revisionRatio = trackedThoughtCount > 0 ? revisionCount / trackedThoughtCount : 0;
  const revisionEfficiency = clamp01(1 - Math.max(0, revisionRatio - 0.3));
  const branchPenalty = clamp01(1 - Math.max(0, branchCount - 5) / 10);

  const score = clamp01(
    depthScore * 0.35 +
      completionScore * 0.35 +
      revisionEfficiency * 0.2 +
      branchPenalty * 0.1
  );

  return {
    key: "sessionQuality",
    score,
    comment: "Deterministic session-quality score from thought depth/completion/revision metadata.",
    evaluatorInfo: {
      trackedThoughtCount,
      revisionCount,
      branchCount,
      depthScore,
      completionScore,
      revisionEfficiency,
      branchPenalty,
    },
  };
};
