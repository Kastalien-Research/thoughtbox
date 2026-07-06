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
  StoreUnavailable,
  describeRunStatus,
} from "./domain.js";
import { getNotebookMode } from "./registry.js";
import {
  ContractHashMismatchError,
  evaluateExpectation,
  type AttachedContract,
  type ClaimStatusResolver,
  type ExpectationRecord,
  type OutcomeExpectation,
} from "../contracts.js";
import {
  hashTemplateCells,
  verifyCellContracts,
  verifyTemplateContracts,
  type CellExecutionRecord,
  type FitnessLedgerRow,
  type RunbookInstanceStatus,
  type RunbookStorage,
  type RunbookTemplate,
  type RunbookTemplateCell,
} from "../runbook/types.js";
import {
  assertCellExecutable,
  deriveInstanceStatus,
  isExecutionSatisfied,
  nextUnsatisfiedCell,
} from "../runbook/ordering.js";
import { ensureTemplateVersion } from "../runbook/template-versioning.js";
import { InMemoryRunbookStorage } from "../runbook/in-memory-runbook-storage.js";
import { hashJson } from "../../peer-notebook/manifest.js";

const MAX_ARTIFACT_BYTES = 1_000_000;
const MAX_EVIDENCE_OUTPUT_CHARS = 2_000;

/**
 * Modes whose notebook_start_run executes cells and derives a real verdict.
 * merge_evidence shares the runbook execution body (ordered cells, contracts,
 * validators, B5 gate); its output is retagged as MergeEvidenceRunResult.
 */
const IMPLEMENTED_RUN_MODES: ReadonlySet<NotebookMode> = new Set([
  "runbook",
  "merge_evidence",
]);

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
 * NotebookCellExecutor. `skipped` means an earlier cell halted the run and
 * this cell was never run.
 */
