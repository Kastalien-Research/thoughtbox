/**
 * Workspace Module — Workspace CRUD & presence tracking
 *
 * ADR-002 Section 2.2: Workspace Operations
 */

import { randomUUID } from 'node:crypto';
import type {
  HubStorage,
  Workspace,
  WorkspaceAgent,
  Problem,
  Proposal,
} from './hub-types.js';

export interface ThoughtStoreForWorkspace {
  createSession(sessionId: string): Promise<void>;
  getThoughts(sessionId: string): Promise<unknown[]>;
  getThoughtCount(sessionId: string): Promise<number>;
}

export interface WorkspaceManager {
  createWorkspace(
    agentId: string,
    args: { name: string; description: string; sessionId?: string },
  ): Promise<{ workspaceId: string; mainSessionId: string }>;

  joinWorkspace(
    agentId: string,
    args: { workspaceId: string },
  ): Promise<{ workspace: Workspace; problems: Problem[]; proposals: Proposal[] }>;

  listWorkspaces(): Promise<{
    workspaces: Array<{ id: string; name: string; agentCount: number; problemCount: number }>;
  }>;

  workspaceStatus(args: { workspaceId: string }): Promise<{
    workspace: Workspace;
    agents: WorkspaceAgent[];
    openProblems: number;
    openProposals: number;
  }>;

  isAgentInWorkspace(agentId: string, workspaceId: string): Promise<boolean>;
  getAgentRole(agentId: string, workspaceId: string): Promise<'coordinator' | 'contributor' | null>;
}

export function createWorkspaceManager(
  storage: HubStorage,
  thoughtStore: ThoughtStoreForWorkspace,
): WorkspaceManager {
  return {
    async createWorkspace(agentId, { name, description, sessionId }) {
      const mainSessionId = sessionId ?? randomUUID();

      // Create a new session if no existing one provided
      if (!sessionId) {
        await thoughtStore.createSession(mainSessionId);
      }

      const now = new Date().toISOString();
      const workspaceId = randomUUID();

      const agent: WorkspaceAgent = {
        agentId,
        role: 'coordinator',
        joinedAt: now,
        status: 'online',
        lastSeenAt: now,
      };

      const workspace: Workspace = {
        id: workspaceId,
        name,
        description,
        createdBy: agentId,
        mainSessionId,
        agents: [agent],
        createdAt: now,
        updatedAt: now,
      };

      await storage.saveWorkspace(workspace);

      return { workspaceId, mainSessionId };
    },

    async joinWorkspace(agentId, { workspaceId }) {
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }

      const now = new Date().toISOString();

      // Check if agent is already a member
      const existingAgent = workspace.agents.find(a => a.agentId === agentId);
      
      if (existingAgent) {
        // Agent already exists - update their status (reconnect scenario)
        existingAgent.status = 'online';
        existingAgent.lastSeenAt = now;
      } else {
        // New agent - add them as contributor
        const agent: WorkspaceAgent = {
          agentId,
          role: 'contributor',
          joinedAt: now,
          status: 'online',
          lastSeenAt: now,
        };
        workspace.agents.push(agent);
      }

      workspace.updatedAt = now;
      await storage.saveWorkspace(workspace);

      const problems = await storage.listProblems(workspaceId);
      const proposals = await storage.listProposals(workspaceId);

      return { workspace, problems, proposals };
    },

    async listWorkspaces() {
      const allWorkspaces = await storage.listWorkspaces();
      const summaries = await Promise.all(
        allWorkspaces.map(async (ws) => {
          const problems = await storage.listProblems(ws.id);
          return {
            id: ws.id,
            name: ws.name,
            agentCount: ws.agents.length,
            problemCount: problems.length,
          };
        }),
      );
      return { workspaces: summaries };
    },

    async workspaceStatus({ workspaceId }) {
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }

      const problems = await storage.listProblems(workspaceId);
      const proposals = await storage.listProposals(workspaceId);

      return {
        workspace,
        agents: workspace.agents,
        openProblems: problems.filter(p => p.status === 'open' || p.status === 'in-progress').length,
        openProposals: proposals.filter(p => p.status === 'open' || p.status === 'reviewing').length,
      };
    },

    async isAgentInWorkspace(agentId, workspaceId) {
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) return false;
      return workspace.agents.some(a => a.agentId === agentId);
    },

    async getAgentRole(agentId, workspaceId) {
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) return null;
      const agent = workspace.agents.find(a => a.agentId === agentId);
      return agent?.role ?? null;
    },
  };
}
