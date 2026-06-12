/**
 * Ordered execution and expected-failure halt rules
 * (SPEC-AGX-SUBSTRATE B5 — spec §5 "Ordering" + §5.1 expected-failure rule).
 *
 * Covers, against the real subprocess execution path:
 * - expected-failure continue: a cell that exits nonzero but whose every
 *   declared expectation passes is expectation-satisfied and the run
 *   continues;
 * - halt when a predicted failure's expectation fails, and (unchanged) when
 *   an uncontracted cell fails;
 * - out-of-order rejection on the instance-aware single-cell path: a typed
 *   error names the expected next cell;
 * - partial-run durability: records persist as each cell completes, so a
 *   halted run leaves durable records for every cell that executed, the
 *   instance exists from run start, and the derived status reflects the
 *   halt. Runs against InMemoryRunbookStorage always and against
 *   SupabaseRunbookStorage when the local stack is up.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID } from "node:crypto";
import { Effect } from "effect";
import { NotebookHandler } from "../index.js";
import {
  InMemoryNotebookEngineRuntime,
  type CellExecutionEvidence,
} from "../engine/runtime.js";
import {
  InMemoryRunbookStorage,
  createRunbookMemoryState,
} from "../runbook/in-memory-runbook-storage.js";
import { SupabaseRunbookStorage } from "../runbook/supabase-runbook-storage.js";
import {
  hashTemplateCells,
  templateCellsFromNotebook,
  type CellExecutionRecord,
  type RunbookStorage,
  type RunbookTemplate,
  type RunbookTemplateCell,
} from "../runbook/types.js";
import {
  OutOfOrderExecutionError,
  assertCellExecutable,
  deriveInstanceStatus,
  isExecutionSatisfied,
  nextUnsatisfiedCell,
} from "../runbook/ordering.js";
import type { ExpectationRecord } from "../contracts.js";
import {
  ensureTestWorkspace,
  isSupabaseAvailable,
  SUPABASE_TEST_URL,
  SUPABASE_TEST_SERVICE_ROLE_KEY,
  TEST_WORKSPACE_ID,
} from "../../__tests__/supabase-test-helpers.js";

// =============================================================================
// Pure ordering/halt rules
// =============================================================================

function templateCell(cellId: string): RunbookTemplateCell {
  return { cellId, cellType: "code", filename: `${cellId}.js`, source: "" };
}

const TEMPLATE: RunbookTemplate = {
  templateId: "rbt-ordering",
  version: 1,
  cells: [templateCell("a"), templateCell("b"), templateCell("c")],
  cellsHash: "sha256:test",
  createdBy: "tester",
  createdAt: "2026-06-12T00:00:00.000Z",
};

function expectation(cellId: string, result: ExpectationRecord["result"]): ExpectationRecord {
  return {
    cellId,
    tier: 1,
    expectation: "exitCode eq 1",
    result,
    expected: { source: { kind: "exitCode" }, op: "eq", value: 1 },
  };
}

function execution(
  cellId: string,
  seq: number,
  status: CellExecutionRecord["status"],
  expectations: ExpectationRecord[] = [],
): CellExecutionRecord {
  return {
    instanceId: "rbi-ordering",
    seq,
    cellId,
    startedAt: "2026-06-12T00:00:00.000Z",
    agentId: "tester",
    inputsDigest: "sha256:inputs",
    status,
    expectations,
  };
}

describe("B5 satisfaction rule (isExecutionSatisfied)", () => {
  it("derives satisfaction from expectations when declared, else procedural status", () => {
    expect(isExecutionSatisfied(execution("a", 1, "completed"))).toBe(true);
    expect(isExecutionSatisfied(execution("a", 1, "failed"))).toBe(false);
    expect(isExecutionSatisfied(execution("a", 1, "skipped"))).toBe(false);
    // Expectation-satisfied predicted failure counts as satisfied.
    expect(
      isExecutionSatisfied(execution("a", 1, "failed", [expectation("a", "pass")])),
    ).toBe(true);
    expect(
      isExecutionSatisfied(execution("a", 1, "failed", [expectation("a", "fail")])),
    ).toBe(false);
    // Declared expectations beat procedural completion in both directions.
    expect(
      isExecutionSatisfied(execution("a", 1, "completed", [expectation("a", "fail")])),
    ).toBe(false);
    expect(
      isExecutionSatisfied(execution("a", 1, "completed", [expectation("a", "error")])),
    ).toBe(false);
    expect(
      isExecutionSatisfied(
        execution("a", 1, "completed", [expectation("a", "pass"), expectation("a", "fail")]),
      ),
    ).toBe(false);
  });
});

describe("B5 ordering (nextUnsatisfiedCell / assertCellExecutable)", () => {
  it("walks template order and tolerates re-execution appends", () => {
    expect(nextUnsatisfiedCell(TEMPLATE, [])).toBe("a");
    expect(nextUnsatisfiedCell(TEMPLATE, [execution("a", 1, "completed")])).toBe("b");
    // A failed attempt keeps the cell next; a later re-execution supersedes it.
    expect(
      nextUnsatisfiedCell(TEMPLATE, [
        execution("a", 1, "completed"),
        execution("b", 2, "failed"),
      ]),
    ).toBe("b");
    expect(
      nextUnsatisfiedCell(TEMPLATE, [
        execution("a", 1, "completed"),
        execution("b", 2, "failed"),
        execution("b", 3, "completed"),
      ]),
    ).toBe("c");
    expect(
      nextUnsatisfiedCell(TEMPLATE, [
        execution("a", 1, "completed"),
        execution("b", 2, "failed", [expectation("b", "pass")]),
        execution("c", 3, "completed"),
      ]),
    ).toBeNull();
  });

  it("rejects out-of-order execution with a typed error naming the next cell", () => {
    const executions = [execution("a", 1, "completed")];
    expect(() => assertCellExecutable(TEMPLATE, executions, "b")).not.toThrow();
    let caught: unknown;
    try {
      assertCellExecutable(TEMPLATE, executions, "c");
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(OutOfOrderExecutionError);
    const typed = caught as OutOfOrderExecutionError;
    expect(typed.name).toBe("OutOfOrderExecutionError");
    expect(typed.attemptedCellId).toBe("c");
    expect(typed.expectedNextCellId).toBe("b");
    expect(typed.message).toContain("b");
    // Re-running an earlier satisfied cell is also rejected while an
    // unsatisfied cell exists.
    expect(() => assertCellExecutable(TEMPLATE, executions, "a")).toThrow(
      OutOfOrderExecutionError,
    );
    expect(() => assertCellExecutable(TEMPLATE, executions, "nope")).toThrow(
      /not part of template/,
    );
    // A fully satisfied instance allows re-execution of any cell (appends).
    const satisfied = [
      execution("a", 1, "completed"),
      execution("b", 2, "completed"),
      execution("c", 3, "completed"),
    ];
    expect(() => assertCellExecutable(TEMPLATE, satisfied, "a")).not.toThrow();
    expect(() => assertCellExecutable(TEMPLATE, satisfied, "c")).not.toThrow();
  });

  it("derives instance status with predicted failures counting as satisfied", () => {
    const predicted = execution("b", 2, "failed", [expectation("b", "pass")]);
    expect(
      deriveInstanceStatus(TEMPLATE, [
        execution("a", 1, "completed"),
        predicted,
        execution("c", 3, "completed"),
      ]),
    ).toBe("completed");
    expect(
      deriveInstanceStatus(TEMPLATE, [execution("a", 1, "completed"), predicted]),
    ).toBe("in_progress");
    expect(
      deriveInstanceStatus(TEMPLATE, [
        execution("a", 1, "completed"),
        execution("b", 2, "failed", [expectation("b", "fail")]),
      ]),
    ).toBe("failed");
    expect(
      deriveInstanceStatus(TEMPLATE, [
        execution("a", 1, "completed"),
        execution("b", 2, "failed"),
      ]),
    ).toBe("failed");
  });
});

// =============================================================================
// Real execution — halt rules and partial-run durability
// =============================================================================

const EXIT_1_SOURCE = 'console.error("predicted failure"); process.exit(1);';

const EXIT_CODE_CONTRACT = (value: number) => ({
  schemaVersion: "outcome-contract.v0",
  expectations: [{ source: { kind: "exitCode" }, op: "eq", value }],
});

async function newHandler(storage: RunbookStorage): Promise<NotebookHandler> {
  const handler = new NotebookHandler(undefined, {
    runbookStorage: storage,
    agentId: "agent-b5",
  });
  await handler.init();
  return handler;
}

async function createRunbook(handler: NotebookHandler, title: string): Promise<string> {
  const created = await handler.handleCreateNotebook({ title, language: "javascript" });
  return created.notebook.id as string;
}

describe("Expected-failure halt rule (B5, real execution)", () => {
  it("continues past a predicted failure and passes the run", async () => {
    const storage = new InMemoryRunbookStorage();
    const handler = await newHandler(storage);
    const notebookId = await createRunbook(handler, `Predicted failure ${randomUUID()}`);

    const predicted = await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "predicted.js",
      content: EXIT_1_SOURCE,
      contract: EXIT_CODE_CONTRACT(1),
    });
    const after = await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "after.js",
      content: 'console.log("after ran");',
    });

    const runResult = await handler.handleStartRun({ notebookId, mode: "runbook" });
    expect(runResult.run.status).toBe("completed");
    const verdict = runResult.run.outputs[0];
    expect(verdict.pass).toBe(true);
    const evidence = verdict.evidence as Array<Record<string, unknown>>;
    const predictedCell = evidence.find((cell) => cell.filename === "predicted.js")!;
    expect(predictedCell.status).toBe("failed");
    expect(predictedCell.exitCode).toBe(1);
    const records = predictedCell.expectations as ExpectationRecord[];
    expect(records).toHaveLength(1);
    expect(records[0]!.result).toBe("pass");
    const afterCell = evidence.find((cell) => cell.filename === "after.js")!;
    expect(afterCell.status).toBe("completed");

    // Durable record: all three executed cells recorded, instance satisfied.
    const executions = await storage.listCellExecutions(runResult.run.runId);
    expect(executions.map((record) => record.seq)).toEqual([1, 2, 3]);
    expect(
      executions.map((record) => record.cellId).slice(1),
    ).toEqual([predicted.cell.id, after.cell.id]);
    const template = (await storage.getTemplate(notebookId, 1))!;
    expect(deriveInstanceStatus(template, executions)).toBe("completed");
    const rows = await storage.listFitnessRows(notebookId, 1);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ cellId: predicted.cell.id, result: "pass", pass: true });

    // Sequential cells carry distinct, ordered execution start times —
    // startedAt is captured when each cell BEGINS executing, not when the
    // gate persists its record afterwards.
    const startTimes = executions.map((record) => Date.parse(record.startedAt));
    expect(startTimes.every((time) => Number.isFinite(time))).toBe(true);
    expect(startTimes[0]!).toBeLessThan(startTimes[1]!);
    expect(startTimes[1]!).toBeLessThan(startTimes[2]!);
  }, 180_000);

  it("halts when a predicted failure's expectation fails", async () => {
    const storage = new InMemoryRunbookStorage();
    const handler = await newHandler(storage);
    const notebookId = await createRunbook(handler, `Wrong prediction ${randomUUID()}`);

    await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "wrong.js",
      content: 'console.error("unexpected code"); process.exit(2);',
      contract: EXIT_CODE_CONTRACT(1),
    });
    await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "never.js",
      content: 'console.log("should not run");',
    });

    const runResult = await handler.handleStartRun({ notebookId, mode: "runbook" });
    expect(runResult.run.status).toBe("completed");
    const verdict = runResult.run.outputs[0];
    expect(verdict.pass).toBe(false);
    const evidence = verdict.evidence as Array<Record<string, unknown>>;
    const wrong = evidence.find((cell) => cell.filename === "wrong.js")!;
    expect((wrong.expectations as ExpectationRecord[])[0]!.result).toBe("fail");
    expect(evidence.find((cell) => cell.filename === "never.js")!.status).toBe("skipped");

    // Only the executed cells (install + wrong.js) leave records; the halt
    // is visible in the derived status.
    const executions = await storage.listCellExecutions(runResult.run.runId);
    expect(executions).toHaveLength(2);
    const template = (await storage.getTemplate(notebookId, 1))!;
    expect(deriveInstanceStatus(template, executions)).toBe("failed");
  }, 180_000);
});

/**
 * Shared partial-run scenario (B5 known-gap closure): 4 code cells, the
 * uncontracted 2nd one fails → the run halts there, leaving durable records
 * for exactly the cells that executed and ledger rows for every evaluated
 * expectation (including the skipped 4th cell's).
 */
