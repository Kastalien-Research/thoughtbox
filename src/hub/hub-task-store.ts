/**
 * FileSystemTaskStore — SDK TaskStore implementation backed by filesystem
 *
 * Stores task state and results as JSON files in {dataDir}/tasks/.
 * Supports TTL-based cleanup on read (lazy expiry).
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type { TaskStore, CreateTaskOptions } from '@modelcontextprotocol/sdk/experimental/tasks/interfaces.js';
import type { Task, RequestId, Result, Request } from '@modelcontextprotocol/sdk/types.js';

export class FileSystemTaskStore implements TaskStore {
  private tasksDir: string;

  constructor(private dataDir: string) {
    this.tasksDir = path.join(dataDir, 'tasks');
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.tasksDir, { recursive: true });
  }

  private taskPath(taskId: string): string {
    return path.join(this.tasksDir, `${taskId}.json`);
  }

  private resultPath(taskId: string): string {
    return path.join(this.tasksDir, `${taskId}-result.json`);
  }

  private isExpired(task: Task): boolean {
    if (task.ttl === null || task.ttl === undefined) return false;
    const created = new Date(task.createdAt).getTime();
    return Date.now() - created > task.ttl;
  }

  private async deleteTask(taskId: string): Promise<void> {
    try { await fs.unlink(this.taskPath(taskId)); } catch { /* ignore */ }
    try { await fs.unlink(this.resultPath(taskId)); } catch { /* ignore */ }
  }

  async createTask(
    taskParams: CreateTaskOptions,
    requestId: RequestId,
    request: Request,
    _sessionId?: string
  ): Promise<Task> {
    await this.ensureDir();

    const taskId = crypto.randomUUID();
    const now = new Date().toISOString();

    const task: Task = {
      taskId,
      status: 'working',
      ttl: taskParams.ttl ?? null,
      createdAt: now,
      lastUpdatedAt: now,
      ...(taskParams.pollInterval !== undefined ? { pollInterval: taskParams.pollInterval } : {}),
    };

    await fs.writeFile(this.taskPath(taskId), JSON.stringify(task, null, 2));
    return task;
  }

  async getTask(taskId: string, _sessionId?: string): Promise<Task | null> {
    try {
      const raw = await fs.readFile(this.taskPath(taskId), 'utf-8');
      const task: Task = JSON.parse(raw);

      if (this.isExpired(task)) {
        await this.deleteTask(taskId);
        return null;
      }

      return task;
    } catch {
      return null;
    }
  }

  async storeTaskResult(
    taskId: string,
    status: 'completed' | 'failed',
    result: Result,
    _sessionId?: string
  ): Promise<void> {
    await fs.writeFile(this.resultPath(taskId), JSON.stringify(result, null, 2));
    await this.updateTaskStatus(taskId, status);
  }

  async getTaskResult(taskId: string, _sessionId?: string): Promise<Result> {
    const raw = await fs.readFile(this.resultPath(taskId), 'utf-8');
    return JSON.parse(raw);
  }

  async updateTaskStatus(
    taskId: string,
    status: Task['status'],
    statusMessage?: string,
    _sessionId?: string
  ): Promise<void> {
    const raw = await fs.readFile(this.taskPath(taskId), 'utf-8');
    const task: Task = JSON.parse(raw);

    task.status = status;
    task.lastUpdatedAt = new Date().toISOString();
    if (statusMessage !== undefined) {
      task.statusMessage = statusMessage;
    }

    await fs.writeFile(this.taskPath(taskId), JSON.stringify(task, null, 2));
  }

  async listTasks(
    cursor?: string,
    _sessionId?: string
  ): Promise<{ tasks: Task[]; nextCursor?: string }> {
    await this.ensureDir();

    let files: string[];
    try {
      files = await fs.readdir(this.tasksDir);
    } catch {
      return { tasks: [] };
    }

    const taskFiles = files.filter(f => f.endsWith('.json') && !f.includes('-result'));
    const tasks: Task[] = [];

    for (const file of taskFiles) {
      try {
        const raw = await fs.readFile(path.join(this.tasksDir, file), 'utf-8');
        const task: Task = JSON.parse(raw);
        if (!this.isExpired(task)) {
          tasks.push(task);
        } else {
          await this.deleteTask(task.taskId);
        }
      } catch {
        // Skip corrupted files
      }
    }

    return { tasks };
  }
}
