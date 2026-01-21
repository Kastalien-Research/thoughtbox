/**
 * @fileoverview Event Emitter for SIL-104 Event Stream
 *
 * Emits strongly-typed events as JSONL to a configurable destination.
 * Events are emitted on key operations: session_created, thought_added,
 * branch_created, session_completed, export_requested.
 *
 * @see specs/SIL-104-event-stream.md
 * @module src/events/event-emitter
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import type {
  ThoughtboxEvent,
  ThoughtboxEventType,
  EventStreamConfig,
  SessionCreatedEvent,
  ThoughtAddedEvent,
  BranchCreatedEvent,
  SessionCompletedEvent,
  ExportRequestedEvent,
} from './types.js';
import { DEFAULT_EVENT_STREAM_CONFIG } from './types.js';

// =============================================================================
// Event Emitter Class
// =============================================================================

/**
 * ThoughtboxEventEmitter - Emits events as JSONL to configurable destination
 *
 * Usage:
 *   const emitter = new ThoughtboxEventEmitter({ enabled: true, destination: 'stderr' });
 *   emitter.emitSessionCreated({ sessionId: '...', title: '...' });
 */
export class ThoughtboxEventEmitter {
  private config: EventStreamConfig;
  private mcpSessionId?: string;

  constructor(config?: Partial<EventStreamConfig>, mcpSessionId?: string) {
    this.config = { ...DEFAULT_EVENT_STREAM_CONFIG, ...config };
    this.mcpSessionId = mcpSessionId;
  }

  /**
   * Set the MCP session ID (can be set after construction)
   */
  setMcpSessionId(sessionId: string): void {
    this.mcpSessionId = sessionId;
  }

  /**
   * Check if event streaming is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable/disable event streaming
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EventStreamConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ===========================================================================
  // Event Emission Methods
  // ===========================================================================

  /**
   * Emit a session_created event
   */
  emitSessionCreated(payload: SessionCreatedEvent['payload']): void {
    this.emit({
      type: 'session_created',
      timestamp: new Date().toISOString(),
      payload,
    });
  }

  /**
   * Emit a thought_added event
   */
  emitThoughtAdded(payload: ThoughtAddedEvent['payload']): void {
    this.emit({
      type: 'thought_added',
      timestamp: new Date().toISOString(),
      payload,
    });
  }

  /**
   * Emit a branch_created event
   */
  emitBranchCreated(payload: BranchCreatedEvent['payload']): void {
    this.emit({
      type: 'branch_created',
      timestamp: new Date().toISOString(),
      payload,
    });
  }

  /**
   * Emit a session_completed event
   */
  emitSessionCompleted(payload: SessionCompletedEvent['payload']): void {
    this.emit({
      type: 'session_completed',
      timestamp: new Date().toISOString(),
      payload,
    });
  }

  /**
   * Emit an export_requested event
   */
  emitExportRequested(payload: ExportRequestedEvent['payload']): void {
    this.emit({
      type: 'export_requested',
      timestamp: new Date().toISOString(),
      payload,
    });
  }

  // ===========================================================================
  // Core Emission Logic
  // ===========================================================================

  /**
   * Emit an event to the configured destination
   */
  private emit(event: Omit<ThoughtboxEvent, 'mcpSessionId'>): void {
    if (!this.config.enabled) {
      return;
    }

    // Build full event with optional MCP session ID
    const fullEvent: ThoughtboxEvent = {
      ...event,
      ...(this.config.includeMcpSessionId && this.mcpSessionId
        ? { mcpSessionId: this.mcpSessionId }
        : {}),
    } as ThoughtboxEvent;

    const line = JSON.stringify(fullEvent) + '\n';

    try {
      this.writeToDestination(line);
    } catch (err) {
      // Log error but don't throw - event emission should never break main flow
      console.error('[EventEmitter] Failed to emit event:', err);
    }
  }

  /**
   * Write JSONL line to configured destination
   */
  private writeToDestination(line: string): void {
    switch (this.config.destination) {
      case 'stdout':
        process.stdout.write(line);
        break;

      case 'stderr':
        process.stderr.write(line);
        break;

      default:
        // File path - ensure directory exists and append
        const dir = dirname(this.config.destination);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        appendFileSync(this.config.destination, line, 'utf-8');
        break;
    }
  }
}

// =============================================================================
// Singleton Instance (optional - can also create per-server instances)
// =============================================================================

/**
 * Global event emitter instance (disabled by default)
 * Configure via THOUGHTBOX_EVENTS_ENABLED and THOUGHTBOX_EVENTS_DEST env vars
 */
export const globalEventEmitter = new ThoughtboxEventEmitter({
  enabled: process.env.THOUGHTBOX_EVENTS_ENABLED === 'true',
  destination: process.env.THOUGHTBOX_EVENTS_DEST || 'stderr',
  includeMcpSessionId: true,
});

export default ThoughtboxEventEmitter;
