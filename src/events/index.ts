/**
 * Events module exports.
 *
 * Unified ThoughtboxEvent types for SSE stream (types.ts)
 * + SIL-104 trace emitter types (sil104-types.ts)
 * + in-memory ThoughtEmitter and reasoning schemas (thought-emitter.ts,
 *   thought-schemas.ts) consumed by the evaluation tracing system.
 */

export { ThoughtboxEventEmitter } from './event-emitter.js';

export {
  ThoughtEmitter,
  thoughtEmitter,
} from './thought-emitter.js';

export type {
  ThoughtEmitterEvents,
  ThoughtEmitterEventName,
  AgentRole,
} from './thought-emitter.js';

export {
  ThoughtSchema,
  SessionSchema,
  BranchSchema,
  SessionStatusSchema,
} from './thought-schemas.js';

export type {
  Thought,
  Session,
  Branch,
  SessionStatus,
} from './thought-schemas.js';

export type {
  ThoughtboxEvent,
  HubEventType,
  ProtocolEventType,
  OnThoughtboxEvent,
} from './types.js';

export type {
  Sil104EventType,
  Sil104Event,
  SessionCreatedEvent,
  ThoughtAddedEvent,
  BranchCreatedEvent,
  SessionCompletedEvent,
  ExportRequestedEvent,
  EventStreamConfig,
} from './sil104-types.js';

export { DEFAULT_EVENT_STREAM_CONFIG } from './sil104-types.js';
