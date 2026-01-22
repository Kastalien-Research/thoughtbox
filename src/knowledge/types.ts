/**
 * Knowledge Graph Memory System - Type Definitions
 *
 * Phase 1 MVP: Basic entity/relation/observation storage
 * No embeddings, no semantic search, no auto-extraction
 *
 * @see dgm-specs/SPEC-KNOWLEDGE-MEMORY.md
 */

// =============================================================================
// Entity Types
// =============================================================================

/**
 * Core entity in the knowledge graph
 */
export interface Entity {
  // Identity
  id: string;                    // UUID
  name: string;                  // Unique within type (e.g., "orchestrator-worker-pattern")
  type: EntityType;

  // Content
  label: string;                 // Human-readable title
  properties: Record<string, any>; // Type-specific properties

  // Metadata
  created_at: Date;
  updated_at: Date;
  created_by?: string;           // Agent ID

  // Access control (Phase 1: everything public)
  visibility: 'public' | 'agent-private' | 'user-private' | 'team-private';

  // Temporal validity (Phase 4)
  valid_from: Date;
  valid_to?: Date;               // null = currently valid
  superseded_by?: string;        // Entity ID that replaces this

  // Metrics
  access_count: number;
  last_accessed_at: Date;
  importance_score: number;      // Computed from access, centrality, recency
}

export type EntityType =
  | 'Insight'      // Key learning from session
  | 'Concept'      // Domain knowledge term
  | 'Workflow'     // Successful/failed workflow (renamed from 'Pattern' to avoid conflict)
  | 'Decision'     // Architectural choice with rationale
  | 'Agent';       // Agent profile with specializations

/**
 * Parameters for creating a new entity
 */
export interface CreateEntityParams {
  name: string;
  type: EntityType;
  label: string;
  properties?: Record<string, any>;
  created_by?: string;
  visibility?: 'public' | 'agent-private' | 'user-private' | 'team-private';
}

// =============================================================================
// Relation Types
// =============================================================================

/**
 * Directed edge between two entities
 */
export interface Relation {
  id: string;
  from_id: string;              // Source entity UUID
  to_id: string;                // Target entity UUID
  type: RelationType;
  properties: Record<string, any>;
  created_at: Date;
  created_by?: string;
}

export type RelationType =
  | 'RELATES_TO'        // Generic conceptual connection
  | 'BUILDS_ON'         // Extends or refines
  | 'CONTRADICTS'       // Conflicts with
  | 'EXTRACTED_FROM'    // Links to source session
  | 'APPLIED_IN'        // Used in task
  | 'LEARNED_BY'        // Agent acquired knowledge
  | 'DEPENDS_ON'        // Prerequisite knowledge
  | 'SUPERSEDES'        // Replaces obsolete entity (Phase 4)
  | 'MERGED_FROM';      // Consolidated from duplicate (Phase 4)

/**
 * Parameters for creating a new relation
 */
export interface CreateRelationParams {
  from_id: string;
  to_id: string;
  type: RelationType;
  properties?: Record<string, any>;
  created_by?: string;
}

// =============================================================================
// Observation Types
// =============================================================================

/**
 * Atomic fact attached to an entity
 */
export interface Observation {
  id: string;
  entity_id: string;            // FK to entity
  content: string;              // Atomic fact
  source_session?: string;      // Session that contributed this
  added_by?: string;            // Agent ID
  added_at: Date;

  // Temporal validity (Phase 4)
  valid_from: Date;
  valid_to?: Date;
  superseded_by?: string;       // Observation ID
}

/**
 * Parameters for adding observation to entity
 */
export interface AddObservationParams {
  entity_id: string;
  content: string;
  source_session?: string;
  added_by?: string;
}

// =============================================================================
// Query Types
// =============================================================================

/**
 * Filter for entity queries
 */
