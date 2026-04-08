/**
 * Code Mode LangSmith Instrumentation
 *
 * Fire-and-forget tracing for search and execute tools.
 * Inlined LangSmith client setup (evaluation/ tree not shipped in this repo cut).
 */

import { Client } from "langsmith";
import type { CodeModeResult } from "./types.js";

type LangSmithConfig = {
  apiKey: string;
  apiUrl: string;
  project: string;
  workspaceId?: string;
};

function loadLangSmithConfig(): LangSmithConfig | null {
  const apiKey = process.env.LANGSMITH_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    apiUrl: process.env.LANGSMITH_ENDPOINT || "https://api.smith.langchain.com",
    project: process.env.LANGSMITH_PROJECT || "default",
    workspaceId: process.env.LANGSMITH_WORKSPACE_ID,
  };
}

let sharedClient: Client | null = null;
let sharedCfg: LangSmithConfig | null = null;

function getSharedClient(config: LangSmithConfig): Client {
  if (
    sharedClient &&
    sharedCfg?.apiKey === config.apiKey &&
    sharedCfg?.apiUrl === config.apiUrl
  ) {
    return sharedClient;
  }
  sharedClient = new Client({
    apiKey: config.apiKey,
    apiUrl: config.apiUrl,
  });
  sharedCfg = config;
  return sharedClient;
}

// Circuit breaker state (module-level, shared across search and execute)
let failureCount = 0;
let circuitOpenUntil = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_COOLDOWN_MS = 60_000;

function safeAsync(fn: () => Promise<unknown>): void {
  if (failureCount >= CIRCUIT_THRESHOLD) {
    if (Date.now() < circuitOpenUntil) return;
    failureCount = 0;
  }

  fn().then(() => {
    failureCount = 0;
  }).catch((err) => {
    failureCount++;
    if (failureCount >= CIRCUIT_THRESHOLD) {
      circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
      console.warn(
        `[CodeMode] LangSmith circuit breaker open after ${failureCount} failures. ` +
        `Suppressing traces for ${CIRCUIT_COOLDOWN_MS / 1000}s.`
      );
    } else {
      console.warn(
        "[CodeMode] LangSmith trace error:",
        err instanceof Error ? err.message : err,
      );
    }
  });
}

export function traceSearch(input: { code: string }, output: CodeModeResult): void {
  const config = loadLangSmithConfig();
  if (!config) return;

  const client = getSharedClient(config);
  safeAsync(() =>
    client.createRun({
      id: crypto.randomUUID(),
      name: "codemode:search",
      run_type: "retriever",
      project_name: config.project || "default",
      start_time: Date.now() - output.durationMs,
      end_time: Date.now(),
      inputs: { code: input.code },
      outputs: { result: output.result, error: output.error },
      extra: {
        metadata: {
          tags: ["thoughtbox", "codemode", "search"],
          durationMs: output.durationMs,
          truncated: output.truncated,
          hasError: !!output.error,
        },
      },
    })
  );
}

export function traceExecute(input: { code: string }, output: CodeModeResult): void {
  const config = loadLangSmithConfig();
  if (!config) return;

  const client = getSharedClient(config);
  safeAsync(() =>
    client.createRun({
      id: crypto.randomUUID(),
      name: "codemode:execute",
      run_type: "tool",
      project_name: config.project || "default",
      start_time: Date.now() - output.durationMs,
      end_time: Date.now(),
      inputs: { code: input.code },
      outputs: {
        result: output.truncated ? "[truncated]" : output.result,
        error: output.error,
      },
      extra: {
        metadata: {
          tags: ["thoughtbox", "codemode", "execute"],
          durationMs: output.durationMs,
          truncated: output.truncated,
          hasError: !!output.error,
          logCount: output.logs.length,
        },
      },
    })
  );
}

/**
 * Reset circuit breaker state. Used in tests.
 */
export function resetCircuitBreaker(): void {
  failureCount = 0;
  circuitOpenUntil = 0;
}
