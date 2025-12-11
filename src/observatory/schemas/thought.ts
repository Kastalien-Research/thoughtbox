/**
 * Core Observatory Data Types
 *
 * Zod schemas for thoughts, sessions, and branches.
 * These types are used throughout the observatory system.
 */

import { z } from "zod";

/**
 * Thought schema - represents a single reasoning step
 */
export const ThoughtSchema = z.object({
  /** Unique identifier for this thought */
  id: z.string(),

  /** Position in the reasoning chain (1-indexed) */
  thoughtNumber: z.number().int().positive(),

  /** Estimated total thoughts in this session */
  totalThoughts: z.number().int().positive(),

  /** The actual thought content */
  thought: z.string(),

  /** Whether more thoughts are expected */
  nextThoughtNeeded: z.boolean(),

  /** ISO 8601 timestamp */
  timestamp: z.string().datetime(),

  // Optional: Revision metadata
  /** Whether this thought revises a previous one */
  isRevision: z.boolean().optional(),

  /** Which thought number this revises */
  revisesThought: z.number().int().optional(),

  // Optional: Branch metadata
  /** Branch identifier if this thought is on a branch */
  branchId: z.string().optional(),

  /** Which thought number this branch originates from */
  branchFromThought: z.number().int().optional(),
});

export type Thought = z.infer<typeof ThoughtSchema>;

/**
 * Session status enum
 */
export const SessionStatusSchema = z.enum(["active", "completed", "abandoned"]);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

/**
 * Session schema - represents a reasoning session
 */
export const SessionSchema = z.object({
  /** Unique session identifier */
  id: z.string(),

  /** Optional human-readable title */
  title: z.string().optional(),

  /** Categorization tags */
  tags: z.array(z.string()).default([]),

  /** ISO 8601 creation timestamp */
  createdAt: z.string().datetime(),

  /** ISO 8601 completion timestamp (if completed) */
  completedAt: z.string().datetime().optional(),

  /** Current session status */
  status: SessionStatusSchema,
});

export type Session = z.infer<typeof SessionSchema>;

/**
 * Branch schema - represents a reasoning branch
 */
export const BranchSchema = z.object({
  /** Unique branch identifier */
  id: z.string(),

  /** Optional human-readable name */
  name: z.string().optional(),

  /** Which main-chain thought this branch originates from */
  fromThoughtNumber: z.number().int(),

  /** Thoughts on this branch */
  thoughts: z.array(ThoughtSchema),
});

export type Branch = z.infer<typeof BranchSchema>;
