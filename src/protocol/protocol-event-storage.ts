/**
 * SupabaseProtocolEventStorage — durable, tenant-scoped persistence of the
 * protocol lifecycle event stream (SPEC-REASONING-CHANNEL-HOSTED, claim c2).
 *
 * In local mode the handler's onProtocolEvent stream is broadcast in-process
 * over /events SSE. In hosted (multi-tenant) Cloud Run that won't span
 * replicas, so the same stream is appended here and the reasoning channel
 * pulls it via changed_since (claim c3), scoped to its workspace.
 *
 * Distinct from protocol_history (the session-keyed audit log with
 * operation-level event_type); this table carries the full ThoughtboxEvent
 * taxonomy the channel consumes, identical to local SSE delivery.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types.js';
import type { ThoughtboxEvent } from '../events/types.js';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

/** A persisted protocol event plus its monotonic pull cursor (row id). */
export interface ProtocolEventRecord extends ThoughtboxEvent {
  cursor: number;
}

export interface ProtocolEventStorage {
  append(event: ThoughtboxEvent): Promise<void>;
  /**
   * Events with id greater than `cursor`, oldest first. `cursor` 0 reads from
   * the start. Caller scopes nothing — the storage is bound to one tenant.
   */
  changedSince(cursor: number, limit?: number): Promise<ProtocolEventRecord[]>;
}

export interface SupabaseProtocolEventStorageConfig {
  supabaseUrl: string;
  /** Service role key — bypasses RLS; tenant isolation is enforced in queries. */
  serviceRoleKey: string;
  /** SaaS workspace (public.workspaces.id) all event rows are scoped to. */
  tenantWorkspaceId: string;
}

export class SupabaseProtocolEventStorage implements ProtocolEventStorage {
  private client: SupabaseClient<Database>;
  private tenantWorkspaceId: string;

  constructor(config: SupabaseProtocolEventStorageConfig) {
    this.tenantWorkspaceId = config.tenantWorkspaceId;
    this.client = createClient<Database>(config.supabaseUrl, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private fail(operation: string, message: string): never {
    throw new Error(
      `SupabaseProtocolEventStorage.${operation} failed (tenant ${this.tenantWorkspaceId}): ${message}`,
    );
  }

  async append(event: ThoughtboxEvent): Promise<void> {
    const sessionId =
      typeof event.data.session_id === 'string' ? event.data.session_id : null;
    const { error } = await this.client.from('protocol_events').insert({
      tenant_workspace_id: this.tenantWorkspaceId,
      source: event.source,
      type: event.type,
      session_id: sessionId,
      event_timestamp: event.timestamp,
      data: event.data as Database['public']['Tables']['protocol_events']['Insert']['data'],
    });
    if (error) this.fail('append', error.message);
  }

  async changedSince(cursor: number, limit = DEFAULT_LIMIT): Promise<ProtocolEventRecord[]> {
    const capped = Math.min(Math.max(1, limit), MAX_LIMIT);
    const { data, error } = await this.client
      .from('protocol_events')
      .select('id, source, type, event_timestamp, data')
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .gt('id', cursor)
      .order('id', { ascending: true })
      .limit(capped);
    if (error) this.fail('changedSince', error.message);

    return (data ?? []).map((row) => ({
      cursor: row.id,
      source: row.source as ThoughtboxEvent['source'],
      type: row.type as ThoughtboxEvent['type'],
      workspaceId: this.tenantWorkspaceId,
      timestamp: row.event_timestamp,
      data: (row.data ?? {}) as Record<string, unknown>,
    }));
  }
}

/**
 * Per-tenant SupabaseProtocolEventStorage provider for multi-tenant mode.
 * Instances are cached per tenant workspace; all rows are scoped by
 * tenant_workspace_id so the channel can never pull another tenant's events.
 */
export function createSupabaseProtocolEventStorageProvider(
  config: Omit<SupabaseProtocolEventStorageConfig, 'tenantWorkspaceId'>,
): (tenantWorkspaceId: string) => ProtocolEventStorage {
  const cache = new Map<string, ProtocolEventStorage>();
  return (tenantWorkspaceId: string): ProtocolEventStorage => {
    let storage = cache.get(tenantWorkspaceId);
    if (!storage) {
      storage = new SupabaseProtocolEventStorage({ ...config, tenantWorkspaceId });
      cache.set(tenantWorkspaceId, storage);
    }
    return storage;
  };
}
