/**
 * Integration with .claude/ folder for usage analytics and codebase learning
 *
 * Philosophy: Thoughtbox is a measurement instrument, not a memory server.
 * Learning happens in the codebase (.claude/ folder), not in Thoughtbox itself.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { Logger } from './server-factory.js';

export interface LoopAccessRecord {
  timestamp: string;
  loop: string;
  session: string;
  mcp_session?: string;
}

export interface LoopStats {
  invocations: number;
  lastUsed: string;
  sessions: string[];
}

export interface HotLoops {
  updated: string;
  top_10: Array<{
    uri: string;
    rank: number;
    invocations: number;
    lastUsed: string;
  }>;
  ranks: Record<string, number>;  // uri -> rank for quick lookup
}

export interface WorkflowMetrics {
  totalAccesses: number;
  loopStats: Map<string, LoopStats>;
  lastAggregated: string;
  entryCount: number;
}

/**
 * Manages integration with .claude/ folder for usage analytics
 * Enables codebase learning by recording which loops get used
 */
export class ClaudeFolderIntegration {
  private claudePath: string | null = null;
  private accessCounter = 0;
  private aggregationInProgress = false;
  private logger: Logger;

  constructor(workingDir: string, logger: Logger) {
    this.logger = logger;

    // Check for .claude/ in working directory or parent
    const paths = [
      path.join(workingDir, '.claude'),
      path.join(workingDir, '..', '.claude'),
    ];

    for (const p of paths) {
      try {
        const stat = require('fs').statSync(p);
        if (stat.isDirectory()) {
          this.claudePath = p;
          this.logger.debug(`Found .claude/ folder at: ${p}`);
          break;
        }
      } catch {
        // Directory doesn't exist, try next
      }
    }

    if (!this.claudePath) {
      this.logger.debug('No .claude/ folder found - usage analytics disabled');
    }
  }

  /**
   * Returns true if .claude/ folder is available
   */
  hasClaudeFolder(): boolean {
    return this.claudePath !== null;
  }

  /**
   * Get path to .claude/ folder (null if not available)
   */
  getClaudePath(): string | null {
    return this.claudePath;
  }

  /**
   * Record a loop access to .claude/thoughtbox/loop-usage.jsonl
   * Uses atomic append - safe for concurrent writes
   */
  async recordLoopAccess(
    loopUri: string,
    sessionId: string,
    mcpSessionId?: string
  ): Promise<void> {
    if (!this.claudePath) {
      // Graceful degradation - no recording if .claude/ not available
      return;
    }

    const record: LoopAccessRecord = {
      timestamp: new Date().toISOString(),
      loop: loopUri,
      session: sessionId,
      mcp_session: mcpSessionId,
    };

    try {
      const thoughtboxDir = path.join(this.claudePath, 'thoughtbox');
      const logPath = path.join(thoughtboxDir, 'loop-usage.jsonl');

      // Ensure directory exists
      await fs.mkdir(thoughtboxDir, { recursive: true });

      // Atomic append (safe for concurrent writes <4KB)
      const entry = JSON.stringify(record) + '\n';
      await fs.appendFile(logPath, entry, {
        encoding: 'utf8',
        flag: 'a',  // Append mode
      });

      // Increment counter and check if aggregation needed
      this.accessCounter++;
      if (this.accessCounter % 1000 === 0) {
        // Trigger background aggregation (non-blocking)
        this.aggregateMetrics().catch(err =>
          this.logger.error('Background aggregation failed:', err)
        );
      }
    } catch (err) {
      // Graceful degradation - log error but don't throw
      this.logger.error('[ClaudeFolderIntegration] Failed to record loop access:', err);
    }
  }

