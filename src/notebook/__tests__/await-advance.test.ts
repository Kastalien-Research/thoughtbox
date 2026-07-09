/**
 * Await-cell ↔ claim binding and the pull-based advancer
 * (SPEC-AGX-SUBSTRATE B6 + B8 — claim c4; GH #403 double-execute guard).
 *
 * Proves the four done-criteria:
 * (a) a runbook instance with an await cell HALTS at it (parked, not
 *     failed) — both on the advance path and on a real batch run;
 * (b) once the subscribed claim reaches a satisfying status, the next
 *     tb.runbook.advance records the await satisfaction and executes the
 *     cells behind it;
 * (c) two CONCURRENT advances of the same instance execute the next exec
 *     cell's side effects EXACTLY ONCE — the CAS reservation on
 *     (instanceId, seq) decides the winner BEFORE any side effect runs;
 * (d) the reservation CAS holds on both backends: InMemoryRunbookStorage
 *     (synchronous check-and-set) and SupabaseRunbookStorage (primary-key
 *     conditional insert), the latter skipping gracefully when the local
 *     stack is down.
 *
 * The claim read/subscribe path runs through the REAL adapter
 * (createRunbookClaimBinding over InMemoryClaimStorage), so the B6
 * subscription contract ("runbook:<instanceId>/<cellId>") is exercised
 * end-to-end, not stubbed.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID } from "node:crypto";
import { NotebookHandler } from "../index.js";
import { InMemoryNotebookEngineRuntime } from "../engine/runtime.js";
import { InMemoryRunbookStorage } from "../runbook/in-memory-runbook-storage.js";
import { SupabaseRunbookStorage } from "../runbook/supabase-runbook-storage.js";
import {
  AdvanceReservationConflictError,
  hashTemplateCells,
  type AdvanceReservation,
  type CellExecutionRecord,
  type FitnessAggregate,
  type FitnessLedgerRow,
  type RunbookInstance,
  type RunbookStorage,
  type RunbookTemplate,
  type RunbookTemplateCell,
} from "../runbook/types.js";
import { awaitCellSubscriber } from "../runbook/await.js";
import { InMemoryClaimStorage } from "../../claims/in-memory-claim-storage.js";
import { createRunbookClaimBinding } from "../../claims/runbook-binding.js";
import type { Claim, ClaimStatus } from "../../claims/types.js";
import {
  ensureTestWorkspace,
  isSupabaseAvailable,
  SUPABASE_TEST_URL,
  SUPABASE_TEST_SERVICE_ROLE_KEY,
  TEST_WORKSPACE_ID,
} from "../../__tests__/supabase-test-helpers.js";

// =============================================================================
// Helpers
// =============================================================================

const AGENT = "agent-await";

function makeClaim(id: string, status: ClaimStatus = "asserted"): Claim {
  const now = new Date().toISOString();
  return {
    id,
    workspaceId: "ws-await",
    type: "outcome",
    statement: "the deploy is green",
    status,
    evidenceRefs: [],
    createdBy: AGENT,
    createdAt: now,
    updatedAt: now,
    statusChangedAt: now,
  };
}

async function setClaimStatus(
  claims: InMemoryClaimStorage,
  claimId: string,
  status: ClaimStatus,
): Promise<void> {
  const claim = (await claims.getClaim(claimId))!;
  claim.status = status;
  claim.statusChangedAt = new Date().toISOString();
  await claims.saveClaim(claim);
}

function execCell(cellId: string): RunbookTemplateCell {
  return { cellId, cellType: "code", filename: `${cellId}.js`, source: "" };
}

function awaitCell(
  cellId: string,
  claimId: string,
  until: Array<"asserted" | "supported" | "invalidated" | "superseded"> = ["supported"],
): RunbookTemplateCell {
  return { cellId, cellType: "await", filename: "", source: "", awaitClaim: { claimId, until } };
}

async function seedInstance(
  storage: RunbookStorage,
  cells: RunbookTemplateCell[],
): Promise<{ template: RunbookTemplate; instance: RunbookInstance }> {
  const template: RunbookTemplate = {
    templateId: `rbt-${randomUUID()}`,
    version: 1,
    cells,
    cellsHash: hashTemplateCells(cells),
    createdBy: AGENT,
    createdAt: new Date().toISOString(),
  };
  await storage.saveTemplate(template);
  const instance: RunbookInstance = {
    instanceId: `rbi-${randomUUID()}`,
    templateId: template.templateId,
    templateVersion: template.version,
    createdBy: AGENT,
    createdAt: new Date().toISOString(),
  };
  await storage.createInstance(instance);
  return { template, instance };
}

interface RuntimeSetup {
  storage: RunbookStorage;
  claims: InMemoryClaimStorage;
  runtime: InMemoryNotebookEngineRuntime;
}

function makeRuntime(
  storage: RunbookStorage = new InMemoryRunbookStorage(),
  claims: InMemoryClaimStorage = new InMemoryClaimStorage(),
  agentId: string = AGENT,
): RuntimeSetup {
  const runtime = new InMemoryNotebookEngineRuntime(async () => [], undefined, {
    storage,
    claimBinding: createRunbookClaimBinding(claims),
    agentId,
  });
  return { storage, claims, runtime };
}

/** Stub executor recording every side effect (which cells actually ran). */
function makeExecutor(executed: string[], opts?: { failCells?: string[]; delayMs?: number }) {
  return async (cellId: string) => {
    executed.push(cellId);
    if (opts?.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, opts.delayMs));
    }
    const failed = opts?.failCells?.includes(cellId) ?? false;
    return {
      status: failed ? ("failed" as const) : ("completed" as const),
      exitCode: failed ? 1 : 0,
      stdout: failed ? "" : `${cellId} ok`,
      stderr: failed ? `${cellId} boom` : "",
    };
  };
}

