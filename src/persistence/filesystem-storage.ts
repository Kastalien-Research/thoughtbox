/**
 * FileSystemStorage Implementation
 *
 * File-based persistence for local-first Thoughtbox.
 * Uses LinkedThoughtStore as in-memory index with immediate write-through to disk.
 *
 * Directory structure:
 *   ~/.thoughtbox/
 *   ├── config.json
 *   └── sessions/
 *       └── {partition}/          # e.g., 2026-01 for monthly
 *           └── {session-uuid}/
 *               ├── manifest.json
 *               ├── 001.json      # ThoughtNode files
 *               ├── 002.json
 *               └── branches/
 *                   └── {branch-id}/
 *                       ├── 001.json
 *                       └── 002.json
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';
import { LinkedThoughtStore } from './storage.js';
import type {
  ThoughtboxStorage,
  Config,
  Session,
  CreateSessionParams,
  SessionFilter,
  ThoughtData,
  IntegrityValidationResult,
  ThoughtNode,
  SessionExport,
  SessionManifest,
  TimePartitionGranularity,
} from './types.js';

// =============================================================================
// Types
// =============================================================================

export interface FileSystemStorageOptions {
  /** Base directory for all data. Default: ~/.thoughtbox */
  basePath?: string;
  /** Time partition granularity. Default: 'monthly' */
  partitionGranularity?: TimePartitionGranularity;
  /** Project scope - isolates all storage to this project. Default: '_default' */
  project?: string;
}

// =============================================================================
// FileSystemStorage Implementation
// =============================================================================

export class FileSystemStorage implements ThoughtboxStorage {
  private basePath: string;
  private partitionGranularity: TimePartitionGranularity;
  private project: string;
  private config: Config | null = null;
  private sessions: Map<string, Session> = new Map();
  private linkedStore: LinkedThoughtStore = new LinkedThoughtStore();
  private initialized = false;

  constructor(options: FileSystemStorageOptions = {}) {
    this.basePath = options.basePath || path.join(os.homedir(), '.thoughtbox');
    this.partitionGranularity = options.partitionGranularity || 'monthly';
    this.project = options.project || '_default';
  }

  // ===========================================================================
  // Path Helpers
  // ===========================================================================

  private getConfigPath(): string {
    return path.join(this.basePath, 'config.json');
  }

  private getProjectDir(): string {
    return path.join(this.basePath, 'projects', this.project);
  }

  private getSessionsDir(): string {
    return path.join(this.getProjectDir(), 'sessions');
  }

  /** Get the current project scope */
  getProject(): string {
    return this.project;
  }

