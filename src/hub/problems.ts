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
  };
}
