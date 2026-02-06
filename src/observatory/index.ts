/**
 * Observatory Module
 *
 * Real-time observability for reasoning processes.
 *
 * This module provides:
 * 1. ThoughtEmitter - Fire-and-forget event emission
 * 2. WebSocketServer - Channel-based WebSocket server
 * 3. Configuration - Environment-based config loading
 * 4. Type schemas - Zod schemas for all data types
 *
 * The Observatory enables external observation of reasoning processes
 * without affecting the reasoning itself. Events are emitted synchronously
 * and any listener failures are isolated from the main process.
 *
 * Quick Start:
 * ```ts
 * import {
 *   createObservatoryServer,
 *   loadObservatoryConfig,
 *   thoughtEmitter
 * } from './observatory';
 *
 * // Start server (if enabled)
 * const config = loadObservatoryConfig();
 * if (config.enabled) {
 *   const observatory = createObservatoryServer(config);
 *   await observatory.start();
 * }
 *
 * // Emit events from thoughtbox tool
 * if (thoughtEmitter.hasListeners()) {
 *   thoughtEmitter.emitThoughtAdded({
 *     sessionId,
 *     thought,
 *     parentId: previousThought?.id ?? null
 *   });
 * }
 * ```
 */

// Core emitter
export {
  ThoughtEmitter,
  thoughtEmitter,
  type ThoughtEmitterEvents,
  type ThoughtEmitterEventName,
  type ImprovementEvent,
  type ImprovementEventType,
} from "./emitter.js";

// Improvement tracking (SIL)
export {
  ImprovementTracker,
  improvementTracker,
} from "./improvement-tracker.js";

// Improvement persistence
export {
  ImprovementEventStore,
  defaultImprovementStore,
  type ImprovementEventFilter,
  type ImprovementSummary,
  type ImprovementStoreConfig,
} from "./improvement-store.js";

// Evaluation gatekeeper
export {
  EvaluationGatekeeper,
  defaultGatekeeper,
  createMockEvaluator,
  createMockContracts,
  type GateResult,
  type GatekeeperConfig,
  type TierResult,
  type TieredEvaluationResult,
  type CodeModification,
  type BehavioralContractType,
  type BehavioralContractResult,
  type BehavioralVerificationReport,
} from "./evaluation-gatekeeper.js";

// Scorecard aggregator
export {
  ScorecardAggregator,
  createDefaultScorecardAggregator,
  type Scorecard,
  type ScorecardMetrics,
  type ScorecardOptions,
  type IterationSummary,
  type EvaluationPassRates,
  type TrendDirection,
} from "./scorecard-aggregator.js";

// Configuration
export {
  ObservatoryConfigSchema,
  type ObservatoryConfig,
  loadObservatoryConfig,
} from "./config.js";

// WebSocket infrastructure
export { WebSocketServer } from "./ws-server.js";
export { Channel, type TopicParams, type ChannelContext } from "./channel.js";

// Server factory
export { createObservatoryServer, type ObservatoryServer } from "./server.js";

// Channel implementations
export { createReasoningChannel, sessionStore } from "./channels/reasoning.js";
export { createObservatoryChannel } from "./channels/observatory.js";

// Schemas - Core types
export {
  ThoughtSchema,
  SessionSchema,
  BranchSchema,
  SessionStatusSchema,
  type Thought,
  type Session,
  type Branch,
  type SessionStatus,
} from "./schemas/thought.js";

// Schemas - Event payloads
export {
  SessionSnapshotPayloadSchema,
  ThoughtAddedPayloadSchema,
  ThoughtRevisedPayloadSchema,
  ThoughtBranchedPayloadSchema,
  SessionStartedPayloadSchema,
  SessionEndedPayloadSchema,
  ErrorPayloadSchema,
  SessionsListPayloadSchema,
  type SessionSnapshotPayload,
  type ThoughtAddedPayload,
  type ThoughtRevisedPayload,
  type ThoughtBranchedPayload,
  type SessionStartedPayload,
  type SessionEndedPayload,
  type ErrorPayload,
  type SessionsListPayload,
} from "./schemas/events.js";
