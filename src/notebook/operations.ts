/**
 * Operations Catalog for Notebook Toolhost
 *
 * Defines all available notebook operations with their schemas,
 * descriptions, categories, and examples.
 */

export interface OperationDefinition {
  name: string;
  title: string;
  description: string;
  category: string;
  inputSchema: any;
  example?: any;
}

export const NOTEBOOK_OPERATIONS: OperationDefinition[] = [
  {
    name: "notebook_create",
    title: "Create Notebook",
    description: "Create a new headless notebook for literate programming with JavaScript or TypeScript support. Optionally use a pre-structured template for guided workflows.",
    category: "notebook-management",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Notebook title (or topic name when using templates)",
        },
        language: {
          type: "string",
          enum: ["javascript", "typescript"],
          description: "Programming language for the notebook",
        },
        template: {
          type: "string",
          enum: ["sequential-feynman"],
          description: "Optional: Load a pre-structured template. 'sequential-feynman' provides guided structure for deep learning workflows with Feynman Technique.",
        },
      },
      required: ["title", "language"],
    },
    example: {
      title: "Data Analysis Example",
      language: "typescript",
    },
  },
  {
    name: "notebook_list",
    title: "List Notebooks",
    description: "List all active notebooks with their metadata",
    category: "notebook-management",
    inputSchema: {
      type: "object",
      properties: {},
    },
    example: {},
  },
  {
    name: "notebook_load",
    title: "Load Notebook",
    description: `Load a notebook from .src.md format.

Accepts either a filesystem path OR content string (exactly one required).

- STDIO mode: Provide 'path' to read from local filesystem
- HTTP mode: Provide 'content' string (e.g., from previous export)

Both approaches create an identical in-memory notebook.`,
    category: "notebook-management",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Filesystem path to .src.md file (option 1)",
        },
        content: {
          type: "string",
          description: "Raw .src.md file content as string (option 2)",
        },
      },
      oneOf: [{ required: ["path"] }, { required: ["content"] }],
    },
    example: {
      path: "/path/to/notebook.src.md",
    },
  },
  {
    name: "notebook_add_cell",
    title: "Add Cell",
    description: "Add a cell to a notebook (title, markdown, or executable code)",
    category: "cell-operations",
    inputSchema: {
      type: "object",
      properties: {
        notebookId: {
          type: "string",
          description: "Notebook ID",
        },
        cellType: {
          type: "string",
          enum: ["title", "markdown", "code"],
          description: "Type of cell to add",
        },
        content: {
          type: "string",
          description: "Cell content (text for title/markdown, source code for code)",
        },
        filename: {
          type: "string",
          description: "Filename for code cells (e.g., 'example.js', 'utils.ts')",
        },
        position: {
          type: "integer",
          description: "Optional position to insert cell (0-indexed), appends if not specified",
        },
      },
      required: ["notebookId", "cellType", "content"],
    },
    example: {
      notebookId: "abc123",
      cellType: "code",
      content: "console.log('Hello, world!');",
      filename: "hello.js",
    },
  },
  {
    name: "notebook_update_cell",
    title: "Update Cell",
    description: "Update the content of an existing cell",
    category: "cell-operations",
    inputSchema: {
      type: "object",
      properties: {
        notebookId: {
          type: "string",
          description: "Notebook ID",
        },
        cellId: {
          type: "string",
          description: "Cell ID",
        },
        content: {
          type: "string",
          description: "New content for the cell",
        },
      },
      required: ["notebookId", "cellId", "content"],
    },
    example: {
      notebookId: "abc123",
      cellId: "cell456",
      content: "console.log('Updated!');",
    },
  },
  {
    name: "notebook_run_cell",
    title: "Run Cell",
    description: "Execute a code cell and capture output (stdout, stderr, exit code)",
    category: "execution",
    inputSchema: {
      type: "object",
      properties: {
        notebookId: {
          type: "string",
          description: "Notebook ID",
        },
        cellId: {
          type: "string",
          description: "Cell ID to execute",
        },
      },
      required: ["notebookId", "cellId"],
    },
    example: {
      notebookId: "abc123",
      cellId: "cell456",
    },
  },
  {
    name: "notebook_install_deps",
    title: "Install Dependencies",
    description: "Install pnpm dependencies defined in the notebook's package.json",
    category: "execution",
    inputSchema: {
      type: "object",
      properties: {
        notebookId: {
          type: "string",
          description: "Notebook ID",
        },
      },
      required: ["notebookId"],
    },
    example: {
      notebookId: "abc123",
    },
  },
  {
    name: "notebook_list_cells",
    title: "List Cells",
    description: "List all cells in a notebook with their metadata",
    category: "cell-operations",
    inputSchema: {
      type: "object",
      properties: {
        notebookId: {
          type: "string",
          description: "Notebook ID",
        },
      },
      required: ["notebookId"],
    },
    example: {
      notebookId: "abc123",
    },
  },
  {
    name: "notebook_get_cell",
    title: "Get Cell",
    description: "Get complete details of a specific cell including content and execution results",
    category: "cell-operations",
    inputSchema: {
      type: "object",
      properties: {
        notebookId: {
          type: "string",
          description: "Notebook ID",
        },
        cellId: {
          type: "string",
          description: "Cell ID",
        },
      },
      required: ["notebookId", "cellId"],
    },
    example: {
      notebookId: "abc123",
      cellId: "cell456",
    },
  },
  {
    name: "notebook_export",
    title: "Export Notebook",
    description: `Export a notebook to .src.md format.

Always returns the notebook content as a string. Optionally writes to a filesystem path if provided.

- STDIO mode: Provide 'path' to write to local filesystem (content still returned)
- HTTP mode: Omit 'path', use returned 'content' directly

Both modes always receive the content, ensuring transport transparency.`,
    category: "notebook-management",
    inputSchema: {
      type: "object",
      properties: {
        notebookId: {
          type: "string",
          description: "The ID of the notebook to export",
        },
        path: {
          type: "string",
          description:
            "Optional: Filesystem path to write .src.md file (typically used in STDIO mode)",
        },
      },
      required: ["notebookId"],
    },
    example: {
      notebookId: "abc123",
      path: "/path/to/output.src.md",
    },
  },
  {
    name: "notebook_store_var",
    title: "Store Variable",
    description:
      "Store a named variable in a notebook. Creates or updates " +
      "a variable cell. Budget: max 100 variables, 100K chars each, " +
      "1M total chars.",
    category: "cell-operations",
    inputSchema: {
      type: "object",
      properties: {
        notebookId: {
          type: "string",
          description: "Notebook ID",
        },
        name: {
          type: "string",
          description: "Variable name (unique within notebook)",
        },
        value: {
          type: "string",
          description: "Variable value to store",
        },
      },
      required: ["notebookId", "name", "value"],
    },
    example: {
      notebookId: "abc123",
      name: "result",
      value: '{"scores":[1,2,3]}',
    },
  },
  {
    name: "notebook_peek_var",
    title: "Peek Variable",
    description:
      "Read a named variable from a notebook. Optionally slice " +
      "with start/end character offsets for large values.",
    category: "cell-operations",
    inputSchema: {
      type: "object",
      properties: {
        notebookId: {
          type: "string",
          description: "Notebook ID",
        },
        name: {
          type: "string",
          description: "Variable name to read",
        },
        start: {
          type: "integer",
          description: "Start character offset (inclusive)",
        },
        end: {
          type: "integer",
          description: "End character offset (exclusive)",
        },
      },
      required: ["notebookId", "name"],
    },
    example: {
      notebookId: "abc123",
      name: "result",
    },
  },
  {
    name: "notebook_run_with_repl",
    title: "Run Cell with REPL Globals",
    description:
      "Execute a code cell with REPL globals injected " +
      "(store, peek, vars, FINAL, print, sub_call). " +
      "The cell communicates with the notebook via IPC.",
    category: "execution",
    inputSchema: {
      type: "object",
      properties: {
        notebookId: {
          type: "string",
          description: "Notebook ID",
        },
        cellId: {
          type: "string",
          description: "Cell ID to execute with REPL globals",
        },
      },
      required: ["notebookId", "cellId"],
    },
    example: {
      notebookId: "abc123",
      cellId: "cell456",
    },
  },
];

/**
 * Get operation definition by name
 */
export function getOperation(name: string): OperationDefinition | undefined {
  return NOTEBOOK_OPERATIONS.find((op) => op.name === name);
}

/**
 * Get all operation names
 */
export function getOperationNames(): string[] {
  return NOTEBOOK_OPERATIONS.map((op) => op.name);
}

/**
 * Get operations catalog as JSON resource
 */
export function getOperationsCatalog(): string {
  return JSON.stringify(
    {
      version: "1.0.0",
      operations: NOTEBOOK_OPERATIONS.map((op) => ({
        name: op.name,
        title: op.title,
        description: op.description,
        category: op.category,
        inputs: op.inputSchema,
        example: op.example,
      })),
      categories: [
        {
          name: "notebook-management",
          description: "Create, list, load, and export notebooks",
        },
        {
          name: "cell-operations",
          description: "Add, update, list, and retrieve cells",
        },
        {
          name: "execution",
          description: "Run code cells and install dependencies",
        },
      ],
    },
    null,
    2
  );
}