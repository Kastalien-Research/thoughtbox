/**
 * ImprovementEventStore - Persistent Storage for Improvement Events
 * SPEC: SPEC-persistence.md
 *
 * Provides JSONL-based persistence for improvement events emitted during
 * self-improvement loop iterations. Supports querying, filtering, and
 * summarization of improvement history.
 *
 * Design principles:
 * - Append-only writes for auditability
 * - Non-blocking persistence (fire-and-forget)
 * - Never blocks SIL execution on persistence failures
 *
 * Usage:
 * ```ts
 * import { ImprovementEventStore } from './improvement-store';
 *
 * const store = new ImprovementEventStore();
 * await store.initialize();
 *
 * // Subscribe to events (auto-persists)
 * store.subscribe();
 *
 * // Query history
 * const events = await store.listEvents({ type: 'cycle_end' });
 * const summary = await store.summarize({});
 * ```
 */

import { appendFile, readFile, mkdir, access } from "fs/promises";
import { constants } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";
import { ThoughtEmitter, type ImprovementEvent, type ImprovementEventType } from "./emitter.js";

// =============================================================================
// Types
// =============================================================================

/**
 * Filter options for querying improvement events
 */
export interface ImprovementEventFilter {
  /** Filter by start time (ISO 8601) */
  startTime?: string;
  /** Filter by end time (ISO 8601) */
  endTime?: string;
  /** Filter by iteration number */
  iteration?: number;
  /** Filter by event type */
  type?: ImprovementEventType;
  /** Filter by success status */
  success?: boolean;
  /** Maximum number of events to return */
  limit?: number;
  /** Number of events to skip */
  offset?: number;
}

/**
 * Summary of improvement history
 */
export interface ImprovementSummary {
  /** Total number of iterations (cycle_end events) */
  totalIterations: number;
  /** Number of successful iterations */
  successfulIterations: number;
  /** Number of failed iterations */
  failedIterations: number;
  /** Total cost across all iterations */
  totalCost: number;
  /** Average cost per iteration */
  avgCostPerIteration: number;
  /** Time range of the summary */
  period: {
    start: string | null;
    end: string | null;
  };
}

/**
 * Configuration options for the store
 */
export interface ImprovementStoreConfig {
  /** Path to the JSONL file (default: ~/.thoughtbox/improvement-history.jsonl) */
  path?: string;
  /** Whether to auto-subscribe to ThoughtEmitter on initialize */
  autoSubscribe?: boolean;
}

// =============================================================================
// ImprovementEventStore
// =============================================================================

/**
 * Persistent store for improvement events using JSONL format
 */
export class ImprovementEventStore {
  private filePath: string;
  private autoSubscribe: boolean;
  private subscribed: boolean = false;
  private writeQueue: ImprovementEvent[] = [];
  private flushPromise: Promise<void> | null = null;
  private flushTimeout: NodeJS.Timeout | null = null;

  constructor(config: ImprovementStoreConfig = {}) {
    this.filePath = config.path ?? join(homedir(), ".thoughtbox", "improvement-history.jsonl");
    this.autoSubscribe = config.autoSubscribe ?? false;
  }

  /**
   * Initialize the store (create directories if needed)
   */
  async initialize(): Promise<void> {
    // Ensure directory exists
    const dir = dirname(this.filePath);
    try {
      await access(dir, constants.W_OK);
    } catch {
      await mkdir(dir, { recursive: true });
    }

    // Auto-subscribe if configured
    if (this.autoSubscribe) {
      this.subscribe();
    }
  }

  /**
   * Subscribe to ThoughtEmitter improvement events
   * Events will be automatically persisted as they arrive
   */
  subscribe(): void {
    if (this.subscribed) return;

    ThoughtEmitter.getInstance().on("improvement:event", (event: ImprovementEvent) => {
      this.queueEvent(event);
    });

    this.subscribed = true;
  }

  /**
   * Unsubscribe from ThoughtEmitter
   */
  unsubscribe(): void {
    if (!this.subscribed) return;

    ThoughtEmitter.getInstance().removeAllListeners("improvement:event");
    this.subscribed = false;
  }

  /**
   * Record a single improvement event
   * This is fire-and-forget - errors are logged but not thrown
   */
  async recordEvent(event: ImprovementEvent): Promise<void> {
    try {
      const line = JSON.stringify(event) + "\n";
      await appendFile(this.filePath, line, "utf-8");
    } catch (err) {
      console.warn(
        "[ImprovementEventStore] Error recording event:",
        err instanceof Error ? err.message : err
      );
    }
  }

