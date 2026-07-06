/**
 * SupabaseMergeCommitStorage — Postgres-backed merge-commit storage
 * (SPEC-MERGE-CORE c8).
 *
 * Implements the MergeCommitStorage contract over public.merge_commits,
 * scoped to a single tenant workspace like SupabaseClaimStorage:
 * - createMergeCommit is a plain insert (id PK rejects duplicates);
 * - transitionMergeCommit is a compare-and-swap on status
 *   (`UPDATE ... WHERE id = ? AND tenant_workspace_id = ? AND status = ?`)
 *   guarded by the legal-transition table, so terminal records are
 *   immutable and stale transitions write nothing (spec c1/c5).
 *
 * NOTE on typing: row shapes are declared locally instead of using the
 * generated Database type because the merge_commits migration ships in a
 * separate, DB-parity-gated commit; regenerate src/database.types.ts and
 * switch to it once the migration is applied.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  assertMergeTransition,
  type MergeCommit,
  type MergeCommitPatch,
  type MergeCommitQuery,
  type MergeCommitStorage,
  type MergeStatus,
  type MergeVerdict,
} from './types.js';

interface MergeCommitRow {
  id: string;
  workspace_id: string;
  tenant_workspace_id: string;
  parent_branch_ids: string[];
  base_ref: string | null;
  evidence_notebook_id: string | null;
  evidence_hash: string | null;
  verdict: MergeVerdict | null;
  status: MergeStatus;
  requested_by: string;
  approved_by: string | null;
  created_at: string;
  decided_at: string | null;
  superseded_by: string | null;
}

export interface SupabaseMergeCommitStorageConfig {
  supabaseUrl: string;
  /** Service role key — bypasses RLS; tenant isolation is enforced in queries. */
  serviceRoleKey: string;
  /** SaaS workspace (public.workspaces.id) all merge rows are scoped to. */
  tenantWorkspaceId: string;
}

function toIso(timestamp: string): string {
  return new Date(timestamp).toISOString();
}

function rowToMergeCommit(row: MergeCommitRow): MergeCommit {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    parentBranchIds: row.parent_branch_ids,
    ...(row.base_ref !== null ? { baseRef: row.base_ref } : {}),
    ...(row.evidence_notebook_id !== null
      ? { evidenceNotebookId: row.evidence_notebook_id }
      : {}),
    ...(row.evidence_hash !== null ? { evidenceHash: row.evidence_hash } : {}),
    ...(row.verdict !== null ? { verdict: row.verdict } : {}),
    status: row.status,
    requestedBy: row.requested_by,
    ...(row.approved_by !== null ? { approvedBy: row.approved_by } : {}),
    createdAt: toIso(row.created_at),
    ...(row.decided_at !== null ? { decidedAt: toIso(row.decided_at) } : {}),
    ...(row.superseded_by !== null ? { supersededBy: row.superseded_by } : {}),
  };
}

export class SupabaseMergeCommitStorage implements MergeCommitStorage {
  private client: SupabaseClient;
  private tenantWorkspaceId: string;

  constructor(config: SupabaseMergeCommitStorageConfig) {
    this.tenantWorkspaceId = config.tenantWorkspaceId;
    this.client = createClient(config.supabaseUrl, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private fail(operation: string, message: string): never {
    throw new Error(
      `SupabaseMergeCommitStorage.${operation} failed (tenant ${this.tenantWorkspaceId}): ${message}`,
    );
  }

  async createMergeCommit(record: MergeCommit): Promise<void> {
    const { error } = await this.client.from('merge_commits').insert({
      id: record.id,
      workspace_id: record.workspaceId,
      tenant_workspace_id: this.tenantWorkspaceId,
      parent_branch_ids: record.parentBranchIds,
      base_ref: record.baseRef ?? null,
      evidence_notebook_id: record.evidenceNotebookId ?? null,
      evidence_hash: record.evidenceHash ?? null,
      verdict: record.verdict ?? null,
      status: record.status,
      requested_by: record.requestedBy,
      approved_by: record.approvedBy ?? null,
      created_at: record.createdAt,
      decided_at: record.decidedAt ?? null,
      superseded_by: record.supersededBy ?? null,
    });
    if (error) this.fail('createMergeCommit', error.message);
  }

  async getMergeCommit(id: string): Promise<MergeCommit | null> {
    const { data, error } = await this.client
      .from('merge_commits')
      .select()
      .eq('id', id)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .maybeSingle();
    if (error) this.fail('getMergeCommit', error.message);
    return data ? rowToMergeCommit(data as MergeCommitRow) : null;
  }

  async listMergeCommits(query: MergeCommitQuery): Promise<MergeCommit[]> {
    let request = this.client
      .from('merge_commits')
      .select()
      .eq('workspace_id', query.workspaceId)
      .eq('tenant_workspace_id', this.tenantWorkspaceId);
    if (query.status) request = request.eq('status', query.status);
    const { data, error } = await request
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });
    if (error) this.fail('listMergeCommits', error.message);
    return ((data ?? []) as MergeCommitRow[]).map(rowToMergeCommit);
  }

  async transitionMergeCommit(
    id: string,
    expectedStatus: MergeStatus,
    patch: MergeCommitPatch,
  ): Promise<MergeCommit> {
    assertMergeTransition(expectedStatus, patch.status);
    const fields: Record<string, unknown> = { status: patch.status };
    if (patch.evidenceNotebookId !== undefined) {
      fields.evidence_notebook_id = patch.evidenceNotebookId;
    }
    if (patch.evidenceHash !== undefined) fields.evidence_hash = patch.evidenceHash;
    if (patch.verdict !== undefined) fields.verdict = patch.verdict;
    if (patch.approvedBy !== undefined) fields.approved_by = patch.approvedBy;
    if (patch.decidedAt !== undefined) fields.decided_at = patch.decidedAt;
    if (patch.supersededBy !== undefined) fields.superseded_by = patch.supersededBy;

    const { data, error } = await this.client
      .from('merge_commits')
      .update(fields)
      .eq('id', id)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .eq('status', expectedStatus)
      .select();
    if (error) this.fail('transitionMergeCommit', error.message);
    const rows = (data ?? []) as MergeCommitRow[];
    if (rows.length === 0) {
      this.fail(
        'transitionMergeCommit',
        `merge commit ${id} is not '${expectedStatus}' (or does not exist). ` +
          `Merge commits are immutable history; stale transitions write nothing.`,
      );
    }
    return rowToMergeCommit(rows[0]!);
  }
}

/**
 * Per-tenant SupabaseMergeCommitStorage provider for multi-tenant mode,
 * mirroring createSupabaseClaimStorageProvider.
 */
export function createSupabaseMergeStorageProvider(
  config: Omit<SupabaseMergeCommitStorageConfig, 'tenantWorkspaceId'>,
): (tenantWorkspaceId: string) => MergeCommitStorage {
  const cache = new Map<string, MergeCommitStorage>();
  return (tenantWorkspaceId: string): MergeCommitStorage => {
    let storage = cache.get(tenantWorkspaceId);
    if (!storage) {
      storage = new SupabaseMergeCommitStorage({ ...config, tenantWorkspaceId });
      cache.set(tenantWorkspaceId, storage);
    }
    return storage;
  };
}