async function runPartialHaltScenario(storage: RunbookStorage): Promise<void> {
  const handler = await newHandler(storage);
  const notebookId = await createRunbook(handler, `Partial halt ${randomUUID()}`);

  const c1 = await handler.handleAddCell({
    notebookId,
    cellType: "code",
    filename: "c1.js",
    content: 'console.log("c1 ran");',
    contract: EXIT_CODE_CONTRACT(0),
  });
  const c2 = await handler.handleAddCell({
    notebookId,
    cellType: "code",
    filename: "c2.js",
    content: 'console.error("uncontracted boom"); process.exit(1);',
  });
  await handler.handleAddCell({
    notebookId,
    cellType: "code",
    filename: "c3.js",
    content: 'console.log("c3 never runs");',
  });
  const c4 = await handler.handleAddCell({
    notebookId,
    cellType: "code",
    filename: "c4.js",
    content: 'console.log("c4 never runs");',
    contract: EXIT_CODE_CONTRACT(0),
  });

  const runResult = await handler.handleStartRun({ notebookId, mode: "runbook" });
  expect(runResult.run.status).toBe("completed");
  const verdict = runResult.run.outputs[0];
  expect(verdict.pass).toBe(false);
  expect(verdict.reason).toContain("c2.js");

  // The instance exists and shows exactly the executed cells: the dependency
  // install, c1, and the halting c2 — nothing for c3/c4.
  const instance = await storage.getInstance(runResult.run.runId);
  expect(instance).not.toBeNull();
  const executions = await storage.listCellExecutions(runResult.run.runId);
  expect(executions).toHaveLength(3);
  expect(executions.map((record) => record.seq)).toEqual([1, 2, 3]);
  expect(executions[1]!.cellId).toBe(c1.cell.id);
  expect(executions[1]!.status).toBe("completed");
  expect(executions[2]!.cellId).toBe(c2.cell.id);
  expect(executions[2]!.status).toBe("failed");

  const template = (await storage.getTemplate(notebookId, 1))!;
  expect(deriveInstanceStatus(template, executions)).toBe("failed");

  // Ledger rows exist for every evaluated expectation: c1's pass (written as
  // the cell completed) and c4's skipped (written at run end).
  const rows = await storage.listFitnessRows(notebookId, 1);
  expect(rows).toHaveLength(2);
  expect(rows.find((row) => row.cellId === c1.cell.id)).toMatchObject({
    result: "pass",
    pass: true,
  });
  expect(rows.find((row) => row.cellId === c4.cell.id)).toMatchObject({
    result: "skipped",
    pass: false,
  });
}

