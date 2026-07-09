/**
 * Evidence-gated graduation threshold policy (SPEC-AGX-SUBSTRATE B10, claim c8).
 *
 * Graduation reads the fitness ledger (B9/c7): a notebook graduates to a
 * draft peer manifest only when its latest runbook template version carries
 * enough machine-checked evidence. The tier policy is the environmental-
 * learning-gates ladder (SPEC-ENVIRONMENTAL-LEARNING-GATES, folded into B10):
 *
 * - `advisory`  — evaluate and record the decision; log only. Shared
 *                 interpretation: the agent sees the deficit, nothing blocks.
 * - `shadow`    — the validator tier AND the gate's probation state: evaluate,
 *                 warn, and record `wouldHaveBlocked` WITHOUT blocking. This
 *                 keeps the evidence stream alive (gates are information-
 *                 destroying — a hard block stops observing what would have
 *                 happened), so threshold calibration stays measurable.
 * - `enforce`   — the live gate: graduation below threshold is rejected with
 *                 an error naming each missing piece of evidence.
 *
 * DEFAULT IS `shadow`: per the ELG spec, promotion to a live gate must be a
 * deliberate act backed by shadow-window data, never the ambient default.
 * Switch via the handler option or the THOUGHTBOX_GRADUATION_GATE env var.
 */

import type { FitnessAggregate, RunbookStorage } from "./types.js";

export const GRADUATION_GATE_MODES = ["advisory", "shadow", "enforce"] as const;
export type GraduationGateMode = (typeof GRADUATION_GATE_MODES)[number];

/** Config switch: set to "advisory" | "shadow" | "enforce". Default "shadow". */
export const GRADUATION_GATE_ENV_VAR = "THOUGHTBOX_GRADUATION_GATE";

/**
 * Declared fitness thresholds (spec §7: "N instances, pass-rate ≥ p, across
 * ≥ k distinct agents"). Rates compare on the latest template version.
 */
export interface GraduationThresholds {
  /** Distinct instances that produced machine-checked ledger rows. */
  minInstances: number;
  /** Pass rate over rows that reached a verdict (pass/fail). */
  minPassRate: number;
  /** Distinct executing agents contributing ledger rows. */
  minDistinctAgents: number;
}

/**
 * v0 defaults for the single-operator deployment: three evidenced instances
 * at ≥90% machine-checked pass rate. minDistinctAgents stays 1 because
 * cross-agent diversity is not yet obtainable in most workspaces; raise it
 * per-deployment once multi-agent instances are routine.
 */
export const DEFAULT_GRADUATION_THRESHOLDS: GraduationThresholds = {
  minInstances: 3,
  minPassRate: 0.9,
  minDistinctAgents: 1,
};

/**
 * The recorded outcome of one gate evaluation. Always returned to the caller
 * (and logged) so shadow mode leaves an auditable would-have-blocked trail
 * with zero behavior change to graduation itself.
 */
export interface GraduationGateDecision {
  mode: GraduationGateMode;
  /** The graduating notebook id — templateId in the runbook identity scheme. */
  templateId: string;
  /** Latest template version evaluated; null when no version was ever persisted. */
  templateVersion: number | null;
  pass: boolean;
  /** True iff mode is "enforce": a failing decision blocks graduation. */
  enforced: boolean;
  /** True iff the gate failed but graduation proceeded (advisory/shadow tiers). */
  wouldHaveBlocked: boolean;
  thresholds: GraduationThresholds;
  /** Ledger aggregate the decision was made on; null when no evidence exists. */
  aggregate: FitnessAggregate | null;
  /** Human-readable deficits, one per unmet threshold. Empty iff pass. */
  deficits: string[];
  evaluatedAt: string;
}

/**
 * Resolve the active gate mode: explicit config beats the env var beats the
 * shadow default. An unrecognized value throws loudly — a silently ignored
 * enforcement switch is the worst failure mode a gate can have.
 */
export function resolveGraduationGateMode(
  explicit?: GraduationGateMode,
  env: Record<string, string | undefined> = process.env,
): GraduationGateMode {
  if (explicit !== undefined) return explicit;
  const fromEnv = env[GRADUATION_GATE_ENV_VAR];
  if (fromEnv === undefined || fromEnv === "") return "shadow";
  if ((GRADUATION_GATE_MODES as readonly string[]).includes(fromEnv)) {
    return fromEnv as GraduationGateMode;
  }
  throw new Error(
    `${GRADUATION_GATE_ENV_VAR}="${fromEnv}" is not a graduation gate mode; ` +
      `expected one of: ${GRADUATION_GATE_MODES.join(", ")}`,
  );
}

