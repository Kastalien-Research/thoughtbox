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
  SnapshotMismatch,
  describeRunStatus,
} from "./domain.js";
import { getNotebookMode } from "./registry.js";
import {
  ContractHashMismatchError,
  evaluateExpectation,
  type AttachedContract,
  type ClaimStatusResolver,
  type ExpectationRecord,
} from "../contracts.js";

const MAX_ARTIFACT_BYTES = 1_000_000;
const MAX_EVIDENCE_OUTPUT_CHARS = 2_000;

export const PROCEDURAL_ONLY_NOTE =
  "procedural completion only — no outcome contracts declared";

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
  /** Raw JSON text the cell wrote to its TB_OUTPUT_PATH sidecar, if any. */
  structuredOutput?: string;
  /** Tier-1 outcome contract attached to the cell (hash-verified by the executor). */
  contract?: AttachedContract;
  /** When the cell is a tier-2 validator: the cell it validates. */
  validatorFor?: string;
  /** Pre-computed expectation records (tier 2 — produced by the executor). */
  expectations?: ExpectationRecord[];
}

/**
 * Executes a notebook's executable cells in document order and reports
 * per-cell evidence. Implemented by NotebookHandler over the real
 * NotebookStateManager subprocess execution path. Throws
 * ContractHashMismatchError when an attached outcome contract fails its
 * run-time hash re-verification (tampering — the run is rejected).
 */
export type NotebookCellExecutor = (
  notebookId: string,
) => Promise<CellExecutionEvidence[]>;

export class InMemoryNotebookEngineRuntime {
  private runs = new Map<string, NotebookRun>();
  private artifacts = new Map<string, { ref: ArtifactRef; content: string }>();

  constructor(
    private readonly executeNotebook: NotebookCellExecutor,
    private readonly claimResolver?: ClaimStatusResolver,
  ) {}

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
              `only "runbook" runs execute today. Use notebook_run_cell ` +
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

      // Everything between marking the run running and marking it completed
      // shares one error handler: any failure (execution, contract integrity,
      // or artifact persistence) must transition the run to FailedRun — a run
      // may never be left in RunningRun forever.
      const runBody = Effect.gen(this, function* () {
        const evidence = yield* Effect.tryPromise({
          try: () => this.executeNotebook(input.notebookId),
          catch: (cause) =>
            cause instanceof ContractHashMismatchError
              ? new SnapshotMismatch({
                  expected: cause.expected,
                  actual: cause.actual,
                })
              : new InvalidNotebookShape({
                  reason: `Notebook execution failed: ${cause instanceof Error ? cause.message : String(cause)}`,
                }),
        });
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
        return { evidence, inputsArtifact, evidenceArtifact };
      });

      const { evidence, inputsArtifact, evidenceArtifact } = yield* runBody.pipe(
        Effect.tapError((error) =>
          Effect.sync(() => {
            const detail =
              error._tag === "ArtifactTooLarge"
                ? `run artifact too large: ${error.sizeBytes} bytes (max ${error.maxBytes})`
                : error._tag === "SnapshotMismatch"
                  ? `outcome contract hash mismatch: expected ${error.expected}, ` +
                    `got ${error.actual} — contract was modified after attach; run rejected`
                  : error.reason;
            const failed: NotebookRun = {
              _tag: "FailedRun",
              runId,
              notebookId: input.notebookId,
              mode: parsedMode,
              status: "failed",
              createdAt,
              startedAt,
              completedAt: new Date().toISOString(),
              error: detail,
            };
            this.runs.set(runId, failed);
          }),
        ),
      );

      const runArtifacts = [inputsArtifact, evidenceArtifact];
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
        outputs: [
          buildRunbookVerdict(evidence, {
            readArtifact: (name) => this.readRunArtifact(runArtifacts, name),
            claimResolver: this.claimResolver,
          }),
        ],
        artifacts: runArtifacts,
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

