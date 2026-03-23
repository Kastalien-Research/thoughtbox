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
      "Start a Ulysses debugging session with a problem statement and optional constraints. Initializes the surprise register at S=0.",
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
    title: "Record Action Plan",
    description:
      "Record a primary action step with a pre-committed recovery step. The recovery step executes automatically if the primary fails.",
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
      },
      required: ["primary", "recovery"],
    },
    example: {
      primary: "Add debug logging to session-resume handler",
      recovery: "Revert logging commit and check existing logs",
      irreversible: false,
    },
  },
  {
    name: "outcome",
    title: "Assess Step Outcome",
    description:
      "Assess the result of a plan step. Unexpected outcomes increment the surprise register. At S=2, reflection is required before further action.",
    category: "investigation",
    inputSchema: {
      type: "object",
      properties: {
        assessment: {
          type: "string",
          enum: [
            "expected",
            "unexpected-favorable",
            "unexpected-unfavorable",
          ],
          description: "How the outcome compared to expectations",
        },
        severity: {
          type: "number",
          description: "Surprise severity: 1 = minor, 2 = major",
        },
        details: {
          type: "string",
          description: "Details about the outcome",
        },
      },
      required: ["assessment"],
    },
    example: {
      assessment: "unexpected-unfavorable",
      severity: 2,
      details:
        "Logs show the handler is never reached — request rejected at auth middleware",
    },
  },
  {
    name: "reflect",
    title: "Form Falsifiable Hypothesis",
    description:
      "Form a falsifiable hypothesis when the surprise register hits S=2. Must include explicit disproof criteria. Required before the protocol allows further action steps.",
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
      "Show current Ulysses session state including S register value, active step, and surprise history.",
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
      "End the Ulysses session with a terminal state. Bridges a knowledge entry if a summary is provided.",
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
      },
      required: ["terminalState"],
    },
    example: {
      terminalState: "resolved",
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
