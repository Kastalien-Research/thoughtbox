/**
 * Shared request authentication — extracts API key from Bearer header
 * or query param and resolves it to a workspace ID (always a UUID).
 *
 * Used by both MCP and OTLP route handlers. Each caller formats
 * errors in their own protocol (JSON-RPC vs plain JSON).
 */

import type { Request } from 'express';
import { resolveApiKeyToWorkspace } from './api-key.js';
import { ensureStaticWorkspace } from './static-workspace.js';

export interface RequestAuthOpts {
  staticKey?: string;
  localDevKey?: string;
}

/**
 * Extract and resolve the API key from a request.
 *
 * @returns workspace UUID
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
    return ensureStaticWorkspace('default');
  }

  if (opts.localDevKey && providedKey === opts.localDevKey) {
    return ensureStaticWorkspace('local-dev');
  }

  if (providedKey.startsWith('tbx_')) {
    return resolveApiKeyToWorkspace(providedKey);
  }

  throw new Error('Invalid API key');
}
