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
    name: "get_state",
    title: "Get State",
    description: "Get current navigation state and available actions. Shows connection stage, active project/task/aspect, and suggested next steps.",
    category: "navigation",
    inputSchema: {
      type: "object",
      properties: {},
    },
    example: {},
  },
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
    name: "navigate",
    title: "Navigate",
    description: "Navigate to a specific project/task/aspect in the hierarchy. Shows related sessions and available sub-levels.",
    category: "navigation",
    inputSchema: {
      type: "object",
      properties: {
        target: {
          type: "object",
          properties: {
            project: {
              type: "string",
              description: "Project name to navigate to",
            },
            task: {
              type: "string",
              description: "Task name within the project",
            },
            aspect: {
              type: "string",
              description: "Aspect within the task",
            },
          },
        },
      },
      required: ["target"],
    },
    example: {
      target: { project: "thoughtbox", task: "hub" },
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
  {
    name: "list_roots",
    title: "List MCP Roots",
    description: "Query available MCP roots from the connected client (SPEC-011). Shows which roots can be bound as project scope. Not all clients support roots.",
    category: "roots",
    inputSchema: {
      type: "object",
      properties: {},
    },
    example: {},
  },
  {
    name: "bind_root",
    title: "Bind Root",
    description: "Bind an MCP root directory as the project scope (SPEC-011). Once bound, start_new will use the root name as the project automatically.",
    category: "roots",
    inputSchema: {
      type: "object",
      properties: {
        rootUri: {
          type: "string",
          description: "URI of the MCP root to bind (e.g., 'file:///path/to/project')",
        },
      },
      required: ["rootUri"],
    },
    example: {
      rootUri: "file:///Users/dev/my-project",
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
        {
          name: "roots",
          description: "MCP roots for project scoping (SPEC-011)",
        },
      ],
    },
    null,
    2
  );
}
