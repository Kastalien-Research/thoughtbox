/**
 * Merge state-machine tests (SPEC-MERGE-CORE c1-c7):
 * request -> pending_evidence -> pending_approval | blocked, prose-only
 * forced-low confidence, blocking verdicts, human-only approval (no
 * approve operation in tb), supersession via new records, and the
 * snake_case wire shape handed to the evidence generator.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createStubMergeEvidenceGenerator,
  type MergeEvidenceGenerator,
  type MergeEvidenceResult,
} from '../evidence-generator.js';
import { InMemoryMergeCommitStorage } from '../in-memory-merge-storage.js';
import { createMergeHandler, type MergeHandler } from '../merge-handler.js';
import type { MergeCommit, MergeCommitWire, MergeVerdict } from '../types.js';

const AGENT = 'agent-alice';

function makeVerdict(overrides: Partial<MergeVerdict> = {}): MergeVerdict {
  return {
    decision: 'merge',
    confidence: 'high',
    mergedBranchIds: ['branch-a'],
    rejectedBranchIds: ['branch-b'],
    supersededNodeIds: ['node-7'],
    evidenceRefs: ['cell:nb-real/3'],
    dissent: [
      { branchId: 'branch-b', summary: 'slower approach', reasonNotMerged: 'benchmarks lost' },
    ],
    conditions: [],
    reopenTriggers: [],
    ...overrides,
  };
}

function generatorReturning(result: Partial<MergeEvidenceResult>): MergeEvidenceGenerator {
  return {
    async generateMergeEvidence(record: MergeCommitWire): Promise<MergeEvidenceResult> {
      return {
        notebookId: `nb-${record.id}`,
        verdict: makeVerdict(),
        hash: 'deadbeef',
        ...result,
      };
    },
  };
}

async function requestMerge(
  handler: MergeHandler,
  args: Record<string, unknown> = {},
): Promise<MergeCommit> {
  return (await handler.handle(AGENT, 'request', {
    workspaceId: 'ws-1',
    branchIds: ['branch-a', 'branch-b'],
    ...args,
  })) as MergeCommit;
}

describe('merge state machine', () => {
  let storage: InMemoryMergeCommitStorage;

  beforeEach(() => {
    storage = new InMemoryMergeCommitStorage();
  });

  function handlerWith(generator: MergeEvidenceGenerator): MergeHandler {
    return createMergeHandler({ storage, evidenceGenerator: generator });
  }

  describe('generator seam (c7)', () => {
    it('hands the generator the frozen snake_case wire record', async () => {
      let seen: MergeCommitWire | undefined;
      const handler = handlerWith({
        async generateMergeEvidence(record) {
          seen = record;
          return { notebookId: 'nb-1', verdict: makeVerdict(), hash: 'deadbeef' };
        },
      });
      const record = await requestMerge(handler, { baseRef: 'thought:sess-1/12' });
      expect(seen).toMatchObject({
        id: record.id,
        workspace_id: 'ws-1',
        parent_branch_ids: ['branch-a', 'branch-b'],
        base_ref: 'thought:sess-1/12',
        requested_by: AGENT,
        status: 'pending_evidence',
      });
    });
  });

  describe('request -> pending_approval (evidence pass)', () => {
    it('a merge verdict with executable evidence reaches pending_approval keeping confidence', async () => {
      const handler = handlerWith(generatorReturning({}));
      const record = await requestMerge(handler);
      expect(record.status).toBe('pending_approval');
      expect(record.verdict!.confidence).toBe('high');
      expect(record.evidenceNotebookId).toBe(`nb-${record.id}`);
      expect(record.evidenceHash).toBe('deadbeef');
      expect(record.requestedBy).toBe(AGENT);
      expect(record.approvedBy).toBeUndefined();
      expect(record.decidedAt).toBeUndefined();
    });

    it('prose-only evidence (empty evidenceRefs) forces confidence low even when generator claims high (c2)', async () => {
      const handler = handlerWith(
        generatorReturning({
          verdict: makeVerdict({ confidence: 'high', evidenceRefs: [] }),
        }),
      );
      const record = await requestMerge(handler);
      expect(record.status).toBe('pending_approval');
      expect(record.verdict!.confidence).toBe('low');
    });

    it('the stub generator is prose-only: pending_approval at low confidence (c9)', async () => {
      const handler = handlerWith(createStubMergeEvidenceGenerator());
      const record = await requestMerge(handler);
      expect(record.status).toBe('pending_approval');
      expect(record.verdict!.decision).toBe('merge');
      expect(record.verdict!.confidence).toBe('low');
      expect(record.verdict!.mergedBranchIds).toEqual(['branch-a', 'branch-b']);
      expect(record.evidenceNotebookId).toBe(`stub-evidence-${record.id}`);
      expect(record.evidenceHash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('request -> blocked (evidence fail, c3)', () => {
    it('a blocking verdict (decision "block") blocks the merge, keeping notebook + hash + verdict', async () => {
      const handler = handlerWith(
        generatorReturning({
          verdict: makeVerdict({ decision: 'block', confidence: 'high' }),
        }),
      );
      const record = await requestMerge(handler);
      expect(record.status).toBe('blocked');
      expect(record.evidenceNotebookId).toBe(`nb-${record.id}`);
      expect(record.evidenceHash).toBe('deadbeef');
      expect(record.verdict!.decision).toBe('block');
      expect(record.decidedAt).toBeDefined();
    });

    it('a generator crash blocks the merge with an auditable record', async () => {
      const handler = handlerWith({
        async generateMergeEvidence() {
          throw new Error('notebook runtime exploded');
        },
      });
      const record = await requestMerge(handler);
      expect(record.status).toBe('blocked');
      expect(record.evidenceNotebookId).toBeUndefined();
      expect(record.decidedAt).toBeDefined();
    });

    it('a schema-invalid verdict blocks the merge without persisting the verdict', async () => {
      const handler = handlerWith(
        generatorReturning({
          verdict: { decision: 'yes', confidence: 'certain' } as unknown as MergeVerdict,
        }),
      );
      const record = await requestMerge(handler);
      expect(record.status).toBe('blocked');
      expect(record.verdict).toBeUndefined();
    });

    it('a blocked merge cannot be approved (terminal, c5)', async () => {
      const handler = handlerWith(
        generatorReturning({ verdict: makeVerdict({ decision: 'block' }) }),
      );
      const record = await requestMerge(handler);
      await expect(
        storage.transitionMergeCommit(record.id, 'pending_approval', {
          status: 'approved',
          approvedBy: 'user-1',
        }),
      ).rejects.toThrow(/is 'blocked'/);
    });
  });

  describe('human-only approval (c4)', () => {
    it('exposes no approve operation on the tb surface', async () => {
      const handler = handlerWith(createStubMergeEvidenceGenerator());
      await expect(
        handler.handle(AGENT, 'approve', { mergeId: 'merge-x' }),
      ).rejects.toThrow(/Unknown merge operation: approve/);
    });

    it('request requires an agent identity; status and list do not', async () => {
      const handler = handlerWith(createStubMergeEvidenceGenerator());
      await expect(
        handler.handle(null, 'request', { workspaceId: 'ws-1', branchIds: ['b'] }),
      ).rejects.toThrow(/requires an agent identity/);

      const record = await requestMerge(handler);
      const status = (await handler.handle(null, 'status', {
        mergeId: record.id,
      })) as MergeCommit;
      expect(status.id).toBe(record.id);
      const list = (await handler.handle(null, 'list', { workspaceId: 'ws-1' })) as {
        merges: MergeCommit[];
        count: number;
      };
      expect(list.count).toBe(1);
    });
  });

  describe('claim diff (c9)', () => {
    it('dispatches claim_diff to the wired seam', async () => {
      let seenArgs: unknown;
      const handler = createMergeHandler({
        storage,
        evidenceGenerator: createStubMergeEvidenceGenerator(),
        claimDiff: async args => {
          seenArgs = args;
          return { branchA: args.branchA, branchB: args.branchB, added: [], removed: [] };
        },
      });
      const diff = (await handler.handle(null, 'claim_diff', {
        workspaceId: 'ws-1',
        branchA: 'branch-a',
        branchB: 'branch-b',
      })) as { branchA: string };
      expect(diff.branchA).toBe('branch-a');
      expect(seenArgs).toEqual({ workspaceId: 'ws-1', branchA: 'branch-a', branchB: 'branch-b' });
    });

    it('returns a clear join-point error when the seam is not wired', async () => {
      const handler = handlerWith(createStubMergeEvidenceGenerator());
      await expect(
        handler.handle(null, 'claim_diff', {
          workspaceId: 'ws-1',
          branchA: 'a',
          branchB: 'b',
        }),
      ).rejects.toThrow(/claim-diff seam is not\s+wired|merge-evidence/);
    });
  });

  describe('supersession (c6)', () => {
    it('approving a merge built on an approved merge supersedes it, creating a new record', async () => {
      const handler = handlerWith(createStubMergeEvidenceGenerator());

      // Merge A: request + human approval (storage-level, as the web route does).
      const recordA = await requestMerge(handler);
      const approvedA = await storage.transitionMergeCommit(recordA.id, 'pending_approval', {
        status: 'approved',
        approvedBy: 'user-1',
        decidedAt: '2026-07-06T01:00:00.000Z',
      });
      expect(approvedA.status).toBe('approved');

      // Merge B supersedes A via baseRef.
      const recordB = await requestMerge(handler, {
        branchIds: ['branch-c'],
        baseRef: `merge:${recordA.id}`,
      });
      expect(recordB.status).toBe('pending_approval');

      // Human approves B; the route then flips A -> superseded.
      await storage.transitionMergeCommit(recordB.id, 'pending_approval', {
        status: 'approved',
        approvedBy: 'user-1',
        decidedAt: '2026-07-06T02:00:00.000Z',
      });
      await storage.transitionMergeCommit(recordA.id, 'approved', {
        status: 'superseded',
        supersededBy: recordB.id,
      });

      const finalA = await storage.getMergeCommit(recordA.id);
      expect(finalA!.status).toBe('superseded');
      expect(finalA!.supersededBy).toBe(recordB.id);
      // History not rewritten: everything else unchanged.
      expect(finalA!.verdict).toEqual(approvedA.verdict);
      expect(finalA!.approvedBy).toBe('user-1');
      expect(finalA!.decidedAt).toBe('2026-07-06T01:00:00.000Z');
      expect(finalA!.parentBranchIds).toEqual(approvedA.parentBranchIds);
      expect(finalA!.createdAt).toBe(approvedA.createdAt);

      // Two records exist; the old one was never edited in place.
      const all = await storage.listMergeCommits({ workspaceId: 'ws-1' });
      expect(all).toHaveLength(2);
    });

    it('rejects a baseRef referencing an unknown merge commit', async () => {
      const handler = handlerWith(createStubMergeEvidenceGenerator());
      await expect(
        requestMerge(handler, { baseRef: 'merge:merge-nope' }),
      ).rejects.toThrow(/unknown merge commit/);
    });

    it('rejects a baseRef referencing a merge in another workspace', async () => {
      const handler = handlerWith(createStubMergeEvidenceGenerator());
      const other = (await handler.handle(AGENT, 'request', {
        workspaceId: 'ws-2',
        branchIds: ['branch-z'],
      })) as MergeCommit;
      await expect(
        requestMerge(handler, { baseRef: `merge:${other.id}` }),
      ).rejects.toThrow(/belongs to workspace ws-2/);
    });
  });

  describe('reads', () => {
    it('status returns the record and errors on unknown ids', async () => {
      const handler = handlerWith(createStubMergeEvidenceGenerator());
      await expect(handler.handle(null, 'status', { mergeId: 'merge-nope' })).rejects.toThrow(
        /not found/,
      );
    });

    it('list filters by status', async () => {
      const handler = handlerWith(createStubMergeEvidenceGenerator());
      await requestMerge(handler);
      const blockedHandler = handlerWith(
        generatorReturning({ verdict: makeVerdict({ decision: 'block' }) }),
      );
      await requestMerge(blockedHandler);

      const pending = (await handler.handle(null, 'list', {
        workspaceId: 'ws-1',
        status: 'pending_approval',
      })) as { count: number };
      expect(pending.count).toBe(1);
      const blocked = (await handler.handle(null, 'list', {
        workspaceId: 'ws-1',
        status: 'blocked',
      })) as { count: number };
      expect(blocked.count).toBe(1);
    });
  });
});
