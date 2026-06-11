import { Effect, Schema as S } from "effect";
import type {
  ArtifactRef,
  NotebookMode,
  NotebookOutput,
  NotebookRun,
} from "./domain.js";
import {
  ArtifactTooLarge,
  InvalidNotebookShape,
  NotebookModeNotImplemented,
  NotebookModeSchema,
  describeRunStatus,
} from "./domain.js";
import { getNotebookMode } from "./registry.js";

const MAX_ARTIFACT_BYTES = 1_000_000;
const MAX_EVIDENCE_OUTPUT_CHARS = 2_000;

export interface StartNotebookRunInput {
  notebookId: string;
  mode: NotebookMode;
  inputs?: Record<string, unknown>;
}

export interface NotebookRunRuntimeResult {
  run: NotebookRun;
  message: string;
}

/**
 * Per-cell result of a real notebook execution, as reported by the
 * NotebookCellExecutor. `skipped` means an earlier cell failed and this
 * cell was never run.
 */
export interface CellExecutionEvidence {
  cellId: string;
  cellType: "code" | "package.json";
  filename: string;
  status: "completed" | "failed" | "skipped";
  exitCode: number | null;
  output: string;
  error: string;
}

/**
 * Executes a notebook's executable cells in document order and reports
 * per-cell evidence. Implemented by NotebookHandler over the real
 * NotebookStateManager subprocess execution path.
 */
export type NotebookCellExecutor = (
  notebookId: string,
) => Promise<CellExecutionEvidence[]>;

export class InMemoryNotebookEngineRuntime {
  private runs = new Map<string, NotebookRun>();
  private artifacts = new Map<string, { ref: ArtifactRef; content: string }>();

  constructor(private readonly executeNotebook: NotebookCellExecutor) {}

  persistNotebook(notebookId: string, content: string) {
    return Effect.gen(this, function* () {
      const artifact = yield* this.putArtifact(
        `${notebookId}.src.md`,
        "text/markdown",
        content,
      );
      return {
        success: true,
        notebookId,
        persistence: "in_memory",
        artifact,
      };
    });
  }

  startRun(input: StartNotebookRunInput) {
    return Effect.gen(this, function* () {
      const descriptor = getNotebookMode(input.mode);
      if (!descriptor) {
        return yield* Effect.fail(
          new InvalidNotebookShape({
            reason: `Unknown notebook mode: ${input.mode}`,
          }),
        );
      }

      const parsedMode = yield* Effect.try({
        try: () => S.decodeUnknownSync(NotebookModeSchema)(input.mode),
        catch: () =>
          new InvalidNotebookShape({
            reason: `Invalid notebook mode: ${input.mode}`,
          }),
      });

      if (parsedMode !== "runbook") {
        return yield* Effect.fail(
          new NotebookModeNotImplemented({
            mode: parsedMode,
            reason:
              `Verdict derivation for mode "${parsedMode}" is not implemented; ` +
              `only "runbook" runs execute today. Use notebook_execute_cell ` +
              `and notebook_validate for cell-level evidence in other modes.`,
          }),
        );
      }

      const createdAt = new Date().toISOString();
      const runId = `nbr_${Math.random().toString(36).slice(2, 12)}`;
      const startedAt = new Date().toISOString();
      const running: NotebookRun = {
        _tag: "RunningRun",
        runId,
        notebookId: input.notebookId,
        mode: parsedMode,
        status: "running",
        createdAt,
        startedAt,
      };
      this.runs.set(runId, running);

      const evidence = yield* Effect.tryPromise({
        try: () => this.executeNotebook(input.notebookId),
        catch: (cause) =>
          new InvalidNotebookShape({
            reason: `Notebook execution failed: ${cause instanceof Error ? cause.message : String(cause)}`,
          }),
      }).pipe(
        Effect.tapError(() =>
          Effect.sync(() => {
            const failed: NotebookRun = {
              _tag: "FailedRun",
              runId,
              notebookId: input.notebookId,
              mode: parsedMode,
              status: "failed",
              createdAt,
              startedAt,
              completedAt: new Date().toISOString(),
              error: "notebook execution failed before producing a verdict",
            };
            this.runs.set(runId, failed);
          }),
        ),
      );

      const inputsArtifact = yield* this.putArtifact(
        `${runId}-inputs.json`,
        "application/json",
        JSON.stringify(input.inputs ?? {}, null, 2),
      );
      const evidenceArtifact = yield* this.putArtifact(
        `${runId}-cell-results.json`,
        "application/json",
        JSON.stringify(evidence, null, 2),
      );

      const completedAt = new Date().toISOString();
      const completed: NotebookRun = {
        _tag: "CompletedRun",
        runId,
        notebookId: input.notebookId,
        mode: parsedMode,
        status: "completed",
        createdAt,
        startedAt,
        completedAt,
        outputs: [buildRunbookVerdict(evidence)],
        artifacts: [inputsArtifact, evidenceArtifact],
      };
      this.runs.set(runId, completed);

      return {
        run: completed,
        message: describeRunStatus(completed),
      } satisfies NotebookRunRuntimeResult;
    });
  }

