/**
 * FileSystemStorage Implementation
 *
 * Implements the ThoughtboxStorage interface using a hybrid approach:
 * - SQLite for queryable metadata (sessions, config)
 * - Filesystem for human-readable content (thoughts as JSON files)
 *
 * Following the Srcbook pattern for local-first persistence.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { eq, desc, asc, like, or } from 'drizzle-orm';
import { getDatabase, getDataDir, type DatabaseInstance } from './db/index.js';
import { runMigrations } from './db/migrate.js';
import * as schema from './db/schema.js';
import type {
  ThoughtboxStorage,
  Config,
  Session,
  CreateSessionParams,
  SessionFilter,
  ThoughtData,
  SessionManifest,
  IntegrityValidationResult,
} from './types.js';

// =============================================================================
// FileSystemStorage Implementation
// =============================================================================

export class FileSystemStorage implements ThoughtboxStorage {
  private dbInstance: DatabaseInstance | null = null;
  private dataDir: string;
  private manifestLocks: Map<string, Promise<void>> = new Map();

  constructor(dataDir?: string) {
    this.dataDir = dataDir || getDataDir();
  }

  private get db() {
    if (!this.dbInstance) {
      throw new Error('Storage not initialized. Call initialize() first.');
    }
    return this.dbInstance.db;
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  async initialize(): Promise<void> {
    // 1. Ensure directory structure exists
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.mkdir(path.join(this.dataDir, 'sessions'), { recursive: true });
    await fs.mkdir(path.join(this.dataDir, 'notebooks'), { recursive: true });

    // 2. Initialize database connection
    this.dbInstance = getDatabase(this.dataDir);

    // 3. Run migrations
    await runMigrations(this.dataDir);

    // 4. Initialize config if needed
    const existingConfig = await this.getConfig();
    if (!existingConfig) {
      await this.updateConfig({
        installId: randomUUID(),
        dataDir: this.dataDir,
        disableThoughtLogging: false,
      });
    }
  }

  // ===========================================================================
  // Config Operations
  // ===========================================================================

  async getConfig(): Promise<Config | null> {
    const result = await this.db.select().from(schema.config).limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    return {
      installId: row.installId,
      dataDir: row.dataDir,
      disableThoughtLogging: row.disableThoughtLogging,
      createdAt: new Date(row.createdAt),
    };
  }

  async updateConfig(attrs: Partial<Config>): Promise<Config> {
    const existing = await this.getConfig();

    if (!existing) {
      // Insert new config
      const newConfig = {
        installId: attrs.installId || randomUUID(),
        dataDir: attrs.dataDir || this.dataDir,
        disableThoughtLogging: attrs.disableThoughtLogging ?? false,
      };
      await this.db.insert(schema.config).values(newConfig);
      return { ...newConfig, createdAt: new Date() };
    } else {
      // Update existing
      const updated = { ...existing, ...attrs };
      await this.db
        .update(schema.config)
        .set({
          dataDir: updated.dataDir,
          disableThoughtLogging: updated.disableThoughtLogging,
        })
        .where(eq(schema.config.installId, existing.installId));
      return updated;
    }
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

    // 1. Insert into SQLite
    await this.db.insert(schema.sessions).values({
      id: session.id,
      title: session.title,
      description: session.description,
      tags: JSON.stringify(session.tags),
      thoughtCount: 0,
      branchCount: 0,
    });

    // 2. Create filesystem structure
    const sessionDir = path.join(this.dataDir, 'sessions', id);
    await fs.mkdir(sessionDir, { recursive: true });
    await fs.mkdir(path.join(sessionDir, 'thoughts'), { recursive: true });
    await fs.mkdir(path.join(sessionDir, 'branches'), { recursive: true });
    await fs.mkdir(path.join(sessionDir, 'exports'), { recursive: true });

    // 3. Write initial manifest
    const manifest: SessionManifest = {
      id,
      version: '1.0.0',
      thoughtFiles: [],
      branchFiles: {},
      metadata: {
        title: session.title,
        description: session.description,
        tags: session.tags,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      },
    };
    await this.writeManifest(id, manifest);

    return session;
  }

  async getSession(id: string): Promise<Session | null> {
    const result = await this.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    return this.rowToSession(row);
  }

  async updateSession(id: string, attrs: Partial<Session>): Promise<Session> {
    const existing = await this.getSession(id);
    if (!existing) throw new Error(`Session ${id} not found`);

    const updated = { ...existing, ...attrs, updatedAt: new Date() };

    // Update SQLite
    await this.db
      .update(schema.sessions)
      .set({
        title: updated.title,
        description: updated.description,
        tags: JSON.stringify(updated.tags),
        thoughtCount: updated.thoughtCount,
        branchCount: updated.branchCount,
        updatedAt: updated.updatedAt,
        lastAccessedAt: updated.lastAccessedAt,
      })
      .where(eq(schema.sessions.id, id));

    // Update manifest metadata
    try {
      const manifest = await this.readManifest(id);
      manifest.metadata = {
        title: updated.title,
        description: updated.description,
        tags: updated.tags,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
      await this.writeManifest(id, manifest);
    } catch {
      // Manifest may not exist yet for edge cases
    }

    return updated;
  }

  async deleteSession(id: string): Promise<void> {
    // 1. Delete from SQLite
    await this.db
      .delete(schema.sessions)
      .where(eq(schema.sessions.id, id));

    // 2. Delete filesystem directory
    const sessionDir = path.join(this.dataDir, 'sessions', id);
    await fs.rm(sessionDir, { recursive: true, force: true });
  }

  async listSessions(filter?: SessionFilter): Promise<Session[]> {
    let query = this.db.select().from(schema.sessions);

    // Apply sorting
    const sortBy = filter?.sortBy || 'updatedAt';
    const sortOrder = filter?.sortOrder || 'desc';

    if (sortOrder === 'desc') {
      if (sortBy === 'createdAt') {
        query = query.orderBy(desc(schema.sessions.createdAt)) as typeof query;
      } else if (sortBy === 'title') {
        query = query.orderBy(desc(schema.sessions.title)) as typeof query;
      } else {
        query = query.orderBy(desc(schema.sessions.updatedAt)) as typeof query;
      }
    } else {
      if (sortBy === 'createdAt') {
        query = query.orderBy(asc(schema.sessions.createdAt)) as typeof query;
      } else if (sortBy === 'title') {
        query = query.orderBy(asc(schema.sessions.title)) as typeof query;
      } else {
        query = query.orderBy(asc(schema.sessions.updatedAt)) as typeof query;
      }
    }

    // Apply limit and offset
    if (filter?.limit) {
      query = query.limit(filter.limit) as typeof query;
    }
    if (filter?.offset) {
      query = query.offset(filter.offset) as typeof query;
    }

    const rows = await query;

    // Convert to Session objects
    let sessions = rows.map((row) => this.rowToSession(row));

    // Apply tag filter (in-memory for simplicity)
    if (filter?.tags && filter.tags.length > 0) {
      sessions = sessions.filter((session) =>
        filter.tags!.some((tag) => session.tags.includes(tag))
      );
    }

    // Apply search filter (in-memory)
    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      sessions = sessions.filter(
        (session) =>
          session.title.toLowerCase().includes(searchLower) ||
          session.description?.toLowerCase().includes(searchLower) ||
          session.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    return sessions;
  }

  // ===========================================================================
  // Thought Operations
  // ===========================================================================

  async saveThought(sessionId: string, thought: ThoughtData): Promise<void> {
    const sessionDir = path.join(this.dataDir, 'sessions', sessionId);
    const thoughtFile = `${String(thought.thoughtNumber).padStart(3, '0')}.json`;
    const thoughtPath = path.join(sessionDir, 'thoughts', thoughtFile);

    // Add timestamp if not present
    const enrichedThought: ThoughtData = {
      ...thought,
      timestamp: thought.timestamp || new Date().toISOString(),
    };

    // Write thought file (atomic via temp file + rename)
    const tempPath = `${thoughtPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(enrichedThought, null, 2), 'utf-8');
    await fs.rename(tempPath, thoughtPath);

    // Update manifest atomically to prevent race conditions
    await this.withManifestLock(sessionId, async () => {
      const manifest = await this.readManifest(sessionId);
      if (!manifest.thoughtFiles.includes(thoughtFile)) {
        manifest.thoughtFiles.push(thoughtFile);
        manifest.thoughtFiles.sort();
        await this.writeManifest(sessionId, manifest);
      }
    });
  }

  async getThoughts(sessionId: string): Promise<ThoughtData[]> {
    try {
      const manifest = await this.readManifest(sessionId);
      const sessionDir = path.join(this.dataDir, 'sessions', sessionId);

      const thoughts: ThoughtData[] = [];
      for (const file of manifest.thoughtFiles) {
        const thoughtPath = path.join(sessionDir, 'thoughts', file);
        try {
          const content = await fs.readFile(thoughtPath, 'utf-8');
          thoughts.push(JSON.parse(content));
        } catch (err) {
          // Log warning but continue - individual files may be missing
          console.error(`Warning: Failed to read thought file ${file} for session ${sessionId}:`, (err as Error).message);
        }
      }

      return thoughts.sort((a, b) => a.thoughtNumber - b.thoughtNumber);
    } catch (err) {
      // If manifest is missing or corrupted, throw a clear error
      throw new Error(
        `Failed to load thoughts for session ${sessionId}: ${(err as Error).message}. ` +
        `The session may be corrupted. Use validateSessionIntegrity() to diagnose.`
      );
    }
  }

  async getThought(
    sessionId: string,
    thoughtNumber: number
  ): Promise<ThoughtData | null> {
    const thoughtFile = `${String(thoughtNumber).padStart(3, '0')}.json`;
    const thoughtPath = path.join(
      this.dataDir,
      'sessions',
      sessionId,
      'thoughts',
      thoughtFile
    );

    try {
      const content = await fs.readFile(thoughtPath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      if ((err as { code?: string }).code === 'ENOENT') return null;
      throw err;
    }
  }

  async saveBranchThought(
    sessionId: string,
    branchId: string,
    thought: ThoughtData
  ): Promise<void> {
    const sessionDir = path.join(this.dataDir, 'sessions', sessionId);
    const branchDir = path.join(sessionDir, 'branches', branchId);

    // Ensure branch directory exists
    await fs.mkdir(branchDir, { recursive: true });

    const thoughtFile = `${String(thought.thoughtNumber).padStart(3, '0')}.json`;
    const thoughtPath = path.join(branchDir, thoughtFile);

    // Add timestamp if not present
    const enrichedThought: ThoughtData = {
      ...thought,
      timestamp: thought.timestamp || new Date().toISOString(),
    };

    // Write thought file
    const tempPath = `${thoughtPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(enrichedThought, null, 2), 'utf-8');
    await fs.rename(tempPath, thoughtPath);

    // Update manifest atomically to prevent race conditions
    await this.withManifestLock(sessionId, async () => {
      const manifest = await this.readManifest(sessionId);
      if (!manifest.branchFiles[branchId]) {
        manifest.branchFiles[branchId] = [];
      }
      if (!manifest.branchFiles[branchId].includes(thoughtFile)) {
        manifest.branchFiles[branchId].push(thoughtFile);
        manifest.branchFiles[branchId].sort();
        await this.writeManifest(sessionId, manifest);
      }
    });
  }

  async getBranch(sessionId: string, branchId: string): Promise<ThoughtData[]> {
    const manifest = await this.readManifest(sessionId);
    const branchFiles = manifest.branchFiles[branchId] || [];
    const branchDir = path.join(
      this.dataDir,
      'sessions',
      sessionId,
      'branches',
      branchId
    );

    const thoughts: ThoughtData[] = [];
    for (const file of branchFiles) {
      const thoughtPath = path.join(branchDir, file);
      try {
        const content = await fs.readFile(thoughtPath, 'utf-8');
        thoughts.push(JSON.parse(content));
      } catch {
        // Skip missing files
      }
    }

    return thoughts.sort((a, b) => a.thoughtNumber - b.thoughtNumber);
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
    const manifest = await this.readManifest(sessionId);

    if (format === 'json') {
      return JSON.stringify(
        {
          session,
          thoughts,
          branches: manifest.branchFiles,
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
    const branchIds = Object.keys(manifest.branchFiles);
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

    const exportContent = lines.join('\n');

    // Optionally save to exports directory
    const exportPath = path.join(
      this.dataDir,
      'sessions',
      sessionId,
      'exports',
      'reasoning-chain.md'
    );
    await fs.writeFile(exportPath, exportContent, 'utf-8');

    return exportContent;
  }

  // ===========================================================================
  // Integrity Operations
  // ===========================================================================

  async validateSessionIntegrity(sessionId: string): Promise<IntegrityValidationResult> {
    const result: IntegrityValidationResult = {
      valid: true,
      sessionExists: false,
      manifestExists: false,
      manifestValid: false,
      missingThoughtFiles: [],
      missingBranchFiles: {},
      errors: [],
    };

    const sessionDir = path.join(this.dataDir, 'sessions', sessionId);

    // 1. Check if session directory exists
    try {
      await fs.access(sessionDir);
      result.sessionExists = true;
    } catch {
      result.valid = false;
      result.errors.push(`Session directory not found: ${sessionDir}`);
      return result; // No point checking further
    }

    // 2. Check if manifest exists and is valid
    const manifestPath = path.join(sessionDir, 'manifest.json');
    let manifest: SessionManifest | null = null;
    
    try {
      await fs.access(manifestPath);
      result.manifestExists = true;
      
      const content = await fs.readFile(manifestPath, 'utf-8');
      manifest = JSON.parse(content);
      result.manifestValid = true;
    } catch (err) {
      result.valid = false;
      if (!result.manifestExists) {
        result.errors.push(`Manifest file not found: ${manifestPath}`);
      } else {
        result.errors.push(`Manifest file is corrupted or invalid JSON: ${(err as Error).message}`);
      }
      return result; // Can't validate files without manifest
    }

    // TypeScript guard: manifest is guaranteed to be non-null here
    if (!manifest) {
      result.errors.push('Unexpected error: manifest is null after validation');
      return result;
    }

    // 3. Check if thought files referenced in manifest exist
    const thoughtsDir = path.join(sessionDir, 'thoughts');
    for (const file of manifest.thoughtFiles) {
      const thoughtPath = path.join(thoughtsDir, file);
      try {
        await fs.access(thoughtPath);
      } catch {
        result.valid = false;
        result.missingThoughtFiles.push(file);
      }
    }

    // 4. Check if branch files referenced in manifest exist
    for (const [branchId, files] of Object.entries(manifest.branchFiles)) {
      const branchDir = path.join(sessionDir, 'branches', branchId);
      const missingFiles: string[] = [];
      
      for (const file of files) {
        const branchThoughtPath = path.join(branchDir, file);
        try {
          await fs.access(branchThoughtPath);
        } catch {
          result.valid = false;
          missingFiles.push(file);
        }
      }
      
      if (missingFiles.length > 0) {
        result.missingBranchFiles[branchId] = missingFiles;
      }
    }

    // 5. Add summary error if files are missing
    if (result.missingThoughtFiles.length > 0) {
      result.errors.push(
        `Missing ${result.missingThoughtFiles.length} thought file(s): ${result.missingThoughtFiles.join(', ')}`
      );
    }
    
    const missingBranchCount = Object.keys(result.missingBranchFiles).length;
    if (missingBranchCount > 0) {
      result.errors.push(
        `Missing files in ${missingBranchCount} branch(es)`
      );
    }

    return result;
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  /**
   * Executes a manifest operation atomically to prevent race conditions.
   * Ensures only one operation per session runs at a time.
   */
  private async withManifestLock<T>(
    sessionId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    // Wait for any existing operation on this session to complete
    const existingLock = this.manifestLocks.get(sessionId);
    if (existingLock) {
      await existingLock;
    }

    // Create a new lock for this operation
    let resolveLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    this.manifestLocks.set(sessionId, lockPromise);

    try {
      // Execute the operation
      return await operation();
    } finally {
      // Release the lock
      resolveLock!();
      this.manifestLocks.delete(sessionId);
    }
  }

  private rowToSession(row: schema.SessionRow): Session {
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      tags: JSON.parse(row.tags),
      thoughtCount: row.thoughtCount,
      branchCount: row.branchCount,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      lastAccessedAt: new Date(row.lastAccessedAt),
    };
  }

  private async readManifest(sessionId: string): Promise<SessionManifest> {
    const manifestPath = path.join(
      this.dataDir,
      'sessions',
      sessionId,
      'manifest.json'
    );
    
    try {
      const content = await fs.readFile(manifestPath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      const error = err as { code?: string; message: string };
      if (error.code === 'ENOENT') {
        throw new Error(
          `Session manifest not found for session ${sessionId}. ` +
          `The session may be corrupted. Path: ${manifestPath}`
        );
      }
      throw new Error(
        `Failed to read session manifest for ${sessionId}: ${error.message}`
      );
    }
  }

  private async writeManifest(
    sessionId: string,
    manifest: SessionManifest
  ): Promise<void> {
    const manifestPath = path.join(
      this.dataDir,
      'sessions',
      sessionId,
      'manifest.json'
    );

    // Atomic write using temp file + rename
    const tempPath = `${manifestPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(manifest, null, 2), 'utf-8');
    await fs.rename(tempPath, manifestPath);
  }
}
