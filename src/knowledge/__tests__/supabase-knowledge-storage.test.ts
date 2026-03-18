/**
 * Integration tests for SupabaseKnowledgeStorage (KnowledgeStorage interface).
 *
 * Requires a local Supabase instance via `supabase start`.
 * No mocking -- all tests hit real Postgres.
 *
 * ADR Hypotheses validated:
 *   H4 -- tsvector FTS on observations
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { SupabaseKnowledgeStorage } from '../supabase-storage.js';
import {
  isSupabaseAvailable,
  getTestSupabaseConfig,
  truncateAllTables,
  createServiceClient,
} from '../../__tests__/supabase-test-helpers.js';

describe('SupabaseKnowledgeStorage (KnowledgeStorage)', () => {
  let storage: SupabaseKnowledgeStorage;
  let available = false;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
  });

  beforeEach(async () => {
    if (!available) return;
    await truncateAllTables();
    storage = new SupabaseKnowledgeStorage({
      ...getTestSupabaseConfig(),
      workspaceId: 'test-knowledge',
    });
    await storage.initialize();
  });

  // ===========================================================================
  // Entity CRUD
  // ===========================================================================

  describe('Entity operations', () => {
    it('creates and retrieves an entity', async ({ skip }) => {
      if (!available) skip();
      const entity = await storage.createEntity({
        name: 'test-entity',
        type: 'Concept',
        label: 'Test Entity',
        properties: { domain: 'testing' },
      });

      expect(entity.id).toBeDefined();
      expect(entity.name).toBe('test-entity');
      expect(entity.type).toBe('Concept');
      expect(entity.label).toBe('Test Entity');
      expect(entity.properties).toEqual({ domain: 'testing' });

      const fetched = await storage.getEntity(entity.id);
      expect(fetched).not.toBeNull();
      expect(fetched!.name).toBe('test-entity');
    });

    it('returns null for nonexistent entity', async ({ skip }) => {
      if (!available) skip();
      const result = await storage.getEntity('00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });

    it('returns existing entity on UNIQUE collision', async ({ skip }) => {
      if (!available) skip();
      const first = await storage.createEntity({
        name: 'dup-entity',
        type: 'Concept',
        label: 'First',
      });

      const second = await storage.createEntity({
        name: 'dup-entity',
        type: 'Concept',
        label: 'Second',
      });

      expect(second.id).toBe(first.id);
      expect(second.label).toBe('First'); // original preserved
    });

    it('lists entities with type filter', async ({ skip }) => {
      if (!available) skip();
      await storage.createEntity({ name: 'insight-1', type: 'Insight', label: 'I1' });
      await storage.createEntity({ name: 'concept-1', type: 'Concept', label: 'C1' });

      const insights = await storage.listEntities({ types: ['Insight'] });
      expect(insights).toHaveLength(1);
      expect(insights[0].type).toBe('Insight');
    });

    it('deletes entity and cascades to relations/observations', async ({ skip }) => {
      if (!available) skip();
      const e1 = await storage.createEntity({ name: 'e1', type: 'Concept', label: 'E1' });
      const e2 = await storage.createEntity({ name: 'e2', type: 'Concept', label: 'E2' });

      await storage.createRelation({ from_id: e1.id, to_id: e2.id, type: 'RELATES_TO' });
      await storage.addObservation({ entity_id: e1.id, content: 'Some fact' });

      await storage.deleteEntity(e1.id);

      const relFrom = await storage.getRelationsFrom(e1.id);
      expect(relFrom).toHaveLength(0);

      const obs = await storage.getObservations(e1.id);
      expect(obs).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Relation CRUD
  // ===========================================================================

  describe('Relation operations', () => {
    it('creates and retrieves relations', async ({ skip }) => {
      if (!available) skip();
      const e1 = await storage.createEntity({ name: 'src', type: 'Concept', label: 'Source' });
      const e2 = await storage.createEntity({ name: 'tgt', type: 'Concept', label: 'Target' });

      const rel = await storage.createRelation({
        from_id: e1.id,
        to_id: e2.id,
        type: 'BUILDS_ON',
        properties: { reason: 'extends' },
      });

      expect(rel.from_id).toBe(e1.id);
      expect(rel.to_id).toBe(e2.id);
      expect(rel.type).toBe('BUILDS_ON');

      const outgoing = await storage.getRelationsFrom(e1.id);
      expect(outgoing).toHaveLength(1);

      const incoming = await storage.getRelationsTo(e2.id);
      expect(incoming).toHaveLength(1);
    });

    it('filters relations by type', async ({ skip }) => {
      if (!available) skip();
      const e1 = await storage.createEntity({ name: 'a', type: 'Concept', label: 'A' });
      const e2 = await storage.createEntity({ name: 'b', type: 'Concept', label: 'B' });

      await storage.createRelation({ from_id: e1.id, to_id: e2.id, type: 'BUILDS_ON' });
      await storage.createRelation({ from_id: e1.id, to_id: e2.id, type: 'CONTRADICTS' });

      const filtered = await storage.getRelationsFrom(e1.id, ['BUILDS_ON']);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('BUILDS_ON');
    });

    it('deletes a relation', async ({ skip }) => {
      if (!available) skip();
      const e1 = await storage.createEntity({ name: 'x', type: 'Concept', label: 'X' });
      const e2 = await storage.createEntity({ name: 'y', type: 'Concept', label: 'Y' });

      const rel = await storage.createRelation({ from_id: e1.id, to_id: e2.id, type: 'RELATES_TO' });
      await storage.deleteRelation(rel.id);

      const remaining = await storage.getRelationsFrom(e1.id);
      expect(remaining).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Observation CRUD
  // ===========================================================================

  describe('Observation operations', () => {
    it('adds and retrieves observations', async ({ skip }) => {
      if (!available) skip();
      const entity = await storage.createEntity({ name: 'obs-test', type: 'Insight', label: 'Obs' });

      const obs1 = await storage.addObservation({ entity_id: entity.id, content: 'First observation' });
      await storage.addObservation({ entity_id: entity.id, content: 'Second observation' });

      expect(obs1.content).toBe('First observation');
      expect(obs1.entity_id).toBe(entity.id);

      const observations = await storage.getObservations(entity.id);
      expect(observations).toHaveLength(2);
    });
  });

  // ===========================================================================
  // H4: tsvector FTS
  // ===========================================================================

  describe('H4: Full-text search on observations', () => {
    it('finds observations via tsvector search', async ({ skip }) => {
      if (!available) skip();
      const entity = await storage.createEntity({ name: 'fts-test', type: 'Insight', label: 'FTS' });

      await storage.addObservation({ entity_id: entity.id, content: 'The orchestrator pattern uses worker delegation' });
      await storage.addObservation({ entity_id: entity.id, content: 'Memory consolidation happens during idle periods' });
      await storage.addObservation({ entity_id: entity.id, content: 'Circuit breaker prevents cascading failures' });

      // Use service_role client to query with tsvector directly
      const serviceClient = createServiceClient();
      const { data, error } = await serviceClient
        .from('observations')
        .select()
        .textSearch('content_tsv', 'orchestrator & delegation', { type: 'plain' });

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(1);
      expect(data![0].content).toContain('orchestrator');
    });
  });

  // ===========================================================================
  // Graph traversal
  // ===========================================================================

  describe('Graph traversal', () => {
    it('traverses outgoing relations up to max_depth', async ({ skip }) => {
      if (!available) skip();
      const e1 = await storage.createEntity({ name: 'root', type: 'Concept', label: 'Root' });
      const e2 = await storage.createEntity({ name: 'child', type: 'Concept', label: 'Child' });
      const e3 = await storage.createEntity({ name: 'grandchild', type: 'Concept', label: 'Grandchild' });

      await storage.createRelation({ from_id: e1.id, to_id: e2.id, type: 'BUILDS_ON' });
      await storage.createRelation({ from_id: e2.id, to_id: e3.id, type: 'BUILDS_ON' });

      const result = await storage.traverseGraph({
        start_entity_id: e1.id,
        max_depth: 3,
      });

      expect(result.entities.length).toBeGreaterThanOrEqual(3);
      expect(result.relations.length).toBeGreaterThanOrEqual(2);
    });

    it('respects max_depth limit', async ({ skip }) => {
      if (!available) skip();
      const e1 = await storage.createEntity({ name: 'd-root', type: 'Concept', label: 'R' });
      const e2 = await storage.createEntity({ name: 'd-child', type: 'Concept', label: 'C' });
      const e3 = await storage.createEntity({ name: 'd-grand', type: 'Concept', label: 'G' });

      await storage.createRelation({ from_id: e1.id, to_id: e2.id, type: 'RELATES_TO' });
      await storage.createRelation({ from_id: e2.id, to_id: e3.id, type: 'RELATES_TO' });

      const result = await storage.traverseGraph({
        start_entity_id: e1.id,
        max_depth: 1,
      });

      // Depth 1: visits root (depth 0), follows relations to child (depth 1), stops
      const entityIds = result.entities.map(e => e.id);
      expect(entityIds).toContain(e1.id);
      expect(entityIds).toContain(e2.id);
      expect(entityIds).not.toContain(e3.id);
    });
  });

  // ===========================================================================
  // Stats
  // ===========================================================================

  describe('Stats', () => {
    it('returns correct counts', async ({ skip }) => {
      if (!available) skip();
      await storage.createEntity({ name: 's1', type: 'Concept', label: 'S1' });
      await storage.createEntity({ name: 's2', type: 'Insight', label: 'S2' });

      const stats = await storage.getStats();
      expect(stats.entity_counts['Concept']).toBe(1);
      expect(stats.entity_counts['Insight']).toBe(1);
    });
  });

  // ===========================================================================
  // Project scoping and no-ops
  // ===========================================================================

  describe('Project scoping and no-ops', () => {
    it('rebuildIndexFromJsonl is a no-op', async ({ skip }) => {
      if (!available) skip();
      // Should not throw
      await storage.rebuildIndexFromJsonl();
    });
  });
});