export interface EntityFilter {
  types?: EntityType[];
  visibility?: ('public' | 'agent-private' | 'user-private' | 'team-private')[];
  name_pattern?: string;         // SQL LIKE pattern
  created_after?: Date;
  created_before?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Graph traversal query parameters
 */
export interface GraphTraversalParams {
  start_entity_id: string;
  relation_types?: RelationType[];
  max_depth?: number;             // Default: 3
  filter?: EntityFilter;          // Filter results
}

/**
 * Graph traversal result
 */
export interface GraphTraversalResult {
  entities: Entity[];
  relations: Relation[];
  depth: number;
}

// =============================================================================
// Stats Types
// =============================================================================

/**
 * Knowledge graph statistics
 */
export interface KnowledgeStats {
  entity_counts: Record<EntityType, number>;
  relation_counts: Record<RelationType, number>;
  total_observations: number;
  avg_observations_per_entity: number;
  created_at: Date;
  updated_at: Date;
}

// =============================================================================
// Storage Interface
// =============================================================================

/**
 * Knowledge graph storage abstraction
 * Phase 1: JSONL + SQLite only
 */
export interface KnowledgeStorage {
  /**
   * Initialize storage (create directories, tables, load JSONL)
   */
  initialize(): Promise<void>;

  // ---------------------------------------------------------------------------
  // Entity Operations
  // ---------------------------------------------------------------------------

  /**
   * Create a new entity
   */
  createEntity(params: CreateEntityParams): Promise<Entity>;

  /**
   * Get entity by ID
   */
  getEntity(id: string): Promise<Entity | null>;

  /**
   * List entities with optional filtering
   */
  listEntities(filter?: EntityFilter): Promise<Entity[]>;

  /**
   * Delete entity (cascades to relations and observations)
   */
  deleteEntity(id: string): Promise<void>;

  // ---------------------------------------------------------------------------
  // Relation Operations
  // ---------------------------------------------------------------------------

  /**
   * Create a new relation
   */
  createRelation(params: CreateRelationParams): Promise<Relation>;

  /**
   * Get relations for an entity (outgoing)
   */
  getRelationsFrom(entityId: string, types?: RelationType[]): Promise<Relation[]>;

  /**
   * Get relations for an entity (incoming)
   */
  getRelationsTo(entityId: string, types?: RelationType[]): Promise<Relation[]>;

  /**
   * Delete relation
   */
  deleteRelation(id: string): Promise<void>;

  // ---------------------------------------------------------------------------
  // Observation Operations
  // ---------------------------------------------------------------------------

  /**
   * Add observation to entity
   */
  addObservation(params: AddObservationParams): Promise<Observation>;

  /**
   * Get observations for entity
   */
  getObservations(entityId: string): Promise<Observation[]>;

  // ---------------------------------------------------------------------------
  // Query Operations
  // ---------------------------------------------------------------------------

  /**
   * Traverse graph from starting entity
   */
  traverseGraph(params: GraphTraversalParams): Promise<GraphTraversalResult>;

  /**
   * Get knowledge graph statistics
   */
  getStats(): Promise<KnowledgeStats>;

  // ---------------------------------------------------------------------------
  // Persistence Operations
  // ---------------------------------------------------------------------------

  /**
   * Rebuild SQLite index from JSONL
   * Called on server start
   */
  rebuildIndexFromJsonl(): Promise<void>;
}

// =============================================================================
// JSONL Serialization Types
// =============================================================================

/**
 * JSONL entry for entity
 */
export interface JsonlEntityEntry {
  type: 'entity';
  id: string;
  name: string;
  entityType: EntityType;
  label: string;
  properties: Record<string, any>;
  created_at: string;            // ISO 8601
  updated_at: string;            // ISO 8601
  created_by?: string;
  visibility: string;
  valid_from: string;            // ISO 8601
  valid_to?: string;             // ISO 8601
  superseded_by?: string;
}

/**
 * JSONL entry for relation
 */
export interface JsonlRelationEntry {
  type: 'relation';
  id: string;
  from_id: string;
  to_id: string;
  relationType: RelationType;
  properties: Record<string, any>;
  created_at: string;            // ISO 8601
  created_by?: string;
}

/**
 * JSONL entry for observation
 */
export interface JsonlObservationEntry {
  type: 'observation';
  id: string;
  entity_id: string;
  content: string;
  source_session?: string;
  added_by?: string;
  added_at: string;              // ISO 8601
  valid_from: string;            // ISO 8601
  valid_to?: string;             // ISO 8601
  superseded_by?: string;
}

export type JsonlEntry = JsonlEntityEntry | JsonlRelationEntry | JsonlObservationEntry;
