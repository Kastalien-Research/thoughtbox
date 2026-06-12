import { describe, expect, it } from "vitest";
import { Effect, Schema as S } from "effect";
import { NotebookHandler } from "../index.js";
import {
  InMemoryNotebookEngineRuntime,
  type CellExecutionEvidence,
} from "../engine/runtime.js";
import { compileOutcomeContract, type ExpectationRecord } from "../contracts.js";
import {
  BoundValidatorSchema,
  NotebookDocumentSchema,
  NotebookRunSchema,
  ValidatorRefSchema,
  describeRunStatus,
} from "../engine/domain.js";
import {
  getNotebookCapabilitiesJson,
  listNotebookModes,
} from "../engine/registry.js";

describe("Notebook Evidence Engine domain", () => {
  it("accepts a mode-specific eval notebook document", () => {
    const parsed = S.decodeUnknownSync(NotebookDocumentSchema)({
      _tag: "EvalNotebook",
      schemaVersion: "1.0",
      id: "nb_eval",
      mode: "eval",
      language: "typescript",
      createdAt: 1,
      updatedAt: 1,
      eval: { datasetName: "thoughtbox_notebook_verification", scoreName: "task_success" },
      cells: [
        { _tag: "TitleCell", id: "title", type: "title", role: "title", text: "Eval" },
        {
          _tag: "CodeCell",
          id: "grader",
          type: "code",
          role: "grader",
          language: "typescript",
          filename: "grader.ts",
          source: "console.log('ok')",
        },
      ],
    });

    expect(parsed.mode).toBe("eval");
    expect(parsed._tag).toBe("EvalNotebook");
  });

  it("rejects invalid mode/cell role combinations", () => {
    expect(() =>
      S.decodeUnknownSync(NotebookDocumentSchema)({
        _tag: "EvalNotebook",
        schemaVersion: "1.0",
        id: "nb_bad",
        mode: "eval",
        language: "typescript",
        createdAt: 1,
        updatedAt: 1,
        eval: { datasetName: "x", scoreName: "y" },
        cells: [
          {
            _tag: "MarkdownCell",
            id: "bad",
            type: "markdown",
            role: "validator",
            text: "markdown cannot be a validator",
          },
        ],
      }),
    ).toThrow();
  });

  it("distinguishes validator refs from bound validators", () => {
    const ref = S.decodeUnknownSync(ValidatorRefSchema)({
      _tag: "ValidatorRef",
      notebookId: "nb",
      cellId: "cell",
    });
    expect(ref._tag).toBe("ValidatorRef");

    expect(() =>
      S.decodeUnknownSync(BoundValidatorSchema)({
        _tag: "ValidatorRef",
        notebookId: "nb",
        cellId: "cell",
      }),
    ).toThrow();
  });

  it("rejects completed runs without outputs", () => {
    expect(() =>
      S.decodeUnknownSync(NotebookRunSchema)({
        _tag: "CompletedRun",
        runId: "run",
        notebookId: "nb",
        mode: "eval",
        status: "completed",
        createdAt: "2026-04-30T00:00:00.000Z",
        startedAt: "2026-04-30T00:00:00.000Z",
        completedAt: "2026-04-30T00:00:01.000Z",
      }),
    ).toThrow();
  });

  it("handles run statuses exhaustively", () => {
    const run = S.decodeUnknownSync(NotebookRunSchema)({
      _tag: "RunningRun",
      runId: "run",
      notebookId: "nb",
      mode: "system_audit",
      status: "running",
      createdAt: "2026-04-30T00:00:00.000Z",
      startedAt: "2026-04-30T00:00:00.000Z",
    });
    expect(describeRunStatus(run)).toBe("running");
  });

  it("rejects queued runs — no external dispatcher exists", () => {
    expect(() =>
      S.decodeUnknownSync(NotebookRunSchema)({
        _tag: "QueuedRun",
        runId: "run",
        notebookId: "nb",
        mode: "runbook",
        status: "queued",
        createdAt: "2026-04-30T00:00:00.000Z",
      }),
    ).toThrow();
  });
});

