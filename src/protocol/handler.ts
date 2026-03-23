/**
 * Protocol handler for Theseus and Ulysses protocol operations.
 * Uses Supabase as the persistence backend with workspace isolation (ADR-013).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '../database.types.js';
import type {
  Protocol,
  ProtocolSession,
  TheseusTerminal,
  UlyssesTerminal,
  DelphiTerminal,
  DelphiState,
  DelphiPhase,
  DelphiInitInput,
  DelphiHypothesizeInput,
  DelphiDiscriminateInput,
  DelphiProbeInput,
  DelphiAssessInput,
  DelphiDestabilizeInput,
  DelphiWitnessInput,
  DelphiCompleteInput,
  VisaInput,
  AuditInput,
  TheseusOutcomeInput,
  PlanInput,
  UlyssesOutcomeInput,
  ReflectInput,
} from './types.js';

export class ProtocolHandler {
  private workspaceId: string | null = null;

  constructor(private client: SupabaseClient<Database>) {}

  /** ADR-013: project scoping */
  setProject(project: string): void {
    this.workspaceId = project;
  }

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  private async getActiveSession(
    protocol: Protocol,
  ): Promise<ProtocolSession | null> {
    let query = this.client
      .from('protocol_sessions')
      .select('*')
      .eq('protocol', protocol)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (this.workspaceId) {
      query = query.eq('workspace_id', this.workspaceId);
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
  // Delphi operations
  // ---------------------------------------------------------------------------

  async delphiInit(
    input: DelphiInitInput,
  ): Promise<Record<string, unknown>> {
    const supersededId = await this.supersedeExisting('delphi');

    const initialState: DelphiState = {
      questionFrame: {
        question: input.question,
        questionType: input.questionType ?? 'unspecified',
        scope: input.scope ?? 'unbounded',
        resolutionClass: input.resolutionClass,
        admissibleEvidenceClasses:
          input.admissibleEvidenceClasses ?? [],
        inadmissibleEvidenceClasses:
          input.inadmissibleEvidenceClasses ?? [],
      },
      hypotheses: [],
      discriminants: [],
      evidenceLedger: [],
      opportunitySpace: [],
      N: 0,
      witnessStatus: 'available',
      phase: 'pre_frame',
      pendingChallenge: null,
    };

    const insertPayload = {
      protocol: 'delphi' as const,
      state_json: initialState as unknown as Json,
      ...(this.workspaceId ? { workspace_id: this.workspaceId } : {}),
    };

    const { data: session, error } = await this.client
      .from('protocol_sessions')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to create delphi session: ${error.message}`,
      );
    }

    const result: Record<string, unknown> = {
      session_id: session.id,
      protocol: 'delphi',
      status: 'active',
      phase: 'pre_frame',
      question: input.question,
      resolutionClass: input.resolutionClass,
    };
    if (supersededId) result.superseded_session = supersededId;
    return result;
  }

  async delphiHypothesize(
    sessionId: string,
    input: DelphiHypothesizeInput,
  ): Promise<Record<string, unknown>> {
    const session = await this.requireActiveSession('delphi');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active delphi session`,
      );
    }
    const state = session.state_json as unknown as DelphiState;

    if (state.phase !== 'pre_frame') {
      throw new Error(
        `Cannot hypothesize in phase "${state.phase}". Only allowed in pre_frame.`,
      );
    }
    if (input.hypotheses.length < 2 || input.hypotheses.length > 4) {
      throw new Error(
        'Must declare 2-4 hypotheses (structurally distinct, include null/uncertainty).',
      );
    }

    state.hypotheses = input.hypotheses.map((h, i) => ({
      id: `H${i + 1}`,
      statement: h.statement,
      supportPattern: h.supportPattern,
      falsificationCriteria: h.falsificationCriteria,
      incomparableConditions: h.incomparableConditions,
      status: 'live' as const,
      evidenceChain: [],
    }));

    await this.updateDelphiState(session.id, state);
    await this.recordDelphiEvent(session.id, 'hypothesize', {
      hypotheses: state.hypotheses,
    });

    return {
      session_id: session.id,
      hypotheses: state.hypotheses.map(h => ({
        id: h.id, statement: h.statement,
      })),
      count: state.hypotheses.length,
    };
  }

  async delphiDiscriminate(
    sessionId: string,
    input: DelphiDiscriminateInput,
  ): Promise<Record<string, unknown>> {
    const session = await this.requireActiveSession('delphi');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active delphi session`,
      );
    }
    const state = session.state_json as unknown as DelphiState;

    if (state.phase !== 'pre_frame') {
      throw new Error(
        `Cannot add discriminants in phase "${state.phase}". No mid-session expansion.`,
      );
    }
    if (state.hypotheses.length === 0) {
      throw new Error(
        'Must declare hypotheses before discriminants.',
      );
    }
    if (input.discriminants.length < 1
      || input.discriminants.length > 5) {
      throw new Error(
        'Must declare 1-5 discriminants.',
      );
    }

    for (const d of input.discriminants) {
      if (!d.closureRule.slots || d.closureRule.slots.length === 0) {
        throw new Error(
          `Discriminant "${d.id}" must have at least one evidence slot (finite closure rule).`,
        );
      }
      if (d.closureRule.slots.length > 3) {
        throw new Error(
          `Discriminant "${d.id}" exceeds max 3 slots per closure rule.`,
        );
      }
    }

    state.discriminants = input.discriminants.map(d => ({
      id: d.id,
      essential: d.essential,
      closureRule: {
        slots: d.closureRule.slots.map(s => ({
          id: s.id,
          description: s.description,
          requiredSourceClass: s.requiredSourceClass,
          requiresIndependence: s.requiresIndependence,
          status: 'empty' as const,
        })),
      },
      bearingOn: d.bearingOn,
      status: 'open' as const,
    }));

    state.phase = 'inquire';

    await this.updateDelphiState(session.id, state);
    await this.recordDelphiEvent(session.id, 'discriminate', {
      discriminants: state.discriminants.map(d => ({
        id: d.id, essential: d.essential,
        slotCount: d.closureRule.slots.length,
      })),
    });

    return {
      session_id: session.id,
      phase: 'inquire',
      discriminants: state.discriminants.map(d => ({
        id: d.id,
        essential: d.essential,
        slots: d.closureRule.slots.length,
        bearingOn: d.bearingOn,
      })),
    };
  }

  async delphiProbe(
    sessionId: string,
    input: DelphiProbeInput,
  ): Promise<Record<string, unknown>> {
    const session = await this.requireActiveSession('delphi');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active delphi session`,
      );
    }
    const state = session.state_json as unknown as DelphiState;

    if (state.phase !== 'inquire') {
      throw new Error(
        `Cannot probe in phase "${state.phase}". Probes only allowed in INQUIRE.`,
      );
    }

    const disc = state.discriminants.find(
      d => d.id === input.targetDiscriminant,
    );
    if (!disc) {
      throw new Error(
        `Unknown discriminant "${input.targetDiscriminant}".`,
      );
    }

    const slot = disc.closureRule.slots.find(
      s => s.id === input.targetSlot,
    );
    if (!slot) {
      throw new Error(
        `Unknown slot "${input.targetSlot}" in discriminant "${input.targetDiscriminant}".`,
      );
    }

    const probeId = `P${state.opportunitySpace.length + 1}`;
    const record = {
      id: probeId,
      description: input.description,
      targetDiscriminant: input.targetDiscriminant,
      targetSlot: input.targetSlot,
      probeType: input.probeType,
      bound: input.bound,
      interpretationMap: input.interpretationMap,
      challengeProbe: input.challengeProbe,
      timestamp: new Date().toISOString(),
    };

    state.opportunitySpace.push(record);
    state.pendingChallenge = {
      description: input.challengeProbe.description,
      type: input.challengeProbe.type,
      probeId,
    };

    await this.updateDelphiState(session.id, state);
    await this.recordDelphiEvent(session.id, 'probe', record);

    return {
      session_id: session.id,
      probeId,
      targetDiscriminant: input.targetDiscriminant,
      targetSlot: input.targetSlot,
      challengePreCommitted: input.challengeProbe.description,
    };
  }

  async delphiAssess(
    sessionId: string,
    input: DelphiAssessInput,
  ): Promise<Record<string, unknown>> {
    const session = await this.requireActiveSession('delphi');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active delphi session`,
      );
    }
    const state = session.state_json as unknown as DelphiState;

    if (state.phase !== 'inquire' && state.phase !== 'destabilize') {
      throw new Error(
        `Cannot assess in phase "${state.phase}".`,
      );
    }

    const lastProbe = state.opportunitySpace[
      state.opportunitySpace.length - 1
    ];
    if (!lastProbe) {
      throw new Error('No probe to assess. Run probe first.');
    }

    if (!input.source || input.source.trim() === '') {
      throw new Error(
        'Evidence source cannot be empty (no unsupported agent synthesis).',
      );
    }

    const entryId = `E${state.evidenceLedger.length + 1}`;
    const entry = {
      id: entryId,
      probeId: lastProbe.id,
      discriminantId: lastProbe.targetDiscriminant,
      slotId: lastProbe.targetSlot,
      rawObservation: input.finding,
      source: input.source,
      sourceClass: input.sourceClass,
      independenceClass: input.independenceClass,
      admissible: input.admissible,
      contaminated: input.contaminated,
      hypothesisEffects: input.hypothesisEffects,
    };

    state.evidenceLedger.push(entry);

    if (input.admissible && input.filledSlots.length > 0) {
      for (const slotId of input.filledSlots) {
        for (const disc of state.discriminants) {
          const slot = disc.closureRule.slots.find(
            s => s.id === slotId,
          );
          if (slot && slot.status === 'empty') {
            slot.status = 'filled';
            slot.filledBy = entryId;
          }
        }
      }

      for (const disc of state.discriminants) {
        const allFilled = disc.closureRule.slots.every(
          s => s.status === 'filled',
        );
        if (allFilled && disc.status === 'open') {
          disc.status = 'resolved';
        }
      }
    }

    for (const [hId, effect] of Object.entries(
      input.hypothesisEffects,
    )) {
      const hyp = state.hypotheses.find(h => h.id === hId);
      if (hyp && hyp.status === 'live') {
        hyp.evidenceChain.push(entryId);
        if (effect === 'supports' || effect === 'weakens') {
          // evidence recorded; pruning is agent's explicit decision
        }
      }
    }

    if (input.materialChange) {
      state.N = 0;
      state.phase = 'inquire';
    } else {
      state.N += 1;
      if (state.N >= 2) {
        state.phase = 'synthesize';
      } else {
        state.phase = 'destabilize';
      }
    }

    await this.updateDelphiState(session.id, state);
    await this.recordDelphiEvent(session.id, 'assess', {
      entryId,
      materialChange: input.materialChange,
      N: state.N,
      phase: state.phase,
    });

    return {
      session_id: session.id,
      entryId,
      materialChange: input.materialChange,
      N: state.N,
      phase: state.phase,
      message: input.materialChange
        ? 'Discriminating evidence recorded. N reset to 0.'
        : state.N >= 2
          ? 'Non-discriminating. N=2. SYNTHESIZE required.'
          : `Non-discriminating. N=${state.N}. Execute pre-committed challenge.`,
    };
  }

  async delphiDestabilize(
    sessionId: string,
    input: DelphiDestabilizeInput,
  ): Promise<Record<string, unknown>> {
    const session = await this.requireActiveSession('delphi');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active delphi session`,
      );
    }
    const state = session.state_json as unknown as DelphiState;

    if (state.phase !== 'destabilize') {
      throw new Error(
        `Cannot destabilize in phase "${state.phase}". Only allowed after non-discriminating assess.`,
      );
    }

    if (!state.pendingChallenge) {
      throw new Error(
        'No pending challenge. This should not happen if protocol is followed correctly.',
      );
    }

    await this.recordDelphiEvent(session.id, 'destabilize', {
      challenge: state.pendingChallenge,
      result: input.challengeResult,
      materialChange: input.materialChange,
    });

    state.pendingChallenge = null;

    if (input.materialChange) {
      state.N = 0;
      state.phase = 'inquire';
    } else {
      state.N = 2;
      state.phase = 'synthesize';
    }

    await this.updateDelphiState(session.id, state);

    return {
      session_id: session.id,
      materialChange: input.materialChange,
      N: state.N,
      phase: state.phase,
      message: input.materialChange
        ? 'Challenge changed landscape. N reset. Back to INQUIRE.'
        : 'Challenge did not discriminate. N=2. SYNTHESIZE required.',
    };
  }

  async delphiWitness(
    sessionId: string,
    input: DelphiWitnessInput,
  ): Promise<Record<string, unknown>> {
    const session = await this.requireActiveSession('delphi');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active delphi session`,
      );
    }
    const state = session.state_json as unknown as DelphiState;

    state.witnessStatus = 'invoked';

    await this.updateDelphiState(session.id, state);
    await this.recordDelphiEvent(session.id, 'witness', {
      witnessType: input.witnessType,
      challenge: input.challenge,
      response: input.response,
    });

    return {
      session_id: session.id,
      witnessStatus: 'invoked',
      witnessType: input.witnessType,
      challenge: input.challenge,
    };
  }

  async delphiComplete(
    sessionId: string,
    input: DelphiCompleteInput,
  ): Promise<Record<string, unknown>> {
    const session = await this.requireActiveSession('delphi');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active delphi session`,
      );
    }
    const state = session.state_json as unknown as DelphiState;

    if (input.terminalState === 'supported_thesis') {
      if (state.witnessStatus !== 'invoked') {
        throw new Error(
          'SUPPORTED_THESIS requires Iron Witness invocation. Call witness first, or terminal will be reduced-assurance.',
        );
      }
    }

    if (input.terminalState === 'irreducible_uncertainty') {
      if (state.witnessStatus !== 'invoked') {
        throw new Error(
          'IRREDUCIBLE_UNCERTAINTY requires Iron Witness invocation.',
        );
      }
    }

    if (input.terminalState === 'capability_gap') {
      const hasBlockedEssential = state.discriminants.some(
        d => d.essential && d.status === 'blocked',
      );
      if (!hasBlockedEssential) {
        throw new Error(
          'CAPABILITY_GAP requires at least one essential discriminant to be blocked.',
        );
      }
    }

    const liveHypotheses = state.hypotheses.filter(
      h => h.status === 'live',
    );
    if (input.terminalState === 'supported_thesis'
      && liveHypotheses.length > 1) {
      throw new Error(
        `SUPPORTED_THESIS requires exactly one live hypothesis. ${liveHypotheses.length} are still live. Prune rivals first.`,
      );
    }

    await this.recordDelphiEvent(session.id, 'complete', {
      terminalState: input.terminalState,
      strength: input.strength,
      assurance: input.assurance,
      summary: input.summary,
    });

    const { error } = await this.client
      .from('protocol_sessions')
      .update({
        status: input.terminalState,
        completed_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (error) {
      throw new Error(`Failed to complete session: ${error.message}`);
    }

    return {
      session_id: session.id,
      status: input.terminalState,
      strength: input.strength,
      assurance: input.assurance,
      summary: input.summary,
      evidenceCount: state.evidenceLedger.length,
      probeCount: state.opportunitySpace.length,
      liveHypotheses: liveHypotheses.length,
    };
  }

  async delphiStatus(): Promise<Record<string, unknown>> {
    const session = await this.getActiveSession('delphi');
    if (!session) {
      return { active: false, protocol: 'delphi' };
    }

    const state = session.state_json as unknown as DelphiState;
    const { count: historyCount } = await this.client
      .from('protocol_history')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session.id);

    return {
      active: true,
      protocol: 'delphi',
      session_id: session.id,
      phase: state.phase,
      N: state.N,
      question: state.questionFrame.question,
      resolutionClass: state.questionFrame.resolutionClass,
      hypothesisCount: state.hypotheses.length,
      liveHypotheses: state.hypotheses
        .filter(h => h.status === 'live').length,
      discriminantCount: state.discriminants.length,
      resolvedDiscriminants: state.discriminants
        .filter(d => d.status === 'resolved').length,
      evidenceCount: state.evidenceLedger.length,
      probeCount: state.opportunitySpace.length,
      witnessStatus: state.witnessStatus,
      pendingChallenge: state.pendingChallenge
        ? state.pendingChallenge.description : null,
      history_event_count: historyCount ?? 0,
      created_at: session.created_at,
    };
  }

  // ---------------------------------------------------------------------------
  // Delphi helpers
  // ---------------------------------------------------------------------------

  private async updateDelphiState(
    sessionId: string,
    state: DelphiState,
  ): Promise<void> {
    const { error } = await this.client
      .from('protocol_sessions')
      .update({ state_json: state as unknown as Json })
      .eq('id', sessionId);

    if (error) {
      throw new Error(
        `Failed to update delphi state: ${error.message}`,
      );
    }
  }

  private async recordDelphiEvent(
    sessionId: string,
    eventType: string,
    eventData: Record<string, unknown>,
  ): Promise<void> {
    const { error } = await this.client
      .from('protocol_history')
      .insert({
        session_id: sessionId,
        event_type: eventType,
        event_json: {
          ...eventData,
          timestamp: new Date().toISOString(),
        },
      });

    if (error) {
      throw new Error(
        `Failed to record delphi event: ${error.message}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Enforcement RPC (for hooks)
  // ---------------------------------------------------------------------------

  async checkEnforcement(
    targetPath: string,
  ): Promise<Record<string, unknown>> {
    const { data, error } = await this.client.rpc(
      'check_protocol_enforcement',
      { target_path: targetPath },
    );

    if (error) {
      throw new Error(`Enforcement check failed: ${error.message}`);
    }
    return data as Record<string, unknown>;
  }
}
