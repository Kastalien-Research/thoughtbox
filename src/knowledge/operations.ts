/**
 * Operations Catalog for Knowledge Graph Toolhost
 *
 * Defines all available knowledge graph operations with their schemas,
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

export const KNOWLEDGE_OPERATIONS: OperationDefinition[] = [
  {
    name: "create_entity",
    title: "Create Entity",
    description:
      "Create a new entity in the knowledge graph. Entities represent insights, concepts, workflows, decisions, or agents.",
    category: "entity-management",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Unique name within type (kebab-case, e.g., 'orchestrator-worker-pattern')",
        },
        type: {
          type: "string",
          enum: ["Insight", "Concept", "Workflow", "Decision", "Agent"],
          description: "Entity type",
        },
        label: {
          type: "string",
          description: "Human-readable title",
        },
        properties: {
          type: "object",
          description: "Type-specific properties (free-form object)",
        },
        created_by: {
          type: "string",
          description: "Agent ID of the creator",
        },
        visibility: {
          type: "string",
          enum: ["public", "agent-private", "user-private", "team-private"],
          description: "Access control level (default: public)",
        },
      },
      required: ["name", "type", "label"],
    },
    example: {
      name: "gateway-routing-pattern",
      type: "Workflow",
      label: "Gateway Routing Pattern",
      properties: { domain: "architecture" },
    },
  },
  {
    name: "get_entity",
    title: "Get Entity",
    description: "Retrieve full details of a specific entity by ID, including all properties and metadata.",
    category: "entity-management",
    inputSchema: {
      type: "object",
      properties: {
        entity_id: {
          type: "string",
          description: "UUID of the entity to retrieve",
        },
      },
      required: ["entity_id"],
    },
    example: {
      entity_id: "abc-123-def-456",
    },
  },
  {
    name: "list_entities",
    title: "List Entities",
    description: "List entities with optional filtering by type, visibility, name pattern, or date range.",
    category: "entity-management",
    inputSchema: {
      type: "object",
      properties: {
        types: {
          type: "array",
          items: {
            type: "string",
            enum: ["Insight", "Concept", "Workflow", "Decision", "Agent"],
          },
          description: "Filter by entity types",
        },
        visibility: {
          type: "string",
          enum: ["public", "agent-private", "user-private", "team-private"],
          description: "Filter by visibility level",
        },
        name_pattern: {
          type: "string",
          description: "Filter by name pattern (substring match)",
        },
        created_after: {
          type: "string",
          description: "ISO date string - only entities created after this date",
        },
        created_before: {
          type: "string",
          description: "ISO date string - only entities created before this date",
        },
        limit: {
          type: "number",
          description: "Maximum results (default: 50)",
        },
        offset: {
          type: "number",
          description: "Pagination offset (default: 0)",
        },
      },
    },
    example: {
      types: ["Insight", "Decision"],
      limit: 10,
    },
  },
  {
    name: "add_observation",
    title: "Add Observation",
    description:
      "Add an observation to an existing entity. Observations are timestamped notes that track how an entity evolves over time.",
    category: "entity-management",
    inputSchema: {
      type: "object",
      properties: {
        entity_id: {
          type: "string",
          description: "UUID of the entity to observe",
        },
        content: {
          type: "string",
          description: "Observation content (markdown supported)",
        },
        source_session: {
          type: "string",
          description: "Session ID where observation was made",
        },
        added_by: {
          type: "string",
          description: "Agent ID adding the observation",
        },
      },
      required: ["entity_id", "content"],
    },
    example: {
      entity_id: "abc-123-def-456",
      content: "This pattern also works well with progressive disclosure stages",
    },
  },
  {
    name: "create_relation",
    title: "Create Relation",
    description:
      "Create a directed relation between two entities. Relations form the edges of the knowledge graph.",
    category: "graph-structure",
    inputSchema: {
      type: "object",
      properties: {
        from_id: {
          type: "string",
          description: "Source entity UUID",
        },
        to_id: {
          type: "string",
          description: "Target entity UUID",
        },
        relation_type: {
          type: "string",
          enum: [
            "RELATES_TO",
            "BUILDS_ON",
            "CONTRADICTS",
            "EXTRACTED_FROM",
            "APPLIED_IN",
            "LEARNED_BY",
            "DEPENDS_ON",
            "SUPERSEDES",
            "MERGED_FROM",
          ],
          description: "Type of directed relation",
        },
        properties: {
          type: "object",
          description: "Additional relation properties",
        },
        created_by: {
          type: "string",
          description: "Agent ID creating the relation",
        },
      },
      required: ["from_id", "to_id", "relation_type"],
    },
    example: {
      from_id: "entity-1",
      to_id: "entity-2",
      relation_type: "BUILDS_ON",
    },
  },
  {
    name: "query_graph",
    title: "Query Graph",
    description:
      "Traverse the knowledge graph starting from an entity. Follows relations up to a specified depth, with optional filtering by relation type.",
    category: "graph-structure",
    inputSchema: {
      type: "object",
      properties: {
        start_entity_id: {
          type: "string",
          description: "Entity UUID to start traversal from",
        },
        relation_types: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "RELATES_TO",
              "BUILDS_ON",
              "CONTRADICTS",
              "EXTRACTED_FROM",
              "APPLIED_IN",
              "LEARNED_BY",
              "DEPENDS_ON",
              "SUPERSEDES",
              "MERGED_FROM",
            ],
          },
          description: "Filter traversal to these relation types",
        },
        max_depth: {
          type: "number",
          description: "Maximum traversal depth (default: 3)",
        },
        filter: {
          type: "object",
          description: "Additional entity filters during traversal",
        },
      },
      required: ["start_entity_id"],
    },
    example: {
      start_entity_id: "abc-123-def-456",
      relation_types: ["BUILDS_ON", "DEPENDS_ON"],
      max_depth: 2,
    },
  },
  {
    name: "stats",
    title: "Graph Statistics",
    description: "Get aggregate statistics for the knowledge graph: entity counts by type, relation counts, and general health metrics.",
    category: "graph-structure",
    inputSchema: {
      type: "object",
      properties: {},
    },
    example: {},
  },
];

/**
 * Get operation definition by name
 */
export function getOperation(name: string): OperationDefinition | undefined {
  return KNOWLEDGE_OPERATIONS.find((op) => op.name === name);
}

/**
 * Get all operation names
 */
export function getOperationNames(): string[] {
  return KNOWLEDGE_OPERATIONS.map((op) => op.name);
}

/**
 * Get operations catalog as JSON resource
 */
export function getOperationsCatalog(): string {
  return JSON.stringify(
    {
      version: "1.0.0",
      operations: KNOWLEDGE_OPERATIONS.map((op) => ({
        name: op.name,
        title: op.title,
        description: op.description,
        category: op.category,
        inputs: op.inputSchema,
        example: op.example,
      })),
      categories: [
        {
          name: "entity-management",
          description: "Create, read, and observe entities in the knowledge graph",
        },
        {
          name: "graph-structure",
          description: "Create relations and traverse the graph",
        },
      ],
    },
    null,
    2
  );
}
