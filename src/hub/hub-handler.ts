/**
 * Hub Handler — Central dispatcher with progressive disclosure and workspace isolation
 *
 * ADR-002 Sections 2, 6, and 7
 */

import type { HubStorage, HubOperation, DisclosureStage } from './hub-types.js';
import { STAGE_OPERATIONS } from './hub-types.js';
import { createIdentityManager } from './identity.js';
import { createWorkspaceManager } from './workspace.js';
import { createProblemsManager } from './problems.js';
import { createProposalsManager } from './proposals.js';
import { createConsensusManager } from './consensus.js';
import { createChannelsManager } from './channels.js';
import { getProfilePromptContent } from './profiles-registry.js';
import type { ThoughtStoreForWorkspace } from './workspace.js';

type ThoughtStore = ThoughtStoreForWorkspace & {
  saveThought(sessionId: string, thought: any): Promise<void>;
  getThought(sessionId: string, thoughtNumber: number): Promise<any>;
  getThoughtCount(sessionId: string): Promise<number>;
};

export interface HubEvent {
  type: 'problem_created' | 'problem_status_changed' | 'message_posted' | 'proposal_created' | 'proposal_merged' | 'consensus_marked';
  workspaceId: string;
  data: Record<string, unknown>;
}

export interface HubHandler {
  handle(agentId: string | null, operation: string, args: Record<string, any>): Promise<unknown>;
}

function getDisclosureStage(operation: string): DisclosureStage {
  if ((STAGE_OPERATIONS[0] as string[]).includes(operation)) return 0;
  if ((STAGE_OPERATIONS[1] as string[]).includes(operation)) return 1;
  return 2;
}

/** Operations that require workspace membership check */
const WORKSPACE_OPERATIONS = new Set<string>(STAGE_OPERATIONS[2]);

