/**
 * Supabase Knowledge Graph Storage Implementation
 *
 * Supabase-backed persistence for the knowledge graph.
 * Implements the same KnowledgeStorage interface as FileSystemKnowledgeStorage.
 * Uses workspace-scoped isolation for multi-tenancy.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types.js';
import { randomUUID } from 'node:crypto';
import type {
  KnowledgeStorage,
  Entity,
  EntityType,
  Relation,
  RelationType,
  Observation,
  CreateEntityParams,
  CreateRelationParams,
  AddObservationParams,
  EntityFilter,
  GraphTraversalParams,
  GraphTraversalResult,
  KnowledgeStats,
} from './types.js';

type EntityRow = Database['public']['Tables']['entities']['Row'];
type EntityInsert = Database['public']['Tables']['entities']['Insert'];
type RelationRow = Database['public']['Tables']['relations']['Row'];
type RelationInsert = Database['public']['Tables']['relations']['Insert'];
type ObservationRow = Database['public']['Tables']['observations']['Row'];
type ObservationInsert = Database['public']['Tables']['observations']['Insert'];

export interface SupabaseKnowledgeStorageConfig {
  supabaseUrl: string;
  /** Service role key — used as both the client API key and auth token. Bypasses RLS. */
  serviceRoleKey: string;
  /** The workspace ID this knowledge storage instance is strictly scoped to. */
  workspaceId: string;
}

export class SupabaseKnowledgeStorage implements KnowledgeStorage {
  private supabaseUrl: string;
  private serviceRoleKey: string;
  private workspaceId: string;
  private client: SupabaseClient<Database> | null = null;

  constructor(config: SupabaseKnowledgeStorageConfig) {
    this.supabaseUrl = config.supabaseUrl;
    this.serviceRoleKey = config.serviceRoleKey;
    this.workspaceId = config.workspaceId;
  }

  // ===========================================================================
  // Workspace Scoping
  // ===========================================================================

  async setProject(project: string): Promise<void> {
    // Project scoping is deprecated in favor of strict workspaceId scoping at instantiation.
  }

