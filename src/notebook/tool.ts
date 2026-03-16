import { z } from "zod";
import { NotebookHandler } from "./index.js";

export const notebookToolInputSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("notebook_create"),
    title: z.string().describe("Notebook title (or topic name when using templates)"),
    language: z.enum(["javascript", "typescript"]).describe("Programming language for the notebook"),
    template: z.enum(["sequential-feynman"]).optional().describe("Optional: Load a pre-structured template."),
  }),
  z.object({
    operation: z.literal("notebook_list"),
  }),
  z.object({
    operation: z.literal("notebook_load"),
    path: z.string().optional().describe("Filesystem path to .src.md file (option 1)"),
    content: z.string().optional().describe("Raw .src.md file content as string (option 2)"),
  }),
  z.object({
    operation: z.literal("notebook_add_cell"),
    notebookId: z.string().describe("Notebook ID"),
    cellType: z.enum(["title", "markdown", "code"]).describe("Type of cell to add"),
    content: z.string().describe("Cell content (text for title/markdown, source code for code)"),
    filename: z.string().optional().describe("Filename for code cells (e.g., 'example.js', 'utils.ts')"),
    position: z.number().int().optional().describe("Optional position to insert cell (0-indexed), appends if not specified"),
  }),
  z.object({
    operation: z.literal("notebook_update_cell"),
    notebookId: z.string().describe("Notebook ID"),
    cellId: z.string().describe("Cell ID"),
    content: z.string().describe("New content for the cell"),
  }),
  z.object({
    operation: z.literal("notebook_run_cell"),
    notebookId: z.string().describe("Notebook ID"),
    cellId: z.string().describe("Cell ID to execute"),
  }),
  z.object({
    operation: z.literal("notebook_install_deps"),
    notebookId: z.string().describe("Notebook ID"),
  }),
  z.object({
    operation: z.literal("notebook_list_cells"),
    notebookId: z.string().describe("Notebook ID"),
  }),
  z.object({
    operation: z.literal("notebook_get_cell"),
    notebookId: z.string().describe("Notebook ID"),
    cellId: z.string().describe("Cell ID"),
  }),
  z.object({
    operation: z.literal("notebook_export"),
    notebookId: z.string().describe("The ID of the notebook to export"),
    path: z.string().optional().describe("Optional: Filesystem path to write .src.md file"),
  })
]);

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
    
    // Convert operation back to original "create" instead of "notebook_create" for the handler
    const originalOperation = operation.replace("notebook_", "");

    // For notebook_load, validate oneOf constraint manually
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
