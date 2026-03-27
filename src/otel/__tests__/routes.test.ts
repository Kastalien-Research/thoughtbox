/**
 * Integration tests for OTLP HTTP routes.
 *
 * Mounts routes on a test Express app and verifies the full
 * HTTP request → parser → storage → Supabase pipeline.
 * Requires a local Supabase instance via `supabase start`.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { mountOtlpRoutes } from '../routes.js';
import {
  isSupabaseAvailable,
  getTestSupabaseConfig,
  createServiceClient,
  ensureTestWorkspace,
  TEST_WORKSPACE_ID,
} from '../../__tests__/supabase-test-helpers.js';

const TEST_API_KEY = 'test-static-key-for-routes';
const TEST_PORT = 0; // OS-assigned

describe('OTLP Routes', () => {
  let server: Server;
  let baseUrl: string;
  let available = false;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
    if (!available) return;

    await ensureTestWorkspace();

    const config = getTestSupabaseConfig();
    const app = express();

    mountOtlpRoutes(app, {
      supabaseUrl: config.supabaseUrl,
      serviceRoleKey: config.serviceRoleKey,
      staticApiKey: TEST_API_KEY,
      defaultWorkspaceId: TEST_WORKSPACE_ID,
    });

    server = await new Promise<Server>((resolve) => {
      const s = app.listen(TEST_PORT, () => resolve(s));
    });

    const addr = server.address();
    if (typeof addr === 'object' && addr) {
      baseUrl = `http://127.0.0.1:${addr.port}`;
    }
  });

  beforeEach(async () => {
    if (!available) return;
    const client = createServiceClient();
    await client
      .from('otel_events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // ==========================================================================
  // Auth
  // ==========================================================================

  it('rejects requests without an API key', async ({ skip }) => {
    if (!available) skip();

    const res = await fetch(`${baseUrl}/v1/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceLogs: [] }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Missing API key');
  });

  it('rejects requests with an invalid API key', async ({ skip }) => {
    if (!available) skip();

    const res = await fetch(`${baseUrl}/v1/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer wrong-key',
      },
      body: JSON.stringify({ resourceLogs: [] }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Invalid API key');
  });

  // ==========================================================================
  // Content-Type
  // ==========================================================================

  it('rejects non-JSON content type', async ({ skip }) => {
    if (!available) skip();

    const res = await fetch(`${baseUrl}/v1/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-protobuf',
        'Authorization': `Bearer ${TEST_API_KEY}`,
      },
      body: '{}',
    });

    expect(res.status).toBe(415);
  });

  // ==========================================================================
  // Logs ingestion
  // ==========================================================================

  it('ingests logs via Bearer token and writes to Supabase', async ({ skip }) => {
    if (!available) skip();

    const payload = {
      resourceLogs: [{
        resource: {
          attributes: [
            { key: 'session.id', value: { stringValue: 'route-test-session' } },
          ],
        },
        scopeLogs: [{
          logRecords: [{
            timeUnixNano: '1711558800000000000',
            severityText: 'INFO',
            body: { stringValue: 'tool_result' },
            attributes: [
              { key: 'event.name', value: { stringValue: 'claude_code.tool_result' } },
              { key: 'tool.name', value: { stringValue: 'Read' } },
            ],
          }],
        }],
      }],
    };

    const res = await fetch(`${baseUrl}/v1/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);

    // Verify data landed in Supabase
    const client = createServiceClient();
    const { data } = await client
      .from('otel_events')
      .select('*')
      .eq('session_id', 'route-test-session');

    expect(data).toHaveLength(1);
    expect(data![0].event_name).toBe('claude_code.tool_result');
    expect(data![0].event_type).toBe('log');
  });

  // ==========================================================================
  // Metrics ingestion
  // ==========================================================================

  it('ingests metrics via query param key and writes to Supabase', async ({ skip }) => {
    if (!available) skip();

    const payload = {
      resourceMetrics: [{
        resource: {
          attributes: [
            { key: 'session.id', value: { stringValue: 'metrics-route-session' } },
          ],
        },
        scopeMetrics: [{
          metrics: [{
            name: 'claude_code.cost.usage',
            sum: {
              dataPoints: [{
                timeUnixNano: '1711558800000000000',
                asDouble: 0.0042,
                attributes: [
                  { key: 'model', value: { stringValue: 'claude-sonnet-4-6' } },
                ],
              }],
            },
          }],
        }],
      }],
    };

    const res = await fetch(`${baseUrl}/v1/metrics?key=${TEST_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);

    // Verify data landed in Supabase
    const client = createServiceClient();
    const { data } = await client
      .from('otel_events')
      .select('*')
      .eq('session_id', 'metrics-route-session');

    expect(data).toHaveLength(1);
    expect(data![0].event_name).toBe('claude_code.cost.usage');
    expect(data![0].metric_value).toBe(0.0042);
  });

  // ==========================================================================
  // Empty / edge cases
  // ==========================================================================

  it('accepts empty logs payload', async ({ skip }) => {
    if (!available) skip();

    const res = await fetch(`${baseUrl}/v1/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_API_KEY}`,
      },
      body: JSON.stringify({ resourceLogs: [] }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({});
  });

  it('accepts empty metrics payload', async ({ skip }) => {
    if (!available) skip();

    const res = await fetch(`${baseUrl}/v1/metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_API_KEY}`,
      },
      body: JSON.stringify({ resourceMetrics: [] }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({});
  });
});
