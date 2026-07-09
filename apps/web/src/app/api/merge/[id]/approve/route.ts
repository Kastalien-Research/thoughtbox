/**
 * POST /api/merge/[id]/approve — the ONLY approval surface for merge
 * commits (SPEC-MERGE-CORE c4). Human-only: requires an authenticated
 * user session with 'owner' membership in the merge's tenant workspace.
 * No agent, peer, or validator auto-approval exists in v1.
 *
 * Behavior:
 * - CAS update pending_approval -> approved (approved_by = user id,
 *   decided_at = now). A missed guard (blocked record, double-approve,
 *   race) returns 409 without writing — merge commits are immutable (c5).
 * - Supersession (c6): when the approved record's base_ref is
 *   "merge:<priorId>" and that prior commit is still 'approved', it is
 *   CAS-flipped to 'superseded' with superseded_by = the new commit id.
 *
 * Responses:
 * - 200 { merge: MergeCommitRow, superseded: string | null }
 * - 401 { error } — unauthenticated
 * - 403 { error } — member but not workspace owner
 * - 404 { error } — merge commit not visible to the caller
 * - 409 { error, status } — record is not pending_approval
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  MERGE_BASE_REF_PREFIX,
  fromMergeCommits,
  getMembershipRole,
  type MergeCommitRow,
} from "../../merge-db";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: mergeRow, error: fetchError } = await fromMergeCommits(supabase)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError || !mergeRow) {
    return NextResponse.json({ error: "Merge commit not found." }, { status: 404 });
  }
  const merge = mergeRow as MergeCommitRow;

  const role = await getMembershipRole(supabase, merge.tenant_workspace_id, user.id);
  if (!role) {
    // Do not leak merge existence to non-members.
    return NextResponse.json({ error: "Merge commit not found." }, { status: 404 });
  }
  if (role !== "owner") {
    return NextResponse.json(
      { error: "Only the workspace owner can approve merges." },
      { status: 403 },
    );
  }

  // CAS: approve only if still pending_approval. Zero rows means the
  // record is terminal (blocked/approved/superseded) or mid-evidence —
  // immutable history, nothing is written.
  const { data: updatedRows, error: updateError } = await fromMergeCommits(supabase)
    .update({
      status: "approved",
      approved_by: user.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending_approval")
    .select("*");
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  const approved = (updatedRows ?? [])[0] as MergeCommitRow | undefined;
  if (!approved) {
    return NextResponse.json(
      {
        error: `Merge commit is '${merge.status}', not 'pending_approval'. ` +
          `Merge commits are immutable; issue a new merge request instead.`,
        status: merge.status,
      },
      { status: 409 },
    );
  }

  // Supersession: an approved merge built on a prior approved merge
  // (base_ref "merge:<id>") supersedes it — new commits on top, never
  // rewrites. Best-effort CAS: if the prior commit is not 'approved'
  // at this moment, no supersession occurs.
  let superseded: string | null = null;
  if (approved.base_ref?.startsWith(MERGE_BASE_REF_PREFIX)) {
    const priorId = approved.base_ref.slice(MERGE_BASE_REF_PREFIX.length);
    const { data: supersededRows } = await fromMergeCommits(supabase)
      .update({ status: "superseded", superseded_by: approved.id })
      .eq("id", priorId)
      .eq("tenant_workspace_id", approved.tenant_workspace_id)
      .eq("status", "approved")
      .neq("id", approved.id)
      .select("id");
    if ((supersededRows ?? []).length > 0) {
      superseded = priorId;
    }
  }

  return NextResponse.json({ merge: approved, superseded });
}
