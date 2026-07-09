/**
 * SqliteMergeCommitStorage — durable local merge-commit storage
 * (SPEC-MERGE-CORE c1/c5/c8).
 *
 * The local-mode counterpart of SupabaseMergeCommitStorage: one
 * better-sqlite3 database at `<dataDir>/merges.db` so merge commits —
 * immutable reasoning history — survive process restarts in local mode.
 *
 * Semantics mirror both other backends:
 * - `createMergeCommit` is insert-only (duplicate ids throw);
 * - `transitionMergeCommit` is a compare-and-swap on status guarded by the
 *   legal-transition table (assertMergeTransition), applied as a single
 *   conditional UPDATE ... WHERE status = expected, so terminal records are
 *   immutable even against buggy or racing callers;
 * - merge commits are never hard-deleted or edited outside transitions.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import Database from "better-sqlite3";
import {
  assertMergeTransition,
  type MergeCommit,
  type MergeCommitPatch,
  type MergeCommitQuery,
  type MergeCommitStorage,
  type MergeStatus,
  type MergeVerdict,
} from "./types.js";

interface MergeCommitRow {
  id: string;
  workspace_id: string;
  parent_branch_ids: string;
  base_ref: string | null;
  evidence_notebook_id: string | null;
  evidence_hash: string | null;
  verdict: string | null;
  status: string;
  requested_by: string;
  approved_by: string | null;
  created_at: string;
  decided_at: string | null;
  superseded_by: string | null;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS merge_commits (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  parent_branch_ids TEXT NOT NULL,
  base_ref TEXT,
  evidence_notebook_id TEXT,
  evidence_hash TEXT,
  verdict TEXT,
  status TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  created_at TEXT NOT NULL,
  decided_at TEXT,
  superseded_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_merge_commits_workspace ON merge_commits(workspace_id);
`;

export class SqliteMergeCommitStorage implements MergeCommitStorage {
  private db: Database.Database;

  constructor(dbPath: string) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.db.pragma("busy_timeout = 5000");
    this.db.exec(SCHEMA);
  }

  private fail(operation: string, message: string): never {
    throw new Error(`SqliteMergeCommitStorage.${operation} failed: ${message}`);
  }

  private rowToCommit(row: MergeCommitRow): MergeCommit {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      parentBranchIds: JSON.parse(row.parent_branch_ids) as string[],
      ...(row.base_ref !== null ? { baseRef: row.base_ref } : {}),
      ...(row.evidence_notebook_id !== null
        ? { evidenceNotebookId: row.evidence_notebook_id }
        : {}),
      ...(row.evidence_hash !== null ? { evidenceHash: row.evidence_hash } : {}),
      ...(row.verdict !== null
        ? { verdict: JSON.parse(row.verdict) as MergeVerdict }
        : {}),
      status: row.status as MergeStatus,
      requestedBy: row.requested_by,
      ...(row.approved_by !== null ? { approvedBy: row.approved_by } : {}),
      createdAt: row.created_at,
      ...(row.decided_at !== null ? { decidedAt: row.decided_at } : {}),
      ...(row.superseded_by !== null ? { supersededBy: row.superseded_by } : {}),
    };
  }

  async createMergeCommit(record: MergeCommit): Promise<void> {
    const existing = this.db
      .prepare("SELECT 1 FROM merge_commits WHERE id = ?")
      .get(record.id);
    if (existing) {
      this.fail("createMergeCommit", `merge commit ${record.id} already exists`);
    }
    this.db
      .prepare(
        `INSERT INTO merge_commits
           (id, workspace_id, parent_branch_ids, base_ref, evidence_notebook_id,
            evidence_hash, verdict, status, requested_by, approved_by, created_at,
            decided_at, superseded_by)
         VALUES
           (@id, @workspace_id, @parent_branch_ids, @base_ref, @evidence_notebook_id,
            @evidence_hash, @verdict, @status, @requested_by, @approved_by, @created_at,
            @decided_at, @superseded_by)`,
      )
      .run({
        id: record.id,
        workspace_id: record.workspaceId,
        parent_branch_ids: JSON.stringify(record.parentBranchIds),
        base_ref: record.baseRef ?? null,
        evidence_notebook_id: record.evidenceNotebookId ?? null,
        evidence_hash: record.evidenceHash ?? null,
        verdict: record.verdict !== undefined ? JSON.stringify(record.verdict) : null,
        status: record.status,
        requested_by: record.requestedBy,
        approved_by: record.approvedBy ?? null,
        created_at: record.createdAt,
        decided_at: record.decidedAt ?? null,
        superseded_by: record.supersededBy ?? null,
      });
  }

  async getMergeCommit(id: string): Promise<MergeCommit | null> {
    const row = this.db
      .prepare("SELECT * FROM merge_commits WHERE id = ?")
      .get(id) as MergeCommitRow | undefined;
    return row ? this.rowToCommit(row) : null;
  }

  async listMergeCommits(query: MergeCommitQuery): Promise<MergeCommit[]> {
    const clauses = ["workspace_id = @workspace_id"];
    const params: Record<string, string> = { workspace_id: query.workspaceId };
    if (query.status) {
      clauses.push("status = @status");
      params.status = query.status;
    }
    const rows = this.db
      .prepare(
        `SELECT * FROM merge_commits WHERE ${clauses.join(" AND ")}
         ORDER BY created_at ASC, id ASC`,
      )
      .all(params) as MergeCommitRow[];
    return rows.map((row) => this.rowToCommit(row));
  }

  async transitionMergeCommit(
    id: string,
    expectedStatus: MergeStatus,
    patch: MergeCommitPatch,
  ): Promise<MergeCommit> {
    assertMergeTransition(expectedStatus, patch.status);
    // Synchronous transaction: the read, CAS check, and conditional update
    // cannot interleave with another in-process caller; the
    // `WHERE status = expected` clause arbitrates cross-process racers.
    const apply = this.db.transaction((): MergeCommit => {
      const row = this.db
        .prepare("SELECT * FROM merge_commits WHERE id = ?")
        .get(id) as MergeCommitRow | undefined;
      if (!row) {
        this.fail("transitionMergeCommit", `merge commit not found: ${id}`);
      }
      const sets = ["status = @status"];
      const params: Record<string, string> = {
        id,
        status: patch.status,
        expected_status: expectedStatus,
      };
      if (patch.evidenceNotebookId !== undefined) {
        sets.push("evidence_notebook_id = @evidence_notebook_id");
        params.evidence_notebook_id = patch.evidenceNotebookId;
      }
      if (patch.evidenceHash !== undefined) {
        sets.push("evidence_hash = @evidence_hash");
        params.evidence_hash = patch.evidenceHash;
      }
      if (patch.verdict !== undefined) {
        sets.push("verdict = @verdict");
        params.verdict = JSON.stringify(patch.verdict);
      }
      if (patch.approvedBy !== undefined) {
        sets.push("approved_by = @approved_by");
        params.approved_by = patch.approvedBy;
      }
      if (patch.decidedAt !== undefined) {
        sets.push("decided_at = @decided_at");
        params.decided_at = patch.decidedAt;
      }
      if (patch.supersededBy !== undefined) {
        sets.push("superseded_by = @superseded_by");
        params.superseded_by = patch.supersededBy;
      }
      const result = this.db
        .prepare(
          `UPDATE merge_commits SET ${sets.join(", ")}
           WHERE id = @id AND status = @expected_status`,
        )
        .run(params);
      if (result.changes === 0) {
        this.fail(
          "transitionMergeCommit",
          `merge commit ${id} is '${row.status}', expected '${expectedStatus}'. ` +
            `Merge commits are immutable history; stale transitions write nothing.`,
        );
      }
      const updated = this.db
        .prepare("SELECT * FROM merge_commits WHERE id = ?")
        .get(id) as MergeCommitRow;
      return this.rowToCommit(updated);
    });
    return apply();
  }

  /** Close the underlying database handle (tests / graceful shutdown). */
  close(): void {
    this.db.close();
  }
}
