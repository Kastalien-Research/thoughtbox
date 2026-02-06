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
  handle(args: { operation: string; args?: Record<string, unknown> }): Promise<HubToolResult>;
}

export function createHubToolHandler(options: HubToolHandlerOptions): HubToolHandler {
  const { hubStorage, thoughtStore, envAgentId, envAgentName, onEvent } = options;

  const hubHandler = createHubHandler(hubStorage, thoughtStore, onEvent);
  let resolvedAgentId: string | null | undefined = undefined; // undefined = not yet resolved

  return {
    async handle(toolArgs) {
      const { operation, args = {} } = toolArgs;

      // Resolve agent identity lazily on first call
      if (resolvedAgentId === undefined) {
        resolvedAgentId = await resolveAgentId(hubStorage, envAgentId, envAgentName);
      }

      try {
        // For register, pass null agentId (register creates new identity)
        const agentId = operation === 'register' ? null : resolvedAgentId;
        const result = await hubHandler.handle(agentId, operation, args as Record<string, any>);

        // If register was called, capture the agentId for future calls
        if (operation === 'register' && result && typeof result === 'object' && 'agentId' in result) {
          resolvedAgentId = (result as { agentId: string }).agentId;
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
