/**
 * Profiles Registry — SPEC-HUB-002
 *
 * Static registry of agent profiles. Each profile binds a set of mental models
 * to an agent identity for behavioral specialization.
 */

import type { ProfileName, ProfileDefinition } from './profiles-types.js';
import { getModel } from '../mental-models/operations.js';

// =============================================================================
// Profile Definitions (authoritative)
// =============================================================================

const PROFILES: ProfileDefinition[] = [
  {
    name: 'COORDINATOR',
    description: 'Delegation and team coordination specialist',
    mentalModels: ['decomposition', 'pre-mortem', 'five-whys'],
    primaryGoal: 'Delegation and team coordination',
  },
  {
    name: 'ARCHITECT',
    description: 'Structural design specialist',
    mentalModels: ['decomposition', 'trade-off-matrix', 'abstraction-laddering'],
    primaryGoal: 'Structural design',
  },
  {
    name: 'DEBUGGER',
    description: 'Root cause analysis specialist',
    mentalModels: ['five-whys', 'rubber-duck', 'assumption-surfacing'],
    primaryGoal: 'Root cause analysis',
  },
  {
    name: 'SECURITY',
    description: 'Risk and vulnerability detection specialist',
    mentalModels: ['adversarial-thinking', 'pre-mortem'],
    primaryGoal: 'Risk and vulnerability detection',
  },
];

const PROFILE_MAP = new Map<string, ProfileDefinition>(
  PROFILES.map(p => [p.name, p])
);

// =============================================================================
// Public API
// =============================================================================

/**
 * Get a profile definition by name.
 * Returns null if the profile doesn't exist.
 */
export function getProfile(name: string): ProfileDefinition | null {
  return PROFILE_MAP.get(name) ?? null;
}

/**
 * Check if a profile name is valid (exists in the registry).
 */
export function isValidProfile(name: string): name is ProfileName {
  return PROFILE_MAP.has(name);
}

/**
 * List all available profile definitions.
 */
export function listProfiles(): ProfileDefinition[] {
  return [...PROFILES];
}

/**
 * Get the full prompt content for a profile, including all mental model contents.
 * Returns null if the profile doesn't exist.
 */
export function getProfilePromptContent(name: string): {
  prompt: string;
  modelNames: string[];
} | null {
  const profile = getProfile(name);
  if (!profile) return null;

  const modelContents: string[] = [];
  const modelNames: string[] = [];

  for (const modelName of profile.mentalModels) {
    const model = getModel(modelName);
    if (model) {
      modelNames.push(model.name);
      modelContents.push(`## ${model.title}\n\n${model.content}`);
    }
  }

  const prompt = `# Agent Profile: ${profile.name}

**Role**: ${profile.description}
**Primary Goal**: ${profile.primaryGoal}

## Assigned Mental Models

${modelContents.join('\n\n---\n\n')}`;

  return { prompt, modelNames };
}
