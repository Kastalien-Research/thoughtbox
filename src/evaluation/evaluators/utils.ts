import type { Run } from "langsmith/schemas";
import type { Example } from "langsmith/schemas";
import type { EvaluationResult } from "langsmith/evaluation";

/**
 * Concrete evaluator signature — one arm of the EvaluatorT union, explicitly
 * typed so destructuring works without implicit `any`.
 */
export interface EvaluatorArgs {
  run: Run;
  example: Example;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  referenceOutputs?: Record<string, any>;
  attachments?: Record<string, any>;
}

export type Evaluator = (args: EvaluatorArgs) => EvaluationResult;

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function extractRunContext(run: Run, outputs?: Record<string, any>) {
  return {
    outputs: outputs ?? (run.outputs as Record<string, unknown> | undefined) ?? {},
    metadata: (run.extra?.metadata as Record<string, unknown> | undefined) ?? {},
  };
}
