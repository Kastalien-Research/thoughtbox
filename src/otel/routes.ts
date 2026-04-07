/**
 * OTLP/HTTP ingestion routes.
 *
 * Mounts POST /v1/logs and POST /v1/metrics on the given Express app.
 * Parses OTLP JSON payloads and writes directly to Supabase — no
 * in-memory store.
 */

import type { Express, Request, Response } from 'express';
import { json as expressJson } from 'express';
import { OtelEventStorage } from './otel-storage.js';
import { parseLogsPayload, parseMetricsPayload } from './parser.js';
import { resolveRequestAuth } from '../auth/resolve-request-auth.js';
import type { OtlpLogsPayload, OtlpMetricsPayload } from './types.js';

export interface OtlpRoutesConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
  staticApiKey?: string;
  localDevApiKey?: string;
}

function countLogRecords(payload: OtlpLogsPayload): number {
  let count = 0;
  for (const rl of payload.resourceLogs ?? []) {
    for (const sl of rl.scopeLogs ?? []) {
      count += sl.logRecords?.length ?? 0;
    }
  }
  return count;
}

function countMetricDataPoints(payload: OtlpMetricsPayload): number {
  let count = 0;
  for (const rm of payload.resourceMetrics ?? []) {
    for (const sm of rm.scopeMetrics ?? []) {
      for (const m of sm.metrics ?? []) {
        count += (m.sum?.dataPoints?.length ?? 0)
          + (m.gauge?.dataPoints?.length ?? 0);
      }
    }
  }
  return count;
}

/**
 * Resolve auth for an OTLP request, sending a 401 response on failure.
 * Returns the workspace ID or null (response already sent).
 */
async function resolveOtlpAuth(
  req: Request,
  res: Response,
  config: OtlpRoutesConfig,
): Promise<string | null> {
  try {
    return await resolveRequestAuth(req, {
      staticKey: config.staticApiKey,
      localDevKey: config.localDevApiKey,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    res.status(401).json({ error: message });
    return null;
  }
}

/**
 * Forward a raw OTLP payload to LangSmith's OTLP endpoint.
 * Fire-and-forget: caller must .catch(() => {}) — never throws into the request path.
 * No-ops if LANGSMITH_API_KEY is not set.
 */
async function forwardToLangSmith(path: string, body: unknown): Promise<void> {
  const apiKey = process.env.LANGSMITH_API_KEY;
  if (!apiKey) return;
  const base = (process.env.LANGSMITH_ENDPOINT ?? 'https://api.smith.langchain.com').replace(/\/$/, '');
  const project = process.env.LANGSMITH_PROJECT ?? 'default';
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'Langsmith-Project': project,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`[OTLP] LangSmith forward to ${path} failed: ${res.status}`);
  }
}

export function mountOtlpRoutes(
  app: Express,
  config: OtlpRoutesConfig,
): void {
  const storage = new OtelEventStorage({
    supabaseUrl: config.supabaseUrl,
    serviceRoleKey: config.serviceRoleKey,
  });

  const jsonParser = expressJson({ limit: '1mb' });

  app.post('/v1/logs', jsonParser, async (req: Request, res: Response) => {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      res.status(415).json({ error: 'Content-Type must be application/json' });
      return;
    }

    try {
      const workspaceId = await resolveOtlpAuth(req, res, config);
      if (!workspaceId) return;

      const payload = req.body as OtlpLogsPayload;
      const rows = parseLogsPayload(payload, workspaceId);
      const result = await storage.ingest(rows);
      console.error(`[OTLP] Ingested ${result.inserted} log events`);
      forwardToLangSmith('/otel/v1/logs', payload).catch(() => {});
      res.json({});
    } catch (error) {
      const payload = req.body as OtlpLogsPayload;
      console.error('[OTLP] Logs ingestion error:', error);
      res.status(500).json({
        partialSuccess: {
          rejectedLogRecords: countLogRecords(payload),
          errorMessage: error instanceof Error ? error.message : 'Internal error',
        },
      });
    }
  });

  app.post('/v1/metrics', jsonParser, async (req: Request, res: Response) => {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      res.status(415).json({ error: 'Content-Type must be application/json' });
      return;
    }

    try {
      const workspaceId = await resolveOtlpAuth(req, res, config);
      if (!workspaceId) return;

      const payload = req.body as OtlpMetricsPayload;
      const rows = parseMetricsPayload(payload, workspaceId);
      const result = await storage.ingest(rows);
      console.error(`[OTLP] Ingested ${result.inserted} metric data points`);
      forwardToLangSmith('/otel/v1/metrics', payload).catch(() => {});
      res.json({});
    } catch (error) {
      const payload = req.body as OtlpMetricsPayload;
      console.error('[OTLP] Metrics ingestion error:', error);
      res.status(500).json({
        partialSuccess: {
          rejectedMetricRecords: countMetricDataPoints(payload),
          errorMessage: error instanceof Error ? error.message : 'Internal error',
        },
      });
    }
  });
}
