/**
 * SupabaseStorage Implementation
 *
 * Supabase-backed persistence for deployed Thoughtbox.
 * Implements the same ThoughtboxStorage interface as FileSystemStorage.
 * Uses workspace-scoped isolation for multi-tenancy.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types.js';
import { randomUUID } from 'node:crypto';
import type {
  ThoughtboxStorage,
  Config,
  Session,
  Run,
  SessionStatus,
  CreateSessionParams,
  CreateRunParams,
  SessionFilter,
  ThoughtData,
  IntegrityValidationResult,
  ThoughtNode,
  ThoughtNodeId,
  SessionExport,
} from './types.js';

type SessionRow = Database['public']['Tables']['sessions']['Row'];
type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
type SessionUpdate = Database['public']['Tables']['sessions']['Update'];
type RunRow = Database['public']['Tables']['runs']['Row'];
type RunInsert = Database['public']['Tables']['runs']['Insert'];
type RunUpdate = Database['public']['Tables']['runs']['Update'];
type ThoughtRow = Database['public']['Tables']['thoughts']['Row'];
import { RevisionIndexBuilder } from '../revision/revision-index.js';

export interface SupabaseStorageConfig {
  supabaseUrl: string;
  /** Service role key — used as both the client API key and auth token. Bypasses RLS. */
  serviceRoleKey: string;
  /** The workspace ID this storage instance is strictly scoped to. */
  workspaceId: string;
}

export class SupabaseStorage implements ThoughtboxStorage {
  private supabaseUrl: string;
  private serviceRoleKey: string;
  private workspaceId: string;
  private client: SupabaseClient<Database> | null = null;
  private config: Config | null = null;

  constructor(config: SupabaseStorageConfig) {
    this.supabaseUrl = config.supabaseUrl;
    this.serviceRoleKey = config.serviceRoleKey;
    this.workspaceId = config.workspaceId;
  }

  // ===========================================================================
  // Workspace Scoping
  // ===========================================================================

  async setProject(project: string): Promise<void> {
    // Project scoping is deprecated in favor of strict workspaceId scoping at instantiation.
  }

  getProject(): string {
    return this.workspaceId;
  }