// =============================================================================
// (a) + (b): await parks the instance; claim satisfaction lets advance resume
// =============================================================================

describe("B6 await ↔ claim binding via tb.runbook.advance (InMemory)", () => {
  it("executes up to the await, parks, subscribes; advance is idempotent while unsatisfied", async () => {
    const { storage, claims, runtime } = makeRuntime();
    const claimId = `clm-${randomUUID()}`;
    await claims.saveClaim(makeClaim(claimId, "asserted"));
    const { instance } = await seedInstance(storage, [
      execCell("step1"),
      awaitCell("wait1", claimId, ["supported"]),
      execCell("step2"),
    ]);

    const executed: string[] = [];
    const first = await runtime.advanceInstance({
      instanceId: instance.instanceId,
      executeCell: makeExecutor(executed),
    });

    // (a) halted AT the await: step1 ran, step2 did not, instance parked.
    expect(executed).toEqual(["step1"]);
    expect(first.outcome).toBe("parked");
    expect(first.instanceStatus).toBe("in_progress");
    expect(first.nextCellId).toBe("wait1");
    expect(first.awaiting).toMatchObject({
      cellId: "wait1",
      claimId,
      currentStatus: "asserted",
      subscriber: awaitCellSubscriber(instance.instanceId, "wait1"),
    });
    // No execution record for the unsatisfied await (parked ≠ failed).
    const records = await storage.listCellExecutions(instance.instanceId);
    expect(records.map((r) => r.cellId)).toEqual(["step1"]);

    // B6 binding: the parked cell durably subscribes to the claim.
    const subscriptions = await claims.listSubscriptions(claimId);
    expect(subscriptions.map((s) => s.subscriber)).toEqual([
      awaitCellSubscriber(instance.instanceId, "wait1"),
    ]);

    // Idempotent while unsatisfied: nothing re-executes, still parked.
    const second = await runtime.advanceInstance({
      instanceId: instance.instanceId,
      executeCell: makeExecutor(executed),
    });
    expect(second.outcome).toBe("parked");
    expect(executed).toEqual(["step1"]);
  });

  it("(b) asserting the subscribed claim makes the next advance execute the cells behind the await", async () => {
    const { storage, claims, runtime } = makeRuntime();
    const claimId = `clm-${randomUUID()}`;
    await claims.saveClaim(makeClaim(claimId, "asserted"));
    const { instance } = await seedInstance(storage, [
      execCell("step1"),
      awaitCell("wait1", claimId, ["supported"]),
      execCell("step2"),
    ]);

    const executed: string[] = [];
    await runtime.advanceInstance({
      instanceId: instance.instanceId,
      executeCell: makeExecutor(executed),
    });
    expect(executed).toEqual(["step1"]);

    await setClaimStatus(claims, claimId, "supported");

    const resumed = await runtime.advanceInstance({
      instanceId: instance.instanceId,
      executeCell: makeExecutor(executed),
    });
    expect(resumed.outcome).toBe("completed");
    expect(resumed.instanceStatus).toBe("completed");
    expect(resumed.nextCellId).toBeNull();
    expect(executed).toEqual(["step1", "step2"]);

    // The await satisfaction is a durable append-only record with a pass
    // expectation documenting the observed claim status.
    const records = await storage.listCellExecutions(instance.instanceId);
    expect(records.map((r) => [r.seq, r.cellId, r.status])).toEqual([
      [1, "step1", "completed"],
      [2, "wait1", "completed"],
      [3, "step2", "completed"],
    ]);
    const waitRecord = records.find((r) => r.cellId === "wait1")!;
    expect(waitRecord.expectations).toHaveLength(1);
    expect(waitRecord.expectations[0]).toMatchObject({
      result: "pass",
      actual: "supported",
    });

    // Await evaluations never write fitness-ledger rows (coordination, not
    // hypothesis — spec §7 scopes fitness to exec/assert cells).
    const rows = await storage.listFitnessRows(instance.templateId, 1);
    expect(rows.filter((row: FitnessLedgerRow) => row.cellId === "wait1")).toEqual([]);
  });

  it("parks (with reason, without subscription) when the awaited claim does not exist", async () => {
    const { storage, claims, runtime } = makeRuntime();
    const missingClaimId = `clm-missing-${randomUUID()}`;
    const { instance } = await seedInstance(storage, [
      awaitCell("wait1", missingClaimId),
    ]);

    const result = await runtime.advanceInstance({ instanceId: instance.instanceId });
    expect(result.outcome).toBe("parked");
    expect(result.awaiting).toMatchObject({
      claimId: missingClaimId,
      currentStatus: null,
      reason: `claim ${missingClaimId} not found`,
    });
    expect(await claims.listSubscriptions(missingClaimId)).toEqual([]);
    expect(result.instanceStatus).toBe("created");
  });

  it("parks with a clear reason when no claim binding is wired", async () => {
    const storage = new InMemoryRunbookStorage();
    const runtime = new InMemoryNotebookEngineRuntime(async () => [], undefined, {
      storage,
      agentId: AGENT,
    });
    const { instance } = await seedInstance(storage, [awaitCell("wait1", "clm-any")]);

    const result = await runtime.advanceInstance({ instanceId: instance.instanceId });
    expect(result.outcome).toBe("parked");
    expect(result.awaiting?.reason).toMatch(/claim binding unavailable/);
  });

  it("rejects direct single-cell execution of an await cell, naming tb.runbook.advance", async () => {
    const { storage, claims, runtime } = makeRuntime();
    const claimId = `clm-${randomUUID()}`;
    await claims.saveClaim(makeClaim(claimId, "supported"));
    const { instance } = await seedInstance(storage, [awaitCell("wait1", claimId)]);

    await expect(
      runtime.executeInstanceCell({
        instanceId: instance.instanceId,
        cellId: "wait1",
        executeCell: makeExecutor([]),
      }),
    ).rejects.toThrow(/await cells execute nothing.*tb\.runbook\.advance/s);
  });

  it("halts (instance failed) when an exec cell behind the await fails procedurally", async () => {
    const { storage, claims, runtime } = makeRuntime();
    const claimId = `clm-${randomUUID()}`;
    await claims.saveClaim(makeClaim(claimId, "supported"));
    const { instance } = await seedInstance(storage, [
      awaitCell("wait1", claimId),
      execCell("boom"),
    ]);

    const executed: string[] = [];
    const result = await runtime.advanceInstance({
      instanceId: instance.instanceId,
      executeCell: makeExecutor(executed, { failCells: ["boom"] }),
    });
    expect(executed).toEqual(["boom"]);
    expect(result.outcome).toBe("halted");
    expect(result.instanceStatus).toBe("failed");
  });

  it("stops after maxCells exec executions with outcome 'advanced'", async () => {
    const { storage, runtime } = makeRuntime();
    const { instance } = await seedInstance(storage, [
      execCell("s1"),
      execCell("s2"),
      execCell("s3"),
    ]);
    const executed: string[] = [];
    const result = await runtime.advanceInstance({
      instanceId: instance.instanceId,
      executeCell: makeExecutor(executed),
      maxCells: 2,
    });
    expect(result.outcome).toBe("advanced");
    expect(executed).toEqual(["s1", "s2"]);
    expect(result.nextCellId).toBe("s3");
  });

  it("throws a load-the-notebook error when an exec cell is reached without an executor", async () => {
    const { storage, runtime } = makeRuntime();
    const { instance } = await seedInstance(storage, [execCell("s1")]);
    await expect(
      runtime.advanceInstance({ instanceId: instance.instanceId }),
    ).rejects.toThrow(/no executor is available.*load the notebook/s);
  });
});

