import type { EvaluatorName } from "../types.js";
import type { Evaluator } from "./utils.js";
import { dgmFitnessEvaluator } from "./dgm-fitness.js";
import { memoryQualityEvaluator } from "./memory-quality.js";
import { reasoningCoherenceEvaluator } from "./reasoning-coherence.js";
import { sessionQualityEvaluator } from "./session-quality.js";

export type { Evaluator, EvaluatorArgs } from "./utils.js";

export {
  sessionQualityEvaluator,
  memoryQualityEvaluator,
  dgmFitnessEvaluator,
  reasoningCoherenceEvaluator,
};

const EVALUATOR_MAP: Record<EvaluatorName, Evaluator> = {
  sessionQuality: sessionQualityEvaluator,
  memoryQuality: memoryQualityEvaluator,
  dgmFitness: dgmFitnessEvaluator,
  reasoningCoherence: reasoningCoherenceEvaluator,
};

/**
 * Get one evaluator by name.
 */
export function getEvaluator(name: EvaluatorName): Evaluator {
  return EVALUATOR_MAP[name];
}

/**
 * Get all evaluators in a deterministic order.
 */
export function getAllEvaluators(): Evaluator[] {
  return [
    EVALUATOR_MAP.sessionQuality,
    EVALUATOR_MAP.memoryQuality,
    EVALUATOR_MAP.dgmFitness,
    EVALUATOR_MAP.reasoningCoherence,
  ];
}

