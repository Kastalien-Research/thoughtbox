/**
 * Code Mode Execute Tool
 *
 * Accepts LLM-generated JavaScript that chains Thoughtbox operations
 * via the `tb` SDK object. Runs in a node:vm sandbox with only
 * the tb namespace, console, and standard builtins available.
 */

import * as vm from "node:vm";
import { z } from "zod";
import type { CodeModeResult } from "./types.js";
import { TB_SDK_TYPES } from "./sdk-types.js";
import { traceExecute } from "./trace.js";

import type { ThoughtTool, ThoughtToolInput } from "../thought/tool.js";
import type { SessionTool, SessionToolInput } from "../sessions/tool.js";
import type { KnowledgeTool, KnowledgeToolInput } from "../knowledge/tool.js";
import type { NotebookTool, NotebookToolInput } from "../notebook/tool.js";
import type { TheseusTool, TheseusToolInput } from "../protocol/theseus-tool.js";
import type { UlyssesTool, UlyssesToolInput } from "../protocol/ulysses-tool.js";
import type { ObservabilityGatewayHandler, ObservabilityInput } from "../observability/gateway-handler.js";
import type { BranchHandler } from "../branch/index.js";
import type { HubToolResult } from "../hub/hub-tool-handler.js";
import type { ClaimsToolResult } from "../claims/claims-tool-handler.js";
import type { MergeToolResult } from "../merge/merge-tool-handler.js";

const MAX_LOGS = 100;
const TIMEOUT_MS = 30_000;
const MAX_RESULT_BYTES = 24_000;

export const executeToolInputSchema = z.object({
  code: z.string().describe(
    "JavaScript async arrow function using the `tb` SDK. " +
    "Example: `async () => { const s = await tb.session.list(); return s; }`"
  ),
});

export type ExecuteToolInput = z.infer<typeof executeToolInputSchema>;

/**
 * Session-bound hub dispatch surface. The server factory wraps the
 * session's HubToolHandler (which holds the register-once identity
 * registry) with the MCP session key, so tb.hub callers get an implicit
 * agentId after their first register/quick_join. agentId remains
 * overridable per call for multi-agent flows within one session.
 */
export interface HubDispatcher {
  handle(input: { operation: string; [key: string]: unknown }): Promise<HubToolResult>;
}

/**
 * Session-bound claims dispatch surface (SPEC-AGX-SUBSTRATE B2). Same
 * shape as HubDispatcher; identity rides the session registry shared with
 * the hub handler, so tb.claims mutations get an implicit agentId after
 * the first tb.hub.register/quick_join. agentId remains overridable per
 * call for multi-agent flows within one session.
 */
export interface ClaimsDispatcher {
  handle(input: { operation: string; [key: string]: unknown }): Promise<ClaimsToolResult>;
}

// --- tb.merge (SPEC-MERGE-CORE) — owned by merge-core -------------------

/**
 * Session-bound merge dispatch surface (SPEC-MERGE-CORE c9). Same
 * shape as HubDispatcher/ClaimsDispatcher; identity rides the session
 * registry shared with the hub handler, so tb.merge.request gets an
 * implicit agentId after the first tb.hub.register/quick_join. Approval
 * is deliberately NOT reachable from this surface (human-only, spec c4).
 */
export interface MergeDispatcher {
  handle(input: { operation: string; [key: string]: unknown }): Promise<MergeToolResult>;
}

// --- end tb.merge ------------------------------------------------------------

