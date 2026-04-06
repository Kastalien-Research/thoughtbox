/**
 * OTEL Event Storage — Supabase-backed storage for OTLP events.
 *
 * Named *storage* to satisfy the architectural constraint that only
 * storage classes import SupabaseClient directly.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types.js';
import type { OtelEventRow } from './types.js';

export interface OtelStorageConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
}

export interface TimelineEvent {
  id: string;
  event_type: string;
  event_name: string;
  severity: string | null;
  timestamp_at: string;
  body: string | null;
  metric_value: number | null;
  event_attrs: Record<string, unknown>;
}

export interface SessionTimelineResult {
  session_id: string;
  run_ids: string[];
  events: TimelineEvent[];
  count: number;
}

export interface CostEntry {
  model: string;
  total_cost: number;
  data_points: number;
}

export interface SessionCostResult {
  session_id: string | null;
  run_ids: string[];
  costs: CostEntry[];
  total: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'unknown';
  event_count?: number;
  error?: string;
}

export class OtelEventStorage {
  private readonly supabase: SupabaseClient<Database>;

  constructor(config: OtelStorageConfig) {
    this.supabase = createClient<Database>(
      config.supabaseUrl,
      config.serviceRoleKey,
    );
  }

  async ingest(rows: OtelEventRow[]): Promise<{ inserted: number }> {
    if (rows.length === 0) {
      return { inserted: 0 };
    }

    const { error } = await this.supabase
      .from('otel_events')
      .insert(rows);

    if (error) {
      throw new Error(
        `OTEL ingest failed: ${error.message} (code: ${error.code})`,
      );
    }

    await this.reconcileRunBindings(rows);

    return { inserted: rows.length };
  }

  private async reconcileRunBindings(rows: OtelEventRow[]): Promise<void> {
    for (const row of rows) {
      if (!row.session_id) continue;

      const eventAttrs = row.event_attrs as Record<string, unknown>;
      const sessionId = typeof eventAttrs['thoughtbox.session_id'] === 'string'
        ? eventAttrs['thoughtbox.session_id']
        : null;

      if (!sessionId) continue;

      const { data: run, error } = await this.supabase
        .from('runs')
        .select('id, otel_session_id')
        .eq('workspace_id', row.workspace_id)
        .eq('session_id', sessionId)
        .or(`otel_session_id.is.null,otel_session_id.eq.${row.session_id}`)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new Error(`Run binding lookup failed: ${error.message}`);
      }
      if (!run || run.otel_session_id === row.session_id) continue;

      const { error: updateError } = await this.supabase
        .from('runs')
        .update({ otel_session_id: row.session_id })
        .eq('id', run.id);

      if (updateError) {
        throw new Error(`Run binding update failed: ${updateError.message}`);
      }
    }
  }

  async querySessionTimeline(
    workspaceId: string,
    sessionId: string,
    opts?: { limit?: number },
  ): Promise<SessionTimelineResult> {
    const limit = opts?.limit ?? 200;

    const { data: runs, error: runsError } = await this.supabase
      .from('runs')
      .select('id, otel_session_id')
      .eq('workspace_id', workspaceId)
      .eq('session_id', sessionId)
      .not('otel_session_id', 'is', null)
      .order('started_at', { ascending: true });

    if (runsError) {
      throw new Error(`Run lookup failed: ${runsError.message}`);
    }

    const otelSessionIds = Array.from(new Set((runs ?? []).map((run) => run.otel_session_id).filter(Boolean)));
    if (otelSessionIds.length === 0) {
      return {
        session_id: sessionId,
        run_ids: (runs ?? []).map((run) => run.id),
        events: [],
        count: 0,
      };
    }

    const { data, error } = await this.supabase
      .from('otel_events')
      .select('id, event_type, event_name, severity, timestamp_at, body, metric_value, event_attrs')
      .eq('workspace_id', workspaceId)
      .in('session_id', otelSessionIds)
      .order('timestamp_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Timeline query failed: ${error.message}`);
    }

    return {
      session_id: sessionId,
      run_ids: (runs ?? []).map((run) => run.id),
      events: (data ?? []) as TimelineEvent[],
      count: data?.length ?? 0,
    };
  }

  async querySessionCost(
    workspaceId: string,
    sessionId?: string,
  ): Promise<SessionCostResult> {
    let otelSessionIds: string[] | null = null;
    let runIds: string[] = [];

    if (sessionId) {
      const { data: runs, error: runsError } = await this.supabase
        .from('runs')
        .select('id, otel_session_id')
        .eq('workspace_id', workspaceId)
        .eq('session_id', sessionId)
        .not('otel_session_id', 'is', null);

      if (runsError) {
        throw new Error(`Run lookup failed: ${runsError.message}`);
      }

      runIds = (runs ?? []).map((run) => run.id);
      otelSessionIds = Array.from(
        new Set(
          (runs ?? [])
            .map((run) => run.otel_session_id)
            .filter((sessionId): sessionId is string => typeof sessionId === 'string' && sessionId.length > 0),
        ),
      );
      if (otelSessionIds.length === 0) {
        return { session_id: sessionId, run_ids: runIds, costs: [], total: 0 };
      }
    }

    let query = this.supabase
      .from('otel_events')
      .select('event_attrs, metric_value')
      .eq('workspace_id', workspaceId)
      .eq('event_type', 'metric')
      .eq('event_name', 'claude_code.cost.usage');

    if (otelSessionIds) {
      query = query.in('session_id', otelSessionIds);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Cost query failed: ${error.message}`);
    }

    const aggregates = new Map<string, CostEntry>();
    for (const row of data ?? []) {
      const attrs = (row.event_attrs ?? {}) as Record<string, unknown>;
      const model = typeof attrs.model === 'string' ? attrs.model : 'unknown';
      const metricValue = typeof row.metric_value === 'number' ? row.metric_value : 0;
      const existing = aggregates.get(model) || { model, total_cost: 0, data_points: 0 };
      existing.total_cost += metricValue;
      existing.data_points += 1;
      aggregates.set(model, existing);
    }

    const costs = Array.from(aggregates.values());

    const total = costs.reduce((sum, c) => sum + c.total_cost, 0);

    return {
      session_id: sessionId ?? null,
      run_ids: runIds,
      costs,
      total,
    };
  }

  async checkHealth(): Promise<HealthCheckResult> {
    try {
      const { count, error } = await this.supabase
        .from('otel_events')
        .select('*', { count: 'exact', head: true });

      if (error) {
        return { status: 'unhealthy', error: error.message };
      }

      return { status: 'healthy', event_count: count ?? 0 };
    } catch (err) {
      return {
        status: 'unhealthy',
        error: err instanceof Error ? err.message : 'Query failed',
      };
    }
  }
}
