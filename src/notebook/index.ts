import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { NotebookStateManager } from "./state.js";
import type { Cell, CodeCell, CodeLanguage } from "./types.js";
import { randomid } from "./types.js";
import { ValidatorService } from "./validator.js";
import {
  compileOutcomeContract,
  expectationRecordFromValidation,
  erroredValidatorRecord,
  skippedValidatorRecord,
  verifyAttachedContract,
} from "./contracts.js";
import {
  InMemoryNotebookEngineRuntime,
  type CellExecutionEvidence,
  type CellExecutionGate,
} from "./engine/runtime.js";
import {
  hashTemplateCells,
  notebookFromTemplate,
  templateCellsFromNotebook,
  verifyTemplateContracts,
  type RunbookInstance,
  type RunbookStorage,
  type RunbookTemplate,
} from "./runbook/types.js";
import {
  deriveInstanceStatus,
  isExecutionSatisfied,
  nextUnsatisfiedCell,
} from "./runbook/ordering.js";
import {
  isAwaitClaimStatus,
  type AwaitClaimBinding,
  type AwaitClaimStatus,
} from "./runbook/await.js";
import { getNotebookCapabilitiesJson } from "./engine/registry.js";
import type { NotebookDocumentStorage } from "../persistence/notebook-document-storage.js";
import {
  NOTEBOOK_OPERATIONS,
  getOperation,
  getOperationNames,
  getOperationsCatalog,
} from "./operations.js";

// Re-export for use by server-factory
export { getOperationNames };

import { AVAILABLE_TEMPLATES } from "./templates.generated.js";

export interface NotebookHandlerOptions {
  /**
   * Durable runbook substrate (SPEC-AGX-SUBSTRATE B4b). Defaults to
   * InMemoryRunbookStorage inside the engine runtime; deployments inject
   * SupabaseRunbookStorage here.
   */
  runbookStorage?: RunbookStorage;
  /**
   * Durable notebook-document persistence behind notebook_persist
   * (spec H4). When absent, notebook_persist keeps its honest in-process
   * artifact behavior and reports persistence "in_memory". Local mode
   * injects FileSystemNotebookDocumentStorage; deployments inject
   * SupabaseNotebookDocumentStorage.
   */
  documentStorage?: NotebookDocumentStorage;
  /** Executing agent identity recorded on instances/executions/ledger rows. */
  agentId?: string;
  /**
   * B6: narrow claim read/subscribe surface for await cells (adapted from
   * ClaimStorage by createRunbookClaimBinding in src/claims). Without it,
   * await cells park with a "claim binding unavailable" reason.
   */
  claimBinding?: AwaitClaimBinding;
}

/**
 * Notebook Handler - MCP tool handlers for headless Srcbook notebooks
 */
export class NotebookHandler {
  private stateManager: NotebookStateManager;
  private validatorService: ValidatorService;
  private engineRuntime: InMemoryNotebookEngineRuntime;
  /** Agent identity recorded on instances created via notebook_instantiate. */
  private readonly agentId: string;
  /** Durable notebook-document backend; undefined = in-memory artifact only. */
  private readonly documentStorage: NotebookDocumentStorage | undefined;

  constructor(tempDir?: string, options: NotebookHandlerOptions = {}) {
    this.agentId = options.agentId ?? "local";
    this.documentStorage = options.documentStorage;
    this.stateManager = new NotebookStateManager(tempDir);
    this.validatorService = new ValidatorService(this.stateManager);
    this.engineRuntime = new InMemoryNotebookEngineRuntime(
      (notebookId, gate) => this.executeAllCells(notebookId, gate),
      undefined,
      {
        ...(options.runbookStorage !== undefined
          ? { storage: options.runbookStorage }
          : {}),
        ...(options.agentId !== undefined ? { agentId: options.agentId } : {}),
        ...(options.claimBinding !== undefined
          ? { claimBinding: options.claimBinding }
          : {}),
        templateCellSource: (notebookId) => {
          const notebook = this.stateManager.getNotebook(notebookId);
          return notebook ? templateCellsFromNotebook(notebook) : undefined;
        },
      },
    );
  }

  /** Durable runbook substrate behind the engine runtime (templates/instances/ledger). */
  getRunbookStorage(): RunbookStorage {
    return this.engineRuntime.storage;
  }

