/**
 * Shared types + helpers for the merge approval API (SPEC-MERGE-CORE).
 *
 * These routes are the ONLY approval surface for merge commits (spec c4):
 * tb.merge.* exposes request/status/list but no approve.
 *
 * NOTE on typing: `public.merge_commits` ships in a DB-parity-gated
 * migration, so it is not yet in the generated Database type
 * (src/lib/supabase/database.types.ts). Rows are typed locally and the
 * table is accessed through an untyped escape hatch; switch to the
 * generated types once the migration lands and types are regenerated.
 */

import type { createClient } from "@/lib/supabase/server";

export type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export const MERGE_STATUSES = [
  "pending_evidence",
  "blocked",
  "pending_approval",
  "approved",
  "superseded",
] as const;
export type MergeStatus = (typeof MERGE_STATUSES)[number];

export interface MergeCommitRow {
  id: string;
  workspace_id: string;
  tenant_workspace_id: string;
  parent_branch_ids: string[];
  base_ref: string | null;
  evidence_notebook_id: string | null;
  evidence_hash: string | null;
  verdict: Record<string, unknown> | null;
  status: MergeStatus;
  requested_by: string;
  approved_by: string | null;
  created_at: string;
  decided_at: string | null;
  superseded_by: string | null;
}

/** baseRef prefix that references a prior merge commit (supersession arm). */
export const MERGE_BASE_REF_PREFIX = "merge:";

/**
 * Untyped table access for tables not yet in the generated Database type.
 * eslint-disable-next-line style kept out: the cast is the whole point.
 */
export function fromMergeCommits(supabase: ServerSupabaseClient) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as unknown as { from(table: string): any }).from("merge_commits");
}

/**
 * Resolve the caller's membership role in a tenant workspace.
 * Returns null when the user has no membership (treat as not-visible).
 */
export async function getMembershipRole(
  supabase: ServerSupabaseClient,
  workspaceId: string,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("workspace_memberships")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { role: string }).role;
}
