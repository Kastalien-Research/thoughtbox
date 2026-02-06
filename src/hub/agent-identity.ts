/**
 * Agent Identity Resolution — resolves agent ID from environment variables
 *
 * Two env vars (both optional, ID takes precedence):
 * - THOUGHTBOX_AGENT_ID: explicit UUID
 * - THOUGHTBOX_AGENT_NAME: human-readable name mapped to UUID
 */

import * as crypto from 'node:crypto';
import type { HubStorage } from './hub-types.js';

/**
 * Check if a string is a valid UUID format
 */
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Resolves the agent ID from environment variables.
 *
 * @param storage - Hub storage to look up/register agents
 * @param envId - THOUGHTBOX_AGENT_ID value (explicit UUID)
 * @param envName - THOUGHTBOX_AGENT_NAME value (human-readable name)
 * @returns Agent ID string, or null if neither env var is set (register required)
 */
export async function resolveAgentId(
  storage: HubStorage,
  envId?: string,
  envName?: string
): Promise<string | null> {
  // ID takes precedence
  if (envId) {
    const existing = await storage.getAgent(envId);
    if (!existing) {
      // Auto-register with human-friendly name for UUIDs
      const name = isUUID(envId) ? `agent-${envId.slice(0, 8)}` : envId;
      await storage.saveAgent({
        agentId: envId,
        name,
        role: 'contributor',
        registeredAt: new Date().toISOString(),
      });
    }
    return envId;
  }

  // Name-based lookup
  if (envName) {
    const agents = await storage.getAgents();
    const found = agents.find(a => a.name === envName);
    if (found) return found.agentId;

    // Create new agent with this name
    const agentId = crypto.randomUUID();
    await storage.saveAgent({
      agentId,
      name: envName,
      role: 'contributor',
      registeredAt: new Date().toISOString(),
    });
    return agentId;
  }

  // Neither set — register required
  return null;
}
