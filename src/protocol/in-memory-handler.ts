/**
 * In-memory protocol handler — same interface as ProtocolHandler,
 * no Supabase dependency. Works in filesystem mode.
 */

import { randomUUID } from 'node:crypto';
import type { ThoughtboxEvent, OnThoughtboxEvent } from '../events/types.js';
import type { ValidatorService } from '../notebook/validator.js';
import type { ValidatorBinding, ValidationResult } from '../notebook/types.js';
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
  type BindFinalValidatorInput,
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
  private validatorService: ValidatorService | null = null;

  constructor(private onEvent?: OnThoughtboxEvent) {}

  /** Inject the notebook ValidatorService used by Ulysses validator bindings. */
  setValidatorService(service: ValidatorService): void {
    this.validatorService = service;
  }

  private requireValidator(): ValidatorService {
    if (!this.validatorService) {
      throw new Error(
        'ValidatorService not configured. Notebook validator bindings are required for Ulysses operations.',
      );
    }
    return this.validatorService;
  }

  private emit(
    type: ThoughtboxEvent['type'],
    sessionId: string,
    data: Record<string, unknown>,
  ): void {
    if (!this.onEvent) return;
    this.onEvent({
      source: 'protocol',
      type,
      workspaceId: this.workspaceId ?? '',
      timestamp: new Date().toISOString(),
      data: { session_id: sessionId, ...data },
    });
  }

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

    this.emit('theseus_init', session.id, { scope, description });

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

    this.emit('theseus_visa', session.id, { filePath: visa.filePath, justification: visa.justification });

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

    this.emit('theseus_checkpoint', session.id, {
      approved: audit.approved,
      B: audit.approved ? 0 : (session.state_json as { B: number }).B,
    });

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
      this.emit('theseus_outcome', session.id, { testsPassed: true, B: 0 });
      return { session_id: session.id, testsPassed: true, B: 0, test_fail_count: 0 };
    }

    const newCount = (state.test_fail_count ?? 0) + 1;

    if (newCount >= 2) {
      session.state_json = { ...state, B: 0, test_fail_count: 0 };
      this.emit('theseus_outcome', session.id, { testsPassed: false, B: 0 });
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
    this.emit('theseus_outcome', session.id, { testsPassed: false, B: 1 });
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
    this.emit('theseus_complete', session.id, { status: terminalState });
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
        problem,
        constraints: constraints ?? [],
        checkpoints: ['initial'],
        hypotheses: [],
        forbidden_moves: [],
        active_step: null,
      },
      created_at: new Date().toISOString(),
      completed_at: null,
    };
    this.sessions.push(session);

    this.emit('ulysses_init', session.id, { problem });

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

    const validator = this.requireValidator();
    const primaryBinding = await validator.bind(
      plan.primaryValidator.notebookId,
      plan.primaryValidator.cellId,
    );
    const recoveryBinding = await validator.bind(
      plan.recoveryValidator.notebookId,
      plan.recoveryValidator.cellId,
    );

    const step = {
      primary: plan.primary,
      recovery: plan.recovery,
      irreversible: plan.irreversible,
      timestamp: new Date().toISOString(),
      primaryValidator: primaryBinding,
      recoveryValidator: recoveryBinding,
    };

    session.state_json = {
      ...(session.state_json as object),
      S: 1,
      active_step: step,
    };

    this.history.push({
      id: randomUUID(),
      session_id: session.id,
      event_type: 'plan',
      event_json: step as unknown as Record<string, unknown>,
      created_at: new Date().toISOString(),
    });

    return {
      session_id: session.id,
      S: 1,
      primary: plan.primary,
      recovery: plan.recovery,
      irreversible: plan.irreversible,
      primaryValidator: {
        notebookId: primaryBinding.notebookId,
        cellId: primaryBinding.cellId,
        snapshotHash: primaryBinding.snapshotHash,
      },
      recoveryValidator: {
        notebookId: recoveryBinding.notebookId,
        cellId: recoveryBinding.cellId,
        snapshotHash: recoveryBinding.snapshotHash,
      },
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
      active_step:
        | (Record<string, unknown> & {
            primary?: string;
            recovery?: string;
            primaryValidator?: ValidatorBinding;
            recoveryValidator?: ValidatorBinding;
          })
        | null;
      checkpoints: string[];
      forbidden_moves: string[];
    };

    if (!state.active_step) {
      throw new Error('No active step. Run plan first.');
    }

    const activeStep = state.active_step;
    const phaseValidator =
      state.S === 1 ? activeStep.primaryValidator : activeStep.recoveryValidator;
    if (!phaseValidator) {
      throw new Error(
        `No ${state.S === 1 ? 'primary' : 'recovery'} validator bound on active step.`,
      );
    }

    const validator = this.requireValidator();
    const validation: ValidationResult = await validator.run(
      phaseValidator,
      outcome.observed,
      { expectedSnapshotHash: phaseValidator.snapshotHash },
    );

    if (!validation.hashMatched) {
      session.state_json = {
        ...state,
        S: 2,
        active_step: null,
      };

      this.history.push({
        id: randomUUID(),
        session_id: session.id,
        event_type: 'validator_tampering',
        event_json: {
          phase: state.S === 1 ? 'primary' : 'recovery',
          binding: {
            notebookId: phaseValidator.notebookId,
            cellId: phaseValidator.cellId,
            expectedSnapshotHash: phaseValidator.snapshotHash,
            actualSnapshotHash: validation.snapshotHash,
          },
          observed: outcome.observed,
          details: outcome.details ?? '',
          timestamp: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      });

      this.emit('ulysses_outcome', session.id, {
        assessment: 'unexpected-unfavorable',
        S: 2,
        validatorTampering: true,
      });

      return {
        session_id: session.id,
        assessment: 'unexpected-unfavorable',
        S: 2,
        validatorTampering: true,
        validation,
        message:
          'Validator snapshot mismatch — predicate has been tampered with. S→2. REFLECT required.',
      };
    }

    const derivedAssessment: 'expected' | 'unexpected-unfavorable' =
      validation.pass ? 'expected' : 'unexpected-unfavorable';
    let resultMsg: string;

    if (derivedAssessment === 'expected') {
      session.state_json = {
        ...state,
        S: 0,
        active_step: null,
        checkpoints: [
          ...state.checkpoints,
          `checkpoint_${state.checkpoints.length}`,
        ],
      };
      resultMsg = 'Validator pass. S→0. Checkpoint created.';
    } else if (state.S === 1) {
      session.state_json = {
        ...state,
        S: 2,
      };
      resultMsg =
        'Primary validator failed. S→2. Execute the recovery move and report observed.';
    } else {
      const forbidden = [...(state.forbidden_moves ?? [])];
      if (activeStep.primary) forbidden.push(activeStep.primary);
      if (activeStep.recovery) forbidden.push(activeStep.recovery);
      session.state_json = {
        ...state,
        S: 2,
        active_step: null,
        forbidden_moves: forbidden,
      };
      resultMsg =
        'Recovery validator also failed. Both moves are now forbidden. S=2. REFLECT required.';
    }

    this.history.push({
      id: randomUUID(),
      session_id: session.id,
      event_type: 'outcome',
      event_json: {
        step: {
          primary: activeStep.primary,
          recovery: activeStep.recovery,
          irreversible: activeStep.irreversible,
          timestamp: activeStep.timestamp,
        },
        derivedAssessment,
        observed: outcome.observed,
        validator: {
          phase: state.S === 1 ? 'primary' : 'recovery',
          notebookId: phaseValidator.notebookId,
          cellId: phaseValidator.cellId,
          snapshotHash: phaseValidator.snapshotHash,
        },
        verdict: {
          pass: validation.pass,
          reason: validation.reason,
          evidence: validation.evidence ?? null,
          exitCode: validation.exitCode,
        },
        details: outcome.details ?? '',
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    const updatedState = session.state_json as typeof state;

    this.emit('ulysses_outcome', session.id, {
      assessment: derivedAssessment,
      S: updatedState.S,
    });

    return {
      session_id: session.id,
      assessment: derivedAssessment,
      S: updatedState.S,
      forbidden_moves: updatedState.forbidden_moves,
      validation,
      message: resultMsg,
    };
  }

  async ulyssesBindFinalValidator(
    sessionId: string,
    input: BindFinalValidatorInput,
  ): Promise<Record<string, unknown>> {
    const session = this.requireActiveSession('ulysses');
    if (session.id !== sessionId) {
      throw new Error(`Session ${sessionId} is not the active ulysses session`);
    }

    const validator = this.requireValidator();
    const binding = await validator.bind(input.notebookId, input.cellId);

    session.state_json = {
      ...(session.state_json as object),
      finalValidator: binding,
    };

    this.history.push({
      id: randomUUID(),
      session_id: session.id,
      event_type: 'final_validator_bound',
      event_json: {
        notebookId: binding.notebookId,
        cellId: binding.cellId,
        snapshotHash: binding.snapshotHash,
        boundAt: binding.boundAt,
      },
      created_at: new Date().toISOString(),
    });

    return {
      session_id: session.id,
      finalValidator: {
        notebookId: binding.notebookId,
        cellId: binding.cellId,
        snapshotHash: binding.snapshotHash,
        boundAt: binding.boundAt,
      },
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
    const state = session.state_json as { S: number; hypotheses: unknown[]; active_step: unknown };

    if ((state.S ?? 0) !== 2) {
      throw new Error(
        `REFLECT requires S=2 (current S=${state.S ?? 0}). Only callable after both primary and backup moves produced unexpected outcomes.`,
      );
    }
    if (state.active_step !== null && state.active_step !== undefined) {
      throw new Error('Backup move outcome not yet reported. Run outcome first.');
    }

    const hypothesis = {
      statement: reflection.hypothesis,
      falsification: reflection.falsification,
      timestamp: new Date().toISOString(),
    };

    session.state_json = {
      ...state,
      S: 0,
      hypotheses: [...(state.hypotheses ?? []), hypothesis],
    };

    this.history.push({
      id: randomUUID(),
      session_id: session.id,
      event_type: 'reflect',
      event_json: hypothesis,
      created_at: new Date().toISOString(),
    });

    this.emit('ulysses_reflect', session.id, { hypothesis: reflection.hypothesis });

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
      const last = this.sessions
        .filter(s => s.protocol === 'ulysses' && s.status !== 'active')
        .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))[0];
      return {
        active: false,
        protocol: 'ulysses',
        ...(last ? { last_session: { session_id: last.id, status: last.status, completed_at: last.completed_at } } : {}),
      };
    }
    const state = session.state_json as {
      S: number;
      problem: string;
      active_step: Record<string, unknown> | null;
      hypotheses: unknown[];
      checkpoints: string[];
      forbidden_moves: string[];
    };
    const historyCount = this.history.filter(h => h.session_id === session.id).length;

    return {
      active: true,
      protocol: 'ulysses',
      session_id: session.id,
      S: state.S ?? 0,
      problem: state.problem,
      active_step: state.active_step,
      forbidden_moves: state.forbidden_moves ?? [],
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
    observed?: unknown,
  ): Promise<Record<string, unknown>> {
    const session = this.requireActiveSession('ulysses');
    if (session.id !== sessionId) {
      throw new Error(`Session ${sessionId} is not the active ulysses session`);
    }

    let finalValidation: ValidationResult | null = null;

    if (terminalState === 'resolved') {
      const state = session.state_json as { finalValidator?: ValidatorBinding };
      const finalBinding = state.finalValidator;
      if (!finalBinding) {
        throw new Error(
          "Cannot complete with terminalState='resolved' until a final validator is bound. " +
            'Call ulyssesBindFinalValidator first, or choose a different terminal.',
        );
      }
      if (observed === undefined) {
        throw new Error(
          "complete with terminalState='resolved' requires 'observed' to be supplied for the final validator.",
        );
      }
      const validator = this.requireValidator();
      finalValidation = await validator.run(finalBinding, observed, {
        expectedSnapshotHash: finalBinding.snapshotHash,
      });

      if (!finalValidation.hashMatched) {
        throw new Error(
          'Final validator snapshot mismatch — predicate has been tampered with. Refusing to complete with resolved.',
        );
      }
      if (!finalValidation.pass) {
        throw new Error(
          `Final validator rejected resolution: ${finalValidation.reason}. ` +
            'Continue work, or pick a different terminalState (e.g., insufficient_information).',
        );
      }
    }

    session.status = terminalState;
    session.completed_at = new Date().toISOString();
    this.emit('ulysses_complete', session.id, { status: terminalState });
    const result: Record<string, unknown> = { session_id: session.id, status: terminalState };
    if (summary) result.summary = summary;
    if (finalValidation) result.finalValidation = finalValidation;
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
      const state = ulyssesSession.state_json as { S?: number; active_step?: unknown };
      if ((state.S ?? 0) === ULYSSES_STATE_NEEDS_REFLECT && state.active_step == null) {
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
