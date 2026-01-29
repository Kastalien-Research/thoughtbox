/**
 * InMemoryStorage Implementation
 *
 * Simple in-memory storage for Thoughtbox persistence.
 * Data lives for the lifetime of the server process.
 * 
 * This replaces the SQLite + filesystem hybrid approach for simplicity.
 */

import { randomUUID } from 'crypto';
import { RevisionIndexBuilder } from '../revision/revision-index.js';
import type {
  ThoughtboxStorage,
  Config,
  Session,
  CreateSessionParams,
  SessionFilter,
  ThoughtData,
  IntegrityValidationResult,
  ThoughtNode,
  ThoughtNodeId,
  SessionExport,
  RevisionMetadata,
} from './types.js';

// =============================================================================
// LinkedThoughtStore - Doubly-linked list storage for reasoning chains
// =============================================================================

/**
 * Manages thoughts as a doubly-linked list with Map index for O(1) lookups.
 * Supports tree structures via array-based `next` pointers for branching.
 */
export class LinkedThoughtStore {
  /** All nodes indexed by ID for O(1) lookup */
  private nodes: Map<ThoughtNodeId, ThoughtNode> = new Map();

  /** First node ID for each session */
  private sessionHead: Map<string, ThoughtNodeId> = new Map();

  /** Last node ID for each session (most recently added on main chain) */
  private sessionTail: Map<string, ThoughtNodeId> = new Map();

  /** Session index: sessionId -> Set of all node IDs in that session */
  private sessionIndex: Map<string, Set<ThoughtNodeId>> = new Map();

  /** Branch index: sessionId -> Set of branch IDs */
  private branchIndex: Map<string, Set<string>> = new Map();

  /** Computed index: nodeId -> list of nodes that revise it */
  private revisedByIndex: Map<ThoughtNodeId, ThoughtNodeId[]> = new Map();

  /** Computed index: nodeId -> list of branch nodes that fork from it */
  private branchChildrenIndex: Map<ThoughtNodeId, ThoughtNodeId[]> = new Map();

  /**
   * Generate a node ID from session ID, thought number, and optional branch ID.
   *
   * ThoughtNodeId format:
   *   - Main chain thoughts: `${sessionId}:${thoughtNumber}`
   *   - Branch thoughts: `${sessionId}:${branchId}:${thoughtNumber}`
   *
   * This ensures branch thoughts with the same thoughtNumber but different
   * branchIds remain unique and don't overwrite each other.
   */
  private generateNodeId(sessionId: string, thoughtNumber: number, branchId?: string | null): ThoughtNodeId {
    if (branchId) {
      return `${sessionId}:${branchId}:${thoughtNumber}`;
    }
    return `${sessionId}:${thoughtNumber}`;
  }

  /**
   * Initialize storage for a new session
   */
  initSession(sessionId: string): void {
    // Nothing to initialize - nodes will be created on demand
  }

  /**
   * Clear all data for a session
   */
  clearSession(sessionId: string): void {
    // Get all node IDs for this session from index (O(1) vs iterating all nodes)
    const nodeIds = this.sessionIndex.get(sessionId);
    if (nodeIds) {
      for (const nodeId of nodeIds) {
        this.nodes.delete(nodeId);
        this.revisedByIndex.delete(nodeId);
        this.branchChildrenIndex.delete(nodeId);
      }
    }
    this.sessionHead.delete(sessionId);
    this.sessionTail.delete(sessionId);
    this.sessionIndex.delete(sessionId);
    this.branchIndex.delete(sessionId);
  }

