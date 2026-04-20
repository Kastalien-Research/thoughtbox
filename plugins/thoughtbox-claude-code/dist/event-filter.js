/**
 * Filters events for the current Thoughtbox session.
 * Events not tied to this session are dropped.
 */
export class EventFilter {
    config;
    constructor(config) {
        this.config = config;
    }
    shouldForward(event) {
        if (!this.config.sessionId)
            return true;
        return event.sessionId === this.config.sessionId;
    }
    setSessionId(sessionId) {
        this.config.sessionId = sessionId;
    }
}
