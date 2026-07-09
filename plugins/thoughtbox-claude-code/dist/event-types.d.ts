/**
 * Thoughtbox event types consumed by the Claude Code channel transport.
 * Must stay in sync with the server-side event emitter.
 */
export type ProtocolEventType = 'theseus_init' | 'theseus_visa' | 'theseus_checkpoint' | 'theseus_outcome' | 'theseus_complete' | 'ulysses_init' | 'ulysses_outcome' | 'ulysses_reflect' | 'ulysses_complete';
export interface ThoughtboxEvent {
    source: 'protocol';
    type: ProtocolEventType;
    sessionId: string;
    timestamp: string;
    data: Record<string, unknown>;
}
/**
 * Raw event shape on the wire — both the local /events SSE stream and the
 * hosted GET /protocol/events pull endpoint. Server events are
 * workspace-scoped: they carry a top-level `workspaceId` (never a top-level
 * `sessionId`), and the Thoughtbox session id travels inside
 * `data.session_id` (the protocol handler prepends it to every event's
 * data). Transports normalize this into ThoughtboxEvent via
 * {@link extractSessionId} so EventFilter and the channel formatters can
 * key on sessionId.
 */
export interface WireThoughtboxEvent {
    source: ThoughtboxEvent['source'];
    type: ThoughtboxEvent['type'];
    sessionId?: string;
    workspaceId?: string;
    timestamp: string;
    data?: Record<string, unknown>;
}
/** Derive the session id from a wire event; '' when unattributed. */
export declare function extractSessionId(raw: {
    sessionId?: unknown;
    data?: Record<string, unknown>;
}): string;
