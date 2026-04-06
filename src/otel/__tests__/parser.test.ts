import { describe, it, expect } from 'vitest';
import {
  flattenAttributes,
  extractValue,
  nanosToIso,
} from '../types.js';
import { parseLogsPayload, parseMetricsPayload } from '../parser.js';
import type { OtlpLogsPayload, OtlpMetricsPayload } from '../types.js';

describe('extractValue', () => {
  it('extracts stringValue', () => {
    expect(extractValue({ stringValue: 'hello' })).toBe('hello');
  });

  it('extracts boolValue', () => {
    expect(extractValue({ boolValue: true })).toBe(true);
    expect(extractValue({ boolValue: false })).toBe(false);
  });

  it('extracts intValue as number', () => {
    expect(extractValue({ intValue: '42' })).toBe(42);
  });

  it('extracts doubleValue', () => {
    expect(extractValue({ doubleValue: 3.14 })).toBe(3.14);
  });

  it('returns null for empty value', () => {
    expect(extractValue({})).toBeNull();
  });
});

describe('flattenAttributes', () => {
  it('flattens mixed attribute types', () => {
    const result = flattenAttributes([
      { key: 'name', value: { stringValue: 'Read' } },
      { key: 'success', value: { boolValue: true } },
      { key: 'count', value: { intValue: '5' } },
      { key: 'rate', value: { doubleValue: 0.95 } },
    ]);
    expect(result).toEqual({
      name: 'Read',
      success: true,
      count: 5,
      rate: 0.95,
    });
  });

  it('returns empty object for undefined', () => {
    expect(flattenAttributes(undefined)).toEqual({});
  });

  it('returns empty object for empty array', () => {
    expect(flattenAttributes([])).toEqual({});
  });

  it('skips entries with null-extracting values', () => {
    const result = flattenAttributes([
      { key: 'good', value: { stringValue: 'yes' } },
      { key: 'bad', value: {} },
    ]);
    expect(result).toEqual({ good: 'yes' });
  });
});

describe('nanosToIso', () => {
  it('converts nanosecond string to timestamp', () => {
    const result = nanosToIso('1711558800000000000');
    expect(result.timestamp_ns).toBe(1711558800000000000);
    expect(new Date(result.timestamp_at).getTime()).toBe(1711558800000);
  });

  it('handles undefined as epoch', () => {
    const result = nanosToIso(undefined);
    expect(result.timestamp_ns).toBe(0);
    expect(result.timestamp_at).toBe('1970-01-01T00:00:00.000Z');
  });
});

describe('parseLogsPayload', () => {
  const workspaceId = '22222222-2222-4222-a222-222222222222';

  it('parses a single log record with event.name attribute', () => {
    const payload: OtlpLogsPayload = {
      resourceLogs: [{
        resource: {
          attributes: [
            { key: 'session.id', value: { stringValue: 'session-abc' } },
            { key: 'service.name', value: { stringValue: 'claude-code' } },
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
              { key: 'tool.success', value: { boolValue: true } },
            ],
          }],
        }],
      }],
    };

    const rows = parseLogsPayload(payload, workspaceId);
    expect(rows).toHaveLength(1);

    const row = rows[0];
    expect(row.workspace_id).toBe(workspaceId);
    expect(row.session_id).toBe('session-abc');
    expect(row.event_type).toBe('log');
    expect(row.event_name).toBe('claude_code.tool_result');
    expect(row.severity).toBe('INFO');
    expect(row.body).toBe('tool_result');
    expect(row.metric_value).toBeNull();
    expect(row.resource_attrs).toEqual({
      'session.id': 'session-abc',
      'service.name': 'claude-code',
    });
    expect(row.event_attrs).toEqual({
      'event.name': 'claude_code.tool_result',
      'tool.name': 'Read',
      'tool.success': true,
    });
  });

  it('handles multiple log records across scopes', () => {
    const payload: OtlpLogsPayload = {
      resourceLogs: [{
        resource: {
          attributes: [
            { key: 'session.id', value: { stringValue: 's1' } },
          ],
        },
        scopeLogs: [
          {
            logRecords: [
              { timeUnixNano: '1000000000', body: { stringValue: 'event_a' } },
              { timeUnixNano: '2000000000', body: { stringValue: 'event_b' } },
            ],
          },
          {
            logRecords: [
              { timeUnixNano: '3000000000', body: { stringValue: 'event_c' } },
            ],
          },
        ],
      }],
    };

    const rows = parseLogsPayload(payload, workspaceId);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.event_name)).toEqual(['event_a', 'event_b', 'event_c']);
  });

  it('falls back to event attribute session.id when resource session.id is missing', () => {
    const payload: OtlpLogsPayload = {
      resourceLogs: [{
        scopeLogs: [{
          logRecords: [{
            timeUnixNano: '1000000000',
            body: { stringValue: 'tool_result' },
            attributes: [
              { key: 'session.id', value: { stringValue: 'event-session-123' } },
            ],
          }],
        }],
      }],
    };

    const rows = parseLogsPayload(payload, workspaceId);
    expect(rows).toHaveLength(1);
    expect(rows[0].session_id).toBe('event-session-123');
  });

  it('handles missing resource attributes', () => {
    const payload: OtlpLogsPayload = {
      resourceLogs: [{
        scopeLogs: [{
          logRecords: [{
            timeUnixNano: '1000000000',
            body: { stringValue: 'orphan_event' },
          }],
        }],
      }],
    };

    const rows = parseLogsPayload(payload, workspaceId);
    expect(rows).toHaveLength(1);
    expect(rows[0].session_id).toBeNull();
    expect(rows[0].resource_attrs).toEqual({});
  });

  it('returns empty array for empty payload', () => {
    expect(parseLogsPayload({}, workspaceId)).toEqual([]);
    expect(parseLogsPayload({ resourceLogs: [] }, workspaceId)).toEqual([]);
  });
});