describe("Partial-run durability (B5) — InMemory storage", () => {
  it("a run halting at cell 2 of 4 leaves records for executed cells only", async () => {
    await runPartialHaltScenario(new InMemoryRunbookStorage(createRunbookMemoryState()));
  }, 180_000);

  it("a storage outage on a later cell keeps earlier cells' records durable", async () => {
    const storage = new InMemoryRunbookStorage(createRunbookMemoryState());
    let appends = 0;
    const append = storage.appendCellExecution.bind(storage);
    storage.appendCellExecution = async (record) => {
      appends += 1;
      if (appends === 3) throw new Error("substrate offline");
      return append(record);
    };
    const handler = await newHandler(storage);
    const notebookId = await createRunbook(handler, `Outage ${randomUUID()}`);
    await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "c1.js",
      content: 'console.log("c1 ran");',
    });
    await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "c2.js",
      content: 'console.log("c2 ran");',
    });

    await expect(handler.handleStartRun({ notebookId, mode: "runbook" })).rejects.toThrow();
    const listed = await handler.handleListRuns({ notebookId });
    expect(listed.runs).toHaveLength(1);
    expect(listed.runs[0].status).toBe("failed");
    expect(listed.runs[0].error).toContain("durable runbook persistence failed");
    expect(listed.runs[0].error).toContain("substrate offline");

    // The instance was created at run start and the first two appends
    // (install + c1) survived the outage on the third.
    const runId = listed.runs[0].runId as string;
    expect(await storage.getInstance(runId)).not.toBeNull();
    const executions = await storage.listCellExecutions(runId);
    expect(executions).toHaveLength(2);
    const template = (await storage.getTemplate(notebookId, 1))!;
    expect(deriveInstanceStatus(template, executions)).toBe("in_progress");
  }, 180_000);
});

