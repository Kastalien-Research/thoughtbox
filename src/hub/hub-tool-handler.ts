/**
 * Hub Tool Handler — testable wrapper connecting hub domain to MCP tool interface
 *
 * This module creates a handler that:
 * 1. Resolves agent identity from env vars on first call
 * 2. Routes operations through the hub-handler
 * 3. Returns MCP-formatted content results
 */

import { createHubHandler, type HubEvent, type HubHandler } from './hub-handler.js';
import { resolveAgentId } from './agent-identity.js';
import type { HubStorage } from './hub-types.js';
import { getOperation as getHubOperation } from './operations.js';
import { SessionIdentityRegistry } from './session-identity.js';

interface ThoughtStore {
  createSession(sessionId: string): Promise<void>;
  saveThought(sessionId: string, thought: any): Promise<void>;
  getThought(sessionId: string, thoughtNumber: number): Promise<any>;
  getThoughts(sessionId: string): Promise<any[]>;
  getThoughtCount(sessionId: string): Promise<number>;
  saveBranchThought(sessionId: string, branchId: string, thought: any): Promise<void>;
  getBranch(sessionId: string, branchId: string): Promise<any[]>;
}

export interface HubToolHandlerOptions {
  hubStorage: HubStorage;
  thoughtStore: ThoughtStore;
  envAgentId?: string;
  envAgentName?: string;
  onEvent?: (event: HubEvent) => void;
  /**
   * Shared session identity registry. Pass the same instance to other
   * namespaces that follow the explicit-agentId convention (tb.claims) so
   * one hub registration grants an identity across all of them.
   */
  identityRegistry?: SessionIdentityRegistry;
}

type HubContentBlock =
  | { type: 'text'; text: string }
  | { type: 'resource'; resource: { uri: string; mimeType: string; text: string } };

export interface HubToolResult {
  content: Array<HubContentBlock>;
  isError?: boolean;
}

export interface HubToolHandler {
  handle(input: { operation: string; [key: string]: unknown }, mcpSessionId?: string): Promise<HubToolResult>;
}

export function createHubToolHandler(options: HubToolHandlerOptions): HubToolHandler {
  const { hubStorage, thoughtStore, envAgentId, envAgentName, onEvent } = options;

  const hubHandler = createHubHandler(hubStorage, thoughtStore, onEvent);

  // Connection-scoped identity registry: env-var-resolved or
  // first-registered agentId per session becomes the default; the registry
  // tracks all agentIds registered within a session (for multi-agent).
  // Shared with other namespaces (tb.claims) when passed in via options.
  const identities = options.identityRegistry ?? new SessionIdentityRegistry();
  let envResolved = false;

  async function ensureEnvResolved(sessionKey: string): Promise<void> {
    if (envResolved) return;
    envResolved = true;
    const resolved = await resolveAgentId(hubStorage, envAgentId, envAgentName);
    if (resolved) {
      identities.register(sessionKey, resolved);
    }
  }

  function captureRegistration(
    sessionKey: string, result: unknown
  ): void {
    if (result && typeof result === 'object' && 'agentId' in result) {
      identities.register(sessionKey, (result as { agentId: string }).agentId);
    }
  }

  return {
    async handle(input, mcpSessionId?) {
      const { operation, agentId: callerAgentId, ...args } = input;
      const sessionKey = mcpSessionId || '__default__';

      await ensureEnvResolved(sessionKey);

      try {
        const agentId =
          operation === 'register' || operation === 'quick_join'
            ? null
            : identities.resolve(sessionKey, callerAgentId);

        const result = await hubHandler.handle(
          agentId, operation as string, args as Record<string, unknown>
        );

        // Capture registration results into the session registry
        if (operation === 'register' || operation === 'quick_join') {
          captureRegistration(sessionKey, result);
        }

        const content: HubContentBlock[] = [
          { type: 'text' as const, text: JSON.stringify(result, null, 2) },
        ];

        // Embed per-operation resource block for agent discoverability
        const opDef = getHubOperation(operation);
        if (opDef) {
          content.push({
            type: 'resource',
            resource: {
              uri: `thoughtbox://hub/operations/${operation}`,
              mimeType: 'application/json',
              text: JSON.stringify(opDef, null, 2),
            },
          });
        }

        return { content };
      } catch (error: any) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: error.message }, null, 2) }],
          isError: true,
        };
      }
    },
  };
}
