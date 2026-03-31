/**
 * Shared request authentication — extracts API key from Bearer header
 * or query param and resolves it to a workspace ID.
 *
 * Used by both MCP and OTLP route handlers. Each caller formats
 * errors in their own protocol (JSON-RPC vs plain JSON).
 */

import type { Request } from 'express';
import { resolveApiKeyToWorkspace } from './api-key.js';

export interface RequestAuthOpts {
  staticKey?: string;
  localDevKey?: string;
  /** Workspace ID returned for staticKey matches (default: 'default-workspace') */
  staticKeyWorkspaceId?: string;
  /** Workspace ID returned for localDevKey matches (default: 'local-dev-workspace') */
  localDevWorkspaceId?: string;
}

/**
 * Extract and resolve the API key from a request.
 *
 * @returns workspace ID
 * @throws Error with a message suitable for the client
 */
export async function resolveRequestAuth(
  req: Request,
  opts: RequestAuthOpts = {},
): Promise<string> {
  const authHeader = req.headers.authorization as string | undefined;
  const headerKey = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined;
  const queryKey = req.query.key as string | undefined;
  const providedKey = headerKey || queryKey;

  if (!providedKey) {
    throw new Error('Missing API key');
  }

  if (opts.staticKey && providedKey === opts.staticKey) {
    return opts.staticKeyWorkspaceId ?? 'default-workspace';
  }

  if (opts.localDevKey && providedKey === opts.localDevKey) {
    return opts.localDevWorkspaceId ?? 'local-dev-workspace';
  }

  if (providedKey.startsWith('tbx_')) {
    return resolveApiKeyToWorkspace(providedKey);
  }

  throw new Error('Invalid API key');
}
