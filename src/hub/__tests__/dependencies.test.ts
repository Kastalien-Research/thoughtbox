import { describe, it, expect, beforeEach } from 'vitest';
import { createProblemsManager } from '../problems.js';
import { createWorkspaceManager } from '../workspace.js';
import { createIdentityManager } from '../identity.js';
import { createInMemoryHubStorage, createInMemoryThoughtStore } from './test-helpers.js';
import type { HubStorage } from '../hub-types.js';

describe('Dependencies', () => {
  let storage: HubStorage;
  let thoughtStore: ReturnType<typeof createInMemoryThoughtStore>;
  let problems: ReturnType<typeof createProblemsManager>;
  let aliceId: string;
  let bobId: string;
  let workspaceId: string;
  let problemAId: string;
  let problemBId: string;
  let problemCId: string;

  beforeEach(async () => {
    storage = createInMemoryHubStorage();
    thoughtStore = createInMemoryThoughtStore();
    const identity = createIdentityManager(storage);
    const workspace = createWorkspaceManager(storage, thoughtStore);
    problems = createProblemsManager(storage, thoughtStore);

    const alice = await identity.register({ name: 'alice' });
    aliceId = alice.agentId;
    const bob = await identity.register({ name: 'bob' });
    bobId = bob.agentId;

    const ws = await workspace.createWorkspace(aliceId, {
      name: 'test-ws',
      description: '...',
    });
    workspaceId = ws.workspaceId;
    await workspace.joinWorkspace(bobId, { workspaceId });

    // Seed 5 thoughts
    for (let i = 1; i <= 5; i++) {
      await thoughtStore.saveThought(ws.mainSessionId, {
        thought: `thought ${i}`,
        thoughtNumber: i,
        totalThoughts: 5,
        nextThoughtNeeded: i < 5,
        timestamp: new Date().toISOString(),
      });
    }

    // Create 3 problems (A, B, C)
    const a = await problems.createProblem(aliceId, { workspaceId, title: 'Problem A', description: '...' });
    problemAId = a.problemId;
    const b = await problems.createProblem(aliceId, { workspaceId, title: 'Problem B', description: '...' });
    problemBId = b.problemId;
    const c = await problems.createProblem(aliceId, { workspaceId, title: 'Problem C', description: '...' });
    problemCId = c.problemId;
  });

  // T-DEP-1: Add dependency
  it('add dependency links A to depend on B', async () => {
    const result = await problems.addDependency(aliceId, {
      workspaceId,
      problemId: problemAId,
      dependsOnProblemId: problemBId,
    });

    expect(result.problem.dependsOn).toContain(problemBId);
  });

  // T-DEP-2: Remove dependency
  it('remove dependency unlinks A from B', async () => {
    await problems.addDependency(aliceId, {
      workspaceId,
      problemId: problemAId,
      dependsOnProblemId: problemBId,
    });

    const result = await problems.removeDependency(aliceId, {
      workspaceId,
      problemId: problemAId,
      dependsOnProblemId: problemBId,
    });

    expect(result.problem.dependsOn).toEqual([]);
  });

  // T-DEP-3: Reject self-dependency
  it('reject self-dependency', async () => {
    await expect(
      problems.addDependency(aliceId, {
        workspaceId,
        problemId: problemAId,
        dependsOnProblemId: problemAId,
      }),
    ).rejects.toThrow(/cannot depend on itself/i);
  });

  // T-DEP-4: Reject duplicate dependency
  it('reject duplicate dependency', async () => {
    await problems.addDependency(aliceId, {
      workspaceId,
      problemId: problemAId,
      dependsOnProblemId: problemBId,
    });

    await expect(
      problems.addDependency(aliceId, {
        workspaceId,
        problemId: problemAId,
        dependsOnProblemId: problemBId,
      }),
    ).rejects.toThrow(/already depends on/i);
  });

  // T-DEP-5: Reject cycle (direct)
  it('reject direct cycle A→B, B→A', async () => {
    await problems.addDependency(aliceId, {
      workspaceId,
      problemId: problemAId,
      dependsOnProblemId: problemBId,
    });

    await expect(
      problems.addDependency(aliceId, {
        workspaceId,
        problemId: problemBId,
        dependsOnProblemId: problemAId,
      }),
    ).rejects.toThrow(/cycle/i);
  });

  // T-DEP-6: Reject cycle (transitive)
  it('reject transitive cycle A→B, B→C, C→A', async () => {
    await problems.addDependency(aliceId, {
      workspaceId,
      problemId: problemAId,
      dependsOnProblemId: problemBId,
    });
    await problems.addDependency(aliceId, {
      workspaceId,
      problemId: problemBId,
      dependsOnProblemId: problemCId,
    });

    await expect(
      problems.addDependency(aliceId, {
        workspaceId,
        problemId: problemCId,
        dependsOnProblemId: problemAId,
      }),
    ).rejects.toThrow(/cycle/i);
  });

  // T-DEP-7: Ready problems (no deps) — all 3 open problems are ready
  it('all open problems with no deps are ready', async () => {
    const result = await problems.readyProblems({ workspaceId });

    expect(result.problems).toHaveLength(3);
  });

  // T-DEP-8: Ready problems (resolved dep)
  it('problem with resolved dep is ready', async () => {
    await problems.addDependency(aliceId, {
      workspaceId,
      problemId: problemAId,
      dependsOnProblemId: problemBId,
    });

    // Resolve B
    await problems.updateProblem(aliceId, { workspaceId, problemId: problemBId, status: 'resolved' });

    const result = await problems.readyProblems({ workspaceId });
    const readyIds = result.problems.map((p: any) => p.id);

    expect(readyIds).toContain(problemAId);
  });

  // T-DEP-9: Ready problems (unresolved dep)
  it('problem with unresolved dep is NOT ready', async () => {
    await problems.addDependency(aliceId, {
      workspaceId,
      problemId: problemAId,
      dependsOnProblemId: problemBId,
    });

    const result = await problems.readyProblems({ workspaceId });
    const readyIds = result.problems.map((p: any) => p.id);

    expect(readyIds).not.toContain(problemAId);
    expect(readyIds).toContain(problemBId);
    expect(readyIds).toContain(problemCId);
  });

  // T-DEP-10: Blocked problems
  it('blocked problems returns problems with unresolved deps', async () => {
    await problems.addDependency(aliceId, {
      workspaceId,
      problemId: problemAId,
      dependsOnProblemId: problemBId,
    });

    const result = await problems.blockedProblems({ workspaceId });
    const blockedIds = result.problems.map((p: any) => p.id);

    expect(blockedIds).toContain(problemAId);
    expect(blockedIds).not.toContain(problemBId);
  });

  // T-DEP-11: Non-open problems excluded from ready
  it('in-progress and resolved problems not in ready queue', async () => {
    // Claim B (makes it in-progress)
    await problems.claimProblem(bobId, { workspaceId, problemId: problemBId, branchId: 'branch-b' });
    // Resolve C
    await problems.updateProblem(aliceId, { workspaceId, problemId: problemCId, status: 'resolved' });

    const result = await problems.readyProblems({ workspaceId });
    const readyIds = result.problems.map((p: any) => p.id);

    expect(readyIds).toEqual([problemAId]);
  });

  // T-DEP-12: Nonexistent dependency target
  it('reject dependency on nonexistent problem', async () => {
    await expect(
      problems.addDependency(aliceId, {
        workspaceId,
        problemId: problemAId,
        dependsOnProblemId: 'fake-id-does-not-exist',
      }),
    ).rejects.toThrow(/not found/i);
  });
});
