import { z } from "zod";

/**
 * Ulysses Protocol input schema
 */
export const ulyssesToolInputSchema = z.object({
  operation: z.enum([
    "init_session",
    "plan_step",
    "execute_step",
    "execute_recovery",
    "reflect",
    "terminate_session",
    "read_protocol",
  ]).describe("The protocol operation to execute"),
  args: z.record(z.string(), z.unknown()).optional().describe("Arguments for the specific operation"),
});

export type UlyssesToolInput = z.infer<typeof ulyssesToolInputSchema>;

export interface OperationDefinition {
  name: string;
  title: string;
  description: string;
  category: string;
  inputSchema: any;
  example: Record<string, unknown>;
}

export const ULYSSES_OPERATIONS: OperationDefinition[] = [
  {
    name: "init_session",
    title: "Init Debugging Session",
    description: "Start a new debugging session under the Ulysses protocol.",
    category: "ulysses",
    inputSchema: {
      type: "object",
      properties: {
        issueDescription: {
          type: "string",
          description: "Description of the issue being investigated",
        },
      },
      required: ["issueDescription"],
    },
    example: {
      issueDescription: "The API is returning 500 randomly",
    },
  },
  {
    name: "plan_step",
    title: "Plan Phase (S = 0)",
    description: "Plan the next step and pre-commit a recovery step. Only allowed when S = 0.",
    category: "ulysses",
    inputSchema: {
      type: "object",
      properties: {
        primaryStep: {
          type: "string",
          description: "Description of the primary action to take",
        },
        expectedOutcome: {
          type: "string",
          description: "What you expect to happen when the primary step is executed",
        },
        reversibility: {
          type: "string",
          enum: ["reversible", "irreversible"],
          description: "Whether the primary step is easily reversible or not",
        },
        recoveryStep: {
          type: "string",
          description: "The action to take if the primary step produces a surprising outcome",
        },
      },
      required: ["primaryStep", "expectedOutcome", "reversibility", "recoveryStep"],
    },
    example: {
      primaryStep: "Read the server logs for the last hour",
      expectedOutcome: "Find stack traces corresponding to the 500 errors",
      reversibility: "reversible",
      recoveryStep: "No action needed, just record that logs don't have the info",
    },
  },
  {
    name: "execute_step",
    title: "Execute Step & Assess Outcome",
    description: "Report the outcome of the primary step. Moves to S = 1 if unfavorable surprise, S = 2 if fatal, or stays S = 0 if expected.",
    category: "ulysses",
    inputSchema: {
      type: "object",
      properties: {
        outcome: {
          type: "string",
          description: "Actual outcome observed",
        },
        assessment: {
          type: "string",
          enum: ["expected", "unexpected-favorable", "unexpected-unfavorable"],
          description: "How the outcome compares to expectation",
        },
        surpriseSeverity: {
          type: "string",
          enum: ["none", "flagrant-1", "flagrant-2"],
          description: "Severity of the surprise (none if expected/favorable)",
        },
        explanation: {
          type: "string",
          description: "Why this assessment/severity was chosen",
        },
      },
      required: ["outcome", "assessment", "surpriseSeverity"],
    },
    example: {
      outcome: "Logs are completely empty",
      assessment: "unexpected-unfavorable",
      surpriseSeverity: "flagrant-1",
      explanation: "Logs shouldn't be empty, perhaps logging service is down",
    },
  },
  {
    name: "execute_recovery",
    title: "Recovery Phase (S = 1)",
    description: "Report the outcome of executing the pre-committed recovery step. Escalates to REFLECT (S = 2) if another surprise occurs.",
    category: "ulysses",
    inputSchema: {
      type: "object",
      properties: {
        outcome: {
          type: "string",
          description: "Actual outcome of the recovery step",
        },
        assessment: {
          type: "string",
          enum: ["expected", "unexpected"],
          description: "Whether the recovery step succeeded as expected or yielded a new surprise",
        },
      },
      required: ["outcome", "assessment"],
    },
    example: {
      outcome: "Recorded log absence, verified log service status (it's active)",
      assessment: "unexpected",
    },
  },
  {
    name: "reflect",
    title: "Reflect Phase (S = 2)",
    description: "Formulate a hypothesis explaining the surprises and state falsification criteria. Resets S to 0.",
    category: "ulysses",
    inputSchema: {
      type: "object",
      properties: {
        hypothesis: {
          type: "string",
          description: "Explanatory model for why the surprises occurred",
        },
        falsificationCriteria: {
          type: "string",
          description: "Concrete, observable evidence that would disconfirm the hypothesis",
        },
      },
      required: ["hypothesis", "falsificationCriteria"],
    },
    example: {
      hypothesis: "The application is writing logs to a different file or stdout instead of the expected log file.",
      falsificationCriteria: "If I check the process stdout/stderr and it doesn't contain the logs either.",
    },
  },

  {
    name: "terminate_session",
    title: "Terminate Debugging Session",
    description: "End the session with a terminal state (RESOLVED, INSUFFICIENT_INFORMATION, ENVIRONMENT_COMPROMISED).",
    category: "ulysses",
    inputSchema: {
      type: "object",
      properties: {
        terminalState: {
          type: "string",
          enum: ["RESOLVED", "INSUFFICIENT_INFORMATION", "ENVIRONMENT_COMPROMISED"],
          description: "The final state of the debugging session",
        },
        summary: {
          type: "string",
          description: "A summary explaining the terminal state choice and the final outcome.",
        },
      },
      required: ["terminalState", "summary"],
    },
    example: {
      terminalState: "RESOLVED",
      summary: "Identified that the logging service was pointing to a deprecated endpoint and updated the configuration.",
    },
  },
  {
    name: "read_protocol",
    title: "Read Ulysses Protocol",
    description: "Returns the complete Surprise-Gated Debugging Protocol specification as an embedded resource.",
    category: "ulysses",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    example: {},
  },
];
