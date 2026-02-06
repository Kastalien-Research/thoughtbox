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
import type { ThoughtStoreForWorkspace } from './workspace.js';

type ThoughtStore = ThoughtStoreForWorkspace & {
  saveThought(sessionId: string, thought: any): Promise<void>;
  getThought(sessionId: string, thoughtNumber: number): Promise<any>;
  getThoughtCount(sessionId: string): Promise<number>;
};

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

export function createHubHandler(storage: HubStorage, thoughtStore: ThoughtStore): HubHandler {
  const identity = createIdentityManager(storage);
  const workspace = createWorkspaceManager(storage, thoughtStore);
  const problems = createProblemsManager(storage, thoughtStore);
  const proposals = createProposalsManager(storage, thoughtStore);
  const consensus = createConsensusManager(storage);
  const channels = createChannelsManager(storage);

  return {
    async handle(agentId, operation, args) {
      const requiredStage = getDisclosureStage(operation);

      // Stage 0: register and list_workspaces — no agent needed
      if (requiredStage === 0) {
        if (operation === 'register') {
          return identity.register(args as any);
        }
        if (operation === 'list_workspaces') {
          return workspace.listWorkspaces();
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
          return workspace.createWorkspace(agentId, args as any);
        }
        if (operation === 'join_workspace') {
          return workspace.joinWorkspace(agentId, args as any);
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
        switch (operation) {
          case 'create_problem':
            return problems.createProblem(agentId, args as any);
          case 'claim_problem':
            return problems.claimProblem(agentId, args as any);
          case 'update_problem':
            return problems.updateProblem(agentId, args as any);
          case 'list_problems':
            return problems.listProblems(args as any);
          case 'create_proposal':
            return proposals.createProposal(agentId, args as any);
          case 'review_proposal':
            return proposals.reviewProposal(agentId, args as any);
          case 'merge_proposal':
            return proposals.mergeProposal(agentId, args as any);
          case 'list_proposals':
            return proposals.listProposals(args as any);
          case 'mark_consensus':
            return consensus.markConsensus(agentId, args as any);
          case 'endorse_consensus':
            return consensus.endorseConsensus(agentId, args as any);
          case 'list_consensus':
            return consensus.listConsensus(args as any);
          case 'post_message':
            return channels.postMessage(agentId, args as any);
          case 'read_channel':
            return channels.readChannel(args as any);
          case 'workspace_status':
            return workspace.workspaceStatus(args as any);
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      }

      throw new Error(`Unknown operation: ${operation}`);
    },
  };
}
