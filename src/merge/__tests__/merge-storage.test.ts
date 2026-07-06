/**
 * InMemoryMergeCommitStorage tests (SPEC-MERGE-EVIDENCE c1/c5/c8):
 * insert-only creation, copy semantics, ordering, CAS transitions, and —
 * critically — terminal-state immutability enforced at the storage layer.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryMergeCommitStorage } from '../in-memory-merge-storage.js';
import {
  assertMergeTransition,
  MERGE_STATUSES,
  MERGE_TRANSITIONS,
  type MergeCommit,
  type MergeStatus,
  type MergeVerdict,
} from '../types.js';

function makeVerdict(overrides: Partial<MergeVerdict> = {}): MergeVerdict {
  return {
    decision: 'collapse to branch-a',
    confidence: 'low',
    mergedBranchIds: ['branch-a'],
    rejectedBranchIds: ['branch-b'],
    supersededNodeIds: [],
    evidenceRefs: [],
    dissent: [],
    conditions: [],
    reopenTriggers: [],
    ...overrides,
  };
}

function makeCommit(overrides: Partial<MergeCommit> = {}): MergeCommit {
  return {
    id: 'merge-1',
    workspaceId: 'ws-1',
    parentBranchIds: ['branch-a', 'branch-b'],
    status: 'pending_evidence',
    requestedBy: 'agent-1',
    createdAt: '2026-07-06T00:00:00.000Z',
    ...overrides,
  };
}

describe('InMemoryMergeCommitStorage', () => {
  let storage: InMemoryMergeCommitStorage;

  beforeEach(() => {
    storage = new InMemoryMergeCommitStorage();
  });

  it('creates and reads back a merge commit as a structural copy', async () => {
    const record = makeCommit();
    await storage.createMergeCommit(record);
    record.parentBranchIds.push('mutated-after-save');

    const stored = await storage.getMergeCommit('merge-1');
    expect(stored).not.toBeNull();
    expect(stored!.parentBranchIds).toEqual(['branch-a', 'branch-b']);

    stored!.status = 'approved' as MergeStatus;
    const reread = await storage.getMergeCommit('merge-1');
    expect(reread!.status).toBe('pending_evidence');
  });

  it('rejects duplicate ids (insert-only)', async () => {
    await storage.createMergeCommit(makeCommit());
    await expect(storage.createMergeCommit(makeCommit())).rejects.toThrow(/already exists/);
  });

  it('returns null for unknown ids', async () => {
    expect(await storage.getMergeCommit('merge-nope')).toBeNull();
  });

  it('lists by workspace and status, ordered createdAt then id', async () => {
    await storage.createMergeCommit(
      makeCommit({ id: 'merge-b', createdAt: '2026-07-06T00:00:02.000Z' }),
    );
    await storage.createMergeCommit(
      makeCommit({ id: 'merge-a', createdAt: '2026-07-06T00:00:01.000Z' }),
    );
    await storage.createMergeCommit(
      makeCommit({ id: 'merge-other-ws', workspaceId: 'ws-2' }),
    );

    const all = await storage.listMergeCommits({ workspaceId: 'ws-1' });
    expect(all.map(m => m.id)).toEqual(['merge-a', 'merge-b']);

    const pending = await storage.listMergeCommits({
      workspaceId: 'ws-1',
      status: 'pending_evidence',
    });
    expect(pending).toHaveLength(2);
    const approved = await storage.listMergeCommits({ workspaceId: 'ws-1', status: 'approved' });
    expect(approved).toHaveLength(0);
  });

  describe('transitions (CAS + legal-transition table)', () => {
    it('pending_evidence -> pending_approval applies evidence fields', async () => {
      await storage.createMergeCommit(makeCommit());
      const verdict = makeVerdict();
      const updated = await storage.transitionMergeCommit('merge-1', 'pending_evidence', {
        status: 'pending_approval',
        evidenceNotebookId: 'nb-1',
        evidenceHash: 'abc123',
        verdict,
      });
      expect(updated.status).toBe('pending_approval');
      expect(updated.evidenceNotebookId).toBe('nb-1');
      expect(updated.evidenceHash).toBe('abc123');
      expect(updated.verdict).toEqual(verdict);
    });

    it('CAS: transition with stale expected status throws and writes nothing', async () => {
      await storage.createMergeCommit(makeCommit({ status: 'pending_approval' }));
      await expect(
        storage.transitionMergeCommit('merge-1', 'pending_evidence', {
          status: 'blocked',
          decidedAt: '2026-07-06T01:00:00.000Z',
        }),
      ).rejects.toThrow(/is 'pending_approval', expected 'pending_evidence'/);
      const stored = await storage.getMergeCommit('merge-1');
      expect(stored!.status).toBe('pending_approval');
      expect(stored!.decidedAt).toBeUndefined();
    });

    it('unknown id throws', async () => {
      await expect(
        storage.transitionMergeCommit('merge-nope', 'pending_approval', { status: 'approved' }),
      ).rejects.toThrow(/not found/);
    });

    it('blocked is terminal: no transition out of blocked is legal', async () => {
      await storage.createMergeCommit(makeCommit({ status: 'blocked' }));
      for (const to of MERGE_STATUSES) {
        if (to === 'blocked') continue;
        await expect(
          storage.transitionMergeCommit('merge-1', 'blocked', { status: to }),
        ).rejects.toThrow(/Illegal merge transition/);
      }
    });

    it('approved is immutable except supersession', async () => {
      await storage.createMergeCommit(makeCommit({ status: 'approved' }));
      for (const to of MERGE_STATUSES) {
        if (to === 'superseded' || to === 'approved') continue;
        await expect(
          storage.transitionMergeCommit('merge-1', 'approved', { status: to }),
        ).rejects.toThrow(/Illegal merge transition/);
      }
      const superseded = await storage.transitionMergeCommit('merge-1', 'approved', {
        status: 'superseded',
        supersededBy: 'merge-2',
      });
      expect(superseded.status).toBe('superseded');
      expect(superseded.supersededBy).toBe('merge-2');
    });

    it('superseded is fully terminal', async () => {
      await storage.createMergeCommit(makeCommit({ status: 'superseded' }));
      for (const to of MERGE_STATUSES) {
        if (to === 'superseded') continue;
        await expect(
          storage.transitionMergeCommit('merge-1', 'superseded', { status: to }),
        ).rejects.toThrow(/Illegal merge transition/);
      }
    });

    it('re-approving an approved merge fails (double-approve)', async () => {
      await storage.createMergeCommit(makeCommit({ status: 'pending_approval' }));
      await storage.transitionMergeCommit('merge-1', 'pending_approval', {
        status: 'approved',
        approvedBy: 'user-1',
        decidedAt: '2026-07-06T01:00:00.000Z',
      });
      // Same CAS the approval API uses: expected pending_approval misses.
      await expect(
        storage.transitionMergeCommit('merge-1', 'pending_approval', {
          status: 'approved',
          approvedBy: 'user-2',
          decidedAt: '2026-07-06T02:00:00.000Z',
        }),
      ).rejects.toThrow(/is 'approved', expected 'pending_approval'/);
      const stored = await storage.getMergeCommit('merge-1');
      expect(stored!.approvedBy).toBe('user-1');
    });

    it('approving a blocked merge fails', async () => {
      await storage.createMergeCommit(makeCommit({ status: 'blocked' }));
      await expect(
        storage.transitionMergeCommit('merge-1', 'pending_approval', {
          status: 'approved',
          approvedBy: 'user-1',
        }),
      ).rejects.toThrow(/is 'blocked', expected 'pending_approval'/);
    });
  });

  describe('assertMergeTransition table', () => {
    it('accepts exactly the four legal transitions', () => {
      expect(MERGE_TRANSITIONS).toHaveLength(4);
      for (const [from, to] of MERGE_TRANSITIONS) {
        expect(() => assertMergeTransition(from, to)).not.toThrow();
      }
    });

    it('rejects every other (from, to) pair', () => {
      for (const from of MERGE_STATUSES) {
        for (const to of MERGE_STATUSES) {
          const legal = MERGE_TRANSITIONS.some(([f, t]) => f === from && t === to);
          if (legal) continue;
          expect(() => assertMergeTransition(from, to)).toThrow(/Illegal merge transition/);
        }
      }
    });
  });
});
