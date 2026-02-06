/**
 * ThoughtStore Adapter — wraps ThoughtboxStorage to satisfy hub's ThoughtStore interface
 *
 * The hub modules (workspace, problems, proposals) need a ThoughtStore for
 * creating sessions, saving thoughts, and reading branches. This adapter
 * bridges ThoughtboxStorage (the main persistence layer) to that interface.
 */

import type { ThoughtboxStorage } from '../persistence/types.js';

export interface ThoughtStoreAdapter {
  createSession(sessionId: string): Promise<void>;
  saveThought(sessionId: string, thought: any): Promise<void>;
  getThought(sessionId: string, thoughtNumber: number): Promise<any>;
  getThoughts(sessionId: string): Promise<any[]>;
  getThoughtCount(sessionId: string): Promise<number>;
  saveBranchThought(sessionId: string, branchId: string, thought: any): Promise<void>;
  getBranch(sessionId: string, branchId: string): Promise<any[]>;
}

export function createThoughtStoreAdapter(storage: ThoughtboxStorage): ThoughtStoreAdapter {
  return {
    async createSession(sessionId: string) {
      // Note: ThoughtboxStorage.createSession generates its own UUID and doesn't support
      // custom session IDs. Since the storage creates sessions lazily on first saveThought,
      // we simply do nothing here and let the session be created implicitly.
      // This ensures the provided sessionId is actually used.
    },
    saveThought: (sessionId, thought) => storage.saveThought(sessionId, thought),
    getThought: (sessionId, num) => storage.getThought(sessionId, num),
    getThoughts: (sessionId) => storage.getThoughts(sessionId),
    async getThoughtCount(sessionId) {
      const thoughts = await storage.getThoughts(sessionId);
      return thoughts.length;
    },
    saveBranchThought: (sessionId, branchId, thought) =>
      storage.saveBranchThought(sessionId, branchId, thought),
    getBranch: (sessionId, branchId) => storage.getBranch(sessionId, branchId),
  };
}
