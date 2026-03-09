/**
 * Operations Catalog for Gateway Toolhost
 *
 * Defines gateway-level operations (thought, read_thoughts, get_structure,
 * cipher, deep_analysis) with their schemas, descriptions, and examples.
 */

import type { JsonSchemaType, OperationExample } from '../types/json-schema.js';

export interface OperationDefinition {
  name: string;
  title: string;
  description: string;
  category: string;
  inputSchema: JsonSchemaType;
  example?: OperationExample;
}

export const GATEWAY_OPERATIONS: OperationDefinition[] = [
  {
    name: "thought",
    title: "Record Thought",
    description:
      "Record a structured reasoning thought in the active session. Server auto-assigns thoughtNumber and totalThoughts (SIL-102). Supports branching, revisions, and session metadata.",
    category: "reasoning",
    inputSchema: {
      type: "object",
      properties: {
        thought: {
          type: "string",
          description: "The reasoning content to record",
        },
        nextThoughtNeeded: {
          type: "boolean",
          description: "Whether more thoughts are needed to complete the reasoning chain",
        },
        thoughtNumber: {
          type: "number",
          description: "Optional: thought sequence number (auto-assigned if omitted)",
        },
        totalThoughts: {
          type: "number",
          description: "Optional: estimated total thoughts (auto-assigned if omitted)",
        },
        branchId: {
          type: "string",
          description: "Branch name for parallel exploration (requires branchFromThought)",
        },
        branchFromThought: {
          type: "number",
          description: "Thought number to branch from (required when branchId is set)",
        },
        isRevision: {
          type: "boolean",
          description: "Whether this thought revises a previous thought",
        },
        revisesThought: {
          type: "number",
          description: "Thought number being revised (required when isRevision is true)",
        },
        verbose: {
          type: "boolean",
          description: "If true, return full response; if false/omitted, return minimal response (SIL-101)",
        },
        sessionTitle: {
          type: "string",
          description: "Set session title (first thought only)",
        },
        sessionTags: {
          type: "array",
          items: { type: "string" },
          description: "Set session tags (first thought only)",
        },
        critique: {
          type: "boolean",
          description: "If true, include self-critique guidance",
        },
        thoughtType: {
          type: "string",
          enum: ["reasoning", "decision_frame", "action_report", "belief_snapshot", "assumption_update", "context_snapshot", "progress"],
          description: "Required. Use 'reasoning' for general-purpose thoughts. Use 'decision_frame' before choosing between options (requires confidence + options). Use 'action_report' after external actions (requires actionResult). Use 'belief_snapshot' for state checkpoints (requires beliefs). Use 'assumption_update' when assumptions change (requires assumptionChange). Use 'context_snapshot' to record operating context (requires contextData). Use 'progress' for lightweight task status updates (requires progressData).",
        },
        confidence: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "Confidence level (required for decision_frame)",
        },
        options: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              selected: { type: "boolean" },
              reason: { type: "string" },
            },
            required: ["label", "selected"],
          },
          description: "Options considered (required for decision_frame, exactly one must be selected)",
        },
        actionResult: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            reversible: { type: "string", enum: ["yes", "no", "partial"] },
            tool: { type: "string" },
            target: { type: "string" },
            sideEffects: { type: "array", items: { type: "string" } },
          },
          required: ["success", "reversible", "tool", "target"],
          description: "Action outcome (required for action_report)",
        },
        beliefs: {
          type: "object",
          properties: {
            entities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  state: { type: "string" },
                },
                required: ["name", "state"],
              },
            },
            constraints: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
          },
          required: ["entities"],
          description: "Current beliefs (required for belief_snapshot)",
        },
        assumptionChange: {
          type: "object",
          properties: {
            text: { type: "string" },
            oldStatus: { type: "string" },
            newStatus: { type: "string", enum: ["believed", "uncertain", "refuted"] },
            trigger: { type: "string" },
            downstream: { type: "array", items: { type: "number" } },
          },
          required: ["text", "oldStatus", "newStatus"],
          description: "Assumption change (required for assumption_update)",
        },
        contextData: {
          type: "object",
          properties: {
            toolsAvailable: { type: "array", items: { type: "string" } },
            systemPromptHash: { type: "string" },
            modelId: { type: "string" },
            constraints: { type: "array", items: { type: "string" } },
            dataSourcesAccessed: { type: "array", items: { type: "string" } },
          },
          description: "Operating context (required for context_snapshot)",
        },
      },
      required: ["thought", "nextThoughtNeeded", "thoughtType"],
    },
    example: {
      thought: "The architecture uses a gateway pattern to route operations...",
      nextThoughtNeeded: true,
      sessionTitle: "Architecture Analysis",
      sessionTags: ["project:thoughtbox", "task:analysis"],
    },
  },
  {
    name: "read_thoughts",
    title: "Read Thoughts",
    description:
      "Retrieve previous thoughts from the active or specified session. Supports multiple query modes: single thought by number, last N thoughts, range, or branch filtering.",
    category: "reasoning",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session to read from (defaults to active session)",
        },
        thoughtNumber: {
          type: "number",
          description: "Get a single thought by number",
        },
        last: {
          type: "number",
          description: "Get the last N thoughts",
        },
        range: {
          type: "array",
          items: { type: "number" },
          minItems: 2,
          maxItems: 2,
          description: "Get thoughts in range [start, end] (inclusive)",
        },
        branchId: {
          type: "string",
          description: "Get all thoughts from a named branch (standalone query mode — not combinable with thoughtNumber, last, or range)",
        },
        thoughtType: {
          type: "string",
          enum: ["reasoning", "decision_frame", "action_report", "belief_snapshot", "assumption_update", "context_snapshot", "progress"],
          description: "Filter thoughts by type. Returns only thoughts matching this type.",
        },
        confidence: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "Filter by confidence level. Only applies to decision_frame thoughts. Implicitly sets thoughtType to decision_frame.",
        },
      },
    },
    example: {
      last: 5,
    },
  },
  {
    name: "get_structure",
    title: "Get Reasoning Structure",
    description:
      "Return the topology of a reasoning session without thought content. Shows main chain length, branches, fork points, and revision pairs. Useful for understanding reasoning shape before reading specific thoughts.",
    category: "reasoning",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session to analyze (defaults to active session)",
        },
      },
    },
    example: {},
  },
  {
    name: "cipher",
    title: "Load Cipher Notation",
    description:
      "Load the Thoughtbox cipher notation system for token-efficient reasoning. Must be called before thought operations. Advances stage from STAGE_1 to STAGE_2.",
    category: "initialization",
    inputSchema: {
      type: "object",
      properties: {},
    },
    example: {},
  },
  {
    name: "deep_analysis",
    title: "Deep Analysis",
    description:
      "Analyze a reasoning session for patterns, cognitive load, decision points, audit summaries, and audit manifests. Available analysis types: patterns, cognitive_load, decision_points, full, audit_summary, audit_manifest.",
    category: "analysis",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session to analyze",
        },
        analysisType: {
          type: "string",
          enum: ["patterns", "cognitive_load", "decision_points", "full", "audit_summary", "audit_manifest"],
          description: "Type of analysis to perform",
        },
        options: {
          type: "object",
          properties: {
            includeTimeline: {
              type: "boolean",
              description: "Include session timeline in results",
            },
            compareWith: {
              type: "array",
              items: { type: "string" },
              description: "Session IDs to compare with",
            },
          },
        },
      },
      required: ["sessionId", "analysisType"],
    },
    example: {
      sessionId: "abc-123-def-456",
      analysisType: "full",
      options: { includeTimeline: true },
    },
  },
];

/**
 * Get operation definition by name
 */
export function getOperation(name: string): OperationDefinition | undefined {
  return GATEWAY_OPERATIONS.find((op) => op.name === name);
}

/**
 * Get all operation names
 */
export function getOperationNames(): string[] {
  return GATEWAY_OPERATIONS.map((op) => op.name);
}

/**
 * Get operations catalog as JSON resource
 */
export function getOperationsCatalog(): string {
  return JSON.stringify(
    {
      version: "1.0.0",
      operations: GATEWAY_OPERATIONS.map((op) => ({
        name: op.name,
        title: op.title,
        description: op.description,
        category: op.category,
        inputs: op.inputSchema,
        example: op.example,
      })),
      categories: [
        {
          name: "initialization",
          description: "Stage progression and cipher loading",
        },
        {
          name: "reasoning",
          description: "Record, read, and explore thought chains",
        },
        {
          name: "analysis",
          description: "Deep analysis of reasoning sessions",
        },
      ],
    },
    null,
    2
  );
}
