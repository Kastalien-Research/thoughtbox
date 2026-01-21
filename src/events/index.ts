/**
 * @fileoverview Events module exports for SIL-104 Event Stream
 * @module src/events
 */

export {
  ThoughtboxEventEmitter,
  globalEventEmitter,
} from './event-emitter.js';

export type {
  ThoughtboxEventType,
  BaseEvent,
  SessionCreatedEvent,
  ThoughtAddedEvent,
  BranchCreatedEvent,
  SessionCompletedEvent,
  ExportRequestedEvent,
  ThoughtboxEvent,
  EventStreamConfig,
} from './types.js';

export { DEFAULT_EVENT_STREAM_CONFIG } from './types.js';