  getRun(runId: string): NotebookRun | null {
    return this.runs.get(runId) ?? null;
  }

  listRuns(notebookId?: string): NotebookRun[] {
    const runs = Array.from(this.runs.values());
    if (!notebookId) return runs;
    return runs.filter((run) => run.notebookId === notebookId);
  }

  cancelRun(runId: string, reason = "cancelled by caller"): NotebookRun | null {
    const run = this.runs.get(runId);
    if (!run) return null;
    if (run.status === "completed" || run.status === "failed" || run.status === "cancelled") {
      return run;
    }
    const cancelled: NotebookRun = {
      _tag: "CancelledRun",
      runId: run.runId,
      notebookId: run.notebookId,
      mode: run.mode,
      status: "cancelled",
      createdAt: run.createdAt,
      startedAt: "startedAt" in run ? run.startedAt : undefined,
      completedAt: new Date().toISOString(),
      reason,
    };
    this.runs.set(runId, cancelled);
    return cancelled;
  }

  getArtifact(artifactId: string): { ref: ArtifactRef; content: string } | null {
    return this.artifacts.get(artifactId) ?? null;
  }

  private putArtifact(name: string, mimeType: string, content: string) {
    return Effect.gen(this, function* () {
      const sizeBytes = Buffer.byteLength(content, "utf8");
      if (sizeBytes > MAX_ARTIFACT_BYTES) {
        return yield* Effect.fail(
          new ArtifactTooLarge({ sizeBytes, maxBytes: MAX_ARTIFACT_BYTES }),
        );
      }
      const artifactId = `nba_${Math.random().toString(36).slice(2, 12)}`;
      const ref: ArtifactRef = { artifactId, name, mimeType, sizeBytes };
      this.artifacts.set(artifactId, { ref, content });
      return ref;
    });
  }
}

/**
 * Derive the runbook verdict from real per-cell execution results.
 * An empty runbook cannot pass: a verdict must rest on at least one
 * executed cell.
 */
function buildRunbookVerdict(evidence: CellExecutionEvidence[]): NotebookOutput {
  const failed = evidence.filter((cell) => cell.status === "failed");
  const completed = evidence.filter((cell) => cell.status === "completed");

  let pass: boolean;
  let reason: string;
  if (evidence.length === 0) {
    pass = false;
    reason = "runbook has no executable cells; nothing was verified";
  } else if (failed.length > 0) {
    pass = false;
    const first = failed[0]!;
    reason =
      `cell ${first.cellId} (${first.filename}) failed with exit code ` +
      `${first.exitCode ?? "none"}: ${truncate(first.error || first.output)}`;
  } else {
    pass = true;
    reason = `all ${completed.length} executable cells completed`;
  }

  return {
    _tag: "RunbookVerdict",
    mode: "runbook",
    pass,
    reason,
    evidence: evidence.map((cell) => ({
      cellId: cell.cellId,
      cellType: cell.cellType,
      filename: cell.filename,
      status: cell.status,
      exitCode: cell.exitCode,
      output: truncate(cell.output),
      error: truncate(cell.error),
    })),
  };
}

function truncate(text: string): string {
  if (text.length <= MAX_EVIDENCE_OUTPUT_CHARS) return text;
  return `${text.slice(0, MAX_EVIDENCE_OUTPUT_CHARS)}… [truncated]`;
}
