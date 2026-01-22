/**
 * Reasoning Tasks Module
 *
 * Exports types and storage for task management.
 *
 * @see dgm-specs/SPEC-REASONING-TASKS.md
 */

// Type exports
export type {
  TaskStatus,
  CompletionCriterion,
  TaskNote,
  SubtaskCompletionStrategy,
  SessionTaskRole,
  ReasoningTask,
  TaskAction,
  ErrorCode,
  TaskOperationError,
  TaskListFilters,
  TaskSummary,
} from './types.js';

// Storage exports
export type {
  TaskStorage,
  TaskStorageOptions,
  CreateTaskParams,
} from './storage.js';

export {
  FileSystemTaskStorage,
} from './storage.js';

// Validation utilities
export {
  VALID_TASK_TRANSITIONS,
  isValidTransition,
  areAllCriteriaChecked,
  getUncheckedCriteriaIndices,
} from './types.js';

// Handler exports
export { TaskHandler } from './handler.js';
export type {
  CreateTaskRequest,
  UpdateTaskRequest,
  CheckCriterionRequest,
  AddNoteRequest,
  SpawnSessionRequest,
  LinkSessionRequest,
  ClaimTaskRequest,
  CompleteTaskRequest,
  ArchiveTaskRequest,
} from './handler.js';
