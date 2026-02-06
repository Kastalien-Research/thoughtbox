/**
 * Tests for claim parser (M4)
 */
import { describe, it, expect } from 'vitest';
import { parseClaims, normalizeClaim } from '../claim-parser.js';

describe('claim-parser', () => {
  it('T-MA-CLP-1: extracts single CLAIM from thought text', () => {
    const text = 'CLAIM: API latency caused by db regression';
    const result = parseClaims(text);

    expect(result.claims).toHaveLength(1);
    expect(result.claims[0].type).toBe('claim');
    expect(result.claims[0].content).toBe('API latency caused by db regression');
    expect(result.claims[0].negated).toBe(false);
  });

  it('T-MA-CLP-2: extracts multiple CLAIMs from multi-line thought', () => {
    const text = `S1|H|—|Investigation results
CLAIM: API latency caused by db regression
CLAIM: Cache invalidation is secondary factor`;
    const result = parseClaims(text);

    expect(result.claims).toHaveLength(2);
    expect(result.claims[0].content).toBe('API latency caused by db regression');
    expect(result.claims[1].content).toBe('Cache invalidation is secondary factor');
  });

  it('T-MA-CLP-3: extracts PREMISE with reference to CLAIM', () => {
    const text = 'PREMISE: [S2] query p99 ↑3x supports claim';
    const result = parseClaims(text);

    expect(result.claims).toHaveLength(1);
    expect(result.claims[0].type).toBe('premise');
    expect(result.claims[0].references).toEqual(['[S2]']);
  });

  it('T-MA-CLP-4: extracts REFUTE with negation', () => {
    const text = 'REFUTE: ¬(API latency caused by db regression)';
    const result = parseClaims(text);

    expect(result.claims).toHaveLength(1);
    expect(result.claims[0].type).toBe('refute');
    expect(result.claims[0].negated).toBe(true);
  });

  it('T-MA-CLP-5: parses P₁, P₂ ⊢ C turnstile notation into structured derivation', () => {
    const text = 'P₁, P₂ ⊢ C';
    const result = parseClaims(text);

    expect(result.derivations).toHaveLength(1);
    expect(result.derivations[0].premises).toEqual(['P₁', 'P₂']);
    expect(result.derivations[0].conclusion).toBe('C');
  });

  it('T-MA-CLP-6: parses ¬X negation in claims', () => {
    const text = 'CLAIM: ¬X → system stable';
    const result = parseClaims(text);

    expect(result.claims).toHaveLength(1);
    expect(result.claims[0].negated).toBe(true);
    expect(result.claims[0].content).toContain('¬X');
  });

  it('T-MA-CLP-7: returns empty array for text with no claims', () => {
    const text = 'Just a regular thought with no claims or derivations.';
    const result = parseClaims(text);

    expect(result.claims).toHaveLength(0);
    expect(result.derivations).toHaveLength(0);
  });

  it('T-MA-CLP-8: handles CLAIM with cipher abbreviations (bc, tf)', () => {
    const text = 'CLAIM: latency ↑ bc db regression tf perf degraded';
    const result = parseClaims(text);

    expect(result.claims).toHaveLength(1);
    expect(result.claims[0].content).toContain('bc');
    expect(result.claims[0].content).toContain('tf');
  });

  it('T-MA-CLP-9: extracts all claims from a realistic multi-step cipher thought', () => {
    const text = `S47|H|S45|API latency ↑ bc db regression
CLAIM: db query p99 regressed after deploy
PREMISE: [S45] metrics show 3x latency increase
PREMISE: [S46] deploy log confirms schema change
REFUTE: ¬(cache invalidation caused latency)
P₁, P₂ ⊢ db query regression is root cause`;

    const result = parseClaims(text);

    expect(result.claims).toHaveLength(4);
    expect(result.claims[0].type).toBe('claim');
    expect(result.claims[1].type).toBe('premise');
    expect(result.claims[2].type).toBe('premise');
    expect(result.claims[3].type).toBe('refute');
    expect(result.claims[3].negated).toBe(true);

    expect(result.derivations).toHaveLength(1);
    expect(result.derivations[0].premises).toEqual(['P₁', 'P₂']);
    expect(result.derivations[0].conclusion).toContain('root cause');
  });
});
