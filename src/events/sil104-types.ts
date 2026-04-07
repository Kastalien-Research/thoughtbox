/**
 * SIL-104 Event Stream types.
 * Used by ThoughtboxEventEmitter for JSONL trace output.
 * Separate from the unified ThoughtboxEvent SSE stream.
 */

export type Sil104EventType =
  | 'session_created'
  | 'thought_added'
  | 'branch_created'
  | 'session_completed'
  | 'export_requested';

export interface BaseEvent {
  timestamp: string;
  type: Sil104EventType;
  sessionId?: string;
}

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
    wasAutoAssigned: boolean;
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
    auditManifest?: import('../persistence/types.js').AuditManifest;
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

export type Sil104Event =
  | SessionCreatedEvent
  | ThoughtAddedEvent
  | BranchCreatedEvent
  | SessionCompletedEvent
  | ExportRequestedEvent;

export interface EventStreamConfig {
  enabled: boolean;
  destination: 'stdout' | 'stderr' | string;
  includeMcpSessionId?: boolean;
}

export const DEFAULT_EVENT_STREAM_CONFIG: EventStreamConfig = {
  enabled: false,
  destination: 'stderr',
  includeMcpSessionId: true,
};
