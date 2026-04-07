/**
 * Events module exports.
 *
 * Unified ThoughtboxEvent types for SSE stream (types.ts)
 * + SIL-104 trace emitter types (sil104-types.ts)
 */

export {
  ThoughtboxEventEmitter,
  globalEventEmitter,
} from './event-emitter.js';

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