export interface ExecuteToolDeps {
  thoughtTool: ThoughtTool;
  sessionTool: SessionTool;
  /**
   * Undefined when knowledge storage failed to initialize at server creation.
   * `tb.knowledge.*` then returns a clean error (carrying
   * `knowledgeUnavailableReason`) instead of crashing.
   */
  knowledgeTool?: KnowledgeTool;
  /** Captured knowledge storage init failure, surfaced in the tb.knowledge.* error. */
  knowledgeUnavailableReason?: string;
  notebookTool: NotebookTool;
  theseusTool: TheseusTool;
  ulyssesTool: UlyssesTool;
  observabilityHandler: ObservabilityGatewayHandler;
  /**
   * Hosted-mode only. The branch toolhost spawns Supabase Edge Function
   * workers and requires Supabase credentials, so it is left undefined in
   * local/self-hosted mode. `tb.branch.*` then returns a clear error instead
   * of crashing session setup.
   */
  branchHandler?: BranchHandler;
  /**
   * Per-session dispatcher over the process-shared hub storage. Undefined
   * when no hub storage was wired at server creation; `tb.hub.*` then
   * returns a clear error instead of crashing.
   */
  hubDispatcher?: HubDispatcher;
  /**
   * Per-session dispatcher over the process-shared claim storage
   * (SPEC-AGX-SUBSTRATE B2). Undefined when no claim storage was wired at
   * server creation; `tb.claims.*` then returns a clear error instead of
   * crashing.
   */
  claimsDispatcher?: ClaimsDispatcher;
  // --- tb.merge (SPEC-MERGE-CORE) — owned by merge-core -----------------
  /**
   * Per-session dispatcher over the process-shared merge-commit storage
   * (SPEC-MERGE-CORE c9). Undefined when no merge storage was wired at
   * server creation; `tb.merge.*` then returns a clear error instead of
   * crashing.
   */
  mergeDispatcher?: MergeDispatcher;
  // --- end tb.merge ----------------------------------------------------------
}

export const EXECUTE_TOOL = {
  name: "thoughtbox_execute",
  description: `Run JavaScript using the \`tb\` SDK to chain Thoughtbox operations in a single call.

**One state-mutating operation per call.** Submit only one \`tb.thought()\`, \`tb.ulysses()\`, \`tb.theseus()\`, hub-mutating call (\`tb.hub.register()\`, \`tb.hub.createWorkspace()\`, \`tb.hub.createProblem()\`, \`tb.hub.mergeProposal()\`, etc.), claims-mutating call (\`tb.claims.assert()\`, \`tb.claims.invalidate()\`, \`tb.claims.supersede()\`, etc.), or merge-mutating call (\`tb.merge.request()\`) per \`thoughtbox_execute\` invocation. Each response contains guidance (patterns, session state, protocol state) that should inform your next operation. Batching multiple state-mutating calls bypasses this feedback loop and produces lower-quality reasoning. Read-only operations (\`tb.session.*\`, \`tb.knowledge.*\`, \`tb.observability()\`, \`tb.branch.*\`, \`tb.hub.whoami()\`, \`tb.hub.listWorkspaces()\`, \`tb.hub.readChannel()\`, \`tb.claims.query()\`, \`tb.claims.affected()\`, \`tb.merge.status()\`, \`tb.merge.list()\`, \`tb.merge.claimDiff()\`, etc.) may be freely chained.

${TB_SDK_TYPES}

Example:
\`\`\`js
async () => {
  const sessions = await tb.session.list();
  await tb.thought({
    thought: "Analyzing prior sessions",
    thoughtType: "reasoning",
    nextThoughtNeeded: true,
  });
  return sessions;
}
\`\`\`

Use \`console.log()\` for debugging — output captured in response logs.
All tb methods return their result directly (already parsed from the tool response).`,
  inputSchema: executeToolInputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

/**
 * Extract the result value from a tool handler response.
 * Tool handlers return { content: [{ type: "text", text: "..." }] }.
 * We parse the JSON text and return the value directly.
 */
function unwrapToolResult(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = raw as Record<string, unknown>;
  if (obj.isError) {
    const text = (obj.content as Array<{ text: string }>)?.[0]?.text;
    throw new Error(text ?? "Tool execution failed");
  }
  const content = obj.content as Array<{ type: string; text: string }> | undefined;
  if (!content?.[0]?.text) return raw;
  try {
    return JSON.parse(content[0].text);
  } catch {
    return content[0].text;
  }
}

/**
 * Flatten notebook handler responses.
 * Handlers return { success, notebook/cell/cells/content/execution: ... }.
 * SDK consumers expect the inner value directly with `id` at top level.
 */
function flattenNotebookResult(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = raw as Record<string, unknown>;
  if (obj.notebook && typeof obj.notebook === "object") {
    return obj.notebook;
  }
  if (obj.cell && typeof obj.cell === "object") {
    return obj.cell;
  }
  return raw;
}

/**
 * Normalize knowledge entity responses so `id` is always present.
 * Handlers return `entity_id`; SDK consumers expect `id`.
 */
function normalizeEntityResult(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = raw as Record<string, unknown>;
  if (obj.entity_id && !obj.id) {
    return { id: obj.entity_id, ...obj };
  }
  return raw;
}

/**
 * Extract the result value from a hub dispatcher response.
 * HubToolHandler returns { content: [text, resource?], isError? } where the
 * text block carries either the operation result or { error } as JSON.
 */
function unwrapHubResult(raw: HubToolResult): unknown {
  const textBlock = raw.content.find(
    (block): block is { type: "text"; text: string } => block.type === "text",
  );
  let parsed: unknown = textBlock?.text;
  if (textBlock?.text) {
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      parsed = textBlock.text;
    }
  }
  if (raw.isError) {
    const message = (parsed as { error?: string } | null)?.error;
    throw new Error(message ?? "Hub operation failed");
  }
  return parsed;
}