  /**
   * Resolve a run artifact's content by authored name. Run artifacts carry a
   * runId prefix unknowable at authoring time, so "inputs.json" matches
   * "<runId>-inputs.json".
   */
  private readRunArtifact(refs: ArtifactRef[], name: string): string | undefined {
    const ref = refs.find((r) => r.name === name || r.name.endsWith(`-${name}`));
    if (!ref) return undefined;
    return this.artifacts.get(ref.artifactId)?.content;
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

interface VerdictDerivationContext {
  readArtifact: (name: string) => string | undefined;
  claimResolver?: ClaimStatusResolver;
}

/**
 * Derive the runbook verdict from real per-cell execution results
 * (SPEC-AGX-SUBSTRATE §5.1 outcome-contract semantics).
 *
 * With declared expectations (tier-1 contracts or tier-2 validators), the
 * verdict passes iff every declared expectation was evaluated and passed AND
 * no cell failed procedurally — `skipped` and `error` expectations are never
 * pass, and a crashed cell still fails the run.
 *
 * With ZERO declared expectations, the legacy procedural derivation applies
 * unchanged, but the verdict carries contractCoverage 0 and a reason marking
 * it as procedural-only so downstream fitness can exclude it: a passing
 * verdict must rest on at least one completed code cell — dependency
 * installation (package.json cells) is recorded as evidence but cannot verify
 * a runbook by itself, so blank notebooks cannot pass.
 */
function buildRunbookVerdict(
  evidence: CellExecutionEvidence[],
  context: VerdictDerivationContext,
): NotebookOutput {
  const recordsByCell = new Map<string, ExpectationRecord[]>();
  const allRecords: ExpectationRecord[] = [];
  const coveredCellIds = new Set<string>();

  for (const cell of evidence) {
    const cellRecords: ExpectationRecord[] = [];
    if (cell.expectations) {
      // Tier 2 — pre-computed by the executor's validator machinery.
      cellRecords.push(...cell.expectations);
      if (cell.validatorFor !== undefined) coveredCellIds.add(cell.validatorFor);
    }
    if (cell.contract) {
      coveredCellIds.add(cell.cellId);
      for (const expectation of cell.contract.contract.expectations) {
        cellRecords.push(
          evaluateExpectation(expectation, {
            cellId: cell.cellId,
            cellStatus: cell.status,
            exitCode: cell.exitCode,
            ...(cell.structuredOutput !== undefined
              ? { structuredOutputRaw: cell.structuredOutput }
              : {}),
            readArtifact: context.readArtifact,
            ...(context.claimResolver !== undefined
              ? { claimResolver: context.claimResolver }
              : {}),
          }),
        );
      }
    }
    if (cellRecords.length > 0) {
      recordsByCell.set(cell.cellId, cellRecords);
      allRecords.push(...cellRecords);
    }
  }

  const subjectCodeCells = evidence.filter(
    (cell) => cell.cellType === "code" && cell.validatorFor === undefined,
  );
  const contractCoverage =
    subjectCodeCells.length === 0
      ? 0
      : subjectCodeCells.filter((cell) => coveredCellIds.has(cell.cellId)).length /
        subjectCodeCells.length;

  const failed = evidence.filter((cell) => cell.status === "failed");
  const completedCode = evidence.filter(
    (cell) => cell.status === "completed" && cell.cellType === "code",
  );

  let pass: boolean;
  let reason: string;

  if (allRecords.length === 0) {
    // Legacy procedural derivation — kept verbatim, marked procedural-only.
    if (evidence.length === 0) {
      pass = false;
      reason = "runbook has no executable cells; nothing was verified";
    } else if (failed.length > 0) {
      pass = false;
      const first = failed[0]!;
      reason =
        `cell ${first.cellId} (${first.filename}) failed with exit code ` +
        `${first.exitCode ?? "none"}: ${truncate(first.error || first.output)}`;
    } else if (completedCode.length === 0) {
      pass = false;
      reason =
        "no code cells executed; dependency install alone does not verify a runbook";
    } else {
      pass = true;
      reason = `all executable cells completed (${completedCode.length} code)`;
    }
    reason = `${reason}; ${PROCEDURAL_ONLY_NOTE}`;
  } else {
    const notPassed = allRecords.filter((record) => record.result !== "pass");
    if (failed.length > 0) {
      pass = false;
      const first = failed[0]!;
      reason =
        `cell ${first.cellId} (${first.filename}) failed with exit code ` +
        `${first.exitCode ?? "none"}: ${truncate(first.error || first.output)}`;
    } else if (notPassed.length > 0) {
      pass = false;
      const first = notPassed[0]!;
      reason =
        `expectation "${first.expectation}" on cell ${first.cellId} ` +
        `${first.result}${first.error ? `: ${first.error}` : ""} ` +
        `(${notPassed.length} of ${allRecords.length} declared expectations did not pass)`;
    } else {
      pass = true;
      reason =
        `all ${allRecords.length} declared expectation(s) passed ` +
        `(contract coverage ${Math.round(contractCoverage * 100)}% of code cells)`;
    }
  }

  return {
    _tag: "RunbookVerdict",
    mode: "runbook",
    pass,
    reason,
    contractCoverage,
    evidence: evidence.map((cell) => ({
      cellId: cell.cellId,
      cellType: cell.cellType,
      filename: cell.filename,
      status: cell.status,
      exitCode: cell.exitCode,
      output: truncate(cell.output),
      error: truncate(cell.error),
      ...(cell.contract !== undefined
        ? { contractHash: cell.contract.contractHash }
        : {}),
      ...(recordsByCell.has(cell.cellId)
        ? { expectations: recordsByCell.get(cell.cellId) }
        : {}),
    })),
  };
}

function truncate(text: string): string {
  if (text.length <= MAX_EVIDENCE_OUTPUT_CHARS) return text;
  return `${text.slice(0, MAX_EVIDENCE_OUTPUT_CHARS)}… [truncated]`;
}