  /**
   * Add a new thought node to the linked structure
   */
  addNode(sessionId: string, data: ThoughtData): ThoughtNode {
    // Generate node ID - include branchId for branch thoughts to ensure uniqueness
    const nodeId = this.generateNodeId(sessionId, data.thoughtNumber, data.branchId);

    // Determine previous node
    let prevNodeId: ThoughtNodeId | null = null;
    if (data.branchFromThought) {
      // Branching: prev is the branch origin (always on main chain, so no branchId)
      prevNodeId = this.generateNodeId(sessionId, data.branchFromThought);
    } else if (data.branchId) {
      // Continuing within a branch: find the previous thought in this same branch
      // Look for the most recent node in this branch
      let maxThoughtNum = 0;
      let prevBranchNodeId: ThoughtNodeId | null = null;
      for (const [existingId, existingNode] of this.nodes) {
        if (existingNode.branchId === data.branchId &&
            existingNode.data.thoughtNumber < data.thoughtNumber &&
            existingNode.data.thoughtNumber > maxThoughtNum) {
          maxThoughtNum = existingNode.data.thoughtNumber;
          prevBranchNodeId = existingId;
        }
      }
      prevNodeId = prevBranchNodeId;
    } else {
      // Sequential on main chain: prev is the last node added to this session
      const tailId = this.sessionTail.get(sessionId);
      if (tailId) {
        prevNodeId = tailId;
      }
    }

    // Create the node
    const node: ThoughtNode = {
      id: nodeId,
      data,
      prev: prevNodeId,
      next: [],
      // Revisions within a branch should resolve to the same branch's node
      revisesNode: data.revisesThought
        ? this.generateNodeId(sessionId, data.revisesThought, data.branchId)
        : null,
      // Branch origin is always on the main chain (no branchId)
      branchOrigin: data.branchFromThought
        ? this.generateNodeId(sessionId, data.branchFromThought)
        : null,
      branchId: data.branchId || null,
    };

    // Store the node
    this.nodes.set(nodeId, node);

    // Update session index
    let sessionNodes = this.sessionIndex.get(sessionId);
    if (!sessionNodes) {
      sessionNodes = new Set();
      this.sessionIndex.set(sessionId, sessionNodes);
    }
    sessionNodes.add(nodeId);

    // Update branch index if this is a branch thought
    if (data.branchId) {
      let branchIds = this.branchIndex.get(sessionId);
      if (!branchIds) {
        branchIds = new Set();
        this.branchIndex.set(sessionId, branchIds);
      }
      branchIds.add(data.branchId);
    }

    // Update previous node's `next` array (if it exists)
    if (prevNodeId) {
      const prevNode = this.nodes.get(prevNodeId);
      if (prevNode && !prevNode.next.includes(nodeId)) {
        prevNode.next.push(nodeId);
      }
    }

    // Update head/tail tracking
    // Set head if this is the first node for this session (supports backward thinking)
    if (!this.sessionHead.has(sessionId) && !data.branchId) {
      this.sessionHead.set(sessionId, nodeId);
    }
    // Update tail for main chain nodes (non-branch)
    if (!data.branchId) {
      this.sessionTail.set(sessionId, nodeId);
    }

    // Update computed indexes
    if (node.revisesNode) {
      const revisions = this.revisedByIndex.get(node.revisesNode) || [];
      if (!revisions.includes(nodeId)) {
        revisions.push(nodeId);
        this.revisedByIndex.set(node.revisesNode, revisions);
      }
    }
    if (node.branchOrigin) {
      const children = this.branchChildrenIndex.get(node.branchOrigin) || [];
      if (!children.includes(nodeId)) {
        children.push(nodeId);
        this.branchChildrenIndex.set(node.branchOrigin, children);
      }
    }

    return node;
  }

  /**
   * Get a node by ID
   */
  getNode(id: ThoughtNodeId): ThoughtNode | null {
    return this.nodes.get(id) || null;
  }

  /**
   * Get all nodes for a session, ordered by thought number
   */
  getSessionNodes(sessionId: string): ThoughtNode[] {
    const nodeIds = this.sessionIndex.get(sessionId);
    if (!nodeIds) return [];

    const nodes: ThoughtNode[] = [];
    for (const nodeId of nodeIds) {
      const node = this.nodes.get(nodeId);
      if (node) nodes.push(node);
    }
    return nodes.sort((a, b) => a.data.thoughtNumber - b.data.thoughtNumber);
  }

  /**
   * Get main chain thoughts only (no branches), ordered by thought number
   */
  getMainChainNodes(sessionId: string): ThoughtNode[] {
    const nodeIds = this.sessionIndex.get(sessionId);
    if (!nodeIds) return [];

    const nodes: ThoughtNode[] = [];
    for (const nodeId of nodeIds) {
      const node = this.nodes.get(nodeId);
      if (node && !node.branchId) {
        nodes.push(node);
      }
    }
    return nodes.sort((a, b) => a.data.thoughtNumber - b.data.thoughtNumber);
  }

