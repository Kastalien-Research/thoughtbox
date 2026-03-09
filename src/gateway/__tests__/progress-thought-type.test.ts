import { describe, it, expect, beforeEach } from 'vitest';
import { ThoughtHandler } from '../../thought-handler.js';
import { InMemoryStorage } from '../../persistence/index.js';

describe('Progress ThoughtType', () => {
  let handler: ThoughtHandler;
  let storage: InMemoryStorage;

  beforeEach(async () => {
    storage = new InMemoryStorage();
    handler = new ThoughtHandler(true, storage);
    await handler.initialize();
  });

  it('accepts progress thought with valid progressData', async () => {
    const result = await handler.processThought({
      thought: 'Converted handlers module to TypeScript',
      thoughtType: 'progress',
      nextThoughtNeeded: true,
      progressData: {
        task: 'Convert handlers module',
        status: 'done',
        note: 'All 5 handlers converted, types inferred from Python source',
      },
    });
    expect(result.isError).toBeUndefined();
  });

  it('rejects progress thought without progressData', async () => {
    const result = await handler.processThought({
      thought: 'Some progress',
      thoughtType: 'progress',
      nextThoughtNeeded: true,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('progressData');
  });

  it('rejects progress thought without task', async () => {
    const result = await handler.processThought({
      thought: 'Some progress',
      thoughtType: 'progress',
      nextThoughtNeeded: true,
      progressData: { status: 'done' } as any,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('task');
  });

  it('rejects progress thought with invalid status', async () => {
    const result = await handler.processThought({
      thought: 'Some progress',
      thoughtType: 'progress',
      nextThoughtNeeded: true,
      progressData: { task: 'Do thing', status: 'maybe' } as any,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('status');
  });

  it('accepts all valid status values', async () => {
    for (const status of ['pending', 'in_progress', 'done', 'blocked']) {
      const result = await handler.processThought({
        thought: `Task is ${status}`,
        thoughtType: 'progress',
        nextThoughtNeeded: true,
        progressData: { task: `Task ${status}`, status: status as any },
      });
      expect(result.isError).toBeUndefined();
    }
  });

  it('progress thoughts appear in audit summary', async () => {
    await handler.processThought({
      thought: 'Planning',
      thoughtType: 'reasoning',
      nextThoughtNeeded: true,
    });
    await handler.processThought({
      thought: 'Did task 1',
      thoughtType: 'progress',
      nextThoughtNeeded: true,
      progressData: { task: 'Task 1', status: 'done' },
    });
    await handler.processThought({
      thought: 'Did task 2',
      thoughtType: 'progress',
      nextThoughtNeeded: true,
      progressData: { task: 'Task 2', status: 'done' },
    });

    const sessionId = handler.getCurrentSessionId();
    expect(sessionId).toBeTruthy();

    const allThoughts = await storage.getThoughts(sessionId!);
    const progressThoughts = allThoughts.filter(
      (t) => t.thoughtType === 'progress'
    );
    expect(progressThoughts).toHaveLength(2);
    expect(progressThoughts[0].progressData).toEqual({
      task: 'Task 1',
      status: 'done',
    });
  });
});
