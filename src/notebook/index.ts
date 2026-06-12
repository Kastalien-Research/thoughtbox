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
} from "./engine/runtime.js";
import { getNotebookCapabilitiesJson } from "./engine/registry.js";
import {
  NOTEBOOK_OPERATIONS,
  getOperation,
  getOperationNames,
  getOperationsCatalog,
} from "./operations.js";

// Re-export for use by server-factory
export { getOperationNames };

import { AVAILABLE_TEMPLATES } from "./templates.generated.js";

/**
 * Notebook Handler - MCP tool handlers for headless Srcbook notebooks
 */
export class NotebookHandler {
  private stateManager: NotebookStateManager;
  private validatorService: ValidatorService;
  private engineRuntime: InMemoryNotebookEngineRuntime;

  constructor(tempDir?: string) {
    this.stateManager = new NotebookStateManager(tempDir);
    this.validatorService = new ValidatorService(this.stateManager);
    this.engineRuntime = new InMemoryNotebookEngineRuntime((notebookId) =>
      this.executeAllCells(notebookId),
    );
  }

  /**
   * Execute every executable cell (package.json installs and code cells) in
   * document order through the real subprocess execution path, stopping at
   * the first failure; remaining executable cells are reported as skipped.
   *
   * Outcome-contract integration (SPEC-AGX-SUBSTRATE B4a):
   * - Before anything executes, every attached tier-1 contract hash is
   *   re-verified (Ulysses pattern); a mismatch throws and rejects the run.
   * - Cells with `validatorFor` are tier-2 assertion cells: they run through
   *   the existing ValidatorService (snapshot+hash, sidecar verdict) against
   *   the target cell's structured output instead of executing as steps.
   *   Assertion cells record verdicts but never halt later cells.
   */
  private async executeAllCells(
    notebookId: string,
  ): Promise<CellExecutionEvidence[]> {
    const notebook = this.stateManager.getNotebook(notebookId);
    if (!notebook) {
      throw new Error(`Notebook ${notebookId} not found`);
    }
    const executable = notebook.cells.filter(
      (cell: Cell): cell is Extract<Cell, { type: "code" | "package.json" }> =>
        cell.type === "code" || cell.type === "package.json",
    );

    // Ulysses gate: re-verify every contract hash before executing anything.
    for (const cell of executable) {
      if (cell.type === "code" && cell.contract !== undefined) {
        verifyAttachedContract(cell.id, cell.contract);
      }
    }

    const evidence: CellExecutionEvidence[] = [];
    const structuredOutputByCell = new Map<string, string>();
    let failed = false;
    for (const cell of executable) {
      const validatorFor = cell.type === "code" ? cell.validatorFor : undefined;
      if (failed) {
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
      if (cell.type === "code" && validatorFor !== undefined) {
        evidence.push(
          await this.runValidatorCell(notebookId, cell, structuredOutputByCell),
        );
        continue;
      }
      const result = await this.stateManager.executeCell(notebookId, cell.id);
      if (cell.type === "code" && result.structuredOutput !== undefined) {
        structuredOutputByCell.set(cell.id, result.structuredOutput);
      }
      evidence.push({
        cellId: cell.id,
        cellType: cell.type,
        filename: cell.filename,
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
      });
      if (!result.success) failed = true;
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
    return {
      ...base,
      status: record.result === "error" ? "failed" : "completed",
      exitCode: result.exitCode,
      output: result.stdout,
      error: result.stderr,
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
   * Handle notebook_load tool call
   */
  async handleLoadNotebook(args: any): Promise<any> {
    const { path, content } = args;

    // Validate: exactly one of path or content required
    const hasPath = path !== undefined && typeof path === "string";
    const hasContent = content !== undefined && typeof content === "string";

    if (!hasPath && !hasContent) {
      throw new Error("Either 'path' or 'content' parameter is required");
    }

    if (hasPath && hasContent) {
      throw new Error(
        "Cannot provide both 'path' and 'content' parameters. Choose one."
      );
    }

    // Load notebook from appropriate source
    const notebook = await this.stateManager.loadNotebook(
      hasPath ? { path } : { content }
    );

    return {
      success: true,
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
   * Handle notebook_run_cell tool call
   */
  async handleRunCell(args: any): Promise<any> {
    const { notebookId, cellId } = args;

    if (!notebookId || typeof notebookId !== "string") {
      throw new Error("notebookId is required and must be a string");
    }

    if (!cellId || typeof cellId !== "string") {
      throw new Error("cellId is required and must be a string");
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
        }
        return base;
      }),
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
   * First slice persistence stores the exported notebook as an in-process
   * artifact. Supabase-backed persistence will implement the same public
   * operation through the NotebookStore boundary.
   */
  async handlePersist(args: any): Promise<any> {
    const { notebookId } = args;
    if (!notebookId || typeof notebookId !== "string") {
      throw new Error("notebookId is required and must be a string");
    }
    const content = await this.stateManager.exportNotebook(notebookId);
    return await import("effect").then(({ Effect }) =>
      Effect.runPromise(this.engineRuntime.persistNotebook(notebookId, content)),
    );
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
