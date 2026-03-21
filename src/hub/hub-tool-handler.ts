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

  // Connection-scoped identity registry.
  // sessionDefaults: env-var-resolved or first-registered agentId per session.
  // sessionRegistries: all agentIds registered within a session (for multi-agent).
  const sessionDefaults = new Map<string, string | null>();
  const sessionRegistries = new Map<string, Set<string>>();
  let envResolved = false;

  async function ensureEnvResolved(sessionKey: string): Promise<void> {
    if (envResolved) return;
    envResolved = true;
    const resolved = await resolveAgentId(hubStorage, envAgentId, envAgentName);
    if (resolved) {
      sessionDefaults.set(sessionKey, resolved);
      getOrCreateRegistry(sessionKey).add(resolved);
    }
  }

  function getOrCreateRegistry(sessionKey: string): Set<string> {
    let reg = sessionRegistries.get(sessionKey);
    if (!reg) {
      reg = new Set();
      sessionRegistries.set(sessionKey, reg);
    }
    return reg;
  }

  function captureRegistration(
    sessionKey: string, result: unknown
  ): void {
    if (result && typeof result === 'object' && 'agentId' in result) {
      const newId = (result as { agentId: string }).agentId;
      const registry = getOrCreateRegistry(sessionKey);
      registry.add(newId);
      // First registration becomes the session default
      if (!sessionDefaults.has(sessionKey) || sessionDefaults.get(sessionKey) === null) {
        sessionDefaults.set(sessionKey, newId);
      }
    }
  }

  return {
    async handle(input, mcpSessionId?) {
      const { operation, agentId: callerAgentId, ...args } = input;
      const sessionKey = mcpSessionId || '__default__';

      await ensureEnvResolved(sessionKey);

      const registry = getOrCreateRegistry(sessionKey);
      const defaultId = sessionDefaults.get(sessionKey) ?? null;

      try {
        let agentId: string | null;

        if (operation === 'register' || operation === 'quick_join') {
          agentId = null;
        } else if (callerAgentId && typeof callerAgentId === 'string') {
          if (!registry.has(callerAgentId)) {
            throw new Error(
              `Agent ${callerAgentId} not registered in this session. ` +
              "Call register first."
            );
          }
          agentId = callerAgentId;
        } else {
          agentId = defaultId;
        }

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
