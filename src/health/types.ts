import type { Json } from '../database.types.js';

export const WORKSPACE_SETUP_STATUSES = [
  'unconfigured',
  'configured',
  'auth_failed',
  'mcp_missing',
  'hook_missing',
  'otel_missing',
  'ready',
] as const;

export type WorkspaceSetupStatus =
  (typeof WORKSPACE_SETUP_STATUSES)[number];

export const RUN_CORRELATION_STATUSES = [
  'session_created',
  'reasoning_seen',
  'telemetry_seen',
  'reasoning_only',
  'telemetry_only',
  'binding_missing',
  'healthy',
] as const;

export type RunCorrelationStatus =
  (typeof RUN_CORRELATION_STATUSES)[number];

export interface WorkspaceSetupStateRecord {
  workspaceId: string;
  status: WorkspaceSetupStatus;
  evidence: Json;
  lastError?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RunCorrelationStateRecord {
  runId: string;
  workspaceId: string;
  sessionId: string;
  status: RunCorrelationStatus;
  evidence: Json;
  lastError?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
