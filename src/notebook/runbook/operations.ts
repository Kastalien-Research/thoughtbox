/**
 * Operations catalog for the tb.runbook.* Code Mode namespace
 * (SPEC-AGX-SUBSTRATE B6 await↔claim binding + B8 pull-based advancer).
 *
 * These operations dispatch through the notebook toolhost
 * (notebook_advance / notebook_instance_status / notebook_add_cell with
 * cellType "await"); this catalog exists so thoughtbox_search surfaces them
 * under their own `runbook` namespace. Owned by flagship-b6b8.
 */

import type { OperationDefinition } from "../operations.js";

export const RUNBOOK_OPERATIONS: OperationDefinition[] = [
  {
    name: "runbook_advance",
    title: "Advance Runbook Instance",
    description:
      "Pull-based advancement of a durable runbook instance (tb.runbook.advance — " +
      "SPEC-AGX-SUBSTRATE B8, claim c4). Evaluates the next unsatisfied cell(s) in " +
      "template order: an await cell is checked against its subscribed claim's " +
      "CURRENT status (satisfied → recorded and passed; unsatisfied → the instance " +
      "parks and the cell's claim subscription is registered); an exec cell runs " +
      "through the real execution path behind a compare-and-swap reservation on " +
      "(instanceId, seq), so two concurrent advancers execute side effects exactly " +
      "once — the loser reports `in_flight` without running anything (GH #403). " +
      "There are no suspended processes, timers, or retries: nothing advances " +
      "except through this explicit call. The notebook (template id = notebook id) " +
      "must be loaded in the session for exec cells to run; awaits advance without it.",
    category: "runbook-advancement",
    inputSchema: {
      type: "object",
      properties: {
        instanceId: {
          type: "string",
          description: "Runbook instance ID (returned by notebook_start_run)",
        },
        maxCells: {
          type: "integer",
          minimum: 1,
          description: "Optional cap on exec-cell executions in this call",
        },
        force: {
          type: "boolean",
          description:
            "Skip a reservation with no matching execution record (crashed or " +
            "still-running advancer). EXPLICIT double-execute acceptance — off by default.",
        },
      },
      required: ["instanceId"],
    },
    example: { instanceId: "nbr_abc123" },
  },
  {
    name: "runbook_status",
    title: "Runbook Instance Status",
    description:
      "Read-only snapshot of a durable runbook instance: derived status " +
      "(created/in_progress/completed/failed), the next unsatisfied cell, the " +
      "awaited claim when parked at an await cell, append-only execution records, " +
      "and pending advance reservations. Callable from a fresh session with only " +
      "the instance id — the claim c5 resume entry point.",
    category: "runbook-advancement",
    inputSchema: {
      type: "object",
      properties: {
        instanceId: {
          type: "string",
          description: "Runbook instance ID",
        },
      },
      required: ["instanceId"],
    },
    example: { instanceId: "nbr_abc123" },
  },
  {
    name: "runbook_add_await_cell",
    title: "Add Await Cell",
    description:
      "Author an await cell (SPEC-AGX-SUBSTRATE B6): a claim subscription plus a " +
      "predicate over the claim's current status. The cell executes nothing; runs " +
      "halt (park) at it until the subscribed claim's status is one of `until`, " +
      "after which tb.runbook.advance executes the cells behind it. Dispatches to " +
      "notebook_add_cell with cellType \"await\".",
    category: "runbook-advancement",
    inputSchema: {
      type: "object",
      properties: {
        notebookId: { type: "string", description: "Notebook ID" },
        claimId: {
          type: "string",
          description: "Claim the cell subscribes to (tb.claims id)",
        },
        until: {
          description:
            "Claim status(es) that satisfy the cell: asserted | supported | invalidated | superseded",
          oneOf: [
            {
              type: "string",
              enum: ["asserted", "supported", "invalidated", "superseded"],
            },
            {
              type: "array",
              items: {
                type: "string",
                enum: ["asserted", "supported", "invalidated", "superseded"],
              },
              minItems: 1,
            },
          ],
        },
        position: {
          type: "integer",
          description: "Insert position (0-indexed); appends when omitted",
        },
      },
      required: ["notebookId", "claimId", "until"],
    },
    example: {
      notebookId: "abc123",
      claimId: "clm_deploy_green",
      until: ["supported"],
    },
  },
];