  private generatePartitionPath(): string {
    const now = new Date();
    switch (this.partitionGranularity) {
      case 'monthly':
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      case 'weekly': {
        const weekNum = this.getWeekNumber(now);
        return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      }
      case 'daily':
        return now.toISOString().split('T')[0];
      case 'none':
      default:
        return '';
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private getSessionDir(sessionId: string, partitionPath?: string): string {
    if (partitionPath) {
      return path.join(this.getSessionsDir(), partitionPath, sessionId);
    }
    return path.join(this.getSessionsDir(), sessionId);
  }

  private getManifestPath(sessionDir: string): string {
    return path.join(sessionDir, 'manifest.json');
  }

  private getThoughtPath(sessionDir: string, thoughtNumber: number, branchId?: string): string {
    const filename = `${String(thoughtNumber).padStart(3, '0')}.json`;
    if (branchId) {
      return path.join(sessionDir, 'branches', branchId, filename);
    }
    return path.join(sessionDir, filename);
  }

  // ===========================================================================
  // Atomic Write Helper
  // ===========================================================================

  private async atomicWriteJson(filePath: string, data: unknown): Promise<void> {
    const tmpPath = `${filePath}.tmp`;
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(tmpPath, content, 'utf-8');
    await fs.rename(tmpPath, filePath); // Atomic on POSIX
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Create base directories
    await fs.mkdir(this.basePath, { recursive: true });

    // Migrate legacy sessions to projects/_default/ if needed
    await this.migrateLegacySessions();

    // Create project directory structure
    await fs.mkdir(this.getProjectDir(), { recursive: true });
    await fs.mkdir(this.getSessionsDir(), { recursive: true });

    // Load or create config
    try {
      const configData = await fs.readFile(this.getConfigPath(), 'utf-8');
      this.config = JSON.parse(configData);
      // Convert date string back to Date object
      if (this.config && typeof this.config.createdAt === 'string') {
        this.config.createdAt = new Date(this.config.createdAt);
      }
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Create default config
        this.config = {
          installId: randomUUID(),
          dataDir: this.basePath,
          disableThoughtLogging: false,
          sessionPartitionGranularity: this.partitionGranularity,
          createdAt: new Date(),
        };
        await this.atomicWriteJson(this.getConfigPath(), this.config);
      } else {
        throw error;
      }
    }

    // Load existing sessions (only from current project)
    await this.loadAllSessions();

    this.initialized = true;
  }

  /**
   * Migrate legacy sessions from flat structure to project-isolated structure.
   * Moves ~/.thoughtbox/sessions/ to ~/.thoughtbox/projects/_default/sessions/
   */
  private async migrateLegacySessions(): Promise<void> {
    const legacySessionsDir = path.join(this.basePath, 'sessions');
    const defaultProjectDir = path.join(this.basePath, 'projects', '_default');
    const newDefaultSessionsDir = path.join(defaultProjectDir, 'sessions');

    try {
      // Check if legacy sessions directory exists
      await fs.access(legacySessionsDir);

      // Check if we've already migrated
      try {
        await fs.access(newDefaultSessionsDir);
        // Already migrated, nothing to do
        return;
      } catch {
        // newDefaultSessionsDir doesn't exist, proceed with migration
      }

      // Create _default project directory
      await fs.mkdir(defaultProjectDir, { recursive: true });

      // Move legacy sessions to _default project
      await fs.rename(legacySessionsDir, newDefaultSessionsDir);

      console.log('[Thoughtbox] Migrated legacy sessions to projects/_default/');
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Legacy sessions directory doesn't exist, nothing to migrate
        return;
      }
      // Other errors should be logged but not block initialization
      console.error('[Thoughtbox] Warning: Failed to migrate legacy sessions:', error);
    }
  }

  private async loadAllSessions(): Promise<void> {
    const sessionsDir = this.getSessionsDir();

    try {
      const entries = await fs.readdir(sessionsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        // Check if this is a partition directory or a session directory
        const entryPath = path.join(sessionsDir, entry.name);

        // Try to load as session first
        const manifestPath = path.join(entryPath, 'manifest.json');
        try {
          await fs.access(manifestPath);
          // It's a session directory (no partition)
          await this.loadSession(entry.name, '');
          continue;
        } catch {
          // Not a session directory, might be a partition
        }

        // Check if it's a partition directory (contains session subdirectories)
        const subEntries = await fs.readdir(entryPath, { withFileTypes: true });
        for (const subEntry of subEntries) {
          if (!subEntry.isDirectory()) continue;

          const subManifestPath = path.join(entryPath, subEntry.name, 'manifest.json');
          try {
            await fs.access(subManifestPath);
            // It's a session directory within a partition
            await this.loadSession(subEntry.name, entry.name);
          } catch {
            // Not a session directory
          }
        }
      }
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      // Sessions directory doesn't exist yet - that's fine
    }
  }