// =============================================================================
// (c): GH #403 — concurrent advance executes side effects exactly once
// =============================================================================

/** Two-party barrier: both advancers must read the same (empty) execution
 * snapshot before either reaches the CAS. */
function makeBarrier(parties: number): { arrive(): Promise<void> } {
  let arrived = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  return {
    async arrive() {
      arrived += 1;
      if (arrived >= parties) release();
      await gate;
    },
  };
}

/**
 * Storage wrapper that holds the FIRST `listCellExecutions` call of this
 * advancer at a shared barrier — forcing the classic #403 interleaving:
 * both advancers read max(seq)=0, both compute seq 1, both want to run the
 * same cell. Only the CAS decides who executes.
 */
class BarrierStorage implements RunbookStorage {
  private held = false;
  constructor(
    private readonly inner: RunbookStorage,
    private readonly barrier: { arrive(): Promise<void> },
  ) {}

  async listCellExecutions(instanceId: string): Promise<CellExecutionRecord[]> {
    const snapshot = await this.inner.listCellExecutions(instanceId);
    if (!this.held) {
      this.held = true;
      await this.barrier.arrive();
    }
    return snapshot;
  }

  // Pure delegation below.
  saveTemplate(t: RunbookTemplate) { return this.inner.saveTemplate(t); }
  getTemplate(id: string, v: number) { return this.inner.getTemplate(id, v); }
  getLatestTemplate(id: string) { return this.inner.getLatestTemplate(id); }
  listTemplateVersions(id: string) { return this.inner.listTemplateVersions(id); }
  createInstance(i: RunbookInstance) { return this.inner.createInstance(i); }
  getInstance(id: string) { return this.inner.getInstance(id); }
  listInstances(id: string) { return this.inner.listInstances(id); }
  appendCellExecution(r: CellExecutionRecord) { return this.inner.appendCellExecution(r); }
  reserveAdvance(r: AdvanceReservation) { return this.inner.reserveAdvance(r); }
  listAdvanceReservations(id: string) { return this.inner.listAdvanceReservations(id); }
  appendFitnessRows(rows: FitnessLedgerRow[]) { return this.inner.appendFitnessRows(rows); }
  listFitnessRows(id: string, v?: number) { return this.inner.listFitnessRows(id, v); }
  getFitnessAggregate(id: string, v: number): Promise<FitnessAggregate> {
    return this.inner.getFitnessAggregate(id, v);
  }
}

