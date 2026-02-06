/**
 * Problems Module — Problem lifecycle management
 *
 * ADR-002 Section 2.2: Problem Operations
 */

import { randomUUID } from 'node:crypto';
import type { HubStorage, Problem, ProblemStatus, Channel, Comment } from './hub-types.js';

export interface ThoughtStoreForProblems {
  getThoughtCount(sessionId: string): Promise<number>;
}

export interface ProblemsManager {
  createProblem(
    agentId: string,
    args: { workspaceId: string; title: string; description: string },
  ): Promise<{ problemId: string; channelId: string }>;

  claimProblem(
    agentId: string,
    args: { workspaceId: string; problemId: string; branchId: string },
  ): Promise<{ problem: Problem; branchId: string; branchFromThought: number }>;

  updateProblem(
    agentId: string,
    args: { workspaceId: string; problemId: string; status?: string; resolution?: string; comment?: string },
  ): Promise<{ problem: Problem }>;

  listProblems(
    args: { workspaceId: string; status?: string; assignedTo?: string },
  ): Promise<{ problems: Problem[] }>;

  addDependency(
    agentId: string,
    args: { workspaceId: string; problemId: string; dependsOnProblemId: string },
  ): Promise<{ problem: Problem }>;

  removeDependency(
    agentId: string,
    args: { workspaceId: string; problemId: string; dependsOnProblemId: string },
  ): Promise<{ problem: Problem }>;

  readyProblems(
    args: { workspaceId: string },
  ): Promise<{ problems: Problem[] }>;

  blockedProblems(
    args: { workspaceId: string },
  ): Promise<{ problems: Problem[] }>;

  createSubProblem(
    agentId: string,
    args: { workspaceId: string; parentId: string; title: string; description: string },
  ): Promise<{ problemId: string; channelId: string }>;
}

