/**
 * LangSmith Configuration Loader
 * SPEC: SPEC-EVAL-001, REQ-EVAL-002
 *
 * Reads LangSmith configuration from existing environment variables.
 * Returns null if LANGSMITH_API_KEY is not set (graceful degradation).
 *
 * Environment variables:
 * - LANGSMITH_API_KEY (required) — API key for authentication
 * - LANGSMITH_ENDPOINT (optional) — API URL, defaults to https://api.smith.langchain.com
 * - LANGSMITH_PROJECT (optional) — Project name/ID, defaults to "default"
 * - LANGSMITH_WORKSPACE_ID (optional) — Workspace ID
 */

import type { LangSmithConfig } from "./types.js";

const DEFAULT_API_URL = "https://api.smith.langchain.com";
const DEFAULT_PROJECT = "default";

/**
 * Load LangSmith configuration from environment variables.
 *
 * @returns Configuration object if LANGSMITH_API_KEY is set, null otherwise.
 */
export function loadLangSmithConfig(): LangSmithConfig | null {
  const apiKey = process.env.LANGSMITH_API_KEY;

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    apiUrl: process.env.LANGSMITH_ENDPOINT || DEFAULT_API_URL,
    project: process.env.LANGSMITH_PROJECT || DEFAULT_PROJECT,
    workspaceId: process.env.LANGSMITH_WORKSPACE_ID,
  };
}

/**
 * Check if LangSmith is configured (API key present).
 */
export function isLangSmithEnabled(): boolean {
  return !!process.env.LANGSMITH_API_KEY;
}
