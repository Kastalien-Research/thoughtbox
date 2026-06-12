/**
 * SupabaseClaimStorage — Postgres-backed claim graph storage
 * (SPEC-AGX-SUBSTRATE B1, claim c1).
 *
 * Implements the ClaimStorage contract over the claims/claim_edges/
 * claim_subscriptions tables, scoped to a single tenant workspace —
 * the same pattern as SupabaseHubStorage:
 * - the claim aggregate uses optimistic concurrency (`version` column,
 *   compare-and-swap on save; stale saves throw instead of silently
 *   overwriting);
 * - edges and subscriptions are append-style rows; `addEdge` and
 *   `addSubscription` upsert with ignoreDuplicates so at-least-once
 *   retries are idempotent;
 * - claims are never hard-deleted (append-history status transitions).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '../database.types.js';
import type {
  Claim,
  ClaimEdge,
  ClaimEdgeFilter,
  ClaimQuery,
  ClaimStatus,
  ClaimStorage,
  ClaimSubscription,
  ClaimType,
} from './types.js';

type Tables = Database['public']['Tables'];
type ClaimRow = Tables['claims']['Row'];
type EdgeRow = Tables['claim_edges']['Row'];
type SubscriptionRow = Tables['claim_subscriptions']['Row'];

export interface SupabaseClaimStorageConfig {
  supabaseUrl: string;
  /** Service role key — bypasses RLS; tenant isolation is enforced in queries. */
  serviceRoleKey: string;
  /** SaaS workspace (public.workspaces.id) all claim rows are scoped to. */
  tenantWorkspaceId: string;
}

function toIso(timestamp: string): string {
  return new Date(timestamp).toISOString();
}

export class SupabaseClaimStorage implements ClaimStorage {
  private client: SupabaseClient<Database>;
  private tenantWorkspaceId: string;
  /** Versions of claim instances read through this storage (optimistic CAS). */
  private versions = new WeakMap<object, number>();

  constructor(config: SupabaseClaimStorageConfig) {
    this.tenantWorkspaceId = config.tenantWorkspaceId;
    this.client = createClient<Database>(config.supabaseUrl, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private fail(operation: string, message: string): never {
    throw new Error(
      `SupabaseClaimStorage.${operation} failed (tenant ${this.tenantWorkspaceId}): ${message}`,
    );
  }

  private rowToClaim(row: ClaimRow): Claim {
    const claim: Claim = {
      id: row.id,
      workspaceId: row.workspace_id,
      type: row.type as ClaimType,
      statement: row.statement,
      status: row.status as ClaimStatus,
      evidenceRefs: row.evidence_refs as unknown as string[],
      createdBy: row.created_by,
      ...(row.superseded_by !== null ? { supersededBy: row.superseded_by } : {}),
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
      statusChangedAt: toIso(row.status_changed_at),
    };
    this.versions.set(claim, row.version);
    return claim;
  }

  async getClaim(claimId: string): Promise<Claim | null> {
    const { data, error } = await this.client
      .from('claims')
      .select()
      .eq('id', claimId)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .maybeSingle();
    if (error) this.fail('getClaim', error.message);
    return data ? this.rowToClaim(data) : null;
  }

  async getClaims(claimIds: string[]): Promise<Claim[]> {
    if (claimIds.length === 0) return [];
    const { data, error } = await this.client
      .from('claims')
      .select()
      .in('id', claimIds)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });
    if (error) this.fail('getClaims', error.message);
    return (data ?? []).map(row => this.rowToClaim(row));
  }

  async claimsChangedSince(since: string, workspaceId?: string): Promise<Claim[]> {
    let request = this.client
      .from('claims')
      .select()
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .gt('status_changed_at', since);
    if (workspaceId) request = request.eq('workspace_id', workspaceId);
    const { data, error } = await request
      .order('status_changed_at', { ascending: true })
      .order('id', { ascending: true });
    if (error) this.fail('claimsChangedSince', error.message);
    return (data ?? []).map(row => this.rowToClaim(row));
  }

  async saveClaim(claim: Claim): Promise<void> {
    const fields = {
      statement: claim.statement,
      status: claim.status,
      evidence_refs: claim.evidenceRefs as unknown as Json,
      superseded_by: claim.supersededBy ?? null,
      updated_at: claim.updatedAt,
      status_changed_at: claim.statusChangedAt,
    };
    const expected = this.versions.get(claim);
    if (expected === undefined) {
      const { error } = await this.client.from('claims').insert({
        id: claim.id,
        workspace_id: claim.workspaceId,
        tenant_workspace_id: this.tenantWorkspaceId,
        type: claim.type,
        created_by: claim.createdBy,
        created_at: claim.createdAt,
        version: 1,
        ...fields,
      });
      if (error) this.fail('saveClaim', error.message);
      this.versions.set(claim, 1);
      return;
    }
    const { data, error } = await this.client
      .from('claims')
      .update({ ...fields, version: expected + 1 })
      .eq('id', claim.id)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .eq('version', expected)
      .select('version');
    if (error) this.fail('saveClaim', error.message);
    if (!data || data.length === 0) {
      this.fail(
        'saveClaim',
        `concurrent update detected for claim ${claim.id}; reload and retry`,
      );
    }
    this.versions.set(claim, expected + 1);
  }