export interface CellExecutionEvidence {
  cellId: string;
  cellType: "code" | "package.json";
  filename: string;
  /** ISO timestamp captured when the cell's execution began; absent for skipped cells. */
  startedAt?: string;
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

export type CellGateDisposition = "continue" | "halt";

export interface CellGateResult {
  /** Every evaluated expectation record for the cell (tier 2 then tier 1). */
  records: ExpectationRecord[];
  disposition: CellGateDisposition;
}

/**
 * Per-cell gate the runtime hands to the executor (SPEC-AGX-SUBSTRATE B5).
 *
 * The executor calls `assertExecutable` BEFORE a cell runs — document-order
 * enforcement happens pre-execution, so a rejected cell never executes and
 * an ordering failure can never drop an already-executed cell's durable
 * record — and `record` once after the cell actually executes (never for
 * skipped cells). `record` evaluates the cell's declared expectations,
 * persists the durable execution record and its ledger rows immediately
 * (partial-run durability), and decides whether the run continues: an
 * expectation-satisfied predicted failure continues; an uncontracted
 * failure or failed/errored expectations halt.
 */
export interface CellExecutionGate {
  /**
   * Pre-execution ordering check (spec §5): throws OutOfOrderExecutionError
   * naming the expected next cell, or a plain Error when the cell is not
   * part of the pinned template.
   */
  assertExecutable(cellId: string): void;
  record(evidence: CellExecutionEvidence): Promise<CellGateResult>;
}

/**
 * Executes a notebook's executable cells in document order and reports
 * per-cell evidence, consulting the gate (when provided) after each cell
 * for the continue/halt disposition. Implemented by NotebookHandler over
 * the real NotebookStateManager subprocess execution path. Throws
 * ContractHashMismatchError when an attached outcome contract fails its
 * run-time hash re-verification (tampering — the run is rejected).
 */
export type NotebookCellExecutor = (
  notebookId: string,
  gate?: CellExecutionGate,
) => Promise<CellExecutionEvidence[]>;

/** Distinguishes durable-storage failures raised inside the cell gate. */
export class RunbookPersistenceError extends Error {
  override readonly name = "RunbookPersistenceError";
}

/**
 * Durable persistence wiring for the engine runtime (SPEC-AGX-SUBSTRATE B4b).
 * The storage port defaults to InMemoryRunbookStorage so the runtime works
 * unchanged without external infrastructure; deployments inject
 * SupabaseRunbookStorage through the same port.
 */
export interface NotebookEngineRuntimeOptions {
  storage?: RunbookStorage;
  /**
   * Snapshot of a notebook's executable cells (including compiled contracts)
   * for durable template versioning. When wired, the instance is created at
   * run start and cell execution records persist as each cell completes
   * (B5 partial-run durability). When absent, a degenerate template is
   * derived from execution evidence after the run (cell ids/types/contracts;
   * source unavailable at that layer) and persistence happens at run end.
   */
  templateCellSource?: (notebookId: string) => RunbookTemplateCell[] | undefined;
  /** Executing agent identity recorded on instances/executions/ledger rows. */
  agentId?: string;
}

/** Mutable per-run context threading the gate's durable writes (B5). */
interface DurableRunContext {
  instanceId: string;
  template: RunbookTemplate;
  inputsDigest: string;
  nextSeq: number;
  executions: CellExecutionRecord[];
  /** Gate-evaluated records, authoritative for the verdict derivation. */
  recordsByCell: Map<string, ExpectationRecord[]>;
  /** Cells whose ledger rows the gate already wrote. */
  gatedCellIds: Set<string>;
}

/** Input for the instance-aware single-cell execution path (B5 ordering). */
export interface InstanceCellExecutionInput {
  instanceId: string;
  cellId: string;
  /** Guard: the instance must belong to this template (the notebook id). */
  expectedTemplateId?: string;
  /** Live notebook cell snapshot, hash-checked against the pinned template version. */
  liveCells?: RunbookTemplateCell[];
  /** Executes exactly one cell through the real execution path. */
  executeCell: (cellId: string) => Promise<InstanceCellExecution>;
}

export interface InstanceCellExecution {
  status: "completed" | "failed";
  exitCode: number | null;
  stdout: string;
  stderr: string;
  structuredOutput?: string;
}

export interface InstanceCellExecutionResult {
  instanceId: string;
  cellId: string;
  seq: number;
  status: "completed" | "failed";
  /** B5 satisfaction: declared expectations decide; else procedural completion. */
  satisfied: boolean;
  expectations: ExpectationRecord[];
  instanceStatus: RunbookInstanceStatus;
  /** Next unsatisfied cell after this execution; null = all satisfied. */
  nextCellId: string | null;
  execution: { exitCode: number | null; stdout: string; stderr: string };
}

export class InMemoryNotebookEngineRuntime {
  private runs = new Map<string, NotebookRun>();
  private artifacts = new Map<string, { ref: ArtifactRef; content: string }>();
  /** Durable runbook substrate (templates, instances, executions, ledger). */
  readonly storage: RunbookStorage;
  private readonly templateCellSource?: (
    notebookId: string,
  ) => RunbookTemplateCell[] | undefined;
  private readonly agentId: string;

  constructor(
    private readonly executeNotebook: NotebookCellExecutor,
    private readonly claimResolver?: ClaimStatusResolver,
    options: NotebookEngineRuntimeOptions = {},
  ) {
    this.storage = options.storage ?? new InMemoryRunbookStorage();
    if (options.templateCellSource !== undefined) {
      this.templateCellSource = options.templateCellSource;
    }
    this.agentId = options.agentId ?? "local";
  }

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

