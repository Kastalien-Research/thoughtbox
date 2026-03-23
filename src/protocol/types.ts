/**
 * Protocol enforcement types for Theseus and Ulysses protocols.
 * Backed by Supabase protocol_sessions, protocol_scope, protocol_visas,
 * protocol_audits, and protocol_history tables.
 */

export type Protocol = 'theseus' | 'ulysses' | 'delphi';

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
  status: TheseusStatus | UlyssesStatus | DelphiStatus;
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
  event_type: string;
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

// ---------------------------------------------------------------------------
// Delphi Protocol Types
// ---------------------------------------------------------------------------

export type DelphiTerminal =
  | 'supported_thesis'
  | 'refined_question'
  | 'capability_gap'
  | 'irreducible_uncertainty';

export type DelphiStatus =
  | 'active'
  | 'superseded'
  | DelphiTerminal;

export type DelphiPhase = 'pre_frame' | 'inquire' | 'destabilize' | 'synthesize';

export type ResolutionClass =
  | 'decisive'
  | 'corroborative'
  | 'experimental'
  | 'evaluative';

export type HypothesisStatus = 'live' | 'pruned';

export type DiscriminantStatus = 'open' | 'resolved' | 'blocked';

export type EvidenceSlotStatus = 'empty' | 'filled' | 'blocked';

export type HypothesisEffect = 'supports' | 'weakens' | 'neutral';

export type ProbeType =
  | 'observational'
  | 'computational'
  | 'archival'
  | 'experimental'
  | 'capability_acquiring';

export interface DelphiHypothesis {
  id: string;
  statement: string;
  supportPattern: string;
  falsificationCriteria: string;
  incomparableConditions?: string;
  status: HypothesisStatus;
  evidenceChain: string[];
}

export interface DelphiEvidenceSlot {
  id: string;
  description: string;
  requiredSourceClass?: string;
  requiresIndependence?: boolean;
  status: EvidenceSlotStatus;
  filledBy?: string;
}

export interface DelphiDiscriminant {
  id: string;
  essential: boolean;
  closureRule: { slots: DelphiEvidenceSlot[] };
  bearingOn: string[];
  status: DiscriminantStatus;
}

export interface DelphiEvidenceEntry {
  id: string;
  probeId: string;
  discriminantId: string;
  slotId: string;
  rawObservation: string;
  source: string;
  sourceClass: string;
  independenceClass: string;
  admissible: boolean;
  contaminated: boolean;
  hypothesisEffects: Record<string, HypothesisEffect>;
}

export interface DelphiProbeRecord {
  id: string;
  description: string;
  targetDiscriminant: string;
  targetSlot: string;
  probeType: ProbeType;
  bound: string;
  interpretationMap: Record<string, string>;
  challengeProbe: { description: string; type: string };
  timestamp: string;
}

export interface DelphiState {
  questionFrame: {
    question: string;
    questionType: string;
    scope: string;
    resolutionClass: ResolutionClass;
    admissibleEvidenceClasses: string[];
    inadmissibleEvidenceClasses: string[];
  };
  hypotheses: DelphiHypothesis[];
  discriminants: DelphiDiscriminant[];
  evidenceLedger: DelphiEvidenceEntry[];
  opportunitySpace: DelphiProbeRecord[];
  N: number;
  witnessStatus: 'available' | 'invoked' | 'unavailable';
  phase: DelphiPhase;
  pendingChallenge: {
    description: string;
    type: string;
    probeId: string;
  } | null;
}

export interface DelphiInitInput {
  question: string;
  resolutionClass: ResolutionClass;
  questionType?: string;
  scope?: string;
  admissibleEvidenceClasses?: string[];
  inadmissibleEvidenceClasses?: string[];
}

export interface DelphiHypothesizeInput {
  hypotheses: Array<{
    statement: string;
    supportPattern: string;
    falsificationCriteria: string;
    incomparableConditions?: string;
  }>;
}

export interface DelphiDiscriminateInput {
  discriminants: Array<{
    id: string;
    essential: boolean;
    closureRule: {
      slots: Array<{
        id: string;
        description: string;
        requiredSourceClass?: string;
        requiresIndependence?: boolean;
      }>;
    };
    bearingOn: string[];
    blockConditions?: string;
  }>;
}

export interface DelphiProbeInput {
  description: string;
  targetDiscriminant: string;
  targetSlot: string;
  interpretationMap: Record<string, string>;
  probeType: ProbeType;
  bound: string;
  challengeProbe: { description: string; type: string };
}

export interface DelphiAssessInput {
  finding: string;
  source: string;
  sourceClass: string;
  independenceClass: string;
  admissible: boolean;
  contaminated: boolean;
  filledSlots: string[];
  hypothesisEffects: Record<string, HypothesisEffect>;
  materialChange: boolean;
}

export interface DelphiDestabilizeInput {
  challengeResult: string;
  materialChange: boolean;
}

export interface DelphiWitnessInput {
  witnessType: string;
  challenge: string;
  response: string;
}

export interface DelphiCompleteInput {
  terminalState: DelphiTerminal;
  strength?: 'verified' | 'supported';
  assurance?: 'witnessed' | 'reduced-assurance';
  summary: string;
  report: {
    question: string;
    hypotheses: Array<{
      id: string;
      statement: string;
      status: string;
      evidenceChain: string[];
    }>;
    discriminants: Array<{
      id: string;
      status: string;
      filledSlots: number;
      totalSlots: number;
    }>;
    evidenceCount: number;
    probeCount: number;
    nCounterHistory: number[];
  };
}
