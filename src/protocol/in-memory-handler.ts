/**
 * In-memory protocol handler — same interface as ProtocolHandler,
 * no Supabase dependency. Works in filesystem mode.
 */

import { randomUUID } from 'node:crypto';
import type {
  Protocol,
  ProtocolSession,
  TheseusTerminal,
  UlyssesTerminal,
  DelphiTerminal,
  DelphiState,
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
  ProtocolScope,
  ProtocolVisa,
  ProtocolAudit,
  ProtocolHistoryEvent,
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
  ): ProtocolSession | null {
    return this.sessions
      .filter(s => s.protocol === protocol && s.status === 'active')
      .filter(s => !this.workspaceId || s.workspace_id === this.workspaceId)
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

  // ---------------------------------------------------------------------------
  // Delphi operations
  // ---------------------------------------------------------------------------

  async delphiInit(
    input: DelphiInitInput,
  ): Promise<Record<string, unknown>> {
    const supersededId = this.supersedeExisting('delphi');

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

    const session: ProtocolSession = {
      id: randomUUID(),
      protocol: 'delphi',
      workspace_id: this.workspaceId,
      status: 'active',
      state_json: initialState as unknown as Record<string, unknown>,
      created_at: new Date().toISOString(),
      completed_at: null,
    };
    this.sessions.push(session);

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
    const session = this.requireActiveSession('delphi');
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

    session.state_json = state as unknown as Record<string, unknown>;
    this.recordEvent(session.id, 'hypothesize', {
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
    const session = this.requireActiveSession('delphi');
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
      throw new Error('Must declare 1-5 discriminants.');
    }

    for (const d of input.discriminants) {
      if (!d.closureRule.slots || d.closureRule.slots.length === 0) {
        throw new Error(
          `Discriminant "${d.id}" must have at least one evidence slot.`,
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
    session.state_json = state as unknown as Record<string, unknown>;
    this.recordEvent(session.id, 'discriminate', {
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
    const session = this.requireActiveSession('delphi');
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

    session.state_json = state as unknown as Record<string, unknown>;
    this.recordEvent(session.id, 'probe', record);

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
    const session = this.requireActiveSession('delphi');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active delphi session`,
      );
    }
    const state = session.state_json as unknown as DelphiState;

    if (state.phase !== 'inquire' && state.phase !== 'destabilize') {
      throw new Error(`Cannot assess in phase "${state.phase}".`);
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

    session.state_json = state as unknown as Record<string, unknown>;
    this.recordEvent(session.id, 'assess', {
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
    const session = this.requireActiveSession('delphi');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active delphi session`,
      );
    }
    const state = session.state_json as unknown as DelphiState;

    if (state.phase !== 'destabilize') {
      throw new Error(
        `Cannot destabilize in phase "${state.phase}".`,
      );
    }

    if (!state.pendingChallenge) {
      throw new Error('No pending challenge.');
    }

    this.recordEvent(session.id, 'destabilize', {
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

    session.state_json = state as unknown as Record<string, unknown>;

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
    const session = this.requireActiveSession('delphi');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active delphi session`,
      );
    }
    const state = session.state_json as unknown as DelphiState;

    state.witnessStatus = 'invoked';
    session.state_json = state as unknown as Record<string, unknown>;

    this.recordEvent(session.id, 'witness', {
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
    const session = this.requireActiveSession('delphi');
    if (session.id !== sessionId) {
      throw new Error(
        `Session ${sessionId} is not the active delphi session`,
      );
    }
    const state = session.state_json as unknown as DelphiState;

    if (input.terminalState === 'supported_thesis'
      && state.witnessStatus !== 'invoked') {
      throw new Error(
        'SUPPORTED_THESIS requires Iron Witness invocation.',
      );
    }

    if (input.terminalState === 'irreducible_uncertainty'
      && state.witnessStatus !== 'invoked') {
      throw new Error(
        'IRREDUCIBLE_UNCERTAINTY requires Iron Witness invocation.',
      );
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
        `SUPPORTED_THESIS requires exactly one live hypothesis. ${liveHypotheses.length} still live.`,
      );
    }

    this.recordEvent(session.id, 'complete', {
      terminalState: input.terminalState,
      strength: input.strength,
      assurance: input.assurance,
      summary: input.summary,
    });

    session.status = input.terminalState;
    session.completed_at = new Date().toISOString();

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
    const session = this.getActiveSession('delphi');
    if (!session) {
      return { active: false, protocol: 'delphi' };
    }

    const state = session.state_json as unknown as DelphiState;
    const historyCount = this.history.filter(
      h => h.session_id === session.id,
    ).length;

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
      history_event_count: historyCount,
      created_at: session.created_at,
    };
  }

  // ---------------------------------------------------------------------------
  // Delphi helper
  // ---------------------------------------------------------------------------

  private recordEvent(
    sessionId: string,
    eventType: string,
    eventData: Record<string, unknown>,
  ): void {
    this.history.push({
      id: randomUUID(),
      session_id: sessionId,
      event_type: eventType,
      event_json: {
        ...eventData,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });
  }

  async checkEnforcement(
    targetPath: string,
  ): Promise<Record<string, unknown>> {
    const session = this.getActiveSession('theseus');
    if (!session) {
      return { enforce: false };
    }

    const isTestFile = /(\/(tests?|__tests__)\/|\.test\.|\.spec\.)/.test(targetPath);
    if (isTestFile) {
      return {
        enforce: true,
        blocked: true,
        reason: 'TEST LOCK: Cannot modify test files during refactoring',
        session_id: session.id,
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
