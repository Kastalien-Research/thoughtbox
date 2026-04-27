/**
 * TS-FIXTURE validators for Spec 08 — Per-Session-Type Audit
 *
 * Validates:
 * - V8.1: Closed SessionType union — typo rejected
 *
 * @see .specs/cognitive-harness-improvements/08-per-session-type-audit.md
 * @see .specs/cognitive-harness-improvements/VALIDATORS.md §V8.1
 */

import { expectType } from 'tsd';

// =============================================================================
// V8.1 — Closed SessionType union — typo rejected
// =============================================================================

/**
 * V8.1: SessionType is a closed union type.
 * Valid values: "research" | "decision" | "implementation" | "debugging" | "exploration"
 *
 * Invalid literals like typos should produce type errors.
 */
type SessionType = 'research' | 'decision' | 'implementation' | 'debugging' | 'exploration';

// V8.1: Invalid literals (typos) should be type errors
function v8_1_typo_rejection() {
  // @ts-expect-error — typo 'reseach' should be rejected
  const typo1: SessionType = 'reseach';

  // @ts-expect-error — typo 'deicsion' should be rejected
  const typo2: SessionType = 'deicsion';

  // @ts-expect-error — typo 'implemenation' should be rejected
  const typo3: SessionType = 'implemenation';

  // @ts-expect-error — typo 'debuging' should be rejected
  const typo4: SessionType = 'debuging';

  // @ts-expect-error — typo 'exploraton' should be rejected
  const typo5: SessionType = 'exploraton';

  // @ts-expect-error — 'all' is not a valid SessionType
  const notType1: SessionType = 'all';

  // @ts-expect-error — empty string is not valid
  const notType2: SessionType = '';

  // @ts-expect-error — 'researching' is not valid (extra suffix)
  const notType3: SessionType = 'researching';
}

// V8.1: All valid literals should compile
function v8_1_valid_literals() {
  const research: SessionType = 'research';
  const decision: SessionType = 'decision';
  const implementation: SessionType = 'implementation';
  const debugging: SessionType = 'debugging';
  const exploration: SessionType = 'exploration';

  expectType<'research'>(research);
  expectType<'decision'>(decision);
  expectType<'implementation'>(implementation);
  expectType<'debugging'>(debugging);
  expectType<'exploration'>(exploration);
}

// V8.1: SessionType should be usable in type positions
function v8_1_type_usage() {
  interface Session {
    id: string;
    title: string;
    sessionType: SessionType;
  }

  // Valid session creation
  const session: Session = {
    id: '1',
    title: 'Test Session',
    sessionType: 'research'
  };
  expectType<SessionType>(session.sessionType);

  // Invalid session type in object literal
  // @ts-expect-error — 'unknown' is not a valid SessionType
  const invalidSession: Session = {
    id: '2',
    title: 'Invalid Session',
    sessionType: 'unknown'
  };
}

// V8.1: SessionType should be usable in function parameters
function v8_1_function_params() {
  function createSession(title: string, type: SessionType): SessionType {
    return type;
  }

  // Valid calls
  expectType<SessionType>(createSession('My Research', 'research'));
  expectType<SessionType>(createSession('My Decision', 'decision'));

  // @ts-expect-error — 'test' is not a valid SessionType
  expectType<SessionType>(createSession('My Test', 'test'));
}

// V8.1: Exhaustive checking with narrowing
function v8_1_exhaustive_check(type: SessionType) {
  switch (type) {
    case 'research':
      expectType<'research'>(type);
      break;
    case 'decision':
      expectType<'decision'>(type);
      break;
    case 'implementation':
      expectType<'implementation'>(type);
      break;
    case 'debugging':
      expectType<'debugging'>(type);
      break;
    case 'exploration':
      expectType<'exploration'>(type);
      break;
    default:
      // Should be never in exhaustive switch
      const _exhaustive: never = type;
  }
}
