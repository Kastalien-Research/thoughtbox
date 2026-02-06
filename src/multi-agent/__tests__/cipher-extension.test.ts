/**
 * Tests for cipher logic extension (M3)
 */
import { describe, it, expect } from 'vitest';
import { CIPHER_LOGIC_EXTENSION, getExtendedCipher, LOGIC_NOTATION } from '../cipher-extension.js';
import { THOUGHTBOX_CIPHER } from '../../resources/thoughtbox-cipher-content.js';

describe('cipher-logic-extension', () => {
  it('T-MA-CIP-1: extended cipher includes ⊢ (turnstile) with definition', () => {
    expect(CIPHER_LOGIC_EXTENSION).toContain('⊢');
    expect(CIPHER_LOGIC_EXTENSION).toContain('turnstile');
    expect(LOGIC_NOTATION.turnstile.symbol).toBe('⊢');
    expect(LOGIC_NOTATION.turnstile.meaning).toContain('proves');
  });

  it('T-MA-CIP-2: extended cipher includes ⊨ (semantic entailment)', () => {
    expect(CIPHER_LOGIC_EXTENSION).toContain('⊨');
    expect(CIPHER_LOGIC_EXTENSION).toContain('semantic entailment');
    expect(LOGIC_NOTATION.entailment.symbol).toBe('⊨');
  });

  it('T-MA-CIP-3: extended cipher includes CLAIM: prefix syntax', () => {
    expect(CIPHER_LOGIC_EXTENSION).toContain('CLAIM:');
    expect(LOGIC_NOTATION.claim.prefix).toBe('CLAIM:');
  });

  it('T-MA-CIP-4: extended cipher includes PREMISE: and REFUTE: prefixes', () => {
    expect(CIPHER_LOGIC_EXTENSION).toContain('PREMISE:');
    expect(CIPHER_LOGIC_EXTENSION).toContain('REFUTE:');
    expect(LOGIC_NOTATION.premise.prefix).toBe('PREMISE:');
    expect(LOGIC_NOTATION.refute.prefix).toBe('REFUTE:');
  });

  it('T-MA-CIP-5: all existing notation preserved (H/E/C/Q/R/P/O/A/X markers)', () => {
    const combined = getExtendedCipher(THOUGHTBOX_CIPHER);

    // Verify existing markers are preserved in the base cipher
    const existingMarkers = ['H', 'E', 'C', 'Q', 'R', 'P', 'O', 'A', 'X'];
    for (const marker of existingMarkers) {
      expect(combined).toContain(`| \`${marker}\` |`);
    }

    // Verify existing logic operators are preserved
    expect(combined).toContain('→');
    expect(combined).toContain('∧');
    expect(combined).toContain('∨');
    expect(combined).toContain('¬');
    expect(combined).toContain('∀');
    expect(combined).toContain('∃');
    expect(combined).toContain('⊕');
    expect(combined).toContain('⊖');

    // Verify new symbols are also present
    expect(combined).toContain('⊢');
    expect(combined).toContain('⊨');
  });
});