describe('parseMetricsPayload', () => {
  const workspaceId = '22222222-2222-4222-a222-222222222222';

  it('parses a sum metric with data points', () => {
    const payload: OtlpMetricsPayload = {
      resourceMetrics: [{
        resource: {
          attributes: [
            { key: 'session.id', value: { stringValue: 'session-xyz' } },
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
                  { key: 'model', value: { stringValue: 'claude-sonnet-4-6-20250514' } },
                ],
              }],
            },
          }],
        }],
      }],
    };

    const rows = parseMetricsPayload(payload, workspaceId);
    expect(rows).toHaveLength(1);

    const row = rows[0];
    expect(row.event_type).toBe('metric');
    expect(row.event_name).toBe('claude_code.cost.usage');
    expect(row.metric_value).toBe(0.0042);
    expect(row.session_id).toBe('session-xyz');
    expect(row.severity).toBeNull();
    expect(row.body).toBeNull();
    expect(row.event_attrs).toEqual({ model: 'claude-sonnet-4-6-20250514' });
  });

  it('parses gauge metrics', () => {
    const payload: OtlpMetricsPayload = {
      resourceMetrics: [{
        resource: { attributes: [] },
        scopeMetrics: [{
          metrics: [{
            name: 'claude_code.session.count',
            gauge: {
              dataPoints: [{
                timeUnixNano: '1000000000',
                asInt: '3',
              }],
            },
          }],
        }],
      }],
    };

    const rows = parseMetricsPayload(payload, workspaceId);
    expect(rows).toHaveLength(1);
    expect(rows[0].metric_value).toBe(3);
  });

  it('falls back to data point attribute session.id when resource session.id is missing', () => {
    const payload: OtlpMetricsPayload = {
      resourceMetrics: [{
        scopeMetrics: [{
          metrics: [{
            name: 'claude_code.token.usage',
            sum: {
              dataPoints: [{
                timeUnixNano: '1000000000',
                asDouble: 42,
                attributes: [
                  { key: 'session.id', value: { stringValue: 'metric-session-456' } },
                ],
              }],
            },
          }],
        }],
      }],
    };

    const rows = parseMetricsPayload(payload, workspaceId);
    expect(rows).toHaveLength(1);
    expect(rows[0].session_id).toBe('metric-session-456');
  });

  it('handles multiple data points per metric', () => {
    const payload: OtlpMetricsPayload = {
      resourceMetrics: [{
        resource: { attributes: [] },
        scopeMetrics: [{
          metrics: [{
            name: 'claude_code.token.usage',
            sum: {
              dataPoints: [
                { timeUnixNano: '1000000000', asDouble: 100 },
                { timeUnixNano: '2000000000', asDouble: 200 },
              ],
            },
          }],
        }],
      }],
    };

    const rows = parseMetricsPayload(payload, workspaceId);
    expect(rows).toHaveLength(2);
    expect(rows[0].metric_value).toBe(100);
    expect(rows[1].metric_value).toBe(200);
  });

  it('returns empty array for empty payload', () => {
    expect(parseMetricsPayload({}, workspaceId)).toEqual([]);
  });
});
