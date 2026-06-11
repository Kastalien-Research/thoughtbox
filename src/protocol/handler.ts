/**
 * Protocol handler for Theseus and Ulysses protocol operations.
 * Uses Supabase as the persistence backend with workspace isolation (ADR-013).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '../database.types.js';
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
} from './types.js';

export class ProtocolHandler {
  private workspaceId: string | null = null;
  private validatorService: ValidatorService | null = null;

  constructor(
    private client: SupabaseClient<Database>,
    private onEvent?: OnThoughtboxEvent,
  ) {}

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

  /** ADR-013: project scoping */
  setProject(project: string): void {
    this.workspaceId = project;
  }

  /**
   * Protocol rows are workspace-scoped NOT NULL in Postgres; fail fast with
   * a clear error instead of letting the insert hit the constraint.
   */
  private requireWorkspaceId(): string {
    if (!this.workspaceId) {
      throw new Error(
        'Protocol operations require a workspace scope (call setProject before init)',
      );
    }
    return this.workspaceId;
  }

  /** Workspace for child rows: prefer the parent session's scope. */
  private sessionWorkspaceId(session: { workspace_id: string | null }): string {
    return session.workspace_id ?? this.requireWorkspaceId();
  }

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  private async getActiveSession(
    protocol: Protocol,
    workspaceId: string | null = this.workspaceId,
  ): Promise<ProtocolSession | null> {
    // Fail closed: without a workspace scope, never run an unscoped query that
    // could return another tenant's session.
    if (!workspaceId) return null;

    const query = this.client
      .from('protocol_sessions')
      .select('*')
      .eq('protocol', protocol)
      .eq('status', 'active')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1);

    const { data, error } = await query.single();

    if (error?.code === 'PGRST116') return null;
    if (error) {
      throw new Error(
        `Failed to fetch active ${protocol} session: ${error.message}`,
      );
    }
    return data as ProtocolSession;
  }

  private async requireActiveSession(
    protocol: Protocol,
  ): Promise<ProtocolSession> {
    const session = await this.getActiveSession(protocol);
    if (!session) {
      throw new Error(`No active ${protocol} session. Run init first.`);
    }
    return session;
  }

  private async supersedeExisting(
    protocol: Protocol,
  ): Promise<string | null> {
    const existing = await this.getActiveSession(protocol);
    if (!existing) return null;

    const { error } = await this.client
      .from('protocol_sessions')
      .update({
        status: 'superseded',
        completed_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) {
      throw new Error(
        `Failed to supersede session ${existing.id}: ${error.message}`,
      );
    }
    return existing.id;
  }

  // ---------------------------------------------------------------------------
  // Theseus operations
  // ---------------------------------------------------------------------------

  async theseusInit(
    scope: string[],
    description?: string,
  ): Promise<Record<string, unknown>> {
    if (!scope || scope.length === 0) {
      throw new Error(
        'Must provide initial file scope (e.g., scope: ["src/auth.ts"])',
      );
    }

    const supersededId = await this.supersedeExisting('theseus');

    const insertPayload = {
      protocol: 'theseus' as const,
      state_json: { B: 0, test_fail_count: 0, description: description ?? '' } as Json,
      workspace_id: this.requireWorkspaceId(),
    };

    const { data: session, error: sessionErr } = await this.client
      .from('protocol_sessions')
      .insert(insertPayload)
      .select()
      .single();

    if (sessionErr) {
      throw new Error(
        `Failed to create theseus session: ${sessionErr.message}`,
      );
    }

    const scopeRows = scope.map((f) => ({
      session_id: session.id,
      workspace_id: session.workspace_id,
      file_path: f,
      source: 'init' as const,
    }));

    const { error: scopeErr } = await this.client
      .from('protocol_scope')
      .insert(scopeRows);

    if (scopeErr) {
      throw new Error(`Failed to insert scope: ${scopeErr.message}`);
    }

    this.emit('theseus_init', session.id, { scope, description });

    const result: Record<string, unknown> = {
      session_id: session.id,
      protocol: 'theseus',
      status: 'active',
      B: 0,
      scope,
    };

    if (description) {
      result.description = description;
    }
    if (supersededId) {
      result.superseded_session = supersededId;
    }

    return result;
  }

  async theseusVisa(
    sessionId: string,
    visa: VisaInput,
  ): Promise<Record<string, unknown>> {
    const session = await this.requireActiveSession('theseus');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active theseus session`,
      );
    }

    const { error: visaErr } = await this.client
      .from('protocol_visas')
      .insert({
        session_id: session.id,
        workspace_id: this.sessionWorkspaceId(session),
        file_path: visa.filePath,
        justification: visa.justification,
        anti_pattern_acknowledged: visa.antiPatternAcknowledged,
      });

    if (visaErr) {
      throw new Error(`Failed to create visa: ${visaErr.message}`);
    }

    const { error: scopeErr } = await this.client
      .from('protocol_scope')
      .upsert(
        {
          session_id: session.id,
          workspace_id: this.sessionWorkspaceId(session),
          file_path: visa.filePath,
          source: 'visa' as const,
        },
        { onConflict: 'session_id,file_path' },
      );

    if (scopeErr) {
      throw new Error(`Failed to add file to scope: ${scopeErr.message}`);
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
    const session = await this.requireActiveSession('theseus');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active theseus session`,
      );
    }

    // Record audit
    const { error: auditErr } = await this.client
      .from('protocol_audits')
      .insert({
        session_id: session.id,
        workspace_id: this.sessionWorkspaceId(session),
        diff_hash: audit.diffHash,
        commit_message: audit.commitMessage,
        approved: audit.approved,
        feedback: audit.feedback ?? null,
      });

    if (auditErr) {
      throw new Error(`Failed to record audit: ${auditErr.message}`);
    }

    // Record checkpoint event in history
    const { error: histErr } = await this.client
      .from('protocol_history')
      .insert({
        session_id: session.id,
        workspace_id: this.sessionWorkspaceId(session),
        event_type: 'checkpoint',
        event_json: {
          diffHash: audit.diffHash,
          commitMessage: audit.commitMessage,
          approved: audit.approved,
          feedback: audit.feedback,
          timestamp: new Date().toISOString(),
        },
      });

    if (histErr) {
      throw new Error(
        `Failed to record checkpoint event: ${histErr.message}`,
      );
    }

    // Reset B counter on approved checkpoint
    if (audit.approved) {
      const currentState = session.state_json as Record<string, unknown>;
      const { error: stateErr } = await this.client
        .from('protocol_sessions')
        .update({
          state_json: { ...currentState, B: 0, test_fail_count: 0 },
        })
        .eq('id', session.id);

      if (stateErr) {
        throw new Error(
          `Failed to update session state: ${stateErr.message}`,
        );
      }
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
    const session = await this.requireActiveSession('theseus');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active theseus session`,
      );
    }
    const state = session.state_json as {
      B: number;
      test_fail_count: number;
    };

    // Record outcome event
    const { error: histErr } = await this.client
      .from('protocol_history')
      .insert({
        session_id: session.id,
        workspace_id: this.sessionWorkspaceId(session),
        event_type: 'outcome',
        event_json: {
          testsPassed: result.testsPassed,
          details: result.details ?? '',
          timestamp: new Date().toISOString(),
        },
      });

    if (histErr) {
      throw new Error(`Failed to record outcome event: ${histErr.message}`);
    }

    if (result.testsPassed) {
      const { error } = await this.client
        .from('protocol_sessions')
        .update({
          state_json: { ...state, B: 0, test_fail_count: 0 },
        })
        .eq('id', session.id);

      if (error) {
        throw new Error(`Failed to update state: ${error.message}`);
      }

      this.emit('theseus_outcome', session.id, { testsPassed: true, B: 0 });

      return {
        session_id: session.id,
        testsPassed: true,
        B: 0,
        test_fail_count: 0,
      };
    }

    const newCount = (state.test_fail_count ?? 0) + 1;

    if (newCount >= 2) {
      const { error } = await this.client
        .from('protocol_sessions')
        .update({
          state_json: { ...state, B: 0, test_fail_count: 0 },
        })
        .eq('id', session.id);

      if (error) {
        throw new Error(`Failed to update state: ${error.message}`);
      }

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

    const { error } = await this.client
      .from('protocol_sessions')
      .update({
        state_json: { ...state, B: 1, test_fail_count: newCount },
      })
      .eq('id', session.id);

    if (error) {
      throw new Error(`Failed to update state: ${error.message}`);
    }

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
    const session = await this.getActiveSession('theseus');
    if (!session) {
      return { active: false, protocol: 'theseus' };
    }

    const { data: scope } = await this.client
      .from('protocol_scope')
      .select('file_path, source')
      .eq('session_id', session.id);

    const { count: visaCount } = await this.client
      .from('protocol_visas')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session.id);

    const { count: auditCount } = await this.client
      .from('protocol_audits')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session.id);

    const state = session.state_json as {
      B: number;
      test_fail_count: number;
    };

    return {
      active: true,
      protocol: 'theseus',
      session_id: session.id,
      B: state.B ?? 0,
      test_fail_count: state.test_fail_count ?? 0,
      scope: scope ?? [],
      visa_count: visaCount ?? 0,
      audit_count: auditCount ?? 0,
      created_at: session.created_at,
    };
  }

  async theseusComplete(
    sessionId: string,
    terminalState: TheseusTerminal,
    summary?: string,
  ): Promise<Record<string, unknown>> {
    const session = await this.requireActiveSession('theseus');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active theseus session`,
      );
    }

    const { error } = await this.client
      .from('protocol_sessions')
      .update({
        status: terminalState,
        completed_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (error) {
      throw new Error(`Failed to complete session: ${error.message}`);
    }

    this.emit('theseus_complete', session.id, { status: terminalState });

    const result: Record<string, unknown> = {
      session_id: session.id,
      status: terminalState,
    };
    if (summary) {
      result.summary = summary;
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Ulysses operations
  // ---------------------------------------------------------------------------

  async ulyssesInit(
    problem: string,
    constraints?: string[],
  ): Promise<Record<string, unknown>> {
    const supersededId = await this.supersedeExisting('ulysses');

    const initialState: Json = {
      S: 0,
      problem,
      constraints: constraints ?? [],
      checkpoints: ['initial'],
      hypotheses: [] as Json[],
      forbidden_moves: [] as Json[],
      active_step: null,
    };

    const insertPayload = {
      protocol: 'ulysses' as const,
      state_json: initialState,
      workspace_id: this.requireWorkspaceId(),
    };

    const { data: session, error } = await this.client
      .from('protocol_sessions')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create ulysses session: ${error.message}`);
    }

    this.emit('ulysses_init', session.id, { problem });

    const result: Record<string, unknown> = {
      session_id: session.id,
      protocol: 'ulysses',
      status: 'active',
      S: 0,
      problem,
    };

    if (constraints && constraints.length > 0) {
      result.constraints = constraints;
    }
    if (supersededId) {
      result.superseded_session = supersededId;
    }

    return result;
  }

  async ulyssesPlan(
    sessionId: string,
    plan: PlanInput,
  ): Promise<Record<string, unknown>> {
    const session = await this.requireActiveSession('ulysses');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active ulysses session`,
      );
    }
    const state = session.state_json as {
      S: number;
      active_step: unknown;
    };

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

    // Hashes are persisted as siblings of the bindings (not nested inside
    // them) so post-bind tampering with the snapshot payload is detectable.
    // If the hash were only stored on the binding itself, an attacker who
    // could rewrite state_json would also rewrite the hash, and the
    // mismatch check would never fire.
    const step = {
      primary: plan.primary,
      recovery: plan.recovery,
      irreversible: plan.irreversible,
      timestamp: new Date().toISOString(),
      primaryValidator: primaryBinding,
      recoveryValidator: recoveryBinding,
      primaryValidatorSnapshotHash: primaryBinding.snapshotHash,
      recoveryValidatorSnapshotHash: recoveryBinding.snapshotHash,
    };

    const newState = { ...state, S: 1, active_step: step };
    const { error: stateErr } = await this.client
      .from('protocol_sessions')
      .update({ state_json: newState as unknown as Json })
      .eq('id', session.id);

    if (stateErr) {
      throw new Error(`Failed to update state: ${stateErr.message}`);
    }

    const { error: histErr } = await this.client
      .from('protocol_history')
      .insert({
        session_id: session.id,
        workspace_id: this.sessionWorkspaceId(session),
        event_type: 'plan',
        event_json: step as unknown as Json,
      });

    if (histErr) {
      throw new Error(`Failed to record plan event: ${histErr.message}`);
    }

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
    const session = await this.requireActiveSession('ulysses');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active ulysses session`,
      );
    }
    const state = session.state_json as {
      S: number;
      active_step:
        | (Record<string, unknown> & {
            primary?: string;
            recovery?: string;
            primaryValidator?: ValidatorBinding;
            recoveryValidator?: ValidatorBinding;
            primaryValidatorSnapshotHash?: string;
            recoveryValidatorSnapshotHash?: string;
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
      state.S === 1
        ? activeStep.primaryValidator
        : activeStep.recoveryValidator;

    if (!phaseValidator) {
      throw new Error(
        `No ${state.S === 1 ? 'primary' : 'recovery'} validator bound on active step.`,
      );
    }

    // Trust the hash stored as a sibling of the binding (set at plan time),
    // not the hash inside the binding payload — the binding payload is
    // exactly what could have been tampered with.
    const expectedSnapshotHash =
      state.S === 1
        ? activeStep.primaryValidatorSnapshotHash
        : activeStep.recoveryValidatorSnapshotHash;
    if (!expectedSnapshotHash) {
      throw new Error(
        `Missing ${state.S === 1 ? 'primary' : 'recovery'}ValidatorSnapshotHash on active step. ` +
          'State was created by a pre-tamper-fix version; rerun plan.',
      );
    }

    const validator = this.requireValidator();
    const validation: ValidationResult = await validator.run(
      phaseValidator,
      outcome.observed,
      { expectedSnapshotHash },
    );

    // Tampering: refuse the assessment, force S=2, clear active_step so the
    // existing REFLECT gate fires.
    if (!validation.hashMatched) {
      const tamperedState = {
        ...state,
        S: 2,
        active_step: null,
      };
      const { error: tamperStateErr } = await this.client
        .from('protocol_sessions')
        .update({ state_json: tamperedState as unknown as Json })
        .eq('id', session.id);
      if (tamperStateErr) {
        throw new Error(
          `Failed to persist tampered state: ${tamperStateErr.message}`,
        );
      }

      const { error: tamperHistErr } = await this.client
        .from('protocol_history')
        .insert({
          session_id: session.id,
          workspace_id: this.sessionWorkspaceId(session),
          event_type: 'validator_tampering',
          event_json: {
            phase: state.S === 1 ? 'primary' : 'recovery',
            binding: {
              notebookId: phaseValidator.notebookId,
              cellId: phaseValidator.cellId,
              expectedSnapshotHash,
              actualSnapshotHash: validation.snapshotHash,
            },
            observed: outcome.observed,
            details: outcome.details ?? '',
            timestamp: new Date().toISOString(),
          } as unknown as Json,
        });
      if (tamperHistErr) {
        throw new Error(
          `Failed to record tampering event: ${tamperHistErr.message}`,
        );
      }

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

    let newState: typeof state;
    let resultMsg: string;

    if (derivedAssessment === 'expected') {
      newState = {
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
      newState = {
        ...state,
        S: 2,
      };
      resultMsg =
        'Primary validator failed. S→2. Execute the recovery move and report observed.';
    } else {
      const forbidden = [...(state.forbidden_moves ?? [])];
      if (activeStep.primary) forbidden.push(activeStep.primary);
      if (activeStep.recovery) forbidden.push(activeStep.recovery);
      newState = {
        ...state,
        S: 2,
        active_step: null,
        forbidden_moves: forbidden,
      };
      resultMsg =
        'Recovery validator also failed. Both moves are now forbidden. S=2. REFLECT required.';
    }

    const outcomeEvent: Json = {
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
    } as unknown as Json;

    const { error: histErr } = await this.client
      .from('protocol_history')
      .insert({
        session_id: session.id,
        workspace_id: this.sessionWorkspaceId(session),
        event_type: 'outcome',
        event_json: outcomeEvent,
      });

    if (histErr) {
      throw new Error(`Failed to record outcome: ${histErr.message}`);
    }

    const { error: stateErr } = await this.client
      .from('protocol_sessions')
      .update({ state_json: newState as unknown as Json })
      .eq('id', session.id);

    if (stateErr) {
      throw new Error(`Failed to update state: ${stateErr.message}`);
    }

    this.emit('ulysses_outcome', session.id, {
      assessment: derivedAssessment,
      S: newState.S,
    });

    return {
      session_id: session.id,
      assessment: derivedAssessment,
      S: newState.S,
      forbidden_moves: newState.forbidden_moves,
      validation,
      message: resultMsg,
    };
  }

  async ulyssesBindFinalValidator(
    sessionId: string,
    input: BindFinalValidatorInput,
  ): Promise<Record<string, unknown>> {
    const session = await this.requireActiveSession('ulysses');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active ulysses session`,
      );
    }
    const state = session.state_json as Record<string, unknown> & {
      finalValidator?: ValidatorBinding;
      finalValidatorSnapshotHash?: string;
    };
    if (state.finalValidator) {
      throw new Error(
        'Final validator already bound for this session. Re-binding is rejected to prevent gaming the complete(resolved) gate. ' +
          'Start a new session if a different predicate is needed.',
      );
    }

    const validator = this.requireValidator();
    const binding = await validator.bind(input.notebookId, input.cellId);

    // Sibling hash field (see ulyssesPlan rationale): tampering with the
    // binding payload alone won't slip past complete(resolved).
    const newState = {
      ...state,
      finalValidator: binding,
      finalValidatorSnapshotHash: binding.snapshotHash,
    };
    const { error: stateErr } = await this.client
      .from('protocol_sessions')
      .update({ state_json: newState as unknown as Json })
      .eq('id', session.id);

    if (stateErr) {
      throw new Error(`Failed to update state: ${stateErr.message}`);
    }

    const { error: bindHistErr } = await this.client
      .from('protocol_history')
      .insert({
      session_id: session.id,
      workspace_id: this.sessionWorkspaceId(session),
      event_type: 'final_validator_bound',
      event_json: {
        notebookId: binding.notebookId,
        cellId: binding.cellId,
        snapshotHash: binding.snapshotHash,
        boundAt: binding.boundAt,
      } as unknown as Json,
    });
    if (bindHistErr) {
      throw new Error(
        `Failed to record final_validator_bound event: ${bindHistErr.message}`,
      );
    }

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
    const session = await this.requireActiveSession('ulysses');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active ulysses session`,
      );
    }
    const state = session.state_json as {
      S: number;
      hypotheses: Json[];
      active_step: Json | null;
    };

    if ((state.S ?? 0) !== 2) {
      throw new Error(
        `REFLECT requires S=2 (current S=${state.S ?? 0}). ` +
          'Only callable after both primary and backup moves produced unexpected outcomes.',
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

    const newState = {
      ...state,
      S: 0,
      hypotheses: [...(state.hypotheses ?? []), hypothesis],
    };

    const { error: stateErr } = await this.client
      .from('protocol_sessions')
      .update({ state_json: newState as Json })
      .eq('id', session.id);

    if (stateErr) {
      throw new Error(`Failed to update state: ${stateErr.message}`);
    }

    const { error: histErr } = await this.client
      .from('protocol_history')
      .insert({
        session_id: session.id,
        workspace_id: this.sessionWorkspaceId(session),
        event_type: 'reflect',
        event_json: hypothesis,
      });

    if (histErr) {
      throw new Error(
        `Failed to record reflect event: ${histErr.message}`,
      );
    }

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
    const session = await this.getActiveSession('ulysses');
    if (!session) {
      // Fetch most recent completed session for context, strictly scoped to
      // this workspace. With no workspace set we skip the lookup entirely
      // rather than fall back to a cross-tenant read.
      const { data: last } = this.workspaceId
        ? await this.client
            .from('protocol_sessions')
            .select('id, status, completed_at')
            .eq('protocol', 'ulysses')
            .neq('status', 'active')
            .eq('workspace_id', this.workspaceId)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        : { data: null };

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

    const { count: historyCount } = await this.client
      .from('protocol_history')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session.id);

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
      history_event_count: historyCount ?? 0,
      created_at: session.created_at,
    };
  }

  async ulyssesComplete(
    sessionId: string,
    terminalState: UlyssesTerminal,
    summary?: string,
    observed?: unknown,
  ): Promise<Record<string, unknown>> {
    const session = await this.requireActiveSession('ulysses');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active ulysses session`,
      );
    }

    let finalValidation: ValidationResult | null = null;

    if (terminalState === 'resolved') {
      const state = session.state_json as Record<string, unknown> & {
        finalValidator?: ValidatorBinding;
        finalValidatorSnapshotHash?: string;
      };
      const finalBinding = state.finalValidator;
      if (!finalBinding) {
        throw new Error(
          "Cannot complete with terminalState='resolved' until a final validator is bound. " +
            'Call ulyssesBindFinalValidator first, or choose a different terminal.',
        );
      }
      const expectedFinalHash = state.finalValidatorSnapshotHash;
      if (!expectedFinalHash) {
        throw new Error(
          'Missing finalValidatorSnapshotHash on session state. ' +
            'State was created by a pre-tamper-fix version; rebind the final validator.',
        );
      }
      if (observed === undefined) {
        throw new Error(
          "complete with terminalState='resolved' requires 'observed' to be supplied for the final validator.",
        );
      }
      const validator = this.requireValidator();
      finalValidation = await validator.run(finalBinding, observed, {
        expectedSnapshotHash: expectedFinalHash,
      });

      if (!finalValidation.hashMatched) {
        // Mirror ulyssesOutcome's tamper handling: persist S=2, clear
        // active_step so the REFLECT gate fires, and record a
        // validator_tampering history event before throwing. Without this
        // the agent could retry complete(resolved) indefinitely against the
        // same tampered binding with no audit trail.
        const tamperedState = { ...state, S: 2, active_step: null };
        const { error: tamperStateErr } = await this.client
          .from('protocol_sessions')
          .update({ state_json: tamperedState as unknown as Json })
          .eq('id', session.id);
        if (tamperStateErr) {
          throw new Error(
            `Failed to persist tampered state: ${tamperStateErr.message}`,
          );
        }

        const { error: tamperHistErr } = await this.client
          .from('protocol_history')
          .insert({
            session_id: session.id,
            workspace_id: this.sessionWorkspaceId(session),
            event_type: 'validator_tampering',
            event_json: {
              phase: 'final',
              binding: {
                notebookId: finalBinding.notebookId,
                cellId: finalBinding.cellId,
                expectedSnapshotHash: expectedFinalHash,
                actualSnapshotHash: finalValidation.snapshotHash,
              },
              observed,
              timestamp: new Date().toISOString(),
            } as unknown as Json,
          });
        if (tamperHistErr) {
          throw new Error(
            `Failed to record tampering event: ${tamperHistErr.message}`,
          );
        }

        this.emit('ulysses_outcome', session.id, {
          assessment: 'unexpected-unfavorable',
          S: 2,
          validatorTampering: true,
          phase: 'final',
        });

        throw new Error(
          'Final validator snapshot mismatch — predicate has been tampered with. S→2. REFLECT required.',
        );
      }
      if (!finalValidation.pass) {
        throw new Error(
          `Final validator rejected resolution: ${finalValidation.reason}. ` +
            'Continue work, or pick a different terminalState (e.g., insufficient_information).',
        );
      }
    }

    const { error } = await this.client
      .from('protocol_sessions')
      .update({
        status: terminalState,
        completed_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (error) {
      throw new Error(`Failed to complete session: ${error.message}`);
    }

    this.emit('ulysses_complete', session.id, { status: terminalState });

    const result: Record<string, unknown> = {
      session_id: session.id,
      status: terminalState,
    };
    if (summary) {
      result.summary = summary;
    }
    if (finalValidation) {
      result.finalValidation = finalValidation;
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Enforcement checks (for hooks and local runtime adapters)
  // ---------------------------------------------------------------------------

  async checkEnforcement(
    input: ProtocolEnforcementInput,
  ): Promise<ProtocolEnforcementResult> {
    if (!input.mutation) {
      return { enforce: false };
    }

    const workspaceId = input.workspaceId ?? this.workspaceId;
    const ulyssesSession = await this.getActiveSession('ulysses', workspaceId);
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

    const theseusSession = await this.getActiveSession('theseus', workspaceId);
    if (!theseusSession) {
      return { enforce: false };
    }

    if (isTestFile(targetPath)) {
      return {
        enforce: true,
        blocked: true,
        reason: 'TEST LOCK: Cannot modify test files during refactoring',
        protocol: 'theseus',
        session_id: theseusSession.id,
      };
    }

    const { data: scopeRows, error } = await this.client
      .from('protocol_scope')
      .select('file_path')
      .eq('session_id', theseusSession.id);

    if (error) {
      throw new Error(`Enforcement check failed: ${error.message}`);
    }

    const isInScope = (scopeRows ?? []).some(({ file_path }) =>
      targetPath.startsWith(file_path),
    );

    if (!isInScope) {
      return {
        enforce: true,
        blocked: true,
        reason: 'VISA REQUIRED: File outside declared scope',
        protocol: 'theseus',
        session_id: theseusSession.id,
        required_action: 'visa',
      };
    }

    return {
      enforce: true,
      blocked: false,
      protocol: 'theseus',
      session_id: theseusSession.id,
    };
  }
}
