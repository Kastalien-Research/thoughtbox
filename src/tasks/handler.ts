/**
 * Task Handler - Orchestration Layer
 *
 * Phase 3: Gateway Integration
 * - Orchestrates storage operations
 * - Enforces authorization rules
 * - Validates state transitions
 * - Handles session integration
 * - Emits errors per spec format
 *
 * @see dgm-specs/SPEC-REASONING-TASKS.md
 */

import type { TaskStorage } from './storage.js';
import type { ThoughtboxStorage } from '../persistence/types.js';
import type {
  ReasoningTask,
  TaskStatus,
  TaskAction,
  TaskOperationError,
  TaskListFilters,
  TaskSummary,
  SessionTaskRole,
  CompletionCriterion,
} from './types.js';
import { isValidTransition, areAllCriteriaChecked, getUncheckedCriteriaIndices } from './types.js';

// =============================================================================
// Request/Response Types
// =============================================================================

export interface CreateTaskRequest {
  title: string;
  description?: string;
  parentTaskId?: string;
  priority?: 'high' | 'medium' | 'low';
  completionCriteria: string[];
  assignedTo?: string;
  subtaskCompletionStrategy?: 'all' | 'any' | 'manual';
}

export interface UpdateTaskRequest {
  taskId: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: 'high' | 'medium' | 'low';
  assignedTo?: string;
}

export interface CheckCriterionRequest {
  taskId: string;
  criterionIndex: number;
}

export interface AddNoteRequest {
  taskId: string;
  content: string;
  sessionId?: string;
}

export interface SpawnSessionRequest {
  taskId: string;
  title?: string;
  role: SessionTaskRole;
}

export interface LinkSessionRequest {
  taskId: string;
  sessionId: string;
  role: SessionTaskRole;
}

export interface ClaimTaskRequest {
  taskId: string;
}

export interface CompleteTaskRequest {
  taskId: string;
}

export interface ArchiveTaskRequest {
  taskId: string;
}

// =============================================================================
// Task Handler
// =============================================================================

export class TaskHandler {
  constructor(
    private storage: TaskStorage,
    private sessionStorage?: ThoughtboxStorage
  ) {}

  // ===========================================================================
  // Core CRUD Operations
  // ===========================================================================

  /**
   * Create a new reasoning task
   */
  async handleCreateTask(
    request: CreateTaskRequest,
    agentId?: string
  ): Promise<ReasoningTask> {
    try {
      const task = await this.storage.createTask({
        title: request.title,
        description: request.description,
        parentTaskId: request.parentTaskId,
        priority: request.priority,
        completionCriteria: request.completionCriteria,
        createdBy: agentId,
        assignedTo: request.assignedTo,
        subtaskCompletionStrategy: request.subtaskCompletionStrategy,
      });

      return task;
    } catch (error) {
      throw this.createError(
        'create',
        'VALIDATION_ERROR',
        error instanceof Error ? error.message : String(error),
        undefined,
        { request }
      );
    }
  }

  /**
   * Get task by ID
   */
  async handleGetTask(
    taskId: string,
    agentId?: string
  ): Promise<ReasoningTask> {
    const task = await this.storage.getTask(taskId);

    if (!task) {
      throw this.createError(
        'get',
        'TASK_NOT_FOUND',
        `Task not found: ${taskId}`,
        taskId
      );
    }

    // Authorization: Anyone can read tasks
    if (!this.canRead(task, agentId)) {
      throw this.createError(
        'get',
        'UNAUTHORIZED',
        'You do not have permission to read this task',
        taskId,
        { agentId, assignedTo: task.assignedTo }
      );
    }

    return task;
  }

  /**
   * List tasks with filters
   */
  async handleListTasks(
    filters?: TaskListFilters,
    agentId?: string
  ): Promise<TaskSummary[]> {
    // Authorization: List returns all tasks (filtering happens client-side if needed)
    // In a multi-agent system, you might filter by agentId here
    const tasks = await this.storage.listTasks(filters);
    return tasks;
  }

