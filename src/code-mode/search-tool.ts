/**
 * Code Mode Search Tool
 *
 * Accepts LLM-generated JavaScript that runs against a frozen catalog
 * of operations, prompts, and resources. The LLM has full programmatic
 * filtering power over the catalog — no need for predefined query patterns.
 */

import * as vm from "node:vm";
import { z } from "zod";
import type { SearchCatalog } from "./search-index.js";
import type { CodeModeResult } from "./types.js";
import { traceSearch } from "./trace.js";

const MAX_LOGS = 100;
const TIMEOUT_MS = 10_000;
const MAX_RESULT_BYTES = 24_000;

export const searchToolInputSchema = z.object({
  code: z.string().describe(
    "JavaScript async arrow function that receives `catalog` and returns filtered results. " +
    "Example: `async () => Object.keys(catalog.operations)` or " +
    "`async () => catalog.prompts.filter(p => p.name.includes('spec'))`"
  ),
});

export type SearchToolInput = z.infer<typeof searchToolInputSchema>;

export const SEARCH_TOOL = {
  name: "thoughtbox_search",
  description: `Discover Thoughtbox operations, prompts, and resources by writing JavaScript that queries the catalog.

The \`catalog\` object is available in scope:

interface SearchCatalog {
  operations: Record<string, Record<string, {
    title: string;
    description: string;
    category: string;
    inputSchema?: object;
  }>>;
  prompts: Array<{ name: string; description: string; args: string[] }>;
  resources: Array<{ name: string; uri: string; description: string; mimeType: string }>;
  resourceTemplates: Array<{ name: string; uriTemplate: string; description: string; mimeType: string }>;
}

Modules in catalog.operations: session, thought, knowledge, notebook, theseus, ulysses, observability
Legacy entrypoints like init and hub are intentionally absent from the Code Mode catalog.

Examples:
- List all modules: \`async () => Object.keys(catalog.operations)\`
- Find session operations: \`async () => catalog.operations.session\`
- Search by keyword: \`async () => { const q = "entity"; return Object.entries(catalog.operations).flatMap(([mod, ops]) => Object.entries(ops).filter(([_, op]) => op.description.toLowerCase().includes(q)).map(([name, op]) => ({ module: mod, name, title: op.title }))) }\`
- Find prompts: \`async () => catalog.prompts.filter(p => p.name.includes('spec'))\`
- List resources: \`async () => catalog.resources.map(r => ({ name: r.name, uri: r.uri }))\``,
  inputSchema: searchToolInputSchema,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export class SearchTool {
  private catalog: SearchCatalog;

  constructor(catalog: SearchCatalog) {
    this.catalog = catalog;
  }

  async handle(input: SearchToolInput): Promise<{ content: Array<{ type: "text"; text: string }> }> {
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

    // Build the catalog inside the VM so async evaluation uses the context's
    // own intrinsics instead of host constructors. This mirrors the safer
    // execute-tool approach and avoids deployment-only hangs from cross-realm
    // Promise/builtin interactions.
    const context = vm.createContext({
      __catalogJson: JSON.stringify(this.catalog),
      console: cappedConsole,
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
    });

    let output: CodeModeResult;
    try {
      const script = new vm.Script(`
        const catalog = Object.freeze(JSON.parse(__catalogJson));
        (${input.code})()
      `, {
        filename: "codemode-search.js",
      });
      const rawResult = script.runInContext(context, { timeout: TIMEOUT_MS });
      const result = await Promise.race([
        rawResult,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Search execution timed out")), TIMEOUT_MS)
        ),
      ]);

      const durationMs = Date.now() - start;
      let serialized = JSON.stringify(result, null, 2);
      let truncated = false;
      if (serialized && serialized.length > MAX_RESULT_BYTES) {
        serialized = serialized.slice(0, MAX_RESULT_BYTES) + "\n... [truncated]";
        truncated = true;
      }

      output = {
        result: truncated ? serialized : JSON.parse(serialized ?? "null"),
        logs,
        truncated: truncated || undefined,
        durationMs,
      };
    } catch (err) {
      output = {
        result: null,
        logs,
        error: typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : String(err),
        durationMs: Date.now() - start,
      };
    }

    traceSearch({ code: input.code }, output);

    return {
      content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
    };
  }
}
