/**
 * Supabase Knowledge Graph Storage Implementation
 *
 * Supabase-backed persistence for the knowledge graph.
 * Implements the same KnowledgeStorage interface as FileSystemKnowledgeStorage.
 * Uses RLS policies with project-scoped JWTs for multi-tenancy.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
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

export interface SupabaseKnowledgeStorageConfig {
  supabaseUrl: string;
  supabaseKey: string;
  jwtSecret: string;
  /** The workspace ID this knowledge storage instance is strictly scoped to. */
  workspaceId: string;
}

export class SupabaseKnowledgeStorage implements KnowledgeStorage {
  private supabaseUrl: string;
  private supabaseKey: string;
  private jwtSecret: string;
  private workspaceId: string;
  private client: SupabaseClient | null = null;
  private tokenExpiresAt = 0;
  private static TOKEN_TTL = 3600;
  private static TOKEN_REFRESH_MARGIN = 300;

  constructor(config: SupabaseKnowledgeStorageConfig) {
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseKey = config.supabaseKey;
    this.jwtSecret = config.jwtSecret;
    this.workspaceId = config.workspaceId;
  }

  // ===========================================================================
  // Workspace Scoping
  // ===========================================================================

  async setProject(project: string): Promise<void> {
    // Project scoping is deprecated in favor of strict workspaceId scoping at instantiation.
  }