  /**
   * Update task fields
   */
  async handleUpdateTask(
    request: UpdateTaskRequest,
    agentId?: string
  ): Promise<ReasoningTask> {
    const task = await this.storage.getTask(request.taskId);

    if (!task) {
      throw this.createError(
        'update',
        'TASK_NOT_FOUND',
        `Task not found: ${request.taskId}`,
        request.taskId
      );
    }

    // Authorization: Only assignee or creator can update
    if (!this.canWrite(task, agentId)) {
      throw this.createError(
        'update',
        'UNAUTHORIZED',
        'Only the assigned agent or creator can update this task',
        request.taskId,
        { agentId, assignedTo: task.assignedTo, createdBy: task.createdBy },
        'Claim the task first using the "claim" action'
      );
    }

    // Validate status transition if status is being changed
    if (request.status && request.status !== task.status) {
      if (!isValidTransition(task.status, request.status)) {
        throw this.createError(
          'update',
          'INVALID_STATUS_TRANSITION',
          `Cannot transition from '${task.status}' to '${request.status}'`,
          request.taskId,
          { currentStatus: task.status, attemptedStatus: request.status },
          `Valid transitions from '${task.status}': ${this.getValidTransitions(task.status).join(', ')}`
        );
      }
    }

    // Apply updates
    const updates: Partial<ReasoningTask> = {};
    if (request.title) updates.title = request.title;
    if (request.description !== undefined) updates.description = request.description;
    if (request.status) updates.status = request.status;
    if (request.priority) updates.priority = request.priority;
    if (request.assignedTo !== undefined) updates.assignedTo = request.assignedTo;

    const updatedTask = await this.storage.updateTask(request.taskId, updates);
    return updatedTask;
  }

  // ===========================================================================
  // Task Operations
  // ===========================================================================

  /**
   * Check a completion criterion
   */
  async handleCheckCriterion(
    request: CheckCriterionRequest,
    agentId?: string
  ): Promise<void> {
    const task = await this.storage.getTask(request.taskId);

    if (!task) {
      throw this.createError(
        'check_criterion',
        'TASK_NOT_FOUND',
        `Task not found: ${request.taskId}`,
        request.taskId
      );
    }

    // Authorization: Only assignee can check criteria
    if (!agentId || task.assignedTo !== agentId) {
      throw this.createError(
        'check_criterion',
        'UNAUTHORIZED',
        'Only the assigned agent can check completion criteria',
        request.taskId,
        { agentId, assignedTo: task.assignedTo },
        'Claim the task first using the "claim" action'
      );
    }

    // Validate task is active
    if (task.status !== 'active') {
      throw this.createError(
        'check_criterion',
        'INVALID_STATUS_TRANSITION',
        `Task must be 'active' to check criteria (current: '${task.status}')`,
        request.taskId,
        { currentStatus: task.status },
        'Update task status to "active" first'
      );
    }

    // Validate criterion index
    if (request.criterionIndex < 0 || request.criterionIndex >= task.completionCriteria.length) {
      throw this.createError(
        'check_criterion',
        'INVALID_CRITERION_INDEX',
        `Invalid criterion index: ${request.criterionIndex} (valid range: 0-${task.completionCriteria.length - 1})`,
        request.taskId,
        { criterionIndex: request.criterionIndex, totalCriteria: task.completionCriteria.length }
      );
    }

    // Check the criterion
    await this.storage.checkCriterion(request.taskId, request.criterionIndex, agentId);
  }

  /**
   * Add a note to task
   */
  async handleAddNote(
    request: AddNoteRequest,
    agentId?: string
  ): Promise<void> {
    const task = await this.storage.getTask(request.taskId);

    if (!task) {
      throw this.createError(
        'add_note',
        'TASK_NOT_FOUND',
        `Task not found: ${request.taskId}`,
        request.taskId
      );
    }

    // Authorization: Anyone can add notes
    // (per spec, notes are collaborative communication channel)

    await this.storage.addNote(request.taskId, {
      content: request.content,
      agentId,
      sessionId: request.sessionId,
    });
  }

  /**
   * Claim a task (assign to current agent)
   */
  async handleClaim(
    request: ClaimTaskRequest,
    agentId?: string
  ): Promise<ReasoningTask> {
    const task = await this.storage.getTask(request.taskId);

    if (!task) {
      throw this.createError(
        'claim',
        'TASK_NOT_FOUND',
        `Task not found: ${request.taskId}`,
        request.taskId
      );
    }

    // Authorization: Can claim if unassigned or if creator
    if (task.assignedTo && task.assignedTo !== agentId && task.createdBy !== agentId) {
      throw this.createError(
        'claim',
        'TASK_ALREADY_ASSIGNED',
        `Task is already assigned to ${task.assignedTo}`,
        request.taskId,
        { assignedTo: task.assignedTo, requestedBy: agentId },
        'Only the creator can reassign an already-assigned task'
      );
    }

    // Claim the task
    const updatedTask = await this.storage.updateTask(request.taskId, {
      assignedTo: agentId,
      status: 'active',
    });

    return updatedTask;
  }

