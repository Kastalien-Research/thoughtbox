import { describe, expect, it } from "vitest";
import { NotebookHandler } from "../index.js";

const PASS_CELL = `
import { observed, pass, fail } from "./tb-validate.js";
const data = observed();
data.errors === 0 ? pass("clean", data) : fail("dirty", data);
`.trim();

const NO_VERDICT_CELL = `
console.log("I never write a verdict.");
`.trim();

const CRASH_CELL = `
throw new Error("validator blew up");
`.trim();

async function setup() {
  const handler = new NotebookHandler();
  await handler.init();
  const created = await handler.handleCreateNotebook({
    title: "validator-tests",
    language: "javascript",
  });
  return { handler, notebookId: created.notebook.id as string };
}

async function addCell(handler: NotebookHandler, notebookId: string, source: string, filename: string) {
  const r = await handler.handleAddCell({
    notebookId,
    cellType: "code",
    content: source,
    filename,
  });
  return r.cell.id as string;
}

describe("notebook ValidatorService", () => {
  it("returns pass=true when the cell writes a pass verdict", async () => {
    const { handler, notebookId } = await setup();
    const cellId = await addCell(handler, notebookId, PASS_CELL, "v.js");

    const out = await handler.handleValidate({
      notebookId,
      cellId,
      observed: { errors: 0 },
    });

    expect(out.pass).toBe(true);
    expect(out.reason).toBe("clean");
    expect(out.evidence).toEqual({ errors: 0 });
    expect(out.hashMatched).toBe(true);
    expect(out.snapshotHash).toMatch(/^[a-f0-9]{64}$/);
    expect(out.binding).toMatchObject({ notebookId, cellId });
  }, 30_000);

  it("returns pass=false when the cell writes a fail verdict", async () => {
    const { handler, notebookId } = await setup();
    const cellId = await addCell(handler, notebookId, PASS_CELL, "v.js");

    const out = await handler.handleValidate({
      notebookId,
      cellId,
      observed: { errors: 3 },
    });

    expect(out.pass).toBe(false);
    expect(out.reason).toBe("dirty");
    expect(out.evidence).toEqual({ errors: 3 });
    expect(out.hashMatched).toBe(true);
  }, 30_000);

  it("treats a missing verdict file as malformed_verdict (pass=false)", async () => {
    const { handler, notebookId } = await setup();
    const cellId = await addCell(handler, notebookId, NO_VERDICT_CELL, "noverdict.js");

    const out = await handler.handleValidate({
      notebookId,
      cellId,
      observed: { anything: true },
    });

    expect(out.pass).toBe(false);
    expect(out.reason).toBe("malformed_verdict");
    expect(out.hashMatched).toBe(true);
  }, 30_000);

  it("captures stderr and reports validator_crash when the cell crashes", async () => {
    const { handler, notebookId } = await setup();
    const cellId = await addCell(handler, notebookId, CRASH_CELL, "crash.js");

    const out = await handler.handleValidate({
      notebookId,
      cellId,
      observed: null,
    });

    expect(out.pass).toBe(false);
    expect(out.reason).toBe("validator_crash");
    expect(out.stderr).toContain("validator blew up");
    expect(out.exitCode).not.toBe(0);
  }, 30_000);

  it("refuses to run when expectedSnapshotHash mismatches", async () => {
    const { handler, notebookId } = await setup();
    const cellId = await addCell(handler, notebookId, PASS_CELL, "v.js");

    const out = await handler.handleValidate({
      notebookId,
      cellId,
      observed: { errors: 0 },
      expectedSnapshotHash:
        "0000000000000000000000000000000000000000000000000000000000000000",
    });

    expect(out.pass).toBe(false);
    expect(out.hashMatched).toBe(false);
    expect(out.reason).toBe("snapshot_hash_mismatch");
    // Cell never ran → no stdout/stderr produced.
    expect(out.stdout).toBe("");
    expect(out.stderr).toBe("");
  }, 30_000);

  it("produces a stable snapshot hash that detects post-bind cell edits", async () => {
    const { handler, notebookId } = await setup();
    const cellId = await addCell(handler, notebookId, PASS_CELL, "v.js");

    const service = handler.getValidatorService();
    const binding = await service.bind(notebookId, cellId);
    const originalHash = binding.snapshotHash;

    // First run: snapshot matches → pass
    const first = await service.run(binding, { errors: 0 }, {
      expectedSnapshotHash: originalHash,
    });
    expect(first.pass).toBe(true);

    // Mutate the cell after binding
    await handler.handleUpdateCell({
      notebookId,
      cellId,
      content: "import { pass } from './tb-validate.js'; pass('always');",
    });

    // The original frozen binding still produces the original verdict
    const second = await service.run(binding, { errors: 7 }, {
      expectedSnapshotHash: originalHash,
    });
    expect(second.pass).toBe(false);
    expect(second.reason).toBe("dirty");
    expect(second.hashMatched).toBe(true);

    // Re-binding fresh produces a different hash
    const rebound = await service.bind(notebookId, cellId);
    expect(rebound.snapshotHash).not.toBe(originalHash);
  }, 60_000);
});