  private async loadSession(sessionId: string, partitionPath: string): Promise<void> {
    const sessionDir = this.getSessionDir(sessionId, partitionPath || undefined);
    const manifestPath = this.getManifestPath(sessionDir);

    try {
      const manifestData = await fs.readFile(manifestPath, 'utf-8');
      const manifest: SessionManifest = JSON.parse(manifestData);

      // Create session from manifest
      const session: Session = {
        id: manifest.id,
        title: manifest.metadata.title,
        description: manifest.metadata.description,
        tags: manifest.metadata.tags,
        thoughtCount: manifest.thoughtFiles.length,
        branchCount: Object.keys(manifest.branchFiles).length,
        partitionPath: partitionPath || undefined,
        createdAt: new Date(manifest.metadata.createdAt),
        updatedAt: new Date(manifest.metadata.updatedAt),
        lastAccessedAt: new Date(),
      };

      this.sessions.set(sessionId, session);

      // Load main chain thoughts
      for (const thoughtFile of manifest.thoughtFiles) {
        const thoughtPath = path.join(sessionDir, thoughtFile);
        try {
          const nodeData = await fs.readFile(thoughtPath, 'utf-8');
          const node: ThoughtNode = JSON.parse(nodeData);
          this.linkedStore.loadNode(node);
        } catch (error) {
          console.error(`Failed to load thought file ${thoughtPath}:`, error);
        }
      }

      // Load branch thoughts
      for (const [branchId, branchFiles] of Object.entries(manifest.branchFiles)) {
        for (const thoughtFile of branchFiles) {
          const thoughtPath = path.join(sessionDir, 'branches', branchId, thoughtFile);
          try {
            const nodeData = await fs.readFile(thoughtPath, 'utf-8');
            const node: ThoughtNode = JSON.parse(nodeData);
            this.linkedStore.loadNode(node);
          } catch (error) {
            console.error(`Failed to load branch thought file ${thoughtPath}:`, error);
          }
        }
      }

      // Rebuild indexes after loading
      this.linkedStore.rebuildIndexes();

    } catch (error) {
      console.error(`Failed to load session ${sessionId}:`, error);
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
        dataDir: attrs.dataDir || this.basePath,
        disableThoughtLogging: attrs.disableThoughtLogging ?? false,
        sessionPartitionGranularity: attrs.sessionPartitionGranularity || this.partitionGranularity,
        createdAt: new Date(),
      };
    } else {
      this.config = { ...this.config, ...attrs };
    }