  /**
   * Complete a task
   */
  async handleComplete(
    request: CompleteTaskRequest,
    agentId?: string
  ): Promise<ReasoningTask> {
    const task = await this.storage.getTask(request.taskId);

    if (!task) {
      throw this.createError(
        'complete',
        'TASK_NOT_FOUND',
        `Task not found: ${request.taskId}`,
        request.taskId
      );
    }

    // Authorization: Only assignee can complete
    if (!agentId || task.assignedTo !== agentId) {
      throw this.createError(
        'complete',
        'UNAUTHORIZED',
        'Only the assigned agent can complete a task',
        request.taskId,
        { agentId, assignedTo: task.assignedTo },
        'Claim the task first using the "claim" action'
      );
    }

    // Validate task is active
    if (task.status !== 'active') {
      throw this.createError(
        'complete',
        'INVALID_STATUS_TRANSITION',
        `Task must be 'active' to complete (current: '${task.status}')`,
        request.taskId,
        { currentStatus: task.status },
        'Update task status to "active" first'
      );
    }

    // Validate all criteria are checked
    if (!areAllCriteriaChecked(task.completionCriteria)) {
      const unchecked = getUncheckedCriteriaIndices(task.completionCriteria);
      throw this.createError(
        'complete',
        'VALIDATION_ERROR',
        'All completion criteria must be checked before completing',
        request.taskId,
        { uncheckedCriteria: unchecked },
        `Check criteria at indices: ${unchecked.join(', ')}`
      );
    }

    // Validate subtask completion strategy
    if (task.subtaskIds.length > 0) {
      const subtaskStatuses = await this.getSubtaskStatuses(task.subtaskIds);

      if (task.subtaskCompletionStrategy === 'all') {
        const incomplete = subtaskStatuses.filter(s => s.status !== 'completed');
        if (incomplete.length > 0) {
          throw this.createError(
            'complete',
            'SUBTASK_INCOMPLETE',
            `Cannot complete task: ${incomplete.length} subtasks not completed (strategy: 'all')`,
            request.taskId,
            { incompleteSubtasks: incomplete.map(s => s.id) },
            'Complete all subtasks first or change subtaskCompletionStrategy'
          );
        }
      } else if (task.subtaskCompletionStrategy === 'any') {
        const completed = subtaskStatuses.filter(s => s.status === 'completed');
        if (completed.length === 0) {
          throw this.createError(
            'complete',
            'SUBTASK_INCOMPLETE',
            `Cannot complete task: no subtasks completed (strategy: 'any')`,
            request.taskId,
            { totalSubtasks: subtaskStatuses.length },
            'Complete at least one subtask first or change subtaskCompletionStrategy'
          );
        }
      }
      // 'manual' strategy: no subtask validation needed
    }

    // Complete the task
    const updatedTask = await this.storage.updateTask(request.taskId, {
      status: 'completed',
      completedAt: new Date(),
    });

    return updatedTask;
  }

  /**
   * Archive a completed task
   */
  async handleArchive(
    request: ArchiveTaskRequest,
    agentId?: string
  ): Promise<void> {
    const task = await this.storage.getTask(request.taskId);

    if (!task) {
      throw this.createError(
        'archive',
        'TASK_NOT_FOUND',
        `Task not found: ${request.taskId}`,
        request.taskId
      );
    }

    // Validate task is completed
    if (task.status !== 'completed') {
      throw this.createError(
        'archive',
        'INVALID_STATUS_TRANSITION',
        `Only completed tasks can be archived (current: '${task.status}')`,
        request.taskId,
        { currentStatus: task.status },
        'Complete the task first using the "complete" action'
      );
    }

    await this.storage.updateTask(request.taskId, {
      status: 'archived',
    });
  }

  // ===========================================================================
  // Session Integration
  // ===========================================================================