/**
 * tb.hub method names mapped to hub operation names
 * (canonical list: src/hub/operations.ts).
 */
const HUB_SDK_METHODS: Record<string, string> = {
  register: "register",
  quickJoin: "quick_join",
  listWorkspaces: "list_workspaces",
  whoami: "whoami",
  createWorkspace: "create_workspace",
  joinWorkspace: "join_workspace",
  getProfilePrompt: "get_profile_prompt",
  createProblem: "create_problem",
  claimProblem: "claim_problem",
  updateProblem: "update_problem",
  listProblems: "list_problems",
  addDependency: "add_dependency",
  removeDependency: "remove_dependency",
  readyProblems: "ready_problems",
  blockedProblems: "blocked_problems",
  createSubProblem: "create_sub_problem",
  createProposal: "create_proposal",
  reviewProposal: "review_proposal",
  mergeProposal: "merge_proposal",
  listProposals: "list_proposals",
  markConsensus: "mark_consensus",
  endorseConsensus: "endorse_consensus",
  listConsensus: "list_consensus",
  postMessage: "post_message",
  readChannel: "read_channel",
  postSystemMessage: "post_system_message",
  workspaceStatus: "workspace_status",
  workspaceDigest: "workspace_digest",
};

/**
 * tb.claims method names mapped to claims operation names
 * (canonical list: src/claims/operations.ts).
 */
const CLAIMS_SDK_METHODS: Record<string, string> = {
  assert: "assert",
  support: "support",
  invalidate: "invalidate",
  supersede: "supersede",
  link: "link",
  subscribe: "subscribe",
  unsubscribe: "unsubscribe",
  query: "query",
  verify: "verify",
  changedSince: "changed_since",
  affected: "affected",
};

// --- tb.merge (SPEC-MERGE-CORE) — owned by merge-core -------------------

/**
 * tb.merge method names mapped to merge operation names
 * (canonical list: src/merge/operations.ts). No approve method exists:
 * approval is human-only via the apps/web route (spec c4).
 */
const MERGE_SDK_METHODS: Record<string, string> = {
  request: "request",
  status: "status",
  list: "list",
  claimDiff: "claim_diff",
};

// --- end tb.merge ------------------------------------------------------------

interface TbContext {
  sessionId?: string;
}

