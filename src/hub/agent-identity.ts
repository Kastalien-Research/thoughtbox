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
      // Auto-register
      await storage.saveAgent({
        agentId: envId,
        name: envId,
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
