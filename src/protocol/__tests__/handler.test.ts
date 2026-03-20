/**
 * ADR-015: Protocol MCP Tools — Schema and tool boundary tests.
 *
 * Covers:
 * - H4: Schema parsing for all 12 operations (valid + invalid)
 * - H6: Tool descriptions contain no phantom references
 * - Handler method signatures (basic structural verification)
 */

import { describe, it, expect } from 'vitest';
import {
  theseusToolInputSchema,
  THESEUS_TOOL,
  TheseusTool,
  ulyssesToolInputSchema,
  ULYSSES_TOOL,
  UlyssesTool,
  ProtocolHandler,
} from '../index.js';

// ---------------------------------------------------------------------------
// H4: Theseus schema parsing — 6 operations
// ---------------------------------------------------------------------------

describe('Theseus schema parsing (H4)', () => {
  it('parses init with scope', () => {
    const result = theseusToolInputSchema.parse({
      operation: 'init',
      scope: ['src/auth.ts', 'src/auth/'],
    });
    expect(result.operation).toBe('init');
    expect(result.scope).toEqual(['src/auth.ts', 'src/auth/']);
  });

  it('parses init with optional description', () => {
    const result = theseusToolInputSchema.parse({
      operation: 'init',
      scope: ['src/'],
      description: 'Refactor auth module',
    });
    expect(result.description).toBe('Refactor auth module');
  });

  it('accepts init without scope (handler validates at runtime)', () => {
    const result = theseusToolInputSchema.parse({ operation: 'init' });
    expect(result.operation).toBe('init');
    expect(result.scope).toBeUndefined();
  });

  it('parses visa with all fields', () => {
    const result = theseusToolInputSchema.parse({
      operation: 'visa',
      filePath: 'src/other.ts',
      justification: 'Compiler dependency',
      antiPatternAcknowledged: true,
    });
    expect(result.operation).toBe('visa');
    expect(result.filePath).toBe('src/other.ts');
  });

  it('antiPatternAcknowledged is optional (handler defaults at runtime)', () => {
    const result = theseusToolInputSchema.parse({
      operation: 'visa',
      filePath: 'src/other.ts',
      justification: 'Compiler dependency',
    });
    expect(result.antiPatternAcknowledged).toBeUndefined();
  });

  it('accepts visa without filePath (handler validates at runtime)', () => {
    const result = theseusToolInputSchema.parse({
      operation: 'visa',
      justification: 'reason',
    });
    expect(result.operation).toBe('visa');
  });

  it('parses checkpoint with required fields', () => {
    const result = theseusToolInputSchema.parse({
      operation: 'checkpoint',
      diffHash: 'abc123',
      commitMessage: 'Extract auth handler',
      approved: true,
    });
    expect(result.operation).toBe('checkpoint');
    expect(result.diffHash).toBe('abc123');
    expect(result.approved).toBe(true);
  });

  it('parses checkpoint with optional feedback', () => {
    const result = theseusToolInputSchema.parse({
      operation: 'checkpoint',
      diffHash: 'abc123',
      commitMessage: 'Extract auth handler',
      approved: false,
      feedback: 'Diff too large',
    });
    expect(result.feedback).toBe('Diff too large');
  });

  it('accepts checkpoint without approved (handler validates at runtime)', () => {
    const result = theseusToolInputSchema.parse({
      operation: 'checkpoint',
      diffHash: 'abc',
      commitMessage: 'msg',
    });
    expect(result.approved).toBeUndefined();
  });

  it('parses outcome with testsPassed', () => {
    const result = theseusToolInputSchema.parse({
      operation: 'outcome',
      testsPassed: true,
    });
    expect(result.operation).toBe('outcome');
    expect(result.testsPassed).toBe(true);
  });

  it('parses outcome with optional details', () => {
    const result = theseusToolInputSchema.parse({
      operation: 'outcome',
      testsPassed: false,
      details: '3 tests failed in auth.test.ts',
    });
    expect(result.details).toBe('3 tests failed in auth.test.ts');
  });

  it('parses status (no extra fields)', () => {
    const result = theseusToolInputSchema.parse({
      operation: 'status',
    });
    expect(result.operation).toBe('status');
  });

  it('parses complete with terminalState', () => {
    const result = theseusToolInputSchema.parse({
      operation: 'complete',
      terminalState: 'complete',
    });
    expect(result.terminalState).toBe('complete');
  });

  it('parses complete with all terminal states', () => {
    for (const state of ['complete', 'audit_failure', 'scope_exhaustion']) {
      const result = theseusToolInputSchema.parse({
        operation: 'complete',
        terminalState: state,
      });
      expect(result.terminalState).toBe(state);
    }
  });

  it('rejects complete with invalid terminal state', () => {
    expect(() =>
      theseusToolInputSchema.parse({
        operation: 'complete',
        terminalState: 'resolved',
      }),
    ).toThrow();
  });

  it('rejects unknown operation', () => {
    expect(() =>
      theseusToolInputSchema.parse({ operation: 'unknown' }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// H4: Ulysses schema parsing — 6 operations
// ---------------------------------------------------------------------------

describe('Ulysses schema parsing (H4)', () => {
  it('parses init with problem', () => {
    const result = ulyssesToolInputSchema.parse({
      operation: 'init',
      problem: 'Auth fails on refresh',
    });
    expect(result.operation).toBe('init');
    expect(result.problem).toBe('Auth fails on refresh');
  });

  it('parses init with optional constraints', () => {
    const result = ulyssesToolInputSchema.parse({
      operation: 'init',
      problem: 'Auth fails',
      constraints: ['Cannot restart server', 'No DB access'],
    });
    expect(result.constraints).toEqual([
      'Cannot restart server',
      'No DB access',
    ]);
  });

  it('accepts init without problem (handler validates at runtime)', () => {
    const result = ulyssesToolInputSchema.parse({ operation: 'init' });
    expect(result.operation).toBe('init');
    expect(result.problem).toBeUndefined();
  });

  it('parses plan with required fields', () => {
    const result = ulyssesToolInputSchema.parse({
      operation: 'plan',
      primary: 'Check auth token expiry',
      recovery: 'Revert to last known good config',
    });
    expect(result.primary).toBe('Check auth token expiry');
    expect(result.recovery).toBe('Revert to last known good config');
  });

  it('irreversible is optional (handler defaults at runtime)', () => {
    const result = ulyssesToolInputSchema.parse({
      operation: 'plan',
      primary: 'action',
      recovery: 'recovery',
    });
    expect(result.irreversible).toBeUndefined();
  });

  it('parses plan with irreversible true', () => {
    const result = ulyssesToolInputSchema.parse({
      operation: 'plan',
      primary: 'Drop table',
      recovery: 'Restore from backup',
      irreversible: true,
    });
    expect(result.irreversible).toBe(true);
  });

  it('parses outcome with expected assessment', () => {
    const result = ulyssesToolInputSchema.parse({
      operation: 'outcome',
      assessment: 'expected',
    });
    expect(result.assessment).toBe('expected');
  });

  it('parses outcome with unexpected assessment and severity', () => {
    const result = ulyssesToolInputSchema.parse({
      operation: 'outcome',
      assessment: 'unexpected-unfavorable',
      severity: 2,
      details: 'Server crashed',
    });
    expect(result.assessment).toBe('unexpected-unfavorable');
    expect(result.severity).toBe(2);
    expect(result.details).toBe('Server crashed');
  });

  it('rejects severity outside 1-2 range', () => {
    expect(() =>
      ulyssesToolInputSchema.parse({
        operation: 'outcome',
        assessment: 'unexpected-favorable',
        severity: 3,
      }),
    ).toThrow();
  });

  it('rejects invalid assessment value', () => {
    expect(() =>
      ulyssesToolInputSchema.parse({
        operation: 'outcome',
        assessment: 'good',
      }),
    ).toThrow();
  });

  it('parses reflect with hypothesis and falsification', () => {
    const result = ulyssesToolInputSchema.parse({
      operation: 'reflect',
      hypothesis: 'Token refresh race condition',
      falsification: 'Adding a mutex eliminates the 401 errors',
    });
    expect(result.hypothesis).toBe('Token refresh race condition');
    expect(result.falsification).toBe(
      'Adding a mutex eliminates the 401 errors',
    );
  });

  it('accepts reflect without falsification (handler validates at runtime)', () => {
    const result = ulyssesToolInputSchema.parse({
      operation: 'reflect',
      hypothesis: 'test',
    });
    expect(result.falsification).toBeUndefined();
  });

  it('parses status (no extra fields)', () => {
    const result = ulyssesToolInputSchema.parse({
      operation: 'status',
    });
    expect(result.operation).toBe('status');
  });

  it('parses complete with all terminal states', () => {
    for (const state of [
      'resolved',
      'insufficient_information',
      'environment_compromised',
    ]) {
      const result = ulyssesToolInputSchema.parse({
        operation: 'complete',
        terminalState: state,
      });
      expect(result.terminalState).toBe(state);
    }
  });

  it('rejects complete with Theseus terminal state', () => {
    expect(() =>
      ulyssesToolInputSchema.parse({
        operation: 'complete',
        terminalState: 'audit_failure',
      }),
    ).toThrow();
  });

  it('rejects unknown operation', () => {
    expect(() =>
      ulyssesToolInputSchema.parse({ operation: 'checkpoint' }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// H6: Tool descriptions have no phantom references
// ---------------------------------------------------------------------------

describe('Tool descriptions (H6)', () => {
  const phantomPatterns = [
    /\.theseus\//,
    /\.ulysses\//,
    /theseus\.sh/,
    /ulysses\.sh/,
    /shell script/i,
    /bash/i,
  ];

  it('THESEUS_TOOL.description contains no phantom references', () => {
    for (const pattern of phantomPatterns) {
      expect(THESEUS_TOOL.description).not.toMatch(pattern);
    }
  });

  it('ULYSSES_TOOL.description contains no phantom references', () => {
    for (const pattern of phantomPatterns) {
      expect(ULYSSES_TOOL.description).not.toMatch(pattern);
    }
  });

  it('THESEUS_TOOL has correct name', () => {
    expect(THESEUS_TOOL.name).toBe('thoughtbox_theseus');
  });

  it('ULYSSES_TOOL has correct name', () => {
    expect(ULYSSES_TOOL.name).toBe('thoughtbox_ulysses');
  });

  it('both tools have correct annotations', () => {
    for (const tool of [THESEUS_TOOL, ULYSSES_TOOL]) {
      expect(tool.annotations).toEqual({
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Handler and tool class structural checks
// ---------------------------------------------------------------------------

describe('ProtocolHandler structure', () => {
  it('has setProject method', () => {
    expect(typeof ProtocolHandler.prototype.setProject).toBe('function');
  });

  it('has all theseus methods', () => {
    const methods = [
      'theseusInit',
      'theseusVisa',
      'theseusCheckpoint',
      'theseusOutcome',
      'theseusStatus',
      'theseusComplete',
    ];
    for (const method of methods) {
      expect(typeof (ProtocolHandler.prototype as any)[method]).toBe(
        'function',
      );
    }
  });

  it('has all ulysses methods', () => {
    const methods = [
      'ulyssesInit',
      'ulyssesPlan',
      'ulyssesOutcome',
      'ulyssesReflect',
      'ulyssesStatus',
      'ulyssesComplete',
    ];
    for (const method of methods) {
      expect(typeof (ProtocolHandler.prototype as any)[method]).toBe(
        'function',
      );
    }
  });

  it('has checkEnforcement method', () => {
    expect(typeof ProtocolHandler.prototype.checkEnforcement).toBe(
      'function',
    );
  });
});

describe('TheseusTool structure', () => {
  it('has handle method', () => {
    expect(typeof TheseusTool.prototype.handle).toBe('function');
  });
});

describe('UlyssesTool structure', () => {
  it('has handle method', () => {
    expect(typeof UlyssesTool.prototype.handle).toBe('function');
  });
});
