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

  // AUDIT-001: Structured thought type (optional in observatory for historical data)
  /** Structured thought type */
  thoughtType: z.enum(['reasoning', 'decision_frame', 'action_report', 'belief_snapshot', 'assumption_update', 'context_snapshot', 'progress', 'action_receipt']).optional(),
  /** Confidence level for decision_frame */
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  /** Options for decision_frame */
  options: z.array(z.object({ label: z.string(), selected: z.boolean(), reason: z.string().optional() })).optional(),
  /** Action result for action_report */
  actionResult: z.object({ success: z.boolean(), reversible: z.enum(['yes', 'no', 'partial']), tool: z.string(), target: z.string(), sideEffects: z.array(z.string()).optional() }).optional(),
  /** Beliefs for belief_snapshot */
  beliefs: z.object({ entities: z.array(z.object({ name: z.string(), state: z.string() })), constraints: z.array(z.string()).optional(), risks: z.array(z.string()).optional() }).optional(),
  /** Assumption change for assumption_update */
  assumptionChange: z.object({ text: z.string(), oldStatus: z.string(), newStatus: z.enum(['believed', 'uncertain', 'refuted']), trigger: z.string().optional(), downstream: z.array(z.number()).optional() }).optional(),
  /** Context data for context_snapshot */
  contextData: z.object({ toolsAvailable: z.array(z.string()).optional(), systemPromptHash: z.string().optional(), modelId: z.string().optional(), constraints: z.array(z.string()).optional(), dataSourcesAccessed: z.array(z.string()).optional() }).optional(),
  /** Progress data for progress thoughts */
  progressData: z.object({ task: z.string(), status: z.enum(['pending', 'in_progress', 'done', 'blocked']), note: z.string().optional() }).optional(),
  /** Receipt data for action_receipt thoughts */
  receiptData: z.object({ toolName: z.string(), expected: z.string(), actual: z.string(), match: z.boolean(), residual: z.string().optional(), durationMs: z.number().optional() }).optional(),
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
