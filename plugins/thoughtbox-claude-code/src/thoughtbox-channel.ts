#!/usr/bin/env node
/**
 * Thoughtbox Channel — Claude Code Channel Server
 *
 * Pushes Hub coordination events and Protocol lifecycle events into a
 * running Claude Code session via the unified /events SSE stream.
 *
 * Configuration via environment variables:
 *   THOUGHTBOX_URL           - Thoughtbox HTTP server URL (default: http://localhost:1731)
 *   THOUGHTBOX_AGENT_NAME    - Agent display name (required)
 *   THOUGHTBOX_AGENT_PROFILE - Agent profile: MANAGER|ARCHITECT|DEBUGGER|SECURITY|RESEARCHER|REVIEWER
 *   THOUGHTBOX_WORKSPACE_ID  - Workspace to join (required)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getChannelInstructions } from "./profile-instructions.js";
import { EventFilter } from "./event-filter.js";
import { EventClient } from "./event-client.js";
import { HubApiClient } from "./hub-api-client.js";
import type { ThoughtboxEvent } from "./event-types.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const THOUGHTBOX_URL = process.env.THOUGHTBOX_URL || "http://localhost:1731";
const AGENT_NAME = process.env.THOUGHTBOX_AGENT_NAME;
const AGENT_PROFILE = process.env.THOUGHTBOX_AGENT_PROFILE;
const WORKSPACE_ID = process.env.THOUGHTBOX_WORKSPACE_ID;

if (!AGENT_NAME) {
  console.error("THOUGHTBOX_AGENT_NAME is required");
  process.exit(1);
}
if (!WORKSPACE_ID) {
  console.error("THOUGHTBOX_WORKSPACE_ID is required");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// MCP Server (Channel)
// ---------------------------------------------------------------------------

const instructions = getChannelInstructions(AGENT_PROFILE);

const mcp = new Server(
  { name: "thoughtbox-channel", version: "0.1.0" },
  {
    capabilities: {
      experimental: {
        "claude/channel": {},
        "claude/channel/permission": {},
      },
      tools: {},
    },
    instructions,
  },
);

// ---------------------------------------------------------------------------
// Hub API Client (for reply tools)
// ---------------------------------------------------------------------------

const apiClient = new HubApiClient({
  baseUrl: THOUGHTBOX_URL,
  agentName: AGENT_NAME,
  agentProfile: AGENT_PROFILE,
  workspaceId: WORKSPACE_ID,
});

// ---------------------------------------------------------------------------
// Event Filter
// ---------------------------------------------------------------------------

const filter = new EventFilter({
  agentName: AGENT_NAME,
  workspaceId: WORKSPACE_ID,
});

// ---------------------------------------------------------------------------
// Format Event → Channel Notification
// ---------------------------------------------------------------------------

function formatEventContent(event: ThoughtboxEvent): string {
  const d = event.data;
  switch (event.type) {
    // Hub events
    case "workspace_created":
      return `Workspace '${d.name}' created by agent ${d.createdBy}`;
    case "problem_created":
      return `Problem '${d.title}': ${d.description ?? "(no description)"}`;
    case "problem_status_changed":
      return `Problem '${d.title}' status: ${d.previousStatus} → ${d.status}`;
    case "message_posted":
      return String(d.content ?? "");
    case "proposal_created":
      return `Proposal '${d.title}': ${d.description ?? "(no description)"}`;
    case "proposal_merged":
      return `Proposal '${d.title}' merged by ${d.mergedBy}`;
    case "consensus_marked":
      return `Consensus '${d.name}': ${d.description ?? ""}`;

    // Protocol events — Ulysses
    case "ulysses_init":
      return `Ulysses session started: ${d.problem}`;
    case "ulysses_outcome":
      return `Outcome: ${d.assessment} (S=${d.S})${Number(d.S) >= 2 ? ". REFLECT required before further mutations." : ""}`;
    case "ulysses_reflect":
      return `Reflection recorded. S reset to 0. Hypothesis: ${d.hypothesis}`;
    case "ulysses_complete":
      return `Ulysses session ${d.status}`;

    // Protocol events — Theseus
    case "theseus_init":
      return `Theseus refactoring session started. Scope: ${Array.isArray(d.scope) ? (d.scope as string[]).join(", ") : d.scope}`;
    case "theseus_visa":
      return `Visa granted for ${d.filePath}: ${d.justification}`;
    case "theseus_checkpoint":
      return `Checkpoint ${d.approved ? "approved" : "needs review"} (B=${d.B})`;
    case "theseus_outcome":
      return `Tests ${d.testsPassed ? "passed" : "failed"} (B=${d.B})`;
    case "theseus_complete":
      return `Theseus session ${d.status}`;

    default:
      return JSON.stringify(d);
  }
}

function formatEventMeta(event: ThoughtboxEvent): Record<string, string> {
  const meta: Record<string, string> = {
    event: event.type,
    source: event.source,
    workspace_id: event.workspaceId,
  };

  // High severity for actionable protocol states
  if (event.type === "ulysses_outcome" && Number(event.data.S) >= 2) {
    meta.severity = "high";
  }
  if (event.type === "theseus_outcome" && !event.data.testsPassed) {
    meta.severity = "high";
  }

  const d = event.data;
  for (const [key, val] of Object.entries(d)) {
    if (typeof val === "string" || typeof val === "number") {
      meta[key] = String(val);
    }
  }

  return meta;
}

async function pushEvent(event: ThoughtboxEvent): Promise<void> {
  if (!filter.shouldForward(event)) return;

  try {
    await mcp.notification({
      method: "notifications/claude/channel",
      params: {
        content: formatEventContent(event),
        meta: formatEventMeta(event),
      },
    });
  } catch (err) {
    console.error("[Channel] Failed to push event:", err);
  }
}

// ---------------------------------------------------------------------------
// Reply Tools
// ---------------------------------------------------------------------------

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "hub_reply",
      description: "Post a message to a problem's discussion channel",
      inputSchema: {
        type: "object" as const,
        properties: {
          workspace_id: { type: "string", description: "Workspace ID" },
          problem_id: { type: "string", description: "Problem ID to reply in" },
          content: { type: "string", description: "Message to post" },
        },
        required: ["workspace_id", "problem_id", "content"],
      },
    },
    {
      name: "hub_action",
      description: "Execute a Hub action: claim problem, update status, endorse consensus, or review proposal",
      inputSchema: {
        type: "object" as const,
        properties: {
          action: {
            type: "string",
            enum: ["claim_problem", "update_problem_status", "endorse_consensus", "review_proposal"],
            description: "Action to perform",
          },
          workspace_id: { type: "string", description: "Workspace ID" },
          target_id: { type: "string", description: "Problem, consensus, or proposal ID" },
          status: { type: "string", description: "New status (for update_problem_status)" },
          verdict: {
            type: "string",
            enum: ["approve", "request-changes", "reject"],
            description: "Review verdict (for review_proposal)",
          },
          reasoning: { type: "string", description: "Review reasoning (for review_proposal)" },
        },
        required: ["action", "workspace_id", "target_id"],
      },
    },
  ],
}));

mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const typedArgs = args as Record<string, string>;

  try {
    if (name === "hub_reply") {
      await apiClient.postMessage(typedArgs.problem_id, typedArgs.content);
      return { content: [{ type: "text" as const, text: "Message posted" }] };
    }

    if (name === "hub_action") {
      const { action, target_id } = typedArgs;

      switch (action) {
        case "claim_problem":
          await apiClient.claimProblem(target_id);
          return { content: [{ type: "text" as const, text: `Claimed problem ${target_id}` }] };
        case "update_problem_status":
          await apiClient.updateProblemStatus(target_id, typedArgs.status);
          return { content: [{ type: "text" as const, text: `Updated problem ${target_id} to ${typedArgs.status}` }] };
        case "endorse_consensus":
          await apiClient.endorseConsensus(target_id);
          return { content: [{ type: "text" as const, text: `Endorsed consensus ${target_id}` }] };
        case "review_proposal":
          await apiClient.reviewProposal(
            target_id,
            typedArgs.verdict as "approve" | "request-changes" | "reject",
            typedArgs.reasoning || "",
          );
          return { content: [{ type: "text" as const, text: `Reviewed proposal ${target_id}: ${typedArgs.verdict}` }] };
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text" as const, text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ---------------------------------------------------------------------------
// Permission Relay
// ---------------------------------------------------------------------------

const PermissionRequestSchema = z.object({
  method: z.literal("notifications/claude/channel/permission_request"),
  params: z.object({
    request_id: z.string(),
    tool_name: z.string(),
    description: z.string(),
    input_preview: z.string(),
  }),
});

mcp.setNotificationHandler(PermissionRequestSchema, async ({ params }) => {
  const content = [
    `Permission request [${params.request_id}]:`,
    `Tool: ${params.tool_name}`,
    `Action: ${params.description}`,
    "",
    `Reply "yes ${params.request_id}" or "no ${params.request_id}"`,
  ].join("\n");

  console.error(`\n[Permission Relay] ${content}\n`);

  await mcp.notification({
    method: "notifications/claude/channel",
    params: {
      content: `Waiting for permission: ${params.tool_name} — ${params.description}`,
      meta: {
        event: "permission_request",
        request_id: params.request_id,
        tool_name: params.tool_name,
      },
    },
  });
});

// ---------------------------------------------------------------------------
// SSE Event Client
// ---------------------------------------------------------------------------

const eventClient = new EventClient({
  baseUrl: THOUGHTBOX_URL,
  workspaceId: WORKSPACE_ID,
  onEvent: (event) => void pushEvent(event),
  onError: (err) => console.error("[Channel] SSE error:", err.message),
  onConnect: () => console.error("[Channel] Connected to event stream"),
});

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

async function start(): Promise<void> {
  console.error(`[Channel] Starting for '${AGENT_NAME}' (${AGENT_PROFILE || "generic"}) in workspace ${WORKSPACE_ID}`);
  console.error(`[Channel] Connecting to ${THOUGHTBOX_URL}`);

  await mcp.connect(new StdioServerTransport());
  console.error("[Channel] MCP stdio transport connected");

  try {
    const agentId = await apiClient.initialize();
    filter.setAgentId(agentId);
    console.error(`[Channel] Registered as agent ${agentId}`);
  } catch (err) {
    console.error("[Channel] Failed to register agent (will retry on first tool call):", err);
  }

  eventClient.connect().catch((err) => {
    console.error("[Channel] Failed to connect event stream:", err);
  });
}

start().catch((err) => {
  console.error("[Channel] Fatal error:", err);
  process.exit(1);
});