  /**
   * Execute every executable cell (package.json installs and code cells) in
   * document order through the real subprocess execution path, halting per
   * the B5 rule; cells after the halt are reported as skipped.
   *
   * Outcome-contract integration (SPEC-AGX-SUBSTRATE B4a + B5):
   * - Before anything executes, every attached tier-1 contract hash is
   *   re-verified (Ulysses pattern); a mismatch throws and rejects the run.
   * - Cells with `validatorFor` are tier-2 assertion cells: they run through
   *   the existing ValidatorService (snapshot+hash, sidecar verdict) against
   *   the target cell's structured output instead of executing as steps.
   * - Before each cell runs, the runtime gate's ordering assertion fires
   *   (§5: a rejected cell never executes) and the execution start time is
   *   captured onto the evidence for the durable record.
   * - After each executed cell, the runtime's gate evaluates its declared
   *   expectations, persists the durable record, and decides the halt: an
   *   expectation-satisfied predicted failure (nonzero exit, every declared
   *   expectation passes) CONTINUES; uncontracted failures and cells whose
   *   expectations fail or error halt — including unsatisfied assertion
   *   cells (§5 ordering: later cells cannot run past an unsatisfied cell).
   */
  private async executeAllCells(
    notebookId: string,
    gate?: CellExecutionGate,
  ): Promise<CellExecutionEvidence[]> {
    const notebook = this.stateManager.getNotebook(notebookId);
    if (!notebook) {
      throw new Error(`Notebook ${notebookId} not found`);
    }
    const executable = notebook.cells.filter(
      (cell: Cell): cell is Extract<Cell, { type: "code" | "package.json" | "await" }> =>
        cell.type === "code" || cell.type === "package.json" || cell.type === "await",
    );

    // Ulysses gate: re-verify every contract hash before executing anything.
    for (const cell of executable) {
      if (cell.type === "code" && cell.contract !== undefined) {
        verifyAttachedContract(cell.id, cell.contract);
      }
    }

    const evidence: CellExecutionEvidence[] = [];
    const structuredOutputByCell = new Map<string, string>();
    let halted = false;
    for (const cell of executable) {
      // Await cell (B6): pull-only claim evaluation — executes nothing.
      // Satisfied → recorded like any satisfied cell and the run continues;
      // unsatisfied → the run HALTS parked (skipped evidence, durable claim
      // subscription, NO execution record — the instance derives
      // "in_progress" and resumes later via tb.runbook.advance).
      if (cell.type === "await") {
        const condition = { claimId: cell.claimId, until: [...cell.until] };
        const filename = `await:${cell.claimId}`;
        if (halted) {
          evidence.push({
            cellId: cell.id,
            cellType: "await",
            filename,
            status: "skipped",
            exitCode: null,
            output: "",
            error: "",
          });
          continue;
        }
        gate?.assertExecutable(cell.id);
        const startedAt = new Date().toISOString();
        if (gate === undefined) {
          // Ungated raw runs have no claim access: park, never fail.
          evidence.push({
            cellId: cell.id,
            cellType: "await",
            filename,
            status: "skipped",
            exitCode: null,
            output: "",
            error:
              `instance parked: awaiting claim ${cell.claimId} — ` +
              `no durable gate/claim binding available in this run`,
          });
          halted = true;
          continue;
        }
        const evaluation = await gate.evaluateAwait(cell.id, condition);
        if (evaluation.satisfied) {
          const cellEvidence: CellExecutionEvidence = {
            cellId: cell.id,
            cellType: "await",
            filename,
            startedAt,
            status: "completed",
            exitCode: null,
            output: String(evaluation.record.actual ?? ""),
            error: "",
            expectations: [evaluation.record],
          };
          evidence.push(cellEvidence);
          const { disposition } = await gate.record(cellEvidence);
          if (disposition === "halt") halted = true;
          continue;
        }
        // Parked: skipped evidence carrying the evaluation record (for the
        // verdict), durable subscription (only when the claim exists — a
        // missing claim cannot be subscribed to), and NO gate.record call.
        evidence.push({
          cellId: cell.id,
          cellType: "await",
          filename,
          startedAt,
          status: "skipped",
          exitCode: null,
          output: "",
          error: evaluation.record.error ?? "instance parked at await cell",
          expectations: [evaluation.record],
        });
        if (evaluation.currentStatus !== null) {
          await gate.park(cell.id, condition);
        }
        halted = true;
        continue;
      }
      const validatorFor = cell.type === "code" ? cell.validatorFor : undefined;
      if (halted) {
        evidence.push({
          cellId: cell.id,
          cellType: cell.type,
          filename: cell.filename,
          status: "skipped",
          exitCode: null,
          output: "",
          error: "",
          ...(cell.type === "code" && cell.contract !== undefined
            ? { contract: cell.contract }
            : {}),
          ...(validatorFor !== undefined
            ? {
                validatorFor,
                expectations: [skippedValidatorRecord(cell.id, validatorFor)],
              }
            : {}),
        });
        continue;
      }
      // Ordering is enforced BEFORE the cell runs (spec §5): a rejected cell
      // never executes, so an ordering failure cannot drop the durable
      // record of a cell that already ran.
      gate?.assertExecutable(cell.id);
      const startedAt = new Date().toISOString();
      let cellEvidence: CellExecutionEvidence;
      if (cell.type === "code" && validatorFor !== undefined) {
        cellEvidence = {
          ...(await this.runValidatorCell(notebookId, cell, structuredOutputByCell)),
          startedAt,
        };
      } else {
        const result = await this.stateManager.executeCell(notebookId, cell.id);
        if (cell.type === "code" && result.structuredOutput !== undefined) {
          structuredOutputByCell.set(cell.id, result.structuredOutput);
        }
        cellEvidence = {
          cellId: cell.id,
          cellType: cell.type,
          filename: cell.filename,
          startedAt,
          status: result.success ? "completed" : "failed",
          exitCode: result.exitCode,
          output: result.stdout,
          error: result.stderr,
          ...(result.structuredOutput !== undefined
            ? { structuredOutput: result.structuredOutput }
            : {}),
          ...(cell.type === "code" && cell.contract !== undefined
            ? { contract: cell.contract }
            : {}),
        };
      }
      evidence.push(cellEvidence);
      if (gate) {
        const { disposition } = await gate.record(cellEvidence);
        if (disposition === "halt") halted = true;
      } else if (validatorFor === undefined && cellEvidence.status === "failed") {
        // Ungated fallback (raw runtime usage): halt on procedural failure.
        halted = true;
      }
    }
    return evidence;
  }

  /**
   * Run a tier-2 validator cell through the existing ValidatorService against
   * the target cell's structured output (TB_OUTPUT_PATH sidecar). The stored
   * authoring-time snapshot hash is passed as the expected hash, so a
   * post-attach edit of the validator source surfaces as a
   * snapshot_hash_mismatch — an `error` expectation, never a pass.
   */
  private async runValidatorCell(
    notebookId: string,
    cell: Extract<Cell, { type: "code" }>,
    structuredOutputByCell: Map<string, string>,
  ): Promise<CellExecutionEvidence> {
    const targetCellId = cell.validatorFor!;
    const base = {
      cellId: cell.id,
      cellType: "code" as const,
      filename: cell.filename,
      validatorFor: targetCellId,
    };

    const observedRaw = structuredOutputByCell.get(targetCellId);
    if (observedRaw === undefined) {
      return {
        ...base,
        status: "completed",
        exitCode: null,
        output: "",
        error: "",
        expectations: [
          erroredValidatorRecord(
            cell.id,
            targetCellId,
            `target cell ${targetCellId} wrote no structured output (TB_OUTPUT_PATH)`,
          ),
        ],
      };
    }

    let observed: unknown;
    try {
      observed = JSON.parse(observedRaw);
    } catch (error) {
      return {
        ...base,
        status: "completed",
        exitCode: null,
        output: "",
        error: "",
        expectations: [
          erroredValidatorRecord(
            cell.id,
            targetCellId,
            `target cell ${targetCellId} structured output is not valid JSON: ${
              error instanceof Error ? error.message : String(error)
            }`,
          ),
        ],
      };
    }

    const binding = await this.validatorService.bind(notebookId, cell.id);
    const runOptions =
      cell.validatorSnapshotHash !== undefined
        ? { expectedSnapshotHash: cell.validatorSnapshotHash }
        : {};
    const result = await this.validatorService.run(binding, observed, runOptions);
    const record = expectationRecordFromValidation({
      validatorCellId: cell.id,
      targetCellId,
      result,
    });
    // Machinery errors (snapshot_hash_mismatch, validator_crash, ...) can
    // produce no stderr — no subprocess ever launched. Fall back to the
    // expectation record's reason so the run verdict carries the real
    // diagnostic instead of an empty trailer.
    const error =
      result.stderr !== ""
        ? result.stderr
        : record.result === "error"
          ? (record.error ?? "")
          : "";
    return {
      ...base,
      status: record.result === "error" ? "failed" : "completed",
      exitCode: result.exitCode,
      output: result.stdout,
      error,
      expectations: [record],
    };
  }

