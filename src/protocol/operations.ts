/**
 * Operations Catalog for Protocol Tools (Theseus + Ulysses)
 *
 * Defines all available protocol operations with their schemas,
 * descriptions, categories, and examples.
 */

import type { OperationDefinition } from "../sessions/operations.js";

export const THESEUS_OPERATIONS: OperationDefinition[] = [
  {
    name: "init",
    title: "Init Refactoring Session",
    description:
      "Start a Theseus refactoring session with a declared file scope. All subsequent operations are scoped to these files until a visa expands the boundary.",
    category: "session-lifecycle",
    inputSchema: {
      type: "object",
      properties: {
        scope: {
          type: "array",
          items: { type: "string" },
          description: "File paths in scope for this refactoring session",
        },
        description: {
          type: "string",
          description: "Refactoring goal",
        },
      },
      required: ["scope"],
    },
    example: {
      scope: ["src/handler.ts", "src/types.ts"],
      description: "Extract shared types into a dedicated module",
    },
  },
  {
    name: "visa",
    title: "Request Scope Expansion",
    description:
      "Request an epistemic visa to touch an out-of-scope file. Requires justification and acknowledgment of the scope-creep anti-pattern.",
    category: "scope-management",
    inputSchema: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "Out-of-scope file path to access",
        },
        justification: {
          type: "string",
          description: "Why this file must be touched",
        },
        antiPatternAcknowledged: {
          type: "boolean",
          description: "Acknowledge scope creep risk (default: true)",
        },
      },
      required: ["filePath", "justification"],
    },
    example: {
      filePath: "src/index.ts",
      justification:
        "Must update re-exports after extracting types module",
      antiPatternAcknowledged: true,
    },
  },
  {
    name: "checkpoint",
    title: "Submit Checkpoint for Audit",
    description:
      "Submit a diff for Cassandra adversarial audit. The audit result (approved/rejected) and optional feedback are recorded.",
    category: "audit",
    inputSchema: {
      type: "object",
      properties: {
        diffHash: {
          type: "string",
          description: "Git diff hash for this checkpoint",
        },
        commitMessage: {
          type: "string",
          description: "Commit message describing the change",
        },
        approved: {
          type: "boolean",
          description: "Whether the Cassandra audit approved this checkpoint",
        },
        feedback: {
          type: "string",
          description: "Audit feedback (required if rejected)",
        },
      },
      required: ["diffHash", "commitMessage", "approved"],
    },
    example: {
      diffHash: "a1b2c3d",
      commitMessage: "refactor: extract shared types to types.ts",
      approved: true,
    },
  },
  {
    name: "outcome",
    title: "Record Test Outcome",
    description:
      "Record whether tests passed or failed after a modification. Tracks the B (brittleness) counter.",
    category: "audit",
    inputSchema: {
      type: "object",
      properties: {
        testsPassed: {
          type: "boolean",
          description: "Whether the test suite passed",
        },
        details: {
          type: "string",
          description: "Details about the test outcome",
        },
      },
      required: ["testsPassed"],
    },
    example: {
      testsPassed: true,
      details: "All 47 tests pass, no regressions",
    },
  },
  {
    name: "status",
    title: "Show Session Status",
    description:
      "Show current Theseus session state including B counter, declared scope, visa count, and audit count.",
    category: "session-lifecycle",
    inputSchema: {
      type: "object",
      properties: {},
    },
    example: {},
  },
  {
    name: "complete",
    title: "Complete Refactoring Session",
    description:
      "End the Theseus session with a terminal state. Bridges a knowledge entry if a summary is provided.",
    category: "session-lifecycle",
    inputSchema: {
      type: "object",
      properties: {
        terminalState: {
          type: "string",
          enum: ["complete", "audit_failure", "scope_exhaustion"],
          description: "Terminal state for the session",
        },
        summary: {
          type: "string",
          description: "Summary of the refactoring outcome",
        },
      },
      required: ["terminalState"],
    },
    example: {
      terminalState: "complete",
      summary: "Extracted 12 shared types, zero regressions",
    },
  },
];

