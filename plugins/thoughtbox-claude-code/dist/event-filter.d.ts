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
export declare class EventFilter {
    private config;
    private warnedUnattributed;
    constructor(config: EventFilterConfig);
    shouldForward(event: ThoughtboxEvent): boolean;
    setSessionId(sessionId: string): void;
}