  /**
   * Get all thoughts for a specific branch, ordered by thought number
   */
  getBranchNodes(sessionId: string, branchId: string): ThoughtNode[] {
    const nodeIds = this.sessionIndex.get(sessionId);
    if (!nodeIds) return [];

    const nodes: ThoughtNode[] = [];
    for (const nodeId of nodeIds) {
      const node = this.nodes.get(nodeId);
      if (node && node.branchId === branchId) {
        nodes.push(node);
      }
    }
    return nodes.sort((a, b) => a.data.thoughtNumber - b.data.thoughtNumber);
  }

  /**
   * Get all branch IDs for a session
   */
  getBranchIds(sessionId: string): string[] {
    const branchIds = this.branchIndex.get(sessionId);
    return branchIds ? Array.from(branchIds) : [];
  }

  /**
   * Get a specific thought by session ID and thought number (main chain only)
   */
  getThoughtByNumber(sessionId: string, thoughtNumber: number, branchId?: string): ThoughtNode | null {
    const nodeId = this.generateNodeId(sessionId, thoughtNumber, branchId);
    return this.nodes.get(nodeId) || null;
  }

  /**
   * Check if a session has any nodes
   */
  hasSession(sessionId: string): boolean {
    const nodeIds = this.sessionIndex.get(sessionId);
    return !!nodeIds && nodeIds.size > 0;
  }

  /**
   * Get the count of main chain thoughts in a session
   */
  getMainChainCount(sessionId: string): number {
    return this.getMainChainNodes(sessionId).length;
  }

  /**
   * Get the count of branches in a session
   */
  getBranchCount(sessionId: string): number {
    const branchIds = this.branchIndex.get(sessionId);
    return branchIds ? branchIds.size : 0;
  }

  /**
   * Load a node directly (for loading from file system)
   */
  loadNode(node: ThoughtNode): void {
    // Extract session ID from node ID
    const sessionId = node.id.split(':')[0];

    // Store the node
    this.nodes.set(node.id, node);

    // Update session index
    let sessionNodes = this.sessionIndex.get(sessionId);
    if (!sessionNodes) {
      sessionNodes = new Set();
      this.sessionIndex.set(sessionId, sessionNodes);
    }
    sessionNodes.add(node.id);

    // Update branch index if this is a branch thought
    if (node.branchId) {
      let branchIds = this.branchIndex.get(sessionId);
      if (!branchIds) {
        branchIds = new Set();
        this.branchIndex.set(sessionId, branchIds);
      }
      branchIds.add(node.branchId);
    }

    // Update head/tail tracking (will be fixed by rebuildIndexes if needed)
    if (!this.sessionHead.has(sessionId) && !node.branchId) {
      this.sessionHead.set(sessionId, node.id);
    }
    if (!node.branchId) {
      // Update tail to the node with highest thought number
      const currentTail = this.sessionTail.get(sessionId);
      if (!currentTail) {
        this.sessionTail.set(sessionId, node.id);
      } else {
        const currentTailNode = this.nodes.get(currentTail);
        if (currentTailNode && node.data.thoughtNumber > currentTailNode.data.thoughtNumber) {
          this.sessionTail.set(sessionId, node.id);
        }
      }
    }
  }

  /**
   * Get nodes that revise a given node
   */
  getRevisionsOf(nodeId: ThoughtNodeId): ThoughtNodeId[] {
    return this.revisedByIndex.get(nodeId) || [];
  }

  /**
   * Get branch nodes that fork from a given node
   */
  getBranchesFrom(nodeId: ThoughtNodeId): ThoughtNodeId[] {
    return this.branchChildrenIndex.get(nodeId) || [];
  }