export const ULYSSES_OPERATIONS: OperationDefinition[] = [
  {
    name: "init",
    title: "Init Debugging Session",
    description:
      "Start a Ulysses debugging session with a problem statement and optional constraints. Initializes the state step tracker at S=0 (at checkpoint, clean state).",
    category: "session-lifecycle",
    inputSchema: {
      type: "object",
      properties: {
        problem: {
          type: "string",
          description: "Problem description to investigate",
        },
        constraints: {
          type: "array",
          items: { type: "string" },
          description: "Known constraints on the debugging space",
        },
      },
      required: ["problem"],
    },
    example: {
      problem: "Gateway returns 500 on concurrent session resume",
      constraints: [
        "Cannot restart the service during investigation",
      ],
    },
  },
  {
    name: "plan",
    title: "Record Action Plan with Validator Cells",
    description:
      "Record a primary action step with a pre-committed recovery step. Each move must be paired with a notebook code cell that will deterministically decide that move's outcome from observed data. Cells are snapshotted (source + package.json + tsconfig) at plan time and pinned by sha256; later edits to the notebook cannot influence the verdict.",
    category: "investigation",
    inputSchema: {
      type: "object",
      properties: {
        primary: {
          type: "string",
          description: "The primary action step to take",
        },
        recovery: {
          type: "string",
          description: "Pre-committed recovery action if primary fails",
        },
        irreversible: {
          type: "boolean",
          description: "Whether the primary step is irreversible",
        },
        primaryValidator: {
          type: "object",
          description:
            "Notebook code cell that decides the primary step's outcome.",
          properties: {
            notebookId: { type: "string" },
            cellId: { type: "string" },
          },
          required: ["notebookId", "cellId"],
        },
        recoveryValidator: {
          type: "object",
          description:
            "Notebook code cell that decides the recovery step's outcome.",
          properties: {
            notebookId: { type: "string" },
            cellId: { type: "string" },
          },
          required: ["notebookId", "cellId"],
        },
      },
      required: [
        "primary",
        "recovery",
        "primaryValidator",
        "recoveryValidator",
      ],
    },
    example: {
      primary: "Add debug logging to session-resume handler",
      recovery: "Revert logging commit and check existing logs",
      irreversible: false,
      primaryValidator: { notebookId: "nb_abc", cellId: "cell_primary_check" },
      recoveryValidator: { notebookId: "nb_abc", cellId: "cell_recovery_check" },
    },
  },
  {
    name: "outcome",
    title: "Run Bound Validator Against Observed Data",
    description:
      "Pipe observed data into the validator cell bound for the current S phase. The cell's pass/fail verdict — not any agent claim — drives the state transition. Validator pass → S→0, checkpoint. Validator fail at S=1 → S=2 (recovery pending). Validator fail at S=2 → both moves forbidden, REFLECT required. Snapshot hash mismatch (cell tampered after bind) forces S=2 immediately.",
    category: "investigation",
    inputSchema: {
      type: "object",
      properties: {
        observed: {
          description:
            "JSON-serialisable value piped into the bound validator cell.",
        },
        details: {
          type: "string",
          description: "Free-form notes attached to the outcome event",
        },
      },
      required: ["observed"],
    },
    example: {
      observed: { handlerReached: false, statusCode: 401 },
      details: "Auth middleware blocked the request",
    },
  },
  {
    name: "bind_final_validator",
    title: "Pin Final Validator Cell",
    description:
      "Pin a notebook code cell as the predicate that gates terminalState='resolved'. The cell is snapshotted and pinned by sha256 at bind time. complete(resolved) will refuse the terminal unless the validator passes against supplied observed data.",
    category: "session-lifecycle",
    inputSchema: {
      type: "object",
      properties: {
        notebookId: { type: "string", description: "Notebook id" },
        cellId: { type: "string", description: "Code cell id" },
      },
      required: ["notebookId", "cellId"],
    },
    example: {
      notebookId: "nb_abc",
      cellId: "cell_final_check",
    },
  },
  {
    name: "reflect",
    title: "Form Falsifiable Hypothesis",
    description:
      "Form a falsifiable hypothesis when the state step tracker reaches S=2 (both primary and backup moves failed). Must include explicit disproof criteria. Required before the protocol allows further action steps. Failed moves are forbidden; generate new primary + backup.",
    category: "investigation",
    inputSchema: {
      type: "object",
      properties: {
        hypothesis: {
          type: "string",
          description: "A falsifiable hypothesis about the root cause",
        },
        falsification: {
          type: "string",
          description:
            "Observable evidence that would disprove this hypothesis",
        },
      },
      required: ["hypothesis", "falsification"],
    },
    example: {
      hypothesis:
        "Auth middleware rejects resumed sessions because the token scope lacks session:write",
      falsification:
        "A request with an explicit session:write scope token still returns 403",
    },
  },
  {
    name: "status",
    title: "Show Session Status",
    description:
      "Show current Ulysses session state including S (state step) value, active move, and checkpoint history.",
    category: "session-lifecycle",
    inputSchema: {
      type: "object",
      properties: {},
    },
    example: {},
  },
  {
    name: "complete",
    title: "Complete Debugging Session",
    description:
      "End the Ulysses session with a terminal state. terminalState='resolved' is HARD-GATED by the final validator if one is bound — observed data must be supplied and the validator must pass. Other terminals (insufficient_information, environment_compromised) ignore the final validator. Bridges a knowledge entry if a summary is provided.",
    category: "session-lifecycle",
    inputSchema: {
      type: "object",
      properties: {
        terminalState: {
          type: "string",
          enum: [
            "resolved",
            "insufficient_information",
            "environment_compromised",
          ],
          description: "Terminal state for the session",
        },
        summary: {
          type: "string",
          description: "Summary of the debugging outcome",
        },
        observed: {
          description:
            "Required when terminalState='resolved' and a final validator is bound; piped into the final validator.",
        },
      },
      required: ["terminalState"],
    },
    example: {
      terminalState: "resolved",
      observed: { errorCount: 0, sessionResumes: 100 },
      summary:
        "Root cause: auth token scope. Fix: add session:write to resume flow token generation.",
    },
  },
];

/**
 * Get Theseus operation definition by name
 */
export function getTheseusOperation(
  name: string,
): OperationDefinition | undefined {
  return THESEUS_OPERATIONS.find((op) => op.name === name);
}

/**
 * Get Ulysses operation definition by name
 */
export function getUlyssesOperation(
  name: string,
): OperationDefinition | undefined {
  return ULYSSES_OPERATIONS.find((op) => op.name === name);
}
