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
  description: "Toolhost for managing Thoughtbox reasoning sessions. List, search, retrieve, resume, export, analyze, and extract learnings from sessions.",
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["list", "get", "search", "resume", "export", "analyze", "extract_learnings", "discovery"],
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
    name: "list",
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
    name: "get",
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
    name: "search",
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
    name: "resume",
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
    name: "export",
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
    name: "analyze",
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
  {
    name: "extract_learnings",
    title: "Extract Learnings",
    description: "Extract patterns, anti-patterns, and fitness signals from a reasoning session for the DGM evolution system. Patterns and anti-patterns require client-identified key moments; signals are generated automatically.",
    category: "session-analysis",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The ID of the session to extract learnings from",
        },
        keyMoments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              thoughtNumber: { type: "number", description: "The thought number of this key moment" },
              type: { type: "string", enum: ["decision", "pivot", "insight", "revision", "branch"], description: "Type of key moment" },
              significance: { type: "number", description: "Significance rating 1-10" },
              summary: { type: "string", description: "Brief summary of why this moment is significant" },
            },
            required: ["thoughtNumber", "type"],
          },
          description: "Key moments identified by the client (required for pattern extraction)",
        },
        targetTypes: {
          type: "array",
          items: { type: "string", enum: ["pattern", "anti-pattern", "signal"] },
          description: "Types of learnings to extract. 'signal' is generated automatically; 'pattern' and 'anti-pattern' require keyMoments.",
        },
      },
      required: ["sessionId"],
    },
    example: {
      sessionId: "abc-123-def-456",
      keyMoments: [
        { thoughtNumber: 3, type: "decision", significance: 8, summary: "Chose toolhost pattern over separate tools" },
      ],
      targetTypes: ["pattern", "signal"],
    },
  },
  {
    name: "discovery",
    title: "Manage Discovered Tools",
    description: "Manage operation-based tool discovery (SPEC-009). List discovered tools, hide tools you no longer need, or re-show hidden tools.",
    category: "tool-management",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["list", "hide", "show"],
          description: "Action to perform: 'list' shows all discovered tools, 'hide' hides a tool, 'show' re-enables a hidden tool",
        },
        toolName: {
          type: "string",
          description: "Name of the tool to hide or show (required for hide/show actions)",
        },
      },
      required: ["action"],
    },
    example: {
      action: "list",
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
          description: "Analyze session structure and extract learnings for DGM evolution",
        },
        {
          name: "tool-management",
          description: "Manage operation-based tool discovery (SPEC-009)",
        },
      ],
    },
    null,
    2
  );
}
