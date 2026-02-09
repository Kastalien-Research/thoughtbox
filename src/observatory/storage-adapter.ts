/**
 * Storage Adapter - translates persistence types to Observatory types
 *
 * The persistence layer uses Date objects and has no `id` field on ThoughtData.
 * The Observatory uses ISO strings, requires `id` on Thought, and needs `status`.
 * These two pure functions bridge that gap.
 */

import type { Session as PersistenceSession, ThoughtData } from "../persistence/types.js";
import type { Session as ObsSession, Thought, Branch } from "./schemas/thought.js";

/**
 * Convert a persistence Session to an Observatory Session.
 *
 * Any session retrieved from disk (not in the active in-memory set)
 * is considered "completed".
 */
export function toObservatorySession(ps: PersistenceSession): ObsSession {
  return {
    id: ps.id,
    title: ps.title || undefined,
    tags: ps.tags ?? [],
    createdAt: ps.createdAt instanceof Date ? ps.createdAt.toISOString() : String(ps.createdAt),
    completedAt: ps.updatedAt instanceof Date ? ps.updatedAt.toISOString() : String(ps.updatedAt),
    status: "completed",
  };
}

/**
 * Convert a persistence ThoughtData to an Observatory Thought.
 *
 * Synthesizes `id` as `"${sessionId}:${td.thoughtNumber}"` since
 * ThoughtData has no standalone id field.
 */
export function toObservatoryThought(sessionId: string, td: ThoughtData): Thought {
  const idPrefix = td.branchId ? `${sessionId}:${td.branchId}` : sessionId;
  return {
    id: `${idPrefix}:${td.thoughtNumber}`,
    thoughtNumber: td.thoughtNumber,
    totalThoughts: td.totalThoughts,
    thought: td.thought,
    nextThoughtNeeded: td.nextThoughtNeeded,
    timestamp: td.timestamp,
    isRevision: td.isRevision,
    revisesThought: td.revisesThought,
    branchId: td.branchId,
    branchFromThought: td.branchFromThought,
  };
}

/**
 * Build Observatory Branches from persistence branch data.
 */
export function toObservatoryBranches(
  sessionId: string,
  branchIds: string[],
  branchThoughtsMap: Map<string, ThoughtData[]>
): Record<string, Branch> {
  const branches: Record<string, Branch> = {};

  for (const branchId of branchIds) {
    const thoughts = branchThoughtsMap.get(branchId) || [];
    const firstThought = thoughts[0];

    branches[branchId] = {
      id: branchId,
      fromThoughtNumber: firstThought?.branchFromThought ?? 0,
      thoughts: thoughts.map((td) => toObservatoryThought(sessionId, td)),
    };
  }

  return branches;
}
