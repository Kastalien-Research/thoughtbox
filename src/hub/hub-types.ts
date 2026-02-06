/**
 * MCP Hub Type Definitions
 *
 * All hub-specific types from ADR-002 Section 1 (Data Model).
 * These types define the multi-agent coordination layer.
 */

// =============================================================================
// 1.1 Agent Identity
// =============================================================================

export interface AgentIdentity {
  agentId: string;
  name: string;
  role: 'coordinator' | 'contributor';
  clientInfo?: string;
  registeredAt: string; // ISO 8601
}

// =============================================================================
// 1.3 Workspace
// =============================================================================

export interface Workspace {
  id: string;
  name: string;
  description: string;
  createdBy: string; // agentId of coordinator
  mainSessionId: string;
  agents: WorkspaceAgent[];
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface WorkspaceAgent {
  agentId: string;
  role: 'coordinator' | 'contributor';
  joinedAt: string;
  status: 'online' | 'offline';
  lastSeenAt: string;
  currentWork?: string; // Problem ID they're working on
}

// =============================================================================
// 1.4 Problem
// =============================================================================

export type ProblemStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

export interface Problem {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  createdBy: string; // agentId
  assignedTo?: string; // agentId who claimed it
  status: ProblemStatus;
  branchId?: string;
  branchFromThought?: number;
  resolution?: string;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  agentId: string;
  content: string;
  createdAt: string;
}

// =============================================================================
// 1.5 Proposal
// =============================================================================

export type ProposalStatus = 'open' | 'reviewing' | 'merged' | 'rejected';

export interface Proposal {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  createdBy: string; // agentId
  sourceBranch: string;
  problemId?: string;
  status: ProposalStatus;
  reviews: Review[];
  mergeThoughtNumber?: number;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// 1.6 Review
// =============================================================================

export type ReviewVerdict = 'approve' | 'request-changes' | 'comment';

export interface Review {
  id: string;
  proposalId: string;
  reviewerId: string; // agentId
  verdict: ReviewVerdict;
  reasoning: string;
  thoughtRefs?: number[];
  createdAt: string;
}

// =============================================================================
// 1.7 Consensus Marker
// =============================================================================

export interface ConsensusMarker {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  thoughtRef: number;
  branchId?: string;
  agreedBy: string[]; // agentIds
  createdAt: string;
}

// =============================================================================
// 1.8 Channel
// =============================================================================

export interface Channel {
  id: string;
  workspaceId: string;
  problemId: string;
  messages: ChannelMessage[];
}

export interface ChannelMessage {
  id: string;
  agentId: string;
  content: string;
  timestamp: string; // ISO 8601
}

// =============================================================================
// Hub Operation Types (from ADR Section 2)
// =============================================================================

export type HubOperation =
  // Identity
  | 'register'
  | 'whoami'
  // Workspaces
  | 'create_workspace'
  | 'join_workspace'
  | 'list_workspaces'
  | 'workspace_status'
  // Problems
  | 'create_problem'
  | 'claim_problem'
  | 'update_problem'
  | 'list_problems'
  // Proposals
  | 'create_proposal'
  | 'review_proposal'
  | 'merge_proposal'
  | 'list_proposals'
  // Consensus
  | 'mark_consensus'
  | 'endorse_consensus'
  | 'list_consensus'
  // Channels
  | 'post_message'
  | 'read_channel';

// =============================================================================
// Progressive Disclosure Stages (from ADR Section 6)
// =============================================================================

export type DisclosureStage = 0 | 1 | 2;

/** Operations available at each disclosure stage */
export const STAGE_OPERATIONS: Record<DisclosureStage, HubOperation[]> = {
  0: ['register', 'list_workspaces'],
  1: ['whoami', 'create_workspace', 'join_workspace'],
  2: [
    'create_problem', 'claim_problem', 'update_problem', 'list_problems',
    'create_proposal', 'review_proposal', 'merge_proposal', 'list_proposals',
    'mark_consensus', 'endorse_consensus', 'list_consensus',
    'post_message', 'read_channel',
    'workspace_status',
  ],
};

// =============================================================================
// Hub Storage Interface Extension
// =============================================================================

/**
 * Storage operations needed by the hub layer.
 * Extends the existing ThoughtboxStorage with hub-specific persistence.
 */
export interface HubStorage {
  // Agent registry
  getAgents(): Promise<AgentIdentity[]>;
  saveAgent(agent: AgentIdentity): Promise<void>;
  getAgent(agentId: string): Promise<AgentIdentity | null>;

  // Workspace operations
  getWorkspace(workspaceId: string): Promise<Workspace | null>;
  saveWorkspace(workspace: Workspace): Promise<void>;
  listWorkspaces(): Promise<Workspace[]>;

  // Problem operations
  getProblem(workspaceId: string, problemId: string): Promise<Problem | null>;
  saveProblem(problem: Problem): Promise<void>;
  listProblems(workspaceId: string): Promise<Problem[]>;

  // Proposal operations
  getProposal(workspaceId: string, proposalId: string): Promise<Proposal | null>;
  saveProposal(proposal: Proposal): Promise<void>;
  listProposals(workspaceId: string): Promise<Proposal[]>;

  // Consensus operations
  getConsensusMarker(workspaceId: string, markerId: string): Promise<ConsensusMarker | null>;
  saveConsensusMarker(marker: ConsensusMarker): Promise<void>;
  listConsensusMarkers(workspaceId: string): Promise<ConsensusMarker[]>;

  // Channel operations
  getChannel(workspaceId: string, problemId: string): Promise<Channel | null>;
  saveChannel(channel: Channel): Promise<void>;
}

// =============================================================================
// Proxy Capability Types (from ADR Section 4)
// =============================================================================

export interface ClientCapabilities {
  tasks?: {
    list?: Record<string, unknown>;
    cancel?: Record<string, unknown>;
    requests?: {
      sampling?: { createMessage?: Record<string, unknown> };
      elicitation?: { create?: Record<string, unknown> };
      tools?: { call?: Record<string, unknown> };
    };
  };
  resources?: {
    subscribe?: boolean;
  };
}

export interface ProxyCapabilities {
  supportsTasks: boolean;
  supportsSubscribe: boolean;
}
