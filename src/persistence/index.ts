/**
 * Persistence Module Exports
 *
 * Central export point for the Thoughtbox persistence layer.
 * Uses in-memory storage for simplicity.
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
  // Linked node types
  ThoughtNodeId,
  ThoughtNode,
  ThoughtIndexes,
  SessionExport,
  ExportOptions,
  // Session analysis types (for session toolhost)
  SessionAnalysis,
  ExtractedLearning,
} from './types.js';

// Storage implementations
export { InMemoryStorage, LinkedThoughtStore } from './storage.js';
export { FileSystemStorage } from './filesystem-storage.js';

// Session exporter
export { SessionExporter } from './export.js';

// Migration utilities
export { migrateExports, listExports } from './migration.js';
export type { MigrationResult, MigrationSessionDetail, MigrationOptions } from './migration.js';
