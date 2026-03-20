import { z } from "zod";
import { KnowledgeHandler } from "./handler.js";

const EntityTypeSchema = z.enum(["Insight", "Concept", "Workflow", "Decision", "Agent"]);
const VisibilitySchema = z.enum(["public", "agent-private", "user-private", "team-private"]);
const RelationTypeSchema = z.enum([
  "RELATES_TO", "BUILDS_ON", "CONTRADICTS", "EXTRACTED_FROM",
  "APPLIED_IN", "LEARNED_BY", "DEPENDS_ON", "SUPERSEDES", "MERGED_FROM",
]);

export const knowledgeToolInputSchema = z.object({
  operation: z.enum([
    "knowledge_create_entity", "knowledge_get_entity", "knowledge_list_entities",
    "knowledge_add_observation", "knowledge_create_relation",
    "knowledge_query_graph", "knowledge_stats",
  ]),
  name: z.string().optional().describe("Entity name for create_entity"),
  type: EntityTypeSchema.optional().describe("Entity type for create_entity"),
  label: z.string().optional().describe("Human-readable title for create_entity"),
  properties: z.record(z.any()).optional().describe("Properties for create_entity or create_relation"),
  created_by: z.string().optional().describe("Agent ID of the creator"),
  visibility: VisibilitySchema.optional().describe("Access control level"),
  entity_id: z.string().optional().describe("Entity UUID for get_entity or add_observation"),
  types: z.array(EntityTypeSchema).optional().describe("Filter by entity types for list_entities"),
  name_pattern: z.string().optional().describe("Name pattern filter for list_entities"),
  created_after: z.string().optional().describe("ISO date filter for list_entities"),
  created_before: z.string().optional().describe("ISO date filter for list_entities"),
  limit: z.number().optional().describe("Maximum results"),
  offset: z.number().optional().describe("Pagination offset"),
  content: z.string().optional().describe("Observation content for add_observation"),
  source_session: z.string().optional().describe("Session ID for add_observation"),
  added_by: z.string().optional().describe("Agent ID for add_observation"),
  from_id: z.string().optional().describe("Source entity UUID for create_relation"),
  to_id: z.string().optional().describe("Target entity UUID for create_relation"),
  relation_type: RelationTypeSchema.optional().describe("Relation type for create_relation"),
  start_entity_id: z.string().optional().describe("Start entity for query_graph"),
  relation_types: z.array(RelationTypeSchema).optional().describe("Relation type filter for query_graph"),
  max_depth: z.number().optional().describe("Max traversal depth for query_graph"),
  filter: z.record(z.any()).optional().describe("Additional entity filters for query_graph"),
});

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
