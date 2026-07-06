/**
 * Events module exports.
 *
 * Unified ThoughtboxEvent types for SSE stream (types.ts)
 * + in-memory ThoughtEmitter and reasoning event payload types
 *   (thought-emitter.ts) consumed by the evaluation tracing system.
 */

export {
  ThoughtEmitter,
  thoughtEmitter,
} from './thought-emitter.js';

export type {
  ThoughtEmitterEvents,
  ThoughtEmitterEventName,
  AgentRole,
  Thought,
  Session,
  SessionStatus,
} from './thought-emitter.js';

export type {
  ThoughtboxEvent,
  HubEventType,
  ProtocolEventType,
  OnThoughtboxEvent,
} from './types.js';
