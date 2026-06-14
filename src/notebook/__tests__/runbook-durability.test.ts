/**
 * Durable runbook round-trip through the engine runtime
 * (SPEC-AGX-SUBSTRATE B4b — claim c3 instance half + claim c7).
 *
 * Drives a real notebook execution through NotebookHandler with an injected
 * RunbookStorage, then "restarts" the storage (a new instance of the class
 * over the same substrate) and verifies the durable record alone carries:
 * the versioned template (contract hash re-verifies), the instance pinning
 * the template version, the append-only cell executions with their
 * per-expectation results, and correct fitness ledger aggregates.
 *
 * Runs against InMemoryRunbookStorage (shared state) always, and against
 * SupabaseRunbookStorage when the local stack is up.
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
import { verifyTemplateContracts, type RunbookStorage } from "../runbook/types.js";
import { deriveInstanceStatus } from "../runbook/ordering.js";
import {
  ensureTestWorkspace,
  isSupabaseAvailable,
  SUPABASE_TEST_URL,
  SUPABASE_TEST_SERVICE_ROLE_KEY,
  TEST_WORKSPACE_ID,
} from "../../__tests__/supabase-test-helpers.js";

const WRITE_OUTPUT_SOURCE =
  `import { writeFileSync } from "node:fs";\n` +
  `writeFileSync(process.env.TB_OUTPUT_PATH, JSON.stringify({ count: 3 }));\n` +
  `console.log("step ran");`;

/**
 * Execute a contracted runbook through the handler and return what the
 * durable layer must reconstruct later.
 */
async function executeContractedRunbook(storage: RunbookStorage) {
  const handler = new NotebookHandler(undefined, {
    runbookStorage: storage,
    agentId: "agent-session-1",
  });
  await handler.init();

  const created = await handler.handleCreateNotebook({
    title: `Durable runbook ${randomUUID()}`,
    language: "javascript",
  });
  const notebookId = created.notebook.id as string;
  const added = await handler.handleAddCell({
    notebookId,
    cellType: "code",
    filename: "step.js",
    content: WRITE_OUTPUT_SOURCE,
    contract: {
      schemaVersion: "outcome-contract.v0",
      expectations: [
        { source: { kind: "exitCode" }, op: "eq", value: 0 },
        { source: { kind: "output", pointer: "/count" }, op: "gte", value: 3 },
      ],
    },
  });

  const runResult = await handler.handleStartRun({
    notebookId,
    mode: "runbook",
    inputs: { reason: "durability round-trip" },
  });
  expect(runResult.run.status).toBe("completed");
  expect(runResult.run.outputs[0].pass).toBe(true);

  return {
    notebookId,
    runId: runResult.run.runId as string,
    contractHash: added.cell.contractHash as string,
  };
}

/** Verify the durable record from a RESTARTED storage instance alone. */
async function verifyDurableRecord(
  restarted: RunbookStorage,
  expected: { notebookId: string; runId: string; contractHash: string },
): Promise<void> {
  const instance = await restarted.getInstance(expected.runId);
  expect(instance).not.toBeNull();
  expect(instance!.templateId).toBe(expected.notebookId);
  expect(instance!.templateVersion).toBe(1);
  expect(instance!.createdBy).toBe("agent-session-1");

  // Template intact, contract survives persistence, hash re-verifies.
  const template = await restarted.getTemplate(
    instance!.templateId,
    instance!.templateVersion,
  );
  expect(template).not.toBeNull();
  expect(() => verifyTemplateContracts(template!)).not.toThrow();
  const contracted = template!.cells.find((cell) => cell.contract !== undefined)!;
  expect(contracted.contract!.contractHash).toBe(expected.contractHash);
  expect(contracted.source).toContain("TB_OUTPUT_PATH");

  // Executions intact: package.json install + contracted step, in order,
  // with the per-expectation records (tier/expected/actual) attached.
  const executions = await restarted.listCellExecutions(expected.runId);
  expect(executions).toHaveLength(2);
  expect(executions.map((record) => record.seq)).toEqual([1, 2]);
  expect(executions.every((record) => record.agentId === "agent-session-1")).toBe(true);
  const step = executions.find((record) => record.cellId === contracted.cellId)!;
  expect(step.status).toBe("completed");
  expect(step.expectations).toHaveLength(2);
  expect(step.expectations.every((record) => record.result === "pass")).toBe(true);
  expect(step.expectations.every((record) => record.tier === 1)).toBe(true);
  expect(step.expectations.map((record) => record.actual)).toEqual([0, 3]);
  expect(deriveInstanceStatus(template!, executions)).toBe("completed");

  // Ledger aggregates correct: 2 machine-checked passes, no errors.
  const aggregate = await restarted.getFitnessAggregate(
    instance!.templateId,
    instance!.templateVersion,
  );
  expect(aggregate.instances).toBe(1);
  expect(aggregate.evaluated).toBe(2);
  expect(aggregate.passed).toBe(2);
  expect(aggregate.passRate).toBe(1);
  expect(aggregate.errorRows).toBe(0);
  expect(aggregate.errorRate).toBe(0);
  expect(aggregate.distinctAgents).toBe(1);
}

