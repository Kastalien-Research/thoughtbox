import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { NotebookStateManager } from "./state.js";
import type { Cell, CodeLanguage } from "./types.js";
import { randomid } from "./types.js";
import {
  NOTEBOOK_OPERATIONS,
  getOperation,
  getOperationNames,
  getOperationsCatalog,
} from "./operations.js";
import { AVAILABLE_TEMPLATES } from "./templates.generated.js";

/**
 * Notebook Server - MCP tool handlers for headless Srcbook notebooks
 */
export class NotebookServer {
  private stateManager: NotebookStateManager;

  constructor(tempDir?: string) {
    this.stateManager = new NotebookStateManager(tempDir);
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
    const { notebookId, cellType, content, filename, position } = args;

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

      case "code":
        if (!content) throw new Error("content is required for code cells");
        if (!filename) throw new Error("filename is required for code cells");
        cell = {
          id: randomid(),
          type: "code",
          language: notebook.language,
          filename,
          source: content,
          status: "idle",
        };
        break;

      default:
        throw new Error(`Unsupported cell type: ${cellType}`);
    }

    await this.stateManager.addCell(notebookId, cell, position);

    return {
      success: true,
      cell: {
        id: cell.id,
        type: cell.type,
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
  description: `Notebook toolhost for literate programming with JavaScript/TypeScript.

Create, manage, and execute interactive notebooks with markdown documentation and executable code cells.
Each notebook runs in an isolated environment with its own package.json and workspace.

✨ NEW: Pre-structured templates for guided workflows
- Use template: "sequential-feynman" for deep learning with Feynman Technique
- Templates provide scaffolded cells, metacognitive prompts, and progress tracking
- Perfect for complex topics requiring validated understanding

Available operations:
- create: Create a new notebook (optionally from template)
- list: List all active notebooks
- load: Load notebook from .src.md file
- add_cell: Add cell (title/markdown/code)
- update_cell: Update cell content
- run_cell: Execute code cell
- install_deps: Install npm dependencies
- list_cells: List all cells in notebook
- get_cell: Get cell details
- export: Export notebook to .src.md

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