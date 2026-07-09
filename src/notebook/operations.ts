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
            "merge-evidence",
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

Accepts exactly one source:

- 'path': read a .src.md file from the local filesystem (STDIO mode)
- 'content': raw .src.md string (HTTP mode, e.g. from a previous export)
- 'notebookId': restore a document persisted via notebook_persist from the
  configured durable backend (file_system or supabase); the notebook
  re-materializes under its ORIGINAL id, surviving process restarts.`,
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
        notebookId: {
          type: "string",
          description:
            "Persisted notebook id to restore from durable storage (option 3)",
        },
      },
      oneOf: [
        { required: ["path"] },
        { required: ["content"] },
        { required: ["notebookId"] },
      ],
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
        contract: {
          type: "object",
          description:
            "Optional tier-1 outcome contract for code cells: { schemaVersion: 'outcome-contract.v0', " +
            "expectations: [{ source, op, value }] }. Sources: exitCode, output (RFC 6901 pointer into " +
            "the JSON the cell writes to TB_OUTPUT_PATH), artifact, claimStatus. Ops: eq, ne, lt, lte, " +
            "gt, gte, matches, schema. Compiled (zod → canonicalize → sha256) at attach; hash re-verified at run.",
        },
        validatorFor: {
          type: "string",
          description:
            "Optional tier-2 marker for code cells: id of the code cell this validator asserts over. " +
            "The validator runs via notebook_validate machinery against the target's structured output. " +
            "Mutually exclusive with contract.",
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
    description:
      "Execute a code cell and capture output (stdout, stderr, exit code). " +
      "With instanceId, execution is instance-aware and ordered: only the next " +
      "unsatisfied cell of the pinned runbook template may run (out-of-order " +
      "execution is rejected naming the expected next cell), and the execution " +
      "appends an immutable record plus fitness ledger rows.",
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
        instanceId: {
          type: "string",
          description:
            "Optional runbook instance ID. Enforces document-order execution " +
            "against the instance's append-only records (SPEC-AGX-SUBSTRATE §5).",
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
    description: "Persist the current notebook document. Always stores an in-process artifact for replay/export; with a durable backend configured (FileSystem locally, Supabase deployed) the document also persists durably — upsert by notebookId, latest wins — and the response's 'persistence' field names the backend (otherwise it stays the honest 'in_memory'). Restore across restarts with notebook_load { notebookId }.",
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
    description: "Execute a notebook's cells in-process and derive a mode-specific verdict from the real results: runbook yields a pass/fail RunbookVerdict, eval yields an EvalScorecard scored over declared expectations, merge_evidence yields a MergeEvidenceRunResult (runbook semantics, retagged). See thoughtbox://notebook/capabilities.",
    category: "evidence-engine",
    inputSchema: {
      type: "object",
      properties: {
        notebookId: { type: "string", description: "Notebook ID" },
        mode: {
          type: "string",
          enum: listNotebookModes().map((mode) => mode.mode),
          description: "Evidence engine mode. See thoughtbox://notebook/capabilities for per-mode implemented/specified status.",
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
    name: "notebook_instantiate",
    title: "Instantiate Runbook From Template",
    description:
      "Reconstruct a live notebook from a persisted, versioned runbook template and " +
      "create (or resume) an append-only instance — the fresh-session path " +
      "(SPEC-AGX-SUBSTRATE claim c5 / Experiment H2). With templateId, the latest " +
      "(or pinned) template version is materialized and a NEW instance is created. " +
      "With instanceId, an existing instance is RESUMED from its durable records alone: " +
      "the response reports derived status, executed cells, and the next unsatisfied cell. " +
      "The notebook id equals the templateId, so notebook_run_cell with instanceId " +
      "continues ordered execution unchanged. Contract hashes are re-verified on load.",
    category: "evidence-engine",
    inputSchema: {
      type: "object",
      properties: {
        templateId: {
          type: "string",
          description:
            "Runbook template ID (the source notebook's id). Required unless instanceId is given.",
        },
        templateVersion: {
          type: "integer",
          description: "Optional version pin; defaults to the latest version",
        },
        instanceId: {
          type: "string",
          description: "Existing instance ID to resume (no new instance is created)",
        },
      },
    },
    example: { templateId: "abc123" },
  },
  {
    name: "notebook_fitness",
    title: "Read Runbook Fitness",
    description:
      "Read the fitness ledger for a runbook template (SPEC-AGX-SUBSTRATE §7). " +
      "Returns per-version aggregates — instances, evaluated/passed expectation counts, " +
      "pass rate, error rate, distinct agents — computed from machine-checked ledger rows " +
      "only. Without templateVersion, aggregates for every recorded version are returned. " +
      "The templateId is the notebook id that produced the template (notebook_start_run " +
      "versions a notebook's cells automatically).",
    category: "evidence-engine",
    inputSchema: {
      type: "object",
      properties: {
        templateId: {
          type: "string",
          description: "Runbook template ID (the source notebook's id)",
        },
        templateVersion: {
          type: "integer",
          description: "Optional template version; omit for aggregates across all versions",
        },
        includeRows: {
          type: "boolean",
          description: "Include the raw fitness ledger rows in the response",
        },
      },
      required: ["templateId"],
    },
    example: { templateId: "abc123", templateVersion: 1 },
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
