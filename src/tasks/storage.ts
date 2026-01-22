/**
 * Task Storage Implementation
 *
 * Phase 2: Storage Layer
 * - JSON files: Source of truth for task data
 * - SQLite: Query index (regenerated from JSON files)
 * - Atomic writes: Temp file + rename
 * - Project isolation: .thoughtbox/projects/{project}/tasks/
 *
 * @see dgm-specs/SPEC-REASONING-TASKS.md
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import BetterSQLite3 from 'better-sqlite3';
import type {
  ReasoningTask,
  TaskStatus,
  TaskSummary,
  TaskListFilters,
  CompletionCriterion,
  TaskNote,
  SubtaskCompletionStrategy,
} from './types.js';

// =============================================================================
// Storage Interface
// =============================================================================

export interface TaskStorageOptions {
  /** Base directory for all data. Default: ~/.thoughtbox */
  basePath?: string;
  /** Project scope - isolates all storage to this project. Default: '_default' */
  project?: string;
}

export interface TaskStorage {
  /** Initialize storage (create directories, schema, rebuild index) */
  initialize(): Promise<void>;

  /** Create a new task */
  createTask(params: CreateTaskParams): Promise<ReasoningTask>;

  /** Get task by ID */
  getTask(id: string): Promise<ReasoningTask | null>;

  /** Update task fields */
  updateTask(id: string, updates: Partial<ReasoningTask>): Promise<ReasoningTask>;

  /** Delete task (only for testing - archive is preferred) */
  deleteTask(id: string): Promise<void>;

  /** List tasks with filters */
  listTasks(filters?: TaskListFilters): Promise<TaskSummary[]>;

  /** Check a completion criterion */
  checkCriterion(taskId: string, criterionIndex: number, agentId: string): Promise<void>;

  /** Add a note to task */
  addNote(taskId: string, note: Omit<TaskNote, 'timestamp'>): Promise<void>;

  /** Remove session reference from all tasks (called when session deleted) */
  removeSessionLink(sessionId: string): Promise<void>;

  /** Update session references when task archived/deleted */
  updateSessionReferences(taskId: string, action: 'archive' | 'delete'): Promise<void>;
}

export interface CreateTaskParams {
  title: string;
  description?: string;
  parentTaskId?: string;
  priority?: 'high' | 'medium' | 'low';
  completionCriteria: string[];  // Array of criterion text
  createdBy?: string;
  assignedTo?: string;
  subtaskCompletionStrategy?: SubtaskCompletionStrategy;
}

// =============================================================================
// File System Task Storage
// =============================================================================

export class FileSystemTaskStorage implements TaskStorage {
  private basePath: string;
  private project: string;
  private db: Database.Database | null = null;
  private initialized = false;

  constructor(options: TaskStorageOptions = {}) {
    this.basePath = options.basePath || path.join(os.homedir(), '.thoughtbox');
    this.project = options.project || '_default';
  }

  // ===========================================================================
  // Paths
  // ===========================================================================

  private getProjectDir(): string {
    return path.join(this.basePath, 'projects', this.project);
  }

  private getTasksDir(): string {
    return path.join(this.getProjectDir(), 'tasks');
  }

  private getActiveTasksDir(): string {
    return path.join(this.getTasksDir(), 'active');
  }

  private getCompletedTasksDir(): string {
    return path.join(this.getTasksDir(), 'completed');
  }

  private getDbPath(): string {
    return path.join(this.getTasksDir(), 'tasks.db');
  }

  private getTaskFilePath(taskId: string, status: TaskStatus): string {
    if (status === 'completed' || status === 'archived') {
      return path.join(this.getCompletedTasksDir(), `${taskId}.json`);
    }
    return path.join(this.getActiveTasksDir(), `${taskId}.json`);
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Create directories (ensure base tasks dir exists first)
    const tasksDir = this.getTasksDir();
    if (!fs.existsSync(tasksDir)) {
      fs.mkdirSync(tasksDir, { recursive: true });
    }

    const activeDir = this.getActiveTasksDir();
    if (!fs.existsSync(activeDir)) {
      fs.mkdirSync(activeDir, { recursive: true });
    }

    const completedDir = this.getCompletedTasksDir();
    if (!fs.existsSync(completedDir)) {
      fs.mkdirSync(completedDir, { recursive: true });
    }

    // Open SQLite database
    const dbPath = this.getDbPath();
    this.db = new BetterSQLite3(dbPath);

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    // Create schema
    this.createSchema();

    // Rebuild index from JSON files
    await this.rebuildIndexFromFiles();

    this.initialized = true;
  }

