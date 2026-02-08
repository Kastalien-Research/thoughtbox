/**
 * Thought Priming Tests — SPEC-HUB-002 Module 5
 *
 * Tests the profile-primer module that generates resource content blocks
 * for injecting profile-specific mental models into thought responses.
 */

import { describe, it, expect } from 'vitest';
import { getProfilePriming } from '../profile-primer.js';

describe('thought-priming', () => {
  // T-TP-1: getProfilePriming returns resource block for COORDINATOR
  it('getProfilePriming returns resource block for COORDINATOR', () => {
    const result = getProfilePriming('COORDINATOR');

    expect(result).not.toBeNull();
    expect(result!.type).toBe('resource');
    expect(result!.resource.uri).toContain('COORDINATOR');
    expect(result!.resource.mimeType).toBe('text/markdown');
    expect(result!.resource.text).toContain('COORDINATOR');
    expect(result!.resource.text).toContain('Decomposition');
  });

  // T-TP-2: getProfilePriming returns null for undefined profile
  it('getProfilePriming returns null for undefined profile', () => {
    const result = getProfilePriming(undefined);
    expect(result).toBeNull();
  });

  // T-TP-3: getProfilePriming returns null for unknown profile
  it('getProfilePriming returns null for unknown profile', () => {
    const result = getProfilePriming('NONEXISTENT');
    expect(result).toBeNull();
  });

  // T-TP-4: Resource URI matches thoughtbox://profile-priming/{name}
  it('resource URI matches thoughtbox://profile-priming/{name}', () => {
    const result = getProfilePriming('DEBUGGER');

    expect(result).not.toBeNull();
    expect(result!.resource.uri).toBe('thoughtbox://profile-priming/DEBUGGER');
  });

  // T-TP-5: Resource text references all profile mental models
  it('resource text references all profile mental models', () => {
    const result = getProfilePriming('DEBUGGER');

    expect(result).not.toBeNull();
    // DEBUGGER has: five-whys, rubber-duck, assumption-surfacing
    expect(result!.resource.text).toContain('Five Whys');
    expect(result!.resource.text).toContain('Rubber Duck');
    expect(result!.resource.text).toContain('Assumption Surfacing');
  });

  // T-TP-6: Thought response includes profile resource for profiled agent
  it('resource block has correct structure for profiled agent', () => {
    const result = getProfilePriming('SECURITY');

    expect(result).not.toBeNull();
    expect(result!.type).toBe('resource');
    expect(result!.resource).toHaveProperty('uri');
    expect(result!.resource).toHaveProperty('mimeType');
    expect(result!.resource).toHaveProperty('text');
    expect(result!.resource.annotations).toEqual({
      audience: ['assistant'],
      priority: 0.8,
    });
  });

  // T-TP-7: Thought response excludes profile resource for unprofiled agent
  it('returns null for unprofiled agent (no resource appended)', () => {
    // Unprofiled agent has no profile string → undefined
    const result = getProfilePriming(undefined);
    expect(result).toBeNull();

    // Also null for empty string
    const result2 = getProfilePriming('');
    expect(result2).toBeNull();
  });
});
