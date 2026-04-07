/**
 * Filters events for a specific agent/workspace.
 * Suppresses echo (agent's own messages) and workspace mismatches.
 */

import type { ThoughtboxEvent } from "./event-types.js";

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

  shouldForward(event: ThoughtboxEvent): boolean {
    if (event.workspaceId !== this.config.workspaceId) {
      return false;
    }

    if (event.type === "message_posted") {
      const eventAgentId = event.data.agentId as string | undefined;
      if (eventAgentId && eventAgentId === this.config.agentId) {
        return false;
      }
    }

    return true;
  }

  setAgentId(agentId: string): void {
    this.config.agentId = agentId;
  }
}