  /**
   * Rebuild computed indexes from node data
   * Call this after loading nodes from external source
   */
  rebuildIndexes(): void {
    // Clear all computed indexes
    this.revisedByIndex.clear();
    this.branchChildrenIndex.clear();
    this.sessionIndex.clear();
    this.branchIndex.clear();
    this.sessionHead.clear();
    this.sessionTail.clear();

    // Track head/tail candidates per session
    const sessionHeadCandidates: Map<string, { id: ThoughtNodeId; num: number }> = new Map();
    const sessionTailCandidates: Map<string, { id: ThoughtNodeId; num: number }> = new Map();

    for (const [nodeId, node] of this.nodes) {
      // Extract session ID from node ID
      const sessionId = nodeId.split(':')[0];

      // Update session index
      let sessionNodes = this.sessionIndex.get(sessionId);
      if (!sessionNodes) {
        sessionNodes = new Set();
        this.sessionIndex.set(sessionId, sessionNodes);
      }
      sessionNodes.add(nodeId);

      // Update branch index
      if (node.branchId) {
        let branchIds = this.branchIndex.get(sessionId);
        if (!branchIds) {
          branchIds = new Set();
          this.branchIndex.set(sessionId, branchIds);
        }
        branchIds.add(node.branchId);
      }

      // Track head/tail for main chain nodes only
      if (!node.branchId) {
        const headCandidate = sessionHeadCandidates.get(sessionId);
        if (!headCandidate || node.data.thoughtNumber < headCandidate.num) {
          sessionHeadCandidates.set(sessionId, { id: nodeId, num: node.data.thoughtNumber });
        }

        const tailCandidate = sessionTailCandidates.get(sessionId);
        if (!tailCandidate || node.data.thoughtNumber > tailCandidate.num) {
          sessionTailCandidates.set(sessionId, { id: nodeId, num: node.data.thoughtNumber });
        }
      }

      // Update revision index
      if (node.revisesNode) {
        const revisions = this.revisedByIndex.get(node.revisesNode) || [];
        revisions.push(nodeId);
        this.revisedByIndex.set(node.revisesNode, revisions);
      }

      // Update branch children index
      if (node.branchOrigin) {
        const children = this.branchChildrenIndex.get(node.branchOrigin) || [];
        children.push(nodeId);
        this.branchChildrenIndex.set(node.branchOrigin, children);
      }
    }

    // Set head/tail from candidates
    for (const [sessionId, candidate] of sessionHeadCandidates) {
      this.sessionHead.set(sessionId, candidate.id);
    }
    for (const [sessionId, candidate] of sessionTailCandidates) {
      this.sessionTail.set(sessionId, candidate.id);
    }
  }

  /**
   * Convert session to export format
   * SPEC-002: Includes revision metadata for each node
   */
  toExportFormat(sessionId: string, session: Session): SessionExport {
    const nodes = this.getSessionNodes(sessionId);

    // SPEC-002: Build revision metadata
    const indexBuilder = new RevisionIndexBuilder();
    const revisionIndex = indexBuilder.buildIndex(nodes);

    // Attach revision metadata to each node
    const nodesWithMetadata = nodes.map(node => ({
      ...node,
      revisionMetadata: revisionIndex.get(node.data.thoughtNumber),
    }));

    // SPEC-002: Calculate revision analysis for session
    const revisions = Array.from(revisionIndex.values() as Iterable<RevisionMetadata>).filter(m => m.isRevision);
    const revisionAnalysis = this.calculateRevisionAnalysis(nodes, revisionIndex);

    return {
      version: '1.0',
      session: session,
      nodes: nodesWithMetadata,
      revisionAnalysis,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * SPEC-002: Calculate revision analysis metrics
   */
  private calculateRevisionAnalysis(
    nodes: ThoughtNode[],
    index: Map<number, RevisionMetadata>
  ): any {
    const revisions = Array.from(index.values()).filter((m) => m.isRevision);

    if (revisions.length === 0) {
      return {
        totalRevisions: 0,
        mostRevisedThought: null,
        avgTemporalDistance: 0,
        revisionDensity: 0,
      };
    }

    // Find most-revised thought
    const revisedByCounts = new Map<number, number>();
    for (const metadata of index.values()) {
      // Count how many times THIS thought was revised (not what it revises)
      if (!metadata.isRevision && metadata.revisedBy.length > 0) {
        const thoughtNum = Array.from(index.entries()).find(([_, m]) => m === metadata)?.[0];
        if (thoughtNum !== undefined) {
          revisedByCounts.set(thoughtNum, metadata.revisedBy.length);
        }
      }
    }

    let mostRevisedThought: { thoughtNumber: number; revisionCount: number } | null = null;
    let maxCount = 0;
    for (const [thoughtNum, count] of revisedByCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostRevisedThought = { thoughtNumber: thoughtNum, revisionCount: count };
      }
    }

    // Calculate average temporal distance (thought number delta between revision and original)
    let totalDistance = 0;
    let distanceCount = 0;
    for (const node of nodes) {
      if (node.revisionMetadata?.isRevision && node.revisionMetadata.revisesThought !== null) {
        // Distance is the delta in thought numbers (measure of how far back revision reaches)
        const distance = node.data.thoughtNumber - node.revisionMetadata.revisesThought;
        totalDistance += Math.abs(distance);
        distanceCount++;
      }
    }
    const avgTemporalDistance = distanceCount > 0 ? totalDistance / distanceCount : 0;

    // Revision density (revisions per 100 thoughts)
    const revisionDensity = nodes.length > 0
      ? (revisions.length / nodes.length) * 100
      : 0;

    return {
      totalRevisions: revisions.length,
      mostRevisedThought,
      avgTemporalDistance: Math.round(avgTemporalDistance * 10) / 10,
      revisionDensity: Math.round(revisionDensity * 10) / 10,
    };
  }
}

// =============================================================================
// InMemoryStorage Implementation
// =============================================================================

export class InMemoryStorage implements ThoughtboxStorage {
  private config: Config | null = null;
  private sessions: Map<string, Session> = new Map();

