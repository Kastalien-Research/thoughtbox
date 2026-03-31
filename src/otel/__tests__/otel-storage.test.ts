/**
 * Integration tests for OtelEventStorage.
 *
 * Requires a local Supabase instance via `supabase start`.
 * Tests the full ingest → query path against real Postgres.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { OtelEventStorage } from '../otel-storage.js';
import { parseLogsPayload, parseMetricsPayload } from '../parser.js';
import type { OtlpLogsPayload, OtlpMetricsPayload } from '../types.js';
import {
  isSupabaseAvailable,
  getTestSupabaseConfig,
  createServiceClient,
  ensureTestWorkspace,
  TEST_WORKSPACE_ID,
} from '../../__tests__/supabase-test-helpers.js';

describe('OtelEventStorage', () => {
  let storage: OtelEventStorage;
  let available = false;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
    if (available) {
      await ensureTestWorkspace();
    }
  });

  beforeEach(async () => {
    if (!available) return;
    const client = createServiceClient();
    await client.from('otel_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    storage = new OtelEventStorage(getTestSupabaseConfig());
  });

  // ==========================================================================
  // Ingest
  // ==========================================================================

  it('ingests parsed log events into Supabase', async ({ skip }) => {
    if (!available) skip();

    const payload: OtlpLogsPayload = {
      resourceLogs: [{
        resource: {
          attributes: [
            { key: 'session.id', value: { stringValue: 'test-session-1' } },
            { key: 'service.name', value: { stringValue: 'claude-code' } },
          ],
        },
        scopeLogs: [{
          logRecords: [
            {
              timeUnixNano: '1711558800000000000',
              severityText: 'INFO',
              body: { stringValue: 'tool_result' },
              attributes: [
                { key: 'event.name', value: { stringValue: 'claude_code.tool_result' } },
                { key: 'tool.name', value: { stringValue: 'Read' } },
                { key: 'success', value: { boolValue: true } },
                { key: 'duration_ms', value: { intValue: '42' } },
              ],
            },
            {
              timeUnixNano: '1711558801000000000',
              severityText: 'INFO',
              body: { stringValue: 'api_request' },
              attributes: [
                { key: 'event.name', value: { stringValue: 'claude_code.api_request' } },
                { key: 'model', value: { stringValue: 'claude-sonnet-4-6' } },
                { key: 'cost_usd', value: { doubleValue: 0.003 } },
              ],
            },
          ],
        }],
      }],
    };

    const rows = parseLogsPayload(payload, TEST_WORKSPACE_ID);
    const result = await storage.ingest(rows);
    expect(result.inserted).toBe(2);
  });

  it('ingests parsed metric events into Supabase', async ({ skip }) => {
    if (!available) skip();

    const payload: OtlpMetricsPayload = {
      resourceMetrics: [{
        resource: {
          attributes: [
            { key: 'session.id', value: { stringValue: 'test-session-1' } },
          ],
        },
        scopeMetrics: [{
          metrics: [{
            name: 'claude_code.cost.usage',
            sum: {
              dataPoints: [
                {
                  timeUnixNano: '1711558800000000000',
                  asDouble: 0.0042,
                  attributes: [
                    { key: 'model', value: { stringValue: 'claude-sonnet-4-6' } },
                  ],
                },
                {
                  timeUnixNano: '1711558860000000000',
                  asDouble: 0.0018,
                  attributes: [
                    { key: 'model', value: { stringValue: 'claude-haiku-4-5' } },
                  ],
                },
              ],
            },
          }],
        }],
      }],
    };

    const rows = parseMetricsPayload(payload, TEST_WORKSPACE_ID);
    const result = await storage.ingest(rows);
    expect(result.inserted).toBe(2);
  });

  it('returns inserted: 0 for empty rows', async ({ skip }) => {
    if (!available) skip();
    const result = await storage.ingest([]);
    expect(result.inserted).toBe(0);
  });

  // ==========================================================================
  // Query: session_timeline
  // ==========================================================================

  it('queries session timeline in chronological order', async ({ skip }) => {
    if (!available) skip();

    const logsPayload: OtlpLogsPayload = {
      resourceLogs: [{
        resource: {
          attributes: [
            { key: 'session.id', value: { stringValue: 'timeline-session' } },
          ],
        },
        scopeLogs: [{
          logRecords: [
            {
              timeUnixNano: '1711558802000000000',
              severityText: 'INFO',
              body: { stringValue: 'second' },
              attributes: [
                { key: 'event.name', value: { stringValue: 'claude_code.tool_result' } },
              ],
            },
            {
              timeUnixNano: '1711558800000000000',
              severityText: 'INFO',
              body: { stringValue: 'first' },
              attributes: [
                { key: 'event.name', value: { stringValue: 'claude_code.user_prompt' } },
              ],
            },
          ],
        }],
      }],
    };

    await storage.ingest(parseLogsPayload(logsPayload, TEST_WORKSPACE_ID));

    const timeline = await storage.querySessionTimeline(
      TEST_WORKSPACE_ID,
      'timeline-session',
    );

    expect(timeline.session_id).toBe('timeline-session');
    expect(timeline.count).toBe(2);
    expect(timeline.events[0].event_name).toBe('claude_code.user_prompt');
    expect(timeline.events[1].event_name).toBe('claude_code.tool_result');
  });

  it('respects limit on timeline query', async ({ skip }) => {
    if (!available) skip();

    const logsPayload: OtlpLogsPayload = {
      resourceLogs: [{
        resource: {
          attributes: [
            { key: 'session.id', value: { stringValue: 'limit-session' } },
          ],
        },
        scopeLogs: [{
          logRecords: [
            { timeUnixNano: '1000000000', body: { stringValue: 'a' }, attributes: [{ key: 'event.name', value: { stringValue: 'a' } }] },
            { timeUnixNano: '2000000000', body: { stringValue: 'b' }, attributes: [{ key: 'event.name', value: { stringValue: 'b' } }] },
            { timeUnixNano: '3000000000', body: { stringValue: 'c' }, attributes: [{ key: 'event.name', value: { stringValue: 'c' } }] },
          ],
        }],
      }],
    };

    await storage.ingest(parseLogsPayload(logsPayload, TEST_WORKSPACE_ID));

    const timeline = await storage.querySessionTimeline(
      TEST_WORKSPACE_ID,
      'limit-session',
      { limit: 2 },
    );

    expect(timeline.count).toBe(2);
  });

  // ==========================================================================
  // Query: session_cost
  // ==========================================================================

  it('aggregates cost by model', async ({ skip }) => {
    if (!available) skip();

    const payload: OtlpMetricsPayload = {
      resourceMetrics: [{
        resource: {
          attributes: [
            { key: 'session.id', value: { stringValue: 'cost-session' } },
          ],
        },
        scopeMetrics: [{
          metrics: [{
            name: 'claude_code.cost.usage',
            sum: {
              dataPoints: [
                { timeUnixNano: '1000000000', asDouble: 0.01, attributes: [{ key: 'model', value: { stringValue: 'claude-sonnet-4-6' } }] },
                { timeUnixNano: '2000000000', asDouble: 0.02, attributes: [{ key: 'model', value: { stringValue: 'claude-sonnet-4-6' } }] },
                { timeUnixNano: '3000000000', asDouble: 0.005, attributes: [{ key: 'model', value: { stringValue: 'claude-haiku-4-5' } }] },
              ],
            },
          }],
        }],
      }],
    };

    await storage.ingest(parseMetricsPayload(payload, TEST_WORKSPACE_ID));

    const cost = await storage.querySessionCost(TEST_WORKSPACE_ID, 'cost-session');
    expect(cost.session_id).toBe('cost-session');
    expect(cost.total).toBeCloseTo(0.035);
    expect(cost.costs).toHaveLength(2);

    const sonnet = cost.costs.find(c => c.model === 'claude-sonnet-4-6');
    expect(sonnet).toBeDefined();
    expect(sonnet!.total_cost).toBeCloseTo(0.03);
    expect(sonnet!.data_points).toBe(2);

    const haiku = cost.costs.find(c => c.model === 'claude-haiku-4-5');
    expect(haiku).toBeDefined();
    expect(haiku!.total_cost).toBeCloseTo(0.005);
  });

  it('returns zero cost for session with no cost events', async ({ skip }) => {
    if (!available) skip();

    const cost = await storage.querySessionCost(TEST_WORKSPACE_ID, 'nonexistent-session');
    expect(cost.total).toBe(0);
    expect(cost.costs).toHaveLength(0);
  });

  // ==========================================================================
  // Health check
  // ==========================================================================

  it('reports healthy when Supabase is reachable', async ({ skip }) => {
    if (!available) skip();

    const health = await storage.checkHealth();
    expect(health.status).toBe('healthy');
    expect(health.event_count).toBeDefined();
  });
});
