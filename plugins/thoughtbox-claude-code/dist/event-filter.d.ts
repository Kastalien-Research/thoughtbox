/**
 * Filters events for the current Thoughtbox session.
 * Events not tied to this session are dropped.
 */
import type { ThoughtboxEvent } from "./event-types.js";
export interface EventFilterConfig {
    sessionId?: string;
}
export declare class EventFilter {
    private config;
    constructor(config: EventFilterConfig);
    shouldForward(event: ThoughtboxEvent): boolean;
    setSessionId(sessionId: string): void;
}
