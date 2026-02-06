/**
 * Identity Module — Agent registration & identity management
 *
 * Handles register and whoami operations.
 * ADR-002 Section 2.2: Identity Operations
 */

import { randomUUID } from 'node:crypto';
import type { AgentIdentity, HubStorage } from './hub-types.js';

export interface IdentityManager {
  register(args: { name: string; clientInfo?: string }): Promise<{ agentId: string; name: string; role: 'contributor' }>;
  whoami(agentId: string): Promise<{ agentId: string; name: string; role: string; workspaces: string[] }>;
  getAgent(agentId: string): Promise<AgentIdentity | null>;
}

export function createIdentityManager(storage: HubStorage): IdentityManager {
  return {
    async register({ name, clientInfo }) {
      const agent: AgentIdentity = {
        agentId: randomUUID(),
        name,
        role: 'contributor',
        clientInfo,
        registeredAt: new Date().toISOString(),
      };

      await storage.saveAgent(agent);

      return {
        agentId: agent.agentId,
        name: agent.name,
        role: 'contributor' as const,
      };
    },

    async whoami(agentId) {
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        throw new Error('Not registered. Call register first.');
      }

      // Scan all workspaces to find which ones this agent belongs to
      const allWorkspaces = await storage.listWorkspaces();
      const workspaces = allWorkspaces
        .filter(ws => ws.agents.some(a => a.agentId === agentId))
        .map(ws => ws.id);

      return {
        agentId: agent.agentId,
        name: agent.name,
        role: agent.role,
        workspaces,
      };
    },

    async getAgent(agentId) {
      return storage.getAgent(agentId);
    },
  };
}
