/**
 * Knowledge Graph Memory System
 *
 * Phase 1 MVP: Basic entity/relation/observation storage
 *
 * @see dgm-specs/SPEC-KNOWLEDGE-MEMORY.md
 */

export * from './types.js';
export * from './storage.js';
export * from './handler.js';
export { SupabaseKnowledgeStorage } from './supabase-storage.js';
export type { SupabaseKnowledgeStorageConfig } from './supabase-storage.js';