describe("Durable runbook round-trip — InMemory storage (shared state restart)", () => {
  it("reconstructs template, instance, executions, and ledger after restart", async () => {
    const state = createRunbookMemoryState();
    const expected = await executeContractedRunbook(new InMemoryRunbookStorage(state));
    // Restart: new instance of the class over the same durable substrate.
    await verifyDurableRecord(new InMemoryRunbookStorage(state), expected);
  }, 120_000);

  it("appends a new template version when cells change, and a new instance per run", async () => {
    const state = createRunbookMemoryState();
    const storage = new InMemoryRunbookStorage(state);
    const handler = new NotebookHandler(undefined, {
      runbookStorage: storage,
      agentId: "agent-session-1",
    });
    await handler.init();

    const created = await handler.handleCreateNotebook({
      title: "Versioned runbook",
      language: "javascript",
    });
    const notebookId = created.notebook.id as string;
    await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "step.js",
      content: 'console.log("v1");',
    });

    const run1 = await handler.handleStartRun({ notebookId, mode: "runbook" });
    // Same cells: second run reuses template v1 with a fresh instance.
    const run2 = await handler.handleStartRun({ notebookId, mode: "runbook" });
    // Changed cells: third run appends template v2.
    await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "step2.js",
      content: 'console.log("v2");',
    });
    const run3 = await handler.handleStartRun({ notebookId, mode: "runbook" });

    expect(await storage.listTemplateVersions(notebookId)).toEqual([1, 2]);
    expect((await storage.getInstance(run1.run.runId))!.templateVersion).toBe(1);
    expect((await storage.getInstance(run2.run.runId))!.templateVersion).toBe(1);
    expect((await storage.getInstance(run3.run.runId))!.templateVersion).toBe(2);
    expect(await storage.listInstances(notebookId)).toHaveLength(3);
  }, 180_000);

  it("rejects a post-attach tampered contract before persisting a template version or instance", async () => {
    const state = createRunbookMemoryState();
    const storage = new InMemoryRunbookStorage(state);
    const handler = new NotebookHandler(undefined, {
      runbookStorage: storage,
      agentId: "agent-session-1",
    });
    await handler.init();

    const created = await handler.handleCreateNotebook({
      title: "Tampered durable runbook",
      language: "javascript",
    });
    const notebookId = created.notebook.id as string;
    const added = await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "step.js",
      content: 'console.log("ok");',
      contract: {
        schemaVersion: "outcome-contract.v0",
        expectations: [{ source: { kind: "exitCode" }, op: "eq", value: 0 }],
      },
    });

    // Tamper the stored contract without recompiling its hash.
    const notebook = handler.getNotebook(notebookId)!;
    const cell = notebook.cells.find((c) => c.id === added.cell.id)!;
    if (cell.type !== "code" || cell.contract === undefined) throw new Error("setup broke");
    (cell.contract.contract.expectations[0] as { value: unknown }).value = 1;

    await expect(
      handler.handleStartRun({ notebookId, mode: "runbook" }),
    ).rejects.toThrow();

    const listed = await handler.handleListRuns({ notebookId });
    const failed = listed.runs[0] as { status: string; error: string };
    expect(failed.status).toBe("failed");
    expect(failed.error).toContain("hash mismatch");

    // Verification gates beginDurableRun: durable storage stays clean — no
    // template version, no instance (Codex PR #402, P2).
    expect(await storage.listTemplateVersions(notebookId)).toEqual([]);
    expect(await storage.listInstances(notebookId)).toEqual([]);
  });
});

describe("Durable runbook round-trip — Supabase storage (local stack)", () => {
  let available = false;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
    if (!available) return;
    await ensureTestWorkspace();
  });

  it("reconstructs template, instance, executions, and ledger after restart", async ({
    skip,
  }) => {
    if (!available) skip();
    const config = {
      supabaseUrl: SUPABASE_TEST_URL,
      serviceRoleKey: SUPABASE_TEST_SERVICE_ROLE_KEY,
      tenantWorkspaceId: TEST_WORKSPACE_ID,
    };
    const expected = await executeContractedRunbook(new SupabaseRunbookStorage(config));
    // Restart: a brand-new client over the same Postgres substrate.
    await verifyDurableRecord(new SupabaseRunbookStorage(config), expected);
  }, 120_000);
});

describe("Durable persistence failures fail the run", () => {
  it("marks the run failed when the storage port rejects — never silent", async () => {
    const evidence: CellExecutionEvidence[] = [
      {
        cellId: "step",
        cellType: "code",
        filename: "step.js",
        status: "completed",
        exitCode: 0,
        output: "ok",
        error: "",
      },
    ];
    const broken = new InMemoryRunbookStorage();
    broken.createInstance = async () => {
      throw new Error("substrate offline");
    };
    const runtime = new InMemoryNotebookEngineRuntime(async () => evidence, undefined, {
      storage: broken,
    });

    await expect(
      Effect.runPromise(runtime.startRun({ notebookId: "nb_offline", mode: "runbook" })),
    ).rejects.toThrow();

    const runs = runtime.listRuns("nb_offline");
    expect(runs).toHaveLength(1);
    const failed = runs[0] as Extract<(typeof runs)[number], { _tag: "FailedRun" }>;
    expect(failed.status).toBe("failed");
    expect(failed.error).toContain("durable runbook persistence failed");
    expect(failed.error).toContain("substrate offline");
  });
});