export function createHubHandler(
  storage: HubStorage,
  thoughtStore: ThoughtStore,
  onEvent?: (event: HubEvent) => void
): HubHandler {
  const identity = createIdentityManager(storage);
  const workspace = createWorkspaceManager(storage, thoughtStore);
  const problems = createProblemsManager(storage, thoughtStore);
  const proposals = createProposalsManager(storage, thoughtStore);
  const consensus = createConsensusManager(storage);
  const channels = createChannelsManager(storage);

  function emit(event: HubEvent): void {
    if (onEvent) onEvent(event);
  }

  return {
    async handle(agentId, operation, args) {
      const requiredStage = getDisclosureStage(operation);

      // Stage 0: register, list_workspaces, quick_join — no agent needed
      if (requiredStage === 0) {
        if (operation === 'register') {
          return identity.register(args as any);
        }
        if (operation === 'list_workspaces') {
          return workspace.listWorkspaces();
        }
        if (operation === 'quick_join') {
          if (!args || typeof args !== 'object') {
            throw new Error('quick_join requires args object with name and workspaceId');
          }
          const { name, workspaceId: wsId, profile, clientInfo } = args as {
            name?: string; workspaceId?: string; profile?: string; clientInfo?: string;
          };
          if (!name) throw new Error('quick_join requires name');
          if (!wsId) throw new Error('quick_join requires workspaceId');

          // 1. Register
          const reg = await identity.register({ name, clientInfo, profile });

          // 2. Join workspace
          const joinResult = await workspace.joinWorkspace(reg.agentId, { workspaceId: wsId });

          return {
            agentId: reg.agentId,
            name: reg.name,
            role: reg.role,
            workspace: joinResult.workspace,
            problems: joinResult.problems,
            proposals: joinResult.proposals,
          };
        }
      }

      // Stage 1+: agent must be registered
      if (!agentId) {
        throw new Error("Register first. Call: thoughtbox_hub { operation: 'register', args: { name: '...' } }");
      }

      const agent = await identity.getAgent(agentId);
      if (!agent) {
        throw new Error("Register first. Call: thoughtbox_hub { operation: 'register', args: { name: '...' } }");
      }

      // Stage 1: registered but may not need workspace
      if (requiredStage === 1) {
        if (operation === 'whoami') {
          return identity.whoami(agentId);
        }
        if (operation === 'create_workspace') {
          const result = await workspace.createWorkspace(agentId, args as any);
          emit({
            type: 'workspace_created',
            workspaceId: result.workspaceId,
            data: {
              workspaceId: result.workspaceId,
              name: args.name,
              createdBy: agentId
            }
          });
          return result;
        }
        if (operation === 'join_workspace') {
          return workspace.joinWorkspace(agentId, args as any);
        }
        if (operation === 'get_profile_prompt') {
          const profileName = args.profile as string | undefined;
          if (!profileName) {
            throw new Error('Profile name is required. Pass { profile: "MANAGER" | "ARCHITECT" | "DEBUGGER" | "SECURITY" | "RESEARCHER" | "REVIEWER" }');
          }
          const content = getProfilePromptContent(profileName);
          if (!content) {
            throw new Error(`Unknown profile '${profileName}'. Available profiles: MANAGER, ARCHITECT, DEBUGGER, SECURITY, RESEARCHER, REVIEWER`);
          }
          return content;
        }
      }

      // Stage 2: must be in a workspace
      if (requiredStage === 2) {
        const workspaceId = args.workspaceId as string;
        if (!workspaceId) {
          throw new Error("Join a workspace first. Call: thoughtbox_hub { operation: 'join_workspace', args: { workspaceId: '...' } }");
        }

        // Check workspace membership — distinguish "no workspace at all" from "wrong workspace"
        const isMember = await workspace.isAgentInWorkspace(agentId, workspaceId);
        if (!isMember) {
          // Check if the agent is in ANY workspace
          const allWorkspaces = await storage.listWorkspaces();
          const inAny = allWorkspaces.some(ws => ws.agents.some(a => a.agentId === agentId));
          if (!inAny) {
            throw new Error("Join a workspace first. Call: thoughtbox_hub { operation: 'join_workspace', args: { workspaceId: '...' } }");
          }
          throw new Error('Not a member of this workspace');
        }

        // Dispatch to appropriate manager
        let result: unknown;
        switch (operation) {
          case 'create_problem':
            result = await problems.createProblem(agentId, args as any);
            emit({ type: 'problem_created', workspaceId, data: {
              problemId: (result as any).problemId,
              title: args.title,
              description: args.description,
              createdBy: agentId,
            } });
            return result;
          case 'claim_problem': {
            const claimArgs = args as { workspaceId: string; problemId: string; branchId?: string };
            // Auto-generate branch name if not provided
            if (!claimArgs.branchId) {
              const agent = await storage.getAgent(agentId);
              const agentSlug = (agent?.name ?? agentId ?? 'unknown').toLowerCase().replace(/[^a-z0-9-]/g, '-');
              claimArgs.branchId = `${agentSlug}/${claimArgs.problemId}`;
            }
            return problems.claimProblem(agentId, claimArgs as any);
          }
          case 'update_problem': {
            const prevProblem = await storage.getProblem(workspaceId, args.problemId);
            const previousStatus = prevProblem?.status;
            result = await problems.updateProblem(agentId, args as any);
            const updatedProblem = (result as any).problem;
            emit({ type: 'problem_status_changed', workspaceId, data: {
              problemId: updatedProblem.id,
              status: updatedProblem.status,
              previousStatus,
              title: updatedProblem.title,
            } });
            return result;
          }
          case 'list_problems':
            return problems.listProblems(args as any);
          case 'add_dependency':
            return problems.addDependency(agentId, args as any);
          case 'remove_dependency':
            return problems.removeDependency(agentId, args as any);
          case 'ready_problems':
            return problems.readyProblems(args as any);
          case 'blocked_problems':
            return problems.blockedProblems(args as any);
          case 'create_sub_problem':
            return problems.createSubProblem(agentId, args as any);
          case 'create_proposal':
            result = await proposals.createProposal(agentId, args as any);
            emit({ type: 'proposal_created', workspaceId, data: {
              proposalId: (result as any).proposalId,
              title: args.title,
              description: args.description,
              sourceBranch: args.sourceBranch,
              problemId: args.problemId,
            } });
            return result;
          case 'review_proposal':
            return proposals.reviewProposal(agentId, args as any);
          case 'merge_proposal': {
            result = await proposals.mergeProposal(agentId, args as any);
            const mergedProposal = (result as any).proposal;
            emit({ type: 'proposal_merged', workspaceId, data: {
              proposalId: mergedProposal.id,
              title: mergedProposal.title,
              mergedBy: agentId,
            } });
            return result;
          }
          case 'list_proposals':
            return proposals.listProposals(args as any);
          case 'mark_consensus': {
            result = await consensus.markConsensus(agentId, args as any);
            const marker = (result as any).marker;
            emit({ type: 'consensus_marked', workspaceId, data: {
              markerId: marker.id,
              name: marker.name,
              description: marker.description,
              thoughtRef: marker.thoughtRef,
            } });
            return result;
          }
          case 'endorse_consensus':
            return consensus.endorseConsensus(agentId, args as any);
          case 'list_consensus':
            return consensus.listConsensus(args as any);
          case 'post_message': {
            const msgContent = typeof args.content === 'string' ? args.content.slice(0, 200) : '';
            result = await channels.postMessage(agentId, args as any);
            emit({ type: 'message_posted', workspaceId, data: {
              messageId: (result as any).messageId,
              problemId: args.problemId,
              content: msgContent,
              agentId,
            } });
            return result;
          }
          case 'read_channel':
            return channels.readChannel(args as any);
          case 'post_system_message': {
            const sysMsgContent = typeof args.content === 'string' ? args.content.slice(0, 200) : '';
            result = await channels.postSystemMessage(args as any);
            emit({ type: 'message_posted', workspaceId, data: {
              messageId: (result as any).messageId,
              problemId: args.problemId,
              content: sysMsgContent,
              agentId: 'system',
              system: true,
            } });
            return result;
          }
          case 'workspace_status':
            return workspace.workspaceStatus(args as any);
          case 'workspace_digest': {
            const ws = await storage.getWorkspace(workspaceId);
            if (!ws) throw new Error(`Workspace not found: ${workspaceId}`);

            const allAgents = await storage.getAgents();
            const wsProblems = await storage.listProblems(workspaceId);
            const wsProposals = await storage.listProposals(workspaceId);

            const agentDigests = ws.agents.map(wa => {
              const agentInfo = allAgents.find(a => a.agentId === wa.agentId);
              return {
                agentId: wa.agentId,
                name: agentInfo?.name ?? 'unknown',
                role: wa.role,
                status: wa.status,
                currentWork: wa.currentWork,
                profile: agentInfo?.profile,
              };
            });

            const pendingProposals = wsProposals
              .filter(p => p.status === 'open' || p.status === 'reviewing')
              .map(p => ({
                id: p.id,
                title: p.title,
                createdBy: p.createdBy,
                status: p.status,
                reviewCount: p.reviews.length,
              }));

            const problemSummary = {
              total: wsProblems.length,
              open: wsProblems.filter(p => p.status === 'open').length,
              inProgress: wsProblems.filter(p => p.status === 'in-progress').length,
              resolved: wsProblems.filter(p => p.status === 'resolved').length,
              closed: wsProblems.filter(p => p.status === 'closed').length,
            };

            return {
              workspaceId,
              workspaceName: ws.name,
              agents: agentDigests,
              pendingProposals,
              problemSummary,
            };
          }
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      }

      throw new Error(`Unknown operation: ${operation}`);
    },
  };
}
