/**
 * Filters events for the current Thoughtbox session.
 * Events not tied to this session are dropped.
 *
 * Session attribution comes from `data.session_id` on server events (see
 * extractSessionId in event-types.ts); protocol events always carry it.
 * An event with NO session attribution cannot match a session filter, so it
 * is dropped — but loudly (one warning), never silently.
 */
export class EventFilter {
    config;
    warnedUnattributed = false;
    constructor(config) {
        this.config = config;
    }
    shouldForward(event) {
        if (!this.config.sessionId)
            return true;
        if (!event.sessionId) {
            if (!this.warnedUnattributed) {
                this.warnedUnattributed = true;
                console.error(`[Channel] Dropping "${event.type}" event: it carries no session attribution (data.session_id) but a session filter is set (THOUGHTBOX_SESSION). Unset the filter to receive workspace-wide events. Further drops will be silent.`);
            }
            return false;
        }
        return event.sessionId === this.config.sessionId;
    }
    setSessionId(sessionId) {
        this.config.sessionId = sessionId;
    }
}
