/**
 * Persistence Module Exports
 *
 * Central export point for the Thoughtbox persistence layer.
 */

// Types
export type {
  Config,
  Session,
  CreateSessionParams,
  SessionFilter,
  ThoughtData,
  ThoughtInput,
  SessionManifest,
  ThoughtboxStorage,
  IntegrityValidationResult,
  TimePartitionGranularity,
  // Knowledge Zone types
  KnowledgePattern,
  CreatePatternParams,
  UpdatePatternParams,
  PatternFilter,
  ScratchpadNote,
} from './types.js';

// Storage implementations
export { FileSystemStorage } from './storage.js';
export { KnowledgeStorage } from './knowledge-storage.js';

// Database utilities
export {
  getDatabase,
  getDataDir,
  closeDatabase,
  resetDatabase,
  type DatabaseInstance,
} from './db/index.js';

// Migrations
export { runMigrations } from './db/migrate.js';

// Schema (for direct database access if needed)
export * as schema from './db/schema.js';