  /**
   * Spawn a new session linked to a task
   */
  async handleSpawnSession(
    request: SpawnSessionRequest,
    agentId?: string
  ): Promise<{ sessionId: string; taskId: string }> {
    if (!this.sessionStorage) {
      throw this.createError(
        'spawn_session',
        'VALIDATION_ERROR',
        'Session storage not available. Initialize TaskHandler with sessionStorage parameter.',
        request.taskId,
        {},
        'See docs/SESSION_STORAGE_TASK_INTEGRATION.md for session storage integration'
      );
    }

    const task = await this.storage.getTask(request.taskId);

    if (!task) {
      throw this.createError(
        'spawn_session',
        'TASK_NOT_FOUND',
        `Task not found: ${request.taskId}`,
        request.taskId
      );
    }

    // Create session
    const title = request.title || `${task.title} - ${request.role}`;
    const session = await this.sessionStorage.createSession({
      title,
      tags: [request.role, `task:${task.id}`],
    });

    // Link session → task (uses new linkToTask method)
    await this.sessionStorage.linkToTask(session.id, request.taskId, request.role);

    // Link task → session (in task storage)
    task.linkedSessionIds.push(session.id);
    await this.storage.updateTask(request.taskId, {
      linkedSessionIds: task.linkedSessionIds,
    });

    return {
      sessionId: session.id,
      taskId: request.taskId,
    };
  }

  /**
   * Link an existing session to a task
   */
  async handleLinkSession(
    request: LinkSessionRequest,
    agentId?: string
  ): Promise<void> {
    if (!this.sessionStorage) {
      throw this.createError(
        'link_session',
        'VALIDATION_ERROR',
        'Session storage not available. Initialize TaskHandler with sessionStorage parameter.',
        request.taskId,
        {},
        'See docs/SESSION_STORAGE_TASK_INTEGRATION.md for session storage integration'
      );
    }

    const task = await this.storage.getTask(request.taskId);

    if (!task) {
      throw this.createError(
        'link_session',
        'TASK_NOT_FOUND',
        `Task not found: ${request.taskId}`,
        request.taskId
      );
    }

    const session = await this.sessionStorage.getSession(request.sessionId);

    if (!session) {
      throw this.createError(
        'link_session',
        'VALIDATION_ERROR',
        `Session not found: ${request.sessionId}`,
        request.taskId,
        { sessionId: request.sessionId }
      );
    }

    // Link session → task (uses new linkToTask method)
    await this.sessionStorage.linkToTask(request.sessionId, request.taskId, request.role);

    // Link task → session
    if (!task.linkedSessionIds.includes(request.sessionId)) {
      task.linkedSessionIds.push(request.sessionId);
      await this.storage.updateTask(request.taskId, {
        linkedSessionIds: task.linkedSessionIds,
      });
    }
  }

  // ===========================================================================
  // Authorization Helpers
  // ===========================================================================

  private canRead(task: ReasoningTask, agentId?: string): boolean {
    // Anyone can read tasks
    return true;
  }

  private canWrite(task: ReasoningTask, agentId?: string): boolean {
    if (!agentId) return false;

    // Can write if:
    // 1. Assigned to this agent
    // 2. Created by this agent
    return task.assignedTo === agentId || task.createdBy === agentId;
  }

  private canComplete(task: ReasoningTask, agentId?: string): boolean {
    if (!agentId) return false;

    // Can complete if assigned to this agent
    return task.assignedTo === agentId;
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private getValidTransitions(status: TaskStatus): TaskStatus[] {
    const transitions: Record<TaskStatus, TaskStatus[]> = {
      pending: ['active', 'archived'],
      active: ['active', 'blocked', 'completed', 'pending'],
      blocked: ['active'],
      completed: ['archived', 'active'],
      archived: [],
    };
    return transitions[status] || [];
  }

  private async getSubtaskStatuses(subtaskIds: string[]): Promise<Array<{ id: string; status: TaskStatus }>> {
    const statuses: Array<{ id: string; status: TaskStatus }> = [];

    for (const id of subtaskIds) {
      const subtask = await this.storage.getTask(id);
      if (subtask) {
        statuses.push({ id, status: subtask.status });
      }
    }

    return statuses;
  }

  private createError(
    action: TaskAction,
    code: TaskOperationError['code'],
    message: string,
    taskId?: string,
    details?: unknown,
    suggestion?: string
  ): TaskOperationError {
    return {
      error: message,
      code,
      action,
      taskId,
      details,
      suggestion,
    };
  }
}
