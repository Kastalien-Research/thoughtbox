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
}

export interface HubToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface HubToolHandler {
  handle(args: { operation: string; args?: Record<string, unknown> }, mcpSessionId?: string): Promise<HubToolResult>;
}

export function createHubToolHandler(options: HubToolHandlerOptions): HubToolHandler {
  const { hubStorage, thoughtStore, envAgentId, envAgentName, onEvent } = options;

  const hubHandler = createHubHandler(hubStorage, thoughtStore, onEvent);

  // Per-session identity map: each MCP session resolves its own agent identity.
  // Key: mcpSessionId (or '__default__' when no session ID is provided).
  // Value: string (resolved agentId), null (no env vars — register required),
  //        or undefined (not yet resolved).
  const sessionIdentities = new Map<string, string | null | undefined>();

  return {
    async handle(toolArgs, mcpSessionId?) {
      const { operation, args = {} } = toolArgs;
      const sessionKey = mcpSessionId || '__default__';

      // Resolve agent identity lazily on first call per session
      if (!sessionIdentities.has(sessionKey)) {
        sessionIdentities.set(sessionKey, undefined);
      }
      if (sessionIdentities.get(sessionKey) === undefined) {
        const resolved = await resolveAgentId(hubStorage, envAgentId, envAgentName);
        sessionIdentities.set(sessionKey, resolved);
      }

      const resolvedAgentId = sessionIdentities.get(sessionKey)!;

      try {
        // For register, pass null agentId (register creates new identity)
        const agentId = operation === 'register' ? null : resolvedAgentId;
        const result = await hubHandler.handle(agentId, operation, args as Record<string, any>);

        // If register was called, capture the agentId scoped to this session
        if (operation === 'register' && result && typeof result === 'object' && 'agentId' in result) {
          sessionIdentities.set(sessionKey, (result as { agentId: string }).agentId);
        }

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: error.message }, null, 2) }],
          isError: true,
        };
      }
    },
  };
}
