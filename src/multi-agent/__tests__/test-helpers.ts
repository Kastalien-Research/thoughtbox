/**
 * Shared test helpers for multi-agent tests.
 * Provides fixtures, in-memory storage, and common setup utilities.
 */

import type { ThoughtData } from '../../persistence/types.js';

/**
 * Creates a ThoughtData fixture with sensible defaults.
 */
export function createThought(overrides: Partial<ThoughtData> & { thought: string; thoughtNumber: number }): ThoughtData {
  return {
    totalThoughts: overrides.thoughtNumber,
    nextThoughtNeeded: true,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a sequence of thoughts for testing.
 */
export function createThoughtSequence(count: number, opts?: {
  agentId?: string;
  agentName?: string;
  branchId?: string;
  branchFromThought?: number;
}): ThoughtData[] {
  return Array.from({ length: count }, (_, i) => createThought({
    thought: `Test thought ${i + 1}`,
    thoughtNumber: i + 1,
    totalThoughts: count,
    nextThoughtNeeded: i < count - 1,
    timestamp: new Date(Date.now() + i * 1000).toISOString(),
    ...(opts?.agentId && { agentId: opts.agentId }),
    ...(opts?.agentName && { agentName: opts.agentName }),
    ...(opts?.branchId && { branchId: opts.branchId }),
    ...(opts?.branchFromThought && { branchFromThought: opts.branchFromThought }),
  }));
}

/**
 * Minimal in-memory storage for multi-agent tests.
 */
export function createTestStorage() {
  const sessions: Map<string, { thoughts: ThoughtData[]; branches: Map<string, ThoughtData[]> }> = new Map();

  return {
    createSession(sessionId: string) {
      sessions.set(sessionId, { thoughts: [], branches: new Map() });
    },
    saveThought(sessionId: string, thought: ThoughtData) {
      const session = sessions.get(sessionId);
      if (!session) throw new Error(`Session ${sessionId} not found`);
      session.thoughts.push({ ...thought });
    },
    getThoughts(sessionId: string): ThoughtData[] {
      return sessions.get(sessionId)?.thoughts ?? [];
    },
    getThought(sessionId: string, thoughtNumber: number): ThoughtData | null {
      return sessions.get(sessionId)?.thoughts.find(t => t.thoughtNumber === thoughtNumber) ?? null;
    },
    saveBranchThought(sessionId: string, branchId: string, thought: ThoughtData) {
      const session = sessions.get(sessionId);
      if (!session) throw new Error(`Session ${sessionId} not found`);
      if (!session.branches.has(branchId)) session.branches.set(branchId, []);
      session.branches.get(branchId)!.push({ ...thought });
    },
    getBranch(sessionId: string, branchId: string): ThoughtData[] {
      return sessions.get(sessionId)?.branches.get(branchId) ?? [];
    },
  };
}