describe("Notebook Evidence Engine visibility", () => {
  it("lists all eight notebook modes in the capabilities resource", () => {
    const modes = listNotebookModes();
    expect(modes).toHaveLength(8);

    const capabilities = JSON.parse(getNotebookCapabilitiesJson());
    expect(capabilities.lowLevelPredicatePrimitive).toBe("notebook_validate");
    expect(capabilities.modes.map((m: { mode: string }) => m.mode)).toEqual([
      "runbook",
      "simulation",
      "eval",
      "failure_capsule",
      "adr_evidence",
      "skill_certification",
      "scenario_factory",
      "system_audit",
    ]);
  });

  it("marks only runbook as implemented; the rest are specified", () => {
    const statuses = Object.fromEntries(
      listNotebookModes().map((m) => [m.mode, m.runStatus]),
    );
    expect(statuses.runbook).toBe("implemented");
    for (const [mode, status] of Object.entries(statuses)) {
      if (mode !== "runbook") expect(status).toBe("specified");
    }
  });
});

describe("Notebook Evidence Engine runs", () => {
  it("derives a passing runbook verdict from real cell execution", async () => {
    const handler = new NotebookHandler();
    await handler.init();

    const created = await handler.handleCreateNotebook({
      title: "Runbook pass",
      language: "javascript",
    });
    await handler.handleAddCell({
      notebookId: created.notebook.id,
      cellType: "code",
      filename: "step1.js",
      content: 'console.log("step one ran");',
    });

    const runResult = await handler.handleStartRun({
      notebookId: created.notebook.id,
      mode: "runbook",
    });

    expect(runResult.run.status).toBe("completed");
    const verdict = runResult.run.outputs[0];
    expect(verdict._tag).toBe("RunbookVerdict");
    expect(verdict.pass).toBe(true);
    // Zero declared contracts: backward-compatible procedural verdict, but
    // explicitly marked so downstream fitness excludes it from pass-rates.
    expect(verdict.contractCoverage).toBe(0);
    expect(verdict.reason).toContain(
      "procedural completion only — no outcome contracts declared",
    );
    // Evidence covers the default package.json install cell plus step1.js.
    const evidence = verdict.evidence as Array<Record<string, unknown>>;
    expect(evidence).toHaveLength(2);
    expect(evidence.every((cell) => cell.status === "completed")).toBe(true);
    const step = evidence.find((cell) => cell.filename === "step1.js");
    expect(String(step!.output)).toContain("step one ran");

    const listed = await handler.handleListRuns({ notebookId: created.notebook.id });
    expect(listed.runs).toHaveLength(1);
  });

  it("derives a failing runbook verdict and skips later cells", async () => {
    const handler = new NotebookHandler();
    await handler.init();

    const created = await handler.handleCreateNotebook({
      title: "Runbook fail",
      language: "javascript",
    });
    await handler.handleAddCell({
      notebookId: created.notebook.id,
      cellType: "code",
      filename: "boom.js",
      content: 'console.error("deliberate failure"); process.exit(1);',
    });
    await handler.handleAddCell({
      notebookId: created.notebook.id,
      cellType: "code",
      filename: "never.js",
      content: 'console.log("should not run");',
    });

    const runResult = await handler.handleStartRun({
      notebookId: created.notebook.id,
      mode: "runbook",
    });

    expect(runResult.run.status).toBe("completed");
    const verdict = runResult.run.outputs[0];
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain("boom.js");
    // package.json install, then boom.js fails, then never.js is skipped.
    const evidence = verdict.evidence as Array<Record<string, unknown>>;
    expect(evidence).toHaveLength(3);
    const boom = evidence.find((cell) => cell.filename === "boom.js");
    expect(boom!.status).toBe("failed");
    expect(boom!.exitCode).toBe(1);
    const never = evidence.find((cell) => cell.filename === "never.js");
    expect(never!.status).toBe("skipped");
  });

  it("fails a runbook with no executable cells — a verdict needs evidence", async () => {
    const runtime = new InMemoryNotebookEngineRuntime(async () => []);
    const result = await Effect.runPromise(
      runtime.startRun({ notebookId: "nb_empty", mode: "runbook" }),
    );

    const run = result.run as Extract<typeof result.run, { _tag: "CompletedRun" }>;
    expect(run.outputs[0]).toMatchObject({
      pass: false,
      reason: expect.stringContaining("no executable cells"),
    });
  });

  it("marks the run failed when artifact persistence fails — never stuck running", async () => {
    // Evidence artifacts store full cell output; an oversized one fails
    // putArtifact and must transition the run to FailedRun, not leave it
    // in RunningRun forever.
    const runtime = new InMemoryNotebookEngineRuntime(async () => [
      {
        cellId: "huge",
        cellType: "code",
        filename: "huge.js",
        status: "completed",
        exitCode: 0,
        output: "x".repeat(1_100_000),
        error: "",
      },
    ]);

    await expect(
      Effect.runPromise(runtime.startRun({ notebookId: "nb_huge", mode: "runbook" })),
    ).rejects.toThrow();

    const runs = runtime.listRuns("nb_huge");
    expect(runs).toHaveLength(1);
    const failedRun = runs[0] as Extract<(typeof runs)[number], { _tag: "FailedRun" }>;
    expect(failedRun.status).toBe("failed");
    expect(failedRun.error).toContain("too large");
  });

  it("fails a blank notebook — dependency install alone cannot pass", async () => {
    // New notebooks always carry a default package.json cell; a successful
    // pnpm install with no code cells must not look like a verified runbook.
    const handler = new NotebookHandler();
    await handler.init();

    const created = await handler.handleCreateNotebook({
      title: "Runbook blank",
      language: "javascript",
    });

    const runResult = await handler.handleStartRun({
      notebookId: created.notebook.id,
      mode: "runbook",
    });

    expect(runResult.run.status).toBe("completed");
    const verdict = runResult.run.outputs[0];
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain("no code cells executed");
    const evidence = verdict.evidence as Array<Record<string, unknown>>;
    expect(evidence).toHaveLength(1);
    expect(evidence[0]!.cellType).toBe("package.json");
    expect(evidence[0]!.status).toBe("completed");
  });

  it("rejects non-runbook modes with an explicit not-implemented error", async () => {
    const handler = new NotebookHandler();
    await handler.init();

    const created = await handler.handleCreateNotebook({
      title: "Eval evidence",
      language: "typescript",
      template: "evidence-eval-workbook",
    });

    await expect(
      handler.handleStartRun({
        notebookId: created.notebook.id,
        mode: "eval",
        inputs: { datasetName: "demo" },
      }),
    ).rejects.toThrow(/not implemented/i);

    const listed = await handler.handleListRuns({ notebookId: created.notebook.id });
    expect(listed.runs).toHaveLength(0);
  });
});

