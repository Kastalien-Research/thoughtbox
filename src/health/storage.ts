import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '../database.types.js';
import type {
  RunCorrelationStateRecord,
  RunCorrelationStatus,
  WorkspaceSetupStateRecord,
  WorkspaceSetupStatus,
} from './types.js';

interface WorkspaceSetupStatusRow {
  workspace_id: string;
  status: WorkspaceSetupStatus;
  evidence: Json;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

interface RunCorrelationStatusRow {
  run_id: string;
  workspace_id: string;
  session_id: string;
  status: RunCorrelationStatus;
  evidence: Json;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthStateStore {
  getWorkspaceSetupState(
    workspaceId: string,
  ): Promise<WorkspaceSetupStateRecord | null>;
  upsertWorkspaceSetupState(input: {
    workspaceId: string;
    status: WorkspaceSetupStatus;
    evidence?: Json;
    lastError?: string | null;
  }): Promise<WorkspaceSetupStateRecord>;
  getRunCorrelationState(
    runId: string,
  ): Promise<RunCorrelationStateRecord | null>;
  upsertRunCorrelationState(input: {
    runId: string;
    workspaceId: string;
    sessionId: string;
    status: RunCorrelationStatus;
    evidence?: Json;
    lastError?: string | null;
  }): Promise<RunCorrelationStateRecord>;
}

export interface HealthStateStoreConfig {
  dataDir: string;
  supabaseUrl?: string;
  serviceRoleKey?: string;
}

function toWorkspaceSetupRecord(
  row: WorkspaceSetupStatusRow,
): WorkspaceSetupStateRecord {
  return {
    workspaceId: row.workspace_id,
    status: row.status,
    evidence: row.evidence,
    lastError: row.last_error,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function toRunCorrelationRecord(
  row: RunCorrelationStatusRow,
): RunCorrelationStateRecord {
  return {
    runId: row.run_id,
    workspaceId: row.workspace_id,
    sessionId: row.session_id,
    status: row.status,
    evidence: row.evidence,
    lastError: row.last_error,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

class SupabaseHealthStateStore implements HealthStateStore {
  private readonly client: SupabaseClient<Database>;

  constructor(config: { supabaseUrl: string; serviceRoleKey: string }) {
    this.client = createClient<Database>(
      config.supabaseUrl,
      config.serviceRoleKey,
      {
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
  }

  async getWorkspaceSetupState(
    workspaceId: string,
  ): Promise<WorkspaceSetupStateRecord | null> {
    const { data, error } = await this.client
      .from('workspace_setup_statuses')
      .select()
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to read workspace setup state: ${error.message}`);
    }

    return data ? toWorkspaceSetupRecord(data as WorkspaceSetupStatusRow) : null;
  }

  async upsertWorkspaceSetupState(input: {
    workspaceId: string;
    status: WorkspaceSetupStatus;
    evidence?: Json;
    lastError?: string | null;
  }): Promise<WorkspaceSetupStateRecord> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from('workspace_setup_statuses')
      .upsert(
        {
          workspace_id: input.workspaceId,
          status: input.status,
          evidence: input.evidence ?? {},
          last_error: input.lastError ?? null,
          updated_at: now,
        },
        { onConflict: 'workspace_id' },
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to write workspace setup state: ${error.message}`);
    }

    return toWorkspaceSetupRecord(data as WorkspaceSetupStatusRow);
  }

  async getRunCorrelationState(
    runId: string,
  ): Promise<RunCorrelationStateRecord | null> {
    const { data, error } = await this.client
      .from('run_correlation_statuses')
      .select()
      .eq('run_id', runId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to read run correlation state: ${error.message}`);
    }

    return data ? toRunCorrelationRecord(data as RunCorrelationStatusRow) : null;
  }

  async upsertRunCorrelationState(input: {
    runId: string;
    workspaceId: string;
    sessionId: string;
    status: RunCorrelationStatus;
    evidence?: Json;
    lastError?: string | null;
  }): Promise<RunCorrelationStateRecord> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from('run_correlation_statuses')
      .upsert(
        {
          run_id: input.runId,
          workspace_id: input.workspaceId,
          session_id: input.sessionId,
          status: input.status,
          evidence: input.evidence ?? {},
          last_error: input.lastError ?? null,
          updated_at: now,
        },
        { onConflict: 'run_id' },
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to write run correlation state: ${error.message}`);
    }

    return toRunCorrelationRecord(data as RunCorrelationStatusRow);
  }
}

class FileSystemHealthStateStore implements HealthStateStore {
  private readonly baseDir: string;

  constructor(dataDir: string) {
    this.baseDir = path.join(dataDir, 'health');
  }

  private workspacePath(workspaceId: string): string {
    return path.join(this.baseDir, 'workspace', `${workspaceId}.json`);
  }

  private runPath(runId: string): string {
    return path.join(this.baseDir, 'runs', `${runId}.json`);
  }

  private async readJson<T>(filePath: string): Promise<T | null> {
    try {
      const raw = await readFile(filePath, 'utf8');
      return JSON.parse(raw) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  private async writeJson(filePath: string, value: unknown): Promise<void> {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
  }

  async getWorkspaceSetupState(
    workspaceId: string,
  ): Promise<WorkspaceSetupStateRecord | null> {
    const raw = await this.readJson<WorkspaceSetupStatusRow>(
      this.workspacePath(workspaceId),
    );
    return raw ? toWorkspaceSetupRecord(raw) : null;
  }

  async upsertWorkspaceSetupState(input: {
    workspaceId: string;
    status: WorkspaceSetupStatus;
    evidence?: Json;
    lastError?: string | null;
  }): Promise<WorkspaceSetupStateRecord> {
    const existing = await this.getWorkspaceSetupState(input.workspaceId);
    const now = new Date();
    const row: WorkspaceSetupStatusRow = {
      workspace_id: input.workspaceId,
      status: input.status,
      evidence: input.evidence ?? {},
      last_error: input.lastError ?? null,
      created_at: existing?.createdAt.toISOString() ?? now.toISOString(),
      updated_at: now.toISOString(),
    };
    await this.writeJson(this.workspacePath(input.workspaceId), row);
    return toWorkspaceSetupRecord(row);
  }

  async getRunCorrelationState(
    runId: string,
  ): Promise<RunCorrelationStateRecord | null> {
    const raw = await this.readJson<RunCorrelationStatusRow>(this.runPath(runId));
    return raw ? toRunCorrelationRecord(raw) : null;
  }

  async upsertRunCorrelationState(input: {
    runId: string;
    workspaceId: string;
    sessionId: string;
    status: RunCorrelationStatus;
    evidence?: Json;
    lastError?: string | null;
  }): Promise<RunCorrelationStateRecord> {
    const existing = await this.getRunCorrelationState(input.runId);
    const now = new Date();
    const row: RunCorrelationStatusRow = {
      run_id: input.runId,
      workspace_id: input.workspaceId,
      session_id: input.sessionId,
      status: input.status,
      evidence: input.evidence ?? {},
      last_error: input.lastError ?? null,
      created_at: existing?.createdAt.toISOString() ?? now.toISOString(),
      updated_at: now.toISOString(),
    };
    await this.writeJson(this.runPath(input.runId), row);
    return toRunCorrelationRecord(row);
  }
}

export function createHealthStateStore(
  config: HealthStateStoreConfig,
): HealthStateStore {
  if (config.supabaseUrl && config.serviceRoleKey) {
    return new SupabaseHealthStateStore({
      supabaseUrl: config.supabaseUrl,
      serviceRoleKey: config.serviceRoleKey,
    });
  }

  return new FileSystemHealthStateStore(config.dataDir);
}
