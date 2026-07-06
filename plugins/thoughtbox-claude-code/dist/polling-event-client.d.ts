/**
 * Thoughtbox Event Polling Client (SPEC-REASONING-CHANNEL-HOSTED c4).
 *
 * Hosted (multi-tenant) Cloud Run cannot serve the in-process /events SSE
 * stream across replicas, so against a hosted server the channel pulls the
 * tenant-scoped protocol event log via `GET /protocol/events?changed_since=`.
 * Same config surface as EventClient so the channel selects a transport
 * without other code changes.
 *
 * On connect the client primes its cursor to the current tail without
 * emitting, so a fresh channel reacts to NEW protocol events rather than
 * replaying completed sessions.
 */
import type { ThoughtboxEvent } from "./event-types.js";
export interface PollingEventClientConfig {
    baseUrl: string;
    apiKey: string;
    sessionId?: string;
    onEvent: (event: ThoughtboxEvent) => void;
    onError?: (error: Error) => void;
    onConnect?: () => void;
    pollIntervalMs?: number;
}
export declare class PollingEventClient {
    private config;
    private cursor;
    private closed;
    private timer;
    private backoffMs;
    constructor(config: PollingEventClientConfig);
    connect(): Promise<void>;
    close(): void;
    setSessionId(sessionId: string): void;
    private scheduleNext;
    private poll;
    private emit;
    private fetchPage;
    private reportError;
}
