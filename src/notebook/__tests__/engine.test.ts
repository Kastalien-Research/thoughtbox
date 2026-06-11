import { describe, expect, it } from "vitest";
import { Effect, Schema as S } from "effect";
import { NotebookHandler } from "../index.js";
import { InMemoryNotebookEngineRuntime } from "../engine/runtime.js";
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
