/**
 * Shared test helpers for hub tests.
 * Provides in-memory storage and common setup utilities.
 */

import type {
  HubStorage,
  AgentIdentity,
  Workspace,
  Problem,
  Proposal,
  ConsensusMarker,
  Channel,
} from '../hub-types.js';
import type { ThoughtData } from '../../persistence/types.js';

/**
 * Creates an in-memory HubStorage implementation for tests.
 * All data lives in memory and resets between tests.
 */
export function createInMemoryHubStorage(): HubStorage {
  const agents: AgentIdentity[] = [];
  const workspaces: Map<string, Workspace> = new Map();
  const problems: Map<string, Map<string, Problem>> = new Map();
  const proposals: Map<string, Map<string, Proposal>> = new Map();
  const consensusMarkers: Map<string, Map<string, ConsensusMarker>> = new Map();
  const channels: Map<string, Map<string, Channel>> = new Map();

  return {
    // Agent operations
    async getAgents() { return [...agents]; },
    async saveAgent(agent) { agents.push(agent); },
    async getAgent(agentId) { return agents.find(a => a.agentId === agentId) ?? null; },

    // Workspace operations
    async getWorkspace(workspaceId) { return workspaces.get(workspaceId) ?? null; },
    async saveWorkspace(workspace) { workspaces.set(workspace.id, workspace); },
    async listWorkspaces() { return [...workspaces.values()]; },

    // Problem operations
    async getProblem(workspaceId, problemId) {
      return problems.get(workspaceId)?.get(problemId) ?? null;
    },
    async saveProblem(problem) {
      if (!problems.has(problem.workspaceId)) problems.set(problem.workspaceId, new Map());
      problems.get(problem.workspaceId)!.set(problem.id, problem);
    },
    async listProblems(workspaceId) {
      return [...(problems.get(workspaceId)?.values() ?? [])];
    },

    // Proposal operations
    async getProposal(workspaceId, proposalId) {
      return proposals.get(workspaceId)?.get(proposalId) ?? null;
    },
    async saveProposal(proposal) {
      if (!proposals.has(proposal.workspaceId)) proposals.set(proposal.workspaceId, new Map());
      proposals.get(proposal.workspaceId)!.set(proposal.id, proposal);
    },
    async listProposals(workspaceId) {
      return [...(proposals.get(workspaceId)?.values() ?? [])];
    },

    // Consensus operations
    async getConsensusMarker(workspaceId, markerId) {
      return consensusMarkers.get(workspaceId)?.get(markerId) ?? null;
    },
    async saveConsensusMarker(marker) {
      if (!consensusMarkers.has(marker.workspaceId)) consensusMarkers.set(marker.workspaceId, new Map());
      consensusMarkers.get(marker.workspaceId)!.set(marker.id, marker);
    },
    async listConsensusMarkers(workspaceId) {
      return [...(consensusMarkers.get(workspaceId)?.values() ?? [])];
    },

    // Channel operations
    async getChannel(workspaceId, problemId) {
      return channels.get(workspaceId)?.get(problemId) ?? null;
    },
    async saveChannel(channel) {
      if (!channels.has(channel.workspaceId)) channels.set(channel.workspaceId, new Map());
      channels.get(channel.workspaceId)!.set(channel.problemId, channel);
    },
  };
}

/**
 * Creates a minimal in-memory thought store for tests.
 * Used when tests need to verify thought persistence alongside hub operations.
 */
export function createInMemoryThoughtStore() {
  const thoughts: Map<string, Map<number, ThoughtData>> = new Map();
  const branches: Map<string, Map<string, Map<number, ThoughtData>>> = new Map();

  return {
    async createSession(sessionId: string) {
      thoughts.set(sessionId, new Map());
      branches.set(sessionId, new Map());
    },
    async saveThought(sessionId: string, thought: ThoughtData) {
      if (!thoughts.has(sessionId)) thoughts.set(sessionId, new Map());
      thoughts.get(sessionId)!.set(thought.thoughtNumber, { ...thought });
    },
    async getThought(sessionId: string, thoughtNumber: number) {
      return thoughts.get(sessionId)?.get(thoughtNumber) ?? null;
    },
    async getThoughts(sessionId: string) {
      const session = thoughts.get(sessionId);
      if (!session) return [];
      return [...session.values()].sort((a, b) => a.thoughtNumber - b.thoughtNumber);
    },
    async saveBranchThought(sessionId: string, branchId: string, thought: ThoughtData) {
      if (!branches.has(sessionId)) branches.set(sessionId, new Map());
      const sessionBranches = branches.get(sessionId)!;
      if (!sessionBranches.has(branchId)) sessionBranches.set(branchId, new Map());
      sessionBranches.get(branchId)!.set(thought.thoughtNumber, { ...thought });
    },
    async getBranch(sessionId: string, branchId: string) {
      const branch = branches.get(sessionId)?.get(branchId);
      if (!branch) return [];
      return [...branch.values()].sort((a, b) => a.thoughtNumber - b.thoughtNumber);
    },
    async getThoughtCount(sessionId: string) {
      return thoughts.get(sessionId)?.size ?? 0;
    },
  };
}