describe("Partial-run durability (B5) — Supabase storage (local stack)", () => {
  let available = false;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
    if (!available) return;
    await ensureTestWorkspace();
  });

  it("a run halting at cell 2 of 4 leaves records for executed cells only", async ({
    skip,
  }) => {
    if (!available) skip();
    await runPartialHaltScenario(
      new SupabaseRunbookStorage({
        supabaseUrl: SUPABASE_TEST_URL,
        serviceRoleKey: SUPABASE_TEST_SERVICE_ROLE_KEY,
        tenantWorkspaceId: TEST_WORKSPACE_ID,
      }),
    );
  }, 180_000);
});

// =============================================================================
// Instance-aware single-cell path — out-of-order rejection (B5)
// =============================================================================

describe("Out-of-order rejection on the instance-aware single-cell path (B5)", () => {
  it("only the next unsatisfied cell may execute; later cells are rejected", async () => {
    const storage = new InMemoryRunbookStorage(createRunbookMemoryState());
    const handler = await newHandler(storage);
    const notebookId = await createRunbook(handler, `Ordered advance ${randomUUID()}`);

    const c1 = await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "c1.js",
      content: 'console.log("c1 ran");',
    });
    const c2 = await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "c2.js",
      content: EXIT_1_SOURCE,
      contract: EXIT_CODE_CONTRACT(1),
    });

    const notebook = handler.getNotebook(notebookId)!;
    const pkgCellId = notebook.cells.find((cell) => cell.type === "package.json")!.id;
    const cells = templateCellsFromNotebook(notebook);
    await storage.saveTemplate({
      templateId: notebookId,
      version: 1,
      cells,
      cellsHash: hashTemplateCells(cells),
      createdBy: "tester",
      createdAt: new Date().toISOString(),
    });
    const instanceId = `rbi-${randomUUID()}`;
    await storage.createInstance({
      instanceId,
      templateId: notebookId,
      templateVersion: 1,
      createdBy: "tester",
      createdAt: new Date().toISOString(),
    });

    // Fresh instance: the expected next cell is the dependency install.
    await expect(
      handler.handleRunCell({ notebookId, cellId: c2.cell.id, instanceId }),
    ).rejects.toMatchObject({
      name: "OutOfOrderExecutionError",
      attemptedCellId: c2.cell.id,
      expectedNextCellId: pkgCellId,
    });
    await expect(
      handler.handleRunCell({ notebookId, cellId: c2.cell.id, instanceId }),
    ).rejects.toThrow(pkgCellId);

    const pkgResult = await handler.handleRunCell({
      notebookId,
      cellId: pkgCellId,
      instanceId,
    });
    expect(pkgResult.success).toBe(true);
    expect(pkgResult.instance.seq).toBe(1);
    expect(pkgResult.instance.nextCellId).toBe(c1.cell.id);

    // c2 is still later than the next unsatisfied cell (c1).
    await expect(
      handler.handleRunCell({ notebookId, cellId: c2.cell.id, instanceId }),
    ).rejects.toMatchObject({ expectedNextCellId: c1.cell.id });

    const c1Result = await handler.handleRunCell({
      notebookId,
      cellId: c1.cell.id,
      instanceId,
    });
    expect(c1Result.instance.seq).toBe(2);
    expect(c1Result.instance.status).toBe("in_progress");
    expect(c1Result.instance.nextCellId).toBe(c2.cell.id);

    // Re-running the satisfied c1 while c2 is unsatisfied is out of order.
    await expect(
      handler.handleRunCell({ notebookId, cellId: c1.cell.id, instanceId }),
    ).rejects.toMatchObject({ expectedNextCellId: c2.cell.id });

    // c2 is an expectation-satisfied predicted failure on this path too.
    const c2Result = await handler.handleRunCell({
      notebookId,
      cellId: c2.cell.id,
      instanceId,
    });
    expect(c2Result.success).toBe(true);
    expect(c2Result.execution.success).toBe(false);
    expect(c2Result.instance.satisfied).toBe(true);
    expect(c2Result.instance.expectations[0]).toMatchObject({ result: "pass" });
    expect(c2Result.instance.status).toBe("completed");
    expect(c2Result.instance.nextCellId).toBeNull();

    // A fully satisfied instance allows re-execution; it appends a new seq.
    const again = await handler.handleRunCell({
      notebookId,
      cellId: c1.cell.id,
      instanceId,
    });
    expect(again.instance.seq).toBe(4);
    const executions = await storage.listCellExecutions(instanceId);
    expect(executions.map((record) => record.seq)).toEqual([1, 2, 3, 4]);
  }, 240_000);

  it("rejects execution when the live notebook drifted from the pinned template", async () => {
    const storage = new InMemoryRunbookStorage(createRunbookMemoryState());
    const handler = await newHandler(storage);
    const notebookId = await createRunbook(handler, `Drifted ${randomUUID()}`);
    const c1 = await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "c1.js",
      content: 'console.log("v1");',
    });

    const notebook = handler.getNotebook(notebookId)!;
    const cells = templateCellsFromNotebook(notebook);
    await storage.saveTemplate({
      templateId: notebookId,
      version: 1,
      cells,
      cellsHash: hashTemplateCells(cells),
      createdBy: "tester",
      createdAt: new Date().toISOString(),
    });
    const instanceId = `rbi-${randomUUID()}`;
    await storage.createInstance({
      instanceId,
      templateId: notebookId,
      templateVersion: 1,
      createdBy: "tester",
      createdAt: new Date().toISOString(),
    });

    await handler.handleUpdateCell({
      notebookId,
      cellId: c1.cell.id,
      content: 'console.log("v2 — drifted");',
    });

    await expect(
      handler.handleRunCell({ notebookId, cellId: c1.cell.id, instanceId }),
    ).rejects.toThrow(/drifted/);
  }, 120_000);
});

