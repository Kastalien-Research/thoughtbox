/**
 * Operations Catalog for Branch Toolhost
 *
 * Defines all available branch operations with their schemas,
 * descriptions, categories, and examples.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export interface OperationDefinition {
  name: string;
  title: string;
  description: string;
  category: string;
  inputSchema: Record<string, unknown>;
  example?: Record<string, unknown>;
}

export const BRANCH_TOOL: Tool = {
  name: "branch",
  description:
    "Toolhost for managing reasoning branches. " +
    "Spawn parallel explorations, merge results, list and inspect branches.",
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["branch_spawn", "branch_merge", "branch_list", "branch_get"],
        description: "The branch operation to execute",
      },
      args: {
        type: "object",
        description: "Arguments for the operation",
      },
    },
    required: ["operation"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
  },
};

export const BRANCH_OPERATIONS: OperationDefinition[] = [
  {
    name: "branch_spawn",
    title: "Spawn Branch",
    description:
      "Create a new reasoning branch from a main-track thought. " +
      "Returns a worker URL for the branch MCP endpoint.",
    category: "branch-management",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session to branch within",
        },
        branchId: {
          type: "string",
          description: "Unique identifier for the new branch",
        },
        description: {
          type: "string",
          description: "Human-readable description of the branch purpose",
        },
        branchFromThought: {
          type: "number",
          description: "Main-track thought number to branch from",
        },
      },
      required: ["sessionId", "branchId", "branchFromThought"],
    },
    example: {
      sessionId: "abc-123",
      branchId: "explore-caching",
      description: "Explore Redis caching strategy",
      branchFromThought: 5,
    },
  },
  {
    name: "branch_merge",
    title: "Merge Branches",
    description:
      "Merge branch results back into the main track. " +
      "Records a synthesis thought and updates branch statuses.",
    category: "branch-management",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session containing branches to merge",
        },
        synthesis: {
          type: "string",
          description: "Synthesis text summarizing branch outcomes",
        },
        selectedBranchId: {
          type: "string",
          description:
            "Branch to select (required when resolution is 'selected')",
        },
        resolution: {
          type: "string",
          enum: ["selected", "synthesized", "abandoned"],
          description:
            "How to resolve: select one branch, synthesize all, or abandon",
        },
      },
      required: ["sessionId", "synthesis", "resolution"],
    },
    example: {
      sessionId: "abc-123",
      synthesis: "Redis caching is the better approach based on latency data.",
      selectedBranchId: "explore-caching",
      resolution: "selected",
    },
  },
  {
    name: "branch_list",
    title: "List Branches",
    description:
      "List all branches for a session with thought counts and status.",
    category: "branch-retrieval",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session to list branches for",
        },
      },
      required: ["sessionId"],
    },
    example: {
      sessionId: "abc-123",
    },
  },
  {
    name: "branch_get",
    title: "Get Branch",
    description:
      "Retrieve a specific branch with its metadata and all thoughts.",
    category: "branch-retrieval",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session containing the branch",
        },
        branchId: {
          type: "string",
          description: "The branch to retrieve",
        },
      },
      required: ["sessionId", "branchId"],
    },
    example: {
      sessionId: "abc-123",
      branchId: "explore-caching",
    },
  },
];

export function getOperation(name: string): OperationDefinition | undefined {
  return BRANCH_OPERATIONS.find((op) => op.name === name);
}

export function getOperationNames(): string[] {
  return BRANCH_OPERATIONS.map((op) => op.name);
}

export function getOperationsCatalog(): string {
  return JSON.stringify(
    {
      version: "1.0.0",
      operations: BRANCH_OPERATIONS.map((op) => ({
        name: op.name,
        title: op.title,
        description: op.description,
        category: op.category,
        inputs: op.inputSchema,
        example: op.example,
      })),
      categories: [
        {
          name: "branch-management",
          description: "Spawn and merge reasoning branches",
        },
        {
          name: "branch-retrieval",
          description: "List and inspect branches",
        },
      ],
    },
    null,
    2
  );
}
