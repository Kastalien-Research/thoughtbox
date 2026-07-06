/**
 * GET /api/merge?workspaceId=<uuid>&status=<status?>
 *
 * Lists merge commits for the caller's workspace (SPEC-MERGE-CORE).
 * Contract shared with the web UI fetch layer
 * (apps/web/src/lib/merge/api.ts): `workspaceId` is the tenant workspace
 * uuid (public.workspaces.id); the response is a `{ merges: [...] }`
 * envelope of raw snake_case rows. Any membership role may read;
 * `status=pending_approval` is the review inbox the UI builds on.
 *
 * Responses:
 * - 200 { merges: MergeCommitRow[] }
 * - 400 { error } — missing workspaceId or invalid status
 * - 401 { error } — unauthenticated
 * - 404 { error } — workspace not found or caller is not a member
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  MERGE_STATUSES,
  fromMergeCommits,
  getMembershipRole,
  type MergeStatus,
} from "./merge-db";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const workspaceId = request.nextUrl.searchParams.get("workspaceId")?.trim() ?? "";
  if (workspaceId.length === 0) {
    return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
  }
  const statusParam = request.nextUrl.searchParams.get("status");
  if (statusParam !== null && !MERGE_STATUSES.includes(statusParam as MergeStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Expected one of: ${MERGE_STATUSES.join(", ")}.` },
      { status: 400 },
    );
  }

  const role = await getMembershipRole(supabase, workspaceId, user.id);
  if (!role) {
    // Not found for non-members too: do not leak workspace existence.
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  let query = fromMergeCommits(supabase)
    .select("*")
    .eq("tenant_workspace_id", workspaceId);
  if (statusParam !== null) {
    query = query.eq("status", statusParam);
  }
  const { data, error } = await query
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ merges: data ?? [] });
}
