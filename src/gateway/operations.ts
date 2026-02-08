/**
 * Operations Catalog for Gateway Toolhost
 *
 * Defines gateway-level operations (thought, read_thoughts, get_structure,
 * cipher, deep_analysis) with their schemas, descriptions, and examples.
 */

export interface OperationDefinition {
  name: string;
  title: string;
  description: string;
  category: string;
  inputSchema: any;
  example?: any;
}

export const GATEWAY_OPERATIONS: OperationDefinition[] = [
  {
    name: "thought",
    title: "Record Thought",
    description:
      "Record a structured reasoning thought in the active session. Server auto-assigns thoughtNumber and totalThoughts (SIL-102). Supports branching, revisions, and session metadata.",
    category: "reasoning",
    inputSchema: {
      type: "object",
      properties: {
        thought: {
          type: "string",
          description: "The reasoning content to record",
        },
        nextThoughtNeeded: {
          type: "boolean",
          description: "Whether more thoughts are needed to complete the reasoning chain",
        },
        thoughtNumber: {
          type: "number",
          description: "Optional: thought sequence number (auto-assigned if omitted)",
        },
        totalThoughts: {
          type: "number",
          description: "Optional: estimated total thoughts (auto-assigned if omitted)",
        },
        branchId: {
          type: "string",
          description: "Branch name for parallel exploration (requires branchFromThought)",
        },
        branchFromThought: {
          type: "number",
          description: "Thought number to branch from (required when branchId is set)",
        },
        isRevision: {
          type: "boolean",
          description: "Whether this thought revises a previous thought",
        },
        revisesThought: {
          type: "number",
          description: "Thought number being revised (required when isRevision is true)",
        },
        verbose: {
          type: "boolean",
          description: "If true, return full response; if false/omitted, return minimal response (SIL-101)",
        },
        sessionTitle: {
          type: "string",
          description: "Set session title (first thought only)",
        },
        sessionTags: {
          type: "array",
          items: { type: "string" },
          description: "Set session tags (first thought only)",
        },
        critique: {
          type: "boolean",
          description: "If true, include self-critique guidance",
        },
      },
      required: ["thought", "nextThoughtNeeded"],
    },
    example: {
      thought: "The architecture uses a gateway pattern to route operations...",
      nextThoughtNeeded: true,
      sessionTitle: "Architecture Analysis",
      sessionTags: ["project:thoughtbox", "task:analysis"],
    },
  },
  {
    name: "read_thoughts",
    title: "Read Thoughts",
    description:
      "Retrieve previous thoughts from the active or specified session. Supports multiple query modes: single thought by number, last N thoughts, range, or branch filtering.",
    category: "reasoning",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session to read from (defaults to active session)",
        },
        thoughtNumber: {
          type: "number",
          description: "Get a single thought by number",
        },
        last: {
          type: "number",
          description: "Get the last N thoughts",
        },
        range: {
          type: "array",
          items: { type: "number" },
          minItems: 2,
          maxItems: 2,
          description: "Get thoughts in range [start, end] (inclusive)",
        },
        branchId: {
          type: "string",
          description: "Filter by branch name",
        },
      },
    },
    example: {
      last: 5,
    },
  },
  {
    name: "get_structure",
    title: "Get Reasoning Structure",
    description:
      "Return the topology of a reasoning session without thought content. Shows main chain length, branches, fork points, and revision pairs. Useful for understanding reasoning shape before reading specific thoughts.",
    category: "reasoning",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session to analyze (defaults to active session)",
        },
      },
    },
    example: {},
  },
  {
    name: "cipher",
    title: "Load Cipher Notation",
    description:
      "Load the Thoughtbox cipher notation system for token-efficient reasoning. Must be called before thought operations. Advances stage from STAGE_1 to STAGE_2.",
    category: "initialization",
    inputSchema: {
      type: "object",
      properties: {},
    },
    example: {},
  },
  {
    name: "deep_analysis",
    title: "Deep Analysis",
    description:
      "Analyze a reasoning session for patterns, cognitive load, and decision points. Available analysis types: patterns, cognitive_load, decision_points, full.",
    category: "analysis",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session to analyze",
        },
        analysisType: {
          type: "string",
          enum: ["patterns", "cognitive_load", "decision_points", "full"],
          description: "Type of analysis to perform",
        },
        options: {
          type: "object",
          properties: {
            includeTimeline: {
              type: "boolean",
              description: "Include session timeline in results",
            },
            compareWith: {
              type: "array",
              items: { type: "string" },
              description: "Session IDs to compare with",
            },
          },
        },
      },
      required: ["sessionId", "analysisType"],
    },
    example: {
      sessionId: "abc-123-def-456",
      analysisType: "full",
      options: { includeTimeline: true },
    },
  },
];

/**
 * Get operation definition by name
 */
export function getOperation(name: string): OperationDefinition | undefined {
  return GATEWAY_OPERATIONS.find((op) => op.name === name);
}

/**
 * Get all operation names
 */
export function getOperationNames(): string[] {
  return GATEWAY_OPERATIONS.map((op) => op.name);
}

/**
 * Get operations catalog as JSON resource
 */
export function getOperationsCatalog(): string {
  return JSON.stringify(
    {
      version: "1.0.0",
      operations: GATEWAY_OPERATIONS.map((op) => ({
        name: op.name,
        title: op.title,
        description: op.description,
        category: op.category,
        inputs: op.inputSchema,
        example: op.example,
      })),
      categories: [
        {
          name: "initialization",
          description: "Stage progression and cipher loading",
        },
        {
          name: "reasoning",
          description: "Record, read, and explore thought chains",
        },
        {
          name: "analysis",
          description: "Deep analysis of reasoning sessions",
        },
      ],
    },
    null,
    2
  );
}
