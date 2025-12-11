/**
 * Observatory Event Payload Schemas
 *
 * Zod schemas for all WebSocket event payloads.
 * These schemas are used for validation on both server and client.
 */

import { z } from "zod";
import { ThoughtSchema, SessionSchema, BranchSchema } from "./thought.js";

/**
 * Session snapshot - full state sent on subscription
 */
export const SessionSnapshotPayloadSchema = z.object({
  session: SessionSchema,
  thoughts: z.array(ThoughtSchema),
  branches: z.record(z.string(), BranchSchema),
});

export type SessionSnapshotPayload = z.infer<typeof SessionSnapshotPayloadSchema>;

/**
 * Thought added event - new thought appended to chain
 */
export const ThoughtAddedPayloadSchema = z.object({
  thought: ThoughtSchema,
  parentId: z.string().nullable(),
});

export type ThoughtAddedPayload = z.infer<typeof ThoughtAddedPayloadSchema>;

/**
 * Thought revised event - thought revision occurred
 */
export const ThoughtRevisedPayloadSchema = z.object({
  thought: ThoughtSchema,
  parentId: z.string().nullable(),
  originalThoughtNumber: z.number().int(),
});

export type ThoughtRevisedPayload = z.infer<typeof ThoughtRevisedPayloadSchema>;

/**
 * Thought branched event - new branch created
 */
export const ThoughtBranchedPayloadSchema = z.object({
  thought: ThoughtSchema,
  parentId: z.string().nullable(),
  branchId: z.string(),
  fromThoughtNumber: z.number().int(),
});

export type ThoughtBranchedPayload = z.infer<typeof ThoughtBranchedPayloadSchema>;

/**
 * Session started event
 */
export const SessionStartedPayloadSchema = z.object({
  session: SessionSchema,
});

export type SessionStartedPayload = z.infer<typeof SessionStartedPayloadSchema>;

/**
 * Session ended event
 */
export const SessionEndedPayloadSchema = z.object({
  sessionId: z.string(),
  finalThoughtCount: z.number().int(),
});

export type SessionEndedPayload = z.infer<typeof SessionEndedPayloadSchema>;

/**
 * Error event
 */
export const ErrorPayloadSchema = z.object({
  code: z.enum([
    "SESSION_NOT_FOUND",
    "INTERNAL_ERROR",
    "INVALID_PAYLOAD",
  ]),
  message: z.string(),
});

export type ErrorPayload = z.infer<typeof ErrorPayloadSchema>;

/**
 * Sessions list event (for observatory channel)
 */
export const SessionsListPayloadSchema = z.object({
  sessions: z.array(SessionSchema),
});

export type SessionsListPayload = z.infer<typeof SessionsListPayloadSchema>;
