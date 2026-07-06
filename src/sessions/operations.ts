/**
 * Operations Catalog for Sessions Toolhost
 *
 * Defines all available session operations with their schemas,
 * descriptions, categories, and examples.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

export interface OperationDefinition {
  name: string;
  title: string;
  description: string;
  category: string;
  inputSchema: any;
  example?: any;
}

export const SESSION_TOOL: Tool = {
  name: "session",
  description: "Toolhost for managing Thoughtbox reasoning sessions. List, search, retrieve, resume, export, and analyze sessions.",
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["session_list", "session_get", "session_search", "session_resume", "session_resume_latest", "session_query_thoughts", "session_export", "session_analyze"],
        description: "The session operation to execute",
      },
      args: {
        type: "object",
        description: "Arguments for the operation",
      },
    },
    required: ["operation"],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
  },
};

export const SESSION_OPERATIONS: OperationDefinition[] = [
  {
    name: "session_list",
    title: "List Sessions",
    description: "List previous reasoning sessions for the current user. Returns session metadata including title, tags, thought count, and timestamps.",
    category: "session-retrieval",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of sessions to return (default: 10)",
        },
        offset: {
          type: "number",
          description: "Number of sessions to skip for pagination (default: 0)",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Filter by tags (returns sessions matching ANY tag)",
        },
      },
    },
    example: {
      limit: 10,
      tags: ["architecture", "debugging"],
    },
  },
  {
    name: "session_get",
    title: "Get Session",
    description: "Retrieve full details of a specific reasoning session, including all thoughts, branches, and metadata.",
    category: "session-retrieval",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The ID of the session to retrieve",
        },
      },
      required: ["sessionId"],
    },
    example: {
      sessionId: "abc-123-def-456",
    },
  },
  {
    name: "session_search",
    title: "Search Sessions",
    description: "Search for reasoning sessions by title or tags using a keyword query.",
    category: "session-retrieval",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query (matches title or tags)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 10)",
        },
      },
      required: ["query"],
    },
    example: {
      query: "architecture decision",
      limit: 5,
    },
  },
  {
    name: "session_resume",
    title: "Resume Session",
    description: "Load a previous session into the active ThoughtHandler, allowing continuation of reasoning from where it left off. After resuming, subsequent thoughtbox calls will append to this session.",
    category: "session-management",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The ID of the session to resume",
        },
      },
      required: ["sessionId"],
    },
    example: {
      sessionId: "abc-123-def-456",
    },
  },
  {
    name: "session_resume_latest",
    title: "Resume Latest Session",
    description: "Resume the most recently updated session in the current workspace without knowing its ID. Convenience wrapper around session_list + session_resume; optionally filter by tags. Returns the same payload as session_resume, or { success: false } when the workspace has no sessions.",
    category: "session-management",
    inputSchema: {
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional tag filter; latest session matching ALL tags is resumed",
        },
      },
      required: [],
    },
    example: {},
  },
  {
    name: "session_query_thoughts",
    title: "Query Thoughts",
    description: "Structured queries over a session's thought graph. Exactly one mode per call: by type (cipher char H/E/C/Q/R/P/O/A/X or full thoughtType name), by inclusive range (start+end), by reference (thoughts whose text cites S{n}), or revision history (original thought plus its revisions, chronological). Replaces the former thoughtbox://thoughts, thoughtbox://references, and thoughtbox://revisions resource templates.",
    category: "session-retrieval",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session to query",
        },
        type: {
          type: "string",
          description: "Filter by thought type: cipher char (H/E/C/Q/R/P/O/A/X) or thoughtType name (reasoning, decision_frame, ...)",
        },
        start: {
          type: "number",
          description: "Range query: inclusive start thought number (requires end)",
        },
        end: {
          type: "number",
          description: "Range query: inclusive end thought number (requires start)",
        },
        referencesThought: {
          type: "number",
          description: "Find all thoughts that reference thought S{n} in their text",
        },
        revisionsOf: {
          type: "number",
          description: "Get revision history for thought n (original + revisions)",
        },
      },
      required: ["sessionId"],
    },
    example: {
      sessionId: "abc-123-def-456",
      type: "decision_frame",
    },
  },
  {
    name: "session_export",
    title: "Export Session",
    description: "Export a session to markdown format, optionally using cipher notation for compression. Useful for injecting session context into hooks or sharing reasoning chains.",
    category: "session-management",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The ID of the session to export",
        },
        format: {
          type: "string",
          enum: ["markdown", "cipher", "json"],
          description: "Export format: 'markdown' (readable), 'cipher' (compressed), 'json' (structured). Default: markdown",
        },
        includeMetadata: {
          type: "boolean",
          description: "Include session metadata (title, tags, timestamps) in export. Default: true",
        },
      },
      required: ["sessionId"],
    },
    example: {
      sessionId: "abc-123-def-456",
      format: "cipher",
      includeMetadata: true,
    },
  },
  {
    name: "session_analyze",
    title: "Analyze Session",
    description: "Analyze the structure and quality metrics of a reasoning session. Returns objective metrics (linearity, revision rate, branch depth, convergence) - qualitative analysis is done client-side using the session-analysis-guide resource.",
    category: "session-analysis",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The ID of the session to analyze",
        },
      },
      required: ["sessionId"],
    },
    example: {
      sessionId: "abc-123-def-456",
    },
  },
];

/**
 * Get operation definition by name
 */
export function getOperation(name: string): OperationDefinition | undefined {
  return SESSION_OPERATIONS.find((op) => op.name === name);
}

/**
 * Get all operation names
 */
export function getOperationNames(): string[] {
  return SESSION_OPERATIONS.map((op) => op.name);
}

/**
 * Get operations catalog as JSON resource
 */
export function getOperationsCatalog(): string {
  return JSON.stringify(
    {
      version: "1.0.0",
      operations: SESSION_OPERATIONS.map((op) => ({
        name: op.name,
        title: op.title,
        description: op.description,
        category: op.category,
        inputs: op.inputSchema,
        example: op.example,
      })),
      categories: [
        {
          name: "session-retrieval",
          description: "List, search, and retrieve session details",
        },
        {
          name: "session-management",
          description: "Resume and export sessions",
        },
        {
          name: "session-analysis",
          description: "Analyze session structure and quality metrics",
        },
      ],
    },
    null,
    2
  );
}
