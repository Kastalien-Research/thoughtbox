/**
 * Filters events for the current Thoughtbox session.
 * Events not tied to this session are dropped.
 *
 * Session attribution comes from `data.session_id` on server events (see
 * extractSessionId in event-types.ts); protocol events always carry it.
 * An event with NO session attribution cannot match a session filter, so it
 * is dropped — but loudly (one warning), never silently.
 */

import type { ThoughtboxEvent } from "./event-types.js";

export interface EventFilterConfig {
  sessionId?: string;
}

export class EventFilter {
  private config: EventFilterConfig;
  private warnedUnattributed = false;

  constructor(config: EventFilterConfig) {
    this.config = config;
  }

  shouldForward(event: ThoughtboxEvent): boolean {
    if (!this.config.sessionId) return true;
    if (!event.sessionId) {
      if (!this.warnedUnattributed) {
        this.warnedUnattributed = true;
        console.error(
          `[Channel] Dropping "${event.type}" event: it carries no session attribution (data.session_id) but a session filter is set (THOUGHTBOX_SESSION). Unset the filter to receive workspace-wide events. Further drops will be silent.`,
        );
      }
      return false;
    }
    return event.sessionId === this.config.sessionId;
  }

  setSessionId(sessionId: string): void {
    this.config.sessionId = sessionId;
  }
}