  /**
   * Expose the ValidatorService so in-process callers (e.g. the Ulysses
   * handler) can bind/run validators without a MCP roundtrip.
   */
  getValidatorService(): ValidatorService {
    return this.validatorService;
  }

  /**
   * Read-only notebook lookup for in-process callers; peer notebook
   * graduation reads manifest cell text through this without executing code.
   */
  getNotebook(notebookId: string) {
    return this.stateManager.getNotebook(notebookId);
  }

  async init(): Promise<void> {
    await this.stateManager.init();
  }

  /**
   * Handle notebook_create tool call
   */
  async handleCreateNotebook(args: any): Promise<any> {
    const { title, language, template } = args;

    if (!title || typeof title !== "string") {
      throw new Error("title is required and must be a string");
    }

    if (!language || (language !== "javascript" && language !== "typescript")) {
      throw new Error('language must be "javascript" or "typescript"');
    }

    // Validate template parameter if provided
    if (template !== undefined) {
      if (typeof template !== "string") {
        throw new Error("template must be a string");
      }
      if (!AVAILABLE_TEMPLATES.includes(template as any)) {
        throw new Error(
          `Invalid template: "${template}". Available templates: ${AVAILABLE_TEMPLATES.join(", ")}`
        );
      }
    }

    let notebook: any;

    // Create from template if provided
    if (template) {
      notebook = await this.stateManager.createNotebookFromTemplate(
        title,
        language as CodeLanguage,
        template
      );
    } else {
      // Create blank notebook
      notebook = await this.stateManager.createNotebook(
        title,
        language as CodeLanguage
      );
    }

    return {
      success: true,
      notebook: {
        id: notebook.id,
        title: notebook.cells.find((c: Cell) => c.type === "title")?.text || title,
        language: notebook.language,
        cellCount: notebook.cells.length,
        createdAt: notebook.createdAt,
      },
    };
  }

  /**
   * Handle notebook_list tool call
   */
  async handleListNotebooks(): Promise<any> {
    const notebooks = this.stateManager.listNotebooks();

    return {
      success: true,
      notebooks: notebooks.map((nb) => ({
        id: nb.id,
        title: nb.cells.find((c) => c.type === "title")?.text || "Untitled",
        language: nb.language,
        cellCount: nb.cells.length,
        createdAt: nb.createdAt,
        updatedAt: nb.updatedAt,
      })),
    };
  }

  /**
   * Handle notebook_load tool call.
   *
   * Sources (exactly one): `path` (filesystem .src.md), `content` (raw
   * .src.md string), or `notebookId` (restore a document persisted via
   * notebook_persist through the configured durable backend — the notebook
   * re-materializes under its ORIGINAL id, so persist → restart → load
   * round-trips identity).
   */
  async handleLoadNotebook(args: any): Promise<any> {
    const { path, content, notebookId } = args;

    // Validate: exactly one source required
    const hasPath = path !== undefined && typeof path === "string";
    const hasContent = content !== undefined && typeof content === "string";
    const hasNotebookId = notebookId !== undefined && typeof notebookId === "string";

    const sourceCount = [hasPath, hasContent, hasNotebookId].filter(Boolean).length;
    if (sourceCount === 0) {
      throw new Error(
        "One of 'path', 'content', or 'notebookId' (persisted restore) is required",
      );
    }
    if (sourceCount > 1) {
      throw new Error(
        "Provide exactly one of 'path', 'content', or 'notebookId'. Choose one.",
      );
    }

    let notebook;
    let restored = false;
    if (hasNotebookId) {
      if (!this.documentStorage) {
        throw new Error(
          "No durable notebook persistence is configured; load by 'path' or 'content' instead",
        );
      }
      const doc = await this.documentStorage.load(notebookId);
      if (!doc) {
        throw new Error(
          `No persisted notebook ${notebookId} found in ${this.documentStorage.backend} storage`,
        );
      }
      notebook = await this.stateManager.loadNotebook(
        { content: doc.content },
        { id: doc.notebookId },
      );
      restored = true;
    } else {
      notebook = await this.stateManager.loadNotebook(hasPath ? { path } : { content });
    }

    return {
      success: true,
      ...(restored ? { restoredFrom: this.documentStorage!.backend } : {}),
      notebook: {
        id: notebook.id,
        title: notebook.cells.find((c) => c.type === "title")?.text || "Untitled",
        language: notebook.language,
        cellCount: notebook.cells.length,
        createdAt: notebook.createdAt,
      },
    };
  }