  /**
   * Queue an event for batched writing
   * Events are flushed after a short delay to batch writes
   */
  private queueEvent(event: ImprovementEvent): void {
    this.writeQueue.push(event);

    // Schedule flush if not already scheduled
    if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => {
        this.flushTimeout = null;
        this.flushQueue();
      }, 100); // 100ms batching window
    }
  }

  /**
   * Flush queued events to disk
   */
  private async flushQueue(): Promise<void> {
    if (this.writeQueue.length === 0) return;

    const events = this.writeQueue;
    this.writeQueue = [];

    try {
      const lines = events.map((e) => JSON.stringify(e)).join("\n") + "\n";
      await appendFile(this.filePath, lines, "utf-8");
    } catch (err) {
      console.warn(
        "[ImprovementEventStore] Error flushing events:",
        err instanceof Error ? err.message : err
      );
    }
  }

  /**
   * Flush any pending writes immediately
   * Call this before process exit to ensure all events are persisted
   */
  async flush(): Promise<void> {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    await this.flushQueue();
  }

  /**
   * List improvement events with optional filtering
   */
  async listEvents(filter: ImprovementEventFilter = {}): Promise<ImprovementEvent[]> {
    let events: ImprovementEvent[] = [];

    try {
      const content = await readFile(this.filePath, "utf-8");
      const lines = content.trim().split("\n").filter(Boolean);

      for (const line of lines) {
        try {
          const event = JSON.parse(line) as ImprovementEvent;
          events.push(event);
        } catch {
          // Skip malformed lines
          console.warn("[ImprovementEventStore] Skipping malformed line");
        }
      }
    } catch (err) {
      // File doesn't exist or can't be read - return empty
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn(
          "[ImprovementEventStore] Error reading events:",
          err instanceof Error ? err.message : err
        );
      }
      return [];
    }

    // Apply filters
    if (filter.startTime) {
      events = events.filter((e) => e.timestamp >= filter.startTime!);
    }
    if (filter.endTime) {
      events = events.filter((e) => e.timestamp <= filter.endTime!);
    }
    if (filter.iteration !== undefined) {
      events = events.filter((e) => e.iteration === filter.iteration);
    }
    if (filter.type) {
      events = events.filter((e) => e.type === filter.type);
    }
    if (filter.success !== undefined) {
      events = events.filter((e) => e.success === filter.success);
    }

    // Apply pagination
    if (filter.offset) {
      events = events.slice(filter.offset);
    }
    if (filter.limit) {
      events = events.slice(0, filter.limit);
    }

    return events;
  }

  /**
   * Get all events for a specific iteration
   */
  async getIteration(iteration: number): Promise<ImprovementEvent[]> {
    return this.listEvents({ iteration });
  }

  /**
   * Summarize improvement history
   */
  async summarize(filter: Pick<ImprovementEventFilter, "startTime" | "endTime"> = {}): Promise<ImprovementSummary> {
    // Get all cycle_end events (one per iteration)
    const cycleEndEvents = await this.listEvents({
      ...filter,
      type: "cycle_end",
    });

    const totalIterations = cycleEndEvents.length;
    const successfulIterations = cycleEndEvents.filter((e) => e.success).length;
    const failedIterations = totalIterations - successfulIterations;
    const totalCost = cycleEndEvents.reduce((sum, e) => sum + e.cost, 0);
    const avgCostPerIteration = totalIterations > 0 ? totalCost / totalIterations : 0;

    // Determine time range
    let start: string | null = null;
    let end: string | null = null;
    if (cycleEndEvents.length > 0) {
      const timestamps = cycleEndEvents.map((e) => e.timestamp).sort();
      start = timestamps[0];
      end = timestamps[timestamps.length - 1];
    }

    return {
      totalIterations,
      successfulIterations,
      failedIterations,
      totalCost,
      avgCostPerIteration,
      period: { start, end },
    };
  }

  /**
   * Get the file path being used
   */
  getFilePath(): string {
    return this.filePath;
  }

  /**
   * Check if the store is subscribed to events
   */
  isSubscribed(): boolean {
    return this.subscribed;
  }

  /**
   * Clear all stored events (primarily for testing)
   * WARNING: This deletes the history file
   */
  async clear(): Promise<void> {
    const { unlink } = await import("fs/promises");
    try {
      await unlink(this.filePath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  }
}

/**
 * Default store instance
 * Initialize before use: await defaultImprovementStore.initialize()
 */
export const defaultImprovementStore = new ImprovementEventStore({ autoSubscribe: true });
