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

export interface ExecuteToolDeps {
  thoughtTool: ThoughtTool;
  sessionTool: SessionTool;
  knowledgeTool: KnowledgeTool;
  notebookTool: NotebookTool;
  theseusTool: TheseusTool;
  ulyssesTool: UlyssesTool;
  observabilityHandler: ObservabilityGatewayHandler;
  branchHandler: BranchHandler;
}

export const EXECUTE_TOOL = {
  name: "thoughtbox_execute",
  description: `Run JavaScript using the \`tb\` SDK to chain Thoughtbox operations in a single call.

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

interface TbContext {
  sessionId?: string;
}

function buildTbObject(deps: ExecuteToolDeps, ctx: TbContext): Record<string, unknown> {
  const { thoughtTool, sessionTool, knowledgeTool, notebookTool,
          theseusTool, ulyssesTool, observabilityHandler, branchHandler } = deps;

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
        normalizeEntityResult(unwrapToolResult(await knowledgeTool.handle({
          operation: "knowledge_create_entity", ...args,
        } as KnowledgeToolInput))),
      getEntity: async (entityId: string) =>
        normalizeEntityResult(unwrapToolResult(await knowledgeTool.handle({
          operation: "knowledge_get_entity", entity_id: entityId,
        } as KnowledgeToolInput))),
      listEntities: async (args?: Record<string, unknown>) =>
        unwrapToolResult(await knowledgeTool.handle({
          operation: "knowledge_list_entities", ...args,
        } as KnowledgeToolInput)),
      addObservation: async (args: { entity_id: string; content: string; source_session?: string; added_by?: string }) =>
        unwrapToolResult(await knowledgeTool.handle({
          operation: "knowledge_add_observation", ...args,
        } as KnowledgeToolInput)),
      createRelation: async (args: { from_id: string; to_id: string; relation_type: string; properties?: Record<string, unknown> }) =>
        unwrapToolResult(await knowledgeTool.handle({
          operation: "knowledge_create_relation", ...args,
        } as KnowledgeToolInput)),
      queryGraph: async (args: { start_entity_id: string; max_depth?: number; relation_types?: string[] }) =>
        unwrapToolResult(await knowledgeTool.handle({
          operation: "knowledge_query_graph", ...args,
        } as KnowledgeToolInput)),
      stats: async () =>
        unwrapToolResult(await knowledgeTool.handle({
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
    },

    theseus: async (input: TheseusToolInput) =>
      unwrapToolResult(await theseusTool.handle(input)),

    ulysses: async (input: UlyssesToolInput) =>
      unwrapToolResult(await ulyssesTool.handle(input)),

    observability: async (input: ObservabilityInput) =>
      unwrapToolResult(await observabilityHandler.handle(input)),

    branch: {
      spawn: async (args: Record<string, unknown>) =>
        unwrapToolResult(await branchHandler.processTool("spawn", args)),
      merge: async (args: Record<string, unknown>) =>
        unwrapToolResult(await branchHandler.processTool("merge", args)),
      list: async (args: Record<string, unknown>) =>
        unwrapToolResult(await branchHandler.processTool("list", args)),
      get: async (args: Record<string, unknown>) =>
        unwrapToolResult(await branchHandler.processTool("get", args)),
    },
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
