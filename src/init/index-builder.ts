/**
 * Session Index Builder
 *
 * Scans exported sessions and builds in-memory index for fast lookups.
 * Designed with pluggable sources and extractors for extensibility.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { SessionExport, ThoughtNode } from '../persistence/types.js';
import type {
  SessionIndex,
  SessionMetadata,
  ProjectSummary,
  TaskSummary,
  StructuredTags,
  IndexBuildOptions,
  IndexBuildResult,
  IndexBuildStats,
  IndexBuildError,
  TagExtractor,
  ConclusionExtractor,
} from './types.js';
import type {
  IndexSource,
  ITagExtractor,
  IConclusionExtractor,
  IIndexBuilder,
} from './interfaces.js';

// =============================================================================
// Default Tag Extractor
// =============================================================================

/**
 * Standard tag extractor for project:, task:, aspect: patterns
 */
export class StandardTagExtractor implements ITagExtractor {
  readonly name = 'standard';
  readonly priority = 100;

  extract(tags: string[]): Partial<StructuredTags> {
    const result: Partial<StructuredTags> = {
      project: null,
      task: null,
      aspect: null,
      other: [],
    };

    for (const tag of tags) {
      if (tag.startsWith('project:')) {
        result.project = tag.slice(8);
      } else if (tag.startsWith('task:')) {
        result.task = tag.slice(5);
      } else if (tag.startsWith('aspect:')) {
        result.aspect = tag.slice(7);
      } else {
        result.other!.push(tag);
      }
    }

    return result;
  }

  validate(tags: StructuredTags): boolean {
    // No validation needed for standard extractor
    return true;
  }
}

// =============================================================================
// Default Conclusion Extractor
// =============================================================================

/**
 * Extracts conclusion from last thought in main chain
 */
export class LastThoughtExtractor implements IConclusionExtractor {
  readonly name = 'last-thought';
  readonly priority = 100;

  extract(export_: SessionExport): string | null {
    if (!export_.nodes || export_.nodes.length === 0) {
      return null;
    }

    // Find last node in main chain (no branchId)
    const mainChainNodes = export_.nodes
      .filter(n => !n.branchId)
      .sort((a, b) => a.data.thoughtNumber - b.data.thoughtNumber);

    if (mainChainNodes.length === 0) {
      return null;
    }

    const lastNode = mainChainNodes[mainChainNodes.length - 1];
    return this.truncate(lastNode.data.thought, this.getMaxLength() ?? 500);
  }

  getMaxLength(): number | null {
    return 500; // Truncate conclusions to 500 chars
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength - 3) + '...';
  }
}

// =============================================================================
// Filesystem Index Source
// =============================================================================

/**
 * Index source that scans ~/.thoughtbox/exports/ directory
 */
export class FileSystemIndexSource implements IndexSource {
  private exportsDir: string;
  private maxFileSizeBytes: number;
  private includeHidden: boolean;

  constructor(options: {
    exportsDir?: string;
    maxFileSizeBytes?: number;
    includeHidden?: boolean;
  } = {}) {
    this.exportsDir = options.exportsDir || path.join(os.homedir(), '.thoughtbox', 'exports');
    this.maxFileSizeBytes = options.maxFileSizeBytes || 10 * 1024 * 1024; // 10MB default
    this.includeHidden = options.includeHidden ?? false;
  }

  async initialize(): Promise<void> {
    // Ensure exports directory exists
    await fs.promises.mkdir(this.exportsDir, { recursive: true });
  }

  async listExports(): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(this.exportsDir);
      return files
        .filter(f => f.endsWith('.json'))
        .filter(f => this.includeHidden || !f.startsWith('.'))
        .map(f => path.join(this.exportsDir, f));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return []; // Directory doesn't exist yet
      }
      throw err;
    }
  }

  async loadExport(filePath: string): Promise<SessionExport> {
    // Check file size
    const stats = await fs.promises.stat(filePath);
    if (stats.size > this.maxFileSizeBytes) {
      throw new Error(`File too large: ${filePath} (${stats.size} bytes)`);
    }

    const content = await fs.promises.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);

    // Validate basic structure
    if (!parsed.version || !parsed.session || !parsed.nodes) {
      throw new Error(`Invalid export format: ${filePath}`);
    }

    return parsed as SessionExport;
  }

  async getExportTimestamp(filePath: string): Promise<string | null> {
    try {
      const stats = await fs.promises.stat(filePath);
      return stats.mtime.toISOString();
    } catch {
      return null;
    }
  }

  async close(): Promise<void> {
    // No cleanup needed for filesystem source
  }
}

// =============================================================================
// Index Builder Implementation
// =============================================================================

/**
 * Builds session index from pluggable sources
 */
export class IndexBuilder implements IIndexBuilder {
  private source: IndexSource;
  private tagExtractors: ITagExtractor[];
  private conclusionExtractors: IConclusionExtractor[];

