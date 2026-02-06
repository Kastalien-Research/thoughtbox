import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readFile } from 'node:fs/promises';
import { createFileSystemHubStorage } from '../hub-storage-fs.js';
import { createIdentityManager } from '../identity.js';
import { createWorkspaceManager } from '../workspace.js';
import { createProblemsManager } from '../problems.js';
import { createChannelsManager } from '../channels.js';
import { createInMemoryThoughtStore } from './test-helpers.js';

describe('Hub Storage — Filesystem Persistence', () => {
  let dataDir: string;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'hub-storage-'));
    thoughtStore = createInMemoryThoughtStore();
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  // T-STOR-1: Workspace persisted to filesystem
  it('workspace persisted to filesystem', async () => {
    const storage = createFileSystemHubStorage(dataDir);
    const identity = createIdentityManager(storage);
    const workspace = createWorkspaceManager(storage, thoughtStore);

    const reg = await identity.register({ name: 'alice' });
    const ws = await workspace.createWorkspace(reg.agentId, { name: 'test', description: '...' });

    const filePath = join(dataDir, 'hub', 'workspaces', ws.workspaceId, 'workspace.json');
    const content = JSON.parse(await readFile(filePath, 'utf-8'));
    expect(content.name).toBe('test');
    expect(content.id).toBe(ws.workspaceId);
  });

  // T-STOR-2: Problem persisted to filesystem
  it('problem persisted to filesystem', async () => {
    const storage = createFileSystemHubStorage(dataDir);
    const identity = createIdentityManager(storage);
    const workspace = createWorkspaceManager(storage, thoughtStore);
    const problems = createProblemsManager(storage, thoughtStore);

    const reg = await identity.register({ name: 'alice' });
    const ws = await workspace.createWorkspace(reg.agentId, { name: 'test', description: '...' });
    const prob = await problems.createProblem(reg.agentId, {
      workspaceId: ws.workspaceId,
      title: 'test problem',
      description: '...',
    });

    const filePath = join(dataDir, 'hub', 'workspaces', ws.workspaceId, 'problems', `${prob.problemId}.json`);
    const content = JSON.parse(await readFile(filePath, 'utf-8'));
    expect(content.title).toBe('test problem');
    expect(content.id).toBe(prob.problemId);
  });

  // T-STOR-3: Channel persisted to filesystem
  it('channel persisted to filesystem after message', async () => {
    const storage = createFileSystemHubStorage(dataDir);
    const identity = createIdentityManager(storage);
    const workspace = createWorkspaceManager(storage, thoughtStore);
    const problems = createProblemsManager(storage, thoughtStore);
    const channels = createChannelsManager(storage);

    const reg = await identity.register({ name: 'alice' });
    const ws = await workspace.createWorkspace(reg.agentId, { name: 'test', description: '...' });
    const prob = await problems.createProblem(reg.agentId, {
      workspaceId: ws.workspaceId,
      title: 'test',
      description: '...',
    });
    await channels.postMessage(reg.agentId, {
      workspaceId: ws.workspaceId,
      problemId: prob.problemId,
      content: 'hello',
    });

    const filePath = join(dataDir, 'hub', 'workspaces', ws.workspaceId, 'channels', `${prob.problemId}.json`);
    const content = JSON.parse(await readFile(filePath, 'utf-8'));
    expect(content.messages).toHaveLength(1);
  });

  // T-STOR-4: Agents registry persisted
  it('agents registry persisted to filesystem', async () => {
    const storage = createFileSystemHubStorage(dataDir);
    const identity = createIdentityManager(storage);

    await identity.register({ name: 'alice' });

    const filePath = join(dataDir, 'hub', 'agents.json');
    const content = JSON.parse(await readFile(filePath, 'utf-8'));
    expect(Array.isArray(content)).toBe(true);
    expect(content.some((a: any) => a.name === 'alice')).toBe(true);
  });

  // T-STOR-5: Hub state survives reload
  it('hub state survives reload from a new storage instance', async () => {
    const storageA = createFileSystemHubStorage(dataDir);
    const identityA = createIdentityManager(storageA);
    const workspaceA = createWorkspaceManager(storageA, thoughtStore);
    const problemsA = createProblemsManager(storageA, thoughtStore);

    const reg = await identityA.register({ name: 'alice' });
    const ws = await workspaceA.createWorkspace(reg.agentId, { name: 'persistent', description: '...' });
    await problemsA.createProblem(reg.agentId, {
      workspaceId: ws.workspaceId,
      title: 'survive reload',
      description: '...',
    });

    // Create new storage instance B pointing at same directory
    const storageB = createFileSystemHubStorage(dataDir);

    const loadedWorkspace = await storageB.getWorkspace(ws.workspaceId);
    expect(loadedWorkspace).not.toBeNull();
    expect(loadedWorkspace!.name).toBe('persistent');

    const loadedProblems = await storageB.listProblems(ws.workspaceId);
    expect(loadedProblems).toHaveLength(1);
    expect(loadedProblems[0].title).toBe('survive reload');
  });
});
