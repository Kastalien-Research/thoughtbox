/**
 * Tests for FileSystemTaskStore — SDK TaskStore implementation backed by filesystem
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { FileSystemTaskStore } from '../hub-task-store.js';
import type { Task } from '@modelcontextprotocol/sdk/types.js';

describe('FileSystemTaskStore', () => {
  let tmpDir: string;
  let store: FileSystemTaskStore;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hub-task-store-'));
    store = new FileSystemTaskStore(tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('T-HTS-1: createTask generates unique taskId and persists to filesystem', async () => {
    const task = await store.createTask(
      { ttl: 300000 },
      'req-1',
      { method: 'tools/call', params: { name: 'thoughtbox_hub', arguments: {} } }
    );

    expect(task.taskId).toBeDefined();
    expect(typeof task.taskId).toBe('string');
    expect(task.status).toBe('working');
    expect(task.ttl).toBe(300000);
    expect(task.createdAt).toBeDefined();
    expect(task.lastUpdatedAt).toBeDefined();

    // Verify persisted to filesystem
    const taskFile = path.join(tmpDir, 'tasks', `${task.taskId}.json`);
    const raw = await fs.readFile(taskFile, 'utf-8');
    const persisted = JSON.parse(raw);
    expect(persisted.taskId).toBe(task.taskId);
  });

  it('T-HTS-2: getTask reads task from filesystem', async () => {
    const created = await store.createTask(
      { ttl: 300000 },
      'req-1',
      { method: 'tools/call', params: {} }
    );

    const retrieved = await store.getTask(created.taskId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.taskId).toBe(created.taskId);
    expect(retrieved!.status).toBe('working');
  });

  it('T-HTS-3: getTask returns null for nonexistent task', async () => {
    const result = await store.getTask('nonexistent-task-id');
    expect(result).toBeNull();
  });

  it('T-HTS-4: storeTaskResult writes result file and updates task status', async () => {
    const task = await store.createTask(
      { ttl: 300000 },
      'req-1',
      { method: 'tools/call', params: {} }
    );

    await store.storeTaskResult(task.taskId, 'completed', {
      content: [{ type: 'text', text: '{"success": true}' }],
    });

    const updated = await store.getTask(task.taskId);
    expect(updated!.status).toBe('completed');

    // Verify result file exists
    const resultFile = path.join(tmpDir, 'tasks', `${task.taskId}-result.json`);
    const raw = await fs.readFile(resultFile, 'utf-8');
    const result = JSON.parse(raw);
    expect(result.content[0].text).toBe('{"success": true}');
  });

  it('T-HTS-5: getTaskResult reads result file', async () => {
    const task = await store.createTask(
      { ttl: 300000 },
      'req-1',
      { method: 'tools/call', params: {} }
    );

    await store.storeTaskResult(task.taskId, 'completed', {
      content: [{ type: 'text', text: 'done' }],
    });

    const result = await store.getTaskResult(task.taskId);
    expect(result.content).toEqual([{ type: 'text', text: 'done' }]);
  });

  it('T-HTS-6: updateTaskStatus updates task status on disk', async () => {
    const task = await store.createTask(
      { ttl: 300000 },
      'req-1',
      { method: 'tools/call', params: {} }
    );

    await store.updateTaskStatus(task.taskId, 'cancelled', 'User cancelled');

    const updated = await store.getTask(task.taskId);
    expect(updated!.status).toBe('cancelled');
    expect(updated!.statusMessage).toBe('User cancelled');
  });

  it('T-HTS-7: listTasks returns all tasks with pagination', async () => {
    await store.createTask({ ttl: 300000 }, 'req-1', { method: 'tools/call', params: {} });
    await store.createTask({ ttl: 300000 }, 'req-2', { method: 'tools/call', params: {} });
    await store.createTask({ ttl: 300000 }, 'req-3', { method: 'tools/call', params: {} });

    const { tasks } = await store.listTasks();
    expect(tasks).toHaveLength(3);
    expect(tasks.every(t => t.taskId)).toBe(true);
  });

  it('T-HTS-8: TTL cleanup — getTask returns null and deletes expired tasks', async () => {
    // Create a task with 1ms TTL
    const task = await store.createTask(
      { ttl: 1 },
      'req-1',
      { method: 'tools/call', params: {} }
    );

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 10));

    const result = await store.getTask(task.taskId);
    expect(result).toBeNull();

    // Verify file is cleaned up
    const taskFile = path.join(tmpDir, 'tasks', `${task.taskId}.json`);
    await expect(fs.access(taskFile)).rejects.toThrow();
  });
});