  private ensureClient(): SupabaseClient<Database> {
    if (!this.workspaceId) {
      throw new Error('Workspace scope not established.');
    }
    if (!this.client) {
      this.client = createClient<Database>(this.supabaseUrl, this.serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return this.client;
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  async initialize(): Promise<void> {
    // No-op for Supabase — schema is managed by migrations.
    // Config is in-memory for Supabase mode.
    if (!this.config) {
      this.config = {
        installId: randomUUID(),
        dataDir: ':supabase:',
        disableThoughtLogging: false,
        sessionPartitionGranularity: 'none',
        createdAt: new Date(),
      };
    }
  }

  // ===========================================================================
  // Config Operations
  // ===========================================================================

  async getConfig(): Promise<Config | null> {
    return this.config;
  }

  async updateConfig(attrs: Partial<Config>): Promise<Config> {
    if (!this.config) {
      this.config = {
        installId: attrs.installId || randomUUID(),
        dataDir: attrs.dataDir || ':supabase:',
        disableThoughtLogging: attrs.disableThoughtLogging ?? false,
        sessionPartitionGranularity: attrs.sessionPartitionGranularity || 'none',
        createdAt: new Date(),
      };
    } else {
      this.config = { ...this.config, ...attrs };
    }
    return this.config;
  }

  // ===========================================================================
  // Row Mapping
  // ===========================================================================

  private rowToSession(row: SessionRow): Session {
    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      tags: row.tags || [],
      thoughtCount: row.thought_count,
      branchCount: row.branch_count,
      status: (row.status as SessionStatus) || 'active',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      lastAccessedAt: new Date(row.last_accessed_at || row.updated_at),
    };
  }

  private sessionToRow(params: CreateSessionParams): SessionInsert {
    return {
      id: params.id || randomUUID(),
      workspace_id: this.workspaceId,
      title: params.title,
      description: params.description || null,
      tags: params.tags || [],
      thought_count: 0,
      branch_count: 0,
      status: 'active',
    };
  }

  private rowToRun(row: RunRow): Run {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      sessionId: row.session_id,
      otelSessionId: row.otel_session_id || undefined,
      startedAt: new Date(row.started_at),
      endedAt: row.ended_at ? new Date(row.ended_at) : undefined,
    };
  }

  private runToRow(params: CreateRunParams): RunInsert {
    return {
      id: params.id || randomUUID(),
      workspace_id: this.workspaceId,
      session_id: params.sessionId,
      otel_session_id: params.otelSessionId || null,
      started_at: (params.startedAt || new Date()).toISOString(),
      ended_at: null,
    };
  }

  private rowToThought(row: ThoughtRow): ThoughtData {
    const thought: ThoughtData = {
      thought: row.thought,
      thoughtNumber: row.thought_number,
      totalThoughts: row.total_thoughts,
      nextThoughtNeeded: row.next_thought_needed,
      timestamp: row.timestamp || new Date().toISOString(),
      thoughtType: (row.thought_type as ThoughtData['thoughtType']) || 'reasoning',
    };

    if (row.is_revision) thought.isRevision = true;
    if (row.revises_thought != null) thought.revisesThought = row.revises_thought;
    if (row.branch_from_thought != null) thought.branchFromThought = row.branch_from_thought;
    if (row.branch_id) thought.branchId = row.branch_id;
    if (row.needs_more_thoughts != null) thought.needsMoreThoughts = row.needs_more_thoughts;
    if (row.confidence) thought.confidence = row.confidence as ThoughtData['confidence'];
    if (row.options) thought.options = row.options as ThoughtData['options'];
    if (row.action_result) thought.actionResult = row.action_result as ThoughtData['actionResult'];
    if (row.beliefs) thought.beliefs = row.beliefs as ThoughtData['beliefs'];
    if (row.assumption_change) thought.assumptionChange = row.assumption_change as ThoughtData['assumptionChange'];
    if (row.context_data) thought.contextData = row.context_data as ThoughtData['contextData'];
    if (row.progress_data) thought.progressData = row.progress_data as ThoughtData['progressData'];
    if ((row as Record<string, unknown>).receipt_data) thought.receiptData = (row as Record<string, unknown>).receipt_data as ThoughtData['receiptData'];
    if (row.agent_id) thought.agentId = row.agent_id;
    if (row.agent_name) thought.agentName = row.agent_name;
    if (row.content_hash) thought.contentHash = row.content_hash;
    if (row.parent_hash) thought.parentHash = row.parent_hash;
    if (row.critique) thought.critique = row.critique as ThoughtData['critique'];

    return thought;
  }

  private thoughtToRow(sessionId: string, thought: ThoughtData) {
    return {
      session_id: sessionId,
      workspace_id: this.workspaceId,
      thought_number: thought.thoughtNumber,
      thought: thought.thought,
      total_thoughts: thought.totalThoughts,
      next_thought_needed: thought.nextThoughtNeeded,
      thought_type: thought.thoughtType || 'reasoning',
      is_revision: thought.isRevision || false,
      revises_thought: thought.revisesThought ?? null,
      branch_from_thought: thought.branchFromThought ?? null,
      branch_id: thought.branchId || null,
      needs_more_thoughts: thought.needsMoreThoughts ?? null,
      confidence: thought.confidence ?? null,
      options: thought.options ?? null,
      action_result: thought.actionResult ?? null,
      beliefs: thought.beliefs ?? null,
      assumption_change: thought.assumptionChange ?? null,
      context_data: thought.contextData ?? null,
      progress_data: thought.progressData ?? null,
      ...(thought.receiptData ? { receipt_data: thought.receiptData } : {}),
      agent_id: thought.agentId ?? null,
      agent_name: thought.agentName ?? null,
      content_hash: thought.contentHash ?? null,
      parent_hash: thought.parentHash ?? null,
      critique: thought.critique ?? null,
    };
  }

  // ===========================================================================
  // Session Operations
  // ===========================================================================

  async createSession(params: CreateSessionParams): Promise<Session> {
    const client = this.ensureClient();
    const row = this.sessionToRow(params);

    const { data, error } = await client
      .from('sessions')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`Failed to create session: ${error.message}`);
    return this.rowToSession(data);
  }