  /**
   * LinkedThoughtStore is now the SOLE source of truth for thought data.
   * No more double storage - queries go directly to the linked store.
   */
  private linkedStore: LinkedThoughtStore = new LinkedThoughtStore();

  // ===========================================================================
  // Initialization
  // ===========================================================================

  async initialize(): Promise<void> {
    // Initialize config if needed
    if (!this.config) {
      this.config = {
        installId: randomUUID(),
        dataDir: ':memory:',
        disableThoughtLogging: false,
        sessionPartitionGranularity: 'monthly',
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
        dataDir: attrs.dataDir || ':memory:',
        disableThoughtLogging: attrs.disableThoughtLogging ?? false,
        sessionPartitionGranularity: attrs.sessionPartitionGranularity || 'monthly',
        createdAt: new Date(),
      };
    } else {
      this.config = { ...this.config, ...attrs };
    }
    return this.config;
  }

  // ===========================================================================
  // Session Operations
  // ===========================================================================

  async createSession(params: CreateSessionParams): Promise<Session> {
    const id = randomUUID();
    const now = new Date();

    const session: Session = {
      id,
      title: params.title,
      description: params.description,
      tags: params.tags || [],
      thoughtCount: 0,
      branchCount: 0,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
    };

    this.sessions.set(id, session);
    // No need to initialize linkedStore - nodes are created on demand

    return session;
  }

  async getSession(id: string): Promise<Session | null> {
    return this.sessions.get(id) || null;
  }

  async updateSession(id: string, attrs: Partial<Session>): Promise<Session> {
    const existing = this.sessions.get(id);
    if (!existing) throw new Error(`Session ${id} not found`);

    const updated = { ...existing, ...attrs, updatedAt: new Date() };
    this.sessions.set(id, updated);
    return updated;
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
    this.linkedStore.clearSession(id);
  }

