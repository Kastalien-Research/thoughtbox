/**
 * Operations Catalog for Notebook Toolhost
 *
 * Defines all available notebook operations with their schemas,
 * descriptions, categories, and examples.
 */

import { listNotebookModes } from "./engine/registry.js";

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
    description: "Create a new headless notebook for literate programming or Notebook Evidence Engine workflows with JavaScript/TypeScript support. See thoughtbox://notebook/capabilities for evidence modes and templates.",
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
          enum: [
            "sequential-feynman",
            "evidence-runbook",
            "evidence-simulation",
            "evidence-eval-workbook",
            "evidence-failure-capsule",
            "evidence-adr-pack",
            "evidence-skill-certification",
            "evidence-scenario-factory",
            "evidence-system-audit",
          ],
          description: "Optional: Load a pre-structured template. Evidence templates are documented at thoughtbox://notebook/capabilities.",
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
    name: "notebook_validate",
    title: "Validate Cell Against Observed Data",
    description: `Run a code cell as a deterministic predicate over JSON-serialisable observed data.

The cell receives the observed value as a JSON file pointed to by process.env.TB_OBSERVED_PATH and must write its verdict to process.env.TB_VERDICT_PATH as { "verdict": "pass" | "fail", "reason": string, "evidence"?: any }.

A small helper module is auto-materialised next to the cell:
  import { observed, pass, fail } from "./tb-validate.js";

Returns { pass, reason, evidence?, snapshotHash, hashMatched, exitCode, stdout, stderr }.

When 'expectedSnapshotHash' is provided, the operation refuses to run if the cell's current snapshot hash differs (anti-tampering for callers that pin the predicate).`,
    category: "execution",
    inputSchema: {
      type: "object",
      properties: {
        notebookId: { type: "string", description: "Notebook ID" },
        cellId: { type: "string", description: "Code cell ID to use as a validator" },
        observed: {
          description:
            "JSON-serialisable observed value piped into the validator cell.",
        },
        expectedSnapshotHash: {
          type: "string",
          description:
            "Optional sha256 hex hash that the cell snapshot must match for the run to proceed.",
        },
      },
      required: ["notebookId", "cellId", "observed"],
    },
    example: {
      notebookId: "abc123",
      cellId: "cell456",
      observed: { errorCount: 0 },
    },
  },
  {
    name: "notebook_persist",
    title: "Persist Notebook Artifact",
    description: "Persist the current notebook document as an in-process artifact for replay/export. Supabase persistence is the durable production follow-up; this operation establishes the public contract.",
    category: "evidence-engine",
    inputSchema: {
      type: "object",
      properties: {
        notebookId: { type: "string", description: "Notebook ID" },
      },
      required: ["notebookId"],
    },
    example: { notebookId: "abc123" },
  },
  {
    name: "notebook_start_run",
    title: "Start Notebook Evidence Run",
    description: "Execute a notebook's cells in-process and derive a verdict from the real results. Only runbook mode is implemented; other modes return an explicit not-implemented error. See thoughtbox://notebook/capabilities.",
    category: "evidence-engine",
    inputSchema: {
      type: "object",
      properties: {
        notebookId: { type: "string", description: "Notebook ID" },
        mode: {
          type: "string",
          enum: listNotebookModes().map((mode) => mode.mode),
          description: "Evidence engine mode. Only runbook executes today; see thoughtbox://notebook/capabilities for per-mode status.",
        },
        inputs: {
          type: "object",
          description: "Mode-specific JSON inputs (recorded as a run artifact)",
        },
      },
      required: ["notebookId", "mode"],
    },
    example: {
      notebookId: "abc123",
      mode: "runbook",
    },
  },
  {
    name: "notebook_get_run",
    title: "Get Notebook Evidence Run",
    description: "Retrieve a run record, including its typed status, outputs, and artifact references.",
    category: "evidence-engine",
    inputSchema: {
      type: "object",
      properties: {
        runId: { type: "string", description: "Notebook run ID" },
      },
      required: ["runId"],
    },
    example: { runId: "nbr_abc123" },
  },
  {
    name: "notebook_list_runs",
    title: "List Notebook Evidence Runs",
    description: "List notebook evidence runs, optionally filtered by notebookId.",
    category: "evidence-engine",
    inputSchema: {
      type: "object",
      properties: {
        notebookId: { type: "string", description: "Optional notebook ID filter" },
      },
    },
    example: { notebookId: "abc123" },
  },
  {
    name: "notebook_cancel_run",
    title: "Cancel Notebook Evidence Run",
    description: "Cancel a running notebook evidence run.",
    category: "evidence-engine",
    inputSchema: {
      type: "object",
      properties: {
        runId: { type: "string", description: "Notebook run ID" },
        reason: { type: "string", description: "Optional cancellation reason" },
      },
      required: ["runId"],
    },
    example: { runId: "nbr_abc123", reason: "superseded" },
  },
  {
    name: "notebook_get_artifact",
    title: "Get Notebook Artifact",
    description: "Retrieve a Notebook Evidence Engine artifact by artifactId.",
    category: "evidence-engine",
    inputSchema: {
      type: "object",
      properties: {
        artifactId: { type: "string", description: "Notebook artifact ID" },
      },
      required: ["artifactId"],
    },
    example: { artifactId: "nba_abc123" },
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
        {
          name: "evidence-engine",
          description:
            "Persist, run, inspect, cancel, and retrieve artifacts for Notebook Evidence Engine modes",
        },
      ],
      evidenceEngine: {
        capabilities: "thoughtbox://notebook/capabilities",
        modes: listNotebookModes(),
      },
    },
    null,
    2
  );
}
