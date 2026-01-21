/**
 * @fileoverview Event types for SIL-104 Event Stream
 *
 * Defines strongly-typed event interfaces for key Thoughtbox operations.
 * Events are emitted as JSONL to a configurable destination (file or stdout).
 *
 * @see specs/SIL-104-event-stream.md
 * @module src/events/types
 */

// =============================================================================
// Event Type Enum
// =============================================================================

export type ThoughtboxEventType =
  | 'session_created'
  | 'thought_added'
  | 'branch_created'
  | 'session_completed'
  | 'export_requested';

// =============================================================================
// Base Event Interface
// =============================================================================

export interface BaseEvent {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Event type identifier */
  type: ThoughtboxEventType;
  /** MCP session ID (for client isolation) */
  mcpSessionId?: string;
}

// =============================================================================
// Specific Event Interfaces
// =============================================================================

export interface SessionCreatedEvent extends BaseEvent {
  type: 'session_created';
  payload: {
    sessionId: string;
    title: string;
    tags?: string[];
  };
}

export interface ThoughtAddedEvent extends BaseEvent {
  type: 'thought_added';
  payload: {
    sessionId: string;
    thoughtNumber: number;
    /** Server-assigned flag (SIL-102) */
    wasAutoAssigned: boolean;
    /** Truncated thought for event log (first 100 chars) */
    thoughtPreview: string;
  };
}

export interface BranchCreatedEvent extends BaseEvent {
  type: 'branch_created';
  payload: {
    sessionId: string;
    branchId: string;
    fromThoughtNumber: number;
  };
}

export interface SessionCompletedEvent extends BaseEvent {
  type: 'session_completed';
  payload: {
    sessionId: string;
    finalThoughtCount: number;
    branchCount: number;
  };
}

export interface ExportRequestedEvent extends BaseEvent {
  type: 'export_requested';
  payload: {
    sessionId: string;
    exportPath: string;
    nodeCount: number;
  };
}

// =============================================================================
// Union Type
// =============================================================================

export type ThoughtboxEvent =
  | SessionCreatedEvent
  | ThoughtAddedEvent
  | BranchCreatedEvent
  | SessionCompletedEvent
  | ExportRequestedEvent;

// =============================================================================
// Configuration
// =============================================================================

export interface EventStreamConfig {
  /** Enable event streaming */
  enabled: boolean;
  /** Destination: 'stdout' | 'stderr' | file path */
  destination: 'stdout' | 'stderr' | string;
  /** Include MCP session ID in events */
  includeMcpSessionId?: boolean;
}

export const DEFAULT_EVENT_STREAM_CONFIG: EventStreamConfig = {
  enabled: false,
  destination: 'stderr',
  includeMcpSessionId: true,
};
