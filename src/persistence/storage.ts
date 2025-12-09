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
} from './types.js';

// =============================================================================
// InMemoryStorage Implementation
// =============================================================================

export class InMemoryStorage implements ThoughtboxStorage {
  private config: Config | null = null;
  private sessions: Map<string, Session> = new Map();
  private thoughts: Map<string, ThoughtData[]> = new Map(); // sessionId -> thoughts
  private branches: Map<string, Map<string, ThoughtData[]>> = new Map(); // sessionId -> branchId -> thoughts

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

// Export as default for backward compatibility
export { InMemoryStorage as FileSystemStorage };
