/**
 * InMemoryStorage Implementation
 *
 * Simple in-memory storage for Thoughtbox persistence.
 * Data lives for the lifetime of the server process.
 * 
 * This replaces the SQLite + filesystem hybrid approach for simplicity.
 */

import { randomUUID } from 'crypto';
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

  /** Computed index: nodeId -> list of nodes that revise it */
  private revisedByIndex: Map<ThoughtNodeId, ThoughtNodeId[]> = new Map();

  /** Computed index: nodeId -> list of branch nodes that fork from it */
  private branchChildrenIndex: Map<ThoughtNodeId, ThoughtNodeId[]> = new Map();

  /**
   * Generate a node ID from session ID and thought number
   */
  private generateNodeId(sessionId: string, thoughtNumber: number): ThoughtNodeId {
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
    // Remove all nodes belonging to this session
    for (const [nodeId, node] of this.nodes) {
      if (nodeId.startsWith(`${sessionId}:`)) {
        this.nodes.delete(nodeId);
        this.revisedByIndex.delete(nodeId);
        this.branchChildrenIndex.delete(nodeId);
      }
    }
    this.sessionHead.delete(sessionId);
    this.sessionTail.delete(sessionId);
  }

  /**
   * Add a new thought node to the linked structure
   */
  addNode(sessionId: string, data: ThoughtData): ThoughtNode {
    const nodeId = this.generateNodeId(sessionId, data.thoughtNumber);

    // Determine previous node
    let prevNodeId: ThoughtNodeId | null = null;
    if (data.branchFromThought) {
      // Branching: prev is the branch origin
      prevNodeId = this.generateNodeId(sessionId, data.branchFromThought);
    } else {
      // Sequential: prev is the last node added to this session (maintains valid chain with gaps)
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
      revisesNode: data.revisesThought
        ? this.generateNodeId(sessionId, data.revisesThought)
        : null,
      branchOrigin: data.branchFromThought
        ? this.generateNodeId(sessionId, data.branchFromThought)
        : null,
      branchId: data.branchId || null,
    };

    // Store the node
    this.nodes.set(nodeId, node);

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
    const nodes: ThoughtNode[] = [];
    for (const [nodeId, node] of this.nodes) {
      if (nodeId.startsWith(`${sessionId}:`)) {
        nodes.push(node);
      }
    }
    return nodes.sort((a, b) => a.data.thoughtNumber - b.data.thoughtNumber);
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
    this.revisedByIndex.clear();
    this.branchChildrenIndex.clear();

    for (const [nodeId, node] of this.nodes) {
      if (node.revisesNode) {
        const revisions = this.revisedByIndex.get(node.revisesNode) || [];
        revisions.push(nodeId);
        this.revisedByIndex.set(node.revisesNode, revisions);
      }
      if (node.branchOrigin) {
        const children = this.branchChildrenIndex.get(node.branchOrigin) || [];
        children.push(nodeId);
        this.branchChildrenIndex.set(node.branchOrigin, children);
      }
    }
  }

  /**
   * Convert session to export format
   */
  toExportFormat(sessionId: string, session: Session): SessionExport {
    return {
      version: '1.0',
      session,
      nodes: this.getSessionNodes(sessionId),
      exportedAt: new Date().toISOString(),
    };
  }
}

// =============================================================================
// InMemoryStorage Implementation
// =============================================================================

export class InMemoryStorage implements ThoughtboxStorage {
  private config: Config | null = null;
  private sessions: Map<string, Session> = new Map();
  private thoughts: Map<string, ThoughtData[]> = new Map(); // sessionId -> thoughts
  private branches: Map<string, Map<string, ThoughtData[]>> = new Map(); // sessionId -> branchId -> thoughts

  /** Linked node storage for export */
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
    this.thoughts.set(id, []);
    this.branches.set(id, new Map());

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
    this.thoughts.delete(id);
    this.branches.delete(id);
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
    const sessionThoughts = this.thoughts.get(sessionId);
    if (!sessionThoughts) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Add timestamp if not present
    const enrichedThought: ThoughtData = {
      ...thought,
      timestamp: thought.timestamp || new Date().toISOString(),
    };

    sessionThoughts.push(enrichedThought);

    // Also add to linked store for export
    this.linkedStore.addNode(sessionId, enrichedThought);
  }

  async getThoughts(sessionId: string): Promise<ThoughtData[]> {
    const sessionThoughts = this.thoughts.get(sessionId);
    if (!sessionThoughts) {
      return [];
    }
    return [...sessionThoughts].sort((a, b) => a.thoughtNumber - b.thoughtNumber);
  }

  async getThought(
    sessionId: string,
    thoughtNumber: number
  ): Promise<ThoughtData | null> {
    const sessionThoughts = this.thoughts.get(sessionId);
    if (!sessionThoughts) return null;
    
    return sessionThoughts.find((t) => t.thoughtNumber === thoughtNumber) || null;
  }

  async saveBranchThought(
    sessionId: string,
    branchId: string,
    thought: ThoughtData
  ): Promise<void> {
    let sessionBranches = this.branches.get(sessionId);
    if (!sessionBranches) {
      sessionBranches = new Map();
      this.branches.set(sessionId, sessionBranches);
    }

    let branchThoughts = sessionBranches.get(branchId);
    if (!branchThoughts) {
      branchThoughts = [];
      sessionBranches.set(branchId, branchThoughts);
    }

    // Add timestamp if not present
    const enrichedThought: ThoughtData = {
      ...thought,
      timestamp: thought.timestamp || new Date().toISOString(),
    };

    branchThoughts.push(enrichedThought);

    // Also add to linked store for export
    this.linkedStore.addNode(sessionId, enrichedThought);
  }

  async getBranch(sessionId: string, branchId: string): Promise<ThoughtData[]> {
    const sessionBranches = this.branches.get(sessionId);
    if (!sessionBranches) return [];
    
    const branchThoughts = sessionBranches.get(branchId);
    if (!branchThoughts) return [];
    
    return [...branchThoughts].sort((a, b) => a.thoughtNumber - b.thoughtNumber);
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
    const sessionBranches = this.branches.get(sessionId) || new Map();
    const branchIds = Array.from(sessionBranches.keys());

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