/**
 * Race two advancers (each its own runtime + storage handle, simulating two
 * replicas) over the same single-exec-cell instance. Returns the number of
 * side-effect executions plus both outcomes.
 */
async function raceTwoAdvancers(
  baseStorage: RunbookStorage,
  makeStorageHandle: () => RunbookStorage,
): Promise<{ sideEffects: number; outcomes: string[] }> {
  const { instance } = await seedInstance(baseStorage, [execCell("only")]);
  let sideEffects = 0;
  const executor = async (_cellId: string) => {
    sideEffects += 1;
    // Linger so a broken implementation (no CAS) would overlap executions.
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { status: "completed" as const, exitCode: 0, stdout: "ok", stderr: "" };
  };

  const barrier = makeBarrier(2);
  const advancers = ["adv-A", "adv-B"].map((agentId) => {
    const runtime = new InMemoryNotebookEngineRuntime(async () => [], undefined, {
      storage: new BarrierStorage(makeStorageHandle(), barrier),
      agentId,
    });
    return runtime.advanceInstance({
      instanceId: instance.instanceId,
      executeCell: executor,
    });
  });

  const results = await Promise.all(advancers);
  return { sideEffects, outcomes: results.map((r) => r.outcome).sort() };
}

describe("GH #403 double-execute guard — concurrent advance (InMemory)", () => {
  it("two concurrent advances execute the cell's side effects exactly once", async () => {
    const shared = new InMemoryRunbookStorage();
    const { sideEffects, outcomes } = await raceTwoAdvancers(shared, () => shared);
    expect(sideEffects).toBe(1);
    // Exactly one advancer completed the instance; the loser observed the
    // held step and backed off WITHOUT side effects.
    expect(outcomes).toEqual(["completed", "in_flight"]);
  });

  it("a reservation with no execution record reports in_flight; force skips past it", async () => {
    const storage = new InMemoryRunbookStorage();
    const runtime = makeRuntime(storage).runtime;
    const { instance } = await seedInstance(storage, [execCell("only")]);

    // Simulate a crashed advancer: reservation claimed, no record appended.
    await storage.reserveAdvance({
      instanceId: instance.instanceId,
      seq: 1,
      cellId: "only",
      agentId: "adv-dead",
      reservedAt: new Date().toISOString(),
    });

    const executed: string[] = [];
    const stuck = await runtime.advanceInstance({
      instanceId: instance.instanceId,
      executeCell: makeExecutor(executed),
    });
    expect(stuck.outcome).toBe("in_flight");
    expect(stuck.inFlight).toMatchObject({ cellId: "only", seq: 1, agentId: "adv-dead" });
    expect(executed).toEqual([]);

    // Explicit force: reserves the NEXT seq and executes (documented
    // double-execute acceptance when the holder is actually still alive).
    const forced = await runtime.advanceInstance({
      instanceId: instance.instanceId,
      executeCell: makeExecutor(executed),
      force: true,
    });
    expect(forced.outcome).toBe("completed");
    expect(executed).toEqual(["only"]);
    const records = await storage.listCellExecutions(instance.instanceId);
    expect(records.map((r) => r.seq)).toEqual([2]);
  });

  it("concurrent satisfied-await advances record the satisfaction exactly once (benign race)", async () => {
    const shared = new InMemoryRunbookStorage();
    const claims = new InMemoryClaimStorage();
    const claimId = `clm-${randomUUID()}`;
    await claims.saveClaim(makeClaim(claimId, "supported"));
    const { instance } = await seedInstance(shared, [awaitCell("wait1", claimId)]);

    const barrier = makeBarrier(2);
    const results = await Promise.all(
      ["adv-A", "adv-B"].map((agentId) =>
        new InMemoryNotebookEngineRuntime(async () => [], undefined, {
          storage: new BarrierStorage(shared, barrier),
          claimBinding: createRunbookClaimBinding(claims),
          agentId,
        }).advanceInstance({ instanceId: instance.instanceId }),
      ),
    );
    // Both converge on completed; the append-only (instanceId, seq) key
    // deduped the satisfaction record.
    expect(results.map((r) => r.outcome)).toEqual(["completed", "completed"]);
    const records = await shared.listCellExecutions(instance.instanceId);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ cellId: "wait1", seq: 1, status: "completed" });
  });
});

