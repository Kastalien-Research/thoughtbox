/**
 * Hub Event Filter
 *
 * Filters Hub events for a specific agent/workspace.
 * Suppresses echo (agent's own messages) and workspace mismatches.
 */

import type { HubEvent } from "../hub/hub-handler.js";

export interface EventFilterConfig {
  agentName: string;
  agentId?: string;
  workspaceId: string;
}

export class EventFilter {
  private config: EventFilterConfig;

  constructor(config: EventFilterConfig) {
    this.config = config;
  }

  /**
   * Returns true if the event should be forwarded to this agent's Channel.
   */
  shouldForward(event: HubEvent): boolean {
    // Filter by workspace
    if (event.workspaceId !== this.config.workspaceId) {
      return false;
    }

    // Suppress echo: don't forward this agent's own messages
    if (event.type === "message_posted") {
      const eventAgentId = event.data.agentId as string | undefined;
      if (eventAgentId && eventAgentId === this.config.agentId) {
        return false;
      }
    }

    return true;
  }

  /**
   * Update the agent ID (resolved after registration).
   */
  setAgentId(agentId: string): void {
    this.config.agentId = agentId;
  }
}
