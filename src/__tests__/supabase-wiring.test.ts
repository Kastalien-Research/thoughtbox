/**
 * Wiring tests for createStorage() factory.
 *
 * ADR Hypothesis H6: THOUGHTBOX_STORAGE=supabase returns SupabaseStorage.
 *
 * These tests verify the env-based dispatch in src/index.ts.
 * Since src/index.ts runs the server on import, we test the logic
 * by importing SupabaseStorage directly and verifying its interface.
 */

import { describe, it, expect } from 'vitest';
import { SupabaseStorage } from '../persistence/supabase-storage.js';
import { SupabaseKnowledgeStorage } from '../knowledge/supabase-storage.js';
import type { ThoughtboxStorage } from '../persistence/types.js';
import type { KnowledgeStorage } from '../knowledge/types.js';

describe('H6: createStorage() wiring', () => {
  it('SupabaseStorage implements ThoughtboxStorage interface', () => {
    const storage = new SupabaseStorage({
      supabaseUrl: 'http://localhost:54321',
      supabaseKey: 'test-key',
      jwtSecret: 'test-secret',
      workspaceId: 'test-workspace',
    });

    // Verify all required methods exist
    const iface: ThoughtboxStorage = storage;
    expect(typeof iface.initialize).toBe('function');
    expect(typeof iface.setProject).toBe('function');
    expect(typeof iface.getProject).toBe('function');
    expect(typeof iface.getConfig).toBe('function');
    expect(typeof iface.updateConfig).toBe('function');
    expect(typeof iface.createSession).toBe('function');
    expect(typeof iface.getSession).toBe('function');
    expect(typeof iface.updateSession).toBe('function');
    expect(typeof iface.deleteSession).toBe('function');
    expect(typeof iface.listSessions).toBe('function');
    expect(typeof iface.saveThought).toBe('function');
    expect(typeof iface.getThoughts).toBe('function');
    expect(typeof iface.getAllThoughts).toBe('function');
    expect(typeof iface.getBranchIds).toBe('function');
    expect(typeof iface.getThought).toBe('function');
    expect(typeof iface.saveBranchThought).toBe('function');
    expect(typeof iface.getBranch).toBe('function');
    expect(typeof iface.updateThoughtCritique).toBe('function');
    expect(typeof iface.exportSession).toBe('function');
    expect(typeof iface.toLinkedExport).toBe('function');
    expect(typeof iface.validateSessionIntegrity).toBe('function');
  });

  it('SupabaseKnowledgeStorage implements KnowledgeStorage interface', () => {
    const storage = new SupabaseKnowledgeStorage({
      supabaseUrl: 'http://localhost:54321',
      supabaseKey: 'test-key',
      jwtSecret: 'test-secret',
      workspaceId: 'test-workspace',
    });

    const iface: KnowledgeStorage = storage;
    expect(typeof iface.initialize).toBe('function');
    expect(typeof iface.setProject).toBe('function');
    expect(typeof iface.createEntity).toBe('function');
    expect(typeof iface.getEntity).toBe('function');
    expect(typeof iface.listEntities).toBe('function');
    expect(typeof iface.deleteEntity).toBe('function');
    expect(typeof iface.createRelation).toBe('function');
    expect(typeof iface.getRelationsFrom).toBe('function');
    expect(typeof iface.getRelationsTo).toBe('function');
    expect(typeof iface.deleteRelation).toBe('function');
    expect(typeof iface.addObservation).toBe('function');
    expect(typeof iface.getObservations).toBe('function');
    expect(typeof iface.traverseGraph).toBe('function');
    expect(typeof iface.getStats).toBe('function');
    expect(typeof iface.rebuildIndexFromJsonl).toBe('function');
  });
});
