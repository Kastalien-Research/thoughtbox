import { z } from "zod";
import { NotebookHandler } from "./index.js";

export const notebookToolInputSchema = z.object({
  operation: z.enum([
    "notebook_create", "notebook_list", "notebook_load",
    "notebook_add_cell", "notebook_update_cell", "notebook_run_cell",
    "notebook_install_deps", "notebook_list_cells", "notebook_get_cell",
    "notebook_export",
  ]),
  notebookId: z.string().optional().describe("Notebook ID"),
  cellId: z.string().optional().describe("Cell ID"),
  title: z.string().optional().describe("Notebook title for create"),
  language: z.enum(["javascript", "typescript"]).optional().describe("Language for create"),
  template: z.enum(["sequential-feynman"]).optional().describe("Template for create"),
  path: z.string().optional().describe("Filesystem path for load/export"),
  content: z.string().optional().describe("Content for load (raw .src.md) or add_cell/update_cell"),
  cellType: z.enum(["title", "markdown", "code"]).optional().describe("Cell type for add_cell"),
  filename: z.string().optional().describe("Filename for code cells"),
  position: z.number().int().optional().describe("Insert position for add_cell (0-indexed)"),
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
      const { path, content } = args as any;
      if (!path && !content) {
        throw new Error("Either 'path' or 'content' parameter is required");
      }
      if (path && content) {
        throw new Error("Cannot provide both 'path' and 'content' parameters. Choose one.");
      }
    }

    return this.handler.processTool(originalOperation, args);
  }
}