  /**
   * Handle notebook_add_cell tool call
   */
  async handleAddCell(args: any): Promise<any> {
    const { notebookId, cellType, content, filename, position, contract, validatorFor } =
      args;

    if (!notebookId || typeof notebookId !== "string") {
      throw new Error("notebookId is required and must be a string");
    }

    if (!cellType || typeof cellType !== "string") {
      throw new Error("cellType is required and must be a string");
    }

    const notebook = this.stateManager.getNotebook(notebookId);
    if (!notebook) {
      throw new Error(`Notebook ${notebookId} not found`);
    }

    if ((contract !== undefined || validatorFor !== undefined) && cellType !== "code") {
      throw new Error("contract and validatorFor are only valid on code cells");
    }

    let cell: Cell;

    switch (cellType) {
      case "title":
        if (!content) throw new Error("content is required for title cells");
        cell = {
          id: randomid(),
          type: "title",
          text: content,
        };
        break;

      case "markdown":
        if (!content) throw new Error("content is required for markdown cells");
        cell = {
          id: randomid(),
          type: "markdown",
          text: content,
        };
        break;

      case "code": {
        if (!content) throw new Error("content is required for code cells");
        if (!filename) throw new Error("filename is required for code cells");
        if (contract !== undefined && validatorFor !== undefined) {
          throw new Error(
            "a cell declares either a tier-1 contract or validatorFor, not both",
          );
        }
        if (validatorFor !== undefined) {
          if (typeof validatorFor !== "string" || validatorFor.length === 0) {
            throw new Error("validatorFor must be a non-empty cell id");
          }
          const target = notebook.cells.find((c: Cell) => c.id === validatorFor);
          if (!target || target.type !== "code") {
            throw new Error(
              `validatorFor target ${validatorFor} not found or not a code cell`,
            );
          }
          if (target.validatorFor !== undefined) {
            throw new Error(
              `validatorFor target ${validatorFor} is itself a validator cell; ` +
                "validators never write structured output, so chained validators " +
                "always error at run time — target a subject cell instead",
            );
          }
          // Cells execute in document order, so a validator inserted before
          // its target would always run before any output exists.
          const targetIndex = notebook.cells.findIndex(
            (c: Cell) => c.id === validatorFor,
          );
          const insertionIndex =
            typeof position === "number" &&
            position >= 0 &&
            position <= notebook.cells.length
              ? position
              : notebook.cells.length;
          if (insertionIndex <= targetIndex) {
            throw new Error(
              `validator cell would be inserted at position ${insertionIndex}, at or ` +
                `before its target ${validatorFor} (position ${targetIndex}); cells run ` +
                "in document order, so the validator must come after its target",
            );
          }
        }
        // Parse-only compile path: extract → zod → canonicalize → sha256.
        // Throws ContractCompileError with the offending issues on bad input.
        const attached =
          contract !== undefined ? compileOutcomeContract(contract) : undefined;
        cell = {
          id: randomid(),
          type: "code",
          language: notebook.language,
          filename,
          source: content,
          status: "idle",
          ...(attached !== undefined ? { contract: attached } : {}),
          ...(validatorFor !== undefined ? { validatorFor } : {}),
        };
        break;
      }

      case "await": {
        // B6 authoring: an await cell binds the runbook to a claim predicate.
        const { claimId, until } = args;
        if (!claimId || typeof claimId !== "string") {
          throw new Error("claimId is required for await cells");
        }
        const untilArray: unknown[] = Array.isArray(until)
          ? until
          : typeof until === "string"
            ? [until]
            : [];
        if (untilArray.length === 0) {
          throw new Error(
            'until is required for await cells: one or more claim statuses of "asserted", "supported", "invalidated", "superseded"',
          );
        }
        const untilStatuses: AwaitClaimStatus[] = [];
        for (const status of untilArray) {
          if (!isAwaitClaimStatus(status)) {
            throw new Error(
              `invalid await status ${JSON.stringify(status)}: must be one of ` +
                '"asserted", "supported", "invalidated", "superseded"',
            );
          }
          untilStatuses.push(status);
        }
        cell = {
          id: randomid(),
          type: "await",
          claimId,
          until: untilStatuses,
        };
        break;
      }

      default:
        throw new Error(`Unsupported cell type: ${cellType}`);
    }

    await this.stateManager.addCell(notebookId, cell, position);

    // Tier-2 binding at authoring (Ulysses pattern): snapshot the validator
    // cell now; the hash is re-checked by ValidatorService at run time.
    if (cell.type === "code" && cell.validatorFor !== undefined) {
      const binding = await this.validatorService.bind(notebookId, cell.id);
      await this.stateManager.updateCell(notebookId, cell.id, {
        validatorSnapshotHash: binding.snapshotHash,
      });
    }

    const codeCell = cell.type === "code" ? (cell as CodeCell) : undefined;
    return {
      success: true,
      cell: {
        id: cell.id,
        type: cell.type,
        ...(codeCell?.contract !== undefined
          ? { contractHash: codeCell.contract.contractHash }
          : {}),
        ...(codeCell?.validatorFor !== undefined
          ? { validatorFor: codeCell.validatorFor }
          : {}),
        ...(cell.type === "await"
          ? { claimId: cell.claimId, until: cell.until }
          : {}),
      },
    };
  }

  /**
   * Handle notebook_update_cell tool call
   */
  async handleUpdateCell(args: any): Promise<any> {
    const { notebookId, cellId, content } = args;

    if (!notebookId || typeof notebookId !== "string") {
      throw new Error("notebookId is required and must be a string");
    }

    if (!cellId || typeof cellId !== "string") {
      throw new Error("cellId is required and must be a string");
    }

    if (!content || typeof content !== "string") {
      throw new Error("content is required and must be a string");
    }

    const cell = this.stateManager.getCell(notebookId, cellId);
    if (!cell) {
      throw new Error(`Cell ${cellId} not found in notebook ${notebookId}`);
    }

    if (cell.type === "await") {
      throw new Error(
        "await cells have no content to update; remove and re-add the cell " +
          "to change its claim binding",
      );
    }

    const updates: any = {};
    if (cell.type === "title" || cell.type === "markdown") {
      updates.text = content;
    } else if (cell.type === "code" || cell.type === "package.json") {
      updates.source = content;
    }

    await this.stateManager.updateCell(notebookId, cellId, updates);

    return {
      success: true,
      cell: {
        id: cellId,
        type: cell.type,
      },
    };
  }

  /**
   * Handle notebook_run_cell tool call. With `instanceId`, execution is
   * instance-aware: ordered per the pinned template (B5).
   */
  async handleRunCell(args: any): Promise<any> {
    const { notebookId, cellId, instanceId } = args;

    if (!notebookId || typeof notebookId !== "string") {
      throw new Error("notebookId is required and must be a string");
    }

    if (!cellId || typeof cellId !== "string") {
      throw new Error("cellId is required and must be a string");
    }

    if (instanceId !== undefined) {
      if (typeof instanceId !== "string" || instanceId.length === 0) {
        throw new Error("instanceId must be a non-empty string if provided");
      }
      return await this.runInstanceCell(notebookId, cellId, instanceId);
    }

    const result = await this.stateManager.executeCell(notebookId, cellId);

    return {
      success: result.success,
      execution: {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        success: result.success,
      },
    };
  }

  /**
   * Instance-aware single-cell execution (SPEC-AGX-SUBSTRATE B5 — spec §5
   * "Ordering"). Only the next unsatisfied cell of the pinned template may
   * execute; out-of-order attempts throw OutOfOrderExecutionError naming the
   * expected next cell. The execution appends an immutable record and its
   * ledger rows; `success` reports B5 satisfaction, so an expectation-
   * satisfied predicted failure is a success.
   */
  private async runInstanceCell(
    notebookId: string,
    cellId: string,
    instanceId: string,
  ): Promise<any> {
    const notebook = this.stateManager.getNotebook(notebookId);
    if (!notebook) {
      throw new Error(`Notebook ${notebookId} not found`);
    }
    const result = await this.engineRuntime.executeInstanceCell({
      instanceId,
      cellId,
      expectedTemplateId: notebookId,
      liveCells: templateCellsFromNotebook(notebook),
      executeCell: async (id) => {
        const execution = await this.stateManager.executeCell(notebookId, id);
        return {
          status: execution.success ? ("completed" as const) : ("failed" as const),
          exitCode: execution.exitCode,
          stdout: execution.stdout,
          stderr: execution.stderr,
          ...(execution.structuredOutput !== undefined
            ? { structuredOutput: execution.structuredOutput }
            : {}),
        };
      },
    });
    return {
      success: result.satisfied,
      execution: {
        stdout: result.execution.stdout,
        stderr: result.execution.stderr,
        exitCode: result.execution.exitCode,
        success: result.status === "completed",
      },
      instance: {
        instanceId: result.instanceId,
        seq: result.seq,
        cellId: result.cellId,
        satisfied: result.satisfied,
        status: result.instanceStatus,
        nextCellId: result.nextCellId,
        expectations: result.expectations,
      },
    };
  }