// =============================================================================
// Reservation storage contract — both backends
// =============================================================================

function reservationContract(
  name: string,
  makeStorage: () => Promise<RunbookStorage | null>,
) {
  describe(`Advance-reservation CAS contract — ${name}`, () => {
    it("first reservation wins; duplicates throw the typed conflict; list is seq-ordered", async ({ skip }) => {
      const storage = await makeStorage();
      if (!storage) skip();
      const { instance } = await seedInstance(storage!, [execCell("s1"), execCell("s2")]);

      const reservation: AdvanceReservation = {
        instanceId: instance.instanceId,
        seq: 1,
        cellId: "s1",
        agentId: "adv-A",
        reservedAt: new Date().toISOString(),
      };
      await storage!.reserveAdvance(reservation);
      await expect(
        storage!.reserveAdvance({ ...reservation, agentId: "adv-B" }),
      ).rejects.toBeInstanceOf(AdvanceReservationConflictError);

      await storage!.reserveAdvance({ ...reservation, seq: 2, cellId: "s2" });
      const listed = await storage!.listAdvanceReservations(instance.instanceId);
      expect(listed.map((r) => [r.seq, r.cellId, r.agentId])).toEqual([
        [1, "s1", "adv-A"],
        [2, "s2", "adv-A"],
      ]);
    });

    it("rejects reservations for a missing instance", async ({ skip }) => {
      const storage = await makeStorage();
      if (!storage) skip();
      await expect(
        storage!.reserveAdvance({
          instanceId: `rbi-missing-${randomUUID()}`,
          seq: 1,
          cellId: "s1",
          agentId: "adv-A",
          reservedAt: new Date().toISOString(),
        }),
      ).rejects.toThrow(/not found/);
    });
  });
}

