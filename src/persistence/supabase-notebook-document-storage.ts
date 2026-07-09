/**
 * SupabaseNotebookDocumentStorage — Postgres-backed notebook-document
 * persistence over the `public.notebooks` table (deployed backend of the
 * notebook_persist contract; FileSystemNotebookDocumentStorage is the
 * local/self-hosted twin).
 *
 * Tenancy mirrors the runbook tables: every row is scoped by
 * tenant_workspace_id, the server uses the service-role key with tenant
 * scope enforced in queries, and the natural key is
 * (tenant_workspace_id, id). Unlike the append-only runbook substrate,
 * notebooks are living documents — `save` is an UPSERT on that key.
 *
 * NOTE ON TYPES: the `notebooks` table ships in a separate, gated migration
 * (DB-parity ruling), so it is deliberately not referenced through the
 * generated Database types — rows are mapped through the local NotebookRow
 * shape. If the migration is not applied, every call fails loudly with the
 * Postgres "relation does not exist" error; nothing degrades silently.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  assertValidNotebookId,
  type NotebookDocumentStorage,
  type NotebookDocumentSummary,
  type PersistedNotebookDocument,
} from "./notebook-document-storage.js";

export interface SupabaseNotebookDocumentStorageConfig {
  supabaseUrl: string;
  /** Service role key — bypasses RLS; tenant isolation is enforced in queries. */
  serviceRoleKey: string;
  /** SaaS workspace (public.workspaces.id) all notebook rows are scoped to. */
  tenantWorkspaceId: string;
}

interface NotebookRow {
  id: string;
  tenant_workspace_id: string;
  title: string;
  language: string;
  content: string;
  persisted_at: string;
}

export class SupabaseNotebookDocumentStorage implements NotebookDocumentStorage {
  readonly backend = "supabase" as const;
  private client: SupabaseClient;
  private tenantWorkspaceId: string;

  constructor(config: SupabaseNotebookDocumentStorageConfig) {
    this.tenantWorkspaceId = config.tenantWorkspaceId;
    this.client = createClient(config.supabaseUrl, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private fail(operation: string, message: string): never {
    throw new Error(
      `SupabaseNotebookDocumentStorage.${operation} failed ` +
        `(tenant ${this.tenantWorkspaceId}): ${message}`,
    );
  }

  async save(doc: PersistedNotebookDocument): Promise<void> {
    assertValidNotebookId(doc.notebookId);
    const { error } = await this.client.from("notebooks").upsert(
      {
        id: doc.notebookId,
        tenant_workspace_id: this.tenantWorkspaceId,
        title: doc.title,
        language: doc.language,
        content: doc.content,
        persisted_at: doc.persistedAt,
      },
      { onConflict: "tenant_workspace_id,id" },
    );
    if (error) this.fail("save", error.message);
  }

  async load(notebookId: string): Promise<PersistedNotebookDocument | null> {
    assertValidNotebookId(notebookId);
    const { data, error } = await this.client
      .from("notebooks")
      .select("id, tenant_workspace_id, title, language, content, persisted_at")
      .eq("id", notebookId)
      .eq("tenant_workspace_id", this.tenantWorkspaceId)
      .maybeSingle();
    if (error) this.fail("load", error.message);
    if (!data) return null;
    const row = data as NotebookRow;
    return {
      notebookId: row.id,
      title: row.title,
      language: row.language as PersistedNotebookDocument["language"],
      content: row.content,
      persistedAt: new Date(row.persisted_at).toISOString(),
    };
  }

  async list(): Promise<NotebookDocumentSummary[]> {
    const { data, error } = await this.client
      .from("notebooks")
      .select("id, title, language, persisted_at")
      .eq("tenant_workspace_id", this.tenantWorkspaceId)
      .order("id", { ascending: true });
    if (error) this.fail("list", error.message);
    return (data ?? []).map((row) => ({
      notebookId: (row as NotebookRow).id,
      title: (row as NotebookRow).title,
      language: (row as NotebookRow).language as PersistedNotebookDocument["language"],
      persistedAt: new Date((row as NotebookRow).persisted_at).toISOString(),
    }));
  }
}

/**
 * Per-tenant provider for multi-tenant mode; mirrors
 * createSupabaseRunbookStorageProvider.
 */
export function createSupabaseNotebookDocumentStorageProvider(
  config: Omit<SupabaseNotebookDocumentStorageConfig, "tenantWorkspaceId">,
): (tenantWorkspaceId: string) => NotebookDocumentStorage {
  const cache = new Map<string, NotebookDocumentStorage>();
  return (tenantWorkspaceId: string): NotebookDocumentStorage => {
    let storage = cache.get(tenantWorkspaceId);
    if (!storage) {
      storage = new SupabaseNotebookDocumentStorage({ ...config, tenantWorkspaceId });
      cache.set(tenantWorkspaceId, storage);
    }
    return storage;
  };
}