  /**
   * Handle notebook_install_deps tool call
   */
  async handleInstallDeps(args: any): Promise<any> {
    const { notebookId } = args;

    if (!notebookId || typeof notebookId !== "string") {
      throw new Error("notebookId is required and must be a string");
    }

    const notebook = this.stateManager.getNotebook(notebookId);
    if (!notebook) {
      throw new Error(`Notebook ${notebookId} not found`);
    }

    // Find package.json cell
    const pkgCell = notebook.cells.find((c) => c.type === "package.json");
    if (!pkgCell) {
      throw new Error("No package.json cell found in notebook");
    }

    const result = await this.stateManager.executeCell(notebookId, pkgCell.id);

    return {
      success: result.success,
      execution: {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        success: result.success,
      },
    };
  }

  /**
   * Handle notebook_list_cells tool call
   */
  async handleListCells(args: any): Promise<any> {
    const { notebookId } = args;

    if (!notebookId || typeof notebookId !== "string") {
      throw new Error("notebookId is required and must be a string");
    }

    const notebook = this.stateManager.getNotebook(notebookId);
    if (!notebook) {
      throw new Error(`Notebook ${notebookId} not found`);
    }

    return {
      success: true,
      cells: notebook.cells.map((cell) => {
        const base = {
          id: cell.id,
          type: cell.type,
        };

        if (cell.type === "title" || cell.type === "markdown") {
          return { ...base, text: cell.text };
        } else if (cell.type === "code") {
          return {
            ...base,
            filename: cell.filename,
            language: cell.language,
            status: cell.status,
            hasOutput: !!cell.output,
            hasError: !!cell.error,
          };
        } else if (cell.type === "package.json") {
          return {
            ...base,
            filename: cell.filename,
            status: cell.status,
          };
        } else if (cell.type === "await") {
          return {
            ...base,
            claimId: cell.claimId,
            until: cell.until,
          };
        }
        return base;
      }),
    };
  }