/**
 * Pure threshold evaluation over a fitness aggregate. `aggregate` null means
 * the notebook has no runbook template versions at all (never persisted, so
 * never run); every deficit message names the missing evidence explicitly —
 * the enforce-mode rejection surfaces these verbatim.
 */
export function evaluateGraduationFitness(
  templateId: string,
  aggregate: FitnessAggregate | null,
  thresholds: GraduationThresholds,
): { pass: boolean; deficits: string[] } {
  const deficits: string[] = [];

  if (aggregate === null) {
    if (
      thresholds.minInstances > 0
      || thresholds.minPassRate > 0
      || thresholds.minDistinctAgents > 0
    ) {
      deficits.push(
        `no fitness evidence: notebook "${templateId}" has no runbook template versions ` +
          `(it was never run as a runbook, so the fitness ledger is empty; ` +
          `need ≥${thresholds.minInstances} evidenced instances at pass rate ≥${thresholds.minPassRate})`,
      );
    }
    return { pass: deficits.length === 0, deficits };
  }

  if (aggregate.instances < thresholds.minInstances) {
    deficits.push(
      `evidenced instances ${aggregate.instances} below threshold ${thresholds.minInstances}`,
    );
  }
  if (thresholds.minPassRate > 0) {
    if (aggregate.passRate === null) {
      deficits.push(
        `no machine-checked pass rate (0 evaluated expectations in the ledger; ` +
          `need pass rate ≥${thresholds.minPassRate})`,
      );
    } else if (aggregate.passRate < thresholds.minPassRate) {
      deficits.push(
        `pass rate ${formatRate(aggregate.passRate)} below threshold ${thresholds.minPassRate} ` +
          `(${aggregate.passed}/${aggregate.evaluated} machine-checked expectations passed)`,
      );
    }
  }
  if (aggregate.distinctAgents < thresholds.minDistinctAgents) {
    deficits.push(
      `distinct agents ${aggregate.distinctAgents} below threshold ${thresholds.minDistinctAgents}`,
    );
  }

  return { pass: deficits.length === 0, deficits };
}

export interface GraduationGateInput {
  /** The graduating notebook id (= runbook templateId). */
  templateId: string;
  /**
   * Fitness ledger access. Undefined means the graduation surface has no
   * runbook storage wired — treated as absent evidence, not as a pass.
   */
  storage: Pick<RunbookStorage, "getLatestTemplate" | "getFitnessAggregate"> | undefined;
  mode: GraduationGateMode;
  thresholds?: Partial<GraduationThresholds> | undefined;
}

/**
 * Full gate evaluation over the ledger: latest template version → aggregate
 * → threshold policy → recorded decision. Never throws on missing evidence;
 * the CALLER enforces (or shadows) based on `decision.pass` and `mode` so
 * the decision object exists in every tier.
 */
export async function evaluateGraduationGate(
  input: GraduationGateInput,
): Promise<GraduationGateDecision> {
  const thresholds: GraduationThresholds = {
    ...DEFAULT_GRADUATION_THRESHOLDS,
    ...input.thresholds,
  };

  let templateVersion: number | null = null;
  let aggregate: FitnessAggregate | null = null;
  const deficits: string[] = [];

  if (input.storage === undefined) {
    deficits.push(
      "fitness ledger unavailable: no runbook storage is wired to the graduation surface, " +
        "so no evidence can be read",
    );
  } else {
    const latest = await input.storage.getLatestTemplate(input.templateId);
    if (latest !== null) {
      templateVersion = latest.version;
      aggregate = await input.storage.getFitnessAggregate(input.templateId, latest.version);
    }
    const evaluation = evaluateGraduationFitness(input.templateId, aggregate, thresholds);
    deficits.push(...evaluation.deficits);
  }

  const pass = deficits.length === 0;
  const enforced = input.mode === "enforce";
  return {
    mode: input.mode,
    templateId: input.templateId,
    templateVersion,
    pass,
    enforced,
    wouldHaveBlocked: !pass && !enforced,
    thresholds,
    aggregate,
    deficits,
    evaluatedAt: new Date().toISOString(),
  };
}

function formatRate(rate: number): string {
  return (Math.round(rate * 1000) / 1000).toString();
}
