/**
 * InMemoryMergeCommitStorage — volatile merge-commit storage for tests and
 * local mode (SPEC-MERGE-CORE c8).
 *
 * Mirrors SupabaseMergeCommitStorage semantics: structural copies on
 * read/write (no shared references), insert-only creation, and
 * compare-and-swap transitions guarded by the legal-transition table so
 * terminal records are immutable even against buggy callers.
 */

import {
  assertMergeTransition,
  type MergeCommit,
  type MergeCommitPatch,
  type MergeCommitQuery,
  type MergeCommitStorage,
  type MergeStatus,
} from './types.js';

function copyMergeCommit(record: MergeCommit): MergeCommit {
  return {
    ...record,
    parentBranchIds: [...record.parentBranchIds],
    ...(record.verdict
      ? { verdict: JSON.parse(JSON.stringify(record.verdict)) as MergeCommit['verdict'] }
      : {}),
  };
}

export class InMemoryMergeCommitStorage implements MergeCommitStorage {
  private commits = new Map<string, MergeCommit>();

  async createMergeCommit(record: MergeCommit): Promise<void> {
    if (this.commits.has(record.id)) {
      throw new Error(
        `InMemoryMergeCommitStorage.createMergeCommit failed: merge commit ${record.id} already exists`,
      );
    }
    this.commits.set(record.id, copyMergeCommit(record));
  }

  async getMergeCommit(id: string): Promise<MergeCommit | null> {
    const stored = this.commits.get(id);
    return stored ? copyMergeCommit(stored) : null;
  }

  async listMergeCommits(query: MergeCommitQuery): Promise<MergeCommit[]> {
    const matches: MergeCommit[] = [];
    for (const stored of this.commits.values()) {
      if (stored.workspaceId !== query.workspaceId) continue;
      if (query.status && stored.status !== query.status) continue;
      matches.push(copyMergeCommit(stored));
    }
    matches.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
    return matches;
  }

  async transitionMergeCommit(
    id: string,
    expectedStatus: MergeStatus,
    patch: MergeCommitPatch,
  ): Promise<MergeCommit> {
    assertMergeTransition(expectedStatus, patch.status);
    const stored = this.commits.get(id);
    if (!stored) {
      throw new Error(
        `InMemoryMergeCommitStorage.transitionMergeCommit failed: merge commit not found: ${id}`,
      );
    }
    if (stored.status !== expectedStatus) {
      throw new Error(
        `InMemoryMergeCommitStorage.transitionMergeCommit failed: merge commit ${id} ` +
          `is '${stored.status}', expected '${expectedStatus}'. Merge commits are ` +
          `immutable history; stale transitions write nothing.`,
      );
    }
    const next: MergeCommit = {
      ...copyMergeCommit(stored),
      status: patch.status,
      ...(patch.evidenceNotebookId !== undefined
        ? { evidenceNotebookId: patch.evidenceNotebookId }
        : {}),
      ...(patch.evidenceHash !== undefined ? { evidenceHash: patch.evidenceHash } : {}),
      ...(patch.verdict !== undefined
        ? { verdict: JSON.parse(JSON.stringify(patch.verdict)) as MergeCommit['verdict'] }
        : {}),
      ...(patch.approvedBy !== undefined ? { approvedBy: patch.approvedBy } : {}),
      ...(patch.decidedAt !== undefined ? { decidedAt: patch.decidedAt } : {}),
      ...(patch.supersededBy !== undefined ? { supersededBy: patch.supersededBy } : {}),
    };
    this.commits.set(id, next);
    return copyMergeCommit(next);
  }
}