  constructor(options: {
    source?: IndexSource;
    tagExtractors?: ITagExtractor[];
    conclusionExtractors?: IConclusionExtractor[];
  } = {}) {
    this.source = options.source || new FileSystemIndexSource();
    this.tagExtractors = options.tagExtractors || [new StandardTagExtractor()];
    this.conclusionExtractors = options.conclusionExtractors || [new LastThoughtExtractor()];

    // Sort extractors by priority (highest first)
    this.tagExtractors.sort((a, b) => b.priority - a.priority);
    this.conclusionExtractors.sort((a, b) => b.priority - a.priority);
  }

  async build(options: IndexBuildOptions = {}): Promise<IndexBuildResult> {
    const startTime = Date.now();
    const errors: IndexBuildError[] = [];

    // Initialize source
    await this.source.initialize();

    // List all exports
    const exportPaths = await this.source.listExports();

    const stats: IndexBuildStats = {
      filesScanned: exportPaths.length,
      filesParsed: 0,
      sessionsIndexed: 0,
      projectsFound: 0,
      tasksFound: 0,
      buildTimeMs: 0,
    };

    // Build index maps
    const byId = new Map<string, SessionMetadata>();
    const byProject = new Map<string, Set<string>>();
    const byTask = new Map<string, Set<string>>();

    // Parse each export
    for (const exportPath of exportPaths) {
      try {
        const export_ = await this.source.loadExport(exportPath);
        const metadata = this.extractMetadata(export_, exportPath);

        byId.set(metadata.id, metadata);
        stats.filesParsed++;
        stats.sessionsIndexed++;

        // Index by project
        if (metadata.project) {
          if (!byProject.has(metadata.project)) {
            byProject.set(metadata.project, new Set());
          }
          byProject.get(metadata.project)!.add(metadata.id);
        }

        // Index by task (compound key: project:task)
        if (metadata.project && metadata.task) {
          const taskKey = `${metadata.project}:${metadata.task}`;
          if (!byTask.has(taskKey)) {
            byTask.set(taskKey, new Set());
          }
          byTask.get(taskKey)!.add(metadata.id);
        }
      } catch (err) {
        errors.push({
          filePath: exportPath,
          message: (err as Error).message,
          type: this.categorizeError(err),
        });
      }
    }

    // Compute project summaries
    const projects = this.computeProjectSummaries(byId, byProject, byTask);
    stats.projectsFound = projects.length;
    stats.tasksFound = byTask.size;

    // Cleanup source
    await this.source.close();

    stats.buildTimeMs = Date.now() - startTime;

    const index: SessionIndex = {
      byId,
      byProject,
      byTask,
      projects,
      builtAt: new Date(),
    };

    return { index, stats, errors };
  }

  /**
   * Extract metadata from session export
   */
  private extractMetadata(export_: SessionExport, exportPath: string): SessionMetadata {
    const { session, nodes } = export_;

    // Extract structured tags using all extractors
    const structuredTags = this.extractStructuredTags(session.tags);

    // Extract conclusion using first successful extractor
    const lastConclusion = this.extractConclusion(export_);

    // Count thoughts in main chain
    const thoughtCount = nodes.filter(n => !n.branchId).length;

    return {
      id: session.id,
      title: session.title,
      project: structuredTags.project,
      task: structuredTags.task,
      aspect: structuredTags.aspect,
      thoughtCount,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      exportPath,
      lastConclusion,
    };
  }

  /**
   * Extract structured tags using registered extractors
   */
  private extractStructuredTags(tags: string[]): StructuredTags {
    const result: StructuredTags = {
      project: null,
      task: null,
      aspect: null,
      other: [],
    };

    // Run extractors in priority order
    for (const extractor of this.tagExtractors) {
      const extracted = extractor.extract(tags);

      // Merge results (first extractor wins for each field)
      if (extracted.project && !result.project) {
        result.project = extracted.project;
      }
      if (extracted.task && !result.task) {
        result.task = extracted.task;
      }
      if (extracted.aspect && !result.aspect) {
        result.aspect = extracted.aspect;
      }
      if (extracted.other) {
        result.other.push(...extracted.other);
      }
    }

    return result;
  }

  /**
   * Extract conclusion using registered extractors
   */
  private extractConclusion(export_: SessionExport): string | null {
    for (const extractor of this.conclusionExtractors) {
      const conclusion = extractor.extract(export_);
      if (conclusion) {
        return conclusion;
      }
    }
    return null;
  }

