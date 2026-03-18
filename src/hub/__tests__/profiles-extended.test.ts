/**
 * Tests for RESEARCHER and REVIEWER profile additions
 */

import { describe, it, expect } from 'vitest';
import { getProfile, isValidProfile, listProfiles, getProfilePromptContent } from '../profiles-registry.js';

describe('Extended Profiles', () => {
  describe('RESEARCHER profile', () => {
    it('is a valid profile name', () => {
      expect(isValidProfile('RESEARCHER')).toBe(true);
    });

    it('has correct mental models', () => {
      const profile = getProfile('RESEARCHER');
      expect(profile).not.toBeNull();
      expect(profile!.mentalModels).toEqual(['inversion', 'constraint-relaxation', 'fermi-estimation']);
    });

    it('generates prompt content', () => {
      const content = getProfilePromptContent('RESEARCHER');
      expect(content).not.toBeNull();
      expect(content!.prompt).toContain('RESEARCHER');
      expect(content!.modelNames.length).toBeGreaterThan(0);
    });
  });

  describe('REVIEWER profile', () => {
    it('is a valid profile name', () => {
      expect(isValidProfile('REVIEWER')).toBe(true);
    });

    it('has correct mental models', () => {
      const profile = getProfile('REVIEWER');
      expect(profile).not.toBeNull();
      expect(profile!.mentalModels).toEqual(['steelmanning', 'assumption-surfacing', 'pre-mortem']);
    });

    it('generates prompt content', () => {
      const content = getProfilePromptContent('REVIEWER');
      expect(content).not.toBeNull();
      expect(content!.prompt).toContain('REVIEWER');
      expect(content!.modelNames.length).toBeGreaterThan(0);
    });
  });

  describe('listProfiles includes new profiles', () => {
    it('returns 6 profiles total', () => {
      const profiles = listProfiles();
      expect(profiles.length).toBe(6);
      const names = profiles.map(p => p.name);
      expect(names).toContain('RESEARCHER');
      expect(names).toContain('REVIEWER');
    });
  });
});