const WRITE_OUTPUT_SOURCE = (json: string) =>
  `import { writeFileSync } from "node:fs";\n` +
  `writeFileSync(process.env.TB_OUTPUT_PATH, JSON.stringify(${json}));\n` +
  `console.log("step ran");`;

type VerdictShape = {
  pass: boolean;
  reason: string;
  contractCoverage: number;
  evidence: Array<Record<string, unknown> & { expectations?: ExpectationRecord[] }>;
};

describe("Outcome contracts (SPEC-AGX-SUBSTRATE B4a)", () => {
  async function newRunbook(handler: NotebookHandler, title: string) {
    const created = await handler.handleCreateNotebook({ title, language: "javascript" });
    return created.notebook.id as string;
  }

  async function runVerdict(handler: NotebookHandler, notebookId: string) {
    const runResult = await handler.handleStartRun({ notebookId, mode: "runbook" });
    expect(runResult.run.status).toBe("completed");
    return runResult.run.outputs[0] as VerdictShape;
  }

  it("passes a contracted run when all declared expectations pass", async () => {
    const handler = new NotebookHandler();
    await handler.init();
    const notebookId = await newRunbook(handler, "Contracted pass");

    const added = await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "step.js",
      content: WRITE_OUTPUT_SOURCE('{ count: 3, status: "green" }'),
      contract: {
        schemaVersion: "outcome-contract.v0",
        expectations: [
          { source: { kind: "exitCode" }, op: "eq", value: 0 },
          { source: { kind: "output", pointer: "/count" }, op: "gte", value: 3 },
          { source: { kind: "output", pointer: "/status" }, op: "matches", value: "^gr" },
        ],
      },
    });
    expect(added.cell.contractHash).toMatch(/^sha256:/);

    const verdict = await runVerdict(handler, notebookId);
    expect(verdict.pass).toBe(true);
    expect(verdict.contractCoverage).toBe(1);
    expect(verdict.reason).toContain("declared expectation(s) passed");

    const step = verdict.evidence.find((cell) => cell.filename === "step.js")!;
    expect(step.contractHash).toBe(added.cell.contractHash);
    expect(step.expectations).toHaveLength(3);
    expect(step.expectations!.every((record) => record.result === "pass")).toBe(true);
    expect(step.expectations!.every((record) => record.tier === 1)).toBe(true);
  });

  it("fails when an expectation evaluates false — contracted verdicts beat procedural completion", async () => {
    const handler = new NotebookHandler();
    await handler.init();
    const notebookId = await newRunbook(handler, "Contracted fail");

    // The cell completes procedurally (exit 0) but the declared outcome is wrong.
    await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "step.js",
      content: WRITE_OUTPUT_SOURCE("{ count: 1 }"),
      contract: {
        schemaVersion: "outcome-contract.v0",
        expectations: [{ source: { kind: "output", pointer: "/count" }, op: "gte", value: 3 }],
      },
    });

    const verdict = await runVerdict(handler, notebookId);
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain("fail");
    const step = verdict.evidence.find((cell) => cell.filename === "step.js")!;
    expect(step.expectations![0]!.result).toBe("fail");
    expect(step.expectations![0]!.actual).toBe(1);
  });

  it("marks unevaluable expectations as error, never pass or fail", async () => {
    const handler = new NotebookHandler();
    await handler.init();
    const notebookId = await newRunbook(handler, "Contracted error");

    await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "step.js",
      content: WRITE_OUTPUT_SOURCE("{ count: 3 }"),
      contract: {
        schemaVersion: "outcome-contract.v0",
        expectations: [{ source: { kind: "output", pointer: "/missing" }, op: "eq", value: 3 }],
      },
    });

    const verdict = await runVerdict(handler, notebookId);
    expect(verdict.pass).toBe(false);
    const step = verdict.evidence.find((cell) => cell.filename === "step.js")!;
    expect(step.expectations![0]!.result).toBe("error");
    expect(step.expectations![0]!.error).toContain("not found");
  });

  it("marks expectations on unreached cells as skipped — skipped is never pass", async () => {
    const handler = new NotebookHandler();
    await handler.init();
    const notebookId = await newRunbook(handler, "Contracted skip");

    await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "boom.js",
      content: "process.exit(1);",
    });
    await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "later.js",
      content: WRITE_OUTPUT_SOURCE("{ count: 3 }"),
      contract: {
        schemaVersion: "outcome-contract.v0",
        expectations: [{ source: { kind: "output", pointer: "/count" }, op: "eq", value: 3 }],
      },
    });

    const verdict = await runVerdict(handler, notebookId);
    expect(verdict.pass).toBe(false);
    const later = verdict.evidence.find((cell) => cell.filename === "later.js")!;
    expect(later.status).toBe("skipped");
    expect(later.expectations![0]!.result).toBe("skipped");
  });

  it("rejects the run when an attached contract was tampered with after authoring", async () => {
    const handler = new NotebookHandler();
    await handler.init();
    const notebookId = await newRunbook(handler, "Tampered contract");

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

    // Tamper with the stored contract without recompiling the hash.
    const notebook = handler.getNotebook(notebookId)!;
    const cell = notebook.cells.find((c) => c.id === added.cell.id)!;
    if (cell.type !== "code" || cell.contract === undefined) throw new Error("setup broke");
    (cell.contract.contract.expectations[0] as { value: unknown }).value = 1;

    await expect(
      handler.handleStartRun({ notebookId, mode: "runbook" }),
    ).rejects.toThrow();

    const listed = await handler.handleListRuns({ notebookId });
    expect(listed.runs).toHaveLength(1);
    const failed = listed.runs[0] as { status: string; error: string };
    expect(failed.status).toBe("failed");
    expect(failed.error).toContain("outcome contract hash mismatch");
    expect(failed.error).toContain("run rejected");
  });

  it("maps tier-2 validator verdicts into the expectation model end to end", async () => {
    const handler = new NotebookHandler();
    await handler.init();
    const notebookId = await newRunbook(handler, "Tier-2 pass");

    const step = await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "step.js",
      content: WRITE_OUTPUT_SOURCE("{ count: 3 }"),
    });
    await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "check.js",
      content:
        'import { observed, pass, fail } from "./tb-validate.js";\n' +
        "const o = observed();\n" +
        'if (o.count === 3) pass("count is 3"); else fail("count != 3", o);',
      validatorFor: step.cell.id,
    });

    const verdict = await runVerdict(handler, notebookId);
    expect(verdict.pass).toBe(true);
    // The validator covers step.js; validator cells are excluded from the denominator.
    expect(verdict.contractCoverage).toBe(1);
    const check = verdict.evidence.find((cell) => cell.filename === "check.js")!;
    expect(check.expectations).toHaveLength(1);
    expect(check.expectations![0]).toMatchObject({ tier: 2, result: "pass" });
  });

  it("surfaces post-attach validator edits as error via snapshot hash mismatch", async () => {
    const handler = new NotebookHandler();
    await handler.init();
    const notebookId = await newRunbook(handler, "Tier-2 tamper");

    const step = await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "step.js",
      content: WRITE_OUTPUT_SOURCE("{ count: 3 }"),
    });
    const validator = await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "check.js",
      content:
        'import { observed, pass, fail } from "./tb-validate.js";\n' +
        'if (observed().count === 3) pass("ok"); else fail("bad");',
      validatorFor: step.cell.id,
    });
    // Edit the validator source after its authoring-time snapshot was bound.
    await handler.handleUpdateCell({
      notebookId,
      cellId: validator.cell.id,
      content: 'import { pass } from "./tb-validate.js"; pass("always");',
    });

    const verdict = await runVerdict(handler, notebookId);
    expect(verdict.pass).toBe(false);
    const check = verdict.evidence.find((cell) => cell.filename === "check.js")!;
    expect(check.expectations![0]).toMatchObject({
      tier: 2,
      result: "error",
      error: "snapshot_hash_mismatch",
    });
  });

  it("claim-status expectations error until a resolver is wired, then evaluate", async () => {
    const attached = compileOutcomeContract({
      schemaVersion: "outcome-contract.v0",
      expectations: [
        { source: { kind: "claimStatus", claimId: "claim_42" }, op: "eq", value: "supported" },
      ],
    });
    const evidence: CellExecutionEvidence[] = [
      {
        cellId: "c1",
        cellType: "code",
        filename: "c1.js",
        status: "completed",
        exitCode: 0,
        output: "",
        error: "",
        contract: attached,
      },
    ];

    const unwired = new InMemoryNotebookEngineRuntime(async () => evidence);
    const unwiredResult = await Effect.runPromise(
      unwired.startRun({ notebookId: "nb_claims", mode: "runbook" }),
    );
    const unwiredRun = unwiredResult.run as Extract<
      typeof unwiredResult.run,
      { _tag: "CompletedRun" }
    >;
    const unwiredVerdict = unwiredRun.outputs[0] as unknown as VerdictShape;
    expect(unwiredVerdict.pass).toBe(false);
    expect(unwiredVerdict.evidence[0]!.expectations![0]).toMatchObject({
      result: "error",
      error: "claim resolver not wired",
    });

    const wired = new InMemoryNotebookEngineRuntime(async () => evidence, {
      resolve: () => "supported",
    });
    const wiredResult = await Effect.runPromise(
      wired.startRun({ notebookId: "nb_claims", mode: "runbook" }),
    );
    const wiredRun = wiredResult.run as Extract<typeof wiredResult.run, { _tag: "CompletedRun" }>;
    const wiredVerdict = wiredRun.outputs[0] as unknown as VerdictShape;
    expect(wiredVerdict.pass).toBe(true);
    expect(wiredVerdict.contractCoverage).toBe(1);
  });
});

