/**
 * Thoughtbox event types consumed by the Claude Code channel transport.
 * Must stay in sync with the server-side event emitter.
 */
/** Derive the session id from a wire event; '' when unattributed. */
export function extractSessionId(raw) {
    if (typeof raw.sessionId === 'string' && raw.sessionId.length > 0) {
        return raw.sessionId;
    }
    const fromData = raw.data?.['session_id'];
    return typeof fromData === 'string' ? fromData : '';
}