reservationContract("InMemory", async () => new InMemoryRunbookStorage());

let supabaseAvailable = false;
beforeAll(async () => {
  supabaseAvailable = await isSupabaseAvailable();
  if (supabaseAvailable) await ensureTestWorkspace();
});

function makeSupabaseStorage(): SupabaseRunbookStorage {
  return new SupabaseRunbookStorage({
    supabaseUrl: SUPABASE_TEST_URL,
    serviceRoleKey: SUPABASE_TEST_SERVICE_ROLE_KEY,
    tenantWorkspaceId: TEST_WORKSPACE_ID,
  });
}

reservationContract("Supabase (local stack)", async () =>
  supabaseAvailable ? makeSupabaseStorage() : null,
);

describe("GH #403 double-execute guard — concurrent advance (Supabase, local stack)", () => {
  it("two replica advancers execute side effects exactly once via the PK conditional insert", async ({ skip }) => {
    if (!supabaseAvailable) skip();
    // Each advancer gets its OWN SupabaseRunbookStorage (own client) — a
    // real two-replica shape; only Postgres arbitrates the reservation.
    const { sideEffects, outcomes } = await raceTwoAdvancers(
      makeSupabaseStorage(),
      () => makeSupabaseStorage(),
    );
    expect(sideEffects).toBe(1);
    expect(outcomes).toEqual(["completed", "in_flight"]);
  }, 60_000);
});

