import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryProtocolHandler } from '../in-memory-handler.js';

describe('Delphi Protocol - InMemoryProtocolHandler', () => {
  let handler: InMemoryProtocolHandler;

  beforeEach(() => {
    handler = new InMemoryProtocolHandler();
  });

  describe('init', () => {
    it('creates a session in pre_frame phase', async () => {
      const result = await handler.delphiInit({
        question: 'Does X cause Y?',
        resolutionClass: 'decisive',
      });

      expect(result.protocol).toBe('delphi');
      expect(result.status).toBe('active');
      expect(result.phase).toBe('pre_frame');
      expect(result.session_id).toBeDefined();
    });

    it('supersedes existing session', async () => {
      const first = await handler.delphiInit({
        question: 'First question',
        resolutionClass: 'corroborative',
      });
      const second = await handler.delphiInit({
        question: 'Second question',
        resolutionClass: 'decisive',
      });

      expect(second.superseded_session).toBe(first.session_id);
    });
  });

  describe('hypothesize', () => {
    let sessionId: string;

    beforeEach(async () => {
      const result = await handler.delphiInit({
        question: 'Does X cause Y?',
        resolutionClass: 'decisive',
      });
      sessionId = result.session_id as string;
    });

    it('accepts 2-4 hypotheses', async () => {
      const result = await handler.delphiHypothesize(sessionId, {
        hypotheses: [
          {
            statement: 'X causes Y directly',
            supportPattern: 'correlation + mechanism',
            falsificationCriteria: 'No correlation found',
          },
          {
            statement: 'X does not cause Y',
            supportPattern: 'No correlation',
            falsificationCriteria: 'Strong correlation found',
          },
        ],
      });

      expect(result.count).toBe(2);
      expect(result.hypotheses).toHaveLength(2);
    });

    it('rejects fewer than 2 hypotheses', async () => {
      await expect(
        handler.delphiHypothesize(sessionId, {
          hypotheses: [{
            statement: 'Only one',
            supportPattern: 'test',
            falsificationCriteria: 'test',
          }],
        }),
      ).rejects.toThrow('Must declare 2-4 hypotheses');
    });

    it('rejects more than 4 hypotheses', async () => {
      const fiveHypotheses = Array.from({ length: 5 }, (_, i) => ({
        statement: `H${i + 1}`,
        supportPattern: 'test',
        falsificationCriteria: 'test',
      }));

      await expect(
        handler.delphiHypothesize(sessionId, {
          hypotheses: fiveHypotheses,
        }),
      ).rejects.toThrow('Must declare 2-4 hypotheses');
    });
  });

  describe('discriminate', () => {
    let sessionId: string;

    beforeEach(async () => {
      const result = await handler.delphiInit({
        question: 'Does X cause Y?',
        resolutionClass: 'decisive',
      });
      sessionId = result.session_id as string;
      await handler.delphiHypothesize(sessionId, {
        hypotheses: [
          {
            statement: 'X causes Y',
            supportPattern: 'correlation',
            falsificationCriteria: 'no correlation',
          },
          {
            statement: 'X does not cause Y',
            supportPattern: 'no correlation',
            falsificationCriteria: 'correlation found',
          },
        ],
      });
    });

    it('transitions to inquire phase', async () => {
      const result = await handler.delphiDiscriminate(sessionId, {
        discriminants: [{
          id: 'D1',
          essential: true,
          closureRule: {
            slots: [{
              id: 'S1',
              description: 'Primary evidence',
            }],
          },
          bearingOn: ['H1', 'H2'],
        }],
      });

      expect(result.phase).toBe('inquire');
    });

    it('requires hypotheses first', async () => {
      const fresh = await handler.delphiInit({
        question: 'Another question',
        resolutionClass: 'evaluative',
      });

      await expect(
        handler.delphiDiscriminate(
          fresh.session_id as string,
          {
            discriminants: [{
              id: 'D1',
              essential: true,
              closureRule: {
                slots: [{ id: 'S1', description: 'test' }],
              },
              bearingOn: ['H1'],
            }],
          },
        ),
      ).rejects.toThrow('Must declare hypotheses before discriminants');
    });

    it('rejects discriminants without closure rule slots', async () => {
      await expect(
        handler.delphiDiscriminate(sessionId, {
          discriminants: [{
            id: 'D1',
            essential: true,
            closureRule: { slots: [] },
            bearingOn: ['H1'],
          }],
        }),
      ).rejects.toThrow('must have at least one evidence slot');
    });

    it('rejects more than 5 discriminants', async () => {
      const sixDiscs = Array.from({ length: 6 }, (_, i) => ({
        id: `D${i + 1}`,
        essential: false,
        closureRule: {
          slots: [{ id: `S${i + 1}`, description: 'test' }],
        },
        bearingOn: ['H1'],
      }));

      await expect(
        handler.delphiDiscriminate(sessionId, {
          discriminants: sixDiscs,
        }),
      ).rejects.toThrow('Must declare 1-5 discriminants');
    });

    it('blocks mid-session discriminant addition', async () => {
      await handler.delphiDiscriminate(sessionId, {
        discriminants: [{
          id: 'D1',
          essential: true,
          closureRule: {
            slots: [{ id: 'S1', description: 'test' }],
          },
          bearingOn: ['H1'],
        }],
      });

      await expect(
        handler.delphiDiscriminate(sessionId, {
          discriminants: [{
            id: 'D2',
            essential: false,
            closureRule: {
              slots: [{ id: 'S2', description: 'test' }],
            },
            bearingOn: ['H2'],
          }],
        }),
      ).rejects.toThrow('No mid-session expansion');
    });
  });

  describe('probe → assess → N counter', () => {
    let sessionId: string;

    beforeEach(async () => {
      const result = await handler.delphiInit({
        question: 'Does X cause Y?',
        resolutionClass: 'decisive',
      });
      sessionId = result.session_id as string;
      await handler.delphiHypothesize(sessionId, {
        hypotheses: [
          {
            statement: 'X causes Y',
            supportPattern: 'correlation',
            falsificationCriteria: 'no correlation',
          },
          {
            statement: 'X does not cause Y',
            supportPattern: 'no correlation',
            falsificationCriteria: 'correlation found',
          },
        ],
      });
      await handler.delphiDiscriminate(sessionId, {
        discriminants: [{
          id: 'D1',
          essential: true,
          closureRule: {
            slots: [
              { id: 'S1', description: 'Primary evidence' },
              { id: 'S2', description: 'Corroborating evidence' },
            ],
          },
          bearingOn: ['H1', 'H2'],
        }],
      });
    });

    it('probe requires inquire phase', async () => {
      const result = await handler.delphiProbe(sessionId, {
        description: 'Check correlation data',
        targetDiscriminant: 'D1',
        targetSlot: 'S1',
        interpretationMap: { H1: 'r > 0.5', H2: 'r < 0.1' },
        probeType: 'observational',
        bound: '10 minutes',
        challengeProbe: {
          description: 'Check for confounders',
          type: 'observational',
        },
      });

      expect(result.probeId).toBe('P1');
      expect(result.challengePreCommitted).toBe(
        'Check for confounders',
      );
    });

    it('discriminating assess resets N to 0', async () => {
      await handler.delphiProbe(sessionId, {
        description: 'Check data',
        targetDiscriminant: 'D1',
        targetSlot: 'S1',
        interpretationMap: { H1: 'r > 0.5', H2: 'r < 0.1' },
        probeType: 'observational',
        bound: '10 min',
        challengeProbe: {
          description: 'challenge',
          type: 'observational',
        },
      });

      const result = await handler.delphiAssess(sessionId, {
        finding: 'r = 0.8',
        source: 'dataset A',
        sourceClass: 'primary',
        independenceClass: 'independent',
        admissible: true,
        contaminated: false,
        filledSlots: ['S1'],
        hypothesisEffects: { H1: 'supports', H2: 'weakens' },
        materialChange: true,
      });

      expect(result.N).toBe(0);
      expect(result.phase).toBe('inquire');
      expect(result.materialChange).toBe(true);
    });

    it('non-discriminating assess increments N and enters destabilize', async () => {
      await handler.delphiProbe(sessionId, {
        description: 'Check data',
        targetDiscriminant: 'D1',
        targetSlot: 'S1',
        interpretationMap: { H1: 'ambiguous', H2: 'ambiguous' },
        probeType: 'observational',
        bound: '10 min',
        challengeProbe: {
          description: 'challenge',
          type: 'observational',
        },
      });

      const result = await handler.delphiAssess(sessionId, {
        finding: 'inconclusive',
        source: 'dataset B',
        sourceClass: 'secondary',
        independenceClass: 'independent',
        admissible: true,
        contaminated: false,
        filledSlots: [],
        hypothesisEffects: { H1: 'neutral', H2: 'neutral' },
        materialChange: false,
      });

      expect(result.N).toBe(1);
      expect(result.phase).toBe('destabilize');
    });

    it('two non-discriminating probes force synthesize', async () => {
      // First probe + non-discriminating assess
      await handler.delphiProbe(sessionId, {
        description: 'Probe 1',
        targetDiscriminant: 'D1',
        targetSlot: 'S1',
        interpretationMap: { H1: 'x', H2: 'x' },
        probeType: 'observational',
        bound: '10 min',
        challengeProbe: {
          description: 'challenge 1',
          type: 'observational',
        },
      });

      await handler.delphiAssess(sessionId, {
        finding: 'nothing',
        source: 'source A',
        sourceClass: 'primary',
        independenceClass: 'independent',
        admissible: true,
        contaminated: false,
        filledSlots: [],
        hypothesisEffects: { H1: 'neutral', H2: 'neutral' },
        materialChange: false,
      });

      // Now in destabilize. Execute challenge — also non-discriminating.
      const destResult = await handler.delphiDestabilize(sessionId, {
        challengeResult: 'Challenge found nothing new',
        materialChange: false,
      });

      expect(destResult.N).toBe(2);
      expect(destResult.phase).toBe('synthesize');
    });

    it('rejects empty source (no unsupported synthesis)', async () => {
      await handler.delphiProbe(sessionId, {
        description: 'Probe',
        targetDiscriminant: 'D1',
        targetSlot: 'S1',
        interpretationMap: { H1: 'x', H2: 'x' },
        probeType: 'observational',
        bound: '10 min',
        challengeProbe: {
          description: 'challenge',
          type: 'observational',
        },
      });

      await expect(
        handler.delphiAssess(sessionId, {
          finding: 'made up',
          source: '',
          sourceClass: 'primary',
          independenceClass: 'independent',
          admissible: true,
          contaminated: false,
          filledSlots: [],
          hypothesisEffects: { H1: 'supports' },
          materialChange: true,
        }),
      ).rejects.toThrow('Evidence source cannot be empty');
    });
  });

  describe('witness + complete', () => {
    let sessionId: string;

    beforeEach(async () => {
      const result = await handler.delphiInit({
        question: 'Does X cause Y?',
        resolutionClass: 'decisive',
      });
      sessionId = result.session_id as string;
      await handler.delphiHypothesize(sessionId, {
        hypotheses: [
          {
            statement: 'X causes Y',
            supportPattern: 'correlation',
            falsificationCriteria: 'no correlation',
          },
          {
            statement: 'Null: no relationship',
            supportPattern: 'no evidence',
            falsificationCriteria: 'evidence found',
          },
        ],
      });
      await handler.delphiDiscriminate(sessionId, {
        discriminants: [{
          id: 'D1',
          essential: true,
          closureRule: {
            slots: [{ id: 'S1', description: 'evidence' }],
          },
          bearingOn: ['H1', 'H2'],
        }],
      });
    });

    it('supported_thesis requires witness', async () => {
      await expect(
        handler.delphiComplete(sessionId, {
          terminalState: 'supported_thesis',
          summary: 'X causes Y',
          report: {
            question: 'Does X cause Y?',
            hypotheses: [],
            discriminants: [],
            evidenceCount: 0,
            probeCount: 0,
            nCounterHistory: [],
          },
        }),
      ).rejects.toThrow('requires Iron Witness invocation');
    });

    it('supported_thesis requires single live hypothesis', async () => {
      await handler.delphiWitness(sessionId, {
        witnessType: 'adversarial',
        challenge: 'Is the evidence sufficient?',
        response: 'Yes, based on admissible evidence.',
      });

      await expect(
        handler.delphiComplete(sessionId, {
          terminalState: 'supported_thesis',
          summary: 'X causes Y',
          report: {
            question: 'Does X cause Y?',
            hypotheses: [
              { id: 'H1', statement: 'X causes Y', status: 'live', evidenceChain: [] },
              { id: 'H2', statement: 'Null', status: 'live', evidenceChain: [] },
            ],
            discriminants: [],
            evidenceCount: 0,
            probeCount: 0,
            nCounterHistory: [],
          },
        }),
      ).rejects.toThrow('requires exactly one live hypothesis');
    });

    it('allows refined_question without witness', async () => {
      const result = await handler.delphiComplete(sessionId, {
        terminalState: 'refined_question',
        summary: 'Question was inadequate, needs refinement',
        report: {
          question: 'Does X cause Y?',
          hypotheses: [],
          discriminants: [],
          evidenceCount: 0,
          probeCount: 0,
          nCounterHistory: [],
        },
      });

      expect(result.status).toBe('refined_question');
    });

    it('irreducible_uncertainty requires witness', async () => {
      await expect(
        handler.delphiComplete(sessionId, {
          terminalState: 'irreducible_uncertainty',
          summary: 'Cannot discriminate',
          report: {
            question: 'Does X cause Y?',
            hypotheses: [],
            discriminants: [],
            evidenceCount: 0,
            probeCount: 0,
            nCounterHistory: [],
          },
        }),
      ).rejects.toThrow('requires Iron Witness invocation');
    });
  });

  describe('status', () => {
    it('returns inactive when no session', async () => {
      const result = await handler.delphiStatus();
      expect(result.active).toBe(false);
      expect(result.protocol).toBe('delphi');
    });

    it('returns full state when session exists', async () => {
      const init = await handler.delphiInit({
        question: 'Test question',
        resolutionClass: 'evaluative',
      });

      const result = await handler.delphiStatus();
      expect(result.active).toBe(true);
      expect(result.session_id).toBe(init.session_id);
      expect(result.phase).toBe('pre_frame');
      expect(result.N).toBe(0);
      expect(result.question).toBe('Test question');
    });
  });

  describe('destabilize flow', () => {
    let sessionId: string;

    beforeEach(async () => {
      const result = await handler.delphiInit({
        question: 'Test',
        resolutionClass: 'decisive',
      });
      sessionId = result.session_id as string;
      await handler.delphiHypothesize(sessionId, {
        hypotheses: [
          {
            statement: 'A',
            supportPattern: 'p',
            falsificationCriteria: 'f',
          },
          {
            statement: 'B',
            supportPattern: 'p',
            falsificationCriteria: 'f',
          },
        ],
      });
      await handler.delphiDiscriminate(sessionId, {
        discriminants: [{
          id: 'D1',
          essential: true,
          closureRule: {
            slots: [{ id: 'S1', description: 'slot' }],
          },
          bearingOn: ['H1', 'H2'],
        }],
      });
    });

    it('successful challenge resets N and returns to inquire', async () => {
      await handler.delphiProbe(sessionId, {
        description: 'probe',
        targetDiscriminant: 'D1',
        targetSlot: 'S1',
        interpretationMap: { H1: 'x', H2: 'x' },
        probeType: 'observational',
        bound: '5 min',
        challengeProbe: {
          description: 'challenge',
          type: 'observational',
        },
      });

      await handler.delphiAssess(sessionId, {
        finding: 'nothing',
        source: 'src',
        sourceClass: 'primary',
        independenceClass: 'independent',
        admissible: true,
        contaminated: false,
        filledSlots: [],
        hypothesisEffects: { H1: 'neutral', H2: 'neutral' },
        materialChange: false,
      });

      // Challenge succeeds — material change
      const result = await handler.delphiDestabilize(sessionId, {
        challengeResult: 'Found new angle',
        materialChange: true,
      });

      expect(result.N).toBe(0);
      expect(result.phase).toBe('inquire');
    });

    it('rejects destabilize when not in destabilize phase', async () => {
      await expect(
        handler.delphiDestabilize(sessionId, {
          challengeResult: 'test',
          materialChange: true,
        }),
      ).rejects.toThrow('Cannot destabilize in phase');
    });
  });
});
