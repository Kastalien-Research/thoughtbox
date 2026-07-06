/**
 * GET /api/merge?workspaceSlug=<slug>&status=<status?>
 *
 * Lists merge commits for the caller's workspace (SPEC-MERGE-EVIDENCE).
 * Any membership role may read; `status=pending_approval` is the review
 * inbox the web UI builds on.
 *
 * Responses:
 * - 200 { merges: MergeCommitRow[] }
 * - 400 { error } — missing/invalid workspaceSlug or status
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

  const workspaceSlug = request.nextUrl.searchParams.get("workspaceSlug")?.trim() ?? "";
  if (workspaceSlug.length === 0) {
    return NextResponse.json({ error: "workspaceSlug is required." }, { status: 400 });
  }
  const statusParam = request.nextUrl.searchParams.get("status");
  if (statusParam !== null && !MERGE_STATUSES.includes(statusParam as MergeStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Expected one of: ${MERGE_STATUSES.join(", ")}.` },
      { status: 400 },
    );
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .maybeSingle();
  if (workspaceError || !workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const role = await getMembershipRole(supabase, workspace.id, user.id);
  if (!role) {
    // Do not leak workspace existence to non-members.
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  let query = fromMergeCommits(supabase)
    .select("*")
    .eq("tenant_workspace_id", workspace.id);
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
