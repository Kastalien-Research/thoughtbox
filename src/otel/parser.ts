/**
 * OTLP/HTTP JSON parser.
 *
 * Flattens nested OTLP payloads into rows for the otel_events table.
 * Pure functions — no I/O, no dependencies beyond ./types.
 */

import {
  flattenAttributes,
  nanosToIso,
  extractValue,
  type OtlpLogsPayload,
  type OtlpMetricsPayload,
  type OtlpResource,
  type OtelEventRow,
} from './types.js';

function getSessionId(
  resource: OtlpResource | undefined,
): string | null {
  const attrs = resource?.attributes;
  if (!attrs) return null;
  const sessionAttr = attrs.find((a) => a.key === 'session.id');
  if (!sessionAttr) return null;
  const value = extractValue(sessionAttr.value);
  return typeof value === 'string' ? value : null;
}

export function parseLogsPayload(
  payload: OtlpLogsPayload,
  workspaceId: string,
): OtelEventRow[] {
  const rows: OtelEventRow[] = [];

  for (const rl of payload.resourceLogs ?? []) {
    const resourceAttrs = flattenAttributes(rl.resource?.attributes);
    const sessionId = getSessionId(rl.resource);

    for (const sl of rl.scopeLogs ?? []) {
      for (const record of sl.logRecords ?? []) {
        const ts = nanosToIso(
          record.timeUnixNano ?? record.observedTimeUnixNano,
        );
        const bodyValue = record.body
          ? extractValue(record.body)
          : null;
        const eventAttrs = flattenAttributes(record.attributes);

        // Claude Code puts the canonical event name in event.name attribute
        // (e.g. "claude_code.tool_result"), body may duplicate or differ
        const eventName = typeof eventAttrs['event.name'] === 'string'
          ? eventAttrs['event.name']
          : String(bodyValue ?? 'unknown');

        rows.push({
          workspace_id: workspaceId,
          session_id: sessionId,
          event_type: 'log',
          event_name: eventName,
          severity: record.severityText ?? null,
          timestamp_ns: ts.timestamp_ns,
          timestamp_at: ts.timestamp_at,
          resource_attrs: resourceAttrs,
          event_attrs: eventAttrs,
          body: bodyValue !== null ? String(bodyValue) : null,
          metric_value: null,
        });
      }
    }
  }

  return rows;
}

export function parseMetricsPayload(
  payload: OtlpMetricsPayload,
  workspaceId: string,
): OtelEventRow[] {
  const rows: OtelEventRow[] = [];

  for (const rm of payload.resourceMetrics ?? []) {
    const resourceAttrs = flattenAttributes(rm.resource?.attributes);
    const sessionId = getSessionId(rm.resource);

    for (const sm of rm.scopeMetrics ?? []) {
      for (const metric of sm.metrics ?? []) {
        const dataPoints =
          metric.sum?.dataPoints ??
          metric.gauge?.dataPoints ??
          [];

        for (const dp of dataPoints) {
          const ts = nanosToIso(dp.timeUnixNano);
          const value = dp.asDouble ?? (dp.asInt ? Number(dp.asInt) : null);

          rows.push({
            workspace_id: workspaceId,
            session_id: sessionId,
            event_type: 'metric',
            event_name: metric.name,
            severity: null,
            timestamp_ns: ts.timestamp_ns,
            timestamp_at: ts.timestamp_at,
            resource_attrs: resourceAttrs,
            event_attrs: flattenAttributes(dp.attributes),
            body: null,
            metric_value: value,
          });
        }
      }
    }
  }

  return rows;
}