  /**
   * Compute project summaries from index data
   */
  private computeProjectSummaries(
    byId: Map<string, SessionMetadata>,
    byProject: Map<string, Set<string>>,
    byTask: Map<string, Set<string>>
  ): ProjectSummary[] {
    const summaries: ProjectSummary[] = [];

    for (const [projectName, sessionIds] of byProject.entries()) {
      const sessions = Array.from(sessionIds)
        .map(id => byId.get(id)!)
        .filter(Boolean);

      if (sessions.length === 0) continue;

      // Compute project-level stats
      const lastWorked = new Date(
        Math.max(...sessions.map(s => s.updatedAt.getTime()))
      );

      // Group by tasks
      const taskMap = new Map<string, SessionMetadata[]>();
      for (const session of sessions) {
        if (session.task) {
          if (!taskMap.has(session.task)) {
            taskMap.set(session.task, []);
          }
          taskMap.get(session.task)!.push(session);
        }
      }

      // Compute task summaries
      const tasks: TaskSummary[] = [];
      for (const [taskName, taskSessions] of taskMap.entries()) {
        const taskLastWorked = new Date(
          Math.max(...taskSessions.map(s => s.updatedAt.getTime()))
        );

        const aspects = Array.from(
          new Set(taskSessions.map(s => s.aspect).filter(Boolean))
        ) as string[];

        tasks.push({
          name: taskName,
          sessionCount: taskSessions.length,
          lastWorked: taskLastWorked,
          aspects,
        });
      }

      // Sort tasks by lastWorked desc
      tasks.sort((a, b) => b.lastWorked.getTime() - a.lastWorked.getTime());

      summaries.push({
        name: projectName,
        sessionCount: sessions.length,
        lastWorked,
        tasks,
      });
    }

    // Sort projects by lastWorked desc
    summaries.sort((a, b) => b.lastWorked.getTime() - a.lastWorked.getTime());

    return summaries;
  }

  /**
   * Categorize error for reporting
   */
  private categorizeError(err: unknown): IndexBuildError['type'] {
    const message = (err as Error).message;
    if (message.includes('JSON')) return 'parse-error';
    if (message.includes('Invalid export format')) return 'invalid-format';
    if (message.includes('ENOENT') || message.includes('EACCES')) return 'io-error';
    return 'unknown';
  }

  /**
   * Incrementally update index with new export
   */
  async updateIndex(index: SessionIndex, exportIdentifier: string): Promise<SessionIndex> {
    try {
      const export_ = await this.source.loadExport(exportIdentifier);
      const metadata = this.extractMetadata(export_, exportIdentifier);

      // Update byId
      const oldMetadata = index.byId.get(metadata.id);
      index.byId.set(metadata.id, metadata);

      // Update byProject
      if (metadata.project) {
        if (!index.byProject.has(metadata.project)) {
          index.byProject.set(metadata.project, new Set());
        }
        index.byProject.get(metadata.project)!.add(metadata.id);
      }

      // Remove from old project if changed
      if (oldMetadata?.project && oldMetadata.project !== metadata.project) {
        index.byProject.get(oldMetadata.project)?.delete(metadata.id);
      }

      // Update byTask
      if (metadata.project && metadata.task) {
        const taskKey = `${metadata.project}:${metadata.task}`;
        if (!index.byTask.has(taskKey)) {
          index.byTask.set(taskKey, new Set());
        }
        index.byTask.get(taskKey)!.add(metadata.id);
      }

      // Remove from old task if changed
      if (oldMetadata?.project && oldMetadata.task) {
        const oldTaskKey = `${oldMetadata.project}:${oldMetadata.task}`;
        if (oldTaskKey !== `${metadata.project}:${metadata.task}`) {
          index.byTask.get(oldTaskKey)?.delete(metadata.id);
        }
      }

      // Recompute project summaries
      index.projects = this.computeProjectSummaries(
        index.byId,
        index.byProject,
        index.byTask
      );

      return index;
    } catch (err) {
      // Log error but don't fail
      console.error(`Failed to update index for ${exportIdentifier}:`, err);
      return index;
    }
  }

  /**
   * Remove session from index
   */
  removeFromIndex(index: SessionIndex, sessionId: string): SessionIndex {
    const metadata = index.byId.get(sessionId);
    if (!metadata) return index;

    // Remove from byId
    index.byId.delete(sessionId);

    // Remove from byProject
    if (metadata.project) {
      index.byProject.get(metadata.project)?.delete(sessionId);
      if (index.byProject.get(metadata.project)?.size === 0) {
        index.byProject.delete(metadata.project);
      }
    }

    // Remove from byTask
    if (metadata.project && metadata.task) {
      const taskKey = `${metadata.project}:${metadata.task}`;
      index.byTask.get(taskKey)?.delete(sessionId);
      if (index.byTask.get(taskKey)?.size === 0) {
        index.byTask.delete(taskKey);
      }
    }

    // Recompute project summaries
    index.projects = this.computeProjectSummaries(
      index.byId,
      index.byProject,
      index.byTask
    );

    return index;
  }
}
