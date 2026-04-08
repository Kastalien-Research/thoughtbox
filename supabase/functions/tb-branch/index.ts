/**
 * tb-branch: MCP Lite edge function for branch-scoped thought writes.
 *
 * Implements a minimal MCP JSON-RPC server over Streamable HTTP transport.
 * Reads session_id, branch_id, workspace_id, branch_from from URL query params.
 * Writes directly to the existing `thoughts` table using service_role.
 *
 * Tools: branch_thought, branch_status, branch_read
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { Hono } from "hono";
import { z } from "zod";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// --- Schemas ---

const BranchThoughtInput = z.object({
  thought: z.string(),
  thoughtType: z.string().default("reasoning"),
  nextThoughtNeeded: z.boolean(),
  confidence: z.string().nullable().optional(),
  totalThoughts: z.number().nullable().optional(),
  isRevision: z.boolean().default(false),
  revisesThought: z.number().nullable().optional(),
  needsMoreThoughts: z.boolean().nullable().optional(),
  options: z.record(z.unknown()).nullable().optional(),
  actionResult: z.record(z.unknown()).nullable().optional(),
  beliefs: z.record(z.unknown()).nullable().optional(),
  assumptionChange: z.record(z.unknown()).nullable().optional(),
  contextData: z.record(z.unknown()).nullable().optional(),
  progressData: z.record(z.unknown()).nullable().optional(),
  agentId: z.string().nullable().optional(),
  agentName: z.string().nullable().optional(),
  critique: z.string().nullable().optional(),
});

const BranchReadInput = z.object({
  limit: z.number().default(50),
  offset: z.number().default(0),
});

// --- Branch context from URL params ---

type BranchContext = {
  sessionId: string;
  branchId: string;
  workspaceId: string;
  branchFrom: number | null;
};

function parseBranchContext(url: URL): BranchContext {
  const sessionId = url.searchParams.get("session_id");
  const branchId = url.searchParams.get("branch_id");
  const workspaceId = url.searchParams.get("workspace_id");
  const branchFromRaw = url.searchParams.get("branch_from");

  if (!sessionId || !branchId || !workspaceId) {
    throw new McpError(
      -32602,
      "Missing required query params: session_id, branch_id, workspace_id",
    );
  }

  return {
    sessionId,
    branchId,
    workspaceId,
    branchFrom: branchFromRaw ? Number(branchFromRaw) : null,
  };
}

// --- Thought numbering (branch-scoped) ---

let cachedNextNumber: Map<string, number> = new Map();

function cacheKey(sessionId: string, branchId: string): string {
  return `${sessionId}::${branchId}`;
}

async function getNextThoughtNumber(
  supabase: SupabaseClient,
  sessionId: string,
  branchId: string,
): Promise<number> {
  const key = cacheKey(sessionId, branchId);
  const cached = cachedNextNumber.get(key);
  if (cached !== undefined) {
    const next = cached + 1;
    cachedNextNumber.set(key, next);
    return next;
  }

  const { data, error } = await supabase
    .from("thoughts")
    .select("thought_number")
    .eq("session_id", sessionId)
    .eq("branch_id", branchId)
    .order("thought_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new McpError(-32603, `Failed to query max thought_number: ${error.message}`);
  }

  const maxNum = data?.thought_number ?? 0;
  const next = maxNum + 1;
  cachedNextNumber.set(key, next);
  return next;
}

// --- Content hashing ---

async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// --- MCP JSON-RPC types ---

class McpError extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message);
    this.name = "McpError";
  }
}

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

// --- Tool definitions ---

const TOOLS = [
  {
    name: "branch_thought",
    description:
      "Record a thought on this branch. Thoughts are numbered sequentially within the branch.",
    inputSchema: {
      type: "object" as const,
      properties: {
        thought: { type: "string", description: "The thought content" },
        thoughtType: {
          type: "string",
          description: "Type of thought (reasoning, hypothesis, etc.)",
          default: "reasoning",
        },
        nextThoughtNeeded: {
          type: "boolean",
          description: "Whether another thought is expected after this one",
        },
        confidence: { type: "string", description: "Confidence level" },
        totalThoughts: { type: "number", description: "Expected total thoughts" },
        isRevision: { type: "boolean", default: false },
        revisesThought: { type: "number" },
        needsMoreThoughts: { type: "boolean" },
        options: { type: "object" },
        actionResult: { type: "object" },
        beliefs: { type: "object" },
        assumptionChange: { type: "object" },
        contextData: { type: "object" },
        progressData: { type: "object" },
        agentId: { type: "string" },
        agentName: { type: "string" },
        critique: { type: "string" },
      },
      required: ["thought", "nextThoughtNeeded"],
    },
  },
  {
    name: "branch_status",
    description:
      "Get the status of the current branch (thought count, context).",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "branch_read",
    description: "Read thoughts from this branch, ordered by thought number.",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", default: 50 },
        offset: { type: "number", default: 0 },
      },
    },
  },
];

// --- Tool handlers ---

async function handleBranchThought(
  supabase: SupabaseClient,
  ctx: BranchContext,
  args: Record<string, unknown>,
): Promise<unknown> {
  const input = BranchThoughtInput.parse(args);
  const thoughtNumber = await getNextThoughtNumber(
    supabase,
    ctx.sessionId,
    ctx.branchId,
  );
  const contentHash = await hashContent(input.thought);

  const row = {
    session_id: ctx.sessionId,
    workspace_id: ctx.workspaceId,
    thought_number: thoughtNumber,
    thought: input.thought,
    total_thoughts: input.totalThoughts ?? thoughtNumber,
    next_thought_needed: input.nextThoughtNeeded,
    thought_type: input.thoughtType,
    is_revision: input.isRevision,
    revises_thought: input.revisesThought ?? null,
    branch_from_thought: ctx.branchFrom,
    branch_id: ctx.branchId,
    needs_more_thoughts: input.needsMoreThoughts ?? null,
    confidence: input.confidence ?? null,
    options: input.options ?? null,
    action_result: input.actionResult ?? null,
    beliefs: input.beliefs ?? null,
    assumption_change: input.assumptionChange ?? null,
    context_data: input.contextData ?? null,
    progress_data: input.progressData ?? null,
    agent_id: input.agentId ?? null,
    agent_name: input.agentName ?? null,
    content_hash: contentHash,
    parent_hash: null,
    critique: input.critique ?? null,
  };

  const { error } = await supabase.from("thoughts").insert(row);
  if (error) {
    throw new McpError(-32603, `Insert failed: ${error.message}`);
  }

  return {
    thoughtNumber,
    branchId: ctx.branchId,
    sessionId: ctx.sessionId,
    contentHash,
  };
}

async function handleBranchStatus(
  supabase: SupabaseClient,
  ctx: BranchContext,
): Promise<unknown> {
  const { count, error } = await supabase
    .from("thoughts")
    .select("*", { count: "exact", head: true })
    .eq("session_id", ctx.sessionId)
    .eq("branch_id", ctx.branchId);

  if (error) {
    throw new McpError(-32603, `Count query failed: ${error.message}`);
  }

  return {
    branchId: ctx.branchId,
    sessionId: ctx.sessionId,
    workspaceId: ctx.workspaceId,
    thoughtCount: count ?? 0,
    branchFromThought: ctx.branchFrom,
  };
}

async function handleBranchRead(
  supabase: SupabaseClient,
  ctx: BranchContext,
  args: Record<string, unknown>,
): Promise<unknown> {
  const input = BranchReadInput.parse(args);

  const { data, error } = await supabase
    .from("thoughts")
    .select("*")
    .eq("session_id", ctx.sessionId)
    .eq("branch_id", ctx.branchId)
    .order("thought_number", { ascending: true })
    .range(input.offset, input.offset + input.limit - 1);

  if (error) {
    throw new McpError(-32603, `Read query failed: ${error.message}`);
  }

  return { thoughts: data ?? [] };
}

// --- MCP JSON-RPC dispatcher ---

async function handleRpc(
  req: JsonRpcRequest,
  supabase: SupabaseClient,
  ctx: BranchContext,
): Promise<JsonRpcResponse> {
  const id = req.id ?? null;

  try {
    switch (req.method) {
      case "initialize": {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: {
              name: "tb-branch",
              version: "0.1.0",
            },
          },
        };
      }

      case "notifications/initialized": {
        return { jsonrpc: "2.0", id, result: {} };
      }

      case "tools/list": {
        return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
      }

      case "tools/call": {
        const params = req.params ?? {};
        const toolName = params.name as string;
        const toolArgs = (params.arguments ?? {}) as Record<string, unknown>;

        let content: unknown;
        switch (toolName) {
          case "branch_thought":
            content = await handleBranchThought(supabase, ctx, toolArgs);
            break;
          case "branch_status":
            content = await handleBranchStatus(supabase, ctx);
            break;
          case "branch_read":
            content = await handleBranchRead(supabase, ctx, toolArgs);
            break;
          default:
            throw new McpError(-32601, `Unknown tool: ${toolName}`);
        }

        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              { type: "text", text: JSON.stringify(content, null, 2) },
            ],
          },
        };
      }

      default: {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Unknown method: ${req.method}` },
        };
      }
    }
  } catch (e) {
    if (e instanceof McpError) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: e.code, message: e.message },
      };
    }
    if (e instanceof z.ZodError) {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32602,
          message: "Invalid params",
          data: e.errors,
        },
      };
    }
    const msg = e instanceof Error ? e.message : String(e);
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32603, message: msg },
    };
  }
}

// --- Supabase client factory ---

function getSupabaseClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new McpError(-32603, "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// --- Hono app ---

const app = new Hono();
const mcpApp = new Hono();

mcpApp.post("/mcp", async (c) => {
  const url = new URL(c.req.url);

  let ctx: BranchContext;
  try {
    ctx = parseBranchContext(url);
  } catch (e) {
    if (e instanceof McpError) {
      return c.json(
        {
          jsonrpc: "2.0",
          id: null,
          error: { code: e.code, message: e.message },
        },
        400,
      );
    }
    throw e;
  }

  const supabase = getSupabaseClient();
  const body = await c.req.json<JsonRpcRequest>();
  const response = await handleRpc(body, supabase, ctx);
  return c.json(response);
});

mcpApp.get("/mcp", (c) => {
  return c.json({
    name: "tb-branch",
    version: "0.1.0",
    description: "Branch-scoped thought writer for Thoughtbox",
    transport: "streamable-http",
    tools: TOOLS.map((t) => t.name),
  });
});

app.route("/tb-branch", mcpApp);

export default app;