// =============================================================================
// (a)+(b) end-to-end on the REAL execution path: batch run parks at the
// await; tb.runbook.advance resumes it after the claim is satisfied.
// =============================================================================

describe("Batch run halts at await; advance resumes (real execution)", () => {
  it("notebook_start_run parks at the await; handleAdvance completes after claim satisfaction", async () => {
    const storage = new InMemoryRunbookStorage();
    const claims = new InMemoryClaimStorage();
    const claimId = `clm-${randomUUID()}`;
    await claims.saveClaim(makeClaim(claimId, "asserted"));

    const handler = new NotebookHandler(undefined, {
      runbookStorage: storage,
      agentId: AGENT,
      claimBinding: createRunbookClaimBinding(claims),
    });
    await handler.init();

    const created = await handler.handleCreateNotebook({
      title: `Await runbook ${randomUUID()}`,
      language: "javascript",
    });
    const notebookId = created.notebook.id as string;

    const before = await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "before.js",
      content: 'console.log("before await");',
    });
    const wait = await handler.handleAddCell({
      notebookId,
      cellType: "await",
      claimId,
      until: ["supported"],
    });
    expect(wait.cell).toMatchObject({ type: "await", claimId, until: ["supported"] });
    const after = await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "after.js",
      content: 'console.log("after await");',
    });

    // (a) The batch run HALTS at the await: verdict does not pass, the
    // trailing cell is skipped, and the instance derives in_progress.
    const runResult = await handler.handleStartRun({ notebookId, mode: "runbook" });
    expect(runResult.run.status).toBe("completed");
    const verdict = runResult.run.outputs[0];
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toMatch(/wait|claim|await/i);
    const evidence = verdict.evidence as Array<Record<string, unknown>>;
    const awaitEvidence = evidence.find((cell) => cell.cellId === wait.cell.id)!;
    expect(awaitEvidence.status).toBe("skipped");
    const afterEvidence = evidence.find((cell) => cell.cellId === after.cell.id)!;
    expect(afterEvidence.status).toBe("skipped");

    const instanceId = runResult.run.runId as string;
    const executions = await storage.listCellExecutions(instanceId);
    // pkg install + before.js executed; nothing recorded for the await.
    expect(executions.map((r) => r.cellId)).not.toContain(wait.cell.id);
    expect(executions.map((r) => r.cellId)).toContain(before.cell.id);

    // Parked cell subscribed to the claim (B6 binding).
    const subscriptions = await claims.listSubscriptions(claimId);
    expect(subscriptions.map((s) => s.subscriber)).toEqual([
      awaitCellSubscriber(instanceId, wait.cell.id as string),
    ]);

    // tb.runbook.status sees the parked instance and the awaited claim.
    const status = await handler.handleInstanceStatus({ instanceId });
    expect(status.instance.status).toBe("in_progress");
    expect(status.instance.nextCellId).toBe(wait.cell.id);
    expect(status.instance.awaiting).toMatchObject({ claimId });

    // Advance while unsatisfied: still parked, nothing new executed.
    const parked = await handler.handleAdvance({ instanceId });
    expect(parked.advance.outcome).toBe("parked");

    // (b) Satisfy the claim; the next advance records the await satisfaction
    // and executes after.js through the REAL subprocess path.
    await setClaimStatus(claims, claimId, "supported");
    const resumed = await handler.handleAdvance({ instanceId });
    expect(resumed.advance.outcome).toBe("completed");
    expect(resumed.advance.instanceStatus).toBe("completed");
    const kinds = resumed.advance.steps.map(
      (step: { cellId: string; kind: string }) => [step.cellId, step.kind],
    );
    expect(kinds).toEqual([
      [wait.cell.id, "await"],
      [after.cell.id, "exec"],
    ]);

    const finalStatus = await handler.handleInstanceStatus({ instanceId });
    expect(finalStatus.instance.status).toBe("completed");
    expect(finalStatus.instance.nextCellId).toBeNull();
  }, 180_000);
});
