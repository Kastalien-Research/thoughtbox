/**
 * Proposals Module — Proposal, review, merge operations
 *
 * ADR-002 Sections 2.2 and 5 (Merge Thought Semantics)
 */

import { randomUUID } from 'node:crypto';
import type {
  HubStorage,
  Proposal,
  ProposalStatus,
  Review,
  ReviewVerdict,
} from './hub-types.js';
import type { ThoughtData } from '../persistence/types.js';

export interface ThoughtStoreForProposals {
  getThoughtCount(sessionId: string): Promise<number>;
  saveThought(sessionId: string, thought: ThoughtData): Promise<void>;
}

export interface ProposalsManager {
  createProposal(
    agentId: string,
    args: { workspaceId: string; title: string; description: string; sourceBranch: string; problemId?: string },
  ): Promise<{ proposalId: string }>;

  reviewProposal(
    agentId: string,
    args: { workspaceId: string; proposalId: string; verdict: ReviewVerdict; reasoning: string; thoughtRefs?: number[] },
  ): Promise<{ review: Review; proposalStatus: string }>;

  mergeProposal(
    agentId: string,
    args: { workspaceId: string; proposalId: string; mergeMessage: string },
  ): Promise<{ mergeThoughtNumber: number; proposal: Proposal }>;

  listProposals(
    args: { workspaceId: string; status?: string },
  ): Promise<{ proposals: Proposal[] }>;
}

export function createProposalsManager(
  storage: HubStorage,
  thoughtStore: ThoughtStoreForProposals,
): ProposalsManager {
  return {
    async createProposal(agentId, { workspaceId, title, description, sourceBranch, problemId }) {
      const now = new Date().toISOString();
      const proposalId = randomUUID();

      const proposal: Proposal = {
        id: proposalId,
        workspaceId,
        title,
        description,
        createdBy: agentId,
        sourceBranch,
        problemId,
        status: 'open',
        reviews: [],
        createdAt: now,
        updatedAt: now,
      };

      await storage.saveProposal(proposal);
      return { proposalId };
    },

    async reviewProposal(agentId, { workspaceId, proposalId, verdict, reasoning, thoughtRefs }) {
      const proposal = await storage.getProposal(workspaceId, proposalId);
      if (!proposal) throw new Error(`Proposal not found: ${proposalId}`);

      if (proposal.status === 'merged') throw new Error('Cannot review a merged proposal');

      if (proposal.createdBy === agentId) {
        throw new Error('Cannot review your own proposal');
      }

      const review: Review = {
        id: randomUUID(),
        proposalId,
        reviewerId: agentId,
        verdict,
        reasoning,
        thoughtRefs,
        createdAt: new Date().toISOString(),
      };

      proposal.reviews.push(review);
      proposal.status = 'reviewing';
      proposal.updatedAt = new Date().toISOString();

      await storage.saveProposal(proposal);
      return { review, proposalStatus: proposal.status };
    },

    async mergeProposal(agentId, { workspaceId, proposalId, mergeMessage }) {
      const proposal = await storage.getProposal(workspaceId, proposalId);
      if (!proposal) throw new Error(`Proposal not found: ${proposalId}`);

      if (proposal.status === 'merged') throw new Error('Proposal already merged');

      // Verify coordinator role
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`);

      const agent = workspace.agents.find(a => a.agentId === agentId);
      if (!agent || agent.role !== 'coordinator') {
        throw new Error('Only coordinator can merge proposals');
      }

      // Verify at least one approval
      const hasApproval = proposal.reviews.some(r => r.verdict === 'approve');
      if (!hasApproval) throw new Error('Proposal has no approvals');

      // Create merge thought on main chain
      const currentCount = await thoughtStore.getThoughtCount(workspace.mainSessionId);
      const mergeThoughtNumber = currentCount + 1;

      const mergeThought: ThoughtData = {
        thought: mergeMessage,
        thoughtNumber: mergeThoughtNumber,
        totalThoughts: mergeThoughtNumber,
        nextThoughtNeeded: true,
        timestamp: new Date().toISOString(),
      };

      // Add agent attribution
      (mergeThought as any).agentId = agentId;
      const agentInfo = await storage.getAgent(agentId);
      if (agentInfo) (mergeThought as any).agentName = agentInfo.name;

      await thoughtStore.saveThought(workspace.mainSessionId, mergeThought);

      // Update proposal
      proposal.status = 'merged';
      proposal.mergeThoughtNumber = mergeThoughtNumber;
      proposal.updatedAt = new Date().toISOString();
      await storage.saveProposal(proposal);

      // Resolve linked problem if any
      if (proposal.problemId) {
        const problem = await storage.getProblem(workspaceId, proposal.problemId);
        if (problem) {
          problem.status = 'resolved';
          problem.resolution = mergeMessage;
          problem.updatedAt = new Date().toISOString();
          await storage.saveProblem(problem);
        }
      }

      return { mergeThoughtNumber, proposal };
    },

    async listProposals({ workspaceId, status }) {
      let allProposals = await storage.listProposals(workspaceId);
      if (status) {
        allProposals = allProposals.filter(p => p.status === status);
      }
      return { proposals: allProposals };
    },
  };
}
