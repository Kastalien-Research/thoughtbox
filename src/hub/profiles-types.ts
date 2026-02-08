/**
 * Agent Profile Type Definitions — SPEC-HUB-002
 *
 * Defines profile names and definitions that bind mental models
 * to agent identities for behavioral specialization.
 */

// =============================================================================
// Profile Names
// =============================================================================

export type ProfileName = 'MANAGER' | 'ARCHITECT' | 'DEBUGGER' | 'SECURITY' | 'RESEARCHER' | 'REVIEWER';

// =============================================================================
// Profile Definition
// =============================================================================

export interface ProfileDefinition {
  name: ProfileName;
  description: string;
  mentalModels: string[];
  primaryGoal: string;
}
