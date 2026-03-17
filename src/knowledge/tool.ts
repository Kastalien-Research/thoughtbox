import { z } from "zod";
import { KnowledgeHandler } from "./handler.js";

const EntityTypeSchema = z.enum(["Insight", "Concept", "Workflow", "Decision", "Agent"]);
const VisibilitySchema = z.enum(["public", "agent-private", "user-private", "team-private"]);
const RelationTypeSchema = z.enum([
  "RELATES_TO",
  "BUILDS_ON",
  "CONTRADICTS",
  "EXTRACTED_FROM",
  "APPLIED_IN",
  "LEARNED_BY",
  "DEPENDS_ON",
  "SUPERSEDES",
  "MERGED_FROM",
]);

export const knowledgeToolInputSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("knowledge_create_entity"),
    name: z.string().describe("Unique name within type (kebab-case, e.g., 'orchestrator-worker-pattern')"),
    type: EntityTypeSchema.describe("Entity type"),
    label: z.string().describe("Human-readable title"),
    properties: z.record(z.any()).optional().describe("Type-specific properties (free-form object)"),
    created_by: z.string().optional().describe("Agent ID of the creator"),
    visibility: VisibilitySchema.optional().describe("Access control level (default: public)"),
  }),
  z.object({
    operation: z.literal("knowledge_get_entity"),
    entity_id: z.string().describe("UUID of the entity to retrieve"),
  }),
  z.object({
    operation: z.literal("knowledge_list_entities"),
    types: z.array(EntityTypeSchema).optional().describe("Filter by entity types"),
    visibility: VisibilitySchema.optional().describe("Filter by visibility level"),
    name_pattern: z.string().optional().describe("Filter by name pattern (substring match)"),
    created_after: z.string().optional().describe("ISO date string - only entities created after this date"),
    created_before: z.string().optional().describe("ISO date string - only entities created before this date"),
    limit: z.number().optional().describe("Maximum results (default: 50)"),
    offset: z.number().optional().describe("Pagination offset (default: 0)"),
  }),
  z.object({
    operation: z.literal("knowledge_add_observation"),
    entity_id: z.string().describe("UUID of the entity to observe"),
    content: z.string().describe("Observation content (markdown supported)"),
    source_session: z.string().optional().describe("Session ID where observation was made"),
    added_by: z.string().optional().describe("Agent ID adding the observation"),
  }),
  z.object({
    operation: z.literal("knowledge_create_relation"),
    from_id: z.string().describe("Source entity UUID"),
    to_id: z.string().describe("Target entity UUID"),
    relation_type: RelationTypeSchema.describe("Type of directed relation"),
    properties: z.record(z.any()).optional().describe("Additional relation properties"),
    created_by: z.string().optional().describe("Agent ID creating the relation"),
  }),
  z.object({
    operation: z.literal("knowledge_query_graph"),
    start_entity_id: z.string().describe("Entity UUID to start traversal from"),
    relation_types: z.array(RelationTypeSchema).optional().describe("Filter traversal to these relation types"),
    max_depth: z.number().optional().describe("Maximum traversal depth (default: 3)"),
    filter: z.record(z.any()).optional().describe("Additional entity filters during traversal"),
  }),
  z.object({
    operation: z.literal("knowledge_stats"),
  }),
]);

export type KnowledgeToolInput = z.infer<typeof knowledgeToolInputSchema>;

export const KNOWLEDGE_TOOL = {
  name: "thoughtbox_knowledge",
  description: "Knowledge graph operations for tracking entities, relationships, and temporal observations.",
  inputSchema: knowledgeToolInputSchema,
  annotations: {
    audience: ["assistant"],
    priority: 0.8,
  },
};

export class KnowledgeTool {
  constructor(private handler: KnowledgeHandler) {}

  async handle(input: KnowledgeToolInput) {
    return this.handler.processOperation(input as any);
  }
}