  async getSession(id: string): Promise<Session | null> {
    const client = this.ensureClient();
    const { data, error } = await client
      .from('sessions')
      .select()
      .eq('id', id)
      .eq('workspace_id', this.workspaceId)
      .maybeSingle();

    if (error) throw new Error(`Failed to get session: ${error.message}`);
    if (!data) return null;
    return this.rowToSession(data);
  }

  async updateSession(id: string, attrs: Partial<Session>): Promise<Session> {
    const client = this.ensureClient();

    const updateData: SessionUpdate = {
      updated_at: new Date().toISOString(),
    };
    if (attrs.title !== undefined) updateData.title = attrs.title;
    if (attrs.description !== undefined) updateData.description = attrs.description;
    if (attrs.tags !== undefined) updateData.tags = attrs.tags;
    if (attrs.thoughtCount !== undefined) updateData.thought_count = attrs.thoughtCount;
    if (attrs.branchCount !== undefined) updateData.branch_count = attrs.branchCount;
    if (attrs.status !== undefined) {
      updateData.status = attrs.status;
      if (attrs.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (attrs.lastAccessedAt !== undefined) {
      updateData.last_accessed_at = attrs.lastAccessedAt.toISOString();
    }

    const { data, error } = await client
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .eq('workspace_id', this.workspaceId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update session: ${error.message}`);
    return this.rowToSession(data);
  }

  async deleteSession(id: string): Promise<void> {
    const client = this.ensureClient();
    const { error } = await client
      .from('sessions')
      .delete()
      .eq('id', id)
      .eq('workspace_id', this.workspaceId);

    if (error) throw new Error(`Failed to delete session: ${error.message}`);
  }

  async listSessions(filter?: SessionFilter): Promise<Session[]> {
    const client = this.ensureClient();
    let query = client.from('sessions').select().eq('workspace_id', this.workspaceId);

    if (filter?.tags && filter.tags.length > 0) {
      query = query.overlaps('tags', filter.tags);
    }

    if (filter?.search) {
      const escaped = filter.search
        .replace(/\\/g, '\\\\')
        .replace(/,/g, '\\,')
        .replace(/\./g, '\\.');
      query = query.or(
        `title.ilike.%${escaped}%,description.ilike.%${escaped}%`
      );
    }

    const sortBy = filter?.sortBy || 'updatedAt';
    const sortOrder = filter?.sortOrder || 'desc';
    const columnMap: Record<string, string> = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      title: 'title',
    };
    query = query.order(columnMap[sortBy] || 'updated_at', {
      ascending: sortOrder === 'asc',
    });

    if (filter?.offset) {
      const limit = filter?.limit || 100;
      query = query.range(filter.offset, filter.offset + limit - 1);
    } else if (filter?.limit) {
      query = query.limit(filter.limit);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to list sessions: ${error.message}`);
    return (data || []).map((row) => this.rowToSession(row as SessionRow));
  }

  async createRun(params: CreateRunParams): Promise<Run> {
    const client = this.ensureClient();
    const row = this.runToRow(params);
    const { data, error } = await client
      .from('runs')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`Failed to create run: ${error.message}`);
    return this.rowToRun(data);
  }

  async listRunsForSession(sessionId: string): Promise<Run[]> {
    const client = this.ensureClient();
    const { data, error } = await client
      .from('runs')
      .select()
      .eq('workspace_id', this.workspaceId)
      .eq('session_id', sessionId)
      .order('started_at', { ascending: true });

    if (error) throw new Error(`Failed to list runs: ${error.message}`);
    return (data || []).map((row) => this.rowToRun(row));
  }

  async bindRunOtelSession(
    sessionId: string,
    otelSessionId: string,
    attrs?: { endedAt?: Date },
  ): Promise<Run | null> {
    const client = this.ensureClient();
    const { data, error } = await client
      .from('runs')
      .select()
      .eq('workspace_id', this.workspaceId)
      .eq('session_id', sessionId)
      .or(`otel_session_id.is.null,otel_session_id.eq.${otelSessionId}`)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Failed to find run for OTEL binding: ${error.message}`);
    if (!data) return null;

    const update: RunUpdate = { otel_session_id: otelSessionId };
    if (attrs?.endedAt) {
      update.ended_at = attrs.endedAt.toISOString();
    }

    const { data: updated, error: updateError } = await client
      .from('runs')
      .update(update)
      .eq('id', data.id)
      .eq('workspace_id', this.workspaceId)
      .select()
      .single();

    if (updateError) throw new Error(`Failed to bind OTEL session to run: ${updateError.message}`);
    return this.rowToRun(updated);
  }

  async endRunsForSession(sessionId: string, endedAt = new Date()): Promise<void> {
    const client = this.ensureClient();
    const { error } = await client
      .from('runs')
      .update({ ended_at: endedAt.toISOString() })
      .eq('workspace_id', this.workspaceId)
      .eq('session_id', sessionId)
      .is('ended_at', null);

    if (error) throw new Error(`Failed to end runs for session: ${error.message}`);
  }

  // ===========================================================================
  // Thought Operations
  // ===========================================================================

  async saveThought(sessionId: string, thought: ThoughtData): Promise<void> {
    const client = this.ensureClient();
    const enriched: ThoughtData = {
      ...thought,
      timestamp: thought.timestamp || new Date().toISOString(),
    };
    const row = this.thoughtToRow(sessionId, enriched);

    const { error } = await client.from('thoughts').insert(row);
    if (error) throw new Error(`Failed to save thought: ${error.message}`);
  }

  async getThoughts(sessionId: string): Promise<ThoughtData[]> {
    const client = this.ensureClient();
    const { data, error } = await client
      .from('thoughts')
      .select()
      .eq('session_id', sessionId)
      .eq('workspace_id', this.workspaceId)
      .is('branch_id', null)
      .order('thought_number', { ascending: true });

    if (error) throw new Error(`Failed to get thoughts: ${error.message}`);
    return (data || []).map((row) => this.rowToThought(row as ThoughtRow));
  }

  async getAllThoughts(sessionId: string): Promise<ThoughtData[]> {
    const client = this.ensureClient();
    const { data, error } = await client
      .from('thoughts')
      .select()
      .eq('session_id', sessionId)
      .eq('workspace_id', this.workspaceId)
      .order('thought_number', { ascending: true });

    if (error) throw new Error(`Failed to get all thoughts: ${error.message}`);
    return (data || []).map((row) => this.rowToThought(row as ThoughtRow));
  }

  async getBranchIds(sessionId: string): Promise<string[]> {
    const client = this.ensureClient();
    const { data, error } = await client
      .from('thoughts')
      .select('branch_id')
      .eq('session_id', sessionId)
      .eq('workspace_id', this.workspaceId)
      .not('branch_id', 'is', null);

    if (error) throw new Error(`Failed to get branch IDs: ${error.message}`);
    const ids = new Set<string>();
    for (const row of data || []) {
      if (row.branch_id) ids.add(row.branch_id as string);
    }
    return Array.from(ids);
  }

  async getThought(sessionId: string, thoughtNumber: number): Promise<ThoughtData | null> {
    const client = this.ensureClient();
    const { data, error } = await client
      .from('thoughts')
      .select()
      .eq('session_id', sessionId)
      .eq('workspace_id', this.workspaceId)
      .eq('thought_number', thoughtNumber)
      .is('branch_id', null)
      .maybeSingle();

    if (error) throw new Error(`Failed to get thought: ${error.message}`);
    if (!data) return null;
    return this.rowToThought(data);
  }

  async saveBranchThought(
    sessionId: string,
    branchId: string,
    thought: ThoughtData,
  ): Promise<void> {
    const client = this.ensureClient();
    const enriched: ThoughtData = {
      ...thought,
      branchId,
      timestamp: thought.timestamp || new Date().toISOString(),
    };
    const row = this.thoughtToRow(sessionId, enriched);

    const { error } = await client.from('thoughts').insert(row);
    if (error) throw new Error(`Failed to save branch thought: ${error.message}`);
  }

  async getBranch(sessionId: string, branchId: string): Promise<ThoughtData[]> {
    const client = this.ensureClient();
    const { data, error } = await client
      .from('thoughts')
      .select()
      .eq('session_id', sessionId)
      .eq('workspace_id', this.workspaceId)
      .eq('branch_id', branchId)
      .order('thought_number', { ascending: true });

    if (error) throw new Error(`Failed to get branch: ${error.message}`);
    return (data || []).map((row) => this.rowToThought(row as ThoughtRow));
  }

  async updateThoughtCritique(
    sessionId: string,
    thoughtNumber: number,
    critique: { text: string; model: string; timestamp: string },
  ): Promise<void> {
    const client = this.ensureClient();
    const { error } = await client
      .from('thoughts')
      .update({ critique })
      .eq('session_id', sessionId)
      .eq('workspace_id', this.workspaceId)
      .eq('thought_number', thoughtNumber)
      .is('branch_id', null);

    if (error) throw new Error(`Failed to update critique: ${error.message}`);
  }

  // ===========================================================================
  // Export Operations
  // ===========================================================================

  async exportSession(sessionId: string, format: 'json' | 'markdown'): Promise<string> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const thoughts = await this.getThoughts(sessionId);
    const branchIds = await this.getBranchIds(sessionId);

    if (format === 'json') {
      const branchEntries = await Promise.all(
        branchIds.map(async (branchId) => [branchId, await this.getBranch(sessionId, branchId)] as const)
      );
      const branchData = Object.fromEntries(branchEntries);
      return JSON.stringify({ session, thoughts, branches: branchData }, null, 2);
    }

    const lines: string[] = [
      `# ${session.title}`,
      '',
      session.description ? `> ${session.description}` : '',
      session.description ? '' : '',
      `**Tags:** ${session.tags.length > 0 ? session.tags.join(', ') : 'none'}`,
      `**Created:** ${session.createdAt.toISOString()}`,
      `**Updated:** ${session.updatedAt.toISOString()}`,
      '',
      '---',
      '',
      '## Reasoning Chain',
      '',
    ];

    for (const thought of thoughts) {
      lines.push(`### Thought ${thought.thoughtNumber}/${thought.totalThoughts}`);
      if (thought.isRevision) {
        lines.push(`*Revision of thought ${thought.revisesThought}*`);
      }
      if (thought.branchFromThought) {
        lines.push(`*Branch "${thought.branchId}" from thought ${thought.branchFromThought}*`);
      }
      lines.push('');
      lines.push(thought.thought);
      lines.push('');
    }

    if (branchIds.length > 0) {
      lines.push('---');
      lines.push('');
      lines.push('## Branches');
      lines.push('');

      const branchEntries = await Promise.all(
        branchIds.map(async (branchId) => [branchId, await this.getBranch(sessionId, branchId)] as const)
      );

      for (const [branchId, branchThoughts] of branchEntries) {
        lines.push(`### Branch: ${branchId}`);
        lines.push('');
        for (const thought of branchThoughts) {
          lines.push(`#### Thought ${thought.thoughtNumber}/${thought.totalThoughts}`);
          lines.push('');
          lines.push(thought.thought);
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  }

  async toLinkedExport(sessionId: string): Promise<SessionExport> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const allThoughts = await this.getAllThoughts(sessionId);

    // Reconstruct ThoughtNode linked list from ordered rows
    const nodes: ThoughtNode[] = [];
    const nodeMap = new Map<ThoughtNodeId, ThoughtNode>();

    for (const thought of allThoughts) {
      const nodeId = this.generateNodeId(sessionId, thought.thoughtNumber, thought.branchId);

      let prevNodeId: ThoughtNodeId | null = null;
      if (thought.branchFromThought) {
        prevNodeId = this.generateNodeId(sessionId, thought.branchFromThought);
      } else if (thought.branchId) {
        let maxNum = 0;
        let prevBranchId: ThoughtNodeId | null = null;
        for (const [existingId, existingNode] of nodeMap) {
          if (
            existingNode.branchId === thought.branchId &&
            existingNode.data.thoughtNumber < thought.thoughtNumber &&
            existingNode.data.thoughtNumber > maxNum
          ) {
            maxNum = existingNode.data.thoughtNumber;
            prevBranchId = existingId;
          }
        }
        prevNodeId = prevBranchId;
      } else {
        let maxNum = 0;
        let prevMainId: ThoughtNodeId | null = null;
        for (const [existingId, existingNode] of nodeMap) {
          if (
            !existingNode.branchId &&
            existingNode.data.thoughtNumber < thought.thoughtNumber &&
            existingNode.data.thoughtNumber > maxNum
          ) {
            maxNum = existingNode.data.thoughtNumber;
            prevMainId = existingId;
          }
        }
        prevNodeId = prevMainId;
      }

      const node: ThoughtNode = {
        id: nodeId,
        data: thought,
        prev: prevNodeId,
        next: [],
        revisesNode: thought.revisesThought
          ? this.generateNodeId(sessionId, thought.revisesThought, thought.branchId)
          : null,
        branchOrigin: thought.branchFromThought
          ? this.generateNodeId(sessionId, thought.branchFromThought)
          : null,
        branchId: thought.branchId || null,
      };

      nodeMap.set(nodeId, node);
      nodes.push(node);

      if (prevNodeId) {
        const prevNode = nodeMap.get(prevNodeId);
        if (prevNode && !prevNode.next.includes(nodeId)) {
          prevNode.next.push(nodeId);
        }
      }
    }

    const indexBuilder = new RevisionIndexBuilder();
    const revisionIndex = indexBuilder.buildIndex(nodes);

    const nodesWithMetadata = nodes.map(node => ({
      ...node,
      revisionMetadata: revisionIndex.get(node.data.thoughtNumber),
    }));

    return {
      version: '1.0',
      session,
      nodes: nodesWithMetadata,
      exportedAt: new Date().toISOString(),
    };
  }

  private generateNodeId(
    sessionId: string,
    thoughtNumber: number,
    branchId?: string | null,
  ): ThoughtNodeId {
    if (branchId) {
      return `${sessionId}:${branchId}:${thoughtNumber}`;
    }
    return `${sessionId}:${thoughtNumber}`;
  }

  // ===========================================================================
  // Integrity Operations
  // ===========================================================================

  async validateSessionIntegrity(sessionId: string): Promise<IntegrityValidationResult> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return {
        valid: false,
        sessionExists: false,
        manifestExists: false,
        manifestValid: false,
        missingThoughtFiles: [],
        missingBranchFiles: {},
        errors: [`Session ${sessionId} not found`],
      };
    }

    return {
      valid: true,
      sessionExists: true,
      manifestExists: true,
      manifestValid: true,
      missingThoughtFiles: [],
      missingBranchFiles: {},
      errors: [],
    };
  }
}
