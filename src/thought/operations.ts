/**
 * Operations Catalog for Thought Tool
 *
 * Defines the thought operation with its schema,
 * description, category, and example.
 */

import type { OperationDefinition } from "../sessions/operations.js";

export const THOUGHT_OPERATIONS: OperationDefinition[] = [
  {
    name: "thoughtbox_thought",
    title: "Record Thought",
    description:
      "Submit a structured thought to the active reasoning session. Supports branching, revision, typed metadata (decision frames, action reports, belief snapshots, assumption updates, context snapshots, progress), and multi-agent attribution.",
    category: "reasoning",
    inputSchema: {
      type: "object",
      properties: {
        thought: {
          type: "string",
          description: "Your current thinking process, insights, or analysis",
        },
        thoughtNumber: {
          type: "number",
          description:
            "Optional explicit thought number. Send 1 to restart a thought track.",
        },
        totalThoughts: {
          type: "number",
          description: "Estimated total thoughts needed",
        },
        nextThoughtNeeded: {
          type: "boolean",
          description:
            "Whether another thought is needed to complete the reasoning step",
        },
        thoughtType: {
          type: "string",
          enum: [
            "reasoning",
            "decision_frame",
            "action_report",
            "belief_snapshot",
            "assumption_update",
            "context_snapshot",
            "progress",
          ],
          description: "The structured type of this thought",
        },
        isRevision: {
          type: "boolean",
          description: "Whether this thought revises a previous one",
        },
        revisesThought: {
          type: "number",
          description: "The thought number being revised",
        },
        branchFromThought: {
          type: "number",
          description: "The thought number this branch originates from",
        },
        branchId: {
          type: "string",
          description: "A unique identifier for this new reasoning branch",
        },
        sessionTitle: {
          type: "string",
          description: "Title for a new reasoning session (for thought 1)",
        },
        sessionTags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for a new reasoning session",
        },
        confidence: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "Confidence level for decision frames",
        },
        agentId: {
          type: "string",
          description: "ID of the agent submitting this thought",
        },
        agentName: {
          type: "string",
          description: "Name of the agent submitting this thought",
        },
      },
      required: ["thought", "nextThoughtNeeded", "thoughtType"],
    },
    example: {
      thought:
        "The toolhost pattern consolidates related operations under one tool, reducing discovery overhead.",
      thoughtNumber: 1,
      totalThoughts: 5,
      nextThoughtNeeded: true,
      thoughtType: "reasoning",
      sessionTitle: "Architecture Decision: Toolhost Pattern",
      sessionTags: ["architecture", "mcp"],
    },
  },
];

/**
 * Get operation definition by name
 */
export function getOperation(
  name: string,
): OperationDefinition | undefined {
  return THOUGHT_OPERATIONS.find((op) => op.name === name);
}
