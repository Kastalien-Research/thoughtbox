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
    name: "create",
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
    name: "list",
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
    name: "load",
    title: "Load Notebook",
    description: "Load a notebook from a .src.md file (Srcbook format)",
    category: "notebook-management",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to .src.md file",
        },
      },
      required: ["path"],
    },
    example: {
      path: "/path/to/notebook.src.md",
    },
  },
  {
    name: "add_cell",
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
    name: "update_cell",
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
    name: "run_cell",
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
    name: "install_deps",
    title: "Install Dependencies",
    description: "Install npm dependencies defined in the notebook's package.json",
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
    name: "list_cells",
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
    name: "get_cell",
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
    name: "export",
    title: "Export Notebook",
    description: "Export a notebook to .src.md format (Srcbook-compatible)",
    category: "notebook-management",
    inputSchema: {
      type: "object",
      properties: {
        notebookId: {
          type: "string",
          description: "Notebook ID",
        },
        path: {
          type: "string",
          description: "Output file path for .src.md file",
        },
      },
      required: ["notebookId", "path"],
    },
    example: {
      notebookId: "abc123",
      path: "/path/to/output.src.md",
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