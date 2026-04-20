import type { Json } from '../database.types.js';
import type { HealthStateStore } from './storage.js';
import type {
  WorkspaceSetupStateRecord,
  WorkspaceSetupStatus,
} from './types.js';

export async function updateWorkspaceSetupState(args: {
  healthStore: HealthStateStore;
  workspaceId: string;
  status: WorkspaceSetupStatus;
  evidence?: Json;
  lastError?: string | null;
}): Promise<WorkspaceSetupStateRecord> {
  return args.healthStore.upsertWorkspaceSetupState({
    workspaceId: args.workspaceId,
    status: args.status,
    evidence: args.evidence,
    lastError: args.lastError ?? null,
  });
}
