/**
 * Claims Tool Handler — wraps the claims domain handler for the Code Mode
 * surface (SPEC-AGX-SUBSTRATE B2), mirroring the hub tool handler:
 *
 * - resolves the acting agentId per MCP session from the SHARED
 *   SessionIdentityRegistry (one tb.hub.register/quick_join grants the
 *   identity to tb.claims too; explicit agentId is accepted on mutations
 *   when registered in the same session);
 * - returns MCP-formatted content with an embedded per-operation resource
 *   block for discoverability.
 */

import type { SessionIdentityRegistry } from '../hub/session-identity.js';
import { createClaimsHandler } from './claims-handler.js';
import { getClaimsOperation } from './operations.js';
import type { ClaimStorage } from './types.js';

type ClaimsContentBlock =
  | { type: 'text'; text: string }
  | { type: 'resource'; resource: { uri: string; mimeType: string; text: string } };

export interface ClaimsToolResult {
  content: Array<ClaimsContentBlock>;
  isError?: boolean;
}

export interface ClaimsToolHandler {
  handle(
    input: { operation: string; [key: string]: unknown },
    mcpSessionId?: string,
  ): Promise<ClaimsToolResult>;
}

export interface ClaimsToolHandlerOptions {
  claimStorage: ClaimStorage;
  /** Shared with the hub tool handler so one registration covers both. */
  identityRegistry: SessionIdentityRegistry;
}

export function createClaimsToolHandler(
  options: ClaimsToolHandlerOptions,
): ClaimsToolHandler {
  const claimsHandler = createClaimsHandler(options.claimStorage);
  const identities = options.identityRegistry;

  return {
    async handle(input, mcpSessionId?) {
      const { operation, agentId: callerAgentId, ...args } = input;
      const sessionKey = mcpSessionId || '__default__';

      try {
        const agentId = identities.resolve(sessionKey, callerAgentId);
        const result = await claimsHandler.handle(
          agentId,
          operation,
          args as Record<string, unknown>,
        );

        const content: ClaimsContentBlock[] = [
          { type: 'text' as const, text: JSON.stringify(result, null, 2) },
        ];

        const opDef = getClaimsOperation(operation);
        if (opDef) {
          content.push({
            type: 'resource',
            resource: {
              uri: `thoughtbox://claims/operations/${operation}`,
              mimeType: 'application/json',
              text: JSON.stringify(opDef, null, 2),
            },
          });
        }

        return { content };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: 'text' as const, text: JSON.stringify({ error: message }, null, 2) },
          ],
          isError: true,
        };
      }
    },
  };
}
