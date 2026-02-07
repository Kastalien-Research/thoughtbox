/**
 * Profiles Registry Tests — SPEC-HUB-002 Module 2
 *
 * Tests the static profile registry: definitions, validation, listing,
 * prompt content generation, and mental model cross-check.
 */

import { describe, it, expect } from 'vitest';
import {
  getProfile,
  isValidProfile,
  listProfiles,
  getProfilePromptContent,
} from '../profiles-registry.js';
import { getModelNames } from '../../mental-models/operations.js';

describe('profiles-registry', () => {
  // T-PR2-1: getProfile returns MANAGER definition
  it('getProfile returns MANAGER definition', () => {
    const profile = getProfile('MANAGER');
    expect(profile).not.toBeNull();
    expect(profile!.name).toBe('MANAGER');
    expect(profile!.mentalModels).toContain('decomposition');
    expect(profile!.mentalModels).toContain('pre-mortem');
    expect(profile!.mentalModels).toContain('five-whys');
    expect(profile!.primaryGoal).toBeDefined();
  });

  // T-PR2-2: getProfile returns ARCHITECT definition
  it('getProfile returns ARCHITECT definition', () => {
    const profile = getProfile('ARCHITECT');
    expect(profile).not.toBeNull();
    expect(profile!.name).toBe('ARCHITECT');
    expect(profile!.mentalModels).toContain('decomposition');
    expect(profile!.mentalModels).toContain('trade-off-matrix');
    expect(profile!.mentalModels).toContain('abstraction-laddering');
  });

  // T-PR2-3: getProfile returns DEBUGGER definition
  it('getProfile returns DEBUGGER definition', () => {
    const profile = getProfile('DEBUGGER');
    expect(profile).not.toBeNull();
    expect(profile!.name).toBe('DEBUGGER');
    expect(profile!.mentalModels).toContain('five-whys');
    expect(profile!.mentalModels).toContain('rubber-duck');
    expect(profile!.mentalModels).toContain('assumption-surfacing');
  });

  // T-PR2-4: getProfile returns SECURITY definition
  it('getProfile returns SECURITY definition', () => {
    const profile = getProfile('SECURITY');
    expect(profile).not.toBeNull();
    expect(profile!.name).toBe('SECURITY');
    expect(profile!.mentalModels).toContain('adversarial-thinking');
    expect(profile!.mentalModels).toContain('pre-mortem');
  });

  // T-PR2-5: getProfile returns null for unknown profile
  it('getProfile returns null for unknown profile', () => {
    const profile = getProfile('NONEXISTENT');
    expect(profile).toBeNull();
  });

  // T-PR2-6: isValidProfile validates known/unknown profiles
  it('isValidProfile validates known and unknown profiles', () => {
    expect(isValidProfile('MANAGER')).toBe(true);
    expect(isValidProfile('ARCHITECT')).toBe(true);
    expect(isValidProfile('DEBUGGER')).toBe(true);
    expect(isValidProfile('SECURITY')).toBe(true);
    expect(isValidProfile('NONEXISTENT')).toBe(false);
    expect(isValidProfile('')).toBe(false);
  });

  // T-PR2-7: listProfiles returns all 4 profiles
  it('listProfiles returns all 4 profiles', () => {
    const profiles = listProfiles();
    expect(profiles).toHaveLength(4);
    const names = profiles.map(p => p.name);
    expect(names).toContain('MANAGER');
    expect(names).toContain('ARCHITECT');
    expect(names).toContain('DEBUGGER');
    expect(names).toContain('SECURITY');
  });

  // T-PR2-8: All profile mental models reference valid model names
  it('all profile mental models reference valid model names', () => {
    const validModelNames = getModelNames();
    const profiles = listProfiles();

    for (const profile of profiles) {
      for (const modelName of profile.mentalModels) {
        expect(
          validModelNames,
          `Profile ${profile.name} references unknown model '${modelName}'`
        ).toContain(modelName);
      }
    }
  });
});
