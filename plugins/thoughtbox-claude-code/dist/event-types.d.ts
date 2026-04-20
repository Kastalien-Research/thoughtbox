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