// =============================================================================
// Gate seam residuals (PR #402): startedAt provenance, pre-execution ordering
// assertion, explicit max seq derivation
// =============================================================================

function gateEvidence(cellId: string, startedAt?: string): CellExecutionEvidence {
  return {
    cellId,
    cellType: "code",
    filename: `${cellId}.js`,
    status: "completed",
    exitCode: 0,
    output: "ok",
    error: "",
    ...(startedAt !== undefined ? { startedAt } : {}),
  };
}

const GATE_TEMPLATE_CELLS: RunbookTemplateCell[] = [
  templateCell("a"),
  templateCell("b"),
];

describe("Per-cell gate timing and seq derivation (PR #402 residuals)", () => {
  it("persists the executor-captured startedAt, not the gate call time", async () => {
    const storage = new InMemoryRunbookStorage(createRunbookMemoryState());
    const startedAts = ["2026-06-12T00:00:00.000Z", "2026-06-12T00:00:01.000Z"];
    const runtime = new InMemoryNotebookEngineRuntime(
      async (_notebookId, gate) => {
        const out: CellExecutionEvidence[] = [];
        for (const [index, cellId] of ["a", "b"].entries()) {
          gate?.assertExecutable(cellId);
          const cell = gateEvidence(cellId, startedAts[index]);
          out.push(cell);
          if (gate) await gate.record(cell);
        }
        return out;
      },
      undefined,
      {
        storage,
        templateCellSource: () => GATE_TEMPLATE_CELLS,
        agentId: "tester",
      },
    );

    const result = await Effect.runPromise(
      runtime.startRun({ notebookId: "nb_started_at", mode: "runbook" }),
    );
    expect(result.run.status).toBe("completed");
    const records = await storage.listCellExecutions(result.run.runId);
    expect(records.map((record) => record.startedAt)).toEqual(startedAts);
  });

  it("rejects an out-of-order cell BEFORE it executes; earlier records survive", async () => {
    const storage = new InMemoryRunbookStorage(createRunbookMemoryState());
    let executedAfterRejection = false;
    const runtime = new InMemoryNotebookEngineRuntime(
      async (_notebookId, gate) => {
        gate!.assertExecutable("a");
        const a = gateEvidence("a");
        await gate!.record(a);
        // Misbehaving executor: re-runs "a" while "b" is still unsatisfied.
        gate!.assertExecutable("a");
        executedAfterRejection = true;
        return [a];
      },
      undefined,
      {
        storage,
        templateCellSource: () => GATE_TEMPLATE_CELLS,
        agentId: "tester",
      },
    );

    await expect(
      Effect.runPromise(runtime.startRun({ notebookId: "nb_pre_exec", mode: "runbook" })),
    ).rejects.toThrow();
    // The rejection fired pre-execution: the out-of-order cell never ran.
    expect(executedAfterRejection).toBe(false);
    const failedRun = runtime.listRuns("nb_pre_exec")[0]!;
    expect(failedRun).toMatchObject({
      status: "failed",
      error: expect.stringContaining("out-of-order"),
    });
    // And the rejection dropped no durable record: cell a's record, written
    // by the gate before the violation, survived.
    const records = await storage.listCellExecutions(failedRun.runId);
    expect(records).toHaveLength(1);
    expect(records[0]!.cellId).toBe("a");
  });

  it("re-execution seq increments from the max recorded seq, not storage order", async () => {
    const storage = new InMemoryRunbookStorage(createRunbookMemoryState());
    await storage.saveTemplate(TEMPLATE);
    await storage.createInstance({
      instanceId: "rbi-ordering",
      templateId: TEMPLATE.templateId,
      templateVersion: TEMPLATE.version,
      createdBy: "tester",
      createdAt: "2026-06-12T00:00:00.000Z",
    });
    // Out-of-order history: b failed at seq 2 and was re-run at seq 3.
    await storage.appendCellExecution(execution("a", 1, "completed"));
    await storage.appendCellExecution(execution("b", 2, "failed"));
    await storage.appendCellExecution(execution("b", 3, "completed"));
    await storage.appendCellExecution(execution("c", 4, "completed"));
    // Adversarial backend: returns records in DESCENDING seq order, so a
    // last-element read would derive seq 2 and collide with the existing
    // append — the runtime must take the explicit max instead.
    const list = storage.listCellExecutions.bind(storage);
    storage.listCellExecutions = async (instanceId) =>
      (await list(instanceId)).reverse();

    const runtime = new InMemoryNotebookEngineRuntime(async () => [], undefined, {
      storage,
      agentId: "tester",
    });
    const result = await runtime.executeInstanceCell({
      instanceId: "rbi-ordering",
      // The instance is fully satisfied, so re-executing any cell is allowed.
      cellId: "a",
      executeCell: async () => ({
        status: "completed",
        exitCode: 0,
        stdout: "ok",
        stderr: "",
      }),
    });

    expect(result.seq).toBe(5);
    const persisted = await list("rbi-ordering");
    expect(persisted.map((record) => record.seq)).toEqual([1, 2, 3, 4, 5]);
  });
});
