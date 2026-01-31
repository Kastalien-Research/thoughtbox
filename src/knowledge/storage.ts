/**
 * Knowledge Graph Storage Implementation
 *
 * Phase 1 MVP: JSONL + SQLite dual storage
 * - JSONL: Append-only source of truth (git-trackable)
 * - SQLite: Query index (regenerated from JSONL)
 *
 * @see dgm-specs/SPEC-KNOWLEDGE-MEMORY.md
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import type {
  KnowledgeStorage,
  Entity,
  Relation,
  Observation,
  CreateEntityParams,
  CreateRelationParams,
  AddObservationParams,
  EntityFilter,
  GraphTraversalParams,
  GraphTraversalResult,
  KnowledgeStats,
  JsonlEntry,
  JsonlEntityEntry,
  JsonlRelationEntry,
  JsonlObservationEntry,
} from './types.js';

// =============================================================================
// File System Knowledge Storage
// =============================================================================

export interface KnowledgeStorageOptions {
  /** Base directory for all data. Default: ~/.thoughtbox */
  basePath?: string;
  /** Project scope - isolates all storage to this project. Default: '_default' */
  project?: string;
}

export class FileSystemKnowledgeStorage implements KnowledgeStorage {
  private basePath: string;
  private project: string;
  private db: Database.Database | null = null;
  private initialized = false;

  constructor(options: KnowledgeStorageOptions = {}) {
    this.basePath = options.basePath || path.join(os.homedir(), '.thoughtbox');
    this.project = options.project || '_default';
  }

  // ===========================================================================
  // Paths
  // ===========================================================================

  private getProjectDir(): string {
    return path.join(this.basePath, 'projects', this.project);
  }

  private getMemoryDir(): string {
    return path.join(this.getProjectDir(), 'memory');
  }

  private getJsonlPath(): string {
    return path.join(this.getMemoryDir(), 'graph.jsonl');
  }

  private getDbPath(): string {
    return path.join(this.getMemoryDir(), 'memory.db');
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Create directories
    const memoryDir = this.getMemoryDir();
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }

    // Create JSONL if doesn't exist
    const jsonlPath = this.getJsonlPath();
    if (!fs.existsSync(jsonlPath)) {
      fs.writeFileSync(jsonlPath, '', 'utf8');
    }

    // Open SQLite database
    this.db = new Database(this.getDbPath());

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    // Create schema
    this.createSchema();

    // Rebuild index from JSONL
    await this.rebuildIndexFromJsonl();

