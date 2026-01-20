/**
 * Sessions Operations
 *
 * Lists active reasoning sessions from thoughtbox storage.
 */

import type { ThoughtboxStorage, Session } from '../../persistence/types.js';

export interface SessionsArgs {
  limit?: number;
  status?: 'active' | 'idle' | 'all';
}

export interface SessionInfo {
  id: string;
  title: string;
  thoughtCount: number;
  branchCount: number;
  createdAt: string;
  lastActivity: string;
  status: 'active' | 'idle';
  tags?: string[];
}

export interface SessionsResult {
  sessions: SessionInfo[];
  total: number;
}

export interface SessionInfoArgs {
  sessionId: string;
}

export interface DetailedSessionInfo extends SessionInfo {
  description?: string;
  metrics?: {
    avgThoughtDuration?: string;
    revisionsCount?: number;
    convergenceScore?: number;
  };
}

// Consider a session "active" if it was accessed within the last 30 minutes
const ACTIVE_THRESHOLD_MS = 30 * 60 * 1000;

export async function listSessions(
  args: SessionsArgs,
  storage: ThoughtboxStorage
): Promise<SessionsResult> {
  const limit = args.limit ?? 50;
  const statusFilter = args.status ?? 'all';

  const sessions = await storage.listSessions({
    limit: statusFilter === 'all' ? limit : undefined, // Get all for filtering
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  const now = Date.now();
  const mappedSessions: SessionInfo[] = sessions.map((session) => {
    const lastActivity = session.lastAccessedAt ?? session.updatedAt;
    const isActive = now - lastActivity.getTime() < ACTIVE_THRESHOLD_MS;

    return {
      id: session.id,
      title: session.title,
      thoughtCount: session.thoughtCount,
      branchCount: session.branchCount,
      createdAt: session.createdAt.toISOString(),
      lastActivity: lastActivity.toISOString(),
      status: isActive ? 'active' : 'idle',
      tags: session.tags?.length ? session.tags : undefined,
    };
  });

  // Filter by status if requested
  let filtered = mappedSessions;
  if (statusFilter !== 'all') {
    filtered = mappedSessions.filter((s) => s.status === statusFilter);
  }

  // Apply limit
  const limited = filtered.slice(0, limit);

  return {
    sessions: limited,
    total: filtered.length,
  };
}

export async function getSessionInfo(
  args: SessionInfoArgs,
  storage: ThoughtboxStorage
): Promise<DetailedSessionInfo> {
  if (!args.sessionId) {
    throw new Error('Missing required argument: sessionId');
  }

  const session = await storage.getSession(args.sessionId);
  if (!session) {
    throw new Error(`Session not found: ${args.sessionId}`);
  }

  const now = Date.now();
  const lastActivity = session.lastAccessedAt ?? session.updatedAt;
  const isActive = now - lastActivity.getTime() < ACTIVE_THRESHOLD_MS;

  // Get thoughts to calculate additional metrics
  let revisionsCount = 0;
  try {
    const thoughts = await storage.getThoughts(args.sessionId);
    revisionsCount = thoughts.filter((t) => t.isRevision).length;
  } catch {
    // Ignore errors - metrics are optional
  }

  return {
    id: session.id,
    title: session.title,
    description: session.description,
    thoughtCount: session.thoughtCount,
    branchCount: session.branchCount,
    createdAt: session.createdAt.toISOString(),
    lastActivity: lastActivity.toISOString(),
    status: isActive ? 'active' : 'idle',
    tags: session.tags?.length ? session.tags : undefined,
    metrics: {
      revisionsCount,
    },
  };
}
