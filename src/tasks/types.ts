/**
 * Reasoning Tasks - Type Definitions
 *
 * Spec: dgm-specs/SPEC-REASONING-TASKS.md
 * Phase 1: Types & Data Model
 */

/**
 * Task Status
 *
 * Lifecycle states for reasoning tasks with validation rules:
 * - pending: Not started, can be claimed by agents
 * - active: Being worked on by assigned agent
 * - blocked: Waiting on dependency/input, cannot complete
 * - completed: All completion criteria checked
 * - archived: Terminal state, task filed away
 *
 * Spec: lines 124-174
 */
export type TaskStatus =
  | 'pending'
  | 'active'
  | 'blocked'
  | 'completed'
  | 'archived';

/**
 * Valid state transitions in the task lifecycle
 *
 * See spec lines 131-150 for full state machine diagram
 */
export const VALID_TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ['active', 'archived'],
  active: ['active', 'blocked', 'completed', 'pending'],
  blocked: ['active'],
  completed: ['archived', 'active'],
  archived: [], // Terminal state
};

/**
 * Completion Criterion
 *
 * Individual acceptance criteria for task completion.
 * Agents check these off as work progresses.
 *
 * Spec: lines 185-191
 */
export interface CompletionCriterion {
  /** Index in the completionCriteria array (0-based) */
  index: number;

  /** Human-readable criterion text */
  text: string;

  /** Whether criterion has been verified */
  checked: boolean;

  /** When criterion was checked (if checked = true) */
  checkedAt?: Date;

  /** Agent ID that checked the criterion */
  checkedBy?: string;
}

/**
 * Task Note
 *
 * Append-only log entries for task updates and collaboration.
 *
 * Spec: lines 193-198
 */
export interface TaskNote {
  /** When note was added */
  timestamp: Date;

  /** Agent that added the note */
  agentId?: string;

  /** Note content */
  content: string;

  /** Session where note was added (if applicable) */
  sessionId?: string;
}

/**
 * Subtask Completion Strategy
 *
 * Defines when a parent task is eligible for completion based on subtask status:
 *
 * - 'all': Parent can only complete when ALL subtasks are completed
 *   Use case: Sequential workflows where every step must finish
 *
 * - 'any': Parent can complete when ANY subtask completes
 *   Use case: Alternative approaches where one success is sufficient
 *
 * - 'manual': Parent completion independent of subtasks (default)
 *   Use case: Exploratory work where subtasks are informational
 *
 * Spec: lines 96, 100-122
 */
export type SubtaskCompletionStrategy = 'all' | 'any' | 'manual';

/**
 * Reasoning Task
 *
 * First-class entity representing work to be done across multiple reasoning sessions.
 * Tasks spawn sessions, track completion criteria, and enable multi-agent collaboration.
 *
 * Spec: lines 62-97
 */
export interface ReasoningTask {
  // Identity
  /** Unique task identifier (UUID) */
  id: string;

  /** Short task title */
  title: string;

  /** Detailed task description */
  description?: string;

  // Hierarchy
  /** Parent task ID for subtasks */
  parentTaskId?: string;

  /** Child task IDs (subtasks) */
  subtaskIds: string[];

  // Status
  /** Current task status */
  status: TaskStatus;

  /** Task priority level */
  priority?: 'high' | 'medium' | 'low';

  // Completion Tracking
  /** Acceptance criteria for task completion */
  completionCriteria: CompletionCriterion[];

  // Session Links
  /** Sessions working on this task */
  linkedSessionIds: string[];

  // Multi-Agent
  /** Agent ID that created the task */
  createdBy?: string;

  /** Agent ID currently assigned to task */
  assignedTo?: string;

  // Notes (append-only log)
  /** Task update notes from agents */
  notes: TaskNote[];

  // Timestamps
  /** When task was created */
  createdAt: Date;

  /** Last task update timestamp */
  updatedAt: Date;

  /** When task was completed (if status = 'completed') */
  completedAt?: Date;