  async queryClaims(query: ClaimQuery): Promise<Claim[]> {
    let request = this.client
      .from('claims')
      .select()
      .eq('workspace_id', query.workspaceId)
      .eq('tenant_workspace_id', this.tenantWorkspaceId);
    if (query.type) request = request.eq('type', query.type);
    if (query.status) request = request.eq('status', query.status);
    if (query.createdBy) request = request.eq('created_by', query.createdBy);
    if (query.text) request = request.ilike('statement', `%${query.text}%`);
    const { data, error } = await request
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });
    if (error) this.fail('queryClaims', error.message);
    return (data ?? []).map(row => this.rowToClaim(row));
  }

  private rowToEdge(row: EdgeRow): ClaimEdge {
    return {
      fromClaim: row.from_claim,
      toClaim: row.to_claim,
      kind: row.kind as ClaimEdge['kind'],
      createdBy: row.created_by,
      createdAt: toIso(row.created_at),
    };
  }

  async addEdge(edge: ClaimEdge): Promise<void> {
    const { error } = await this.client.from('claim_edges').upsert(
      {
        from_claim: edge.fromClaim,
        to_claim: edge.toClaim,
        kind: edge.kind,
        tenant_workspace_id: this.tenantWorkspaceId,
        created_by: edge.createdBy,
        created_at: edge.createdAt,
      },
      { onConflict: 'from_claim,to_claim,kind', ignoreDuplicates: true },
    );
    if (error) this.fail('addEdge', error.message);
  }

  async listEdges(filter: ClaimEdgeFilter): Promise<ClaimEdge[]> {
    if (filter.toClaims && filter.toClaims.length === 0) return [];
    let request = this.client
      .from('claim_edges')
      .select()
      .eq('tenant_workspace_id', this.tenantWorkspaceId);
    if (filter.fromClaim) request = request.eq('from_claim', filter.fromClaim);
    if (filter.toClaim) request = request.eq('to_claim', filter.toClaim);
    if (filter.toClaims) request = request.in('to_claim', filter.toClaims);
    if (filter.kind) request = request.eq('kind', filter.kind);
    const { data, error } = await request
      .order('created_at', { ascending: true })
      .order('from_claim', { ascending: true });
    if (error) this.fail('listEdges', error.message);
    return (data ?? []).map(row => this.rowToEdge(row));
  }

  private rowToSubscription(row: SubscriptionRow): ClaimSubscription {
    return {
      claimId: row.claim_id,
      subscriber: row.subscriber,
      createdBy: row.created_by,
      createdAt: toIso(row.created_at),
    };
  }

  async addSubscription(subscription: ClaimSubscription): Promise<void> {
    const { error } = await this.client.from('claim_subscriptions').upsert(
      {
        claim_id: subscription.claimId,
        subscriber: subscription.subscriber,
        tenant_workspace_id: this.tenantWorkspaceId,
        created_by: subscription.createdBy,
        created_at: subscription.createdAt,
      },
      { onConflict: 'claim_id,subscriber', ignoreDuplicates: true },
    );
    if (error) this.fail('addSubscription', error.message);
  }

  async removeSubscription(claimId: string, subscriber: string): Promise<void> {
    const { error } = await this.client
      .from('claim_subscriptions')
      .delete()
      .eq('claim_id', claimId)
      .eq('subscriber', subscriber)
      .eq('tenant_workspace_id', this.tenantWorkspaceId);
    if (error) this.fail('removeSubscription', error.message);
  }

  async listSubscriptions(claimId: string): Promise<ClaimSubscription[]> {
    const { data, error } = await this.client
      .from('claim_subscriptions')
      .select()
      .eq('claim_id', claimId)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .order('created_at', { ascending: true })
      .order('subscriber', { ascending: true });
    if (error) this.fail('listSubscriptions', error.message);
    return (data ?? []).map(row => this.rowToSubscription(row));
  }
}

/**
 * Per-tenant SupabaseClaimStorage provider for multi-tenant mode.
 * Instances are cached per tenant workspace; all rows are scoped by
 * tenant_workspace_id so tb.claims can never read another tenant's claims.
 */
export function createSupabaseClaimStorageProvider(
  config: Omit<SupabaseClaimStorageConfig, 'tenantWorkspaceId'>,
): (tenantWorkspaceId: string) => ClaimStorage {
  const cache = new Map<string, ClaimStorage>();
  return (tenantWorkspaceId: string): ClaimStorage => {
    let storage = cache.get(tenantWorkspaceId);
    if (!storage) {
      storage = new SupabaseClaimStorage({ ...config, tenantWorkspaceId });
      cache.set(tenantWorkspaceId, storage);
    }
    return storage;
  };
}
