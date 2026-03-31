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
      "Check health of Thoughtbox infrastructure services (Thoughtbox server, Supabase OTEL store). Optionally filter to specific services.",
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
      services: ["thoughtbox", "supabase"],
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
    name: "session_timeline",
    title: "Session Timeline",
    description:
      "Retrieve the chronological timeline of OTEL events (tool calls, API requests, errors) for a Claude Code session. Events are ordered by timestamp.",
    category: "otel",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The Claude Code session ID to query",
        },
        limit: {
          type: "number",
          description: "Maximum number of events to return (default: 200)",
        },
      },
      required: ["sessionId"],
    },
    example: {
      sessionId: "abc-123-def-456",
      limit: 100,
    },
  },
  {
    name: "session_cost",
    title: "Session Cost",
    description:
      "Get aggregated API cost data for a Claude Code session, broken down by model. If no sessionId is provided, returns costs across all sessions.",
    category: "otel",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Optional session ID to scope cost query",
        },
      },
    },
    example: {
      sessionId: "abc-123-def-456",
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
