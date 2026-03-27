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

    return { inserted: rows.length };
  }

  async querySessionTimeline(
    workspaceId: string,
    sessionId: string,
    opts?: { limit?: number },
  ): Promise<SessionTimelineResult> {
    const limit = opts?.limit ?? 200;

    const { data, error } = await this.supabase
      .from('otel_events')
      .select('id, event_type, event_name, severity, timestamp_at, body, metric_value, event_attrs')
      .eq('workspace_id', workspaceId)
      .eq('session_id', sessionId)
      .order('timestamp_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Timeline query failed: ${error.message}`);
    }

    return {
      session_id: sessionId,
      events: (data ?? []) as TimelineEvent[],
      count: data?.length ?? 0,
    };
  }

  async querySessionCost(
    workspaceId: string,
    sessionId?: string,
  ): Promise<SessionCostResult> {
    const { data, error } = await this.supabase
      .rpc('otel_session_cost', {
        p_workspace_id: workspaceId,
        ...(sessionId ? { p_session_id: sessionId } : {}),
      });

    if (error) {
      throw new Error(`Cost query failed: ${error.message}`);
    }

    const rows = (data ?? []) as Array<{
      model: string;
      total_cost: number;
      data_points: number;
    }>;

    const costs: CostEntry[] = rows.map((r) => ({
      model: r.model,
      total_cost: r.total_cost,
      data_points: r.data_points,
    }));

    const total = costs.reduce((sum, c) => sum + c.total_cost, 0);

    return {
      session_id: sessionId ?? null,
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
