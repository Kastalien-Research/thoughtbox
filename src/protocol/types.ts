/**
 * Protocol enforcement types for Theseus and Ulysses protocols.
 * Backed by Supabase protocol_sessions, protocol_scope, protocol_visas,
 * protocol_audits, and protocol_history tables.
 */

export type Protocol = 'theseus' | 'ulysses';

export type TheseusTerminal =
  | 'complete'
  | 'audit_failure'
  | 'scope_exhaustion';

export type TheseusStatus =
  | 'active'
  | 'superseded'
  | TheseusTerminal;

export type UlyssesTerminal =
  | 'resolved'
  | 'insufficient_information'
  | 'environment_compromised';

export type UlyssesStatus =
  | 'active'
  | 'superseded'
  | UlyssesTerminal;

export interface ProtocolSession {
  id: string;
  protocol: Protocol;
  workspace_id: string | null;
  status: TheseusStatus | UlyssesStatus;
  state_json: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
}

export interface ProtocolScope {
  id: string;
  session_id: string;
  file_path: string;
  source: 'init' | 'visa';
  created_at: string;
}

export interface ProtocolVisa {
  id: string;
  session_id: string;
  file_path: string;
  justification: string;
  anti_pattern_acknowledged: boolean;
  created_at: string;
}

export interface ProtocolAudit {
  id: string;
  session_id: string;
  diff_hash: string;
  commit_message: string;
  approved: boolean;
  feedback: string | null;
  created_at: string;
}

export interface ProtocolHistoryEvent {
  id: string;
  session_id: string;
  event_type: 'plan' | 'outcome' | 'reflect' | 'checkpoint';
  event_json: Record<string, unknown>;
  created_at: string;
}

/** Input types for handler methods */

export interface VisaInput {
  filePath: string;
  justification: string;
  antiPatternAcknowledged: boolean;
}

export interface AuditInput {
  diffHash: string;
  commitMessage: string;
  approved: boolean;
  feedback?: string;
}

export interface TheseusOutcomeInput {
  testsPassed: boolean;
  details?: string;
}

export interface PlanInput {
  primary: string;
  recovery: string;
  irreversible: boolean;
}

export interface UlyssesOutcomeInput {
  assessment: 'expected' | 'unexpected-favorable' | 'unexpected-unfavorable';
  severity?: number;
  details?: string;
}

export interface ReflectInput {
  hypothesis: string;
  falsification: string;
}

export interface ProtocolEnforcementInput {
  mutation: boolean;
  targetPath?: string;
  workspaceId?: string;
}

export interface ProtocolEnforcementResult {
  enforce: boolean;
  blocked?: boolean;
  reason?: string;
  protocol?: Protocol;
  session_id?: string;
  required_action?: 'reflect' | 'visa';
}

const TEST_DIR_SEGMENTS = ['tests', 'test', '__tests__'];
const TEST_FILE_EXTENSIONS = ['.test.', '.spec.'];

export function isTestFile(filePath: string): boolean {
  const segments = filePath.split('/');
  if (segments.some(s => TEST_DIR_SEGMENTS.includes(s))) {
    return true;
  }
  const basename = segments[segments.length - 1] ?? '';
  return TEST_FILE_EXTENSIONS.some(ext => basename.includes(ext));
}
