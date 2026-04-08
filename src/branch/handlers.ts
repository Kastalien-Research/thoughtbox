/**
 * Branch Handlers
 *
 * Business logic for branch spawn, merge, list, and get operations.
 * Uses Supabase client directly (service_role, no session persistence).
 */

import { createHmac } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BRANCH_WORKER_TOKEN_TTL_MS = 60 * 60 * 1000;

type BranchWorkerTokenPayload = {
  session_id: string;
  branch_id: string;
  workspace_id: string;
  branch_from_thought: number;
  expires_at: string;
};

function encodeBranchWorkerToken(
  payload: BranchWorkerTokenPayload,
  secret: string
): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export interface BranchHandlerDeps {
  supabaseUrl: string;
  serviceRoleKey: string;
  workspaceId: string;
}

export class BranchHandlers {
  private client: SupabaseClient;
  private workspaceId: string;
  private serviceRoleKey: string;

  constructor(deps: BranchHandlerDeps) {
    this.workspaceId = deps.workspaceId;
    this.serviceRoleKey = deps.serviceRoleKey;
    this.client = createClient(deps.supabaseUrl, deps.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async handleSpawn(args: {
    sessionId: string;
    branchId: string;
    description?: string;
    branchFromThought: number;
  }): Promise<{
    branchId: string;
    workerUrl: string;
    status: string;
    sessionId: string;
  }> {
    const { sessionId, branchId, description, branchFromThought } = args;

    const { data: session, error: sessErr } = await this.client
      .from("sessions")
      .select("id, workspace_id")
      .eq("id", sessionId)
      .single();

    if (sessErr || !session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const { data: thought, error: thErr } = await this.client
      .from("thoughts")
      .select("id")
      .eq("session_id", sessionId)
      .eq("thought_number", branchFromThought)
      .is("branch_id", null)
      .single();

    if (thErr || !thought) {
      throw new Error(
        `Main-track thought ${branchFromThought} not found in session ${sessionId}`
      );
    }

    const workspaceId = session.workspace_id ?? this.workspaceId;

    const { error: insErr } = await this.client.from("branches").insert({
      session_id: sessionId,
      workspace_id: workspaceId,
      branch_id: branchId,
      description: description ?? null,
      branch_from_thought: branchFromThought,
      status: "active",
    });

    if (insErr) {
      throw new Error(`Failed to create branch: ${insErr.message}`);
    }

    const supabaseUrl = process.env.SUPABASE_URL ?? "";
    const token = encodeBranchWorkerToken(
      {
        session_id: sessionId,
        branch_id: branchId,
        workspace_id: workspaceId,
        branch_from_thought: branchFromThought,
        expires_at: new Date(Date.now() + BRANCH_WORKER_TOKEN_TTL_MS).toISOString(),
      },
      this.serviceRoleKey
    );
    const workerUrl =
      `${supabaseUrl}/functions/v1/tb-branch/mcp` +
      `?token=${encodeURIComponent(token)}`;

    return { branchId, workerUrl, status: "active", sessionId };
  }

  async handleMerge(args: {
    sessionId: string;
    synthesis: string;
    selectedBranchId?: string;
    resolution: "selected" | "synthesized" | "abandoned";
  }): Promise<{
    mergeThoughtNumber: number;
    updatedBranches: Array<{ branchId: string; status: string }>;
  }> {
    const { sessionId, synthesis, selectedBranchId, resolution } = args;
    const workspaceId = await this.getSessionWorkspaceId(sessionId);

    const { data: branches, error: brErr } = await this.client
      .from("branches")
      .select("branch_id, status")
      .eq("session_id", sessionId)
      .in("status", ["active", "completed"]);

    if (brErr || !branches?.length) {
      throw new Error(`No resolvable branches for session ${sessionId}`);
    }

    const mergeThoughtNumber = await this.insertMainTrackThought(
      sessionId, workspaceId, synthesis
    );

    const updatedBranches = await this.resolveBranches(
      sessionId, branches, resolution, selectedBranchId, mergeThoughtNumber
    );

    return { mergeThoughtNumber, updatedBranches };
  }

  async handleList(args: { sessionId: string }): Promise<{
    branches: Array<{
      branchId: string;
      description: string | null;
      status: string;
      thoughtCount: number;
      branchFromThought: number;
      spawnedAt: string;
      completedAt: string | null;
    }>;
  }> {
    const { data: branches, error } = await this.client
      .from("branches")
      .select("branch_id, description, status, branch_from_thought, spawned_at, completed_at")
      .eq("session_id", args.sessionId)
      .order("spawned_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list branches: ${error.message}`);
    }

    const branchIds = (branches ?? [])
      .map((branch) => branch.branch_id as string | null)
      .filter((branchId): branchId is string => branchId !== null);
    const thoughtCounts = new Map<string, number>();

    if (branchIds.length > 0) {
      const { data: branchThoughts, error: thoughtError } = await this.client
        .from("thoughts")
        .select("branch_id")
        .eq("session_id", args.sessionId)
        .in("branch_id", branchIds);

      if (thoughtError) {
        throw new Error(`Failed to list branch thoughts: ${thoughtError.message}`);
      }

      for (const thought of branchThoughts ?? []) {
        const branchId = thought.branch_id as string | null;
        if (!branchId) continue;
        thoughtCounts.set(branchId, (thoughtCounts.get(branchId) ?? 0) + 1);
      }
    }

    const result = (branches ?? []).map((b) => ({
      branchId: b.branch_id as string,
      description: b.description as string | null,
      status: b.status as string,
      thoughtCount: thoughtCounts.get(b.branch_id as string) ?? 0,
      branchFromThought: b.branch_from_thought as number,
      spawnedAt: b.spawned_at as string,
      completedAt: b.completed_at as string | null,
    }));

    return { branches: result };
  }

  async handleGet(args: {
    sessionId: string;
    branchId: string;
  }): Promise<{
    branch: Record<string, unknown>;
    thoughts: Array<Record<string, unknown>>;
  }> {
    const { data: branch, error: brErr } = await this.client
      .from("branches")
      .select("*")
      .eq("session_id", args.sessionId)
      .eq("branch_id", args.branchId)
      .single();

    if (brErr || !branch) {
      throw new Error(
        `Branch ${args.branchId} not found in session ${args.sessionId}`
      );
    }

    const { data: thoughts, error: thErr } = await this.client
      .from("thoughts")
      .select("*")
      .eq("session_id", args.sessionId)
      .eq("branch_id", args.branchId)
      .order("thought_number", { ascending: true });

    if (thErr) {
      throw new Error(`Failed to fetch branch thoughts: ${thErr.message}`);
    }

    return { branch, thoughts: thoughts ?? [] };
  }

  /**
   * Insert a main-track synthesis thought and return its thought_number.
   */
  private async insertMainTrackThought(
    sessionId: string,
    workspaceId: string,
    synthesis: string
  ): Promise<number> {
    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { data: maxRow } = await this.client
        .from("thoughts")
        .select("thought_number")
        .eq("session_id", sessionId)
        .is("branch_id", null)
        .order("thought_number", { ascending: false })
        .limit(1)
        .single();

      const nextNumber = ((maxRow?.thought_number as number) ?? 0) + 1;

      const { error } = await this.client.from("thoughts").insert({
        session_id: sessionId,
        workspace_id: workspaceId,
        thought_number: nextNumber,
        thought: synthesis,
        thought_type: "reasoning",
        branch_id: null,
        next_thought_needed: false,
        total_thoughts: nextNumber,
      });

      if (!error) return nextNumber;
      if (!error.message.includes("thoughts_main_track_unique")) {
        throw new Error(`Failed to insert merge thought: ${error.message}`);
      }
      // Unique constraint conflict — retry with fresh MAX
    }
    throw new Error(
      `Failed to insert merge thought after ${maxAttempts} attempts`
    );
  }

  /**
   * Update branch statuses based on the chosen resolution strategy.
   */
  private async resolveBranches(
    sessionId: string,
    branches: Array<{ branch_id: string | null; status: string | null }>,
    resolution: "selected" | "synthesized" | "abandoned",
    selectedBranchId: string | undefined,
    mergeThoughtNumber: number
  ): Promise<Array<{ branchId: string; status: string }>> {
    const updated: Array<{ branchId: string; status: string }> = [];

    for (const b of branches) {
      const bid = b.branch_id as string;
      let newStatus: string;

      if (resolution === "abandoned") {
        newStatus = "abandoned";
      } else if (resolution === "selected") {
        newStatus = bid === selectedBranchId ? "merged" : "rejected";
      } else {
        newStatus = "merged";
      }

      const updatePayload: Record<string, unknown> = {
        status: newStatus,
        completed_at: new Date().toISOString(),
      };
      if (newStatus === "merged") {
        updatePayload.merge_thought_number = mergeThoughtNumber;
      }

      const { error: updateError } = await this.client
        .from("branches")
        .update(updatePayload)
        .eq("session_id", sessionId)
        .eq("branch_id", bid);

      if (updateError) {
        throw new Error(`Failed to update branch ${bid}: ${updateError.message}`);
      }

      updated.push({ branchId: bid, status: newStatus });
    }

    return updated;
  }

  private async getSessionWorkspaceId(sessionId: string): Promise<string> {
    const { data: session, error } = await this.client
      .from("sessions")
      .select("id, workspace_id")
      .eq("id", sessionId)
      .single();

    if (error || !session?.workspace_id) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return session.workspace_id as string;
  }
}
