/**
 * SupabaseHubStorage — Postgres-backed hub coordination storage
 *
 * SPEC-V1-INITIATIVE Phase 4.3 (claim c11). Implements the HubStorage
 * interface over the hub_* tables, scoped to a single tenant workspace.
 *
 * Concurrency model:
 * - Append-heavy children are rows: channel messages, proposal reviews,
 *   consensus endorsements. `appendMessage`/`appendReview`/
 *   `appendEndorsement` insert rows, so concurrent writers on different
 *   server instances never lose appends.
 * - Remaining aggregates (workspaces, problems, proposals) use optimistic
 *   concurrency: rows carry a `version` column; `save*` of an object read
 *   through this instance performs a compare-and-swap on `version` and
 *   throws on conflict instead of silently overwriting.
 * - `saveProposal` never writes reviews and `saveConsensusMarker`/
 *   `saveChannel` only add (never remove) endorsement/message rows, so
 *   stale aggregates cannot erase concurrent appends.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '../database.types.js';
import type {
  HubStorage,
  AgentIdentity,
  Workspace,
  WorkspaceAgent,
  Problem,
  ProblemStatus,
  Proposal,
  ProposalStatus,
  Review,
  ReviewVerdict,
  ConsensusMarker,
  Channel,
  ChannelMessage,
  Comment,
} from './hub-types.js';

type Tables = Database['public']['Tables'];
type AgentRow = Tables['hub_agents']['Row'];
type WorkspaceRow = Tables['hub_workspaces']['Row'];
type ProblemRow = Tables['hub_problems']['Row'];
type ProposalRow = Tables['hub_proposals']['Row'];
type ReviewRow = Tables['hub_proposal_reviews']['Row'];
type MarkerRow = Tables['hub_consensus_markers']['Row'];
type EndorsementRow = Tables['hub_consensus_endorsements']['Row'];
type ChannelRow = Tables['hub_channels']['Row'];
type MessageRow = Tables['hub_channel_messages']['Row'];

export interface SupabaseHubStorageConfig {
  supabaseUrl: string;
  /** Service role key — bypasses RLS; tenant isolation is enforced in queries. */
  serviceRoleKey: string;
  /** SaaS workspace (public.workspaces.id) all hub rows are scoped to. */
  tenantWorkspaceId: string;
}

function toIso(timestamp: string): string {
  return new Date(timestamp).toISOString();
}

export class SupabaseHubStorage implements HubStorage {
  private client: SupabaseClient<Database>;
  private tenantWorkspaceId: string;
  /** Versions of aggregates read through this instance (optimistic CAS). */
  private versions = new WeakMap<object, number>();

