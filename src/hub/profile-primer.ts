/**
 * Profile Primer — SPEC-HUB-002
 *
 * Generates resource content blocks that inject profile-specific mental model
 * content into thought responses. Follows the patterns cookbook pattern from
 * thought-handler.ts (resource blocks with audience: ["assistant"]).
 */

import { getProfilePromptContent } from './profiles-registry.js';

export interface ProfileResourceBlock {
  type: 'resource';
  resource: {
    uri: string;
    title: string;
    mimeType: string;
    text: string;
    annotations: {
      audience: string[];
      priority: number;
    };
  };
}

/**
 * Get a profile priming resource block for the given profile name.
 * Returns null if profile is undefined, empty, or not found in the registry.
 */
export function getProfilePriming(profile: string | undefined): ProfileResourceBlock | null {
  if (!profile) return null;

  const content = getProfilePromptContent(profile);
  if (!content) return null;

  return {
    type: 'resource',
    resource: {
      uri: `thoughtbox://profile-priming/${profile}`,
      title: `Agent Profile: ${profile}`,
      mimeType: 'text/markdown',
      text: content.prompt,
      annotations: {
        audience: ['assistant'],
        priority: 0.8,
      },
    },
  };
}