  // Subtask Completion Strategy
  /** How subtask completion affects parent completion eligibility */
  subtaskCompletionStrategy?: SubtaskCompletionStrategy;
}

/**
 * Session Task Role
 *
 * Describes how a session relates to its linked task.
 *
 * Spec: lines 214-219
 */
export type SessionTaskRole =
  | 'exploration'    // Understanding the problem
  | 'planning'       // Designing the approach
  | 'implementation' // Doing the work
  | 'review'         // Validating results
  | 'handoff';       // Transferring to another agent

/**
 * Task Action
 *
 * Available operations on reasoning tasks via thoughtbox_gateway.
 *
 * Spec: lines 359-370
 */
export type TaskAction =
  | 'create'          // Create new task
  | 'get'             // Get task by ID
  | 'list'            // List tasks with filters
  | 'update'          // Update task fields
  | 'check_criterion' // Mark completion criterion done
  | 'add_note'        // Append note to task
  | 'spawn_session'   // Create session linked to task
  | 'link_session'    // Link existing session to task
  | 'claim'           // Assign task to current agent
  | 'complete'        // Mark task completed
  | 'archive';        // Archive completed task

/**
 * Error Code
 *
 * Machine-readable error codes for task operations.
 *
 * Spec: lines 389-396
 */
export type ErrorCode =
  | 'TASK_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'INVALID_STATUS_TRANSITION'
  | 'INVALID_CRITERION_INDEX'
  | 'TASK_ALREADY_ASSIGNED'
  | 'SUBTASK_INCOMPLETE'
  | 'VALIDATION_ERROR';

/**
 * Task Operation Error
 *
 * Consistent error response format for all task operations.
 *
 * Spec: lines 378-387
 */
export interface TaskOperationError {
  /** Human-readable error message */
  error: string;

  /** Machine-readable error code */
  code: ErrorCode;

  /** Task ID if applicable */
  taskId?: string;

  /** Action that failed */
  action: TaskAction;

  /** Additional context */
  details?: unknown;

  /** Hint for resolution */
  suggestion?: string;
}

/**
 * Task List Filters
 *
 * Filter parameters for list operations.
 *
 * Spec: lines 543-557
 */
export interface TaskListFilters {
  /** Single status or multiple statuses to filter by */
  status?: TaskStatus | TaskStatus[];

  /** Filter by assigned agent ID */
  assignedTo?: string;

  /** Filter by creator agent ID */
  createdBy?: string;

  /** Filter by priority level */
  priority?: 'high' | 'medium' | 'low';

  /** true = parents only, false = leaf tasks only */
  hasSubtasks?: boolean;

  /** Get subtasks of specific parent */
  parentTaskId?: string;

  /** Tag intersection (all must match) */
  tags?: string[];

  /** Maximum results to return (default: 50, max: 100) */
  limit?: number;

  /** Offset for pagination (default: 0) */
  offset?: number;

  /** Field to sort by (default: createdAt) */
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'priority';

  /** Sort direction (default: desc) */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Task Summary
 *
 * Lightweight task representation for list operations.
 * Full details available via 'get' action.
 *
 * Spec: lines 564-576
 */
export interface TaskSummary {
  /** Task ID */
  id: string;

  /** Task title */
  title: string;

  /** Current status */
  status: TaskStatus;

  /** Priority level */
  priority?: 'high' | 'medium' | 'low';

  /** Assigned agent ID */
  assignedTo?: string;

  /** Number of subtasks */
  subtaskCount: number;

  /** Completion progress (e.g., "3/5") */
  completionProgress: string;

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Validation: Check if status transition is valid
 */
export function isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TASK_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Validation: Check if all completion criteria are checked
 */
export function areAllCriteriaChecked(criteria: CompletionCriterion[]): boolean {
  return criteria.every((c) => c.checked);
}

/**
 * Validation: Get unchecked criterion indices
 */
export function getUncheckedCriteriaIndices(criteria: CompletionCriterion[]): number[] {
  return criteria.filter((c) => !c.checked).map((c) => c.index);
}