  constructor(config: SupabaseHubStorageConfig) {
    this.tenantWorkspaceId = config.tenantWorkspaceId;
    this.client = createClient<Database>(config.supabaseUrl, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private fail(operation: string, message: string): never {
    throw new Error(
      `SupabaseHubStorage.${operation} failed (tenant ${this.tenantWorkspaceId}): ${message}`,
    );
  }

  // ===========================================================================
  // Agent registry (global across tenants per SCOPE-LAYER-2)
  // ===========================================================================

  private rowToAgent(row: AgentRow): AgentIdentity {
    return {
      agentId: row.agent_id,
      name: row.name,
      role: row.role as AgentIdentity['role'],
      ...(row.profile !== null ? { profile: row.profile } : {}),
      ...(row.client_info !== null ? { clientInfo: row.client_info } : {}),
      registeredAt: toIso(row.registered_at),
    };
  }

  async getAgents(): Promise<AgentIdentity[]> {
    const { data, error } = await this.client
      .from('hub_agents')
      .select()
      .order('registered_at', { ascending: true });
    if (error) this.fail('getAgents', error.message);
    return (data ?? []).map(row => this.rowToAgent(row));
  }

  async saveAgent(agent: AgentIdentity): Promise<void> {
    const { error } = await this.client.from('hub_agents').upsert(
      {
        agent_id: agent.agentId,
        name: agent.name,
        role: agent.role,
        profile: agent.profile ?? null,
        client_info: agent.clientInfo ?? null,
        registered_at: agent.registeredAt,
      },
      { onConflict: 'agent_id' },
    );
    if (error) this.fail('saveAgent', error.message);
  }

  async getAgent(agentId: string): Promise<AgentIdentity | null> {
    const { data, error } = await this.client
      .from('hub_agents')
      .select()
      .eq('agent_id', agentId)
      .maybeSingle();
    if (error) this.fail('getAgent', error.message);
    return data ? this.rowToAgent(data) : null;
  }

  // ===========================================================================
  // Workspaces
  // ===========================================================================

  private rowToWorkspace(row: WorkspaceRow): Workspace {
    const workspace: Workspace = {
      id: row.id,
      name: row.name,
      description: row.description,
      createdBy: row.created_by,
      mainSessionId: row.main_session_id,
      agents: row.agents as unknown as WorkspaceAgent[],
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
    };
    this.versions.set(workspace, row.version);
    return workspace;
  }

  async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    const { data, error } = await this.client
      .from('hub_workspaces')
      .select()
      .eq('id', workspaceId)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .maybeSingle();
    if (error) this.fail('getWorkspace', error.message);
    return data ? this.rowToWorkspace(data) : null;
  }

  async saveWorkspace(workspace: Workspace): Promise<void> {
    const fields = {
      name: workspace.name,
      description: workspace.description,
      main_session_id: workspace.mainSessionId,
      agents: workspace.agents as unknown as Json,
      updated_at: workspace.updatedAt,
    };
    const expected = this.versions.get(workspace);
    if (expected === undefined) {
      const { error } = await this.client.from('hub_workspaces').insert({
        id: workspace.id,
        tenant_workspace_id: this.tenantWorkspaceId,
        created_by: workspace.createdBy,
        created_at: workspace.createdAt,
        version: 1,
        ...fields,
      });
      if (error) this.fail('saveWorkspace', error.message);
      this.versions.set(workspace, 1);
      return;
    }
    const { data, error } = await this.client
      .from('hub_workspaces')
      .update({ ...fields, version: expected + 1 })
      .eq('id', workspace.id)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .eq('version', expected)
      .select('version');
    if (error) this.fail('saveWorkspace', error.message);
    if (!data || data.length === 0) {
      this.fail(
        'saveWorkspace',
        `concurrent update detected for hub workspace ${workspace.id}; reload and retry`,
      );
    }
    this.versions.set(workspace, expected + 1);
  }

  async listWorkspaces(): Promise<Workspace[]> {
    const { data, error } = await this.client
      .from('hub_workspaces')
      .select()
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .order('created_at', { ascending: true });
    if (error) this.fail('listWorkspaces', error.message);
    return (data ?? []).map(row => this.rowToWorkspace(row));
  }

  // ===========================================================================
  // Problems
  // ===========================================================================

  private rowToProblem(row: ProblemRow): Problem {
    const dependsOn = row.depends_on as unknown as string[];
    const problem: Problem = {
      id: row.id,
      workspaceId: row.workspace_id,
      title: row.title,
      description: row.description,
      createdBy: row.created_by,
      ...(row.assigned_to !== null ? { assignedTo: row.assigned_to } : {}),
      status: row.status as ProblemStatus,
      ...(row.branch_id !== null ? { branchId: row.branch_id } : {}),
      ...(row.branch_from_thought !== null
        ? { branchFromThought: row.branch_from_thought }
        : {}),
      ...(row.resolution !== null ? { resolution: row.resolution } : {}),
      ...(dependsOn.length > 0 ? { dependsOn } : {}),
      ...(row.parent_id !== null ? { parentId: row.parent_id } : {}),
      comments: row.comments as unknown as Comment[],
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
    };
    this.versions.set(problem, row.version);
    return problem;
  }

  async getProblem(workspaceId: string, problemId: string): Promise<Problem | null> {
    const { data, error } = await this.client
      .from('hub_problems')
      .select()
      .eq('id', problemId)
      .eq('workspace_id', workspaceId)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .maybeSingle();
    if (error) this.fail('getProblem', error.message);
    return data ? this.rowToProblem(data) : null;
  }

  async saveProblem(problem: Problem): Promise<void> {
    const fields = {
      title: problem.title,
      description: problem.description,
      assigned_to: problem.assignedTo ?? null,
      status: problem.status,
      branch_id: problem.branchId ?? null,
      branch_from_thought: problem.branchFromThought ?? null,
      resolution: problem.resolution ?? null,
      depends_on: (problem.dependsOn ?? []) as unknown as Json,
      parent_id: problem.parentId ?? null,
      comments: problem.comments as unknown as Json,
      updated_at: problem.updatedAt,
    };
    const expected = this.versions.get(problem);
    if (expected === undefined) {
      const { error } = await this.client.from('hub_problems').insert({
        id: problem.id,
        workspace_id: problem.workspaceId,
        tenant_workspace_id: this.tenantWorkspaceId,
        created_by: problem.createdBy,
        created_at: problem.createdAt,
        version: 1,
        ...fields,
      });
      if (error) this.fail('saveProblem', error.message);
      this.versions.set(problem, 1);
      return;
    }
    const { data, error } = await this.client
      .from('hub_problems')
      .update({ ...fields, version: expected + 1 })
      .eq('id', problem.id)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .eq('version', expected)
      .select('version');
    if (error) this.fail('saveProblem', error.message);
    if (!data || data.length === 0) {
      this.fail(
        'saveProblem',
        `concurrent update detected for hub problem ${problem.id}; reload and retry`,
      );
    }
    this.versions.set(problem, expected + 1);
  }

  async listProblems(workspaceId: string): Promise<Problem[]> {
    const { data, error } = await this.client
      .from('hub_problems')
      .select()
      .eq('workspace_id', workspaceId)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .order('created_at', { ascending: true });
    if (error) this.fail('listProblems', error.message);
    return (data ?? []).map(row => this.rowToProblem(row));
  }

  // ===========================================================================
  // Proposals (reviews are rows in hub_proposal_reviews)
  // ===========================================================================

  private rowToReview(row: ReviewRow): Review {
    return {
      id: row.id,
      proposalId: row.proposal_id,
      reviewerId: row.reviewer_id,
      verdict: row.verdict as ReviewVerdict,
      reasoning: row.reasoning,
      ...(row.thought_refs !== null
        ? { thoughtRefs: row.thought_refs as unknown as number[] }
        : {}),
      createdAt: toIso(row.created_at),
    };
  }

  private rowToProposal(row: ProposalRow, reviews: Review[]): Proposal {
    const proposal: Proposal = {
      id: row.id,
      workspaceId: row.workspace_id,
      title: row.title,
      description: row.description,
      createdBy: row.created_by,
      sourceBranch: row.source_branch,
      ...(row.problem_id !== null ? { problemId: row.problem_id } : {}),
      status: row.status as ProposalStatus,
      reviews,
      ...(row.merge_thought_number !== null
        ? { mergeThoughtNumber: row.merge_thought_number }
        : {}),
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
    };
    this.versions.set(proposal, row.version);
    return proposal;
  }

  private reviewToRow(proposalId: string, review: Review) {
    return {
      id: review.id,
      proposal_id: proposalId,
      tenant_workspace_id: this.tenantWorkspaceId,
      reviewer_id: review.reviewerId,
      verdict: review.verdict,
      reasoning: review.reasoning,
      thought_refs: (review.thoughtRefs ?? null) as unknown as Json,
      created_at: review.createdAt,
    };
  }

  private async listReviews(proposalIds: string[]): Promise<Map<string, Review[]>> {
    const grouped = new Map<string, Review[]>();
    if (proposalIds.length === 0) return grouped;
    const { data, error } = await this.client
      .from('hub_proposal_reviews')
      .select()
      .in('proposal_id', proposalIds)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });
    if (error) this.fail('listReviews', error.message);
    for (const row of data ?? []) {
      const reviews = grouped.get(row.proposal_id) ?? [];
      reviews.push(this.rowToReview(row));
      grouped.set(row.proposal_id, reviews);
    }
    return grouped;
  }

  async getProposal(workspaceId: string, proposalId: string): Promise<Proposal | null> {
    const { data, error } = await this.client
      .from('hub_proposals')
      .select()
      .eq('id', proposalId)
      .eq('workspace_id', workspaceId)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .maybeSingle();
    if (error) this.fail('getProposal', error.message);
    if (!data) return null;
    const reviews = await this.listReviews([data.id]);
    return this.rowToProposal(data, reviews.get(data.id) ?? []);
  }

  async saveProposal(proposal: Proposal): Promise<void> {
    const fields = {
      title: proposal.title,
      description: proposal.description,
      source_branch: proposal.sourceBranch,
      problem_id: proposal.problemId ?? null,
      status: proposal.status,
      merge_thought_number: proposal.mergeThoughtNumber ?? null,
      updated_at: proposal.updatedAt,
    };
    const expected = this.versions.get(proposal);
    if (expected === undefined) {
      const { error } = await this.client.from('hub_proposals').insert({
        id: proposal.id,
        workspace_id: proposal.workspaceId,
        tenant_workspace_id: this.tenantWorkspaceId,
        created_by: proposal.createdBy,
        created_at: proposal.createdAt,
        version: 1,
        ...fields,
      });
      if (error) this.fail('saveProposal', error.message);
      this.versions.set(proposal, 1);
      if (proposal.reviews.length > 0) {
        const { error: reviewError } = await this.client
          .from('hub_proposal_reviews')
          .upsert(
            proposal.reviews.map(review => this.reviewToRow(proposal.id, review)),
            { onConflict: 'id', ignoreDuplicates: true },
          );
        if (reviewError) this.fail('saveProposal', reviewError.message);
      }
      return;
    }
    const { data, error } = await this.client
      .from('hub_proposals')
      .update({ ...fields, version: expected + 1 })
      .eq('id', proposal.id)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .eq('version', expected)
      .select('version');
    if (error) this.fail('saveProposal', error.message);
    if (!data || data.length === 0) {
      this.fail(
        'saveProposal',
        `concurrent update detected for hub proposal ${proposal.id}; reload and retry`,
      );
    }
    this.versions.set(proposal, expected + 1);
  }

  async listProposals(workspaceId: string): Promise<Proposal[]> {
    const { data, error } = await this.client
      .from('hub_proposals')
      .select()
      .eq('workspace_id', workspaceId)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .order('created_at', { ascending: true });
    if (error) this.fail('listProposals', error.message);
    const rows = data ?? [];
    const reviews = await this.listReviews(rows.map(row => row.id));
    return rows.map(row => this.rowToProposal(row, reviews.get(row.id) ?? []));
  }

  async appendReview(workspaceId: string, proposalId: string, review: Review): Promise<void> {
    const { data: existing, error: lookupError } = await this.client
      .from('hub_proposals')
      .select('id')
      .eq('id', proposalId)
      .eq('workspace_id', workspaceId)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .maybeSingle();
    if (lookupError) this.fail('appendReview', lookupError.message);
    if (!existing) this.fail('appendReview', `Proposal not found: ${proposalId}`);

    // Upsert with ignoreDuplicates keeps appendReview idempotent on review
    // id (at-least-once retries), matching the filesystem backend.
    const { error } = await this.client
      .from('hub_proposal_reviews')
      .upsert(this.reviewToRow(proposalId, review), {
        onConflict: 'id',
        ignoreDuplicates: true,
      });
    if (error) this.fail('appendReview', error.message);

    // Monotonic status transition; guarded so a concurrent merge cannot be
    // reverted. Intentionally does not bump `version` (no aggregate fields
    // are read-modify-written here).
    const { error: statusError } = await this.client
      .from('hub_proposals')
      .update({ status: 'reviewing', updated_at: new Date().toISOString() })
      .eq('id', proposalId)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .in('status', ['open', 'reviewing']);
    if (statusError) this.fail('appendReview', statusError.message);
  }

  // ===========================================================================
  // Consensus markers (endorsements are rows in hub_consensus_endorsements)
  // ===========================================================================

  private rowToMarker(row: MarkerRow, endorsements: EndorsementRow[]): ConsensusMarker {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      description: row.description,
      thoughtRef: row.thought_ref,
      ...(row.branch_id !== null ? { branchId: row.branch_id } : {}),
      agreedBy: endorsements.map(endorsement => endorsement.agent_id),
      createdAt: toIso(row.created_at),
    };
  }

  private async listEndorsements(markerIds: string[]): Promise<Map<string, EndorsementRow[]>> {
    const grouped = new Map<string, EndorsementRow[]>();
    if (markerIds.length === 0) return grouped;
    const { data, error } = await this.client
      .from('hub_consensus_endorsements')
      .select()
      .in('marker_id', markerIds)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .order('created_at', { ascending: true })
      .order('agent_id', { ascending: true });
    if (error) this.fail('listEndorsements', error.message);
    for (const row of data ?? []) {
      const rows = grouped.get(row.marker_id) ?? [];
      rows.push(row);
      grouped.set(row.marker_id, rows);
    }
    return grouped;
  }

  async getConsensusMarker(
    workspaceId: string,
    markerId: string,
  ): Promise<ConsensusMarker | null> {
    const { data, error } = await this.client
      .from('hub_consensus_markers')
      .select()
      .eq('id', markerId)
      .eq('workspace_id', workspaceId)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .maybeSingle();
    if (error) this.fail('getConsensusMarker', error.message);
    if (!data) return null;
    const endorsements = await this.listEndorsements([data.id]);
    return this.rowToMarker(data, endorsements.get(data.id) ?? []);
  }

  async saveConsensusMarker(marker: ConsensusMarker): Promise<void> {
    const { error } = await this.client.from('hub_consensus_markers').upsert(
      {
        id: marker.id,
        workspace_id: marker.workspaceId,
        tenant_workspace_id: this.tenantWorkspaceId,
        name: marker.name,
        description: marker.description,
        thought_ref: marker.thoughtRef,
        branch_id: marker.branchId ?? null,
        created_at: marker.createdAt,
      },
      { onConflict: 'id' },
    );
    if (error) this.fail('saveConsensusMarker', error.message);
    if (marker.agreedBy.length > 0) {
      const { error: endorseError } = await this.client
        .from('hub_consensus_endorsements')
        .upsert(
          marker.agreedBy.map(agentId => ({
            marker_id: marker.id,
            agent_id: agentId,
            tenant_workspace_id: this.tenantWorkspaceId,
          })),
          { onConflict: 'marker_id,agent_id', ignoreDuplicates: true },
        );
      if (endorseError) this.fail('saveConsensusMarker', endorseError.message);
    }
  }

  async listConsensusMarkers(workspaceId: string): Promise<ConsensusMarker[]> {
    const { data, error } = await this.client
      .from('hub_consensus_markers')
      .select()
      .eq('workspace_id', workspaceId)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .order('created_at', { ascending: true });
    if (error) this.fail('listConsensusMarkers', error.message);
    const rows = data ?? [];
    const endorsements = await this.listEndorsements(rows.map(row => row.id));
    return rows.map(row => this.rowToMarker(row, endorsements.get(row.id) ?? []));
  }

  async appendEndorsement(
    workspaceId: string,
    markerId: string,
    agentId: string,
  ): Promise<void> {
    const { data: existing, error: lookupError } = await this.client
      .from('hub_consensus_markers')
      .select('id')
      .eq('id', markerId)
      .eq('workspace_id', workspaceId)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .maybeSingle();
    if (lookupError) this.fail('appendEndorsement', lookupError.message);
    if (!existing) this.fail('appendEndorsement', `Consensus marker not found: ${markerId}`);

    const { error } = await this.client.from('hub_consensus_endorsements').upsert(
      {
        marker_id: markerId,
        agent_id: agentId,
        tenant_workspace_id: this.tenantWorkspaceId,
      },
      { onConflict: 'marker_id,agent_id', ignoreDuplicates: true },
    );
    if (error) this.fail('appendEndorsement', error.message);
  }

  // ===========================================================================
  // Channels (messages are rows in hub_channel_messages)
  // ===========================================================================

  private rowToMessage(row: MessageRow): ChannelMessage {
    return {
      id: row.id,
      agentId: row.agent_id,
      content: row.content,
      timestamp: toIso(row.created_at),
      ...(row.ref !== null ? { ref: row.ref as ChannelMessage['ref'] } : {}),
    };
  }

  private messageToRow(channelId: string, message: ChannelMessage) {
    return {
      id: message.id,
      channel_id: channelId,
      tenant_workspace_id: this.tenantWorkspaceId,
      agent_id: message.agentId,
      content: message.content,
      ref: (message.ref ?? null) as unknown as Json,
      created_at: message.timestamp,
    };
  }

  private async findChannelRow(
    workspaceId: string,
    problemId: string,
  ): Promise<ChannelRow | null> {
    const { data, error } = await this.client
      .from('hub_channels')
      .select()
      .eq('workspace_id', workspaceId)
      .eq('problem_id', problemId)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .maybeSingle();
    if (error) this.fail('getChannel', error.message);
    return data;
  }

  async getChannel(workspaceId: string, problemId: string): Promise<Channel | null> {
    const row = await this.findChannelRow(workspaceId, problemId);
    if (!row) return null;
    const { data, error } = await this.client
      .from('hub_channel_messages')
      .select()
      .eq('channel_id', row.id)
      .eq('tenant_workspace_id', this.tenantWorkspaceId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });
    if (error) this.fail('getChannel', error.message);
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      problemId: row.problem_id,
      messages: (data ?? []).map(message => this.rowToMessage(message)),
    };
  }

  async saveChannel(channel: Channel): Promise<void> {
    const { error } = await this.client.from('hub_channels').upsert(
      {
        id: channel.id,
        workspace_id: channel.workspaceId,
        tenant_workspace_id: this.tenantWorkspaceId,
        problem_id: channel.problemId,
      },
      { onConflict: 'id' },
    );
    if (error) this.fail('saveChannel', error.message);
    if (channel.messages.length > 0) {
      const { error: messageError } = await this.client
        .from('hub_channel_messages')
        .upsert(
          channel.messages.map(message => this.messageToRow(channel.id, message)),
          { onConflict: 'channel_id,id', ignoreDuplicates: true },
        );
      if (messageError) this.fail('saveChannel', messageError.message);
    }
  }

  async appendMessage(
    workspaceId: string,
    problemId: string,
    message: ChannelMessage,
  ): Promise<number> {
    const row = await this.findChannelRow(workspaceId, problemId);
    if (!row) this.fail('appendMessage', `Channel not found for problem: ${problemId}`);

    const { error } = await this.client
      .from('hub_channel_messages')
      .insert(this.messageToRow(row.id, message));
    if (error) this.fail('appendMessage', error.message);

    // The returned channelMessageCount is informational only: it is read in
    // a separate query after the insert, so under concurrent appends it may
    // exceed this message's ordinal position.
    const { count, error: countError } = await this.client
      .from('hub_channel_messages')
      .select('id', { count: 'exact', head: true })
      .eq('channel_id', row.id)
      .eq('tenant_workspace_id', this.tenantWorkspaceId);
    if (countError) this.fail('appendMessage', countError.message);
    return count ?? 0;
  }
}

/**
 * Per-tenant SupabaseHubStorage provider for multi-tenant mode. Instances
 * are cached per tenant workspace; all rows are scoped by
 * tenant_workspace_id so tb.hub can never read another tenant's hub state.
 */
export function createSupabaseHubStorageProvider(
  config: Omit<SupabaseHubStorageConfig, 'tenantWorkspaceId'>,
): (tenantWorkspaceId: string) => HubStorage {
  const cache = new Map<string, HubStorage>();
  return (tenantWorkspaceId: string): HubStorage => {
    let storage = cache.get(tenantWorkspaceId);
    if (!storage) {
      storage = new SupabaseHubStorage({ ...config, tenantWorkspaceId });
      cache.set(tenantWorkspaceId, storage);
    }
    return storage;
  };
}
