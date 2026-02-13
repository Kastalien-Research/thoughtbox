/**
 * Shared LangSmith Client Factory
 * SPEC: SPEC-EVAL-001
 *
 * Single source of truth for LangSmith Client instances.
 * All evaluation layers (trace-listener, dataset-manager, experiment-runner)
 * share one Client instance to avoid duplicate connections.
 */

import { Client } from "langsmith";
import type { LangSmithConfig } from "./types.js";

let sharedClient: Client | null = null;
let sharedConfig: LangSmithConfig | null = null;

/**
 * Get or create the shared LangSmith Client singleton.
 *
 * Returns the same Client instance for equivalent configs.
 * If called with a different config, creates a new Client.
 */
export function getSharedClient(config: LangSmithConfig): Client {
  if (sharedClient && sharedConfig?.apiKey === config.apiKey && sharedConfig?.apiUrl === config.apiUrl) {
    return sharedClient;
  }

  sharedClient = new Client({
    apiKey: config.apiKey,
    apiUrl: config.apiUrl,
  });
  sharedConfig = config;

  return sharedClient;
}

/**
 * Clear the shared client. Used in tests.
 */
export function resetClient(): void {
  sharedClient = null;
  sharedConfig = null;
}