  private refreshClient(): void {

    // FS/local mode: mint a custom JWT with project claim
    const now = Math.floor(Date.now() / 1000);
    const exp = now + SupabaseKnowledgeStorage.TOKEN_TTL;

    const token = jwt.sign(
      {
        role: 'authenticated',
        workspace_id: this.workspaceId,
        iss: 'supabase-demo',
        exp,
      },
      this.jwtSecret,
    );

    this.client = createClient(this.supabaseUrl, this.supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    this.tokenExpiresAt = exp;
  }

  private ensureClient(): SupabaseClient {
    if (!this.workspaceId) {
      throw new Error('Workspace scope not established.');
    }
    const now = Math.floor(Date.now() / 1000);
    if (!this.client || now >= this.tokenExpiresAt - SupabaseKnowledgeStorage.TOKEN_REFRESH_MARGIN) {
      this.refreshClient();
    }
    return this.client!;
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

  private rowToEntity(row: Record<string, unknown>): Entity {
    return {
      id: row.id as string,
      name: row.name as string,
      type: row.type as EntityType,
      label: row.label as string,
      properties: (row.properties as Record<string, unknown>) || {},
      created_at: new Date(row.created_at as string),
      updated_at: new Date(row.updated_at as string),
      created_by: (row.created_by as string) || undefined,
      visibility: (row.visibility as Entity['visibility']) || 'public',
      valid_from: new Date((row.valid_from as string) || (row.created_at as string)),
      valid_to: row.valid_to ? new Date(row.valid_to as string) : undefined,
      superseded_by: (row.superseded_by as string) || undefined,
      access_count: (row.access_count as number) || 0,
      last_accessed_at: new Date((row.last_accessed_at as string) || (row.created_at as string)),
      importance_score: (row.importance_score as number) ?? 0.5,
    };
  }

  private rowToRelation(row: Record<string, unknown>): Relation {
    return {
      id: row.id as string,
      from_id: row.from_id as string,
      to_id: row.to_id as string,
      type: row.type as RelationType,
      properties: (row.properties as Record<string, unknown>) || {},
      created_at: new Date(row.created_at as string),
      created_by: (row.created_by as string) || undefined,
    };
  }

  private rowToObservation(row: Record<string, unknown>): Observation {
    return {
      id: row.id as string,
      entity_id: row.entity_id as string,
      content: row.content as string,
      source_session: (row.source_session as string) || undefined,
      added_by: (row.added_by as string) || undefined,
      added_at: new Date(row.added_at as string),
      valid_from: new Date((row.valid_from as string) || (row.added_at as string)),
      valid_to: row.valid_to ? new Date(row.valid_to as string) : undefined,
      superseded_by: (row.superseded_by as string) || undefined,
    };
  }

  // ===========================================================================
  // Entity Operations
  // ===========================================================================

  async createEntity(params: CreateEntityParams): Promise<Entity> {
    const client = this.ensureClient();
    const now = new Date().toISOString();
    const id = randomUUID();

    const row = {
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
      // Handle UNIQUE(project, name, type) collision — return existing
      if (error.code === '23505') {
        const { data: existing, error: fetchError } = await client
          .from('entities')
          .select()
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
      .maybeSingle();

    if (error) throw new Error(`Failed to get entity: ${error.message}`);
    if (!data) return null;
    return this.rowToEntity(data);
  }

  async listEntities(filter?: EntityFilter): Promise<Entity[]> {
    const client = this.ensureClient();
    let query = client.from('entities').select();

    if (filter?.types && filter.types.length > 0) {
      query = query.in('type', filter.types);
    }

    if (filter?.visibility && filter.visibility.length > 0) {
      query = query.in('visibility', filter.visibility);
    }

    if (filter?.name_pattern) {
      query = query.ilike('name', filter.name_pattern);
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
    return (data || []).map((row: Record<string, unknown>) => this.rowToEntity(row));
  }

  async deleteEntity(id: string): Promise<void> {
    const client = this.ensureClient();
    const { error } = await client
      .from('entities')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete entity: ${error.message}`);
  }

  // ===========================================================================
  // Relation Operations
  // ===========================================================================

  async createRelation(params: CreateRelationParams): Promise<Relation> {
    const client = this.ensureClient();
    const id = randomUUID();

    const row = {
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
    let query = client.from('relations').select().eq('from_id', entityId);

    if (types && types.length > 0) {
      query = query.in('type', types);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to get relations from: ${error.message}`);
    return (data || []).map((row: Record<string, unknown>) => this.rowToRelation(row));
  }

  async getRelationsTo(entityId: string, types?: RelationType[]): Promise<Relation[]> {
    const client = this.ensureClient();
    let query = client.from('relations').select().eq('to_id', entityId);

    if (types && types.length > 0) {
      query = query.in('type', types);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to get relations to: ${error.message}`);
    return (data || []).map((row: Record<string, unknown>) => this.rowToRelation(row));
  }

  async deleteRelation(id: string): Promise<void> {
    const client = this.ensureClient();
    const { error } = await client
      .from('relations')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete relation: ${error.message}`);
  }

  // ===========================================================================
  // Observation Operations
  // ===========================================================================

  async addObservation(params: AddObservationParams): Promise<Observation> {
    const client = this.ensureClient();
    const id = randomUUID();
    const now = new Date().toISOString();

    const row = {
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
      .order('added_at', { ascending: false });

    if (error) throw new Error(`Failed to get observations: ${error.message}`);
    return (data || []).map((row: Record<string, unknown>) => this.rowToObservation(row));
  }

  // ===========================================================================
  // Query Operations
  // ===========================================================================

  async traverseGraph(params: GraphTraversalParams): Promise<GraphTraversalResult> {
    const maxDepth = params.max_depth || 3;
    const visited = new Set<string>([params.start_entity_id]);
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
        relations.push(rel);
        if (!visited.has(rel.to_id)) {
          visited.add(rel.to_id);
          queue.push({ id: rel.to_id, depth: depth + 1 });
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
      .select('type');

    if (entityError) throw new Error(`Failed to get entity stats: ${entityError.message}`);

    const entity_counts: Record<string, number> = {};
    for (const row of entityRows || []) {
      const t = row.type as string;
      entity_counts[t] = (entity_counts[t] || 0) + 1;
    }

    // Relation counts by type
    const { data: relationRows, error: relationError } = await client
      .from('relations')
      .select('type');

    if (relationError) throw new Error(`Failed to get relation stats: ${relationError.message}`);

    const relation_counts: Record<string, number> = {};
    for (const row of relationRows || []) {
      const t = row.type as string;
      relation_counts[t] = (relation_counts[t] || 0) + 1;
    }

    // Observation count
    const { count: obsCount, error: obsError } = await client
      .from('observations')
      .select('id', { count: 'exact', head: true });

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