export function createProblemsManager(
  storage: HubStorage,
  thoughtStore: ThoughtStoreForProblems,
): ProblemsManager {
  return {
    async createProblem(agentId, { workspaceId, title, description }) {
      // Verify coordinator role
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`);

      const agent = workspace.agents.find(a => a.agentId === agentId);
      if (!agent || agent.role !== 'coordinator') {
        throw new Error('Only coordinator can create problems');
      }

      const now = new Date().toISOString();
      const problemId = randomUUID();

      const problem: Problem = {
        id: problemId,
        workspaceId,
        title,
        description,
        createdBy: agentId,
        status: 'open',
        comments: [],
        createdAt: now,
        updatedAt: now,
      };

      await storage.saveProblem(problem);

      // Create associated channel
      const channel: Channel = {
        id: problemId,
        workspaceId,
        problemId,
        messages: [],
      };
      await storage.saveChannel(channel);

      return { problemId, channelId: problemId };
    },

    async claimProblem(agentId, { workspaceId, problemId, branchId }) {
      const problem = await storage.getProblem(workspaceId, problemId);
      if (!problem) throw new Error(`Problem not found: ${problemId}`);

      if (problem.status === 'resolved') throw new Error('Problem already resolved');
      if (problem.status === 'closed') throw new Error('Problem is closed');

      if (problem.assignedTo) {
        // Find the assigned agent's name for the error message
        const assignedAgent = await storage.getAgent(problem.assignedTo);
        const assignedName = assignedAgent?.name ?? problem.assignedTo;
        throw new Error(`Problem already claimed by ${assignedName}`);
      }

      // Determine branch point from main chain
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`);

      const branchFromThought = await thoughtStore.getThoughtCount(workspace.mainSessionId);

      problem.assignedTo = agentId;
      problem.status = 'in-progress';
      problem.branchId = branchId;
      problem.branchFromThought = branchFromThought;
      problem.updatedAt = new Date().toISOString();

      await storage.saveProblem(problem);

      // Update agent's currentWork in workspace
      const wsAgent = workspace.agents.find(a => a.agentId === agentId);
      if (wsAgent) {
        wsAgent.currentWork = problemId;
        await storage.saveWorkspace(workspace);
      }

      return { problem, branchId, branchFromThought };
    },

    async updateProblem(agentId, { workspaceId, problemId, status, resolution, comment }) {
      const problem = await storage.getProblem(workspaceId, problemId);
      if (!problem) throw new Error(`Problem not found: ${problemId}`);

      if (status) problem.status = status as ProblemStatus;
      if (resolution) problem.resolution = resolution;
      if (comment) {
        const newComment: Comment = {
          id: randomUUID(),
          agentId,
          content: comment,
          createdAt: new Date().toISOString(),
        };
        problem.comments.push(newComment);
      }

      problem.updatedAt = new Date().toISOString();
      await storage.saveProblem(problem);

      return { problem };
    },

    async listProblems({ workspaceId, status, assignedTo }) {
      let allProblems = await storage.listProblems(workspaceId);

      if (status) {
        allProblems = allProblems.filter(p => p.status === status);
      }
      if (assignedTo) {
        allProblems = allProblems.filter(p => p.assignedTo === assignedTo);
      }

      return { problems: allProblems };
    },

    async addDependency(_agentId, { workspaceId, problemId, dependsOnProblemId }) {
      if (problemId === dependsOnProblemId) {
        throw new Error('A problem cannot depend on itself');
      }

      const problem = await storage.getProblem(workspaceId, problemId);
      if (!problem) throw new Error(`Problem not found: ${problemId}`);

      const target = await storage.getProblem(workspaceId, dependsOnProblemId);
      if (!target) throw new Error(`Dependency target not found: ${dependsOnProblemId}`);

      if (!problem.dependsOn) problem.dependsOn = [];

      if (problem.dependsOn.includes(dependsOnProblemId)) {
        throw new Error(`Problem already depends on ${dependsOnProblemId}`);
      }

      // Cycle detection: DFS from dependsOnProblemId to see if it transitively reaches problemId
      const visited = new Set<string>();
      const hasCycle = async (currentId: string): Promise<boolean> => {
        if (currentId === problemId) return true;
        if (visited.has(currentId)) return false;
        visited.add(currentId);
        const current = await storage.getProblem(workspaceId, currentId);
        if (!current?.dependsOn) return false;
        for (const depId of current.dependsOn) {
          if (await hasCycle(depId)) return true;
        }
        return false;
      };

      if (await hasCycle(dependsOnProblemId)) {
        throw new Error('Adding this dependency would create a cycle');
      }

      problem.dependsOn.push(dependsOnProblemId);
      problem.updatedAt = new Date().toISOString();
      await storage.saveProblem(problem);

      return { problem };
    },

    async removeDependency(_agentId, { workspaceId, problemId, dependsOnProblemId }) {
      const problem = await storage.getProblem(workspaceId, problemId);
      if (!problem) throw new Error(`Problem not found: ${problemId}`);

      if (!problem.dependsOn) problem.dependsOn = [];
      problem.dependsOn = problem.dependsOn.filter(id => id !== dependsOnProblemId);
      problem.updatedAt = new Date().toISOString();
      await storage.saveProblem(problem);

      return { problem };
    },

    async readyProblems({ workspaceId }) {
      const allProblems = await storage.listProblems(workspaceId);
      const isResolved = (status: string) => status === 'resolved' || status === 'closed';

      const ready = allProblems.filter(p => {
        if (p.status !== 'open') return false;
        if (!p.dependsOn || p.dependsOn.length === 0) return true;
        // All deps must be resolved/closed
        return p.dependsOn.every(depId => {
          const dep = allProblems.find(d => d.id === depId);
          return dep && isResolved(dep.status);
        });
      });

      return { problems: ready };
    },

    async blockedProblems({ workspaceId }) {
      const allProblems = await storage.listProblems(workspaceId);
      const isResolved = (status: string) => status === 'resolved' || status === 'closed';

      const blocked = allProblems.filter(p => {
        if (p.status !== 'open' && p.status !== 'in-progress') return false;
        if (!p.dependsOn || p.dependsOn.length === 0) return false;
        // At least one dep is NOT resolved/closed
        return p.dependsOn.some(depId => {
          const dep = allProblems.find(d => d.id === depId);
          return !dep || !isResolved(dep.status);
        });
      });

      return { problems: blocked };
    },

    async createSubProblem(agentId, { workspaceId, parentId, title, description }) {
      // Verify parent exists
      const parent = await storage.getProblem(workspaceId, parentId);
      if (!parent) throw new Error(`Parent problem not found: ${parentId}`);

      // Verify coordinator role (same check as createProblem)
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`);

      const agent = workspace.agents.find(a => a.agentId === agentId);
      if (!agent || agent.role !== 'coordinator') {
        throw new Error('Only coordinator can create problems');
      }

      const now = new Date().toISOString();
      const problemId = randomUUID();

      const problem: Problem = {
        id: problemId,
        workspaceId,
        title,
        description,
        createdBy: agentId,
        status: 'open',
        parentId,
        comments: [],
        createdAt: now,
        updatedAt: now,
      };

      await storage.saveProblem(problem);

      // Create associated channel
      const channel: Channel = {
        id: problemId,
        workspaceId,
        problemId,
        messages: [],
      };
      await storage.saveChannel(channel);

      return { problemId, channelId: problemId };
    },
  };
}
