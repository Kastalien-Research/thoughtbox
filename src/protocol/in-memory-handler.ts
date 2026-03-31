/**
 * In-memory protocol handler — same interface as ProtocolHandler,
 * no Supabase dependency. Works in filesystem mode.
 */

import { randomUUID } from 'node:crypto';
import {
  isTestFile,
  ULYSSES_STATE_NEEDS_REFLECT,
  type Protocol,
  type ProtocolSession,
  type TheseusTerminal,
  type UlyssesTerminal,
  type VisaInput,
  type AuditInput,
  type TheseusOutcomeInput,
  type PlanInput,
  type UlyssesOutcomeInput,
  type ReflectInput,
  type ProtocolEnforcementInput,
  type ProtocolEnforcementResult,
  type ProtocolScope,
  type ProtocolVisa,
  type ProtocolAudit,
  type ProtocolHistoryEvent,
} from './types.js';

export class InMemoryProtocolHandler {
  private workspaceId: string | null = null;
  private sessions: ProtocolSession[] = [];
  private scope: ProtocolScope[] = [];
  private visas: ProtocolVisa[] = [];
  private audits: ProtocolAudit[] = [];
  private history: ProtocolHistoryEvent[] = [];

  setProject(project: string): void {
    this.workspaceId = project;
  }

