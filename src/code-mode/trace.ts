/**
 * Code Mode LangSmith Instrumentation
 *
 * Fire-and-forget tracing for search and execute tools.
 * Follows the same pattern as src/evaluation/trace-listener.ts:
 * - Uses shared LangSmith client singleton
 * - Circuit breaker (5 failures → 60s cooldown)
 * - No-op if LANGSMITH_API_KEY not set
 */

import { loadLangSmithConfig } from "../evaluation/langsmith-config.js";
import { getSharedClient } from "../evaluation/client.js";
import type { CodeModeResult } from "./types.js";

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
