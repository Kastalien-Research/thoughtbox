/**
 * Attribution Module — Agent attribution on ThoughtData
 *
 * Extends ThoughtData with optional agentId/agentName fields
 * for multi-agent reasoning attribution.
 *
 * ADR-002 Section 1.2: ThoughtData Extension
 */

import type { ThoughtData } from '../persistence/types.js';

/**
 * ThoughtData with optional agent attribution fields.
 * These fields are added when thoughts are created through the hub.
 */
export interface AttributedThought extends ThoughtData {
  agentId?: string;
  agentName?: string;
}

/**
 * Tag a thought with agent attribution.
 * Returns a new object with agentId and agentName added.
 */
export function tagThought(
  thought: ThoughtData,
  agentId: string,
  agentName: string,
): AttributedThought {
  return {
    ...thought,
    agentId,
    agentName,
  };
}