  private getActiveSession(
    protocol: Protocol,
    workspaceId: string | null = this.workspaceId,
  ): ProtocolSession | null {
    return this.sessions
      .filter(s => s.protocol === protocol && s.status === 'active')
      .filter(s => !workspaceId || s.workspace_id === workspaceId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
  }

  private requireActiveSession(protocol: Protocol): ProtocolSession {
    const session = this.getActiveSession(protocol);
    if (!session) {
      throw new Error(`No active ${protocol} session. Run init first.`);
    }
    return session;
  }

  private supersedeExisting(protocol: Protocol): string | null {
    const existing = this.getActiveSession(protocol);
    if (!existing) return null;
    existing.status = 'superseded';
    existing.completed_at = new Date().toISOString();
    return existing.id;
  }

  async theseusInit(
    scope: string[],
    description?: string,
  ): Promise<Record<string, unknown>> {
    if (!scope || scope.length === 0) {
      throw new Error(
        'Must provide initial file scope (e.g., scope: ["src/auth.ts"])',
      );
    }

    const supersededId = this.supersedeExisting('theseus');

    const session: ProtocolSession = {
      id: randomUUID(),
      protocol: 'theseus',
      workspace_id: this.workspaceId,
      status: 'active',
      state_json: { B: 0, test_fail_count: 0, description: description ?? '' },
      created_at: new Date().toISOString(),
      completed_at: null,
    };
    this.sessions.push(session);

    for (const f of scope) {
      this.scope.push({
        id: randomUUID(),
        session_id: session.id,
        file_path: f,
        source: 'init',
        created_at: new Date().toISOString(),
      });
    }

    const result: Record<string, unknown> = {
      session_id: session.id,
      protocol: 'theseus',
      status: 'active',
      B: 0,
      scope,
    };
    if (description) result.description = description;
    if (supersededId) result.superseded_session = supersededId;
    return result;
  }

  async theseusVisa(
    sessionId: string,
    visa: VisaInput,
  ): Promise<Record<string, unknown>> {
    const session = this.requireActiveSession('theseus');
    if (session.id !== sessionId) {
      throw new Error(`Session ${sessionId} is not the active theseus session`);
    }

    this.visas.push({
      id: randomUUID(),
      session_id: session.id,
      file_path: visa.filePath,
      justification: visa.justification,
      anti_pattern_acknowledged: visa.antiPatternAcknowledged,
      created_at: new Date().toISOString(),
    });

    const existing = this.scope.find(
      s => s.session_id === session.id && s.file_path === visa.filePath,
    );
    if (!existing) {
      this.scope.push({
        id: randomUUID(),
        session_id: session.id,
        file_path: visa.filePath,
        source: 'visa',
        created_at: new Date().toISOString(),
      });
    }

    return {
      session_id: session.id,
      visa_granted: true,
      filePath: visa.filePath,
      justification: visa.justification,
    };
  }

  async theseusCheckpoint(
    sessionId: string,
    audit: AuditInput,
  ): Promise<Record<string, unknown>> {
    const session = this.requireActiveSession('theseus');
    if (session.id !== sessionId) {
      throw new Error(`Session ${sessionId} is not the active theseus session`);
    }

    this.audits.push({
      id: randomUUID(),
      session_id: session.id,
      diff_hash: audit.diffHash,
      commit_message: audit.commitMessage,
      approved: audit.approved,
      feedback: audit.feedback ?? null,
      created_at: new Date().toISOString(),
    });

    this.history.push({
      id: randomUUID(),
      session_id: session.id,
      event_type: 'checkpoint',
      event_json: {
        diffHash: audit.diffHash,
        commitMessage: audit.commitMessage,
        approved: audit.approved,
        feedback: audit.feedback,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    if (audit.approved) {
      const state = session.state_json as Record<string, unknown>;
      session.state_json = { ...state, B: 0, test_fail_count: 0 };
    }

    return {
      session_id: session.id,
      checkpoint_accepted: audit.approved,
      diffHash: audit.diffHash,
      commitMessage: audit.commitMessage,
      B: audit.approved ? 0 : (session.state_json as { B: number }).B,
    };
  }

  async theseusOutcome(
    sessionId: string,
    result: TheseusOutcomeInput,
  ): Promise<Record<string, unknown>> {
    const session = this.requireActiveSession('theseus');
    if (session.id !== sessionId) {
      throw new Error(`Session ${sessionId} is not the active theseus session`);
    }
    const state = session.state_json as { B: number; test_fail_count: number };

    this.history.push({
      id: randomUUID(),
      session_id: session.id,
      event_type: 'outcome',
      event_json: {
        testsPassed: result.testsPassed,
        details: result.details ?? '',
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    if (result.testsPassed) {
      session.state_json = { ...state, B: 0, test_fail_count: 0 };
      return { session_id: session.id, testsPassed: true, B: 0, test_fail_count: 0 };
    }

    const newCount = (state.test_fail_count ?? 0) + 1;

    if (newCount >= 2) {
      session.state_json = { ...state, B: 0, test_fail_count: 0 };
      return {
        session_id: session.id,
        testsPassed: false,
        red_green_expired: true,
        action: 'git reset --hard to last checkpoint',
        B: 0,
        test_fail_count: 0,
      };
    }

    session.state_json = { ...state, B: 1, test_fail_count: newCount };
    return {
      session_id: session.id,
      testsPassed: false,
      red_green_expired: false,
      B: 1,
      test_fail_count: newCount,
      warning: '1 repair attempt remaining',
    };
  }

  async theseusStatus(): Promise<Record<string, unknown>> {
    const session = this.getActiveSession('theseus');
    if (!session) {
      return { active: false, protocol: 'theseus' };
    }
    const state = session.state_json as { B: number; test_fail_count: number };
    const sessionScope = this.scope
      .filter(s => s.session_id === session.id)
      .map(s => ({ file_path: s.file_path, source: s.source }));
    const visaCount = this.visas.filter(v => v.session_id === session.id).length;
    const auditCount = this.audits.filter(a => a.session_id === session.id).length;

    return {
      active: true,
      protocol: 'theseus',
      session_id: session.id,
      B: state.B ?? 0,
      test_fail_count: state.test_fail_count ?? 0,
      scope: sessionScope,
      visa_count: visaCount,
      audit_count: auditCount,
      created_at: session.created_at,
    };
  }

  async theseusComplete(
    sessionId: string,
    terminalState: TheseusTerminal,
    summary?: string,
  ): Promise<Record<string, unknown>> {
    const session = this.requireActiveSession('theseus');
    if (session.id !== sessionId) {
      throw new Error(`Session ${sessionId} is not the active theseus session`);
    }
    session.status = terminalState;
    session.completed_at = new Date().toISOString();
    const result: Record<string, unknown> = { session_id: session.id, status: terminalState };
    if (summary) result.summary = summary;
    return result;
  }

  async ulyssesInit(
    problem: string,
    constraints?: string[],
  ): Promise<Record<string, unknown>> {
    const supersededId = this.supersedeExisting('ulysses');

    const session: ProtocolSession = {
      id: randomUUID(),
      protocol: 'ulysses',
      workspace_id: this.workspaceId,
      status: 'active',
      state_json: {
        S: 0,
        consecutive_surprises: 0,
        problem,
        constraints: constraints ?? [],
        surprise_register: [],
        checkpoints: ['initial'],
        hypotheses: [],
        active_step: null,
      },
      created_at: new Date().toISOString(),
      completed_at: null,
    };
    this.sessions.push(session);

    const result: Record<string, unknown> = {
      session_id: session.id,
      protocol: 'ulysses',
      status: 'active',
      S: 0,
      problem,
    };
    if (constraints && constraints.length > 0) result.constraints = constraints;
    if (supersededId) result.superseded_session = supersededId;
    return result;
  }

  async ulyssesPlan(
    sessionId: string,
    plan: PlanInput,
  ): Promise<Record<string, unknown>> {
    const session = this.requireActiveSession('ulysses');
    if (session.id !== sessionId) {
      throw new Error(`Session ${sessionId} is not the active ulysses session`);
    }
    const state = session.state_json as { S: number };
    if (state.S === 2) {
      throw new Error('REFLECT phase (S=2). Run reflect first.');
    }

    const step = {
      primary: plan.primary,
      recovery: plan.recovery,
      irreversible: plan.irreversible,
      timestamp: new Date().toISOString(),
    };

    session.state_json = { ...session.state_json as object, S: 1, active_step: step };

    this.history.push({
      id: randomUUID(),
      session_id: session.id,
      event_type: 'plan',
      event_json: step,
      created_at: new Date().toISOString(),
    });

    return {
      session_id: session.id,
      S: 1,
      primary: plan.primary,
      recovery: plan.recovery,
      irreversible: plan.irreversible,
    };
  }

  async ulyssesOutcome(
    sessionId: string,
    outcome: UlyssesOutcomeInput,
  ): Promise<Record<string, unknown>> {
    const session = this.requireActiveSession('ulysses');
    if (session.id !== sessionId) {
      throw new Error(`Session ${sessionId} is not the active ulysses session`);
    }
    const state = session.state_json as {
      S: number;
      consecutive_surprises: number;
      active_step: unknown;
      surprise_register: unknown[];
      checkpoints: string[];
    };

    if (!state.active_step) {
      throw new Error('No active step. Run plan first.');
    }

    this.history.push({
      id: randomUUID(),
      session_id: session.id,
      event_type: 'outcome',
      event_json: {
        step: state.active_step,
        assessment: outcome.assessment,
        details: outcome.details ?? '',
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    const newState = { ...state, active_step: null } as typeof state;
    let resultMsg: string;

    if (outcome.assessment === 'expected') {
      newState.S = 0;
      newState.consecutive_surprises = 0;
      newState.checkpoints = [...state.checkpoints, `checkpoint_${state.checkpoints.length}`];
      resultMsg = 'Expected outcome. S reset to 0. Checkpoint created.';
    } else {
      const severity = outcome.severity ?? 1;
      const surprise = {
        details: outcome.details ?? '',
        severity,
        timestamp: new Date().toISOString(),
      };
      newState.surprise_register = [...state.surprise_register, surprise].slice(-3);

      if (severity === 2) {
        newState.S = 2;
        newState.consecutive_surprises = 0;
        resultMsg = 'Flagrant-2 surprise. S=2. REFLECT required.';
      } else {
        const count = (state.consecutive_surprises ?? 0) + 1;
        newState.consecutive_surprises = count;
        if (count >= 2) {
          newState.S = 2;
          newState.consecutive_surprises = 0;
          resultMsg = `Surprise #${count} (severity ${severity}). S=2. REFLECT required.`;
        } else {
          newState.S = Math.max(state.S ?? 0, 1);
          resultMsg = `Surprise #${count} (severity ${severity}). S=${newState.S}.`;
        }
      }
    }

    session.state_json = newState;

    return {
      session_id: session.id,
      assessment: outcome.assessment,
      S: newState.S,
      message: resultMsg,
    };
  }

  async ulyssesReflect(
    sessionId: string,
    reflection: ReflectInput,
  ): Promise<Record<string, unknown>> {
    const session = this.requireActiveSession('ulysses');
    if (session.id !== sessionId) {
      throw new Error(`Session ${sessionId} is not the active ulysses session`);
    }
    const state = session.state_json as { S: number; hypotheses: unknown[] };

    if ((state.S ?? 0) !== 2) {
      throw new Error(
        `REFLECT requires S=2 (current S=${state.S ?? 0}). Only callable after two consecutive surprises.`,
      );
    }

    const hypothesis = {
      statement: reflection.hypothesis,
      falsification: reflection.falsification,
      timestamp: new Date().toISOString(),
    };

    session.state_json = {
      ...state,
      S: 0,
      consecutive_surprises: 0,
      hypotheses: [...(state.hypotheses ?? []), hypothesis],
    };

    this.history.push({
      id: randomUUID(),
      session_id: session.id,
      event_type: 'reflect',
      event_json: hypothesis,
      created_at: new Date().toISOString(),
    });

    return {
      session_id: session.id,
      S: 0,
      hypothesis: reflection.hypothesis,
      falsification: reflection.falsification,
      message: 'Reflection recorded. S reset to 0. Ready for next plan.',
    };
  }

  async ulyssesStatus(): Promise<Record<string, unknown>> {
    const session = this.getActiveSession('ulysses');
    if (!session) {
      return { active: false, protocol: 'ulysses' };
    }
    const state = session.state_json as {
      S: number;
      consecutive_surprises: number;
      problem: string;
      active_step: Record<string, unknown> | null;
      surprise_register: unknown[];
      hypotheses: unknown[];
      checkpoints: string[];
    };
    const historyCount = this.history.filter(h => h.session_id === session.id).length;

    return {
      active: true,
      protocol: 'ulysses',
      session_id: session.id,
      S: state.S ?? 0,
      consecutive_surprises: state.consecutive_surprises ?? 0,
      problem: state.problem,
      active_step: state.active_step,
      surprise_register_count: state.surprise_register?.length ?? 0,
      hypothesis_count: state.hypotheses?.length ?? 0,
      checkpoint_count: state.checkpoints?.length ?? 0,
      history_event_count: historyCount,
      created_at: session.created_at,
    };
  }

  async ulyssesComplete(
    sessionId: string,
    terminalState: UlyssesTerminal,
    summary?: string,
  ): Promise<Record<string, unknown>> {
    const session = this.requireActiveSession('ulysses');
    if (session.id !== sessionId) {
      throw new Error(`Session ${sessionId} is not the active ulysses session`);
    }
    session.status = terminalState;
    session.completed_at = new Date().toISOString();
    const result: Record<string, unknown> = { session_id: session.id, status: terminalState };
    if (summary) result.summary = summary;
    return result;
  }

  async checkEnforcement(
    input: ProtocolEnforcementInput,
  ): Promise<ProtocolEnforcementResult> {
    if (!input.mutation) {
      return { enforce: false };
    }

    const workspaceId = input.workspaceId ?? this.workspaceId;
    const ulyssesSession = this.getActiveSession('ulysses', workspaceId);
    if (ulyssesSession) {
      const state = ulyssesSession.state_json as { S?: number };
      if ((state.S ?? 0) === ULYSSES_STATE_NEEDS_REFLECT) {
        return {
          enforce: true,
          blocked: true,
          reason:
            'REFLECT REQUIRED: Ulysses session is waiting for reflect before further mutation',
          protocol: 'ulysses',
          session_id: ulyssesSession.id,
          required_action: 'reflect',
        };
      }
    }

    const targetPath = input.targetPath;
    if (!targetPath) {
      return { enforce: false };
    }

    const session = this.getActiveSession('theseus', workspaceId);
    if (!session) {
      return { enforce: false };
    }

    if (isTestFile(targetPath)) {
      return {
        enforce: true,
        blocked: true,
        reason: 'TEST LOCK: Cannot modify test files during refactoring',
        session_id: session.id,
        protocol: 'theseus',
      };
    }

    const inScope = this.scope.some(
      s => s.session_id === session.id && targetPath.startsWith(s.file_path),
    );
    if (!inScope) {
      return {
        enforce: true,
        blocked: true,
        reason: 'VISA REQUIRED: File outside declared scope',
        session_id: session.id,
        protocol: 'theseus',
        required_action: 'visa',
      };
    }

    return {
      enforce: true,
      blocked: false,
      session_id: session.id,
      protocol: 'theseus',
    };
  }
}
