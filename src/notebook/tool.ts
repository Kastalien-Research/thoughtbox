import { z } from "zod";
import { NotebookHandler } from "./index.js";

export const notebookToolInputSchema = z.object({
  operation: z.enum([
    "notebook_create", "notebook_list", "notebook_load",
    "notebook_add_cell", "notebook_update_cell", "notebook_run_cell",
    "notebook_install_deps", "notebook_list_cells", "notebook_get_cell",
    "notebook_export", "notebook_validate", "notebook_persist",
    "notebook_start_run", "notebook_get_run", "notebook_list_runs",
    "notebook_cancel_run", "notebook_get_artifact", "notebook_fitness",
    "notebook_instantiate",
  ]),
  notebookId: z.string().optional().describe("Notebook ID"),
  cellId: z.string().optional().describe("Cell ID"),
  instanceId: z.string().optional().describe("Runbook instance ID (instance-aware notebook_run_cell; resume for notebook_instantiate)"),
  templateId: z.string().optional().describe("Runbook template ID — the source notebook's id (notebook_fitness, notebook_instantiate)"),
  templateVersion: z.number().int().optional().describe("Runbook template version (notebook_fitness, notebook_instantiate)"),
  includeRows: z.boolean().optional().describe("Include raw fitness ledger rows (notebook_fitness)"),
  title: z.string().optional().describe("Notebook title for create"),
  language: z.enum(["javascript", "typescript"]).optional().describe("Language for create"),
  template: z.enum([
    "sequential-feynman",
    "evidence-runbook",
    "evidence-simulation",
    "evidence-eval-workbook",
    "evidence-failure-capsule",
    "evidence-adr-pack",
    "evidence-skill-certification",
    "evidence-scenario-factory",
    "evidence-system-audit",
    "merge-evidence",
  ]).optional().describe("Template for create"),
  path: z.string().optional().describe("Filesystem path for load/export"),
  content: z.string().optional().describe("Content for load (raw .src.md) or add_cell/update_cell"),
  cellType: z.enum(["title", "markdown", "code"]).optional().describe("Cell type for add_cell"),
  filename: z.string().optional().describe("Filename for code cells"),
  position: z.number().int().optional().describe("Insert position for add_cell (0-indexed)"),
  observed: z.unknown().optional().describe("JSON-serialisable value piped into a validator cell (notebook_validate)"),
  expectedSnapshotHash: z.string().optional().describe("Optional integrity hash for notebook_validate; refuses to run on mismatch"),
  mode: z.enum([
    "runbook",
    "eval",
    "merge_evidence",
  ]).optional().describe("Notebook Evidence Engine mode (notebook_start_run)"),
  inputs: z.record(z.unknown()).optional().describe("Mode-specific JSON inputs for notebook_start_run"),
  runId: z.string().optional().describe("Notebook run ID"),
  artifactId: z.string().optional().describe("Notebook artifact ID"),
  reason: z.string().optional().describe("Cancellation reason for notebook_cancel_run"),
});

export type NotebookToolInput = z.infer<typeof notebookToolInputSchema>;

export const NOTEBOOK_TOOL = {
  name: "thoughtbox_notebook",
  description: "Notebook toolhost for literate programming with JavaScript/TypeScript. Create, manage, and execute interactive notebooks with markdown documentation and executable code cells.",
  inputSchema: notebookToolInputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

export class NotebookTool {
  constructor(private handler: NotebookHandler) {}

  async handle(input: NotebookToolInput) {
    const { operation, ...args } = input;
    const originalOperation = operation.replace("notebook_", "");

    if (operation === "notebook_load") {
      const { path, content, notebookId } = args as any;
      const sources = [path, content, notebookId].filter(Boolean).length;
      if (sources === 0) {
        throw new Error(
          "One of 'path', 'content', or 'notebookId' (persisted restore) is required",
        );
      }
      if (sources > 1) {
        throw new Error(
          "Provide exactly one of 'path', 'content', or 'notebookId'. Choose one.",
        );
      }
    }

    return this.handler.processTool(originalOperation, args);
  }
}