      if (!IMPLEMENTED_RUN_MODES.has(parsedMode)) {
        return yield* Effect.fail(
          new NotebookModeNotImplemented({
            mode: parsedMode,
            reason:
              `Verdict derivation for mode "${parsedMode}" is not implemented; ` +
              `implemented modes: ${[...IMPLEMENTED_RUN_MODES].join(", ")}. ` +
              `Use notebook_run_cell and notebook_validate for cell-level ` +
              `evidence in other modes.`,
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
      const runBody = this.makeRunBody({
        runId,
        notebookId: input.notebookId,
        startedAt,
        inputs: input.inputs ?? {},
      });

      const { verdict, runArtifacts } = yield* runBody.pipe(
        Effect.tapError((error) =>
          Effect.sync(() => {
            const detail =
              error._tag === "ArtifactTooLarge"
                ? `run artifact too large: ${error.sizeBytes} bytes (max ${error.maxBytes})`
                : error._tag === "SnapshotMismatch"
                  ? `outcome contract hash mismatch: expected ${error.expected}, ` +
                    `got ${error.actual} — contract was modified after attach; run rejected`
                  : error._tag === "StoreUnavailable"
                    ? `durable runbook persistence failed (${error.store}): ${error.reason}`
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

      // merge_evidence shares the runbook run body; retag its output so the
      // run record carries a mode-true MergeEvidenceRunResult.
      const output: NotebookOutput =
        parsedMode === "merge_evidence" && verdict._tag === "RunbookVerdict"
          ? {
              _tag: "MergeEvidenceRunResult",
              mode: "merge_evidence",
              pass: verdict.pass,
              reason: verdict.reason,
              contractCoverage: verdict.contractCoverage,
              ...(verdict.evidence !== undefined
                ? { evidence: verdict.evidence }
                : {}),
            }
          : verdict;

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
        outputs: [output],
        artifacts: runArtifacts,
      };
      this.runs.set(runId, completed);

      return {
        run: completed,
        message: describeRunStatus(completed),
      } satisfies NotebookRunRuntimeResult;
    });
  }

  /**
   * The run body shared by every runbook run. With a templateCellSource
   * wired (the real handler path), the durable instance is created BEFORE
   * any cell executes and the gate persists each cell's record as it
   * completes — a run that dies mid-way leaves durable records for every
   * cell that did execute (B5 partial-run durability). Without one (raw
   * runtime usage), the legacy run-end persistence applies.
   */
  private makeRunBody(args: {
    runId: string;
    notebookId: string;
    startedAt: string;
    inputs: Record<string, unknown>;
  }) {
    const { runId, notebookId, startedAt, inputs } = args;
    return Effect.gen(this, function* () {
      const inputsArtifact = yield* this.putArtifact(
        `${runId}-inputs.json`,
        "application/json",
        JSON.stringify(inputs, null, 2),
      );

      const templateCells = this.templateCellSource?.(notebookId);
      // Verify attached contract hashes BEFORE persisting a template version:
      // a post-attach tampered contract is rejected here instead of saving a
      // template + instance that executeAllCells would only later reject,
      // leaving durable storage polluted with an unloadable version (Codex
      // PR #402, P2).
      if (templateCells !== undefined) {
        yield* Effect.try({
          try: () => verifyCellContracts(templateCells),
          catch: (cause) =>
            cause instanceof ContractHashMismatchError
              ? new SnapshotMismatch({ expected: cause.expected, actual: cause.actual })
              : new InvalidNotebookShape({
                  reason: `Contract verification failed: ${errorMessage(cause)}`,
                }),
        });
      }
      const durable =
        templateCells !== undefined
          ? yield* Effect.tryPromise({
              try: () =>
                this.beginDurableRun({ runId, notebookId, startedAt, inputs, cells: templateCells }),
              catch: (cause) =>
                new StoreUnavailable({ store: "runbook", reason: errorMessage(cause) }),
            })
          : undefined;
      const gate =
        durable !== undefined ? this.createCellGate(durable, [inputsArtifact]) : undefined;

      const evidence = yield* Effect.tryPromise({
        try: () => this.executeNotebook(notebookId, gate),
        catch: (cause) =>
          cause instanceof ContractHashMismatchError
            ? new SnapshotMismatch({ expected: cause.expected, actual: cause.actual })
            : cause instanceof RunbookPersistenceError
              ? new StoreUnavailable({ store: "runbook", reason: cause.message })
              : new InvalidNotebookShape({
                  reason: `Notebook execution failed: ${errorMessage(cause)}`,
                }),
      });

      const evidenceArtifact = yield* this.putArtifact(
        `${runId}-cell-results.json`,
        "application/json",
        JSON.stringify(evidence, null, 2),
      );
      const runArtifacts = [inputsArtifact, evidenceArtifact];
      const { verdict, records } = buildRunbookVerdict(evidence, {
        readArtifact: (name) => this.readRunArtifact(runArtifacts, name),
        claimResolver: this.claimResolver,
        ...(durable !== undefined ? { precomputedRecords: durable.recordsByCell } : {}),
      });

      yield* Effect.tryPromise({
        try: () =>
          durable !== undefined
            ? this.finishDurableRun(durable, records)
            : this.persistDurableRecords({
                runId,
                notebookId,
                startedAt,
                inputs,
                evidence,
                records,
                outputsRef: evidenceArtifact.artifactId,
              }),
        catch: (cause) =>
          new StoreUnavailable({ store: "runbook", reason: errorMessage(cause) }),
      });
      return { verdict, runArtifacts };
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
   * Instance-aware single-cell execution (SPEC-AGX-SUBSTRATE B5 — spec §5
   * "Ordering"). Given an instance, ONLY the next unsatisfied cell (per
   * template order and the instance's append-only execution records) may
   * execute; any other cell is rejected with OutOfOrderExecutionError naming
   * the expected next cell. The execution appends a fresh record (seq) and
   * its ledger rows. Artifact-sourced expectations have no run artifacts on
   * this path and evaluate to `error`; tier-2 validator cells are rejected —
   * they evaluate during batch runs, which retain the target cell's
   * structured output.
   */
  async executeInstanceCell(
    input: InstanceCellExecutionInput,
  ): Promise<InstanceCellExecutionResult> {
    const instance = await this.storage.getInstance(input.instanceId);
    if (!instance) {
      throw new Error(`Runbook instance ${input.instanceId} not found`);
    }
    if (
      input.expectedTemplateId !== undefined &&
      instance.templateId !== input.expectedTemplateId
    ) {
      throw new Error(
        `instance ${input.instanceId} belongs to template ${instance.templateId}, ` +
          `not ${input.expectedTemplateId}`,
      );
    }
    const template = await this.storage.getTemplate(
      instance.templateId,
      instance.templateVersion,
    );
    if (!template) {
      throw new Error(
        `template ${instance.templateId} version ${instance.templateVersion} ` +
          `not found for instance ${input.instanceId}`,
      );
    }
    verifyTemplateContracts(template);
    if (
      input.liveCells !== undefined &&
      hashTemplateCells(input.liveCells) !== template.cellsHash
    ) {
      throw new Error(
        `notebook cells have drifted from template ${template.templateId} ` +
          `version ${template.version} pinned by instance ${input.instanceId}; ` +
          `start a new run to version the current cells`,
      );
    }

    // CONCURRENCY (v0): instance advance is single-writer per instance. This
    // read -> executeCell -> append sequence is not atomic, so two concurrent
    // advances of the SAME instance+cell would both run the cell's side
    // effects before either appends; the loser then fails on the
    // (instance_id, seq) unique constraint. That constraint is the durable
    // backstop (never two rows at one seq), but it does not prevent the double
    // side effect. v0 assumes one advancer per instance (an agent holding it,
    // or a single cron tick); cross-replica concurrent same-instance advance
    // is unsupported and is resolved with the advancer (B6/B8), where
    // contention originates. Tracked in GH #403.
    const executions = await this.storage.listCellExecutions(input.instanceId);
    assertCellExecutable(template, executions, input.cellId);
    const templateCell = template.cells.find((cell) => cell.cellId === input.cellId)!;
    if (templateCell.validatorFor !== undefined) {
      throw new Error(
        `cell ${input.cellId} is a tier-2 validator for ${templateCell.validatorFor}; ` +
          `validator cells evaluate during batch runs (notebook_start_run) — ` +
          `single-cell instance execution does not retain the target's structured output`,
      );
    }

    const startedAt = new Date().toISOString();
    const result = await input.executeCell(input.cellId);
    const records: ExpectationRecord[] =
      templateCell.contract !== undefined
        ? templateCell.contract.contract.expectations.map((expectation) =>
            evaluateExpectation(expectation, {
              cellId: input.cellId,
              cellStatus: result.status,
              exitCode: result.exitCode,
              ...(result.structuredOutput !== undefined
                ? { structuredOutputRaw: result.structuredOutput }
                : {}),
              ...(this.claimResolver !== undefined
                ? { claimResolver: this.claimResolver }
                : {}),
            }),
          )
        : [];
    const record: CellExecutionRecord = {
      instanceId: input.instanceId,
      // Explicit max over recorded seqs — never an implicit dependency on
      // the storage backend's sort order.
      seq: executions.reduce((max, prior) => Math.max(max, prior.seq), 0) + 1,
      cellId: input.cellId,
      startedAt,
      agentId: this.agentId,
      // Single-cell advances carry no run inputs; the digest pins that fact.
      inputsDigest: hashJson({}),
      status: result.status,
      expectations: records,
    };
    await this.storage.appendCellExecution(record);
    await this.storage.appendFitnessRows(
      this.ledgerRowsFromRecords(template, input.instanceId, records),
    );

    const after = [...executions, record];
    return {
      instanceId: input.instanceId,
      cellId: input.cellId,
      seq: record.seq,
      status: result.status,
      satisfied: isExecutionSatisfied(record),
      expectations: records,
      instanceStatus: deriveInstanceStatus(template, after),
      nextCellId: nextUnsatisfiedCell(template, after),
      execution: {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
      },
    };
  }

  /**
   * Run-start durable persistence (B5): resolve the template version for the
   * current cells (reuse when the canonical hash matches, append otherwise)
   * and create the instance pinning it — BEFORE any cell executes, so the
   * instance exists even when the run dies mid-way.
   */
  private async beginDurableRun(args: {
    runId: string;
    notebookId: string;
    startedAt: string;
    inputs: Record<string, unknown>;
    cells: RunbookTemplateCell[];
  }): Promise<DurableRunContext> {
    const { runId, notebookId, startedAt, inputs, cells } = args;
    // Concurrency-safe: a lost saveTemplate race against a concurrent run of
    // the same notebook reuses the winner's just-written version instead of
    // failing this run (Greptile PR #401 — TOCTOU in template versioning).
    const template = await ensureTemplateVersion(this.storage, {
      templateId: notebookId,
      cells,
      createdBy: this.agentId,
    });
    await this.storage.createInstance({
      instanceId: runId,
      templateId: notebookId,
      templateVersion: template.version,
      createdBy: this.agentId,
      createdAt: startedAt,
    });
    return {
      instanceId: runId,
      template,
      inputsDigest: hashJson(inputs),
      nextSeq: 1,
      executions: [],
      recordsByCell: new Map(),
      gatedCellIds: new Set(),
    };
  }

  /**
   * The per-cell gate (B5). `assertExecutable` enforces document-order
   * execution against the accumulating instance records BEFORE a cell runs
   * (a rejection can therefore never drop an executed cell's record).
   * `record` evaluates the cell's declared expectations (tier 2 from the
   * executor, tier 1 from the attached contract), persists the execution
   * record and its ledger rows immediately, and derives the continue/halt
   * disposition from the B5 satisfaction rule. Gated records omit
   * `outputsRef` — the cell-results artifact does not exist yet when a
   * record is appended.
   */
  private createCellGate(
    durable: DurableRunContext,
    preArtifacts: ArtifactRef[],
  ): CellExecutionGate {
    return {
      assertExecutable: (cellId) => {
        assertCellExecutable(durable.template, durable.executions, cellId);
      },
      record: async (evidence) => {
        // The gate runs mid-execution with only pre-run artifacts (inputs).
        // Defer artifact-backed expectations to the verdict, where the
        // post-run cell-results artifact exists — evaluating them here would
        // always error ("run artifact not found") and wrongly halt/fail an
        // otherwise valid run (Codex PR #402, P2). They do not gate the
        // mid-run halt decision and are not persisted to the durable record
        // or the fitness ledger; they contribute to the final verdict only.
        const records = evaluateEvidenceExpectations(
          evidence,
          {
            readArtifact: (name) => this.readRunArtifact(preArtifacts, name),
            claimResolver: this.claimResolver,
          },
          { tier1Filter: (expectation) => expectation.source.kind !== "artifact" },
        );
        const record: CellExecutionRecord = {
          instanceId: durable.instanceId,
          seq: durable.nextSeq,
          cellId: evidence.cellId,
          // Executor-captured execution start; the gate-time fallback covers
          // executors that report no startedAt (it post-dates the execution).
          startedAt: evidence.startedAt ?? new Date().toISOString(),
          agentId: this.agentId,
          inputsDigest: durable.inputsDigest,
          status: evidence.status,
          expectations: records,
        };
        try {
          await this.storage.appendCellExecution(record);
          await this.storage.appendFitnessRows(
            this.ledgerRowsFromRecords(durable.template, durable.instanceId, records),
          );
        } catch (cause) {
          throw new RunbookPersistenceError(
            `durable cell-execution persistence failed for cell ${evidence.cellId} ` +
              `(seq ${record.seq}): ${errorMessage(cause)}`,
          );
        }
        durable.nextSeq += 1;
        durable.executions.push(record);
        durable.gatedCellIds.add(evidence.cellId);
        if (records.length > 0) durable.recordsByCell.set(evidence.cellId, records);
        return {
          records,
          disposition: isExecutionSatisfied(record) ? "continue" : "halt",
        };
      },
    };
  }

  /**
   * Run-end durable persistence for a gated run: the gate already wrote
   * executed cells' records and rows, so only ledger rows for cells the run
   * never reached (skipped expectations) remain.
   */
  private async finishDurableRun(
    durable: DurableRunContext,
    allRecords: ExpectationRecord[],
  ): Promise<void> {
    const remaining = allRecords.filter(
      (record) => !durable.gatedCellIds.has(record.cellId),
    );
    await this.storage.appendFitnessRows(
      this.ledgerRowsFromRecords(durable.template, durable.instanceId, remaining),
    );
  }

  /**
   * Legacy run-end persistence for raw runtime usage (no templateCellSource):
   * template version derived from evidence, instance created after the run,
   * one record per EXECUTED cell (skipped cells leave no record since B5),
   * and all ledger rows at once.
   */
  private async persistDurableRecords(args: {
    runId: string;
    notebookId: string;
    startedAt: string;
    inputs: Record<string, unknown>;
    evidence: CellExecutionEvidence[];
    records: ExpectationRecord[];
    outputsRef: string;
  }): Promise<void> {
    const { runId, notebookId, startedAt, inputs, evidence, records, outputsRef } = args;
    const cells =
      this.templateCellSource?.(notebookId) ?? templateCellsFromEvidence(evidence);

    // Concurrency-safe: a lost saveTemplate race against a concurrent run of
    // the same notebook reuses the winner's just-written version instead of
    // failing this run (Greptile PR #401 — TOCTOU in template versioning).
    const template = await ensureTemplateVersion(this.storage, {
      templateId: notebookId,
      cells,
      createdBy: this.agentId,
    });

    await this.storage.createInstance({
      instanceId: runId,
      templateId: notebookId,
      templateVersion: template.version,
      createdBy: this.agentId,
      createdAt: startedAt,
    });

    const recordsByCell = new Map<string, ExpectationRecord[]>();
    for (const record of records) {
      const list = recordsByCell.get(record.cellId);
      if (list) list.push(record);
      else recordsByCell.set(record.cellId, [record]);
    }

    const inputsDigest = hashJson(inputs);
    let seq = 0;
    for (const cell of evidence) {
      if (cell.status === "skipped") continue;
      seq += 1;
      await this.storage.appendCellExecution({
        instanceId: runId,
        seq,
        cellId: cell.cellId,
        // Per-cell execution start when the executor reported one; the run
        // start is the legacy-path fallback.
        startedAt: cell.startedAt ?? startedAt,
        agentId: this.agentId,
        inputsDigest,
        outputsRef,
        status: cell.status,
        expectations: recordsByCell.get(cell.cellId) ?? [],
      });
    }

    await this.storage.appendFitnessRows(
      this.ledgerRowsFromRecords(template, runId, records),
    );
  }

  /** One ledger row per machine-checked expectation evaluation (spec §7). */
  private ledgerRowsFromRecords(
    template: Pick<RunbookTemplate, "templateId" | "version">,
    instanceId: string,
    records: ExpectationRecord[],
  ): FitnessLedgerRow[] {
    const ts = new Date().toISOString();
    return records.map((record) => ({
      templateId: template.templateId,
      templateVersion: template.version,
      instanceId,
      cellId: record.cellId,
      tier: record.tier,
      result: record.result,
      pass: record.result === "pass",
      expected: record.expected,
      ...(record.actual !== undefined ? { actual: record.actual } : {}),
      ...(record.error !== undefined ? { error: record.error } : {}),
      agentId: this.agentId,
      ts,
    }));
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

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

interface VerdictDerivationContext {
  readArtifact: (name: string) => string | undefined;
  claimResolver?: ClaimStatusResolver;
  /**
   * Expectation records already evaluated (and persisted) by the per-cell
   * gate (B5): tier-2 and non-artifact tier-1. Authoritative for those —
   * the verdict must not re-evaluate them, or ledger and verdict could
   * diverge. The gate could not see post-run artifacts, so artifact-backed
   * tier-1 expectations are deferred; the verdict evaluates those alone (with
   * the full run artifacts) and appends them to the precomputed set.
   */
  precomputedRecords?: Map<string, ExpectationRecord[]>;
}

/**
 * Evaluate every declared expectation for one piece of cell evidence:
 * tier-2 records pre-computed by the executor's validator machinery, then
 * tier-1 records from the attached outcome contract. Shared by the per-cell
 * gate (halt decisions) and the verdict derivation (ungated cells).
 */
function evaluateEvidenceExpectations(
  cell: CellExecutionEvidence,
  context: Pick<VerdictDerivationContext, "readArtifact" | "claimResolver">,
  options?: {
    /** Only tier-1 contract expectations matching this predicate are evaluated. */
    tier1Filter?: (expectation: OutcomeExpectation) => boolean;
    /** Include tier-2 validator records (default true). */
    includeTier2?: boolean;
  },
): ExpectationRecord[] {
  const records: ExpectationRecord[] = [];
  if (cell.expectations && options?.includeTier2 !== false) {
    records.push(...cell.expectations);
  }
  if (cell.contract) {
    for (const expectation of cell.contract.contract.expectations) {
      if (options?.tier1Filter && !options.tier1Filter(expectation)) continue;
      records.push(
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
  return records;
}

/**
 * Derive the runbook verdict from real per-cell execution results
 * (SPEC-AGX-SUBSTRATE §5.1 outcome-contract semantics).
 *
 * With declared expectations (tier-1 contracts or tier-2 validators), the
 * verdict passes iff every declared expectation was evaluated and passed AND
 * no cell failed procedurally without being expectation-satisfied — a cell
 * that exits nonzero but whose every declared expectation passes is a
 * predicted failure and does not fail the run (§5.1 expected-failure rule,
 * B5); `skipped` and `error` expectations are never pass, and an
 * uncontracted crashed cell still fails the run.
 *
 * With ZERO declared expectations, the legacy procedural derivation applies
 * unchanged, but the verdict carries contractCoverage 0 and a reason marking
 * it as procedural-only so downstream fitness can exclude it: a passing
 * verdict must rest on at least one completed code cell — dependency
 * installation (package.json cells) is recorded as evidence but cannot verify
 * a runbook by itself, so blank notebooks cannot pass.
 *
 * Returns the verdict plus the flat list of per-expectation records so the
 * caller can flow them into durable instance records and fitness ledger rows
 * (B4b) without re-evaluating.
 */
function buildRunbookVerdict(
  evidence: CellExecutionEvidence[],
  context: VerdictDerivationContext,
): { verdict: NotebookOutput; records: ExpectationRecord[] } {
  const recordsByCell = new Map<string, ExpectationRecord[]>();
  const allRecords: ExpectationRecord[] = [];
  const coveredCellIds = new Set<string>();

  for (const cell of evidence) {
    const precomputed = context.precomputedRecords?.get(cell.cellId);
    // Precomputed gate records cover tier-2 and non-artifact tier-1 (the gate
    // could not see post-run artifacts). Evaluate the deferred artifact-backed
    // expectations now, with the full run artifacts available, and merge —
    // so an artifact assertion participates in the verdict instead of erroring
    // (Codex PR #402, P2). Cells without precomputed records (non-durable
    // runs) are evaluated whole here, where every artifact already exists.
    const cellRecords =
      precomputed !== undefined
        ? [
            ...precomputed,
            ...evaluateEvidenceExpectations(cell, context, {
              tier1Filter: (expectation) => expectation.source.kind === "artifact",
              includeTier2: false,
            }),
          ]
        : evaluateEvidenceExpectations(cell, context);
    if (cell.expectations && cell.validatorFor !== undefined) {
      coveredCellIds.add(cell.validatorFor);
    }
    if (cell.contract) {
      coveredCellIds.add(cell.cellId);
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

  // §5.1 expected-failure rule (B5): a failed cell whose every declared
  // expectation passed is expectation-satisfied and does not fail the run.
  const isPredictedFailure = (cell: CellExecutionEvidence): boolean => {
    if (cell.status !== "failed") return false;
    const cellRecords = recordsByCell.get(cell.cellId);
    return (
      cellRecords !== undefined &&
      cellRecords.length > 0 &&
      cellRecords.every((record) => record.result === "pass")
    );
  };
  const failed = evidence.filter(
    (cell) => cell.status === "failed" && !isPredictedFailure(cell),
  );
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
    verdict: {
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
    },
    records: allRecords,
  };
}

function truncate(text: string): string {
  if (text.length <= MAX_EVIDENCE_OUTPUT_CHARS) return text;
  return `${text.slice(0, MAX_EVIDENCE_OUTPUT_CHARS)}… [truncated]`;
}

/**
 * Degenerate template snapshot derived from execution evidence, used only
 * when no templateCellSource is wired (raw runtime usage). Cell identity,
 * contracts (with hashes), and validator markers survive; authored source is
 * not available at this layer, so prefer wiring a templateCellSource.
 */
function templateCellsFromEvidence(
  evidence: CellExecutionEvidence[],
): RunbookTemplateCell[] {
  return evidence.map((cell) => ({
    cellId: cell.cellId,
    cellType: cell.cellType,
    filename: cell.filename,
    source: "",
    ...(cell.contract !== undefined ? { contract: cell.contract } : {}),
    ...(cell.validatorFor !== undefined ? { validatorFor: cell.validatorFor } : {}),
  }));
}
