/**
 * OTLP/HTTP JSON type definitions and attribute helpers.
 *
 * Covers the subset of the OTLP spec that Claude Code actually emits:
 * - Log records (tool_result, api_request, api_error, user_prompt, tool_decision)
 * - Metric data points (cost, tokens, sessions, lines_of_code)
 *
 * Spec: https://opentelemetry.io/docs/specs/otlp/#otlphttp
 */

// ---------------------------------------------------------------------------
// OTLP attribute value types
// ---------------------------------------------------------------------------

export interface OtlpAnyValue {
  stringValue?: string;
  boolValue?: boolean;
  intValue?: string; // OTLP encodes int64 as string
  doubleValue?: number;
  arrayValue?: { values: OtlpAnyValue[] };
}

export interface OtlpKeyValue {
  key: string;
  value: OtlpAnyValue;
}

// ---------------------------------------------------------------------------
// OTLP resource (shared across logs and metrics)
// ---------------------------------------------------------------------------

export interface OtlpResource {
  attributes?: OtlpKeyValue[];
}

// ---------------------------------------------------------------------------
// OTLP logs
// ---------------------------------------------------------------------------

export interface OtlpLogRecord {
  timeUnixNano?: string;
  observedTimeUnixNano?: string;
  severityNumber?: number;
  severityText?: string;
  body?: OtlpAnyValue;
  attributes?: OtlpKeyValue[];
  traceId?: string;
  spanId?: string;
}

export interface OtlpScopeLogs {
  scope?: { name?: string; version?: string };
  logRecords?: OtlpLogRecord[];
}

export interface OtlpResourceLogs {
  resource?: OtlpResource;
  scopeLogs?: OtlpScopeLogs[];
}

export interface OtlpLogsPayload {
  resourceLogs?: OtlpResourceLogs[];
}

// ---------------------------------------------------------------------------
// OTLP metrics
// ---------------------------------------------------------------------------

export interface OtlpDataPoint {
  timeUnixNano?: string;
  startTimeUnixNano?: string;
  asDouble?: number;
  asInt?: string; // int64 as string
  attributes?: OtlpKeyValue[];
}

export interface OtlpMetric {
  name: string;
  description?: string;
  unit?: string;
  sum?: { dataPoints?: OtlpDataPoint[]; isMonotonic?: boolean };
  gauge?: { dataPoints?: OtlpDataPoint[] };
  histogram?: { dataPoints?: unknown[] };
}

export interface OtlpScopeMetrics {
  scope?: { name?: string; version?: string };
  metrics?: OtlpMetric[];
}

export interface OtlpResourceMetrics {
  resource?: OtlpResource;
  scopeMetrics?: OtlpScopeMetrics[];
}

export interface OtlpMetricsPayload {
  resourceMetrics?: OtlpResourceMetrics[];
}

// ---------------------------------------------------------------------------
// Stored event row (matches otel_events table)
// ---------------------------------------------------------------------------

export interface OtelEventRow {
  workspace_id: string;
  session_id: string | null;
  event_type: 'log' | 'metric';
  event_name: string;
  severity: string | null;
  timestamp_ns: number;
  timestamp_at: string; // ISO 8601
  resource_attrs: Record<string, string | number | boolean>;
  event_attrs: Record<string, string | number | boolean>;
  body: string | null;
  metric_value: number | null;
}

// ---------------------------------------------------------------------------
// Attribute helpers
// ---------------------------------------------------------------------------

export function extractValue(
  value: OtlpAnyValue,
): string | number | boolean | null {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.boolValue !== undefined) return value.boolValue;
  if (value.intValue !== undefined) return Number(value.intValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  return null;
}

export function flattenAttributes(
  attrs: OtlpKeyValue[] | undefined,
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  if (!attrs) return result;
  for (const { key, value } of attrs) {
    const extracted = extractValue(value);
    if (extracted !== null) {
      result[key] = extracted;
    }
  }
  return result;
}

export function nanosToIso(nanos: string | undefined): {
  timestamp_ns: number;
  timestamp_at: string;
} {
  const ns = Number(nanos ?? '0');
  const ms = Math.floor(ns / 1_000_000);
  return {
    timestamp_ns: ns,
    timestamp_at: new Date(ms).toISOString(),
  };
}
