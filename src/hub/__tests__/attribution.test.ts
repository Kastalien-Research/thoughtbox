import { describe, it, expect, beforeEach } from 'vitest';
import { tagThought, type AttributedThought } from '../attribution.js';
import type { ThoughtData } from '../../persistence/types.js';

/**
 * Minimal in-memory thought store for testing attribution.
 * Simulates saveThought/getThought/getThoughts from InMemoryStorage.
 */
function createThoughtStore() {
  const thoughts: Map<string, Map<number, ThoughtData>> = new Map();

  return {
    async saveThought(sessionId: string, thought: ThoughtData) {
      if (!thoughts.has(sessionId)) thoughts.set(sessionId, new Map());
      thoughts.get(sessionId)!.set(thought.thoughtNumber, { ...thought });
    },
    async getThought(sessionId: string, thoughtNumber: number): Promise<ThoughtData | null> {
      return thoughts.get(sessionId)?.get(thoughtNumber) ?? null;
    },
    async getThoughts(sessionId: string): Promise<ThoughtData[]> {
      const session = thoughts.get(sessionId);
      if (!session) return [];
      return [...session.values()].sort((a, b) => a.thoughtNumber - b.thoughtNumber);
    },
  };
}

describe('Attribution', () => {
  let store: ReturnType<typeof createThoughtStore>;

  beforeEach(() => {
    store = createThoughtStore();
  });

  // T-ATT-1: Thought with agentId persists and reads back
  it('thought with agentId persists and reads back', async () => {
    const baseThought: ThoughtData = {
      thought: 'test',
      thoughtNumber: 1,
      totalThoughts: 1,
      nextThoughtNeeded: false,
      timestamp: new Date().toISOString(),
    };

    const attributed = tagThought(baseThought, 'agent-1', 'Alice');

    await store.saveThought('session-1', attributed as ThoughtData);
    const retrieved = await store.getThought('session-1', 1) as unknown as AttributedThought;

    expect(retrieved).not.toBeNull();
    expect(retrieved.agentId).toBe('agent-1');
    expect(retrieved.agentName).toBe('Alice');
  });

  // T-ATT-2: Thought without agentId persists normally (backward compat)
  it('thought without agentId persists normally', async () => {
    const thought: ThoughtData = {
      thought: 'test',
      thoughtNumber: 1,
      totalThoughts: 1,
      nextThoughtNeeded: false,
      timestamp: new Date().toISOString(),
    };

    await store.saveThought('session-1', thought);
    const retrieved = await store.getThought('session-1', 1) as unknown as AttributedThought;

    expect(retrieved).not.toBeNull();
    expect(retrieved.agentId).toBeUndefined();
    expect(retrieved.agentName).toBeUndefined();
  });

  // T-ATT-3: Mixed attributed and unattributed thoughts in same session
  it('mixed attributed and unattributed thoughts in same session', async () => {
    const thought1: ThoughtData = {
      thought: 'plain thought',
      thoughtNumber: 1,
      totalThoughts: 2,
      nextThoughtNeeded: true,
      timestamp: new Date().toISOString(),
    };

    const thought2 = tagThought({
      thought: 'attributed thought',
      thoughtNumber: 2,
      totalThoughts: 2,
      nextThoughtNeeded: false,
      timestamp: new Date().toISOString(),
    }, 'agent-1', 'Alice');

    await store.saveThought('session-1', thought1);
    await store.saveThought('session-1', thought2 as ThoughtData);

    const all = await store.getThoughts('session-1') as unknown as AttributedThought[];
    expect(all).toHaveLength(2);
    expect(all[0].agentId).toBeUndefined();
    expect(all[1].agentId).toBe('agent-1');
  });
});
