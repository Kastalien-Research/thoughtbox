/**
 * Operations Catalog for Observability Gateway
 *
 * Defines all available observability operations with their schemas,
 * descriptions, categories, and examples.
 */

import type { OperationDefinition } from "../sessions/operations.js";

export const OBSERVABILITY_OPERATIONS: OperationDefinition[] = [
  {
    name: "health",
    title: "Health Check",
    description:
      "Check health of Thoughtbox infrastructure services (Prometheus, Grafana, Thoughtbox MCP). Optionally filter to specific services.",
    category: "infrastructure",
    inputSchema: {
      type: "object",
      properties: {
        services: {
          type: "array",
          items: { type: "string" },
          description:
            "Filter health check to specific services (default: all)",
        },
      },
    },
    example: {
      services: ["prometheus", "grafana"],
    },
  },
  {
    name: "metrics",
    title: "Query Metrics",
    description:
      "Execute an instant PromQL query against Prometheus. Returns the current value of the queried metric at a single point in time.",
    category: "metrics",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "PromQL query expression",
        },
        time: {
          type: "string",
          description:
            "Evaluation timestamp (RFC3339 or Unix). Defaults to now.",
        },
      },
      required: ["query"],
    },
    example: {
      query: "thoughtbox_thoughts_total",
    },
  },
  {
    name: "metrics_range",
    title: "Query Metrics Range",
    description:
      "Execute a range PromQL query over a time window. Returns a series of values at the specified step interval.",
    category: "metrics",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "PromQL query expression",
        },
        start: {
          type: "string",
          description: "Range start time (RFC3339 or Unix)",
        },
        end: {
          type: "string",
          description: "Range end time (RFC3339 or Unix)",
        },
        step: {
          type: "string",
          description: "Query resolution step (e.g., 15s, 1m, 5m)",
        },
      },
      required: ["query", "start", "end", "step"],
    },
    example: {
      query: "rate(thoughtbox_thoughts_total[5m])",
      start: "2026-03-23T00:00:00Z",
      end: "2026-03-23T01:00:00Z",
      step: "1m",
    },
  },
  {
    name: "sessions",
    title: "List Active Sessions",
    description:
      "List reasoning sessions with optional filtering by status (active, idle, or all) and a result limit.",
    category: "sessions",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of sessions to return",
        },
        status: {
          type: "string",
          enum: ["active", "idle", "all"],
          description:
            "Filter sessions by status (default: all)",
        },
      },
    },
    example: {
      status: "active",
      limit: 10,
    },
  },
  {
    name: "session_info",
    title: "Get Session Info",
    description:
      "Retrieve detailed information about a specific reasoning session including thought count, duration, and metadata.",
    category: "sessions",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID to inspect",
        },
      },
      required: ["sessionId"],
    },
    example: {
      sessionId: "abc-123-def-456",
    },
  },
  {
    name: "alerts",
    title: "Get Alerts",
    description:
      "Retrieve current Prometheus alerts, optionally filtered by state (firing, pending, or all).",
    category: "alerts",
    inputSchema: {
      type: "object",
      properties: {
        state: {
          type: "string",
          enum: ["firing", "pending", "all"],
          description: "Filter alerts by state (default: all)",
        },
      },
    },
    example: {
      state: "firing",
    },
  },
  {
    name: "dashboard_url",
    title: "Get Dashboard URL",
    description:
      "Generate a Grafana dashboard URL for the specified dashboard name. Defaults to the main Thoughtbox dashboard.",
    category: "infrastructure",
    inputSchema: {
      type: "object",
      properties: {
        dashboard: {
          type: "string",
          description:
            "Dashboard name (default: thoughtbox-mcp)",
        },
      },
    },
    example: {
      dashboard: "thoughtbox-mcp",
    },
  },
];

/**
 * Get operation definition by name
 */
export function getOperation(
  name: string,
): OperationDefinition | undefined {
  return OBSERVABILITY_OPERATIONS.find((op) => op.name === name);
}
