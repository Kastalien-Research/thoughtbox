"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ApiKeyRow } from "@/lib/types/api-keys";

export type CreateKeyState =
  | { plainKey: string; error?: never }
  | { error: string; plainKey?: never }
  | null;

export type RevokeKeyState =
  | { error: string; success?: never }
  | { success: true; error?: never }
  | null;

export async function createApiKeyAction(
  _prevState: CreateKeyState,
  formData: FormData,
): Promise<CreateKeyState> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Not authenticated." };
  }

  const workspaceSlug =
    (formData.get("workspaceSlug") as string | null)?.trim() ?? "";
  if (workspaceSlug.length === 0) {
    return { error: "Workspace is required." };
  }

  // Look up workspace by slug
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .single();

  if (workspaceError || !workspace) {
    return { error: "Workspace not found." };
  }

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  if (name.length === 0) {
    return { error: "Name is required." };
  }
  if (name.length > 64) {
    return { error: "Name must be 64 characters or fewer." };
  }

  const keyPrefix = randomBytes(6).toString("base64url");
  const plainKey = `tbx_${keyPrefix}_${randomBytes(24).toString("base64url")}`;
  const keyHash = await bcrypt.hash(plainKey, 12);

  const { error: insertError } = await supabase.from("api_keys").insert({
    name,
    prefix: keyPrefix,
    key_hash: keyHash,
    created_by_user_id: user.id,
    workspace_id: workspace.id,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/w/[workspaceSlug]/api-keys", "page");
  return { plainKey };
}

export async function revokeApiKeyAction(
  _prevState: RevokeKeyState,
  formData: FormData,
): Promise<RevokeKeyState> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Not authenticated." };
  }

  const keyId = formData.get("keyId") as string | null;
  if (!keyId) {
    return { error: "Missing key ID." };
  }

  const workspaceSlug =
    (formData.get("workspaceSlug") as string | null)?.trim() ?? "";
  if (workspaceSlug.length === 0) {
    return { error: "Workspace is required." };
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .single();

  if (workspaceError || !workspace) {
    return { error: "Workspace not found." };
  }

  const { error: updateError } = await supabase
    .from("api_keys")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("workspace_id", workspace.id)
    .eq("status", "active");

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/w/[workspaceSlug]/api-keys", "page");
  return { success: true };
}

export async function listApiKeys(workspaceSlug: string): Promise<ApiKeyRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .single();
  if (!workspace) return [];

  const { data, error } = await supabase
    .from("api_keys")
    .select(
      "id, name, prefix, status, last_used_at, created_at, revoked_at",
    )
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as ApiKeyRow[];
}