describe("validatorFor authoring guards", () => {
  async function newRunbookWithStep(handler: NotebookHandler) {
    const created = await handler.handleCreateNotebook({
      title: "Guards",
      language: "javascript",
    });
    const notebookId = created.notebook.id as string;
    const step = await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "step.js",
      content: WRITE_OUTPUT_SOURCE("{ count: 3 }"),
    });
    return { notebookId, stepId: step.cell.id as string };
  }

  it("rejects a validator that targets another validator cell", async () => {
    const handler = new NotebookHandler();
    await handler.init();
    const { notebookId, stepId } = await newRunbookWithStep(handler);

    const validator = await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "check.js",
      content: 'import { pass } from "./tb-validate.js"; pass("ok");',
      validatorFor: stepId,
    });

    await expect(
      handler.handleAddCell({
        notebookId,
        cellType: "code",
        filename: "check2.js",
        content: 'import { pass } from "./tb-validate.js"; pass("ok");',
        validatorFor: validator.cell.id,
      }),
    ).rejects.toThrow(/is itself a validator cell/);
  });

  it("rejects a validator inserted at or before its target in document order", async () => {
    const handler = new NotebookHandler();
    await handler.init();
    const { notebookId, stepId } = await newRunbookWithStep(handler);

    await expect(
      handler.handleAddCell({
        notebookId,
        cellType: "code",
        filename: "check.js",
        content: 'import { pass } from "./tb-validate.js"; pass("ok");',
        validatorFor: stepId,
        position: 0,
      }),
    ).rejects.toThrow(/must come after its target/);
  });

  it("accepts a validator inserted after its target via explicit position", async () => {
    const handler = new NotebookHandler();
    await handler.init();
    const { notebookId, stepId } = await newRunbookWithStep(handler);

    const added = await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: "check.js",
      content: 'import { pass } from "./tb-validate.js"; pass("ok");',
      validatorFor: stepId,
      position: 99,
    });
    expect(added.success).toBe(true);
    expect(added.cell.validatorFor).toBe(stepId);
  });
});