function buildTbObject(deps: ExecuteToolDeps, ctx: TbContext): Record<string, unknown> {
  const { thoughtTool, sessionTool, knowledgeTool, notebookTool,
          theseusTool, ulyssesTool, observabilityHandler, branchHandler,
          hubDispatcher, claimsDispatcher, mergeDispatcher } = deps;

  const requireKnowledgeTool = (): KnowledgeTool => {
    if (!knowledgeTool) {
      throw new Error(
        `knowledge unavailable: ${deps.knowledgeUnavailableReason ?? "knowledge storage failed to initialize"}`,
      );
    }
    return knowledgeTool;
  };

  const requireBranchHandler = (): BranchHandler => {
    if (!branchHandler) {
      throw new Error(
        "Branch operations require hosted mode. The branch toolhost spawns " +
          "Supabase Edge Function workers and needs SUPABASE_URL and " +
          "SUPABASE_SERVICE_ROLE_KEY; it is unavailable in local/self-hosted mode.",
      );
    }
    return branchHandler;
  };

  const requireHubDispatcher = (): HubDispatcher => {
    if (!hubDispatcher) {
      throw new Error(
        "Hub operations are unavailable: no hub storage was wired into this " +
          "server instance. tb.hub.* requires the server to be started with " +
          "hub storage (see createMcpServer's hubStorage argument).",
      );
    }
    return hubDispatcher;
  };

  const hub: Record<string, (args?: Record<string, unknown>) => Promise<unknown>> = {};
  for (const [method, operation] of Object.entries(HUB_SDK_METHODS)) {
    hub[method] = async (hubArgs: Record<string, unknown> = {}) =>
      unwrapHubResult(await requireHubDispatcher().handle({ operation, ...hubArgs }));
  }

  const requireClaimsDispatcher = (): ClaimsDispatcher => {
    if (!claimsDispatcher) {
      throw new Error(
        "Claims operations are unavailable: no claim storage was wired into " +
          "this server instance. tb.claims.* requires the server to be started " +
          "with claim storage (see createMcpServer's claimStorage argument).",
      );
    }
    return claimsDispatcher;
  };

  const claims: Record<string, (args?: Record<string, unknown>) => Promise<unknown>> = {};
  for (const [method, operation] of Object.entries(CLAIMS_SDK_METHODS)) {
    claims[method] = async (claimsArgs: Record<string, unknown> = {}) =>
      unwrapHubResult(await requireClaimsDispatcher().handle({ operation, ...claimsArgs }));
  }

  // --- tb.merge (SPEC-MERGE-CORE) — owned by merge-core -----------------
  const requireMergeDispatcher = (): MergeDispatcher => {
    if (!mergeDispatcher) {
      throw new Error(
        "Merge operations are unavailable: no merge-commit storage was wired " +
          "into this server instance. tb.merge.* requires the server to be " +
          "started with merge storage (see createMcpServer's mergeStorage argument).",
      );
    }
    return mergeDispatcher;
  };

  const merge: Record<string, (args?: Record<string, unknown>) => Promise<unknown>> = {};
  for (const [method, operation] of Object.entries(MERGE_SDK_METHODS)) {
    merge[method] = async (mergeArgs: Record<string, unknown> = {}) =>
      unwrapHubResult(await requireMergeDispatcher().handle({ operation, ...mergeArgs }));
  }
  // --- end tb.merge ----------------------------------------------------------

  return {
    thought: async (input: ThoughtToolInput) => {
      const result = unwrapToolResult(await thoughtTool.handle(input));
      const r = result as Record<string, unknown> | null;
      if (r?.sessionId && typeof r.sessionId === 'string') {
        ctx.sessionId = r.sessionId;
      }
      if (r?.closedSessionId && typeof r.closedSessionId === 'string') {
        ctx.sessionId = r.closedSessionId;
      }
      return result;
    },

    session: {
      list: async (args?: { limit?: number; offset?: number; tags?: string[] }) =>
        unwrapToolResult(await sessionTool.handle({ operation: "session_list", ...args })),
      get: async (sessionId: string) =>
        unwrapToolResult(await sessionTool.handle({ operation: "session_get", sessionId })),
      search: async (query: string, limit?: number) =>
        unwrapToolResult(await sessionTool.handle({ operation: "session_search", query, limit })),
      resume: async (sessionId: string) =>
        unwrapToolResult(await sessionTool.handle({ operation: "session_resume", sessionId })),
      export: async (sessionId: string, format?: "markdown" | "cipher" | "json") =>
        unwrapToolResult(await sessionTool.handle({ operation: "session_export", sessionId, format })),
      analyze: async (sessionId: string) =>
        unwrapToolResult(await sessionTool.handle({ operation: "session_analyze", sessionId })),
      extractLearnings: async (sessionId: string, args?: Record<string, unknown>) =>
        unwrapToolResult(await sessionTool.handle({
          operation: "session_extract_learnings", sessionId, ...args,
        } as SessionToolInput)),
    },

    knowledge: {
      createEntity: async (args: Record<string, unknown>) =>
        normalizeEntityResult(unwrapToolResult(await requireKnowledgeTool().handle({
          operation: "knowledge_create_entity", ...args,
        } as KnowledgeToolInput))),
      getEntity: async (entityId: string) =>
        normalizeEntityResult(unwrapToolResult(await requireKnowledgeTool().handle({
          operation: "knowledge_get_entity", entity_id: entityId,
        } as KnowledgeToolInput))),
      listEntities: async (args?: Record<string, unknown>) =>
        unwrapToolResult(await requireKnowledgeTool().handle({
          operation: "knowledge_list_entities", ...args,
        } as KnowledgeToolInput)),
      addObservation: async (args: { entity_id: string; content: string; source_session?: string; added_by?: string }) =>
        unwrapToolResult(await requireKnowledgeTool().handle({
          operation: "knowledge_add_observation", ...args,
        } as KnowledgeToolInput)),
      createRelation: async (args: { from_id: string; to_id: string; relation_type: string; properties?: Record<string, unknown> }) =>
        unwrapToolResult(await requireKnowledgeTool().handle({
          operation: "knowledge_create_relation", ...args,
        } as KnowledgeToolInput)),
      queryGraph: async (args: { start_entity_id: string; max_depth?: number; relation_types?: string[] }) =>
        unwrapToolResult(await requireKnowledgeTool().handle({
          operation: "knowledge_query_graph", ...args,
        } as KnowledgeToolInput)),
      stats: async () =>
        unwrapToolResult(await requireKnowledgeTool().handle({
          operation: "knowledge_stats",
        } as KnowledgeToolInput)),
    },

    notebook: {
      create: async (args: Record<string, unknown>) =>
        flattenNotebookResult(unwrapToolResult(await notebookTool.handle({
          operation: "notebook_create", ...args,
        } as NotebookToolInput))),
      list: async () =>
        unwrapToolResult(await notebookTool.handle({
          operation: "notebook_list",
        } as NotebookToolInput)),
      load: async (args: Record<string, unknown>) =>
        flattenNotebookResult(unwrapToolResult(await notebookTool.handle({
          operation: "notebook_load", ...args,
        } as NotebookToolInput))),
      addCell: async (args: Record<string, unknown>) =>
        flattenNotebookResult(unwrapToolResult(await notebookTool.handle({
          operation: "notebook_add_cell", ...args,
        } as NotebookToolInput))),
      updateCell: async (args: Record<string, unknown>) =>
        flattenNotebookResult(unwrapToolResult(await notebookTool.handle({
          operation: "notebook_update_cell", ...args,
        } as NotebookToolInput))),
      runCell: async (args: Record<string, unknown>) =>
        unwrapToolResult(await notebookTool.handle({
          operation: "notebook_run_cell", ...args,
        } as NotebookToolInput)),
      listCells: async (args: Record<string, unknown>) =>
        unwrapToolResult(await notebookTool.handle({
          operation: "notebook_list_cells", ...args,
        } as NotebookToolInput)),
      getCell: async (args: Record<string, unknown>) =>
        unwrapToolResult(await notebookTool.handle({
          operation: "notebook_get_cell", ...args,
        } as NotebookToolInput)),
      installDeps: async (args: Record<string, unknown>) =>
        unwrapToolResult(await notebookTool.handle({
          operation: "notebook_install_deps", ...args,
        } as NotebookToolInput)),
      export: async (args: Record<string, unknown>) =>
        unwrapToolResult(await notebookTool.handle({
          operation: "notebook_export", ...args,
        } as NotebookToolInput)),
      validate: async (args: Record<string, unknown>) =>
        unwrapToolResult(await notebookTool.handle({
          operation: "notebook_validate", ...args,
        } as NotebookToolInput)),
      persist: async (args: Record<string, unknown>) =>
        unwrapToolResult(await notebookTool.handle({
          operation: "notebook_persist", ...args,
        } as NotebookToolInput)),
      startRun: async (args: Record<string, unknown>) =>
        unwrapToolResult(await notebookTool.handle({
          operation: "notebook_start_run", ...args,
        } as NotebookToolInput)),
      getRun: async (args: Record<string, unknown>) =>
        unwrapToolResult(await notebookTool.handle({
          operation: "notebook_get_run", ...args,
        } as NotebookToolInput)),
      listRuns: async (args: Record<string, unknown> = {}) =>
        unwrapToolResult(await notebookTool.handle({
          operation: "notebook_list_runs", ...args,
        } as NotebookToolInput)),
      cancelRun: async (args: Record<string, unknown>) =>
        unwrapToolResult(await notebookTool.handle({
          operation: "notebook_cancel_run", ...args,
        } as NotebookToolInput)),
      getArtifact: async (args: Record<string, unknown>) =>
        unwrapToolResult(await notebookTool.handle({
          operation: "notebook_get_artifact", ...args,
        } as NotebookToolInput)),
    },

    theseus: async (input: TheseusToolInput) =>
      unwrapToolResult(await theseusTool.handle(input)),

    ulysses: async (input: UlyssesToolInput) =>
      unwrapToolResult(await ulyssesTool.handle(input)),

    observability: async (input: ObservabilityInput) =>
      unwrapToolResult(await observabilityHandler.handle(input)),

    branch: {
      spawn: async (args: Record<string, unknown>) =>
        unwrapToolResult(await requireBranchHandler().processTool("spawn", args)),
      merge: async (args: Record<string, unknown>) =>
        unwrapToolResult(await requireBranchHandler().processTool("merge", args)),
      list: async (args: Record<string, unknown>) =>
        unwrapToolResult(await requireBranchHandler().processTool("list", args)),
      get: async (args: Record<string, unknown>) =>
        unwrapToolResult(await requireBranchHandler().processTool("get", args)),
    },

    hub,

    claims,

    // --- tb.merge (SPEC-MERGE-CORE) — owned by merge-core ---------------
    merge,
    // --- end tb.merge --------------------------------------------------------
  };
}

