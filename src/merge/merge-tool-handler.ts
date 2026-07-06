/**
 * Merge Tool Handler — wraps the merge domain handler for the Code Mode
 * surface (SPEC-MERGE-EVIDENCE c9), mirroring the claims tool handler:
 *
 * - resolves the acting agentId per MCP session from the SHARED
 *   SessionIdentityRegistry (one tb.hub.register/quick_join grants the
 *   identity to tb.merge too; explicit agentId is accepted on mutations
 *   when registered in the same session);
 * - returns MCP-formatted content with an embedded per-operation resource
 *   block for discoverability.
 */

import type { SessionIdentityRegistry } from '../hub/session-identity.js';
import type { MergeEvidenceGenerator } from './evidence-generator.js';
import { createMergeHandler } from './merge-handler.js';
import { getMergeOperation } from './operations.js';
import type { MergeCommitStorage } from './types.js';

type MergeContentBlock =
  | { type: 'text'; text: string }
  | { type: 'resource'; resource: { uri: string; mimeType: string; text: string } };

export interface MergeToolResult {
  content: Array<MergeContentBlock>;
  isError?: boolean;
}

export interface MergeToolHandler {
  handle(
    input: { operation: string; [key: string]: unknown },
    mcpSessionId?: string,
  ): Promise<MergeToolResult>;
}

export interface MergeToolHandlerOptions {
  mergeStorage: MergeCommitStorage;
  evidenceGenerator: MergeEvidenceGenerator;
  /** Shared with the hub tool handler so one registration covers both. */
  identityRegistry: SessionIdentityRegistry;
}

export function createMergeToolHandler(options: MergeToolHandlerOptions): MergeToolHandler {
  const mergeHandler = createMergeHandler({
    storage: options.mergeStorage,
    evidenceGenerator: options.evidenceGenerator,
  });
  const identities = options.identityRegistry;

  return {
    async handle(input, mcpSessionId?) {
      const { operation, agentId: callerAgentId, ...args } = input;
      const sessionKey = mcpSessionId || '__default__';

      try {
        const agentId = identities.resolve(sessionKey, callerAgentId);
        const result = await mergeHandler.handle(
          agentId,
          operation,
          args as Record<string, unknown>,
        );

        const content: MergeContentBlock[] = [
          { type: 'text' as const, text: JSON.stringify(result, null, 2) },
        ];

        const opDef = getMergeOperation(operation);
        if (opDef) {
          content.push({
            type: 'resource',
            resource: {
              uri: `thoughtbox://merge/operations/${operation}`,
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