    await this.atomicWriteJson(this.getConfigPath(), this.config);
    return this.config;
  }

  // ===========================================================================
  // Session Operations
  // ===========================================================================

  async createSession(params: CreateSessionParams): Promise<Session> {
    const id = randomUUID();
    const now = new Date();
    const partitionPath = this.generatePartitionPath();

    const session: Session = {
      id,
      title: params.title,
      description: params.description,
      tags: params.tags || [],
      thoughtCount: 0,
      branchCount: 0,
      partitionPath: partitionPath || undefined,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
    };

    // Create session directory
    const sessionDir = this.getSessionDir(id, partitionPath || undefined);
    await fs.mkdir(sessionDir, { recursive: true });
    await fs.mkdir(path.join(sessionDir, 'branches'), { recursive: true });

    // Create manifest
    const manifest: SessionManifest = {
      id,
      version: '1.0.0',
      thoughtFiles: [],
      branchFiles: {},
      metadata: {
        title: params.title,
        description: params.description,
        tags: params.tags || [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    };

    await this.atomicWriteJson(this.getManifestPath(sessionDir), manifest);

    // Update in-memory state
    this.sessions.set(id, session);

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

    // Update manifest
    const sessionDir = this.getSessionDir(id, existing.partitionPath);
    const manifestPath = this.getManifestPath(sessionDir);

    try {
      const manifestData = await fs.readFile(manifestPath, 'utf-8');
      const manifest: SessionManifest = JSON.parse(manifestData);

      manifest.metadata.title = updated.title;
      manifest.metadata.description = updated.description;
      manifest.metadata.tags = updated.tags;
      manifest.metadata.updatedAt = updated.updatedAt.toISOString();

      await this.atomicWriteJson(manifestPath, manifest);
    } catch (error) {
      console.error(`Failed to update manifest for session ${id}:`, error);
    }

    return updated;
  }

  async deleteSession(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (!session) return;

    // Delete session directory
    const sessionDir = this.getSessionDir(id, session.partitionPath);
    try {
      await fs.rm(sessionDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to delete session directory ${sessionDir}:`, error);
    }

    // Update in-memory state
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
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    // Enrich thought with timestamp
    const enrichedThought: ThoughtData = {
      ...thought,
      timestamp: thought.timestamp || new Date().toISOString(),
    };

    // Add to linked store (memory)
    const node = this.linkedStore.addNode(sessionId, enrichedThought);

    // Write thought file to disk (atomic)
    const sessionDir = this.getSessionDir(sessionId, session.partitionPath);
    const thoughtPath = this.getThoughtPath(sessionDir, thought.thoughtNumber);
    await this.atomicWriteJson(thoughtPath, node);

    // Update manifest
    await this.updateManifestThought(sessionId, thought.thoughtNumber);
  }

  async getThoughts(sessionId: string): Promise<ThoughtData[]> {
    const nodes = this.linkedStore.getMainChainNodes(sessionId);
    return nodes.map(node => node.data);
  }

  async getThought(sessionId: string, thoughtNumber: number): Promise<ThoughtData | null> {
    const node = this.linkedStore.getThoughtByNumber(sessionId, thoughtNumber);
    return node ? node.data : null;
  }

  async saveBranchThought(sessionId: string, branchId: string, thought: ThoughtData): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    // Enrich thought with timestamp and branchId
    const enrichedThought: ThoughtData = {
      ...thought,
      branchId,
      timestamp: thought.timestamp || new Date().toISOString(),
    };

    // Add to linked store (memory)
    const node = this.linkedStore.addNode(sessionId, enrichedThought);

    // Create branch directory if needed
    const sessionDir = this.getSessionDir(sessionId, session.partitionPath);
    const branchDir = path.join(sessionDir, 'branches', branchId);
    await fs.mkdir(branchDir, { recursive: true });

    // Write thought file to disk (atomic)
    const thoughtPath = this.getThoughtPath(sessionDir, thought.thoughtNumber, branchId);
    await this.atomicWriteJson(thoughtPath, node);

    // Update manifest
    await this.updateManifestBranchThought(sessionId, branchId, thought.thoughtNumber);
  }

  async getBranch(sessionId: string, branchId: string): Promise<ThoughtData[]> {
    const nodes = this.linkedStore.getBranchNodes(sessionId, branchId);
    return nodes.map(node => node.data);
  }

  async updateThoughtCritique(
    sessionId: string,
    thoughtNumber: number,
    critique: { text: string; model: string; timestamp: string }
  ): Promise<void> {
    // 1. Update in-memory LinkedThoughtStore
    const node = this.linkedStore.getThoughtByNumber(sessionId, thoughtNumber);
    if (!node) return;

    node.data.critique = critique;

    // 2. Write updated thought file to disk (atomic)
    const session = this.sessions.get(sessionId);
    if (session) {
      const sessionDir = this.getSessionDir(sessionId, session.partitionPath);
      const thoughtPath = this.getThoughtPath(sessionDir, thoughtNumber);
      await this.atomicWriteJson(thoughtPath, node);
    }
  }

  async updateThoughtRlmResult(
    sessionId: string,
    thoughtNumber: number,
    rlm: { text: string; model?: string; logs?: string[]; timestamp: string }
  ): Promise<void> {
    // 1. Update in-memory LinkedThoughtStore
    const node = this.linkedStore.getThoughtByNumber(sessionId, thoughtNumber);
    if (!node) return;

    node.data.rlmResult = rlm;

    // 2. Write updated thought file to disk (atomic)
    const session = this.sessions.get(sessionId);
    if (session) {
      const sessionDir = this.getSessionDir(sessionId, session.partitionPath);
      const thoughtPath = this.getThoughtPath(sessionDir, thoughtNumber);
      await this.atomicWriteJson(thoughtPath, node);
    }
  }

  private async updateManifestThought(sessionId: string, thoughtNumber: number): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const sessionDir = this.getSessionDir(sessionId, session.partitionPath);
    const manifestPath = this.getManifestPath(sessionDir);

    try {
      const manifestData = await fs.readFile(manifestPath, 'utf-8');
      const manifest: SessionManifest = JSON.parse(manifestData);

      const filename = `${String(thoughtNumber).padStart(3, '0')}.json`;
      if (!manifest.thoughtFiles.includes(filename)) {
        manifest.thoughtFiles.push(filename);
        manifest.thoughtFiles.sort();
      }
      manifest.metadata.updatedAt = new Date().toISOString();

      await this.atomicWriteJson(manifestPath, manifest);
    } catch (error) {
      console.error(`Failed to update manifest for thought ${thoughtNumber}:`, error);
    }
  }

  private async updateManifestBranchThought(sessionId: string, branchId: string, thoughtNumber: number): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const sessionDir = this.getSessionDir(sessionId, session.partitionPath);
    const manifestPath = this.getManifestPath(sessionDir);

    try {
      const manifestData = await fs.readFile(manifestPath, 'utf-8');
      const manifest: SessionManifest = JSON.parse(manifestData);

      if (!manifest.branchFiles[branchId]) {
        manifest.branchFiles[branchId] = [];
      }

      const filename = `${String(thoughtNumber).padStart(3, '0')}.json`;
      if (!manifest.branchFiles[branchId].includes(filename)) {
        manifest.branchFiles[branchId].push(filename);
        manifest.branchFiles[branchId].sort();
      }
      manifest.metadata.updatedAt = new Date().toISOString();

      await this.atomicWriteJson(manifestPath, manifest);
    } catch (error) {
      console.error(`Failed to update manifest for branch thought ${branchId}:${thoughtNumber}:`, error);
    }
  }

  // ===========================================================================
  // Export Operations
  // ===========================================================================

  async exportSession(sessionId: string, format: 'json' | 'markdown'): Promise<string> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const thoughts = await this.getThoughts(sessionId);
    const branchIds = this.linkedStore.getBranchIds(sessionId);

    if (format === 'json') {
      const branchData: Record<string, ThoughtData[]> = {};
      for (const branchId of branchIds) {
        branchData[branchId] = await this.getBranch(sessionId, branchId);
      }
      return JSON.stringify({ session, thoughts, branches: branchData }, null, 2);
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
        lines.push(`*Branch "${thought.branchId}" from thought ${thought.branchFromThought}*`);
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

    return this.linkedStore.toExportFormat(sessionId, session);
  }

  // ===========================================================================
  // Integrity Operations
  // ===========================================================================

  async validateSessionIntegrity(sessionId: string): Promise<IntegrityValidationResult> {
    const session = this.sessions.get(sessionId);

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

    const sessionDir = this.getSessionDir(sessionId, session.partitionPath);
    const manifestPath = this.getManifestPath(sessionDir);
    const errors: string[] = [];
    const missingThoughtFiles: string[] = [];
    const missingBranchFiles: Record<string, string[]> = {};

    // Check manifest exists
    let manifest: SessionManifest | null = null;
    try {
      const manifestData = await fs.readFile(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestData);
    } catch (error) {
      return {
        valid: false,
        sessionExists: true,
        manifestExists: false,
        manifestValid: false,
        missingThoughtFiles: [],
        missingBranchFiles: {},
        errors: [`Manifest not found: ${manifestPath}`],
      };
    }

    // TypeScript doesn't narrow after try-catch, so add explicit check
    if (!manifest) {
      return {
        valid: false,
        sessionExists: true,
        manifestExists: false,
        manifestValid: false,
        missingThoughtFiles: [],
        missingBranchFiles: {},
        errors: ['Manifest parsed as null'],
      };
    }

    // Check thought files
    for (const thoughtFile of manifest.thoughtFiles) {
      const thoughtPath = path.join(sessionDir, thoughtFile);
      try {
        await fs.access(thoughtPath);
      } catch {
        missingThoughtFiles.push(thoughtFile);
        errors.push(`Missing thought file: ${thoughtFile}`);
      }
    }

    // Check branch files
    for (const [branchId, branchFiles] of Object.entries(manifest.branchFiles)) {
      for (const thoughtFile of branchFiles) {
        const thoughtPath = path.join(sessionDir, 'branches', branchId, thoughtFile);
        try {
          await fs.access(thoughtPath);
        } catch {
          if (!missingBranchFiles[branchId]) {
            missingBranchFiles[branchId] = [];
          }
          missingBranchFiles[branchId].push(thoughtFile);
          errors.push(`Missing branch thought file: ${branchId}/${thoughtFile}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      sessionExists: true,
      manifestExists: true,
      manifestValid: true,
      missingThoughtFiles,
      missingBranchFiles,
      errors,
    };
  }
}
