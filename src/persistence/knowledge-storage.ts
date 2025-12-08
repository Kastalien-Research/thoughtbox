/**
 * KnowledgeStorage Implementation
 *
 * Implements storage for the Knowledge Zone ("The Garden"):
 * - SQLite for queryable metadata (patterns index)
 * - Filesystem for human-readable content (Markdown files with YAML frontmatter)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { eq, desc, asc, like, or } from 'drizzle-orm';
import { getDatabase, getDataDir, type DatabaseInstance } from './db/index.js';
import * as schema from './db/schema.js';
import type {
  KnowledgePattern,
  CreatePatternParams,
  UpdatePatternParams,
  PatternFilter,
  ScratchpadNote,
} from './types.js';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a URL-safe slug from a title
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate YAML frontmatter for a pattern
 */
function generateFrontmatter(pattern: KnowledgePattern): string {
  const lines = [
    '---',
    `id: ${pattern.id}`,
    `title: "${pattern.title.replace(/"/g, '\\"')}"`,
    `description: "${pattern.description.replace(/"/g, '\\"')}"`,
    `tags: [${pattern.tags.map(t => `"${t}"`).join(', ')}]`,
  ];

  if (pattern.derivedFromSessions && pattern.derivedFromSessions.length > 0) {
    lines.push(`derived_from_sessions: [${pattern.derivedFromSessions.map(s => `"${s}"`).join(', ')}]`);
  }

  if (pattern.createdBy) {
    lines.push(`created_by: "${pattern.createdBy}"`);
  }

  lines.push(`created_at: "${pattern.createdAt.toISOString()}"`);
  lines.push(`updated_at: "${pattern.updatedAt.toISOString()}"`);
  lines.push('---');
  lines.push('');

  return lines.join('\n');
}

/**
 * Parse YAML frontmatter from a Markdown file
 */
function parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const [, yaml, body] = match;
  const frontmatter: Record<string, any> = {};

  // Simple YAML parsing (handles our specific format)
  for (const line of yaml.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Handle arrays
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1);
      frontmatter[key] = value
        .split(',')
        .map(v => v.trim().replace(/^["']|["']$/g, ''))
        .filter(v => v.length > 0);
    }
    // Handle quoted strings
    else if (value.startsWith('"') && value.endsWith('"')) {
      frontmatter[key] = value.slice(1, -1);
    }
    // Handle plain values
    else {
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body: body.trim() };
}

// =============================================================================
// KnowledgeStorage Implementation
// =============================================================================

export class KnowledgeStorage {
  private dbInstance: DatabaseInstance | null = null;
  private dataDir: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || getDataDir();
  }

  private get db() {
    if (!this.dbInstance) {
      throw new Error('KnowledgeStorage not initialized. Call initialize() first.');
    }
    return this.dbInstance.db;
  }

  /**
   * Get the knowledge directory path
   */
  private get knowledgeDir(): string {
    return path.join(this.dataDir, 'knowledge');
  }

  /**
   * Get the patterns directory path
   */
  private get patternsDir(): string {
    return path.join(this.knowledgeDir, 'patterns');
  }

  /**
   * Get the scratchpad directory path
   */
  private get scratchpadDir(): string {
    return path.join(this.knowledgeDir, 'scratchpad');
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  /**
   * Initialize knowledge storage
   * Note: This expects the main FileSystemStorage to have already run migrations
   */
  async initialize(existingDb?: DatabaseInstance): Promise<void> {
    // Use provided database instance or get singleton
    this.dbInstance = existingDb || getDatabase(this.dataDir);

    // Ensure directory structure exists
    await fs.mkdir(this.patternsDir, { recursive: true });
    await fs.mkdir(this.scratchpadDir, { recursive: true });
  }

  // ===========================================================================
  // Pattern Operations
  // ===========================================================================

  /**
   * Create a new knowledge pattern
   */
  async createPattern(params: CreatePatternParams): Promise<KnowledgePattern> {
    const now = new Date();
    const id = slugify(params.title);

    // Check for duplicate ID
    const existing = await this.getPattern(id);
    if (existing) {
      throw new Error(`Pattern with ID "${id}" already exists. Choose a different title.`);
    }

    const pattern: KnowledgePattern = {
      id,
      title: params.title,
      description: params.description,
      tags: params.tags || [],
      content: params.content,
      derivedFromSessions: params.derivedFromSessions,
      createdBy: params.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Insert into SQLite
    await this.db.insert(schema.patterns).values({
      id: pattern.id,
      title: pattern.title,
      description: pattern.description,
      tags: JSON.stringify(pattern.tags),
      derivedFromSessions: JSON.stringify(pattern.derivedFromSessions || []),
      createdBy: pattern.createdBy,
    });

    // 2. Write Markdown file with frontmatter
    await this.writePatternFile(pattern);

    return pattern;
  }

  /**
   * Get a pattern by ID
   */
  async getPattern(id: string): Promise<KnowledgePattern | null> {
    const result = await this.db
      .select()
      .from(schema.patterns)
      .where(eq(schema.patterns.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    const content = await this.readPatternContent(id);

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      tags: JSON.parse(row.tags),
      content,
      derivedFromSessions: row.derivedFromSessions ? JSON.parse(row.derivedFromSessions) : undefined,
      createdBy: row.createdBy ?? undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  /**
   * Update an existing pattern
   */
  async updatePattern(id: string, params: UpdatePatternParams): Promise<KnowledgePattern> {
    const existing = await this.getPattern(id);
    if (!existing) {
      throw new Error(`Pattern "${id}" not found`);
    }

    const now = new Date();
    const updated: KnowledgePattern = {
      ...existing,
      title: params.title ?? existing.title,
      description: params.description ?? existing.description,
      tags: params.tags ?? existing.tags,
      content: params.content ?? existing.content,
      derivedFromSessions: params.derivedFromSessions ?? existing.derivedFromSessions,
      updatedAt: now,
    };

    // 1. Update SQLite
    await this.db
      .update(schema.patterns)
      .set({
        title: updated.title,
        description: updated.description,
        tags: JSON.stringify(updated.tags),
        derivedFromSessions: JSON.stringify(updated.derivedFromSessions || []),
        updatedAt: now,
      })
      .where(eq(schema.patterns.id, id));

    // 2. Update Markdown file
    await this.writePatternFile(updated);

    return updated;
  }

  /**
   * Delete a pattern
   */
  async deletePattern(id: string): Promise<void> {
    // 1. Delete from SQLite
    await this.db.delete(schema.patterns).where(eq(schema.patterns.id, id));

    // 2. Delete Markdown file
    const filePath = path.join(this.patternsDir, `${id}.md`);
    await fs.rm(filePath, { force: true });
  }

  /**
   * List patterns with optional filtering
   */
  async listPatterns(filter?: PatternFilter): Promise<KnowledgePattern[]> {
    let query = this.db.select().from(schema.patterns);

    // Apply sorting
    const sortBy = filter?.sortBy || 'updatedAt';
    const sortOrder = filter?.sortOrder || 'desc';

    if (sortOrder === 'desc') {
      if (sortBy === 'createdAt') {
        query = query.orderBy(desc(schema.patterns.createdAt)) as typeof query;
      } else if (sortBy === 'title') {
        query = query.orderBy(desc(schema.patterns.title)) as typeof query;
      } else {
        query = query.orderBy(desc(schema.patterns.updatedAt)) as typeof query;
      }
    } else {
      if (sortBy === 'createdAt') {
        query = query.orderBy(asc(schema.patterns.createdAt)) as typeof query;
      } else if (sortBy === 'title') {
        query = query.orderBy(asc(schema.patterns.title)) as typeof query;
      } else {
        query = query.orderBy(asc(schema.patterns.updatedAt)) as typeof query;
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

    // Convert to Pattern objects with content
    const patterns: KnowledgePattern[] = [];
    for (const row of rows) {
      const content = await this.readPatternContent(row.id);
      patterns.push({
        id: row.id,
        title: row.title,
        description: row.description,
        tags: JSON.parse(row.tags),
        content,
        derivedFromSessions: row.derivedFromSessions ? JSON.parse(row.derivedFromSessions) : undefined,
        createdBy: row.createdBy ?? undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      });
    }

    // Apply tag filter (in-memory for simplicity)
    let filtered = patterns;
    if (filter?.tags && filter.tags.length > 0) {
      filtered = filtered.filter(pattern =>
        filter.tags!.some(tag => pattern.tags.includes(tag))
      );
    }

    // Apply search filter (in-memory)
    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(
        pattern =>
          pattern.title.toLowerCase().includes(searchLower) ||
          pattern.description.toLowerCase().includes(searchLower) ||
          pattern.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          pattern.content.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }

  /**
   * Get all unique tags across all patterns
   */
  async getAllTags(): Promise<string[]> {
    const rows = await this.db.select({ tags: schema.patterns.tags }).from(schema.patterns);
    const tagSet = new Set<string>();

    for (const row of rows) {
      const tags = JSON.parse(row.tags) as string[];
      tags.forEach(tag => tagSet.add(tag));
    }

    return Array.from(tagSet).sort();
  }

  // ===========================================================================
  // Scratchpad Operations
  // ===========================================================================

  /**
   * Create or update a scratchpad note
   */
  async writeScratchpad(topic: string, content: string): Promise<ScratchpadNote> {
    const now = new Date();
    const id = slugify(topic);
    const filePath = path.join(this.scratchpadDir, `${id}.md`);

    // Check if file exists to determine createdAt
    let createdAt = now;
    try {
      const stats = await fs.stat(filePath);
      createdAt = stats.birthtime;
    } catch {
      // File doesn't exist, use now
    }

    // Build file content with simple header
    const fileContent = `# ${topic}\n\n_Updated: ${now.toISOString()}_\n\n${content}`;
    await fs.writeFile(filePath, fileContent, 'utf-8');

    return {
      id,
      title: topic,
      content,
      createdAt,
      updatedAt: now,
    };
  }

  /**
   * Read a scratchpad note
   */
  async readScratchpad(id: string): Promise<ScratchpadNote | null> {
    const filePath = path.join(this.scratchpadDir, `${id}.md`);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);

      // Parse title from first line
      const lines = content.split('\n');
      const titleLine = lines.find(l => l.startsWith('# '));
      const title = titleLine ? titleLine.slice(2).trim() : id;

      // Extract body (skip header and updated line)
      const bodyStart = content.indexOf('\n\n', content.indexOf('\n\n') + 2);
      const body = bodyStart > -1 ? content.slice(bodyStart + 2).trim() : content;

      return {
        id,
        title,
        content: body,
        createdAt: stats.birthtime,
        updatedAt: stats.mtime,
      };
    } catch (err) {
      if ((err as { code?: string }).code === 'ENOENT') return null;
      throw err;
    }
  }

  /**
   * List all scratchpad notes
   */
  async listScratchpad(): Promise<ScratchpadNote[]> {
    try {
      const files = await fs.readdir(this.scratchpadDir);
      const notes: ScratchpadNote[] = [];

      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        const id = file.slice(0, -3); // Remove .md extension
        const note = await this.readScratchpad(id);
        if (note) notes.push(note);
      }

      return notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch {
      return [];
    }
  }

  /**
   * Delete a scratchpad note
   */
  async deleteScratchpad(id: string): Promise<void> {
    const filePath = path.join(this.scratchpadDir, `${id}.md`);
    await fs.rm(filePath, { force: true });
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  /**
   * Write a pattern to its Markdown file
   */
  private async writePatternFile(pattern: KnowledgePattern): Promise<void> {
    const filePath = path.join(this.patternsDir, `${pattern.id}.md`);
    const frontmatter = generateFrontmatter(pattern);
    const content = frontmatter + pattern.content;

    // Atomic write
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, content, 'utf-8');
    await fs.rename(tempPath, filePath);
  }

  /**
   * Read pattern content from its Markdown file
   */
  private async readPatternContent(id: string): Promise<string> {
    const filePath = path.join(this.patternsDir, `${id}.md`);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { body } = parseFrontmatter(content);
      return body;
    } catch (err) {
      if ((err as { code?: string }).code === 'ENOENT') {
        return ''; // Pattern file missing, return empty content
      }
      throw err;
    }
  }
}
