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
} from './types.js';

// Storage implementation
export { InMemoryStorage, LinkedThoughtStore } from './storage.js';

// Session exporter
export { SessionExporter } from './export.js';