  private ensureClient(): SupabaseClient<Database> {
    if (!this.workspaceId) {
      throw new Error('Workspace scope not established.');
    }
    if (!this.client) {
      this.client = createClient<Database>(this.supabaseUrl, this.serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return this.client;
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  async initialize(): Promise<void> {
    // No-op for Supabase — schema is managed by migrations.
  }

  async rebuildIndexFromJsonl(): Promise<void> {
    // No-op for Supabase — no JSONL source of truth.
  }

  // ===========================================================================
  // Row Mapping
  // ===========================================================================

  private rowToEntity(row: EntityRow): Entity {
    return {
      id: row.id,
      name: row.name,
      type: row.type as EntityType,
      label: row.label,
      properties: (row.properties as Record<string, unknown>) || {},
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      created_by: row.created_by || undefined,
      visibility: (row.visibility as Entity['visibility']) || 'public',
      valid_from: new Date(row.valid_from || row.created_at),
      valid_to: row.valid_to ? new Date(row.valid_to) : undefined,
      superseded_by: row.superseded_by || undefined,
      access_count: row.access_count || 0,
      last_accessed_at: new Date(row.last_accessed_at || row.created_at),
      importance_score: row.importance_score ?? 0.5,
    };
  }

  private rowToRelation(row: RelationRow): Relation {
    return {
      id: row.id,
      from_id: row.from_id,
      to_id: row.to_id,
      type: row.type as RelationType,
      properties: (row.properties as Record<string, unknown>) || {},
      created_at: new Date(row.created_at),
      created_by: row.created_by || undefined,
    };
  }

  private rowToObservation(row: ObservationRow): Observation {
    return {
      id: row.id,
      entity_id: row.entity_id,
      content: row.content,
      source_session: row.source_session || undefined,
      added_by: row.added_by || undefined,
      added_at: new Date(row.added_at),
      valid_from: new Date(row.valid_from || row.added_at),
      valid_to: row.valid_to ? new Date(row.valid_to) : undefined,
      superseded_by: row.superseded_by || undefined,
    };
  }

  // ===========================================================================
  // Entity Operations
  // ===========================================================================

  async createEntity(params: CreateEntityParams): Promise<Entity> {
    const client = this.ensureClient();
    const now = new Date().toISOString();
    const id = randomUUID();

    const row: EntityInsert = {
      id,
      workspace_id: this.workspaceId,
      name: params.name,
      type: params.type,
      label: params.label,
      properties: params.properties || {},
      created_by: params.created_by || null,
      visibility: params.visibility || 'public',
      valid_from: now,
      access_count: 0,
      importance_score: 0.5,
    };

    const { data, error } = await client
      .from('entities')
      .insert(row)
      .select()
      .single();

    if (error) {
      // Handle UNIQUE(workspace_id, name, type) collision — return existing
      if (error.code === '23505') {
        const { data: existing, error: fetchError } = await client
          .from('entities')
          .select()
          .eq('workspace_id', this.workspaceId)
          .eq('name', params.name)
          .eq('type', params.type)
          .single();

        if (fetchError) throw new Error(`Failed to fetch existing entity: ${fetchError.message}`);
        return this.rowToEntity(existing);
      }
      throw new Error(`Failed to create entity: ${error.message}`);
    }
    return this.rowToEntity(data);
  }

  async getEntity(id: string): Promise<Entity | null> {
    const client = this.ensureClient();
    const { data, error } = await client
      .from('entities')
      .select()
      .eq('id', id)
      .eq('workspace_id', this.workspaceId)
      .maybeSingle();

    if (error) throw new Error(`Failed to get entity: ${error.message}`);
    if (!data) return null;
    return this.rowToEntity(data);
  }

  async listEntities(filter?: EntityFilter): Promise<Entity[]> {
    const client = this.ensureClient();
    let query = client.from('entities').select().eq('workspace_id', this.workspaceId);

    if (filter?.types && filter.types.length > 0) {
      query = query.in('type', filter.types);
    }

    if (filter?.visibility && filter.visibility.length > 0) {
      query = query.in('visibility', filter.visibility);
    }

    if (filter?.name_pattern) {
      query = query.ilike('name', `%${filter.name_pattern}%`);
    }

    if (filter?.created_after) {
      query = query.gte('created_at', filter.created_after.toISOString());
    }

    if (filter?.created_before) {
      query = query.lte('created_at', filter.created_before.toISOString());
    }

    query = query.order('importance_score', { ascending: false });

    if (filter?.offset) {
      const limit = filter?.limit || 100;
      query = query.range(filter.offset, filter.offset + limit - 1);
    } else if (filter?.limit) {
      query = query.limit(filter.limit);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to list entities: ${error.message}`);
    return (data || []).map((row) => this.rowToEntity(row as EntityRow));
  }

  async deleteEntity(id: string): Promise<void> {
    const client = this.ensureClient();
    const { error } = await client
      .from('entities')
      .delete()
      .eq('id', id)
      .eq('workspace_id', this.workspaceId);

    if (error) throw new Error(`Failed to delete entity: ${error.message}`);
  }

  // ===========================================================================
  // Relation Operations
  // ===========================================================================

  async createRelation(params: CreateRelationParams): Promise<Relation> {
    const client = this.ensureClient();
    const id = randomUUID();

    const row: RelationInsert = {
      id,
      workspace_id: this.workspaceId,
      from_id: params.from_id,
      to_id: params.to_id,
      type: params.type,
      properties: params.properties || {},
      created_by: params.created_by || null,
    };

    const { data, error } = await client
      .from('relations')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`Failed to create relation: ${error.message}`);
    return this.rowToRelation(data);
  }

  async getRelationsFrom(entityId: string, types?: RelationType[]): Promise<Relation[]> {
    const client = this.ensureClient();
    let query = client.from('relations').select().eq('from_id', entityId).eq('workspace_id', this.workspaceId);

    if (types && types.length > 0) {
      query = query.in('type', types);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to get relations from: ${error.message}`);
    return (data || []).map((row) => this.rowToRelation(row as RelationRow));
  }

  async getRelationsTo(entityId: string, types?: RelationType[]): Promise<Relation[]> {
    const client = this.ensureClient();
    let query = client.from('relations').select().eq('to_id', entityId).eq('workspace_id', this.workspaceId);

    if (types && types.length > 0) {
      query = query.in('type', types);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to get relations to: ${error.message}`);
    return (data || []).map((row) => this.rowToRelation(row as RelationRow));
  }

  async deleteRelation(id: string): Promise<void> {
    const client = this.ensureClient();
    const { error } = await client
      .from('relations')
      .delete()
      .eq('id', id)
      .eq('workspace_id', this.workspaceId);

    if (error) throw new Error(`Failed to delete relation: ${error.message}`);
  }

  // ===========================================================================
  // Observation Operations
  // ===========================================================================

  async addObservation(params: AddObservationParams): Promise<Observation> {
    const client = this.ensureClient();
    const id = randomUUID();
    const now = new Date().toISOString();

    const row: ObservationInsert = {
      id,
      workspace_id: this.workspaceId,
      entity_id: params.entity_id,
      content: params.content,
      source_session: params.source_session || null,
      added_by: params.added_by || null,
      added_at: now,
      valid_from: now,
    };

    const { data, error } = await client
      .from('observations')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`Failed to add observation: ${error.message}`);
    return this.rowToObservation(data);
  }

  async getObservations(entityId: string): Promise<Observation[]> {
    const client = this.ensureClient();
    const { data, error } = await client
      .from('observations')
      .select()
      .eq('entity_id', entityId)
      .eq('workspace_id', this.workspaceId)
      .order('added_at', { ascending: false });

    if (error) throw new Error(`Failed to get observations: ${error.message}`);
    return (data || []).map((row) => this.rowToObservation(row as ObservationRow));
  }

  // ===========================================================================
  // Query Operations
  // ===========================================================================

  async traverseGraph(params: GraphTraversalParams): Promise<GraphTraversalResult> {
    const maxDepth = params.max_depth || 3;
    const visitedEntities = new Set<string>([params.start_entity_id]);
    const visitedRelations = new Set<string>();
    const entities: Entity[] = [];
    const relations: Relation[] = [];
    const queue: Array<{ id: string; depth: number }> = [
      { id: params.start_entity_id, depth: 0 },
    ];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;

      const entity = await this.getEntity(id);
      if (entity) entities.push(entity);

      if (depth >= maxDepth) continue;

      const outgoing = await this.getRelationsFrom(id, params.relation_types);
      for (const rel of outgoing) {
        if (!visitedRelations.has(rel.id)) {
          visitedRelations.add(rel.id);
          relations.push(rel);
        }
        if (!visitedEntities.has(rel.to_id)) {
          visitedEntities.add(rel.to_id);
          queue.push({ id: rel.to_id, depth: depth + 1 });
        }
      }

      const incoming = await this.getRelationsTo(id, params.relation_types);
      for (const rel of incoming) {
        if (!visitedRelations.has(rel.id)) {
          visitedRelations.add(rel.id);
          relations.push(rel);
        }
        if (!visitedEntities.has(rel.from_id)) {
          visitedEntities.add(rel.from_id);
          queue.push({ id: rel.from_id, depth: depth + 1 });
        }
      }
    }

    return { entities, relations, depth: maxDepth };
  }

  async getStats(): Promise<KnowledgeStats> {
    const client = this.ensureClient();

    // Entity counts by type
    const { data: entityRows, error: entityError } = await client
      .from('entities')
      .select('type')
      .eq('workspace_id', this.workspaceId);

    if (entityError) throw new Error(`Failed to get entity stats: ${entityError.message}`);

    const entity_counts: Record<string, number> = {};
    for (const row of entityRows || []) {
      const t = row.type;
      entity_counts[t] = (entity_counts[t] || 0) + 1;
    }

    // Relation counts by type
    const { data: relationRows, error: relationError } = await client
      .from('relations')
      .select('type')
      .eq('workspace_id', this.workspaceId);

    if (relationError) throw new Error(`Failed to get relation stats: ${relationError.message}`);

    const relation_counts: Record<string, number> = {};
    for (const row of relationRows || []) {
      const t = row.type;
      relation_counts[t] = (relation_counts[t] || 0) + 1;
    }

    // Observation count
    const { count: obsCount, error: obsError } = await client
      .from('observations')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', this.workspaceId);

    if (obsError) throw new Error(`Failed to get observation count: ${obsError.message}`);

    const totalEntities = Object.values(entity_counts).reduce((a, b) => a + b, 0);
    const totalObs = obsCount || 0;

    return {
      entity_counts: entity_counts as Record<EntityType, number>,
      relation_counts: relation_counts as Record<RelationType, number>,
      total_observations: totalObs,
      avg_observations_per_entity: totalEntities > 0 ? totalObs / totalEntities : 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }
}
