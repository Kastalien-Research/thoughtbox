/**
 * B10 graduation-gate threshold policy tests (SPEC-AGX-SUBSTRATE claim c8,
 * ELG tier ladder). Pure evaluation over fitness aggregates plus the full
 * ledger-backed evaluateGraduationGate path over InMemoryRunbookStorage.
 * The peer-notebook handler integration (accept/reject at graduation) lives
 * in src/peer-notebook/__tests__/graduation-gate.test.ts.
 */

import { describe, expect, it } from "vitest";
import {
  DEFAULT_GRADUATION_THRESHOLDS,
  GRADUATION_GATE_ENV_VAR,
  evaluateGraduationFitness,
  evaluateGraduationGate,
  resolveGraduationGateMode,
} from "../runbook/graduation-gate.js";
import { InMemoryRunbookStorage } from "../runbook/in-memory-runbook-storage.js";
import {
  hashTemplateCells,
  type FitnessAggregate,
  type RunbookTemplateCell,
} from "../runbook/types.js";

const TEMPLATE_ID = "nb_gate_candidate";

function aggregate(overrides: Partial<FitnessAggregate> = {}): FitnessAggregate {
  return {
    templateId: TEMPLATE_ID,
    templateVersion: 1,
    instances: 3,
    evaluated: 10,
    passed: 10,
    passRate: 1,
    errorRows: 0,
    errorRate: 0,
    distinctAgents: 1,
    ...overrides,
  };
}

describe("resolveGraduationGateMode", () => {
  it("defaults to shadow (ELG: enforcement is opt-in, never ambient)", () => {
    expect(resolveGraduationGateMode(undefined, {})).toBe("shadow");
    expect(resolveGraduationGateMode(undefined, { [GRADUATION_GATE_ENV_VAR]: "" })).toBe("shadow");
  });

  it("reads the env var and lets explicit config beat it", () => {
    expect(
      resolveGraduationGateMode(undefined, { [GRADUATION_GATE_ENV_VAR]: "enforce" }),
    ).toBe("enforce");
    expect(
      resolveGraduationGateMode("advisory", { [GRADUATION_GATE_ENV_VAR]: "enforce" }),
    ).toBe("advisory");
  });

  it("throws loudly on an unrecognized env value instead of silently defaulting", () => {
    expect(() =>
      resolveGraduationGateMode(undefined, { [GRADUATION_GATE_ENV_VAR]: "on" }),
    ).toThrow(/not a graduation gate mode/);
  });
});

describe("evaluateGraduationFitness", () => {
  it("passes when every threshold is met", () => {
    const result = evaluateGraduationFitness(
      TEMPLATE_ID,
      aggregate(),
      DEFAULT_GRADUATION_THRESHOLDS,
    );
    expect(result).toEqual({ pass: true, deficits: [] });
  });

  it("names the empty ledger when no template version was ever persisted", () => {
    const result = evaluateGraduationFitness(TEMPLATE_ID, null, DEFAULT_GRADUATION_THRESHOLDS);
    expect(result.pass).toBe(false);
    expect(result.deficits).toHaveLength(1);
    expect(result.deficits[0]).toContain("no fitness evidence");
    expect(result.deficits[0]).toContain("never run as a runbook");
  });

  it("names each unmet threshold as a separate deficit", () => {
    const result = evaluateGraduationFitness(
      TEMPLATE_ID,
      aggregate({ instances: 1, passed: 4, passRate: 0.4, distinctAgents: 1 }),
      { minInstances: 3, minPassRate: 0.9, minDistinctAgents: 2 },
    );
    expect(result.pass).toBe(false);
    expect(result.deficits).toHaveLength(3);
    expect(result.deficits[0]).toContain("instances 1 below threshold 3");
    expect(result.deficits[1]).toContain("pass rate 0.4 below threshold 0.9");
    expect(result.deficits[2]).toContain("distinct agents 1 below threshold 2");
  });

  it("treats a null pass rate (zero evaluated rows) as missing evidence, not a pass", () => {
    const result = evaluateGraduationFitness(
      TEMPLATE_ID,
      aggregate({ evaluated: 0, passed: 0, passRate: null }),
      DEFAULT_GRADUATION_THRESHOLDS,
    );
    expect(result.pass).toBe(false);
    expect(result.deficits.join(" ")).toContain("no machine-checked pass rate");
  });
});

describe("evaluateGraduationGate (ledger-backed)", () => {
  it("fails with a named deficit when no runbook storage is wired", async () => {
    const decision = await evaluateGraduationGate({
      templateId: TEMPLATE_ID,
      storage: undefined,
      mode: "shadow",
    });
    expect(decision.pass).toBe(false);
    expect(decision.enforced).toBe(false);
    expect(decision.wouldHaveBlocked).toBe(true);
    expect(decision.aggregate).toBeNull();
    expect(decision.deficits[0]).toContain("fitness ledger unavailable");
  });

  it("evaluates the latest template version's aggregate against thresholds", async () => {
    const storage = new InMemoryRunbookStorage();
    await seedEvidence(storage, { instances: 3, passRowsPerInstance: 2 });

    const decision = await evaluateGraduationGate({
      templateId: TEMPLATE_ID,
      storage,
      mode: "enforce",
      thresholds: { minInstances: 3, minPassRate: 0.9, minDistinctAgents: 1 },
    });
    expect(decision.pass).toBe(true);
    expect(decision.enforced).toBe(true);
    expect(decision.wouldHaveBlocked).toBe(false);
    expect(decision.templateVersion).toBe(1);
    expect(decision.aggregate).toMatchObject({ instances: 3, passRate: 1, distinctAgents: 1 });
    expect(decision.deficits).toEqual([]);
  });

  it("reports would-have-blocked (not enforced) below threshold in shadow mode", async () => {
    const storage = new InMemoryRunbookStorage();
    await seedEvidence(storage, { instances: 1, passRowsPerInstance: 1 });

    const decision = await evaluateGraduationGate({
      templateId: TEMPLATE_ID,
      storage,
      mode: "shadow",
    });
    expect(decision.pass).toBe(false);
    expect(decision.wouldHaveBlocked).toBe(true);
    expect(decision.deficits[0]).toContain("instances 1 below threshold 3");
  });
});

async function seedEvidence(
  storage: InMemoryRunbookStorage,
  input: { instances: number; passRowsPerInstance: number },
): Promise<void> {
  const cells: RunbookTemplateCell[] = [
    { cellId: "cell-1", cellType: "code", filename: "main.mjs", source: "console.log(1);" },
  ];
  await storage.saveTemplate({
    templateId: TEMPLATE_ID,
    version: 1,
    cells,
    cellsHash: hashTemplateCells(cells),
    createdBy: "local",
    createdAt: new Date().toISOString(),
  });
  for (let i = 0; i < input.instances; i += 1) {
    const instanceId = `inst-${i + 1}`;
    await storage.createInstance({
      instanceId,
      templateId: TEMPLATE_ID,
      templateVersion: 1,
      createdBy: "local",
      createdAt: new Date().toISOString(),
    });
    for (let row = 0; row < input.passRowsPerInstance; row += 1) {
      await storage.appendFitnessRows([
        {
          templateId: TEMPLATE_ID,
          templateVersion: 1,
          instanceId,
          cellId: "cell-1",
          tier: 1,
          result: "pass",
          pass: true,
          expected: 0,
          actual: 0,
          agentId: "local",
          ts: new Date().toISOString(),
        },
      ]);
    }
  }
}