export class ExecuteTool {
  private deps: ExecuteToolDeps;

  constructor(deps: ExecuteToolDeps) {
    this.deps = deps;
  }

  async handle(input: ExecuteToolInput): Promise<{ content: Array<{ type: "text"; text: string }> }> {
    const start = Date.now();
    const logs: string[] = [];

    const cappedConsole = {
      log: (...args: unknown[]) => {
        if (logs.length < MAX_LOGS) logs.push(args.map(String).join(" "));
      },
      warn: (...args: unknown[]) => {
        if (logs.length < MAX_LOGS) logs.push(`[warn] ${args.map(String).join(" ")}`);
      },
      error: (...args: unknown[]) => {
        if (logs.length < MAX_LOGS) logs.push(`[error] ${args.map(String).join(" ")}`);
      },
    };

    const tbCtx: TbContext = {};
    const tb = buildTbObject(this.deps, tbCtx);

    // Security: pass only bridged objects, NOT host builtins.
    // vm.createContext auto-provides context-local copies of Object,
    // Array, Promise, etc. whose prototype chains are isolated from host.
    // This closes [].constructor.constructor("return process")() escapes.
    //
    // THREAT MODEL: tb methods are host closures so
    // tb.session.list.constructor is still host Function. node:vm is not
    // a security boundary (https://nodejs.org/api/vm.html). The sandbox
    // is defense-in-depth: code is LLM-generated from system-controlled
    // prompts, not arbitrary user input. For true isolation, migrate to
    // isolated-vm.
    const context = vm.createContext({
      tb,
      console: cappedConsole,
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
    });

    let output: CodeModeResult;
    try {
      // Serialize the result inside the vm to avoid cross-realm object
      // issues where host JSON.stringify can silently return undefined
      // for complex objects created inside the sandbox.
      const script = new vm.Script(`
        Promise.resolve((${input.code})()).then(
          r => JSON.stringify(r),
          e => { throw e; }
        )
      `, {
        filename: "codemode-exec.js",
      });

      // vm.Script timeout only covers synchronous execution.
      // Promise.race adds a wall-clock timeout for async operations.
      const rawResult = script.runInContext(context, { timeout: TIMEOUT_MS });
      const serialized: string = await Promise.race([
        rawResult,
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("Execution timed out")), TIMEOUT_MS)
        ),
      ]) as string;

      const durationMs = Date.now() - start;
      let resultJson = serialized ?? "null";
      let truncated = false;
      if (resultJson.length > MAX_RESULT_BYTES) {
        resultJson = resultJson.slice(0, MAX_RESULT_BYTES) + "\n... [truncated]";
        truncated = true;
      }

      output = {
        result: truncated ? resultJson : JSON.parse(resultJson),
        logs,
        truncated: truncated || undefined,
        durationMs,
      };
    } catch (err) {
      output = {
        result: null,
        logs,
        error: (err as { message?: string }).message ?? String(err),
        durationMs: Date.now() - start,
      };
    }

    if (tbCtx.sessionId) {
      output.sessionId = tbCtx.sessionId;
    }

    traceExecute({ code: input.code }, output);

    return {
      content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
    };
  }
}
