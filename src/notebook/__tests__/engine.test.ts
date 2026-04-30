import { describe, expect, it } from "vitest";
import { Schema as S } from "effect";
import { NotebookHandler } from "../index.js";
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
      _tag: "QueuedRun",
      runId: "run",
      notebookId: "nb",
      mode: "system_audit",
      status: "queued",
      createdAt: "2026-04-30T00:00:00.000Z",
    });
    expect(describeRunStatus(run)).toBe("queued");
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

  it("creates evidence templates and can start a sync evidence run", async () => {
    const handler = new NotebookHandler();
    await handler.init();

    const created = await handler.handleCreateNotebook({
      title: "Eval evidence",
      language: "typescript",
      template: "evidence-eval-workbook",
    });

    const runResult = await handler.handleStartRun({
      notebookId: created.notebook.id,
      mode: "eval",
      executionMode: "sync",
      inputs: { datasetName: "demo" },
    });

    expect(runResult.run.status).toBe("completed");
    expect(runResult.run.outputs[0].mode).toBe("eval");

    const listed = await handler.handleListRuns({ notebookId: created.notebook.id });
    expect(listed.runs).toHaveLength(1);
  });
});
