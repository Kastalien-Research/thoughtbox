import type { EvaluationResult } from "langsmith/evaluation";
import { type Evaluator, clamp01, asNumber, extractRunContext } from "./utils.js";

/**
 * Scores memory quality for deployment runs (with-memory tasks).
 */
export const memoryQualityEvaluator: Evaluator = ({
  run,
  outputs,
  referenceOutputs,
}): EvaluationResult => {
  const { outputs: runOutputs, metadata } = extractRunContext(run, outputs);

  const contextUtilization = clamp01(
    asNumber(runOutputs.contextUtilization ?? metadata.contextUtilization, 0.5)
  );

  const deploymentSessionQuality = clamp01(
    asNumber(runOutputs.sessionQuality, contextUtilization)
  );

  const hasBaseline = referenceOutputs?.sessionQuality != null;
  const collectionBaseline = clamp01(
    asNumber(referenceOutputs?.sessionQuality, deploymentSessionQuality)
  );
  const improvementDelta = clamp01((deploymentSessionQuality - collectionBaseline + 1) / 2);

  const score = clamp01(contextUtilization * 0.55 + improvementDelta * 0.45);

  return {
    key: "memoryQuality",
    score,
    comment: hasBaseline
      ? "Deterministic memory-quality score from context utilization and collection-vs-deployment delta."
      : "Memory-quality score (no collection baseline available — delta uses deployment as its own baseline).",
    evaluatorInfo: {
      contextUtilization,
      deploymentSessionQuality,
      collectionBaseline,
      improvementDelta,
      hasBaseline,
    },
  };
};
