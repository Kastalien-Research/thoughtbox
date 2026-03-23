/**
 * Operations Catalog for Init Toolhost
 *
 * Defines all available init operations with their schemas,
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

export const INIT_OPERATIONS: OperationDefinition[] = [
  {
    name: "list_sessions",
    title: "List Sessions",
    description: "List previous reasoning sessions with optional filtering by project, task, aspect, or search text. Returns session metadata including title, thought count, and timestamps.",
    category: "navigation",
    inputSchema: {
      type: "object",
      properties: {
        filters: {
          type: "object",
          properties: {
            project: {
              type: "string",
              description: "Filter by project name",
            },
            task: {
              type: "string",
              description: "Filter by task name",
            },
            aspect: {
              type: "string",
              description: "Filter by aspect name",
            },
            search: {
              type: "string",
              description: "Search text to match against session titles",
            },
            limit: {
              type: "number",
              description: "Maximum results to return (default: 20)",
            },
          },
        },
      },
    },
    example: {
      filters: { project: "thoughtbox", limit: 10 },
    },
  },
  {
    name: "load_context",
    title: "Load Context",
    description: "Load full context for continuing a previous session. Retrieves session metadata, recent thoughts, and advances to STAGE_1 (init complete). After loading, call 'cipher' to proceed.",
    category: "session-setup",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The ID of the session to load",
        },
      },
      required: ["sessionId"],
    },
    example: {
      sessionId: "abc-123-def-456",
    },
  },
  {
    name: "start_new",
    title: "Start New Work",
    description: "Initialize new work context with project/task/aspect classification. Advances to STAGE_1. If a root is bound, the bound root name is used as the project automatically.",
    category: "session-setup",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "Project name (auto-derived from bound root if not provided)",
        },
        task: {
          type: "string",
          description: "Task within the project",
        },
        aspect: {
          type: "string",
          description: "Specific aspect of the task",
        },
        domain: {
          type: "string",
          description: "Reasoning domain (e.g., 'debugging', 'planning', 'architecture') - unlocks domain-specific mental models",
        },
      },
    },
    example: {
      project: "thoughtbox",
      task: "hub-operations",
      aspect: "implementation",
    },
  },
];

/**
 * Get operation definition by name
 */
export function getOperation(name: string): OperationDefinition | undefined {
  return INIT_OPERATIONS.find((op) => op.name === name);
}

/**
 * Get all operation names
 */
export function getOperationNames(): string[] {
  return INIT_OPERATIONS.map((op) => op.name);
}

/**
 * Get operations catalog as JSON resource
 */
export function getOperationsCatalog(): string {
  return JSON.stringify(
    {
      version: "1.0.0",
      operations: INIT_OPERATIONS.map((op) => ({
        name: op.name,
        title: op.title,
        description: op.description,
        category: op.category,
        inputs: op.inputSchema,
        example: op.example,
      })),
      categories: [
        {
          name: "navigation",
          description: "Browse and navigate the project/task/aspect hierarchy",
        },
        {
          name: "session-setup",
          description: "Load existing sessions or start new work",
        },
      ],
    },
    null,
    2
  );
}