  async listSessions(filter?: SessionFilter): Promise<Session[]> {
    let sessions = Array.from(this.sessions.values());

    // Apply tag filter
    if (filter?.tags && filter.tags.length > 0) {
      sessions = sessions.filter((session) =>
        filter.tags!.some((tag) => session.tags.includes(tag))
      );
    }

    // Apply search filter
    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      sessions = sessions.filter(
        (session) =>
          session.title.toLowerCase().includes(searchLower) ||
          session.description?.toLowerCase().includes(searchLower) ||
          session.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    const sortBy = filter?.sortBy || 'updatedAt';
    const sortOrder = filter?.sortOrder || 'desc';
    
    sessions.sort((a, b) => {
      let aVal: string | Date;
      let bVal: string | Date;
      
      if (sortBy === 'title') {
        aVal = a.title;
        bVal = b.title;
      } else if (sortBy === 'createdAt') {
        aVal = a.createdAt;
        bVal = b.createdAt;
      } else {
        aVal = a.updatedAt;
        bVal = b.updatedAt;
      }
      
      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
    });

    // Apply limit and offset
    if (filter?.offset) {
      sessions = sessions.slice(filter.offset);
    }
    if (filter?.limit) {
      sessions = sessions.slice(0, filter.limit);
    }

    return sessions;
  }

  // ===========================================================================
  // Thought Operations
  // ===========================================================================

  async saveThought(sessionId: string, thought: ThoughtData): Promise<void> {
    // Verify session exists
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Add timestamp if not present
    const enrichedThought: ThoughtData = {
      ...thought,
      timestamp: thought.timestamp || new Date().toISOString(),
    };

    // Add to linked store (sole source of truth)
    this.linkedStore.addNode(sessionId, enrichedThought);
  }

  async getThoughts(sessionId: string): Promise<ThoughtData[]> {
    // Get main chain nodes from linked store
    const nodes = this.linkedStore.getMainChainNodes(sessionId);
    return nodes.map(node => node.data);
  }

  async getThought(
    sessionId: string,
    thoughtNumber: number
  ): Promise<ThoughtData | null> {
    const node = this.linkedStore.getThoughtByNumber(sessionId, thoughtNumber);
    return node ? node.data : null;
  }

  async saveBranchThought(
    sessionId: string,
    branchId: string,
    thought: ThoughtData
  ): Promise<void> {
    // Verify session exists
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Add timestamp if not present
    const enrichedThought: ThoughtData = {
      ...thought,
      branchId, // Ensure branchId is set
      timestamp: thought.timestamp || new Date().toISOString(),
    };

    // Add to linked store (sole source of truth)
    this.linkedStore.addNode(sessionId, enrichedThought);
  }

  async getBranch(sessionId: string, branchId: string): Promise<ThoughtData[]> {
    // Get branch nodes from linked store
    const nodes = this.linkedStore.getBranchNodes(sessionId, branchId);
    return nodes.map(node => node.data);
  }

  async updateThoughtCritique(
    sessionId: string,
    thoughtNumber: number,
    critique: { text: string; model: string; timestamp: string }
  ): Promise<void> {
    const node = this.linkedStore.getThoughtByNumber(sessionId, thoughtNumber);
    if (node) {
      node.data.critique = critique;
    }
  }

  async updateThoughtRlmResult(
    sessionId: string,
    thoughtNumber: number,
    rlm: { text: string; model?: string; logs?: string[]; timestamp: string }
  ): Promise<void> {
    const node = this.linkedStore.getThoughtByNumber(sessionId, thoughtNumber);
    if (node) {
      node.data.rlmResult = rlm;
    }
  }

  // ===========================================================================
  // Export Operations
  // ===========================================================================

  async exportSession(
    sessionId: string,
    format: 'json' | 'markdown'
  ): Promise<string> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const thoughts = await this.getThoughts(sessionId);
    const branchIds = this.linkedStore.getBranchIds(sessionId);

    if (format === 'json') {
      const branchData: Record<string, ThoughtData[]> = {};
      for (const branchId of branchIds) {
        branchData[branchId] = await this.getBranch(sessionId, branchId);
      }
      return JSON.stringify(
        {
          session,
          thoughts,
          branches: branchData,
        },
        null,
        2
      );
    }

    // Markdown format
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
        lines.push(
          `*Branch "${thought.branchId}" from thought ${thought.branchFromThought}*`
        );
      }
      lines.push('');
      lines.push(thought.thought);
      lines.push('');
    }

    // Add branches
    if (branchIds.length > 0) {
      lines.push('---');
      lines.push('');
      lines.push('## Branches');
      lines.push('');

      for (const branchId of branchIds) {
        const branchThoughts = await this.getBranch(sessionId, branchId);
        lines.push(`### Branch: ${branchId}`);
        lines.push('');

        for (const thought of branchThoughts) {
          lines.push(
            `#### Thought ${thought.thoughtNumber}/${thought.totalThoughts}`
          );
          lines.push('');
          lines.push(thought.thought);
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Export session as linked node structure (for filesystem export)
   */
  async toLinkedExport(sessionId: string): Promise<SessionExport> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    return this.linkedStore.toExportFormat(sessionId, session);
  }

  // ===========================================================================
  // Integrity Operations
  // ===========================================================================

  async validateSessionIntegrity(sessionId: string): Promise<IntegrityValidationResult> {
    const session = this.sessions.get(sessionId);
    
    // In-memory storage is always consistent
    return {
      valid: !!session,
      sessionExists: !!session,
      manifestExists: !!session, // No manifest in memory mode
      manifestValid: !!session,
      missingThoughtFiles: [],
      missingBranchFiles: {},
      errors: session ? [] : [`Session ${sessionId} not found`],
    };
  }
}