  private createSchema(): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        parent_task_id TEXT,
        status TEXT NOT NULL,
        priority TEXT,
        created_by TEXT,
        assigned_to TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        completed_at INTEGER,
        subtask_completion_strategy TEXT DEFAULT 'manual',
        subtask_count INTEGER DEFAULT 0,
        criteria_checked INTEGER DEFAULT 0,
        criteria_total INTEGER DEFAULT 0,
        FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_tasks_updated ON tasks(updated_at DESC);
    `);
  }

  // ===========================================================================
  // File Operations
  // ===========================================================================

  private async readTaskFile(taskId: string): Promise<ReasoningTask | null> {
    // Try active tasks first
    let filePath = path.join(this.getActiveTasksDir(), `${taskId}.json`);

    if (!fs.existsSync(filePath)) {
      // Try completed tasks
      filePath = path.join(this.getCompletedTasksDir(), `${taskId}.json`);

      if (!fs.existsSync(filePath)) {
        return null;
      }
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const task = JSON.parse(content);

      // Convert date strings to Date objects
      task.createdAt = new Date(task.createdAt);
      task.updatedAt = new Date(task.updatedAt);
      if (task.completedAt) {
        task.completedAt = new Date(task.completedAt);
      }

      // Convert dates in criteria
      task.completionCriteria = task.completionCriteria.map((c: any) => ({
        ...c,
        checkedAt: c.checkedAt ? new Date(c.checkedAt) : undefined,
      }));

      // Convert dates in notes
      task.notes = task.notes.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
      }));

      return task;
    } catch (error) {
      console.warn(`[TaskStorage] Failed to read task ${taskId}:`, error);
      return null;
    }
  }

  private async writeTaskFile(task: ReasoningTask): Promise<void> {
    const filePath = this.getTaskFilePath(task.id, task.status);
    const tempPath = `${filePath}.tmp`;

    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write to temp file
      const content = JSON.stringify(task, null, 2);
      fs.writeFileSync(tempPath, content, 'utf8');

      // Atomic rename
      fs.renameSync(tempPath, filePath);
    } catch (error) {
      // Clean up temp file if it exists
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      throw error;
    }
  }

  private async moveTaskFile(taskId: string, fromStatus: TaskStatus, toStatus: TaskStatus): Promise<void> {
    const fromPath = this.getTaskFilePath(taskId, fromStatus);
    const toPath = this.getTaskFilePath(taskId, toStatus);

    if (fs.existsSync(fromPath)) {
      // Ensure destination directory exists
      const dir = path.dirname(toPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.renameSync(fromPath, toPath);
    }
  }

  private async deleteTaskFile(taskId: string, status: TaskStatus): Promise<void> {
    const filePath = this.getTaskFilePath(taskId, status);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // ===========================================================================
  // Index Rebuild
  // ===========================================================================

  async rebuildIndexFromFiles(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Clear existing data
    this.db.exec('DELETE FROM tasks');

    // Read all task files from both directories
    const activeTasks = this.scanTaskDirectory(this.getActiveTasksDir());
    const completedTasks = this.scanTaskDirectory(this.getCompletedTasksDir());
    const allTasks = [...activeTasks, ...completedTasks];

    // Insert into SQLite
    for (const task of allTasks) {
      this.insertTaskToIndex(task);
    }
  }

  private scanTaskDirectory(dir: string): ReasoningTask[] {
    if (!fs.existsSync(dir)) return [];

    const tasks: ReasoningTask[] = [];
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const taskId = file.replace('.json', '');
      const task = fs.readFileSync(path.join(dir, file), 'utf8');

      try {
        const parsed = JSON.parse(task);

        // Convert date strings
        parsed.createdAt = new Date(parsed.createdAt);
        parsed.updatedAt = new Date(parsed.updatedAt);
        if (parsed.completedAt) {
          parsed.completedAt = new Date(parsed.completedAt);
        }

        // Convert dates in criteria
        parsed.completionCriteria = parsed.completionCriteria.map((c: any) => ({
          ...c,
          checkedAt: c.checkedAt ? new Date(c.checkedAt) : undefined,
        }));

        // Convert dates in notes
        parsed.notes = parsed.notes.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));

        tasks.push(parsed);
      } catch (error) {
        console.warn(`[TaskStorage] Skipping malformed task file: ${file}`);
      }
    }

    return tasks;
  }

  private insertTaskToIndex(task: ReasoningTask): void {
    if (!this.db) return;

    const criteriaChecked = task.completionCriteria.filter(c => c.checked).length;
    const criteriaTotal = task.completionCriteria.length;

    this.db.prepare(`
      INSERT OR REPLACE INTO tasks (
        id, title, description, parent_task_id, status, priority,
        created_by, assigned_to, created_at, updated_at, completed_at,
        subtask_completion_strategy, subtask_count, criteria_checked, criteria_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      task.id,
      task.title,
      task.description || null,
      task.parentTaskId || null,
      task.status,
      task.priority || null,
      task.createdBy || null,
      task.assignedTo || null,
      task.createdAt.getTime(),
      task.updatedAt.getTime(),
      task.completedAt?.getTime() || null,
      task.subtaskCompletionStrategy || 'manual',
      task.subtaskIds.length,
      criteriaChecked,
      criteriaTotal
    );
  }

  // ===========================================================================
  // CRUD Operations
  // ===========================================================================

  async createTask(params: CreateTaskParams): Promise<ReasoningTask> {
    if (!this.db) throw new Error('Storage not initialized');

    const now = new Date();
    const task: ReasoningTask = {
      id: randomUUID(),
      title: params.title,
      description: params.description,
      parentTaskId: params.parentTaskId,
      subtaskIds: [],
      status: 'pending',
      priority: params.priority,
      completionCriteria: params.completionCriteria.map((text, index) => ({
        index,
        text,
        checked: false,
      })),
      linkedSessionIds: [],
      createdBy: params.createdBy,
      assignedTo: params.assignedTo,
      notes: [],
      createdAt: now,
      updatedAt: now,
      subtaskCompletionStrategy: params.subtaskCompletionStrategy || 'manual',
    };

    // Write to JSON file (source of truth)
    await this.writeTaskFile(task);

    // Update SQLite index
    this.insertTaskToIndex(task);

    // If this is a subtask, update parent's subtaskIds
    if (params.parentTaskId) {
      const parent = await this.getTask(params.parentTaskId);
      if (parent) {
        parent.subtaskIds.push(task.id);
        parent.updatedAt = now;
        await this.writeTaskFile(parent);
        this.insertTaskToIndex(parent);
      }
    }

    return task;
  }

  async getTask(id: string): Promise<ReasoningTask | null> {
    if (!this.db) throw new Error('Storage not initialized');

    return await this.readTaskFile(id);
  }

  async updateTask(id: string, updates: Partial<ReasoningTask>): Promise<ReasoningTask> {
    if (!this.db) throw new Error('Storage not initialized');

    const task = await this.getTask(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    const oldStatus = task.status;

    // Apply updates
    Object.assign(task, updates);
    task.updatedAt = new Date();

    // Handle status transition (move file if needed)
    if (updates.status && updates.status !== oldStatus) {
      await this.moveTaskFile(id, oldStatus, updates.status);
    }

    // Write updated task
    await this.writeTaskFile(task);

    // Update index
    this.insertTaskToIndex(task);

    return task;
  }

  async deleteTask(id: string): Promise<void> {
    if (!this.db) throw new Error('Storage not initialized');

    const task = await this.getTask(id);
    if (!task) return;

    // Delete from SQLite (CASCADE handles subtasks)
    this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

    // Delete JSON file
    await this.deleteTaskFile(id, task.status);

    // Update session references
    await this.updateSessionReferences(id, 'delete');
  }

  // ===========================================================================
  // List Operations
  // ===========================================================================

  async listTasks(filters: TaskListFilters = {}): Promise<TaskSummary[]> {
    if (!this.db) throw new Error('Storage not initialized');

    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    // Status filter
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      sql += ` AND status IN (${statuses.map(() => '?').join(', ')})`;
      params.push(...statuses);
    }

    // Assigned to filter
    if (filters.assignedTo) {
      sql += ` AND assigned_to = ?`;
      params.push(filters.assignedTo);
    }

    // Created by filter
    if (filters.createdBy) {
      sql += ` AND created_by = ?`;
      params.push(filters.createdBy);
    }

    // Priority filter
    if (filters.priority) {
      sql += ` AND priority = ?`;
      params.push(filters.priority);
    }

    // Has subtasks filter
    if (filters.hasSubtasks !== undefined) {
      if (filters.hasSubtasks) {
        sql += ` AND subtask_count > 0`;
      } else {
        sql += ` AND subtask_count = 0`;
      }
    }

    // Parent task filter
    if (filters.parentTaskId) {
      sql += ` AND parent_task_id = ?`;
      params.push(filters.parentTaskId);
    }

    // Sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    sql += ` ORDER BY ${sortBy === 'createdAt' ? 'created_at' : sortBy === 'updatedAt' ? 'updated_at' : sortBy} ${sortOrder.toUpperCase()}`;

    // Pagination
    const limit = Math.min(filters.limit || 50, 100);
    const offset = filters.offset || 0;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = this.db.prepare(sql).all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      status: row.status as TaskStatus,
      priority: row.priority,
      assignedTo: row.assigned_to,
      subtaskCount: row.subtask_count,
      completionProgress: `${row.criteria_checked}/${row.criteria_total}`,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  // ===========================================================================
  // Task Operations
  // ===========================================================================

  async checkCriterion(taskId: string, criterionIndex: number, agentId: string): Promise<void> {
    if (!this.db) throw new Error('Storage not initialized');

    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const criterion = task.completionCriteria[criterionIndex];
    if (!criterion) {
      throw new Error(`Invalid criterion index: ${criterionIndex}`);
    }

    // Mark as checked
    criterion.checked = true;
    criterion.checkedAt = new Date();
    criterion.checkedBy = agentId;

    task.updatedAt = new Date();

    // Write updated task
    await this.writeTaskFile(task);

    // Update index
    this.insertTaskToIndex(task);
  }

  async addNote(taskId: string, note: Omit<TaskNote, 'timestamp'>): Promise<void> {
    if (!this.db) throw new Error('Storage not initialized');

    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Add note with timestamp
    task.notes.push({
      ...note,
      timestamp: new Date(),
    });

    task.updatedAt = new Date();

    // Write updated task
    await this.writeTaskFile(task);

    // Update index (updated_at changed)
    this.insertTaskToIndex(task);
  }

  // ===========================================================================
  // Reference Integrity
  // ===========================================================================

  async removeSessionLink(sessionId: string): Promise<void> {
    if (!this.db) throw new Error('Storage not initialized');

    // Get all tasks that reference this session
    const allRows = this.db.prepare('SELECT id FROM tasks').all() as Array<{ id: string }>;

    for (const row of allRows) {
      const task = await this.getTask(row.id);
      if (!task) continue;

      // Remove session from linkedSessionIds
      const index = task.linkedSessionIds.indexOf(sessionId);
      if (index !== -1) {
        task.linkedSessionIds.splice(index, 1);
        task.updatedAt = new Date();
        await this.writeTaskFile(task);
        this.insertTaskToIndex(task);
      }
    }
  }

  async updateSessionReferences(taskId: string, action: 'archive' | 'delete'): Promise<void> {
    // For now, sessions retain their taskId reference even when task is archived/deleted
    // This allows historical analysis of which sessions worked on which tasks
    // If we want to clear references, we'd need access to SessionStorage here

    // Note: This is a placeholder for future enhancement where we might want to
    // clear session.taskId when action === 'delete'
  }
}
