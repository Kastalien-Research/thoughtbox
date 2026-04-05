export interface Connection {
  id: string;
  workspace_id: string;
  project_id: string | null;
  started_at: string;
  ended_at: string | null;
  metadata: Record<string, unknown>;
}

export interface CreateConnectionParams {
  workspace_id: string;
  project_id?: string;
  metadata?: Record<string, unknown>;
}

export interface ConnectionSummary {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  metadata: Record<string, unknown>;
}
