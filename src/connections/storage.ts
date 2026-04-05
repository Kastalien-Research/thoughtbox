import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  Connection,
  ConnectionSummary,
  CreateConnectionParams,
} from "./types.js";

interface ConnectionStorageOptions {
  supabaseUrl: string;
  serviceRoleKey: string;
}

/**
 * Tracks MCP session connection lifecycles in Supabase.
 *
 * NOTE: The `connections` table is not yet in the generated Database
 * type. Uses type assertion to access it. Regenerate database types
 * after running the migration to remove the assertions.
 */
export class ConnectionStorage {
  private readonly supabase: SupabaseClient;

  constructor(opts: ConnectionStorageOptions) {
    this.supabase = createClient(opts.supabaseUrl, opts.serviceRoleKey);
  }

  async create(params: CreateConnectionParams): Promise<Connection> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from("connections")
      .insert({
        workspace_id: params.workspace_id,
        project_id: params.project_id ?? null,
        metadata: params.metadata ?? {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create connection: ${error.message}`);
    }

    return data as Connection;
  }

  async end(connectionId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (this.supabase as any)
      .from("connections")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", connectionId);

    if (error) {
      throw new Error(`Failed to end connection: ${error.message}`);
    }
  }

  async listForWorkspace(
    workspaceId: string,
    opts?: { limit?: number; includeEnded?: boolean },
  ): Promise<ConnectionSummary[]> {
    const limit = opts?.limit ?? 50;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (this.supabase as any)
      .from("connections")
      .select("id, started_at, ended_at, metadata")
      .eq("workspace_id", workspaceId)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (!opts?.includeEnded) {
      query = query.is("ended_at", null);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(
        `Failed to list connections: ${error.message}`,
      );
    }

    return (data as Array<Record<string, unknown>>).map((row) => {
      const startedAt = row.started_at as string;
      const endedAt = row.ended_at as string | null;
      let durationSeconds: number | null = null;
      if (endedAt) {
        durationSeconds = Math.round(
          (new Date(endedAt).getTime() -
            new Date(startedAt).getTime()) /
            1000,
        );
      }
      return {
        id: row.id as string,
        started_at: startedAt,
        ended_at: endedAt,
        duration_seconds: durationSeconds,
        metadata: (row.metadata ?? {}) as Record<string, unknown>,
      };
    });
  }

  async closeStale(
    workspaceId: string,
    maxAgeHours = 2,
  ): Promise<number> {
    const cutoff = new Date(
      Date.now() - maxAgeHours * 60 * 60 * 1000,
    ).toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from("connections")
      .update({ ended_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId)
      .is("ended_at", null)
      .lt("started_at", cutoff)
      .select("id");

    if (error) {
      throw new Error(
        `Failed to close stale connections: ${error.message}`,
      );
    }

    return (data as unknown[]).length;
  }
}
