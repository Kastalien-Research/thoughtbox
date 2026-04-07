/**
 * Protocol handler for Theseus and Ulysses protocol operations.
 * Uses Supabase as the persistence backend with workspace isolation (ADR-013).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '../database.types.js';
import type { ThoughtboxEvent, OnThoughtboxEvent } from '../events/types.js';
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
} from './types.js';

export class ProtocolHandler {
  private workspaceId: string | null = null;

  constructor(
    private client: SupabaseClient<Database>,
    private onEvent?: OnThoughtboxEvent,
  ) {}

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

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  private async getActiveSession(
    protocol: Protocol,
    workspaceId: string | null = this.workspaceId,
  ): Promise<ProtocolSession | null> {
    let query = this.client
      .from('protocol_sessions')
      .select('*')
      .eq('protocol', protocol)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

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
      ...(this.workspaceId ? { workspace_id: this.workspaceId } : {}),
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
      consecutive_surprises: 0,
      problem,
      constraints: constraints ?? [],
      surprise_register: [] as Json[],
      checkpoints: ['initial'],
      hypotheses: [] as Json[],
      active_step: null,
    };

    const insertPayload = {
      protocol: 'ulysses' as const,
      state_json: initialState,
      ...(this.workspaceId ? { workspace_id: this.workspaceId } : {}),
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

    const step = {
      primary: plan.primary,
      recovery: plan.recovery,
      irreversible: plan.irreversible,
      timestamp: new Date().toISOString(),
    };

    const newState = { ...state, S: 1, active_step: step };
    const { error: stateErr } = await this.client
      .from('protocol_sessions')
      .update({ state_json: newState })
      .eq('id', session.id);

    if (stateErr) {
      throw new Error(`Failed to update state: ${stateErr.message}`);
    }

    const { error: histErr } = await this.client
      .from('protocol_history')
      .insert({
        session_id: session.id,
        event_type: 'plan',
        event_json: step,
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
      consecutive_surprises: number;
      active_step: Json | null;
      surprise_register: Json[];
      checkpoints: string[];
    };

    if (!state.active_step) {
      throw new Error('No active step. Run plan first.');
    }

    const outcomeEvent: Json = {
      step: state.active_step,
      assessment: outcome.assessment,
      details: outcome.details ?? '',
      timestamp: new Date().toISOString(),
    };

    const { error: histErr } = await this.client
      .from('protocol_history')
      .insert({
        session_id: session.id,
        event_type: 'outcome',
        event_json: outcomeEvent,
      });

    if (histErr) {
      throw new Error(`Failed to record outcome: ${histErr.message}`);
    }

    const newState = { ...state, active_step: null };
    let resultMsg: string;

    if (outcome.assessment === 'expected') {
      newState.S = 0;
      newState.consecutive_surprises = 0;
      newState.checkpoints = [
        ...state.checkpoints,
        `checkpoint_${state.checkpoints.length}`,
      ];
      resultMsg = 'Expected outcome. S reset to 0. Checkpoint created.';
    } else {
      const severity = outcome.severity ?? 1;
      const surprise = {
        details: outcome.details ?? '',
        severity,
        timestamp: new Date().toISOString(),
      };
      newState.surprise_register = [
        ...state.surprise_register,
        surprise,
      ].slice(-3);

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
          resultMsg =
            `Surprise #${count} (severity ${severity}). S=2. REFLECT required.`;
        } else {
          newState.S = Math.max(state.S ?? 0, 1);
          resultMsg =
            `Surprise #${count} (severity ${severity}). S=${newState.S}.`;
        }
      }
    }

    const { error: stateErr } = await this.client
      .from('protocol_sessions')
      .update({ state_json: newState as Json })
      .eq('id', session.id);

    if (stateErr) {
      throw new Error(`Failed to update state: ${stateErr.message}`);
    }

    this.emit('ulysses_outcome', session.id, { assessment: outcome.assessment, S: newState.S });

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
    const session = await this.requireActiveSession('ulysses');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active ulysses session`,
      );
    }
    const state = session.state_json as {
      S: number;
      hypotheses: Json[];
    };

    if ((state.S ?? 0) !== 2) {
      throw new Error(
        `REFLECT requires S=2 (current S=${state.S ?? 0}). ` +
          'Only callable after two consecutive surprises.',
      );
    }

    const hypothesis = {
      statement: reflection.hypothesis,
      falsification: reflection.falsification,
      timestamp: new Date().toISOString(),
    };

    const newState = {
      ...state,
      S: 0,
      consecutive_surprises: 0,
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

    const { count: historyCount } = await this.client
      .from('protocol_history')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session.id);

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
      history_event_count: historyCount ?? 0,
      created_at: session.created_at,
    };
  }

  async ulyssesComplete(
    sessionId: string,
    terminalState: UlyssesTerminal,
    summary?: string,
  ): Promise<Record<string, unknown>> {
    const session = await this.requireActiveSession('ulysses');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active ulysses session`,
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

    this.emit('ulysses_complete', session.id, { status: terminalState });

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
