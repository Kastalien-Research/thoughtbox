/**
 * MergeCommitStorage contract tests (SPEC-MERGE-CORE c1/c5/c8):
 * insert-only creation, copy semantics, ordering, CAS transitions, and —
 * critically — terminal-state immutability enforced at the storage layer.
 *
 * The shared contract runs against both local backends —
 * InMemoryMergeCommitStorage and SqliteMergeCommitStorage (local durable) —
 * plus SQLite-specific restart survival over the same database file.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import * as os from 'node:os';
import * as path from 'node:path';
import { mkdtempSync } from 'node:fs';
import { InMemoryMergeCommitStorage } from '../in-memory-merge-storage.js';
import { SqliteMergeCommitStorage } from '../sqlite-merge-storage.js';
import {
  assertMergeTransition,
  MERGE_STATUSES,
  MERGE_TRANSITIONS,
  type MergeCommit,
  type MergeCommitStorage,
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

function freshMergeDbPath(): string {
  return path.join(mkdtempSync(path.join(os.tmpdir(), 'tb-merges-')), 'merges.db');
}

// =============================================================================
// Shared MergeCommitStorage contract — both local backends
// =============================================================================

function runMergeCommitStorageContract(
  name: string,
  makeStorage: () => MergeCommitStorage,
): void {
  describe(`MergeCommitStorage contract — ${name}`, () => {
    let storage: MergeCommitStorage;

    beforeEach(() => {
      storage = makeStorage();
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
  });
}

runMergeCommitStorageContract('InMemoryMergeCommitStorage', () => new InMemoryMergeCommitStorage());
runMergeCommitStorageContract(
  'SqliteMergeCommitStorage',
  () => new SqliteMergeCommitStorage(freshMergeDbPath()),
);

// =============================================================================
// SQLite-specific: restart survival and cross-instance CAS
// =============================================================================

describe('SqliteMergeCommitStorage — restart survival', () => {
  it('merge commits and their verdicts survive a restart; terminal states stay terminal', async () => {
    const dbPath = freshMergeDbPath();
    const before = new SqliteMergeCommitStorage(dbPath);

    const id = `merge-${randomUUID()}`;
    await before.createMergeCommit(makeCommit({ id }));
    const verdict = makeVerdict();
    await before.transitionMergeCommit(id, 'pending_evidence', {
      status: 'pending_approval',
      evidenceNotebookId: 'nb-1',
      evidenceHash: 'abc123',
      verdict,
    });
    before.close();

    // New storage instance over the same database file — a process restart.
    const after = new SqliteMergeCommitStorage(dbPath);
    const reloaded = await after.getMergeCommit(id);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.status).toBe('pending_approval');
    expect(reloaded!.verdict).toEqual(verdict);
    expect(reloaded!.evidenceHash).toBe('abc123');

    // The state machine picks up where it left off: approval works, and the
    // approved record is immutable through yet another restart.
    await after.transitionMergeCommit(id, 'pending_approval', {
      status: 'approved',
      approvedBy: 'user-1',
      decidedAt: new Date().toISOString(),
    });
    after.close();

    const again = new SqliteMergeCommitStorage(dbPath);
    expect((await again.getMergeCommit(id))!.status).toBe('approved');
    await expect(
      again.transitionMergeCommit(id, 'pending_approval', {
        status: 'approved',
        approvedBy: 'user-2',
      }),
    ).rejects.toThrow(/is 'approved', expected 'pending_approval'/);
  });

  it('a stale transition through a second instance over the same file writes nothing', async () => {
    const dbPath = freshMergeDbPath();
    const writerA = new SqliteMergeCommitStorage(dbPath);
    const writerB = new SqliteMergeCommitStorage(dbPath);

    const id = `merge-${randomUUID()}`;
    await writerA.createMergeCommit(makeCommit({ id, status: 'pending_approval' }));
    await writerA.transitionMergeCommit(id, 'pending_approval', {
      status: 'approved',
      approvedBy: 'user-1',
      decidedAt: new Date().toISOString(),
    });

    // Instance B lost the race: its expected status is stale.
    await expect(
      writerB.transitionMergeCommit(id, 'pending_approval', {
        status: 'approved',
        approvedBy: 'user-2',
      }),
    ).rejects.toThrow(/is 'approved', expected 'pending_approval'/);
    expect((await writerB.getMergeCommit(id))!.approvedBy).toBe('user-1');
  });
});

// =============================================================================
// assertMergeTransition table (backend-independent)
// =============================================================================

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
