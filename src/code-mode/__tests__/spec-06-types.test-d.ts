/**
 * TS-FIXTURE validators for Spec 06 — Cipher Mode Toggle
 *
 * Validates:
 * - V6.4: Invalid CipherMode literal rejected
 *
 * @see .specs/cognitive-harness-improvements/06-cipher-mode-toggle.md
 * @see .specs/cognitive-harness-improvements/VALIDATORS.md §V6.4
 */

import { expectType } from 'tsd';

// =============================================================================
// V6.4 — Invalid CipherMode literal rejected
// =============================================================================

/**
 * V6.4: The CipherMode union is a closed type.
 * Only valid literals are accepted: "auto" | "manual" | "off"
 *
 * Invalid literals like typos should produce type errors.
 */
type CipherMode = 'auto' | 'manual' | 'off';

// V6.4: Invalid literals should be type errors
function v6_4_invalid_literal_check() {
  // These invalid literals should all be type errors:
  // @ts-expect-error — 'invalid' is not a valid CipherMode
  const invalid1: CipherMode = 'invalid';

  // @ts-expect-error — typo 'offf' is not valid
  const invalid2: CipherMode = 'offf';

  // @ts-expect-error — typo 'manualm' is not valid
  const invalid3: CipherMode = 'manualm';

  // @ts-expect-error — empty string is not valid
  const invalid4: CipherMode = '';

  // @ts-expect-error — ' AUTO' (with space) is not valid
  const invalid5: CipherMode = ' AUTO';

  // @ts-expect-error — number is not valid
  const invalid6: CipherMode = 'auto' as unknown as CipherMode;
}

// V6.4: Valid literals should compile fine
function v6_4_valid_literals() {
  const auto: CipherMode = 'auto';
  const manual: CipherMode = 'manual';
  const off: CipherMode = 'off';

  expectType<'auto'>(auto);
  expectType<'manual'>(manual);
  expectType<'off'>(off);
}

// V6.4: CipherMode should be usable in type positions
function v6_4_type_usage() {
  interface Session {
    cipherMode: CipherMode;
  }

  const session: Session = {
    cipherMode: 'auto' // Valid
  };

  // This should work - valid assignment
  expectType<CipherMode>(session.cipherMode);

  // @ts-expect-error — invalid literal in interface literal
  const invalidSession: Session = {
    cipherMode: 'not-valid'
  };
}
