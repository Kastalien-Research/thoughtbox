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
  // Knowledge Zone types
  KnowledgePattern,
  CreatePatternParams,
  UpdatePatternParams,
  PatternFilter,
  ScratchpadNote,
} from './types.js';

// Storage implementation (InMemoryStorage exported as FileSystemStorage for compatibility)
export { InMemoryStorage, FileSystemStorage } from './storage.js';
