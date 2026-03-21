/**
 * Hub Tool Input Schema — flat Zod schema for MCP tool registration
 *
 * Follows the same pattern as thoughtbox_init, thoughtbox_session, etc.:
 * operation enum + all per-operation fields as optional top-level params.
 */

import { z } from 'zod';

const ProfileEnum = z.enum([
  'MANAGER', 'ARCHITECT', 'DEBUGGER', 'SECURITY', 'RESEARCHER', 'REVIEWER',
]);

const ProblemStatusEnum = z.enum([
  'open', 'in-progress', 'resolved', 'closed',
]);

const ProposalStatusEnum = z.enum([
  'open', 'reviewing', 'merged', 'rejected',
]);

const VerdictEnum = z.enum([
  'approve', 'request-changes', 'reject',
]);

export const HubToolInputSchema = z.object({
  operation: z.enum([
    'register', 'whoami',
    'quick_join', 'create_workspace', 'join_workspace', 'list_workspaces',
    'workspace_status', 'workspace_digest',
    'create_problem', 'claim_problem', 'update_problem', 'list_problems',
    'add_dependency', 'remove_dependency', 'ready_problems', 'blocked_problems',
    'create_sub_problem',
    'create_proposal', 'review_proposal', 'merge_proposal', 'list_proposals',
    'mark_consensus', 'endorse_consensus', 'list_consensus',
    'post_message', 'post_system_message', 'read_channel',
    'get_profile_prompt',
  ]),

  // Cross-cutting: override session-default agent identity
  agentId: z.string().optional()
    .describe('Override session-default agent ID for this call'),

  // Identity (register, quick_join)
  name: z.string().optional()
    .describe('Agent display name (register, quick_join) or consensus name (mark_consensus) or workspace name (create_workspace)'),
  profile: ProfileEnum.optional()
    .describe('Role profile for behavioral priming'),
  clientInfo: z.string().optional()
    .describe('Client identifier, e.g. "claude-code-v1"'),

  // Workspace
  workspaceId: z.string().optional()
    .describe('Target workspace ID'),
  sessionId: z.string().optional()
    .describe('Reuse existing thought session (create_workspace)'),

  // Problems
  problemId: z.string().optional()
    .describe('Problem ID'),
  title: z.string().optional()
    .describe('Title for problem, sub-problem, or proposal'),
  description: z.string().optional()
    .describe('Description for workspace, problem, sub-problem, or proposal'),
  parentId: z.string().optional()
    .describe('Parent problem ID (create_sub_problem)'),
  branchId: z.string().optional()
    .describe('Thought branch name (claim_problem, mark_consensus)'),
  status: ProblemStatusEnum.optional()
    .describe('Problem status filter or update value'),
  resolution: z.string().optional()
    .describe('Resolution summary (update_problem with resolved/closed)'),
  comment: z.string().optional()
    .describe('Comment to add to problem (update_problem)'),
  assignedTo: z.string().optional()
    .describe('Filter by agent ID (list_problems)'),
  dependsOnProblemId: z.string().optional()
    .describe('Dependency target problem ID (add_dependency, remove_dependency)'),

  // Proposals
  proposalId: z.string().optional()
    .describe('Proposal ID'),
  sourceBranch: z.string().optional()
    .describe('Thought branch containing the work (create_proposal)'),
  verdict: VerdictEnum.optional()
    .describe('Review verdict (review_proposal)'),
  reasoning: z.string().optional()
    .describe('Explanation of review verdict (review_proposal)'),
  thoughtRefs: z.array(z.number()).optional()
    .describe('Thought numbers supporting the review (review_proposal)'),
  mergeMessage: z.string().optional()
    .describe('Merge thought content (merge_proposal)'),
  proposalStatus: ProposalStatusEnum.optional()
    .describe('Filter proposals by status (list_proposals)'),

  // Consensus
  consensusId: z.string().optional()
    .describe('Consensus marker ID (endorse_consensus)'),
  thoughtRef: z.number().optional()
    .describe('Thought number for traceability (mark_consensus)'),

  // Channels
  content: z.string().optional()
    .describe('Message content (post_message, post_system_message)'),
  ref: z.object({
    sessionId: z.string().optional(),
    thoughtNumber: z.number().optional(),
    branchId: z.string().optional(),
  }).optional()
    .describe('Thought reference for traceability (post_message, post_system_message)'),
  since: z.string().optional()
    .describe('ISO 8601 timestamp — only return messages after this time (read_channel)'),
});

export type HubToolInput = z.infer<typeof HubToolInputSchema>;
