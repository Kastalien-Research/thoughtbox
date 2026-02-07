/**
 * Identity Module — Agent registration & identity management
 *
 * Handles register and whoami operations.
 * ADR-002 Section 2.2: Identity Operations
 * SPEC-HUB-002: Agent profile support
 */

import { randomUUID } from 'node:crypto';
import type { AgentIdentity, HubStorage } from './hub-types.js';
import { isValidProfile, getProfile } from './profiles-registry.js';

export interface IdentityManager {
  register(args: { name: string; clientInfo?: string; profile?: string }): Promise<{ agentId: string; name: string; role: 'contributor' }>;
  whoami(agentId: string): Promise<{
    agentId: string;
    name: string;
    role: string;
    workspaces: string[];
    profile?: string;
    mentalModels?: string[];
  }>;
  getAgent(agentId: string): Promise<AgentIdentity | null>;
}

export function createIdentityManager(storage: HubStorage): IdentityManager {
  return {
    async register({ name, clientInfo, profile }) {
      // Validate profile if provided
      if (profile !== undefined && !isValidProfile(profile)) {
        const validProfiles = ['MANAGER', 'ARCHITECT', 'DEBUGGER', 'SECURITY'];
        throw new Error(`Invalid profile '${profile}'. Valid profiles: ${validProfiles.join(', ')}`);
      }

      const agent: AgentIdentity = {
        agentId: randomUUID(),
        name,
        role: 'contributor',
        ...(profile && { profile }),
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

      const result: {
        agentId: string;
        name: string;
        role: string;
        workspaces: string[];
        profile?: string;
        mentalModels?: string[];
      } = {
        agentId: agent.agentId,
        name: agent.name,
        role: agent.role,
        workspaces,
      };

      // Include profile info if agent has a profile
      if (agent.profile) {
        result.profile = agent.profile;
        const profileDef = getProfile(agent.profile);
        if (profileDef) {
          result.mentalModels = profileDef.mentalModels;
        }
      }

      return result;
    },

    async getAgent(agentId) {
      return storage.getAgent(agentId);
    },
  };
}
