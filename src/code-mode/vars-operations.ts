/**
 * Operations catalog for tb.vars — durable named variables (RLM-lite).
 *
 * Session-scoped variable store for the Code Mode execute tool: one
 * thoughtbox_execute call can store a named JSON-serialisable value and a
 * later call in the SAME MCP session can read it back, without threading
 * data through the model's context window. In-memory, per MCP session,
 * no persistence — variables vanish when the session ends.
 *
 * Runtime lives in src/code-mode/execute-tool.ts (state on the
 * per-session ExecuteTool instance).
 */

import type { OperationDefinition } from "../sessions/operations.js";

export const VARS_OPERATIONS: OperationDefinition[] = [
  {
    name: "set",
    title: "Set Variable",
    description:
      "Store a named JSON-serialisable value that survives across thoughtbox_execute calls within the same MCP session (in-memory only; not persisted; lost when the session ends). Values are deep-copied via JSON round-trip, so non-serialisable values (functions, undefined, circular structures) are rejected with a clear error. Overwrites any existing value under the same name. Freely chainable — vars calls do not count against the one-state-mutating-operation-per-call rule.",
    category: "vars",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Variable name" },
        value: {
          description: "Any JSON-serialisable value to store",
        },
      },
      required: ["name", "value"],
    },
    example: {
      code: "await tb.vars.set('candidateSessions', sessions.map(s => s.id))",
    },
  },
  {
    name: "get",
    title: "Get Variable",
    description:
      "Read back a value stored earlier in this MCP session via tb.vars.set. Throws a clear error naming the variable if it was never set (or the session restarted) — use tb.vars.list() to see what exists.",
    category: "vars",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Variable name" },
      },
      required: ["name"],
    },
    example: {
      code: "const ids = await tb.vars.get('candidateSessions')",
    },
  },
  {
    name: "list",
    title: "List Variables",
    description:
      "List the names (and serialised sizes in bytes) of all variables stored in this MCP session.",
    category: "vars",
    inputSchema: {
      type: "object",
      properties: {},
    },
    example: {
      code: "await tb.vars.list()",
    },
  },
  {
    name: "delete",
    title: "Delete Variable",
    description:
      "Remove a stored variable. Returns { deleted: boolean } (false if the name was not set).",
    category: "vars",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Variable name" },
      },
      required: ["name"],
    },
    example: {
      code: "await tb.vars.delete('candidateSessions')",
    },
  },
];

/** Get vars operation definition by name. */
export function getVarsOperation(
  name: string,
): OperationDefinition | undefined {
  return VARS_OPERATIONS.find((op) => op.name === name);
}