  /**
   * Read hot loops from cache (if available)
   */
  async getHotLoops(): Promise<HotLoops | null> {
    if (!this.claudePath) return null;

    try {
      const hotLoopsPath = path.join(this.claudePath, 'thoughtbox/hot-loops.json');
      const content = await fs.readFile(hotLoopsPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      // File doesn't exist or parse error - return null
      return null;
    }
  }

  /**
   * Aggregate loop usage metrics from JSONL log
   * Generates hot-loops.json and workflow-metrics.json
   *
   * Triggers:
   * 1. On server startup (synchronous)
   * 2. After 1000 new accesses (async)
   * 3. On explicit refresh (synchronous)
   */
  async aggregateMetrics(): Promise<WorkflowMetrics | null> {
    if (!this.claudePath) return null;

    // Prevent concurrent aggregations
    if (this.aggregationInProgress) {
      this.logger.debug('Aggregation already in progress, skipping');
      return null;
    }

    this.aggregationInProgress = true;

    try {
      const thoughtboxDir = path.join(this.claudePath, 'thoughtbox');
      const logPath = path.join(thoughtboxDir, 'loop-usage.jsonl');

      // Check if log file exists
      try {
        await fs.access(logPath);
      } catch {
        // No log file yet - create empty metrics
        this.logger.debug('No loop-usage.jsonl found, skipping aggregation');
        this.aggregationInProgress = false;
        return null;
      }

      // Read and parse JSONL
      const content = await fs.readFile(logPath, 'utf-8');
      const lines = content.trim().split('\n').filter(l => l.length > 0);
      const entries: LoopAccessRecord[] = [];

      for (const line of lines) {
        try {
          entries.push(JSON.parse(line));
        } catch {
          // Skip malformed lines
          this.logger.warn('Skipping malformed JSONL line');
        }
      }

      // Build statistics
      const stats = new Map<string, LoopStats>();

      for (const entry of entries) {
        const existing = stats.get(entry.loop) || {
          invocations: 0,
          lastUsed: entry.timestamp,
          sessions: [],
        };

        existing.invocations++;
        existing.lastUsed = entry.timestamp;

        // Track unique sessions
        if (!existing.sessions.includes(entry.session)) {
          existing.sessions.push(entry.session);
        }

        stats.set(entry.loop, existing);
      }

      // Generate hot-loops.json (top 10)
      const ranked = Array.from(stats.entries())
        .sort((a, b) => b[1].invocations - a[1].invocations)
        .slice(0, 10);

      const hotLoops: HotLoops = {
        updated: new Date().toISOString(),
        top_10: ranked.map(([uri, loopStats], index) => ({
          uri,
          rank: index + 1,
          invocations: loopStats.invocations,
          lastUsed: loopStats.lastUsed,
        })),
        ranks: {},
      };

      // Build ranks lookup map
      ranked.forEach(([uri], index) => {
        hotLoops.ranks[uri] = index + 1;
      });

      // Write hot-loops.json
      const hotLoopsPath = path.join(thoughtboxDir, 'hot-loops.json');
      await fs.writeFile(
        hotLoopsPath,
        JSON.stringify(hotLoops, null, 2),
        'utf-8'
      );

      // Write workflow-metrics.json (more detailed)
      const metricsPath = path.join(thoughtboxDir, 'workflow-metrics.json');
      const metrics = {
        totalAccesses: entries.length,
        lastAggregated: new Date().toISOString(),
        loopStats: Object.fromEntries(
          Array.from(stats.entries()).map(([uri, loopStats]) => [
            uri,
            {
              invocations: loopStats.invocations,
              lastUsed: loopStats.lastUsed,
              uniqueSessions: loopStats.sessions.length,
            },
          ])
        ),
      };

      await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2), 'utf-8');

      this.logger.info(
        `Aggregated ${entries.length} loop accesses, top loop: ${ranked[0]?.[0] || 'none'}`
      );

      return {
        totalAccesses: entries.length,
        loopStats: stats,
        lastAggregated: new Date().toISOString(),
        entryCount: entries.length,
      };
    } catch (err) {
      this.logger.error('[ClaudeFolderIntegration] Aggregation failed:', err);
      return null;
    } finally {
      this.aggregationInProgress = false;
    }
  }

  /**
   * Initialize analytics on server startup
   * Runs synchronous aggregation to ensure hot-loops.json is current
   */
  async initialize(): Promise<void> {
    if (!this.claudePath) {
      this.logger.debug('Skipping analytics initialization (no .claude/ folder)');
      return;
    }

    this.logger.info('Initializing .claude/ folder integration...');

    try {
      // Ensure thoughtbox directory exists
      const thoughtboxDir = path.join(this.claudePath, 'thoughtbox');
      await fs.mkdir(thoughtboxDir, { recursive: true });

      // Run initial aggregation
      await this.aggregateMetrics();

      this.logger.info('.claude/ folder integration initialized');
    } catch (err) {
      this.logger.error('Failed to initialize .claude/ integration:', err);
      // Don't throw - graceful degradation
    }
  }
}

/**
 * Read JSONL file and parse entries
 */
async function readJSONL<T>(filePath: string): Promise<T[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l.length > 0);
    const entries: T[] = [];

    for (const line of lines) {
      try {
        entries.push(JSON.parse(line));
      } catch {
        // Skip malformed lines
      }
    }

    return entries;
  } catch {
    return [];
  }
}
