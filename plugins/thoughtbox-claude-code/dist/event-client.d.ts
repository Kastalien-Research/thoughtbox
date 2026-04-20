/**
 * Thoughtbox Event SSE Client
 *
 * Connects to the Thoughtbox /events SSE endpoint and emits
 * parsed ThoughtboxEvent objects. Reconnects with exponential backoff.
 */
import type { ThoughtboxEvent } from "./event-types.js";
export interface EventClientConfig {
    baseUrl: string;
    apiKey: string;
    sessionId?: string;
    onEvent: (event: ThoughtboxEvent) => void;
    onError?: (error: Error) => void;
    onConnect?: () => void;
}
export declare class EventClient {
    private config;
    private controller;
    private backoffMs;
    private closed;
    constructor(config: EventClientConfig);
    connect(): Promise<void>;
    close(): void;
    setSessionId(sessionId: string): void;
    private doConnect;
}
