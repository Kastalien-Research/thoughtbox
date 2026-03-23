#!/usr/bin/env node
/**
 * Thoughtbox Hub Channel — Claude Code Channel Server
 *
 * A Claude Code Channel that pushes Hub events into a running session
 * so agents can react to coordination state changes in real time.
 *
 * Spawned as a stdio subprocess by Claude Code.
 * Connects to the Thoughtbox HTTP server via SSE for event streaming
 * and HTTP for reply tool operations.
 *
 * Configuration via environment variables:
 *   THOUGHTBOX_URL          - Thoughtbox HTTP server URL (default: http://localhost:1731)
 *   THOUGHTBOX_AGENT_NAME   - Agent display name (required)
 *   THOUGHTBOX_AGENT_PROFILE - Agent profile: MANAGER|ARCHITECT|DEBUGGER|SECURITY|RESEARCHER|REVIEWER
 *   THOUGHTBOX_WORKSPACE_ID - Workspace to join (required)
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
import { HubEventClient } from "./hub-event-client.js";
import { HubApiClient } from "./hub-api-client.js";
import type { HubEvent } from "../hub/hub-handler.js";

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
// Channel Instructions (profile-specific)
// ---------------------------------------------------------------------------

const instructions = getChannelInstructions(AGENT_PROFILE);

// ---------------------------------------------------------------------------
// MCP Server (Channel)
// ---------------------------------------------------------------------------

const mcp = new Server(
  { name: "thoughtbox-hub", version: "0.1.0" },
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
// Format Hub Event → Channel Notification
// ---------------------------------------------------------------------------

function formatEventContent(event: HubEvent): string {
  const d = event.data;
  switch (event.type) {
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
    default:
      return JSON.stringify(d);
  }
}

function formatEventMeta(event: HubEvent): Record<string, string> {
  const meta: Record<string, string> = {
    event: event.type,
    workspace_id: event.workspaceId,
  };

  const d = event.data;
  // Add type-specific meta keys (only string values; Channel meta must be Record<string, string>)
  for (const [key, val] of Object.entries(d)) {
    if (typeof val === "string" || typeof val === "number") {
      meta[key] = String(val);
    }
  }

  return meta;
}

async function pushEvent(event: HubEvent): Promise<void> {
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
    console.error("[Hub Channel] Failed to push event:", err);
  }
}

// ---------------------------------------------------------------------------
// Reply Tools
// ---------------------------------------------------------------------------

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "hub_reply",
      description: "Post a message to a problem's discussion channel in the Hub",
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
      description: "Execute a quick Hub action: claim a problem, update status, endorse consensus, or review a proposal",
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

const PERMISSION_REPLY_RE = /^\s*(y|yes|n|no)\s+([a-km-z]{5})\s*$/i;

// Track pending permission requests so we can match verdict replies
const pendingPermissions = new Map<string, string>();  // request_id → problem_id

mcp.setNotificationHandler(PermissionRequestSchema, async ({ params }) => {
  // Post the permission request to the Hub as a message
  // Use a well-known problem ID for approvals, or post to the workspace's first problem
  const content = [
    `Permission request [${params.request_id}]:`,
    `Tool: ${params.tool_name}`,
    `Action: ${params.description}`,
    "",
    `Reply "yes ${params.request_id}" or "no ${params.request_id}"`,
  ].join("\n");

  // Post to hub — we'd need a designated approval channel/problem.
  // For MVP, log to stderr (the human sees it in their terminal).
  console.error(`\n[Permission Relay] ${content}\n`);

  // Also push as a channel notification so the agent knows it's waiting
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

const eventClient = new HubEventClient({
  baseUrl: THOUGHTBOX_URL,
  workspaceId: WORKSPACE_ID,
  onEvent: (event) => void pushEvent(event),
  onError: (err) => console.error("[Hub Channel] SSE error:", err.message),
  onConnect: () => console.error("[Hub Channel] Connected to Hub event stream"),
});

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

async function start(): Promise<void> {
  console.error(`[Hub Channel] Starting for agent '${AGENT_NAME}' (${AGENT_PROFILE || "generic"}) in workspace ${WORKSPACE_ID}`);
  console.error(`[Hub Channel] Connecting to ${THOUGHTBOX_URL}`);

  // Connect stdio transport to Claude Code
  await mcp.connect(new StdioServerTransport());
  console.error("[Hub Channel] MCP stdio transport connected");

  // Register agent and join workspace via API
  try {
    const agentId = await apiClient.initialize();
    filter.setAgentId(agentId);
    console.error(`[Hub Channel] Registered as agent ${agentId}`);
  } catch (err) {
    console.error("[Hub Channel] Failed to register agent (will retry on first tool call):", err);
  }

  // Start SSE event stream
  eventClient.connect().catch((err) => {
    console.error("[Hub Channel] Failed to connect event stream:", err);
  });
}

start().catch((err) => {
  console.error("[Hub Channel] Fatal error:", err);
  process.exit(1);
});