  /**
   * Handle runbook_advance (tb.runbook.advance — SPEC-AGX-SUBSTRATE B8,
   * claim c4). Pull-based: evaluates the next unsatisfied cell(s) of the
   * instance's pinned template — await cells against their subscribed
   * claim's CURRENT status, exec cells through the real execution path
   * behind the GH #403 CAS reservation. The notebook id is derived from the
   * instance (templateId IS the notebook id); when the notebook is not
   * loaded in this session, awaits still advance but reaching an exec cell
   * asks the caller to load the notebook first.
   */
  async handleAdvance(args: any): Promise<any> {
    const { instanceId, maxCells, force } = args;
    if (!instanceId || typeof instanceId !== "string") {
      throw new Error("instanceId is required and must be a string");
    }
    if (maxCells !== undefined && (!Number.isInteger(maxCells) || maxCells < 1)) {
      throw new Error("maxCells must be a positive integer if provided");
    }
    if (force !== undefined && typeof force !== "boolean") {
      throw new Error("force must be a boolean if provided");
    }
    const instance = await this.engineRuntime.storage.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Runbook instance ${instanceId} not found`);
    }
    const notebookId = instance.templateId;
    const notebook = this.stateManager.getNotebook(notebookId);

    const result = await this.engineRuntime.advanceInstance({
      instanceId,
      expectedTemplateId: notebookId,
      ...(notebook !== null && notebook !== undefined
        ? {
            liveCells: templateCellsFromNotebook(notebook),
            executeCell: async (id: string) => {
              const execution = await this.stateManager.executeCell(notebookId, id);
              return {
                status: execution.success
                  ? ("completed" as const)
                  : ("failed" as const),
                exitCode: execution.exitCode,
                stdout: execution.stdout,
                stderr: execution.stderr,
                ...(execution.structuredOutput !== undefined
                  ? { structuredOutput: execution.structuredOutput }
                  : {}),
              };
            },
          }
        : {}),
      ...(maxCells !== undefined ? { maxCells } : {}),
      ...(force !== undefined ? { force } : {}),
    });
    return { success: true, advance: result };
  }

  /**
   * Handle runbook_status (tb.runbook.status): read-only snapshot of an
   * instance — derived status, next unsatisfied cell, execution records,
   * pending advance reservations, and (when the next cell is an await) the
   * claim it blocks on. Safe to call from a fresh session with only the
   * instance id (claim c5's resume entry point).
   */
  async handleInstanceStatus(args: any): Promise<any> {
    const { instanceId } = args;
    if (!instanceId || typeof instanceId !== "string") {
      throw new Error("instanceId is required and must be a string");
    }
    const storage = this.engineRuntime.storage;
    const instance = await storage.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Runbook instance ${instanceId} not found`);
    }
    const template = await storage.getTemplate(
      instance.templateId,
      instance.templateVersion,
    );
    if (!template) {
      throw new Error(
        `template ${instance.templateId} version ${instance.templateVersion} ` +
          `not found for instance ${instanceId}`,
      );
    }
    const executions = await storage.listCellExecutions(instanceId);
    const reservations = await storage.listAdvanceReservations(instanceId);
    const maxExecutedSeq = executions.reduce(
      (max, prior) => Math.max(max, prior.seq),
      0,
    );
    const nextCellId = nextUnsatisfiedCell(template, executions);
    const nextCell =
      nextCellId !== null
        ? template.cells.find((cell) => cell.cellId === nextCellId)
        : undefined;
    return {
      success: true,
      instance: {
        instanceId,
        templateId: instance.templateId,
        templateVersion: instance.templateVersion,
        status: deriveInstanceStatus(template, executions),
        nextCellId,
        ...(nextCell?.cellType === "await" && nextCell.awaitClaim !== undefined
          ? { awaiting: nextCell.awaitClaim }
          : {}),
        executions: executions.map((record) => ({
          seq: record.seq,
          cellId: record.cellId,
          status: record.status,
          agentId: record.agentId,
          startedAt: record.startedAt,
          expectations: record.expectations,
        })),
        pendingReservations: reservations
          .filter((r) => r.seq > maxExecutedSeq)
          .map((r) => ({
            seq: r.seq,
            cellId: r.cellId,
            agentId: r.agentId,
            reservedAt: r.reservedAt,
          })),
      },
    };
  }

  /**
   * Handle notebook_get_cell tool call
   */
  async handleGetCell(args: any): Promise<any> {
    const { notebookId, cellId } = args;

    if (!notebookId || typeof notebookId !== "string") {
      throw new Error("notebookId is required and must be a string");
    }

    if (!cellId || typeof cellId !== "string") {
      throw new Error("cellId is required and must be a string");
    }

    const cell = this.stateManager.getCell(notebookId, cellId);
    if (!cell) {
      throw new Error(`Cell ${cellId} not found in notebook ${notebookId}`);
    }

    return {
      success: true,
      cell,
    };
  }

  /**
   * Handle notebook_validate tool call.
   *
   * Snapshots the cell at call time and runs it against `observed` in a
   * disposable temp dir. The cell's verdict (sidecar JSON file) drives the
   * result — stdout is captured for audit only.
   */
  async handleValidate(args: any): Promise<any> {
    const { notebookId, cellId, observed, expectedSnapshotHash } = args;

    if (!notebookId || typeof notebookId !== "string") {
      throw new Error("notebookId is required and must be a string");
    }
    if (!cellId || typeof cellId !== "string") {
      throw new Error("cellId is required and must be a string");
    }
    if (!("observed" in args)) {
      throw new Error("observed is required");
    }
    if (
      expectedSnapshotHash !== undefined &&
      typeof expectedSnapshotHash !== "string"
    ) {
      throw new Error("expectedSnapshotHash must be a string if provided");
    }

    const binding = await this.validatorService.bind(notebookId, cellId);
    const result = await this.validatorService.run(binding, observed, {
      expectedSnapshotHash,
    });

    // Flatten to match the published schema in NOTEBOOK_OPERATIONS:
    // top-level pass/reason/evidence/snapshotHash/hashMatched/exitCode/stdout/stderr.
    return {
      pass: result.pass,
      reason: result.reason,
      ...(result.evidence !== undefined ? { evidence: result.evidence } : {}),
      snapshotHash: result.snapshotHash,
      hashMatched: result.hashMatched,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      binding: {
        notebookId: binding.notebookId,
        cellId: binding.cellId,
        snapshotHash: binding.snapshotHash,
      },
    };
  }

  /**
   * Handle notebook_persist tool call.
   *
   * Always stores the exported notebook as an in-process artifact (replay
   * within this process). With a durable document backend configured
   * (FileSystemNotebookDocumentStorage locally,
   * SupabaseNotebookDocumentStorage deployed), the document additionally
   * persists durably — upsert by notebookId, latest wins — and the response
   * reports that backend as `persistence`. Without one, the honest label
   * stays "in_memory". Restore across restarts with
   * `notebook_load { notebookId }`.
   */
  async handlePersist(args: any): Promise<any> {
    const { notebookId } = args;
    if (!notebookId || typeof notebookId !== "string") {
      throw new Error("notebookId is required and must be a string");
    }
    const notebook = this.stateManager.getNotebook(notebookId);
    if (!notebook) {
      throw new Error(`Notebook ${notebookId} not found`);
    }
    const content = await this.stateManager.exportNotebook(notebookId);
    const artifactResult = await import("effect").then(({ Effect }) =>
      Effect.runPromise(this.engineRuntime.persistNotebook(notebookId, content)),
    );
    if (!this.documentStorage) {
      return artifactResult;
    }
    const persistedAt = new Date().toISOString();
    await this.documentStorage.save({
      notebookId,
      title:
        notebook.cells.find((c: Cell) => c.type === "title")?.text ?? "Untitled",
      language: notebook.language,
      content,
      persistedAt,
    });
    return {
      ...artifactResult,
      persistence: this.documentStorage.backend,
      persistedAt,
    };
  }

  /**
   * Handle notebook_start_run tool call.
   */
  async handleStartRun(args: any): Promise<any> {
    const { notebookId, mode, inputs } = args;
    if (!notebookId || typeof notebookId !== "string") {
      throw new Error("notebookId is required and must be a string");
    }
    if (!mode || typeof mode !== "string") {
      throw new Error("mode is required and must be a string");
    }
    if (inputs !== undefined && (typeof inputs !== "object" || inputs === null || Array.isArray(inputs))) {
      throw new Error("inputs must be an object if provided");
    }
    if (!this.stateManager.getNotebook(notebookId)) {
      throw new Error(`Notebook ${notebookId} not found`);
    }

    return await import("effect").then(({ Effect }) =>
      Effect.runPromise(
        this.engineRuntime.startRun({
          notebookId,
          mode: mode as any,
          inputs,
        }),
      ),
    );
  }

  async handleGetRun(args: any): Promise<any> {
    const { runId } = args;
    if (!runId || typeof runId !== "string") {
      throw new Error("runId is required and must be a string");
    }
    const run = this.engineRuntime.getRun(runId);
    if (!run) {
      throw new Error(`Notebook run ${runId} not found`);
    }
    return { success: true, run };
  }

  async handleListRuns(args: any): Promise<any> {
    const { notebookId } = args;
    if (notebookId !== undefined && typeof notebookId !== "string") {
      throw new Error("notebookId must be a string if provided");
    }
    return { success: true, runs: this.engineRuntime.listRuns(notebookId) };
  }

  async handleCancelRun(args: any): Promise<any> {
    const { runId, reason } = args;
    if (!runId || typeof runId !== "string") {
      throw new Error("runId is required and must be a string");
    }
    if (reason !== undefined && typeof reason !== "string") {
      throw new Error("reason must be a string if provided");
    }
    const run = this.engineRuntime.cancelRun(runId, reason);
    if (!run) {
      throw new Error(`Notebook run ${runId} not found`);
    }
    return { success: true, run };
  }

  /**
   * Handle notebook_fitness tool call (SPEC-AGX-SUBSTRATE §7 read path).
   *
   * Reads the fitness ledger for a runbook template and returns per-version
   * aggregates. Only machine-checked expectation evaluations contribute —
   * pass rate counts rows that reached a pass/fail verdict; error and
   * skipped rows are carried separately and never inflate it.
   */
  async handleFitness(args: any): Promise<any> {
    const { templateId, templateVersion, includeRows } = args;
    if (!templateId || typeof templateId !== "string") {
      throw new Error("templateId is required and must be a string");
    }
    if (
      templateVersion !== undefined &&
      (!Number.isInteger(templateVersion) || templateVersion < 1)
    ) {
      throw new Error("templateVersion must be a positive integer if provided");
    }
    if (includeRows !== undefined && typeof includeRows !== "boolean") {
      throw new Error("includeRows must be a boolean if provided");
    }

    const storage = this.engineRuntime.storage;
    const versions = await storage.listTemplateVersions(templateId);
    if (versions.length === 0) {
      throw new Error(
        `No template versions recorded for ${templateId} — run the notebook ` +
          `(notebook_start_run) to version its cells and accrue fitness first`,
      );
    }
    if (templateVersion !== undefined && !versions.includes(templateVersion)) {
      throw new Error(
        `Template ${templateId} has no version ${templateVersion}; ` +
          `recorded versions: ${versions.join(", ")}`,
      );
    }

    const targetVersions = templateVersion !== undefined ? [templateVersion] : versions;
    const aggregates = [];
    for (const version of targetVersions) {
      aggregates.push(await storage.getFitnessAggregate(templateId, version));
    }

    const result: any = { success: true, templateId, versions, aggregates };
    if (includeRows === true) {
      result.rows = await storage.listFitnessRows(templateId, templateVersion);
    }
    return result;
  }

  async handleGetArtifact(args: any): Promise<any> {
    const { artifactId } = args;
    if (!artifactId || typeof artifactId !== "string") {
      throw new Error("artifactId is required and must be a string");
    }
    const artifact = this.engineRuntime.getArtifact(artifactId);
    if (!artifact) {
      throw new Error(`Notebook artifact ${artifactId} not found`);
    }
    return { success: true, artifact: artifact.ref, content: artifact.content };
  }

  /**
   * Handle notebook_instantiate tool call (SPEC-AGX-SUBSTRATE claim c5 —
   * fresh-session instantiation and resumption, Experiment H2).
   *
   * Two shapes:
   * - `{ templateId, templateVersion? }` — reconstruct the notebook from the
   *   persisted template (latest version unless pinned) and create a NEW
   *   instance pinning that version.
   * - `{ instanceId }` — RESUME an existing instance: load its pinned
   *   template version, reconstruct the notebook, and report the derived
   *   status plus the next unsatisfied cell. No new instance is created and
   *   no context beyond the instance id is required.
   *
   * The reconstructed notebook's id equals the templateId, so subsequent
   * `notebook_run_cell { notebookId, cellId, instanceId }` calls execute
   * through the ordered, append-only instance path unchanged. Contract
   * hashes are re-verified on load (Ulysses pattern); if a notebook with
   * that id is already loaded, its cells must hash-match the pinned
   * template version or the call is rejected as drift.
   */
  async handleInstantiate(args: any): Promise<any> {
    const { templateId, templateVersion, instanceId } = args;
    if (instanceId !== undefined && (typeof instanceId !== "string" || !instanceId)) {
      throw new Error("instanceId must be a non-empty string if provided");
    }
    if (templateId !== undefined && (typeof templateId !== "string" || !templateId)) {
      throw new Error("templateId must be a non-empty string if provided");
    }
    if (
      templateVersion !== undefined &&
      (!Number.isInteger(templateVersion) || templateVersion < 1)
    ) {
      throw new Error("templateVersion must be a positive integer if provided");
    }
    if (templateId === undefined && instanceId === undefined) {
      throw new Error(
        "Either templateId (new instance) or instanceId (resume) is required",
      );
    }

    const storage = this.engineRuntime.storage;
    let template: RunbookTemplate | null;
    let instance: RunbookInstance | null = null;

    if (instanceId !== undefined) {
      instance = await storage.getInstance(instanceId);
      if (!instance) {
        throw new Error(`Runbook instance ${instanceId} not found`);
      }
      if (templateId !== undefined && instance.templateId !== templateId) {
        throw new Error(
          `Instance ${instanceId} belongs to template ${instance.templateId}, ` +
            `not ${templateId}`,
        );
      }
      template = await storage.getTemplate(instance.templateId, instance.templateVersion);
      if (!template) {
        throw new Error(
          `Template ${instance.templateId} version ${instance.templateVersion} ` +
            `not found for instance ${instanceId}`,
        );
      }
    } else {
      template =
        templateVersion !== undefined
          ? await storage.getTemplate(templateId, templateVersion)
          : await storage.getLatestTemplate(templateId);
      if (!template) {
        throw new Error(
          templateVersion !== undefined
            ? `Template ${templateId} version ${templateVersion} not found`
            : `No template versions recorded for ${templateId} — a notebook's ` +
              `cells are versioned by notebook_start_run`,
        );
      }
    }

    // Ulysses gate: a tampered persisted contract is rejected before any
    // notebook materializes.
    verifyTemplateContracts(template);

    const existing = this.stateManager.getNotebook(template.templateId);
    if (existing) {
      if (hashTemplateCells(templateCellsFromNotebook(existing)) !== template.cellsHash) {
        throw new Error(
          `Notebook ${template.templateId} is already loaded with cells that ` +
            `have drifted from template version ${template.version}; export or ` +
            `run the live notebook instead of instantiating over it`,
        );
      }
    } else {
      await this.stateManager.materializeNotebook(notebookFromTemplate(template));
    }

    if (!instance) {
      instance = {
        instanceId: `rbi_${randomid()}`,
        templateId: template.templateId,
        templateVersion: template.version,
        createdBy: this.agentId,
        createdAt: new Date().toISOString(),
      };
      await storage.createInstance(instance);
    }

    const executions = await storage.listCellExecutions(instance.instanceId);
    return {
      success: true,
      notebookId: template.templateId,
      resumed: executions.length > 0,
      instance: {
        instanceId: instance.instanceId,
        templateId: instance.templateId,
        templateVersion: instance.templateVersion,
        createdBy: instance.createdBy,
        createdAt: instance.createdAt,
        status: deriveInstanceStatus(template, executions),
        nextCellId: nextUnsatisfiedCell(template, executions),
        executedCells: executions.map((record) => ({
          seq: record.seq,
          cellId: record.cellId,
          status: record.status,
          satisfied: isExecutionSatisfied(record),
        })),
      },
      template: {
        templateId: template.templateId,
        version: template.version,
        cellsHash: template.cellsHash,
        cells: template.cells.map((cell) => ({
          cellId: cell.cellId,
          cellType: cell.cellType,
          filename: cell.filename,
          hasContract: cell.contract !== undefined,
          ...(cell.validatorFor !== undefined ? { validatorFor: cell.validatorFor } : {}),
        })),
      },
    };
  }

  /**
   * Handle notebook_export tool call
   */
  async handleExportNotebook(args: any): Promise<any> {
    const { notebookId, path } = args;

    if (!notebookId || typeof notebookId !== "string") {
      throw new Error("notebookId is required and must be a string");
    }

    if (path !== undefined && typeof path !== "string") {
      throw new Error("path must be a string if provided");
    }

    // Always get content, optionally write to path
    const content = await this.stateManager.exportNotebook(notebookId, path);

    // Build response
    const response: any = {
      success: true,
      content, // Always include content
    };

    // If path was provided, include it in response
    if (path) {
      response.path = path;
    }

    return response;
  }

  /**
   * Process MCP tool call (Toolhost dispatcher pattern)
   */
  async processTool(operation: string, args: any): Promise<any> {
    try {
      let result: any;

      // Get operation definition for resource embedding
      const opDef = getOperation(operation);

      switch (operation) {
        case "create":
          result = await this.handleCreateNotebook(args);
          break;
        case "list":
          result = await this.handleListNotebooks();
          break;
        case "load":
          result = await this.handleLoadNotebook(args);
          break;
        case "add_cell":
          result = await this.handleAddCell(args);
          break;
        case "update_cell":
          result = await this.handleUpdateCell(args);
          break;
        case "run_cell":
          result = await this.handleRunCell(args);
          break;
        case "install_deps":
          result = await this.handleInstallDeps(args);
          break;
        case "list_cells":
          result = await this.handleListCells(args);
          break;
        case "get_cell":
          result = await this.handleGetCell(args);
          break;
        case "export":
          result = await this.handleExportNotebook(args);
          break;
        case "validate":
          result = await this.handleValidate(args);
          break;
        case "persist":
          result = await this.handlePersist(args);
          break;
        case "start_run":
          result = await this.handleStartRun(args);
          break;
        case "get_run":
          result = await this.handleGetRun(args);
          break;
        case "list_runs":
          result = await this.handleListRuns(args);
          break;
        case "cancel_run":
          result = await this.handleCancelRun(args);
          break;
        case "get_artifact":
          result = await this.handleGetArtifact(args);
          break;
        case "fitness":
          result = await this.handleFitness(args);
          break;
        case "instantiate":
          result = await this.handleInstantiate(args);
          break;
        // tb.runbook.* (SPEC-AGX-SUBSTRATE B6+B8) — dispatched through the
        // notebook toolhost as notebook_advance / notebook_instance_status.
        case "advance":
          result = await this.handleAdvance(args);
          break;
        case "instance_status":
          result = await this.handleInstanceStatus(args);
          break;
        default:
          throw new Error(`Unknown notebook operation: ${operation}`);
      }

      // Build response with embedded operation resource
      const content: Array<any> = [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ];

      // Embed operation details as resource
      if (opDef) {
        content.push({
          type: "resource",
          resource: {
            uri: `thoughtbox://notebook/operations/${operation}`,
            title: opDef.title,
            mimeType: "application/json",
            text: JSON.stringify(opDef, null, 2),
            annotations: {
              audience: ["assistant"],
              priority: 0.5,
            },
          },
        });
      }

      return {
        content,
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: error instanceof Error ? error.message : String(error),
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Get operations catalog as JSON
   */
  getOperationsCatalog(): string {
    return getOperationsCatalog();
  }

  getCapabilitiesCatalog(): string {
    return getNotebookCapabilitiesJson();
  }

  /**
   * Get server status
   */
  getStatus(): any {
    const notebooks = this.stateManager.listNotebooks();
    return {
      status: "healthy",
      notebooks: {
        count: notebooks.length,
        active: notebooks.filter((nb) => nb.cells.some((c) => c.type === "code" && (c as any).status === "running")).length,
      },
      timestamp: Date.now(),
    };
  }
}

/**
 * MCP Tool definition for notebook toolhost dispatcher
 */
export const NOTEBOOK_TOOL: Tool = {
  name: "notebook",
  description: `Notebook toolhost and Notebook Evidence Engine for JavaScript/TypeScript.

Create, manage, and execute interactive notebooks with markdown documentation and executable code cells.
Each notebook runs in an isolated environment with its own package.json and workspace.
Use thoughtbox://notebook/capabilities to discover evidence modes, templates, required inputs, expected outputs, and example operation sequences.
Use notebook_validate as the low-level deterministic predicate primitive for validator cells.

✨ NEW: Pre-structured templates for guided workflows
- Use template: "sequential-feynman" for deep learning with Feynman Technique
- Use evidence templates for runbooks, simulations, eval workbooks, failure capsules, ADR evidence packs, skill certification, scenario factories, and system audits
- Templates provide scaffolded cells, metacognitive prompts, and progress tracking
- Perfect for complex topics requiring validated understanding

Available operations:
- create: Create a new notebook (optionally from template)
- list: List all active notebooks
- load: Load notebook from .src.md file
- add_cell: Add cell (title/markdown/code)
- update_cell: Update cell content
- run_cell: Execute code cell
- install_deps: Install pnpm dependencies
- list_cells: List all cells in notebook
- get_cell: Get cell details
- export: Export notebook to .src.md
- persist/start_run/get_run/list_runs/cancel_run/get_artifact: Notebook Evidence Engine run and artifact operations

Common operation examples:

Create a blank notebook:
{ operation: "create", args: { title: "My Analysis", language: "typescript" } }

Create from Sequential Feynman template:
{ operation: "create", args: { title: "React Server Components", language: "typescript", template: "sequential-feynman" } }

Add a code cell:
{ operation: "add_cell", args: { notebookId: "abc123", cellType: "code", content: "console.log('hello')", filename: "example.ts" } }

Run a cell:
{ operation: "run_cell", args: { notebookId: "abc123", cellId: "cell_456" } }

List notebooks:
{ operation: "list", args: {} }

For detailed schemas of all operations, see the thoughtbox://notebook/operations resource.

When to use:
- Writing executable documentation
- Building reproducible code examples
- Creating step-by-step tutorials
- Developing and testing code snippets
- Prototyping with immediate feedback
- Deep learning workflows (with templates)`,
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: getOperationNames(),
        description: "The notebook operation to execute",
      },
      args: {
        type: "object",
        description: "Arguments for the operation (varies by operation)",
      },
    },
    required: ["operation"],
  },
  annotations: {},
  _meta: {
    available_operations: getOperationNames(),
    docs: "thoughtbox://notebook/operations",
    quickstart: "prompt://list_mcp_assets",
  },
};
