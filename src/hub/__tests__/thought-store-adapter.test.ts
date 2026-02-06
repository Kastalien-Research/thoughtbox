/**
 * Tests for ThoughtStore adapter — wraps ThoughtboxStorage to satisfy hub's ThoughtStore interface
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createThoughtStoreAdapter } from '../thought-store-adapter.js';
import type { ThoughtboxStorage } from '../../persistence/types.js';

function createMockStorage(): ThoughtboxStorage {
  return {
    createSession: vi.fn().mockResolvedValue({ id: 'test-session', name: 'hub-test-session' }),
    saveThought: vi.fn().mockResolvedValue(undefined),
    getThought: vi.fn().mockResolvedValue({ thoughtNumber: 1, thought: 'hello' }),
    getThoughts: vi.fn().mockResolvedValue([
      { thoughtNumber: 1, thought: 'first' },
      { thoughtNumber: 2, thought: 'second' },
    ]),
    saveBranchThought: vi.fn().mockResolvedValue(undefined),
    getBranch: vi.fn().mockResolvedValue([{ thoughtNumber: 1, thought: 'branch-thought' }]),
    // Other ThoughtboxStorage methods (not used by adapter)
    initialize: vi.fn(),
    getConfig: vi.fn(),
    updateConfig: vi.fn(),
    getSession: vi.fn(),
    updateSession: vi.fn(),
    listSessions: vi.fn(),
    exportSession: vi.fn(),
    toLinkedExport: vi.fn(),
    deleteSession: vi.fn(),
  } as unknown as ThoughtboxStorage;
}

describe('ThoughtStore Adapter', () => {
  let mockStorage: ThoughtboxStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
  });

  it('T-TSA-1: createSession delegates to storage.createSession', async () => {
    const adapter = createThoughtStoreAdapter(mockStorage);
    await adapter.createSession('hub-session-1');

    expect(mockStorage.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'hub-session-1' })
    );
  });

  it('T-TSA-2: saveThought delegates correctly', async () => {
    const adapter = createThoughtStoreAdapter(mockStorage);
    const thought = { thoughtNumber: 1, thought: 'test thought', timestamp: new Date().toISOString() };
    await adapter.saveThought('session-1', thought);

    expect(mockStorage.saveThought).toHaveBeenCalledWith('session-1', thought);
  });

  it('T-TSA-3: getThought delegates correctly', async () => {
    const adapter = createThoughtStoreAdapter(mockStorage);
    const result = await adapter.getThought('session-1', 1);

    expect(mockStorage.getThought).toHaveBeenCalledWith('session-1', 1);
    expect(result).toEqual({ thoughtNumber: 1, thought: 'hello' });
  });

  it('T-TSA-4: getThoughtCount returns correct count', async () => {
    const adapter = createThoughtStoreAdapter(mockStorage);
    const count = await adapter.getThoughtCount('session-1');

    expect(mockStorage.getThoughts).toHaveBeenCalledWith('session-1');
    expect(count).toBe(2);
  });

  it('T-TSA-5: getBranch delegates correctly', async () => {
    const adapter = createThoughtStoreAdapter(mockStorage);
    const result = await adapter.getBranch('session-1', 'branch-1');

    expect(mockStorage.getBranch).toHaveBeenCalledWith('session-1', 'branch-1');
    expect(result).toEqual([{ thoughtNumber: 1, thought: 'branch-thought' }]);
  });
});
