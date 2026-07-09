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
  Run,
  CreateSessionParams,
  CreateRunParams,
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
  AuditManifest,
} from './types.js';

// Storage implementations
export { InMemoryStorage, LinkedThoughtStore } from './storage.js';
export { FileSystemStorage, StorageNotScopedError } from './filesystem-storage.js';
export { SupabaseStorage } from './supabase-storage.js';
export type { SupabaseStorageConfig } from './supabase-storage.js';

// Notebook document persistence (notebook_persist contract backends)
export {
  FileSystemNotebookDocumentStorage,
  InMemoryNotebookDocumentStorage,
} from './notebook-document-storage.js';
export type {
  NotebookDocumentStorage,
  NotebookDocumentSummary,
  PersistedNotebookDocument,
} from './notebook-document-storage.js';
export {
  SupabaseNotebookDocumentStorage,
  createSupabaseNotebookDocumentStorageProvider,
} from './supabase-notebook-document-storage.js';
export type { SupabaseNotebookDocumentStorageConfig } from './supabase-notebook-document-storage.js';

// Session exporter
export { SessionExporter } from './export.js';

// Migration utilities
export { migrateExports, listExports } from './migration.js';
export type { MigrationResult, MigrationSessionDetail, MigrationOptions } from './migration.js';