    this.initialized = true;
  }

  private createSchema(): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        label TEXT NOT NULL,
        properties TEXT,              -- JSON
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        created_by TEXT,
        visibility TEXT DEFAULT 'public',
        valid_from INTEGER NOT NULL,
        valid_to INTEGER,
        superseded_by TEXT,
        access_count INTEGER DEFAULT 0,
        last_accessed_at INTEGER,
        importance_score REAL DEFAULT 0.5,
        UNIQUE(name, type)
      );

      CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
      CREATE INDEX IF NOT EXISTS idx_entities_visibility ON entities(visibility);
      CREATE INDEX IF NOT EXISTS idx_entities_valid ON entities(valid_from, valid_to);
      CREATE INDEX IF NOT EXISTS idx_entities_importance ON entities(importance_score DESC);

      CREATE TABLE IF NOT EXISTS relations (
        id TEXT PRIMARY KEY,
        from_id TEXT NOT NULL,
        to_id TEXT NOT NULL,
        type TEXT NOT NULL,
        properties TEXT,              -- JSON
        created_at INTEGER NOT NULL,
        created_by TEXT,
        FOREIGN KEY (from_id) REFERENCES entities(id) ON DELETE CASCADE,
        FOREIGN KEY (to_id) REFERENCES entities(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_relations_from ON relations(from_id);
      CREATE INDEX IF NOT EXISTS idx_relations_to ON relations(to_id);
      CREATE INDEX IF NOT EXISTS idx_relations_type ON relations(type);

      CREATE TABLE IF NOT EXISTS observations (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL,
        content TEXT NOT NULL,
        source_session TEXT,
        added_by TEXT,
        added_at INTEGER NOT NULL,
        valid_from INTEGER NOT NULL,
        valid_to INTEGER,
        superseded_by TEXT,
        FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_observations_entity ON observations(entity_id);
      CREATE INDEX IF NOT EXISTS idx_observations_session ON observations(source_session);
      CREATE INDEX IF NOT EXISTS idx_observations_valid ON observations(valid_from, valid_to);

      -- Full-text search for observations
      CREATE VIRTUAL TABLE IF NOT EXISTS observations_fts USING fts5(
        content,
        content=observations,
        content_rowid=rowid
      );
    `);
  }

  // ===========================================================================
  // JSONL Operations
  // ===========================================================================

  private appendJsonl(entry: JsonlEntry): void {
    const jsonlPath = this.getJsonlPath();
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(jsonlPath, line, 'utf8');
  }

  async rebuildIndexFromJsonl(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const jsonlPath = this.getJsonlPath();
    if (!fs.existsSync(jsonlPath)) return;

    // Clear existing data
    this.db.exec('DELETE FROM observations');
    this.db.exec('DELETE FROM relations');
    this.db.exec('DELETE FROM entities');

    // Read JSONL line by line
    const content = fs.readFileSync(jsonlPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());

    for (const line of lines) {
      try {
        const entry: JsonlEntry = JSON.parse(line);

        if (entry.type === 'entity') {
          this.insertEntityFromJsonl(entry);
        } else if (entry.type === 'relation') {
          this.insertRelationFromJsonl(entry);
        } else if (entry.type === 'observation') {
          this.insertObservationFromJsonl(entry);
        }
      } catch (error) {
        // Skip malformed lines, log warning
        console.warn(`[Knowledge] Skipping malformed JSONL line: ${line.substring(0, 100)}`);
      }
    }
  }

  private insertEntityFromJsonl(entry: JsonlEntityEntry): void {
    if (!this.db) return;

    this.db.prepare(`
      INSERT OR IGNORE INTO entities (
        id, name, type, label, properties, created_at, updated_at,
        created_by, visibility, valid_from, valid_to, superseded_by,
        access_count, last_accessed_at, importance_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.id,
      entry.name,
      entry.entityType,
      entry.label,
      JSON.stringify(entry.properties),
      new Date(entry.created_at).getTime(),
      new Date(entry.updated_at).getTime(),
      entry.created_by || null,
      entry.visibility,
      new Date(entry.valid_from).getTime(),
      entry.valid_to ? new Date(entry.valid_to).getTime() : null,
      entry.superseded_by || null,
      0,  // access_count
      null,  // last_accessed_at
      0.5  // importance_score
    );
  }

  private insertRelationFromJsonl(entry: JsonlRelationEntry): void {
    if (!this.db) return;

    this.db.prepare(`
      INSERT OR IGNORE INTO relations (
        id, from_id, to_id, type, properties, created_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.id,
      entry.from_id,
      entry.to_id,
      entry.relationType,
      JSON.stringify(entry.properties),
      new Date(entry.created_at).getTime(),
      entry.created_by || null
    );
  }

  private insertObservationFromJsonl(entry: JsonlObservationEntry): void {
    if (!this.db) return;

    this.db.prepare(`
      INSERT OR IGNORE INTO observations (
        id, entity_id, content, source_session, added_by, added_at,
        valid_from, valid_to, superseded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.id,
      entry.entity_id,
      entry.content,
      entry.source_session || null,
      entry.added_by || null,
      new Date(entry.added_at).getTime(),
      new Date(entry.valid_from).getTime(),
      entry.valid_to ? new Date(entry.valid_to).getTime() : null,
      entry.superseded_by || null
    );
  }

  // ===========================================================================
  // Entity Operations
  // ===========================================================================

  async createEntity(params: CreateEntityParams): Promise<Entity> {
    if (!this.db) throw new Error('Storage not initialized');

    const now = new Date();
    const entity: Entity = {
      id: randomUUID(),
      name: params.name,
      type: params.type,
      label: params.label,
      properties: params.properties || {},
      created_at: now,
      updated_at: now,
      created_by: params.created_by,
      visibility: params.visibility || 'public',
      valid_from: now,
      valid_to: undefined,
      superseded_by: undefined,
      access_count: 0,
      last_accessed_at: now,
      importance_score: 0.5,
    };

    // Append to JSONL (source of truth)
    const jsonlEntry: JsonlEntityEntry = {
      type: 'entity',
      id: entity.id,
      name: entity.name,
      entityType: entity.type,
      label: entity.label,
      properties: entity.properties,
      created_at: entity.created_at.toISOString(),
      updated_at: entity.updated_at.toISOString(),
      created_by: entity.created_by,
      visibility: entity.visibility,
      valid_from: entity.valid_from.toISOString(),
      valid_to: entity.valid_to?.toISOString(),
      superseded_by: entity.superseded_by,
    };
    this.appendJsonl(jsonlEntry);

    // Insert to SQLite (query index)
    try {
      this.db.prepare(`
        INSERT INTO entities (
          id, name, type, label, properties, created_at, updated_at,
          created_by, visibility, valid_from, valid_to, superseded_by,
          access_count, last_accessed_at, importance_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        entity.id,
        entity.name,
        entity.type,
        entity.label,
        JSON.stringify(entity.properties),
        entity.created_at.getTime(),
        entity.updated_at.getTime(),
        entity.created_by || null,
        entity.visibility,
        entity.valid_from.getTime(),
        entity.valid_to?.getTime() || null,
        entity.superseded_by || null,
        entity.access_count,
        entity.last_accessed_at.getTime(),
        entity.importance_score
      );
    } catch (error: any) {
      // Duplicate entity (same name+type) - idempotent, return existing
      if (error.code === 'SQLITE_CONSTRAINT') {
        const existing = this.db.prepare(`
          SELECT * FROM entities WHERE name = ? AND type = ?
        `).get(params.name, params.type) as any;

        if (existing) {
          return this.rowToEntity(existing);
        }
      }
      throw error;
    }

    return entity;
  }

  async getEntity(id: string): Promise<Entity | null> {
    if (!this.db) throw new Error('Storage not initialized');

    const row = this.db.prepare('SELECT * FROM entities WHERE id = ?').get(id) as any;
    if (!row) return null;

    // Update access metrics
    this.db.prepare(`
      UPDATE entities
      SET access_count = access_count + 1,
          last_accessed_at = ?
      WHERE id = ?
    `).run(Date.now(), id);

    return this.rowToEntity(row);
  }

  async listEntities(filter?: EntityFilter): Promise<Entity[]> {
    if (!this.db) throw new Error('Storage not initialized');

    let sql = 'SELECT * FROM entities WHERE 1=1';
    const params: any[] = [];

    if (filter?.types && filter.types.length > 0) {
      sql += ` AND type IN (${filter.types.map(() => '?').join(', ')})`;
      params.push(...filter.types);
    }

    if (filter?.visibility && filter.visibility.length > 0) {
      sql += ` AND visibility IN (${filter.visibility.map(() => '?').join(', ')})`;
      params.push(...filter.visibility);
    }

    if (filter?.name_pattern) {
      sql += ` AND name LIKE ?`;
      params.push(filter.name_pattern);
    }

    if (filter?.created_after) {
      sql += ` AND created_at >= ?`;
      params.push(filter.created_after.getTime());
    }

    if (filter?.created_before) {
      sql += ` AND created_at <= ?`;
      params.push(filter.created_before.getTime());
    }

    sql += ` ORDER BY importance_score DESC`;

    if (filter?.limit) {
      sql += ` LIMIT ?`;
      params.push(filter.limit);
    }

    if (filter?.offset) {
      sql += ` OFFSET ?`;
      params.push(filter.offset);
    }

    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map(row => this.rowToEntity(row));
  }

  async deleteEntity(id: string): Promise<void> {
    if (!this.db) throw new Error('Storage not initialized');

    // Note: JSONL is append-only, we don't remove lines
    // Just mark as deleted in SQLite (CASCADE handles relations/observations)
    this.db.prepare('DELETE FROM entities WHERE id = ?').run(id);
  }

  // ===========================================================================
  // Relation Operations
  // ===========================================================================

  async createRelation(params: CreateRelationParams): Promise<Relation> {
    if (!this.db) throw new Error('Storage not initialized');

    const now = new Date();
    const relation: Relation = {
      id: randomUUID(),
      from_id: params.from_id,
      to_id: params.to_id,
      type: params.type,
      properties: params.properties || {},
      created_at: now,
      created_by: params.created_by,
    };

    // Append to JSONL
    const jsonlEntry: JsonlRelationEntry = {
      type: 'relation',
      id: relation.id,
      from_id: relation.from_id,
      to_id: relation.to_id,
      relationType: relation.type,
      properties: relation.properties,
      created_at: relation.created_at.toISOString(),
      created_by: relation.created_by,
    };
    this.appendJsonl(jsonlEntry);

    // Insert to SQLite
    this.db.prepare(`
      INSERT INTO relations (
        id, from_id, to_id, type, properties, created_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      relation.id,
      relation.from_id,
      relation.to_id,
      relation.type,
      JSON.stringify(relation.properties),
      relation.created_at.getTime(),
      relation.created_by || null
    );

    return relation;
  }

  async getRelationsFrom(entityId: string, types?: string[]): Promise<Relation[]> {
    if (!this.db) throw new Error('Storage not initialized');

    let sql = 'SELECT * FROM relations WHERE from_id = ?';
    const params: any[] = [entityId];

    if (types && types.length > 0) {
      sql += ` AND type IN (${types.map(() => '?').join(', ')})`;
      params.push(...types);
    }

    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map(row => this.rowToRelation(row));
  }

  async getRelationsTo(entityId: string, types?: string[]): Promise<Relation[]> {
    if (!this.db) throw new Error('Storage not initialized');

    let sql = 'SELECT * FROM relations WHERE to_id = ?';
    const params: any[] = [entityId];

    if (types && types.length > 0) {
      sql += ` AND type IN (${types.map(() => '?').join(', ')})`;
      params.push(...types);
    }

    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map(row => this.rowToRelation(row));
  }

  async deleteRelation(id: string): Promise<void> {
    if (!this.db) throw new Error('Storage not initialized');

    this.db.prepare('DELETE FROM relations WHERE id = ?').run(id);
  }

  // ===========================================================================
  // Observation Operations
  // ===========================================================================

  async addObservation(params: AddObservationParams): Promise<Observation> {
    if (!this.db) throw new Error('Storage not initialized');

    const now = new Date();
    const observation: Observation = {
      id: randomUUID(),
      entity_id: params.entity_id,
      content: params.content,
      source_session: params.source_session,
      added_by: params.added_by,
      added_at: now,
      valid_from: now,
      valid_to: undefined,
      superseded_by: undefined,
    };

    // Append to JSONL
    const jsonlEntry: JsonlObservationEntry = {
      type: 'observation',
      id: observation.id,
      entity_id: observation.entity_id,
      content: observation.content,
      source_session: observation.source_session,
      added_by: observation.added_by,
      added_at: observation.added_at.toISOString(),
      valid_from: observation.valid_from.toISOString(),
      valid_to: observation.valid_to?.toISOString(),
      superseded_by: observation.superseded_by,
    };
    this.appendJsonl(jsonlEntry);

    // Insert to SQLite
    this.db.prepare(`
      INSERT INTO observations (
        id, entity_id, content, source_session, added_by, added_at,
        valid_from, valid_to, superseded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      observation.id,
      observation.entity_id,
      observation.content,
      observation.source_session || null,
      observation.added_by || null,
      observation.added_at.getTime(),
      observation.valid_from.getTime(),
      observation.valid_to?.getTime() || null,
      observation.superseded_by || null
    );

    return observation;
  }

  async getObservations(entityId: string): Promise<Observation[]> {
    if (!this.db) throw new Error('Storage not initialized');

    const rows = this.db.prepare(`
      SELECT * FROM observations WHERE entity_id = ? ORDER BY added_at DESC
    `).all(entityId) as any[];

    return rows.map(row => this.rowToObservation(row));
  }

  // ===========================================================================
  // Query Operations
  // ===========================================================================

  async traverseGraph(params: GraphTraversalParams): Promise<GraphTraversalResult> {
    if (!this.db) throw new Error('Storage not initialized');

    const maxDepth = params.max_depth || 3;
    const visited = new Set<string>([params.start_entity_id]);
    const entities: Entity[] = [];
    const relations: Relation[] = [];
    const queue: Array<{ id: string; depth: number }> = [{ id: params.start_entity_id, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;

      if (depth > maxDepth) continue;

      // Get entity
      const entity = await this.getEntity(id);
      if (entity) entities.push(entity);

      // Get outgoing relations
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
    if (!this.db) throw new Error('Storage not initialized');

    // Entity counts by type
    const entityRows = this.db.prepare(`
      SELECT type, COUNT(*) as count FROM entities GROUP BY type
    `).all() as Array<{ type: string; count: number }>;

    const entity_counts: Record<string, number> = {};
    for (const row of entityRows) {
      entity_counts[row.type] = row.count;
    }

    // Relation counts by type
    const relationRows = this.db.prepare(`
      SELECT type, COUNT(*) as count FROM relations GROUP BY type
    `).all() as Array<{ type: string; count: number }>;

    const relation_counts: Record<string, number> = {};
    for (const row of relationRows) {
      relation_counts[row.type] = row.count;
    }

    // Total observations
    const obsCount = this.db.prepare('SELECT COUNT(*) as count FROM observations').get() as { count: number };

    // Average observations per entity
    const entityCount = this.db.prepare('SELECT COUNT(*) as count FROM entities').get() as { count: number };
    const avg_observations_per_entity = entityCount.count > 0
      ? obsCount.count / entityCount.count
      : 0;

    return {
      entity_counts: entity_counts as any,
      relation_counts: relation_counts as any,
      total_observations: obsCount.count,
      avg_observations_per_entity,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  // ===========================================================================
  // Row Mapping
  // ===========================================================================

  private rowToEntity(row: any): Entity {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      label: row.label,
      properties: row.properties ? JSON.parse(row.properties) : {},
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      created_by: row.created_by,
      visibility: row.visibility,
      valid_from: new Date(row.valid_from),
      valid_to: row.valid_to ? new Date(row.valid_to) : undefined,
      superseded_by: row.superseded_by,
      access_count: row.access_count,
      last_accessed_at: new Date(row.last_accessed_at),
      importance_score: row.importance_score,
    };
  }

  private rowToRelation(row: any): Relation {
    return {
      id: row.id,
      from_id: row.from_id,
      to_id: row.to_id,
      type: row.type,
      properties: row.properties ? JSON.parse(row.properties) : {},
      created_at: new Date(row.created_at),
      created_by: row.created_by,
    };
  }

  private rowToObservation(row: any): Observation {
    return {
      id: row.id,
      entity_id: row.entity_id,
      content: row.content,
      source_session: row.source_session,
      added_by: row.added_by,
      added_at: new Date(row.added_at),
      valid_from: new Date(row.valid_from),
      valid_to: row.valid_to ? new Date(row.valid_to) : undefined,
      superseded_by: row.superseded_by,
    };
  }
}
